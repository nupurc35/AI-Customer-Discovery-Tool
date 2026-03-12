import json
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

load_dotenv()

MODEL_NAME = "llama-3.3-70b-versatile"


class QuestionRequest(BaseModel):
    description: str = Field(..., min_length=1)


class AnswerItem(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)


class ReportRequest(BaseModel):
    description: str = Field(..., min_length=1)
    answers: list[AnswerItem]


class QuestionsResponse(BaseModel):
    questions: list[str]


def get_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
    return Groq(api_key=api_key)


def extract_json(content: str) -> Any:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1 and start < end:
            try:
                return json.loads(content[start : end + 1])
            except json.JSONDecodeError as exc:
                raise HTTPException(status_code=502, detail="Model returned invalid JSON.") from exc
        raise HTTPException(status_code=502, detail="Model returned invalid JSON.")


app = FastAPI(title="AI Customer Discovery Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/questions", response_model=QuestionsResponse)
async def generate_questions(payload: QuestionRequest) -> QuestionsResponse:
    prompt = f"""
You are an expert customer discovery strategist.
Generate exactly 4 concise, high-signal customer discovery questions for this business idea.

Business description:
{payload.description}

Return valid JSON only in this exact shape:
{{
  "questions": ["Question 1", "Question 2", "Question 3", "Question 4"]
}}
""".strip()

    try:
        client = get_client()
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.7,
            messages=[
                {"role": "system", "content": "Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
        )
        content = completion.choices[0].message.content or ""
        data = extract_json(content)
        questions = data.get("questions")
        if not isinstance(questions, list) or len(questions) != 4 or not all(
            isinstance(question, str) and question.strip() for question in questions
        ):
            raise HTTPException(status_code=502, detail="Model returned an invalid questions payload.")
        return QuestionsResponse(questions=[question.strip() for question in questions])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {exc}") from exc


@app.post("/report")
async def generate_report(payload: ReportRequest) -> dict[str, Any]:
    answers_text = "\n".join(
        f"Q: {item.question}\nA: {item.answer}" for item in payload.answers
    )
    prompt = f"""
You are an expert product strategist and market researcher.
Analyze the business description and customer discovery answers, then produce a structured report.

Business description:
{payload.description}

Interview responses:
{answers_text}

Return valid JSON only in this exact shape:
{{
  "target_segments": ["segment 1", "segment 2"],
  "pain_points": [
    {{
      "point": "pain point",
      "severity": "high"
    }}
  ],
  "solution_ideas": [
    {{
      "idea": "solution idea",
      "ai_angle": "how AI strengthens it"
    }}
  ],
  "quick_wins": ["quick win 1", "quick win 2"],
  "summary": "short synthesis"
}}

Use severity values of low, medium, or high.
""".strip()

    try:
        client = get_client()
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.5,
            messages=[
                {"role": "system", "content": "Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
        )
        content = completion.choices[0].message.content or ""
        data = extract_json(content)
        required_keys = {
            "target_segments",
            "pain_points",
            "solution_ideas",
            "quick_wins",
            "summary",
        }
        if not required_keys.issubset(data):
            raise HTTPException(status_code=502, detail="Model returned an incomplete report payload.")
        return data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
