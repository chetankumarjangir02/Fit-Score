import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Icon, ICONS } from "./Icon.jsx";
import { Link } from "./router.jsx";
import { DrawLine, Item, Reveal, Stagger, fadeUp } from "./motion.jsx";
import "./Landing.css";

const IMG = {
  bloom: "/img/hero-bloom.svg",
  resume: "/img/resume-page.svg",
  posting: "/img/job-posting.svg",
  seal: "/img/privacy-seal.svg",
};

const SAMPLE_SCORE = 74;

const OUTPUTS = [
  {
    icon: ICONS.target,
    title: "Match score",
    body: "A single 0–100 read on the whole comparison, with a plain-language verdict — strong, partial or weak.",
  },
  {
    icon: ICONS.check,
    title: "Matched skills",
    body: "What the role asks for that your resume actually proves. Not a keyword list, evidence.",
  },
  {
    icon: ICONS.alert,
    title: "Skill gaps",
    body: "What the posting wants that you are missing. The list you decide whether to close or ignore.",
  },
  {
    icon: ICONS.quote,
    title: "Strengths",
    body: "Your strongest points for this role specifically, not your strongest points in general.",
  },
  {
    icon: ICONS.wand,
    title: "Concrete fixes",
    body: "Line-level edits. Which bullet to lead with, which tool to name, what to cut entirely.",
  },
  {
    icon: ICONS.list,
    title: "ATS keywords",
    body: "Terms lifted from the posting to mirror, so a tracker parsing your PDF finds what it looks for.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: ICONS.upload,
    title: "Add your resume",
    body: "Drop in a PDF, up to 10 MB. It is read in your browser session and never written to disk.",
  },
  {
    n: "02",
    icon: ICONS.file,
    title: "Paste the posting",
    body: "The full description, including nice-to-haves. Longer is better — the gaps are usually in the fine print.",
  },
  {
    n: "03",
    icon: ICONS.spark,
    title: "Read the verdict",
    body: "Ten to thirty seconds later, a scored report. Copy any term with one tap, or save it as a PDF.",
  },
];

const COMPARISON = [
  { from: "Add metrics to your bullets", to: "Lead with the migration that cut deploys from 40 to 6" },
  { from: "Tailor your resume", to: "Name Terraform under Docker — it is an explicit requirement" },
  { from: "Use the right keywords", to: "Mirror: infrastructure as code, container orchestration, CI/CD" },
  { from: "Show your personality", to: "Cut the summary. Three bullets of outcomes say more" },
];

const FAQ = [
  {
    q: "What kind of resume can I upload?",
    a: "Text-based PDFs, up to 10 MB. Scanned pages and image-only documents are not supported yet — the text has to be selectable for anything to be read. Export from Google Docs, Word or Canva as a PDF and you are fine.",
  },
  {
    q: "Is my resume stored anywhere?",
    a: "No. The file is read, sent to the analysis endpoint, and discarded. FitScore keeps no database, no user records and no copies. Nothing is written to disk by the frontend, and the backend holds no state between requests.",
  },
  {
    q: "What model reads it?",
    a: "Meta Llama 3.1 8B Instruct, run over a hosted inference endpoint. The prompt puts the model in a recruiter's seat and forbids it from inventing experience — every claim in the report has to trace back to something in your PDF.",
  },
  {
    q: "How long does an analysis take?",
    a: "Usually 10 to 30 seconds. A longer resume and a longer posting take longer, because both are truncated before they reach the model. Stay on the tab while it works.",
  },
  {
    q: "Is the score a hiring decision?",
    a: "No. It is a structured second opinion on one document against one posting. Recruiters weigh far more than keyword overlap, and a low score usually means the posting wants experience you have not had yet, not that you should stop applying.",
  },
  {
    q: "Can I compare the same resume against several roles?",
    a: "Yes. Run it as many times as you like against different descriptions — each run starts from a clean sheet and nothing carries over.",
  },
];

/* ---------------------------------------------------------------- nav */

const NAV_LINKS = [
  { href: "#outputs", label: "What you get" },
  { href: "#process", label: "How it works" },
  { href: "#report", label: "Sample report" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "FAQ" },
];

