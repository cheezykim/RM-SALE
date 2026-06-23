from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from . import crm_service as crm


app = FastAPI(title="Chip Mong Bank CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    password: str


class SessionUser(BaseModel):
    staff_id: str
    username: str
    role: str = "rm"
    branch: str = ""
    allowed_sources: str | list[str] = "all"


class AddPotentialRequest(BaseModel):
    user: SessionUser
    customer: dict[str, Any]


class UpdatePotentialRequest(BaseModel):
    row_number: int
    updates: dict[str, Any]


class DailyPlanRequest(BaseModel):
    user: SessionUser
    plan_date: str
    tasks: list[dict[str, Any]]


class DailyReportRequest(BaseModel):
    user: SessionUser
    report_date: str
    activities: dict[str, str] = {}


def user_dict(user: SessionUser) -> dict[str, Any]:
    return user.dict()


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/logo")
def logo():
    logo_path = Path(__file__).resolve().parent.parent / "Logo-CMCB_FA-15.png"
    if not logo_path.exists():
        raise HTTPException(status_code=404, detail="Logo not found")
    return FileResponse(logo_path)


@app.post("/api/login")
def login(payload: LoginRequest):
    try:
        user = crm.authenticate_simple_user(payload.password)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not user:
        raise HTTPException(status_code=401, detail="Invalid password or inactive account")
    return {
        "staff_id": payload.password.strip(),
        "username": user.get("username", "Sales Officer"),
        "role": user.get("role", "rm"),
        "branch": user.get("branch", ""),
        "allowed_sources": user.get("allowed_sources", "all"),
        "navigation": crm.NAV_ITEMS,
    }


@app.post("/api/bootstrap")
def bootstrap(user: SessionUser):
    try:
        visits = crm.load_visit_data_for_crm(user_dict(user))
        potentials = crm.load_potential_customers(user_dict(user))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {
        "navigation": crm.NAV_ITEMS,
        "visits": crm.to_records(visits),
        "potentials": crm.to_records(potentials),
        "dashboard": crm.dashboard_summary(visits, potentials),
        "dailyTasks": crm.default_daily_tasks(),
        "crmColumns": crm.CRM_COLUMNS,
    }


@app.post("/api/potentials/add")
def add_potential(payload: AddPotentialRequest):
    try:
        ok, message = crm.add_potential_customer(payload.customer, user_dict(payload.user))
        potentials = crm.load_potential_customers(user_dict(payload.user))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ok": ok, "message": message, "potentials": crm.to_records(potentials)}


@app.post("/api/potentials/update")
def update_potential(payload: UpdatePotentialRequest):
    try:
        crm.update_potential_customer(payload.row_number, payload.updates)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ok": True}


@app.post("/api/daily-plan")
def save_daily_plan(payload: DailyPlanRequest):
    try:
        crm.save_daily_plan_to_sheet(payload.tasks, user_dict(payload.user), payload.plan_date)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ok": True, "message": "Daily plan submitted."}


@app.post("/api/reports/daily/generate")
def generate_daily_report(payload: DailyReportRequest):
    try:
        report = crm.build_daily_report_data(user_dict(payload.user), payload.report_date, payload.activities)
        pdf = crm.generate_daily_report_pdf(report)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    filename = f"{report['report_id']}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/reports/daily/submit")
def submit_daily_report(payload: DailyReportRequest):
    try:
        return crm.submit_daily_report(user_dict(payload.user), payload.report_date, payload.activities)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
