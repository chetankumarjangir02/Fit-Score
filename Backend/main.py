import os
import io
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI,File , Form,HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import ChatHuggingFace,HuggingFaceEndpoint
from pydantic import BaseModel,Field
from pypdf import PdfReader

load_dotenv()


HF_MODEL= os.getenv("HF_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
MAX_RESUME_CHARS=12_000
MAX_JD_CHARS=6_000

class ResumeAnalysis(BaseModel):
    match_score:int =Field(description="Overall fit between resume and job, 0 to 100")
    summary:str =Field(description="Two or three sentence verdict on the fit")
    matched_skills:List[str]=Field(description="Skills in the job description that the resume shows")
    missing_skills:List[str] =Field(description="Skills in the job description that the resume lacks")
    strengths:List[str] =Field(description="Strongest points of the resume for this role")
    improvements:List[str]=Field(description="Specific, actionable edits to improve the resume for this role")
    ats_keywords:List[str]=Field(description="Keywords from the job description to add so applicant tracking systems match it")

parser = PydanticOutputParser(pydantic_object=ResumeAnalysis)

prompt=ChatPromptTemplate.from_messages(
    [
         (
                    "system",
                    "You are an experienced technical recruiter. Compare the resume to the job "
                    "description honestly and concretely. Only use facts present in the resume; "
                    "never invent experience. Reply with JSON only, no extra text.\n\n"
                    "{format_instructions}",
                ),
                (
                    "human",
                    "JOB DESCRIPTION:\n{job_description}\n\nRESUME:\n{resume}",
                ),
    ]
).partial(format_instructions=parser.get_format_instructions())


def build_chain():
    endpoint=HuggingFaceEndpoint(
        repo_id=HF_MODEL,
        task="text-generation",
        max_new_tokens=1200,
        temperature=0.2,
        huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
    )
    llm=ChatHuggingFace(llm=endpoint)

    return prompt | llm | parser

chain=build_chain()

app=FastAPI(title="FitScore", version="1.0.0")

ALLOWED_ORIGINS=[
    "https://fitscore.vercel.app",
    "https://fit-score-ke8y.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Allow any origin in local dev so you can preview on a device IP or a tunnel.
if os.getenv("ALLOW_ANY_ORIGIN","0")=="1":
    ALLOWED_ORIGINS=["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST","GET","OPTIONS"],
    allow_headers=["Content-Type"],
)

def extract_text_from_pdf(data:bytes)->str:
    try:
        reader=PdfReader(io.BytesIO(data))
        text=".\n".join(page.extract_text() for page in reader.pages)
    except Exception:
        raise HTTPException(400,"Could not read this PDF. Try another file.")
    text=text.strip()
    if len(text)<100:
        raise HTTPException(422,"No readable text found. Scanned PDFs are not supported yet.")
    return text

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/analyze",response_model=ResumeAnalysis)
async def analyze(resume:UploadFile=File(...),job_description:str=Form(...)):
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(400,"Upload your resume as PDF")
    if len(job_description.strip())<50:
        raise HTTPException(400,"Paste the full job description (at least a few lines).")

    resume_text=extract_text_from_pdf(await resume.read())[:MAX_RESUME_CHARS]

    try:
        result=await chain.ainvoke(
            {
            "resume":resume_text,
            "job_description":job_description[:MAX_JD_CHARS],
            }
        )
    except Exception as e:
        raise HTTPException(502, f"Analysis failed: {str(e)[:200]}")

    result.match_score=max(0,min(100,result.match_score))
    return result