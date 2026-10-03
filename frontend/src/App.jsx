import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, ICONS } from "./Icon.jsx";
import { Link } from "./router.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MIN_JD = 50;
const MAX_FILE_MB = 10;

const STAGES = [
  "Parsing your resume",
  "Extracting skills and signals",
  "Comparing against the role",
  "Scoring and writing fixes",
];

/* the shape the placeholder sheet previews — same order as the real report */
const SHEET_SECTIONS = [
  "Skills you already have",
  "Skills to close",
  "Why you stand out",
  "Changes to improve your fit",
  "Fix before you apply",
  "ATS keywords to mirror",
];

/* ---------------------------------------------------------------- helpers */

function useCountUp(target, run) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return undefined;
    const duration = 1150;
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);

  return value;
}

function useSpotlight() {
  return useCallback((e) => {
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - box.left}px`);
    el.style.setProperty("--my", `${e.clientY - box.top}px`);
  }, []);
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function toneFor(score) {
  if (score >= 75) return { key: "good", label: "Strong match" };
  if (score >= 50) return { key: "mid", label: "Partial match" };
  return { key: "low", label: "Weak match" };
}

/** turn a failed response into something the person can act on */
async function readFailure(res) {
  const raw = await res.text().catch(() => "");
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    /* not JSON — the server crashed or a proxy answered */
  }

  const detail = Array.isArray(data.detail)
    ? data.detail.map((d) => d.msg || JSON.stringify(d)).join(" ")
    : data.detail;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (raw && raw.length < 240 && !raw.trimStart().startsWith("<")) return raw;

  if (res.status === 404) return "No /analyze endpoint on the server — is the backend running main.py?";
  if (res.status === 413) return "The server rejected the file as too large.";
  if (res.status === 422) return "The server could not parse the request (422).";
  if (res.status >= 500) return `Server failed (${res.status}) — the traceback is in the backend console.`;

  return `Request failed with status ${res.status}.`;
}

/* ---------------------------------------------------------------- app bar */

function AppBar({ ready }) {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`appbar${lifted ? " lifted" : ""}`}>
      <div className="appbar-in">
        <Link to="/" className="appbar-mark" aria-label="FitScore home">
          Fit<em>Score</em>
        </Link>
        <span className="appbar-sep" aria-hidden="true" />
        <span className="appbar-tag">Analyzer</span>

        {ready && (
          <span className="appbar-pill">
            <Icon d={ICONS.check} size={12} />
            Report ready
          </span>
        )}

        <Link to="/" className="appbar-back">
          <Icon d={ICONS.arrow} size={13} />
          Overview
        </Link>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- dropzone */

function Dropzone({ file, onSelect, onError }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);
  const spotlight = useSpotlight();

  const accept = (candidate) => {
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".pdf")) {
      onError("Only PDF resumes are supported.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (candidate.size > MAX_FILE_MB * 1024 * 1024) {
      onError(`That file is over ${MAX_FILE_MB} MB. Try a smaller PDF.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onSelect(candidate);
  };

  const clear = (e) => {
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    onSelect(null);
  };

  return (
    <div
      className={`drop spot${over ? " over" : ""}${file ? " filled" : ""}`}
      onMouseMove={spotlight}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      role="button"
      tabIndex={0}
      aria-label={file ? `Resume selected: ${file.name}. Click to replace.` : "Upload your resume PDF"}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => accept(e.target.files?.[0])}
      />

      {file ? (
        <div className="file">
          <div className="file-badge">PDF</div>
          <div className="file-meta">
            <strong title={file.name}>{file.name}</strong>
            <span>{formatBytes(file.size)} · ready</span>
          </div>
          <button className="icon-btn" onClick={clear} aria-label="Remove resume">
            <Icon d={ICONS.close} size={15} />
          </button>
        </div>
      ) : (
        <>
          <div className="drop-icon">
            <Icon d={ICONS.upload} size={22} />
          </div>
          <p className="drop-title">Drop your resume here</p>
          <p className="drop-sub">PDF only · up to {MAX_FILE_MB} MB</p>
          <span className="drop-cta">
            Browse files
            <Icon d={ICONS.arrow} size={13} />
          </span>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- gauge */

function Gauge({ score, animate }) {
  const shown = useCountUp(score, animate);
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (shown / 100) * circumference;
  const tone = toneFor(score);

  return (
    <div className={`gauge ${tone.key}`} role="img" aria-label={`Match score ${score} out of 100`}>
      <svg viewBox="0 0 128 128">
        <g className="gauge-ticks">
          {[0, 90, 180, 270].map((deg) => (
            <line
              key={deg}
              x1="64"
              y1="4"
              x2="64"
              y2="9"
              transform={`rotate(${deg} 64 64)`}
            />
          ))}
        </g>
        <circle cx="64" cy="64" r={r} className="gauge-track" />
        <circle
          cx="64"
          cy="64"
          r={r}
          className="gauge-value"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-text">
        <strong>{shown}</strong>
        <span>of 100</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- sections */

function Chips({ items, tone, onCopy, copied }) {
  if (!items?.length) return <p className="none">Nothing detected here.</p>;

  return (
    <ul className="chips stagger">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} style={{ "--i": Math.min(i, 14) }}>
          <button
            type="button"
            className={`chip ${tone}${copied === item ? " copied" : ""}`}
            onClick={() => onCopy(item)}
            title={`Copy "${item}"`}
          >
            <Icon d={copied === item ? ICONS.check : ICONS.copy} size={10} />
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Rows({ items, tone }) {
  if (!items?.length) return <p className="none">Nothing to report.</p>;

  return (
    <ol className={`rows ${tone} stagger`}>
      {items.map((item, i) => (
        <li key={i} style={{ "--i": Math.min(i, 14) }}>
          {item}
        </li>
      ))}
    </ol>
  );
}

const RECOMMENDATION_CATEGORIES = {
  resume_edit: "Resume edit",
  skill_to_develop: "Skill to develop",
  project_to_build: "Project to build",
  experience_to_highlight: "Experience to highlight",
};

function Recommendations({ items }) {
  if (!items?.length) {
    return <p className="none">No additional changes suggested for this role.</p>;
  }

  return (
    <ol className="recommendations stagger">
      {[...items]
        .sort((a, b) => a.priority - b.priority)
        .map((item, i) => (
          <li key={`${item.priority}-${item.action}-${i}`} style={{ "--i": Math.min(i, 14) }}>
            <div className="recommendation-meta">
              <span className="recommendation-priority">Priority {item.priority}</span>
              <span className="recommendation-category">
                {RECOMMENDATION_CATEGORIES[item.category] || item.category}
              </span>
            </div>
            <p className="recommendation-action">{item.action}</p>
            <p className="recommendation-reason">{item.reason}</p>
            <p className="recommendation-requirement">
              <strong>Role requirement</strong>
              {item.job_requirement}
            </p>
          </li>
        ))}
    </ol>
  );
}

function Section({ index, title, count, className = "", children }) {
  return (
    <section className={`block ${className}`.trim()}>
      <div className="sec">
        <span className="sec-index">{index}</span>
        <h3>{title}</h3>
        {count != null && <span className="count">{String(count).padStart(2, "0")}</span>}
      </div>
      {children}
    </section>
  );
}

/** skill coverage: matched vs gaps as one proportional bar */
function Coverage({ result }) {
  const matched = result.matched_skills?.length ?? 0;
  const missing = result.missing_skills?.length ?? 0;
  const total = matched + missing;
  const pct = total ? (matched / total) * 100 : 0;

  return (
    <div className="coverage">
      <div className="coverage-bar">
        <span className="fill good" style={{ width: `${pct}%` }} />
        <span className="fill bad" style={{ width: `${100 - pct}%` }} />
      </div>
      <div className="coverage-key">
        <span className="k good">
          <i />
          {matched} matched
        </span>
        <span className="k bad">
          <i />
          {missing} gaps
        </span>
        <span className="k key">
          <i />
          {result.ats_keywords?.length ?? 0} keywords
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- waiting */

/** the empty state is a proof of the layout, not another pitch */
function Sheet() {
  return (
    <div className="sheet" aria-hidden="true">
      <div className="sheet-head">
        <span className="sheet-dial" />
        <div className="sheet-lines">
          <i className="w80" />
          <i className="w100" />
          <i className="w60" />
        </div>
      </div>

      {SHEET_SECTIONS.map((label) => (
        <div className="sheet-sec" key={label}>
          <span className="sheet-label">{label}</span>
          <div className="sheet-chips">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  );
}

function Elapsed({ run }) {
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!run) {
      setSec(0);
      return undefined;
    }
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [run]);

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return <span className="elapsed">{`${mm}:${ss}`}</span>;
}

function Waiting({ stage, loading }) {
  return (
    <div className="loading">
      <div className="load-head">
        <div className="scan" aria-hidden="true" />
        <span className="load-meta">
          <span className="load-step">
            Step {stage + 1} / {STAGES.length}
          </span>
          <Elapsed run={loading} />
        </span>
      </div>

      <ul className="stage-list">
        {STAGES.map((label, i) => (
          <li key={label} className={i < stage ? "done" : i === stage ? "active" : ""}>
            <span className="stage-ico">
              {i < stage && <Icon d={ICONS.check} size={11} />}
            </span>
            {label}
          </li>
        ))}
      </ul>

      <p className="none load-note">
        Reading takes 10–30 seconds. Stay on this tab — nothing is stored either way.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- app */

export default function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [stage, setStage] = useState(0);
  const [copied, setCopied] = useState(null);
  const [toast, setToast] = useState("");
  const resultRef = useRef(null);
  const spotlight = useSpotlight();

  const jdReady = jd.trim().length >= MIN_JD;
  const canSubmit = Boolean(file) && jdReady && !loading;

  useEffect(() => {
    if (!loading) return undefined;
    setStage(0);
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 4200);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(id);
  }, [toast]);

  function flash(message) {
    setToast(message);
    setCopied(message.replace("Copied ", ""));
  }

  async function copyChip(value) {
    try {
      await navigator.clipboard.writeText(value);
      flash(`Copied ${value}`);
    } catch {
      flash("Copy blocked by browser");
    }
  }

  async function handleAnalyze() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const body = new FormData();
      body.append("resume", file);
      body.append("job_description", jd);

      const res = await fetch(`${API_URL}/analyze`, { method: "POST", body });
      if (!res.ok) throw new Error(await readFailure(res));
      const data = await res.json().catch(() => null);
      if (!data) throw new Error("The server sent a response that wasn't a report.");

      setResult(data);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (e) {
      setError(
        e.message === "Failed to fetch"
          ? "Cannot reach the server. Make sure the backend is running on port 8000."
          : e.message
      );
    } finally {
      setLoading(false);
    }
  }

  const tone = result ? toneFor(result.match_score) : null;

  return (
    <>
      <div className="ambient" aria-hidden="true">
        <div className="wash wash-1" />
        <div className="wash wash-2" />
        <div className="wash wash-3" />
      </div>
      <div className="grain" aria-hidden="true" />

      <AppBar ready={Boolean(result)} />

      <div className="page">
        <div className="ws-head">
          <p className="ws-eyebrow">
            <span className="dot" />
            Resume × job description
          </p>
          <h1 className="ws-title">
            Read your resume against <em>one</em> posting.
          </h1>
        </div>

        <main className="layout">
          {/* ---------------- input rail ---------------- */}
          <section className="panel glass spot rail" onMouseMove={spotlight}>
            <div className="stack">
              <div>
                <div className="sec">
                  <span className="sec-index">01</span>
                  <h3>Your resume</h3>
                </div>
                <Dropzone
                  file={file}
                  onSelect={(f) => {
                    setFile(f);
                    if (f) setError("");
                  }}
                  onError={setError}
                />
              </div>

              <div>
                <div className="sec">
                  <span className="sec-index">02</span>
                  <h3>Target role</h3>
                  <span className="count">{MIN_JD} char min</span>
                </div>
                <div className="ta-shell">
                  <div className="ta-wrap">
                    <textarea
                      rows={9}
                      spellCheck={false}
                      placeholder="Paste the full job description — responsibilities, requirements, nice-to-haves."
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      aria-label="Job description"
                    />
                    <div className="ta-foot">
                      <span className={jdReady ? "ok" : ""}>
                        {jdReady
                          ? "ready to analyze"
                          : `${MIN_JD - jd.trim().length} more characters`}
                      </span>
                      <span>{jd.trim().length} chars</span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn" onClick={handleAnalyze} disabled={!canSubmit}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Analyzing resume
                  </>
                ) : (
                  <>
                    <Icon d={ICONS.spark} size={16} />
                    {result ? "Analyze again" : "Analyze resume"}
                  </>
                )}
              </button>

              {error && (
                <p className="banner" role="alert">
                  <Icon d={ICONS.alert} size={15} />
                  {error}
                </p>
              )}
            </div>
          </section>

          {/* ---------------- report ---------------- */}
          <section className="panel glass spot proof" onMouseMove={spotlight} ref={resultRef}>
            {!result && !loading && (
              <div className="empty">
                <Sheet />
                <p className="empty-note">
                  Add both inputs and the report lands here — score first, then the sections in
                  order. Read it here or print it.
                </p>
              </div>
            )}

            {loading && <Waiting stage={stage} loading={loading} />}

            {result && (
              <div className="report stagger">
                <div className="verdict">
                  <Gauge score={result.match_score} animate />
                  <div className="verdict-body">
                    <span className={`tag ${tone.key}`}>{tone.label}</span>
                    <p>{result.summary}</p>
                    <Coverage result={result} />
                    <p className="report-note">Advisory only — not a hiring decision</p>
                  </div>
                </div>

                <Section index="03" title="Skills you already have" count={result.matched_skills?.length}>
                  <Chips
                    items={result.matched_skills}
                    tone="good"
                    onCopy={copyChip}
                    copied={copied}
                  />
                </Section>

                <Section index="04" title="Skills to close" count={result.missing_skills?.length}>
                  <Chips
                    items={result.missing_skills}
                    tone="bad"
                    onCopy={copyChip}
                    copied={copied}
                  />
                </Section>

                <Section index="05" title="Why you stand out">
                  <Rows items={result.strengths} tone="good" />
                </Section>

                <Section
                  index="06"
                  title="Changes to improve your fit"
                  count={result.recommendations?.length}
                  className="recommendation-section"
                >
                  <Recommendations items={result.recommendations} />
                </Section>

                <Section index="07" title="Fix before you apply">
                  <Rows items={result.improvements} tone="bad" />
                </Section>

                <Section index="08" title="ATS keywords to mirror" count={result.ats_keywords?.length}>
                  <Chips items={result.ats_keywords} tone="key" onCopy={copyChip} copied={copied} />
                </Section>

                <div className="actions">
                  <button
                    className="btn ghost"
                    onClick={handleAnalyze}
                    disabled={!canSubmit}
                    type="button"
                  >
                    <Icon d={ICONS.reset} size={16} />
                    Analyze again
                  </button>
                  <button className="btn ghost" onClick={() => window.print()} type="button">
                    <Icon d={ICONS.print} size={16} />
                    Save as PDF
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <div className={`toast${toast ? " show" : ""}`} role="status">
        {toast}
      </div>
    </>
  );
}