function Nav() {
  const [lifted, setLifted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  const last = useRef(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    setLifted(y > 10);
    setHidden(y > 160 && y > last.current + 4);
    last.current = y;
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        className={`lnav${lifted ? " lifted" : ""}`}
        animate={{ y: hidden && !open ? "-104%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lnav-in">
          <Link to="/" className="lnav-mark" aria-label="FitScore home">
            Fit<em>Score</em>
          </Link>

          <nav className="lnav-links" aria-label="Sections">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="lnav-cta">
            <Link to="/app" className="lbtn small">
              Analyze a resume
              <Icon d={ICONS.arrow} size={14} />
            </Link>
            <button
              type="button"
              className="burger"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon d={open ? ICONS.close : ICONS.plus} size={17} />
            </button>
          </div>
        </div>

        <motion.i className="lnav-progress" style={{ scaleX: progress }} />
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="lmenu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.nav
              aria-label="Sections"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: 0.06 } } }}
            >
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  variants={fadeUp}
                  custom={i}
                  onClick={() => setOpen(false)}
                >
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  {l.label}
                </motion.a>
              ))}
            </motion.nav>
            <Link to="/app" className="lbtn solid block" onNavigate={() => setOpen(false)}>
              Analyze a resume
              <Icon d={ICONS.arrow} size={15} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------------------------------------------------------- hero */

