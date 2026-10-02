import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MIN_JD = 50;
const MAX_FILE_MB = 10;

const STAGES = [
  "Parsing your resume",
  "Extracting skills and signals",
  "Comparing against the role",
  "Scoring and writing fixes",
];

/* ---------------------------------------------------------------- icons */

function Icon({ d, size = 24, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  upload: "M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16",
  spark: "M4 19.5V16m0-5.5V4m8 15.5V11m0-4.5V4m8 11.5V11m0-3.5V4M1.5 14h4M9.5 8.5h4M17.5 8.5h4",
  close: "M6 6l12 12M18 6L6 18",
  copy: "M9 9h9a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1v-9a1 1 0 011-1zM5 15V5a1 1 0 011-1h9",
  check: "M4 12.5l5 5L20 6.5",
  alert: "M12 8v5m0 3.5h.01M10.3 3.9L2.6 17.2A2 2 0 004.3 20.2h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  reset: "M3.5 12a8.5 8.5 0 108.5-8.5A8.4 8.4 0 005.6 6.6M3.5 4v4h4",
  print:
    "M6.5 9V3.5h11V9M6.5 17.5h-2A1.5 1.5 0 013 16V11a1.5 1.5 0 011.5-1.5h15A1.5 1.5 0 0121 11v5a1.5 1.5 0 01-1.5 1.5h-2M6.5 14h11v6.5h-11z",
};

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

/* ---------------------------------------------------------------- pieces */

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
          <p className="drop-sub">PDF only · up to {MAX_FILE_MB} MB · stays on your machine</p>
          <span className="drop-cta">
            Browse files
            <Icon d={ICONS.arrow} size={13} />
          </span>
        </>
      )}
    </div>
  );
}

function Gauge({ score, animate }) {
  const shown = useCountUp(score, animate);
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (shown / 100) * circumference;
  const tone = toneFor(score);

  return (
    <div className={`gauge ${tone.key}`} role="img" aria-label={`Match score ${score} out of 100`}>
      <svg viewBox="0 0 128 128">
        {/* quarter ticks, like a measuring dial */}
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

function Section({ index, title, count, children }) {
  return (
    <section className="block">
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Something went wrong.");

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

  function reset() {
    setResult(null);
    setError("");
    setFile(null);
    setCopied(null);
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

      <div className="page">
        <header className="masthead">
          <div>
            <h1 className="wordmark">
              Fit<em>Score</em>
            </h1>
            <p className="lede">
              Know your fit, before you apply. An honest read on where your resume clears the
              bar — what you already have, what the role wants that you are missing, and the
              keywords applicant tracking systems scan for.
            </p>
          </div>

          <div className="masthead-meta">
            <div className="stat">
              <b>0–100</b>
              <span className="label">Match score</span>
            </div>
            <div className="stat">
              <b>~20s</b>
              <span className="label">Analysis</span>
            </div>
            <div className="stat">
              <b>PDF</b>
              <span className="label">Input</span>
            </div>
          </div>
        </header>

        <main className="layout">
          {/* ---------------- input column ---------------- */}
          <section className="panel glass spot" onMouseMove={spotlight}>
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
                    Analyze resume
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

          {/* ---------------- result column ---------------- */}
          <section className="panel glass spot proof" onMouseMove={spotlight} ref={resultRef}>
            {!result && !loading && (
              <div className="empty">
                <div className="empty-rule" />
                <h2>Your report appears here</h2>
                <p>
                  We extract what you have, what the role asks for, and exactly what to change
                  before you hit send.
                </p>
                <div className="steps">
                  <span className="step">upload</span>
                  <span className="step">paste</span>
                  <span className="step">read</span>
                </div>
              </div>
            )}

            {loading && (
              <div className="loading">
                <div className="scan" aria-hidden="true" />
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
                <p className="none" style={{ textAlign: "center" }}>
                  Reading takes 10–30 seconds. Stay on this tab.
                </p>
              </div>
            )}

            {result && (
              <div className="report stagger">
                <div className="verdict">
                  <Gauge score={result.match_score} animate />
                  <div className="verdict-body">
                    <span className={`tag ${tone.key}`}>{tone.label}</span>
                    <p>{result.summary}</p>
                    <Coverage result={result} />
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

                <Section index="06" title="Fix before you apply">
                  <Rows items={result.improvements} tone="bad" />
                </Section>

                <Section index="07" title="ATS keywords to mirror" count={result.ats_keywords?.length}>
                  <Chips items={result.ats_keywords} tone="key" onCopy={copyChip} copied={copied} />
                </Section>

                <div className="actions">
                  <button className="btn ghost" onClick={reset} type="button">
                    <Icon d={ICONS.reset} size={16} />
                    Run another comparison
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

        <footer className="foot">
          <span className="label">Private by design — nothing is stored</span>
          <span className="label">Scores are advisory, not a hiring decision</span>
        </footer>
      </div>

      <div className={`toast${toast ? " show" : ""}`} role="status">
        {toast}
      </div>
    </>
  );
}