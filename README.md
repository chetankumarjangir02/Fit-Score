<div align="center">

# FitScore

**Know your fit, before you apply.**

Drop in a resume, paste a job description, get an honest read on whether you clear the bar.

[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi)](Backend)
[![React](https://img.shields.io/badge/frontend-React_18-61DAFB?style=flat-square&logo=react)](frontend)
[![Vite](https://img.shields.io/badge/bundler-Vite_5-646CFF?style=flat-square&logo=vite)](frontend)
[![Llama](https://img.shields.io/badge/model-Llama_3.1_8B-8C4AEF?style=flat-square)](Backend)

</div>

---

## What it does

Most resume advice is generic. FitScore compares your actual resume against an actual job
description and returns a structured verdict:

| Output | What it tells you |
| :-- | :-- |
| **Match score** | A 0–100 read on overall fit, with a plain-language verdict |
| **Matched skills** | What the role asks for that your resume proves |
| **Skill gaps** | What the role asks for that your resume is missing |
| **Strengths** | Your strongest points for *this* role specifically |
| **Fixes** | Concrete edits, not platitudes |
| **ATS keywords** | Terms from the job description to mirror so trackers match you |

The model is instructed to use only facts present in your resume and to never invent
experience. Everything runs through a Hugging Face inference endpoint — no data is stored.

---

## Stack

**Backend** — FastAPI, LangChain, `langchain-huggingface`, Pydantic, pypdf
**Frontend** — React 18, Vite 5, hand-written CSS. No UI framework, no component library.
**Model** — Meta Llama 3.1 8B Instruct (swappable via `HF_MODEL`)

---

## Quick start

Two terminals. Backend first.

### 1 · Backend

```bash
cd Backend
python -m venv .venv
```

```powershell
# Windows
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
```

Create your `.env`:

```env
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct
HUGGINGFACEHUB_API_TOKEN=hf_your_token_here
```

> **Llama is gated.** Request access at
> [meta-llama/Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct)
> and wait for approval before your token will work. If you'd rather not wait, point
> `HF_MODEL` at any open text-generation model instead.

```bash
uvicorn main:app --reload
```

API is live at `http://localhost:8000` · docs at `/docs`

### 2 · Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Configuration

### Backend — `Backend/.env`

| Variable | Required | Purpose |
| :-- | :-- | :-- |
| `HUGGINGFACEHUB_API_TOKEN` | yes | Inference API token |
| `HF_MODEL` | no | Model repo id. Defaults to Llama 3.1 8B Instruct |

### Frontend — `frontend/.env` *(optional)*

| Variable | Default | Purpose |
| :-- | :-- | :-- |
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL |

---

## API

### `POST /analyze` → `ResumeAnalysis`

`multipart/form-data`

| Field | Type | Rules |
| :-- | :-- | :-- |
| `resume` | file | PDF only · scanned/image PDFs not supported |
| `job_description` | text | ≥ 50 characters |

```json
{
  "match_score": 74,
  "summary": "Strong backend profile with solid Docker and Kubernetes exposure. The role wants more depth in Terraform and Go, which the resume does not show.",
  "matched_skills": ["Python", "FastAPI", "Docker", "Kubernetes", "PostgreSQL"],
  "missing_skills": ["Terraform", "Go", "Kafka"],
  "strengths": [
    "Production FastAPI services at scale",
    "Infrastructure managed with Terraform and Docker"
  ],
  "improvements": [
    "Lead with the Kubernetes migration result rather than the tooling list",
    "Add Terraform under your Docker experience — it's an explicit requirement"
  ],
  "ats_keywords": ["infrastructure as code", "container orchestration", "CI/CD"]
}
```

**Errors** — `400` non-PDF or too-short job description · `422` unreadable PDF · `502` model call failed

### `GET /health`

```json
{ "status": "healthy" }
```

---

## How it works

```
 resume.pdf ──► pypdf ──► text ─┐
                                ├──► prompt ──► Llama 3.1 8B ──► Pydantic ──► ResumeAnalysis
 job description ──► text ──────┘
```

1. **Extract** — pypdf pulls text out of the PDF. Rejects anything under 100 characters,
   which is how scanned documents get caught.
2. **Truncate** — resume capped at 12,000 characters, job description at 6,000. Keeps you
   inside the context window without losing the relevant half of a long resume.
3. **Prompt** — a system prompt sets the recruiter role and forbids invented experience.
   `PydanticOutputParser` injects the JSON schema, so the model returns structured output.
4. **Validate** — the response parses straight into `ResumeAnalysis`. The score is clamped
   to 0–100 before it leaves the server.

---

## Project structure

```
Resume Analyzer/
├── Backend/
│   ├── main.py            # FastAPI app, prompt, chain, routes
│   ├── requirements.txt
│   └── .env               # your keys — never commit this
└── frontend/
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx        # all UI components
        ├── base.css       # tokens, ambient background, glass primitive
        └── App.css        # component styles
```

---

## Design notes

The interface is built as a printed editorial report rather than a typical dashboard —
paper-toned ground, hairline rules, Instrument Serif display type against Inter for UI.

Some deliberate choices:

- **Light theme only.** No `prefers-color-scheme` inversion. A report should look the same
  on every screen.
- **Print stylesheet included.** `window.print()` → "Save as PDF" produces a clean
  black-on-white document with the input panel stripped out.
- **Glassmorphism via `backdrop-filter`** at 20px with desaturated whites. Falls back to an
  opaque gradient where blur is unsupported.
- **Chips are clickable.** Every skill and keyword copies to clipboard on tap.
- **Mobile-first breakpoints** at 940 / 780 / 600 / 380px plus landscape handling, with
  16px minimum inputs so iOS doesn't zoom on focus.

---

## Troubleshooting

**`AttributeError: form_messaages`** — a typo in the old prompt builder. Should be
`ChatPromptTemplate.from_messages(...)`.

**`401` from the model** — your token is wrong, or Llama access hasn't been approved yet.
Test it directly:

```bash
curl -H "Authorization: Bearer $HUGGINGFACEHUB_API_TOKEN" \
  https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct
```

**`Cannot reach the server`** — backend isn't running on port 8000, or `VITE_API_URL` points
somewhere else. Check `http://localhost:8000/health`.

**`422 No readable text found`** — the PDF is a scan or an image. FitScore reads text PDFs
only; OCR would need to be added.

**Blank page, no error** — the model returns malformed JSON and the parser throws. The
`502` response carries the first 200 characters of the failure, which usually points at a
token limit or a truncated response.