function Hero() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bloomY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 130]);
  const bloomScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.16]);
  const docY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -70]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -160]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 60]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.72], [1, reduced ? 1 : 0]);

  return (
    <section className="hero" ref={ref}>
      <motion.img
        className="hero-bloom"
        src={IMG.bloom}
        alt=""
        aria-hidden="true"
        style={{ y: bloomY, scale: bloomScale }}
      />

      <div className="lpage hero-in">
        <div className="hero-copy" style={{ y: copyY, opacity: copyOpacity }}>
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="dot" />
            Resume × job description · one read
          </motion.p>

          <h1 className="hero-title">
            {["Know your fit,", "before you apply."].map((line, i) => (
              <span className="line" key={line}>
                <motion.span
                  initial={{ opacity: 0, y: "0.5em" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.16 + i * 0.11, ease: [0.22, 1, 0.36, 1] }}
                >
                  {i === 1 ? (
                    <>
                      before you <em>apply.</em>
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="hero-lede"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.44 }}
          >
            Most resume advice is generic. FitScore compares the resume you actually have against
            the role you actually want, and returns a structured verdict — a 0–100 score, the
            skills you prove, the ones you are missing, and the specific edits to make first.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.56 }}
          >
            <Link to="/app" className="lbtn solid">
              Analyze a resume
              <Icon d={ICONS.arrow} size={16} />
            </Link>
            <a href="#outputs" className="lbtn ghost">
              See what you get
            </a>
          </motion.div>

          <motion.dl
            className="hero-facts"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.66 } } }}
          >
            {[
              ["PDF", "Input format"],
              ["~20s", "Per analysis"],
              ["0", "Files stored"],
            ].map(([b, label]) => (
              <motion.div key={label} variants={fadeUp} className="fact">
                <dt>{b}</dt>
                <dd className="label">{label}</dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>

        {/* layered composition: the two inputs behind, the verdict in front */}
        <motion.div className="hero-art" style={{ y: cardY }} aria-hidden="true">
          <motion.div className="hero-doc doc-a" style={{ y: docY }}>
            <div className="doc-tilt">
              <motion.img
                src={IMG.posting}
                alt=""
                animate={reduced ? {} : { y: [0, -9, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <span className="doc-tag mono">job description</span>
          </motion.div>

          <motion.div className="hero-doc doc-b" style={{ y: docY }}>
            <div className="doc-tilt">
              <motion.img
                src={IMG.resume}
                alt=""
                animate={reduced ? {} : { y: [0, 11, 0] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              />
            </div>
            <span className="doc-tag mono">your resume</span>
          </motion.div>

          <motion.div
            className="hero-card glass proof"
            initial={{ opacity: 0, y: 34, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0.6 }}
            transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="verdict">
              <div className="gauge good">
                <svg viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" className="gauge-track" />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="gauge-value"
                    strokeDasharray={2 * Math.PI * 56}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - SAMPLE_SCORE / 100) }}
                    transition={{ duration: 1.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <div className="gauge-text">
                  <strong>{SAMPLE_SCORE}</strong>
                  <span>of 100</span>
                </div>
              </div>
              <div className="verdict-body">
                <span className="tag good">Partial match</span>
                <p>A promising fit. See which requirements your resume already shows and where to strengthen it.</p>
              </div>
            </div>

            <div className="hero-card-foot">
              <span className="label">Signals</span>
              <span className="chip good">Skills</span>
              <span className="chip good">Experience</span>
              <span className="chip bad">Gaps</span>
              <span className="chip key">Keywords</span>
            </div>
          </motion.div>

          <motion.div
            className="hero-float float-a glass"
            initial={{ opacity: 0, x: -18, y: 14 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Icon d={ICONS.check} size={14} />
            <span>ATS keywords mirrored</span>
          </motion.div>

          <motion.div
            className="hero-float float-b glass"
            initial={{ opacity: 0, x: 18, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Icon d={ICONS.shield} size={14} />
            <span>Nothing stored</span>
          </motion.div>
        </motion.div>
      </div>

      <a className="hero-scroll mono" href="#gap" aria-label="Scroll to next section">
        scroll
        <span className="rule" />
      </a>
    </section>
  );
}

/* ---------------------------------------------------------------- the gap */

function Gap() {
  return (
    <section className="lsec gap" id="gap">
      <div className="lpage">
        <Reveal className="sec-head">
          <p className="eyebrow">
            <span className="dot" />
            The problem
          </p>
          <h2 className="sec-title">
            Advice that applies to everyone applies to <em>no one</em>.
          </h2>
          <p className="sec-lede">
            “Add metrics.” “Tailor your resume.” “Use the right keywords.” Correct, and useless —
            it does not tell you which bullet, which tool, or whether you clear the bar at all.
          </p>
          <DrawLine className="head-rule" />
        </Reveal>

        <div className="gap-grid">
          <div className="gap-visual">
            <motion.img
              className="gap-doc gap-doc-a"
              src={IMG.posting}
              alt="A job description with applicant tracking terms highlighted"
              width="620"
              height="800"
              loading="lazy"
              initial={{ opacity: 0, y: 40, rotate: -6 }}
              whileInView={{ opacity: 1, y: 0, rotate: -4 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.img
              className="gap-doc gap-doc-b"
              src={IMG.resume}
              alt="A resume with matched skills highlighted and gaps marked"
              width="620"
              height="800"
              loading="lazy"
              initial={{ opacity: 0, y: 56, rotate: 4 }}
              whileInView={{ opacity: 1, y: 0, rotate: 3 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 1, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="gap-bridge-wrap">
              <Reveal className="gap-bridge glass" delay={0.3}>
                <span className="label">Compared, line by line</span>
                <strong>12 matched · 3 gaps</strong>
              </Reveal>
            </div>
          </div>

          <div className="gap-list">
            <Stagger className="cmp" gap={0.1}>
              {COMPARISON.map((row) => (
                <Item key={row.from} className="cmp-row" variants={fadeUp}>
                  <div className="cmp-from">
                    <Icon d={ICONS.minus} size={13} />
                    <span>{row.from}</span>
                  </div>
                  <div className="cmp-arrow" aria-hidden="true" />
                  <div className="cmp-to">
                    <Icon d={ICONS.check} size={13} />
                    <span>{row.to}</span>
                  </div>
                </Item>
              ))}
            </Stagger>
            <Reveal delay={0.15}>
              <Link to="/app" className="lbtn solid">
                Try it on your resume
                <Icon d={ICONS.arrow} size={15} />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- outputs */

function Outputs() {
  return (
    <section className="lsec outputs" id="outputs">
      <div className="lpage">
        <Reveal className="sec-head">
          <p className="eyebrow">
            <span className="dot" />
            What you get
          </p>
          <h2 className="sec-title">
            Six sections. No filler, no <em>pep talk</em>.
          </h2>
          <p className="sec-lede">
            Every report answers the same six questions in the same order, so two runs are
            comparable and a rerun after you edit your resume means something.
          </p>
          <DrawLine className="head-rule" />
        </Reveal>

        <Stagger className="out-grid" gap={0.07}>
          {OUTPUTS.map((o, i) => (
            <Item key={o.title} className="out-card" variants={fadeUp}>
              <span className="out-n mono">{String(i + 1).padStart(2, "0")}</span>
              <div className="out-ico">
                <Icon d={o.icon} size={19} />
              </div>
              <h3>{o.title}</h3>
              <p>{o.body}</p>
              <span className="out-mark" aria-hidden="true" />
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- process */

function Process() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 72%", "end 62%"] });
  const draw = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.5 });

  return (
    <section className="lsec process" id="process">
      <div className="lpage">
        <Reveal className="sec-head">
          <p className="eyebrow">
            <span className="dot" />
            How it works
          </p>
          <h2 className="sec-title">
            Three steps, about <em>twenty seconds</em>.
          </h2>
          <p className="head-rule-spacer" />
          <DrawLine className="head-rule" />
        </Reveal>

        <div className="steps-grid" ref={ref}>
          <motion.span
            className="steps-line"
            style={{ scaleY: reduced ? 1 : draw }}
            aria-hidden="true"
          />
          <Stagger className="steps-list" gap={0.14}>
            {STEPS.map((s) => (
              <Item key={s.n} className="step-card" variants={fadeUp}>
                <div className="step-head">
                  <span className="step-n mono">{s.n}</span>
                  <span className="step-ico">
                    <Icon d={s.icon} size={17} />
                  </span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </Item>
            ))}
          </Stagger>
        </div>

        <Reveal className="process-note" delay={0.1}>
          <Icon d={ICONS.clock} size={15} />
          <span>
            Longer documents are truncated before they reach the model, so a dense posting is read
            faster than a sprawling one. The four reading stages are shown live while it works.
          </span>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- report */

function Report() {
  return (
    <section className="lsec report-sec" id="report">
      <div className="lpage">
        <Reveal className="sec-head center">
          <p className="eyebrow">
            <span className="dot" />
            A real report
          </p>
          <h2 className="sec-title">
            It arrives as a <em>document</em>, not a dashboard.
          </h2>
          <p className="sec-lede">
            Laid out like a printed proof: score, verdict, coverage, then the sections in order.
            Every chip copies on tap, and “Save as PDF” prints a clean black-on-white copy.
          </p>
          <DrawLine className="head-rule" />
        </Reveal>

        <Reveal className="shot-wrap" y={40} amount={0.15}>
          <div className="shot-bar">
            <span className="mono">fitscore · report</span>
            <span className="shot-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="mono muted">74 / 100</span>
          </div>

          <div className="shot glass">
            <div className="shot-grid">
              <div className="shot-lead">
                <div className="verdict">
                  <div className="gauge mid">
                    <svg viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="56" className="gauge-track" />
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="56"
                        className="gauge-value"
                        strokeDasharray={2 * Math.PI * 56}
                        initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                        whileInView={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - SAMPLE_SCORE / 100) }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 1.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </svg>
                    <div className="gauge-text">
                      <strong>{SAMPLE_SCORE}</strong>
                      <span>of 100</span>
                    </div>
                  </div>
                  <div className="verdict-body">
                    <span className="tag mid">Partial match</span>
                    <p>
                      Strong backend profile with solid Docker and Kubernetes exposure. The role
                      wants more depth in Terraform and Go, which the resume does not show.
                    </p>
                  </div>
                </div>

                <div className="coverage">
                  <div className="coverage-bar">
                    <motion.span
                      className="fill good"
                      initial={{ width: 0 }}
                      whileInView={{ width: "80%" }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.span
                      className="fill bad"
                      initial={{ width: 0 }}
                      whileInView={{ width: "20%" }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div className="coverage-key">
                    <span className="k good">
                      <i />
                      5 matched
                    </span>
                    <span className="k bad">
                      <i />
                      3 gaps
                    </span>
                    <span className="k key">
                      <i />
                      4 keywords
                    </span>
                  </div>
                </div>
              </div>

              <div className="shot-cols">
                <div className="block">
                  <div className="sec">
                    <span className="sec-index">03</span>
                    <h3>Skills you already have</h3>
                    <span className="count">05</span>
                  </div>
                  <ul className="chips">
                    {["Python", "FastAPI", "Docker", "Kubernetes", "PostgreSQL"].map((s) => (
                      <li key={s}>
                        <span className="chip good">
                          <Icon d={ICONS.copy} size={10} />
                          {s}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="block">
                  <div className="sec">
                    <span className="sec-index">04</span>
                    <h3>Skills to close</h3>
                    <span className="count">03</span>
                  </div>
                  <ul className="chips">
                    {["Terraform", "Go", "Kafka"].map((s) => (
                      <li key={s}>
                        <span className="chip bad">
                          <Icon d={ICONS.copy} size={10} />
                          {s}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="block">
                  <div className="sec">
                    <span className="sec-index">05</span>
                    <h3>Why you stand out</h3>
                  </div>
                  <ol className="rows good">
                    <li>Production FastAPI services at scale</li>
                    <li>Infrastructure managed with Terraform and Docker</li>
                  </ol>
                </div>

                <div className="block">
                  <div className="sec">
                    <span className="sec-index">06</span>
                    <h3>Fix before you apply</h3>
                  </div>
                  <ol className="rows bad">
                    <li>Lead with the Kubernetes migration result rather than the tooling list</li>
                    <li>Add Terraform under your Docker experience — it is an explicit requirement</li>
                  </ol>
                </div>

                <div className="block">
                  <div className="sec">
                    <span className="sec-index">07</span>
                    <h3>ATS keywords to mirror</h3>
                    <span className="count">04</span>
                  </div>
                  <ul className="chips">
                    {["infrastructure as code", "container orchestration", "CI/CD"].map((s) => (
                      <li key={s}>
                        <span className="chip key">
                          <Icon d={ICONS.copy} size={10} />
                          {s}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- privacy */

function Privacy() {
  return (
    <section className="privacy" id="privacy">
      <div className="lpage privacy-in">
        <div className="privacy-tile">
          <motion.img
            src={IMG.seal}
            alt="A resume being read and then discarded"
            width="720"
            height="560"
            loading="lazy"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="privacy-copy">
          <Reveal>
            <p className="eyebrow light">
              <span className="dot" />
              Privacy
            </p>
            <h2 className="sec-title light">
              There is no database to leak, because there is <em>no database</em>.
            </h2>
          </Reveal>
          <Stagger className="privacy-list" gap={0.08}>
            {[
              [ICONS.shield, "No accounts, no sign-up", "Nothing to sign up for, because nothing identifies you."],
              [ICONS.bolt, "No persistence", "The file is read, analysed and discarded in the same request."],
              [ICONS.list, "No training on your resume", "Your text is not retained for any purpose beyond the analysis."],
            ].map(([icon, title, body]) => (
              <Item key={title} className="privacy-item" variants={fadeUp}>
                <span className="privacy-ico">
                  <Icon d={icon} size={16} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- faq */

function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="lsec faq" id="faq">
      <div className="lpage faq-in">
        <Reveal className="faq-head">
          <p className="eyebrow">
            <span className="dot" />
            Questions
          </p>
          <h2 className="sec-title">
            The things people ask <em>before</em> uploading.
          </h2>
          <p className="sec-lede">
            Including the limits — FitScore reads text PDFs only, and its score is a second
            opinion, not a verdict.
          </p>
          <DrawLine className="head-rule" />
        </Reveal>

        <div className="faq-list">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={Math.min(i, 5) * 0.045} y={14}>
                <div className={`faq-item${isOpen ? " open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-trigger-${i}`}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                    >
                      <span className="faq-n mono">{String(i + 1).padStart(2, "0")}</span>
                      <span className="faq-q">{item.q}</span>
                      <motion.span className="faq-sign" animate={{ rotate: isOpen ? 135 : 0 }}>
                        <Icon d={ICONS.plus} size={16} />
                      </motion.span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${i}`}
                        role="region"
                        aria-labelledby={`faq-trigger-${i}`}
                        className="faq-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- close */

function Close() {
  return (
    <section className="lsec close">
      <div className="lpage">
        <Reveal className="close-in">
          <p className="eyebrow">
            <span className="dot" />
            Your turn
          </p>
          <h2 className="close-title">
            Find out where you stand <em>before</em> you hit send.
          </h2>
          <p className="close-lede">
            One PDF, one posting, twenty seconds. No account, nothing stored, and a list of edits
            you can make tonight.
          </p>
          <div className="close-actions">
            <Link to="/app" className="lbtn solid lg">
              Analyze a resume
              <Icon d={ICONS.arrow} size={17} />
            </Link>
            <span className="close-note mono">PDF · up to 10 MB · ~20s</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="lfoot">
      <div className="lpage lfoot-in">
        <div className="lfoot-brand">
          <Link to="/" className="lnav-mark" aria-label="FitScore home">
            Fit<em>Score</em>
          </Link>
          <p>Know your fit, before you apply.</p>
        </div>

        <nav className="lfoot-cols" aria-label="Footer">
          <div>
            <span className="label">Overview</span>
            {NAV_LINKS.slice(0, 3).map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div>
            <span className="label">More</span>
            {NAV_LINKS.slice(3).map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
            <Link to="/app">Analyzer</Link>
          </div>
          <div>
            <span className="label">Fine print</span>
            <span className="fine">Scores are advisory, not a hiring decision.</span>
            <span className="fine">Private by design — nothing is stored.</span>
          </div>
        </nav>
      </div>

      <div className="lpage lfoot-base">
        <span className="mono">Resume × Job description · one read</span>
        <span className="mono">Built with FastAPI, React and Llama 3.1</span>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- page */

export default function Landing() {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <div className="wash wash-1" />
        <div className="wash wash-2" />
        <div className="wash wash-3" />
      </div>
      <div className="grain" aria-hidden="true" />

      <Nav />

      <main className="landing">
        <Hero />
        <Gap />
        <Outputs />
        <Process />
        <Report />
        <Privacy />
        <Faq />
        <Close />
      </main>

      <SiteFooter />
    </>
  );
}
