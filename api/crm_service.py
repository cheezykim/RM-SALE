import hashlib
import json
import os
import re
import tomllib
from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from typing import Any

import gspread
import pandas as pd
import pytz
from google.oauth2.service_account import Credentials
from google.auth.transport.requests import AuthorizedSession
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


BASE_DIR = Path(__file__).resolve().parent.parent
SHEET_ID = "1wM7DTHizhg_A3h0qV3EhX4os4hk46uolW-ESQSJkgZs"
WORKSHEET_NAME = "retail_data"
CRM_SHEET_NAME = "potential_customers"
NEW_CUSTOMER_SHEET_NAME = "New_customer"
REPORT_ARCHIVE_SHEET_NAME = "rm_report_submissions"
REPORT_ARCHIVE_COLUMNS = [
    "Report_ID",
    "Staff_ID",
    "RM_Name",
    "Branch",
    "Position",
    "Report_Date",
    "Generated_At",
    "Submitted_At",
    "PDF_File_Name",
    "PDF_Drive_URL",
    "Total_Visits",
    "Total_Calls",
    "Meetings_Conducted",
    "Follow_Ups_Completed",
    "New_Leads_Added",
    "Hot_Leads",
    "Opportunities_Created",
    "Status",
]
CAMBODIA_TZ = pytz.timezone("Asia/Phnom_Penh")
BANK_NAVY = colors.HexColor("#071A33")
BANK_BLUE = colors.HexColor("#0B4EA2")
BANK_GOLD = colors.HexColor("#C8A24A")
BANK_INK = colors.HexColor("#172033")
BANK_MUTED = colors.HexColor("#607089")
BANK_LINE = colors.HexColor("#D9E1EC")
BANK_SOFT = colors.HexColor("#F5F8FC")

CRM_COLUMNS = [
    "Customer_Key",
    "Salesperson_ID",
    "Salesperson_Name",
    "Sender_ID",
    "Date_Added",
    "Sender_Name",
    "Name",
    "Tel",
    "Rank",
    "Bank",
    "Business",
    "Purpose",
    "Amount",
    "Interest",
    "Loan_Type",
    "Tenure",
    "Maturity",
    "Source_Type",
    "Source_Channel",
    "Status",
    "Potential_Level",
    "Next_Follow_Up",
    "Potential_Products",
    "Remark",
    "Notes",
    "Activities",
    "Documents",
    "Last_Updated",
]

NAV_ITEMS = [
    "Daily Planning",
    "MyMerchant",
    "Existing Customers",
    "Market Visit Customers",
    "My Followup",
]


def now_cambodia() -> datetime:
    return datetime.now(CAMBODIA_TZ)


def today_cambodia():
    return now_cambodia().date()


def safe_text(value: Any) -> str:
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except Exception:
        pass
    return str(value).strip()


def lead_label(level: Any) -> str:
    normalized = safe_text(level).upper()
    if normalized in {"H", "HOT", "HIGH"}:
        return "Hot"
    if normalized in {"M", "WARM", "MEDIUM"}:
        return "Warm"
    return "Cold"


def lead_code(level: Any) -> str:
    normalized = safe_text(level).upper()
    if normalized in {"M", "WARM", "MEDIUM"}:
        return "M"
    if normalized in {"L", "COLD", "LOW"}:
        return "L"
    return "H"


def branch_source(value: Any) -> str:
    text = safe_text(value)
    if not text:
        return ""
    tokens = re.findall(r"[A-Za-z0-9]+", text)
    for token in reversed(tokens):
        if 3 <= len(token) <= 4:
            return token
    return text


def parse_amount(value: Any) -> float:
    text = safe_text(value).upper().replace("$", "").replace(",", "").replace("USD", "").strip()
    multiplier = 1
    if text.endswith("K"):
        multiplier = 1000
        text = text[:-1]
    elif text.endswith("M"):
        multiplier = 1000000
        text = text[:-1]
    try:
        return float(text) * multiplier
    except Exception:
        return 0.0


def crm_customer_key(name: Any, tel: Any, salesperson_id: Any) -> str:
    raw = f"{safe_text(name).lower()}|{safe_text(tel)}|{safe_text(salesperson_id)}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def _read_streamlit_secrets() -> dict[str, Any]:
    secrets_path = BASE_DIR / ".streamlit" / "secrets.toml"
    if not secrets_path.exists():
        return {}
    with secrets_path.open("rb") as fh:
        return tomllib.load(fh)


def get_service_account_info() -> dict[str, Any] | None:
    raw_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if raw_json:
        return json.loads(raw_json)

    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if credentials_path and Path(credentials_path).exists():
        return json.loads(Path(credentials_path).read_text(encoding="utf-8"))

    secrets = _read_streamlit_secrets()
    for key in ("service_account", "gcp_service_account"):
        if key in secrets:
            return dict(secrets[key])
    return None


def connect_to_google_sheets():
    return gspread.authorize(get_google_credentials())


def get_google_credentials():
    creds_dict = get_service_account_info()
    if not creds_dict:
        raise RuntimeError("Google Sheets credentials not found.")
    return Credentials.from_service_account_info(
        creds_dict,
        scopes=[
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ],
    )


def clean_records(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or df.empty:
        return pd.DataFrame()
    cleaned = df.astype(str).replace(
        {
            "nan": "",
            "None": "",
            "NaN": "",
            "null": "",
            "NaT": "",
            "none": "",
            "<NA>": "",
            "NoneType": "",
        }
    )
    return cleaned.fillna("")


def to_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df is None or df.empty:
        return []
    clean = df.copy()
    for col in clean.columns:
        clean[col] = clean[col].apply(lambda value: "" if pd.isna(value) else value)
    return clean.to_dict(orient="records")


def load_sheet_data(gc, sheet_id: str, worksheet_name: str) -> pd.DataFrame:
    spreadsheet = gc.open_by_key(sheet_id)
    worksheet = spreadsheet.worksheet(worksheet_name)
    records = worksheet.get_all_records()
    return pd.DataFrame(records) if records else pd.DataFrame()


def load_users_from_sheets(gc, sheet_id: str, worksheet_name: str = "Users") -> dict[str, dict[str, Any]]:
    sheet = gc.open_by_key(sheet_id)
    worksheet = sheet.worksheet(worksheet_name)
    all_values = worksheet.get_all_values()
    if not all_values:
        return {}

    raw_headers = all_values[0]
    headers: list[str] = []
    header_count: dict[str, int] = {}
    for header in raw_headers:
        if header in header_count:
            header_count[header] += 1
            headers.append(f"{header}_{header_count[header]}")
        else:
            header_count[header] = 0
            headers.append(header)

    df = pd.DataFrame(all_values[1:], columns=headers)
    users: dict[str, dict[str, Any]] = {}
    for _, user in df.iterrows():
        password = safe_text(user.get("password", ""))
        if not password:
            continue
        allowed_raw = user.get("allowed_sources", "all")
        if safe_text(allowed_raw).lower() in {"", "all"}:
            sources: str | list[str] = "all"
        else:
            sources = [source.strip() for source in safe_text(allowed_raw).split(",") if source.strip()]
        users[password] = {
            "username": safe_text(user.get("username", "Unknown")),
            "tele_id": safe_text(user.get("Tele_ID", "")),
            "allowed_sources": sources,
            "branch": safe_text(user.get("branch", "")),
            "role": safe_text(user.get("role", "rm")),
            "is_active": safe_text(user.get("is_active", "TRUE")).upper() == "TRUE",
        }
    return users


def authenticate_simple_user(password: str) -> dict[str, Any] | None:
    gc = connect_to_google_sheets()
    users = load_users_from_sheets(gc, SHEET_ID, "Users")
    input_password = safe_text(password)
    if input_password in users and users[input_password].get("is_active", True):
        return users[input_password]
    for saved_password, info in users.items():
        if saved_password.strip().lower() == input_password.lower() and info.get("is_active", True):
            return info
    return None


def is_manager(user: dict[str, Any]) -> bool:
    return safe_text(user.get("role", "rm")).lower() in {"manager", "admin", "management", "head", "supervisor"}


def usable_tele_id(user: dict[str, Any]) -> str:
    tele_id = safe_text(user.get("tele_id", ""))
    if not tele_id or tele_id.upper() in {"N/A", "NA", "NONE", "NULL"} or tele_id.startswith("#"):
        return ""
    return tele_id


def apply_visit_permissions(df: pd.DataFrame, user: dict[str, Any]) -> pd.DataFrame:
    allowed_sources = user.get("allowed_sources", "all")
    if allowed_sources != "all" and "Source_Channel" in df.columns:
        df = df[df["Source_Channel"].isin(allowed_sources)]
    tele_id = usable_tele_id(user)
    if tele_id and "Sender_ID" in df.columns:
        df = df[df["Sender_ID"].astype(str).str.strip() == tele_id]
    return df


def load_visit_data_for_crm(user: dict[str, Any]) -> pd.DataFrame:
    gc = connect_to_google_sheets()
    df = load_sheet_data(gc, SHEET_ID, WORKSHEET_NAME)
    if df.empty:
        return pd.DataFrame()
    # Keep the source row so clients can consistently put newly appended
    # Google Sheet records first when timestamps are equal or unavailable.
    df["_row_number"] = range(2, len(df) + 2)
    df = clean_records(df)
    if "Name" in df.columns:
        df = df[df["Name"].notna() & (df["Name"].str.strip() != "")]
    if "Sender_Name" in df.columns:
        df = df[
            (df["Sender_Name"].str.strip() != "Zana MAM")
            & (df["Sender_Name"].str.strip() != "Khemra BUTH")
        ]
    df = apply_visit_permissions(df, user)
    return df.fillna("")


def ensure_potential_worksheet(gc):
    sheet = gc.open_by_key(SHEET_ID)
    try:
        worksheet = sheet.worksheet(CRM_SHEET_NAME)
    except gspread.exceptions.WorksheetNotFound:
        worksheet = sheet.add_worksheet(title=CRM_SHEET_NAME, rows=1000, cols=len(CRM_COLUMNS))
        worksheet.append_row(CRM_COLUMNS)
        return worksheet

    values = worksheet.get_all_values()
    if not values:
        worksheet.append_row(CRM_COLUMNS)
    else:
        headers = values[0]
        missing = [col for col in CRM_COLUMNS if col not in headers]
        if missing:
            worksheet.update("A1", [headers + missing])
    return worksheet


def ensure_new_customer_worksheet(gc):
    sheet = gc.open_by_key(SHEET_ID)
    try:
        worksheet = sheet.worksheet(NEW_CUSTOMER_SHEET_NAME)
    except gspread.exceptions.WorksheetNotFound:
        worksheet = sheet.add_worksheet(title=NEW_CUSTOMER_SHEET_NAME, rows=1000, cols=len(CRM_COLUMNS))
        worksheet.append_row(CRM_COLUMNS)
        return worksheet

    values = worksheet.get_all_values()
    if not values:
        worksheet.append_row(CRM_COLUMNS)
    else:
        headers = values[0]
        missing = [col for col in CRM_COLUMNS if col not in headers]
        if missing:
            worksheet.update("A1", [headers + missing])
    return worksheet


def is_manual_customer(row: dict[str, Any]) -> bool:
    entry_type = safe_text(row.get("Entry_Type", ""))
    sender = safe_text(row.get("Sender_Name", ""))
    source = safe_text(row.get("Source_Channel", row.get("Source_Type", "")))
    return entry_type.lower() == "manual" or sender.lower() == "manual entry" or source.lower() == "manual entry"


def load_potential_customers(user: dict[str, Any]) -> pd.DataFrame:
    gc = connect_to_google_sheets()
    worksheet = ensure_potential_worksheet(gc)
    records = worksheet.get_all_records()
    if not records:
        return pd.DataFrame(columns=CRM_COLUMNS + ["_row_number"])
    df = pd.DataFrame(records)
    for col in CRM_COLUMNS:
        if col not in df.columns:
            df[col] = ""
    df["_row_number"] = range(2, len(df) + 2)
    tele_id = usable_tele_id(user)
    if tele_id:
        if "Sender_ID" not in df.columns:
            return pd.DataFrame(columns=list(df.columns))
        df = df[df["Sender_ID"].astype(str).str.strip() == tele_id]
    return clean_records(df)


def add_potential_customer(row: dict[str, Any], user: dict[str, Any]) -> tuple[bool, str]:
    gc = connect_to_google_sheets()
    worksheet = ensure_potential_worksheet(gc)
    potentials = load_potential_customers(user)
    key = crm_customer_key(row.get("Name", ""), row.get("Tel", ""), user.get("staff_id", ""))
    if not potentials.empty and key in potentials["Customer_Key"].astype(str).tolist():
        return False, "This customer is already in My Followup."

    now_text = now_cambodia().strftime("%Y-%m-%d %H:%M:%S")
    record = {
        "Customer_Key": key,
        "Salesperson_ID": safe_text(user.get("staff_id", "")),
        "Salesperson_Name": safe_text(user.get("username", "Sales Officer")),
        "Sender_ID": safe_text(row.get("Sender_ID", "")) or usable_tele_id(user),
        "Date_Added": today_cambodia().strftime("%Y-%m-%d"),
        "Sender_Name": row.get("Sender_Name", ""),
        "Name": row.get("Name", ""),
        "Tel": row.get("Tel", ""),
        "Rank": row.get("Rank", row.get("Bank", "")),
        "Bank": row.get("Bank", ""),
        "Business": row.get("Business", ""),
        "Purpose": row.get("Purpose", ""),
        "Amount": row.get("Amount", ""),
        "Interest": row.get("Interest", ""),
        "Loan_Type": row.get("Loan_Type", ""),
        "Tenure": row.get("Tenure", ""),
        "Maturity": row.get("Maturity", ""),
        "Source_Type": row.get("Source_Type", row.get("Source_Channel", "Market Visit")),
        "Source_Channel": row.get("Source_Channel", row.get("Source_Type", "Market Visit")),
        "Status": "Not interested / Need",
        "Potential_Level": lead_label(row.get("Potential_Level", "Hot")),
        "Next_Follow_Up": "",
        "Potential_Products": row.get("Potential_Product", row.get("Potential_Products", "SME Loan")),
        "Remark": row.get("Remark", ""),
        "Notes": "",
        "Activities": f"{today_cambodia().strftime('%d %b %Y')} - Added To Potential from {safe_text(row.get('Source_Type', row.get('Source_Channel', 'Market Visit'))) or 'Market Visit'}",
        "Documents": "",
        "Last_Updated": now_text,
    }
    headers = worksheet.row_values(1) or CRM_COLUMNS
    worksheet.append_row([record.get(col, "") for col in headers])

    if is_manual_customer(row):
        new_customer_worksheet = ensure_new_customer_worksheet(gc)
        new_customer_headers = new_customer_worksheet.row_values(1) or CRM_COLUMNS
        new_customer_worksheet.append_row([record.get(col, "") for col in new_customer_headers])
        return True, "Customer successfully added and safely stored in New_customer."

    return True, "Customer successfully added to My Followup."


def update_potential_customer(row_number: int, updates: dict[str, Any]) -> bool:
    gc = connect_to_google_sheets()
    worksheet = ensure_potential_worksheet(gc)
    headers = worksheet.row_values(1)
    current = worksheet.row_values(int(row_number))
    current = current + [""] * (len(headers) - len(current))
    values = dict(zip(headers, current))
    changes = []
    for field, new_value in updates.items():
        if safe_text(new_value) != safe_text(values.get(field, "")):
            changes.append(field)
    values.update(updates)
    activities = values.get("Activities", "")
    if changes == ["Activities"]:
        activity_text = ""
    elif "Status" in changes:
        activity_text = f"Status changed to {values.get('Status', 'Not interested / Need')}"
    elif "Next_Follow_Up" in changes:
        activity_text = f"Follow up scheduled for {values.get('Next_Follow_Up', '')}"
    elif "Notes" in changes:
        activity_text = "Notes updated"
    elif changes:
        activity_text = "Customer details updated"
    else:
        activity_text = "Customer reviewed"
    activity_line = f"{today_cambodia().strftime('%d %b %Y')} - {activity_text}" if activity_text else ""
    if activity_line and activity_line not in activities:
        values["Activities"] = (activities + "\n" + activity_line).strip()
    values["Last_Updated"] = now_cambodia().strftime("%Y-%m-%d %H:%M:%S")
    worksheet.update(f"A{int(row_number)}", [[values.get(col, "") for col in headers]])
    return True


def save_daily_plan_to_sheet(plan_data: list[dict[str, Any]], user: dict[str, Any], plan_date: str) -> bool:
    gc = connect_to_google_sheets()
    sheet = gc.open_by_key(SHEET_ID)
    worksheet = sheet.worksheet("plan")
    master_plan_date = datetime.strptime(plan_date, "%Y-%m-%d").date()
    staff_id = safe_text(user.get("staff_id", ""))
    rows: list[list[Any]] = []
    for task in plan_data:
        customers = task.get("customers") or []
        if not customers:
            rows.append(
                [
                    task.get("start_time", ""),
                    task.get("end_time", ""),
                    master_plan_date.strftime("%d/%m/%Y"),
                    task.get("activity", ""),
                    task.get("location", ""),
                    task.get("num_customers", ""),
                    "",
                    "",
                    "",
                    staff_id,
                    now_cambodia().strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )
        else:
            for customer in customers:
                rows.append(
                    [
                        task.get("start_time", ""),
                        task.get("end_time", ""),
                        master_plan_date.strftime("%d/%m/%Y"),
                        task.get("activity", ""),
                        task.get("location", ""),
                        task.get("num_customers", ""),
                        customer.get("name", ""),
                        customer.get("contact", ""),
                        customer.get("biz", ""),
                        staff_id,
                        now_cambodia().strftime("%Y-%m-%d %H:%M:%S"),
                    ]
                )
    if rows:
        worksheet.append_rows(rows)
    return True


def parse_report_date(value: Any):
    text = safe_text(value)
    if not text:
        return None
    for day_first in (False, True):
        parsed = pd.to_datetime(text, errors="coerce", dayfirst=day_first)
        if not pd.isna(parsed):
            return parsed.date()
    return None


def filter_by_date(df: pd.DataFrame, column: str, report_date) -> pd.DataFrame:
    if df.empty or column not in df.columns:
        return pd.DataFrame(columns=df.columns)
    mask = df[column].apply(lambda value: parse_report_date(value) == report_date)
    return df[mask]


def ensure_report_archive_worksheet(gc):
    sheet = gc.open_by_key(SHEET_ID)
    try:
        worksheet = sheet.worksheet(REPORT_ARCHIVE_SHEET_NAME)
    except gspread.exceptions.WorksheetNotFound:
        worksheet = sheet.add_worksheet(title=REPORT_ARCHIVE_SHEET_NAME, rows=1000, cols=len(REPORT_ARCHIVE_COLUMNS))
        worksheet.append_row(REPORT_ARCHIVE_COLUMNS)
        return worksheet

    values = worksheet.get_all_values()
    if not values:
        worksheet.append_row(REPORT_ARCHIVE_COLUMNS)
    else:
        headers = values[0]
        missing = [col for col in REPORT_ARCHIVE_COLUMNS if col not in headers]
        if missing:
            worksheet.update("A1", [headers + missing])
    return worksheet


def load_daily_plan_rows(gc, user: dict[str, Any], report_date) -> list[dict[str, Any]]:
    sheet = gc.open_by_key(SHEET_ID)
    try:
        worksheet = sheet.worksheet("plan")
    except gspread.exceptions.WorksheetNotFound:
        return []

    values = worksheet.get_all_values()
    if len(values) < 2:
        return []

    plan_columns = [
        "Start_Time",
        "End_Time",
        "Plan_Date",
        "Activity",
        "Location",
        "Num_Customers",
        "Customer_Name",
        "Customer_Tel",
        "Customer_Business",
        "Staff_ID",
        "Submitted_At",
    ]
    staff_id = safe_text(user.get("staff_id", ""))
    rows: list[dict[str, Any]] = []
    for raw in values[1:]:
        item = dict(zip(plan_columns, raw + [""] * (len(plan_columns) - len(raw))))
        if safe_text(item.get("Staff_ID")) != staff_id:
            continue
        if parse_report_date(item.get("Plan_Date")) != report_date:
            continue
        rows.append(item)
    return rows


def normalize_activity_type(value: Any) -> str:
    text = safe_text(value).lower()
    if "call" in text or "phone" in text:
        return "Phone Call"
    if "meet" in text:
        return "Meeting"
    if "follow" in text:
        return "Follow Up"
    if "visit" in text:
        return "Market Visit"
    if "new" in text or "acquisition" in text:
        return "New Customer Acquisition"
    if "opportun" in text or "proposal" in text or "document" in text or "negotiation" in text:
        return "Opportunity Update"
    return safe_text(value) or "Activity"


def activity_sort_key(item: dict[str, Any]) -> str:
    return safe_text(item.get("time", "99:99"))


def build_daily_report_data(user: dict[str, Any], report_date_text: str, activities: dict[str, str] | None = None) -> dict[str, Any]:
    report_date = datetime.strptime(report_date_text, "%Y-%m-%d").date()
    gc = connect_to_google_sheets()
    visits = load_visit_data_for_crm(user)
    potentials = load_potential_customers(user)
    daily_visits = filter_by_date(visits, "Message_Date", report_date)
    new_leads = filter_by_date(potentials, "Date_Added", report_date)
    updated_today = filter_by_date(potentials, "Last_Updated", report_date)
    plan_rows = load_daily_plan_rows(gc, user, report_date)

    timeline: list[dict[str, Any]] = []
    for _, row in daily_visits.iterrows():
        timeline.append(
            {
                "time": safe_text(row.get("Message_Date", "")),
                "customer": safe_text(row.get("Name", "Customer")),
                "type": "Market Visit",
                "remark": safe_text(row.get("Remark", row.get("Purpose", ""))),
                "outcome": safe_text(row.get("Potential_Level", "Visited")),
            }
        )

    for item in plan_rows:
        activity_type = normalize_activity_type(item.get("Activity"))
        timeline.append(
            {
                "time": safe_text(item.get("Start_Time")),
                "customer": safe_text(item.get("Customer_Name")) or "-",
                "type": activity_type,
                "remark": safe_text(item.get("Location")),
                "outcome": "Planned / Submitted",
            }
        )

    for _, row in updated_today.iterrows():
        status = safe_text(row.get("Status", "Updated"))
        timeline.append(
            {
                "time": safe_text(row.get("Last_Updated")),
                "customer": safe_text(row.get("Name", "Customer")),
                "type": "Opportunity Update",
                "remark": safe_text(row.get("Remark", row.get("Notes", ""))),
                "outcome": status,
            }
        )

    timeline = sorted(timeline, key=activity_sort_key)

    upcoming = pd.DataFrame()
    if not potentials.empty and "Next_Follow_Up" in potentials.columns:
        upcoming = potentials.copy()
        upcoming["_follow"] = pd.to_datetime(upcoming["Next_Follow_Up"], errors="coerce")
        start = pd.Timestamp(report_date)
        upcoming = upcoming[upcoming["_follow"].notna() & (upcoming["_follow"] >= start)].sort_values("_follow").head(10)

    plan_activity_types = [normalize_activity_type(item.get("Activity")) for item in plan_rows]
    total_calls = sum(1 for item in plan_activity_types if item == "Phone Call")
    meetings = sum(1 for item in plan_activity_types if item == "Meeting")
    follow_ups = sum(1 for item in plan_activity_types if item == "Follow Up")
    follow_ups += len(
        updated_today[
            updated_today["Activities"].astype(str).str.lower().str.contains("follow", na=False)
        ]
    ) if not updated_today.empty and "Activities" in updated_today.columns else 0
    hot_leads = len(
        new_leads[
            new_leads["Potential_Level"].astype(str).str.upper().isin(["H", "HOT", "HIGH"])
        ]
    ) if not new_leads.empty and "Potential_Level" in new_leads.columns else 0

    customer_records = to_records(new_leads.head(20))
    for customer in customer_records:
        customer["Report_Activity"] = safe_text(customer.get("Activities"))

    return {
        "report_id": f"RM-{safe_text(user.get('staff_id', 'USER'))}-{report_date.strftime('%Y%m%d')}-{now_cambodia().strftime('%H%M%S')}",
        "report_date": report_date_text,
        "generated_at": now_cambodia().strftime("%Y-%m-%d %H:%M:%S"),
        "rm": {
            "name": safe_text(user.get("username", "Sales Officer")),
            "branch": safe_text(user.get("branch", "")),
            "position": safe_text(user.get("role", "Relationship Manager")),
            "staff_id": safe_text(user.get("staff_id", "")),
        },
        "kpis": {
            "Total Visits": len(daily_visits),
            "Total Calls": total_calls,
            "Meetings Conducted": meetings,
            "Follow Ups Completed": follow_ups,
            "New Leads Added": len(new_leads),
            "HOT Leads": hot_leads,
            "Opportunities Created": len(new_leads),
        },
        "timeline": timeline,
        "new_customers": customer_records,
        "next_actions": to_records(upcoming.drop(columns=["_follow"], errors="ignore")),
    }


def pdf_text(value: Any, fallback: str = "-") -> str:
    text = safe_text(value)
    return text if text else fallback


def pdf_cell(value: Any, style: ParagraphStyle) -> Paragraph:
    return Paragraph(pdf_text(value).replace("\n", "<br/>"), style)


def table_or_empty(
    rows: list[list[Any]],
    widths: list[float],
    header_color=BANK_NAVY,
    body_style: ParagraphStyle | None = None,
) -> Table:
    styles = getSampleStyleSheet()
    body = body_style or ParagraphStyle("TableBody", parent=styles["BodyText"], fontSize=7.8, leading=10, textColor=BANK_INK)
    header = ParagraphStyle("TableHeader", parent=body, fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white)
    empty_row = ["No records available."] + [""] * (len(rows[0]) - 1)
    data = rows if len(rows) > 1 else rows + [empty_row]
    data = [[pdf_cell(value, header if row_index == 0 else body) for value in row] for row_index, row in enumerate(data)]
    table = Table(data, colWidths=widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), header_color),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 7.8),
                ("LINEBELOW", (0, 0), (-1, 0), 0.8, BANK_GOLD),
                ("GRID", (0, 0), (-1, -1), 0.25, BANK_LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BANK_SOFT]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def draw_report_frame(canvas, doc, report: dict[str, Any]) -> None:
    canvas.saveState()
    page_width, page_height = A4
    canvas.setFillColor(BANK_NAVY)
    canvas.rect(0, page_height - 18 * mm, page_width, 18 * mm, stroke=0, fill=1)
    canvas.setFillColor(BANK_GOLD)
    canvas.rect(0, page_height - 18.8 * mm, page_width, 0.8 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(page_width - 16 * mm, page_height - 10.8 * mm, f"RM Activity Report | {report.get('report_date', '')}")
    canvas.setFillColor(BANK_MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(16 * mm, 8 * mm, f"Confidential - Internal Management Review | Report ID: {report.get('report_id', '')}")
    canvas.drawRightString(page_width - 16 * mm, 8 * mm, f"Page {doc.page}")
    canvas.restoreState()


def kpi_card_table(kpis: dict[str, Any]) -> Table:
    labels = ["Visits", "Calls", "Meetings", "Follow Ups", "New Leads", "HOT Leads", "Opportunities"]
    keys = ["Total Visits", "Total Calls", "Meetings Conducted", "Follow Ups Completed", "New Leads Added", "HOT Leads", "Opportunities Created"]
    styles = getSampleStyleSheet()
    label_style = ParagraphStyle("KpiLabel", parent=styles["BodyText"], fontSize=6.8, leading=8, textColor=BANK_MUTED, alignment=TA_CENTER, fontName="Helvetica-Bold")
    value_style = ParagraphStyle("KpiValue", parent=styles["BodyText"], fontSize=14, leading=16, textColor=BANK_NAVY, alignment=TA_CENTER, fontName="Helvetica-Bold")
    data = [
        [pdf_cell(label, label_style) for label in labels],
        [pdf_cell(kpis.get(key, 0), value_style) for key in keys],
    ]
    table = Table(data, colWidths=[26 * mm] * 7)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.35, BANK_LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, BANK_LINE),
                ("LINEABOVE", (0, 0), (-1, 0), 1.2, BANK_GOLD),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def generate_daily_report_pdf(report: dict[str, Any]) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=14 * mm, leftMargin=14 * mm, topMargin=26 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    section = ParagraphStyle("Section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=BANK_NAVY, spaceBefore=11, spaceAfter=6)
    body = ParagraphStyle("PremiumTableBody", parent=styles["BodyText"], fontSize=7.5, leading=9.5, textColor=BANK_INK)
    story: list[Any] = []

    rm = report["rm"]
    rm_rows = [
        ["RM Name", "Branch", "Staff ID"],
        [rm["name"], rm["branch"], rm["staff_id"]],
    ]
    story.append(Paragraph("RM Information", section))
    story.append(table_or_empty(rm_rows, [62 * mm, 60 * mm, 60 * mm], BANK_NAVY, body))

    story.append(Paragraph("New Potential Customers", section))
    customer_rows = [["Customer", "Product", "Amount", "Potential", "Source", "Activity"]]
    for row in report["new_customers"][:15]:
        customer_rows.append(
            [
                safe_text(row.get("Name")),
                safe_text(row.get("Potential_Products")),
                safe_text(row.get("Amount")),
                lead_code(row.get("Potential_Level")),
                branch_source(row.get("Source_Channel", row.get("Source_Type", ""))),
                safe_text(row.get("Report_Activity")),
            ]
        )
    story.append(table_or_empty(customer_rows, [34 * mm, 34 * mm, 24 * mm, 24 * mm, 34 * mm, 32 * mm], BANK_NAVY, body))
    doc.build(
        story,
        onFirstPage=lambda canvas, current_doc: draw_report_frame(canvas, current_doc, report),
        onLaterPages=lambda canvas, current_doc: draw_report_frame(canvas, current_doc, report),
    )
    return buffer.getvalue()


def upload_pdf_to_drive(pdf_bytes: bytes, filename: str) -> dict[str, str]:
    credentials = get_google_credentials()
    session = AuthorizedSession(credentials)
    metadata = {"name": filename, "mimeType": "application/pdf"}
    boundary = "crm-report-boundary"
    body = (
        f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{json.dumps(metadata)}\r\n"
        f"--{boundary}\r\nContent-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + pdf_bytes + f"\r\n--{boundary}--".encode("utf-8")
    response = session.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
        data=body,
        headers={"Content-Type": f"multipart/related; boundary={boundary}"},
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Google Drive upload failed: {response.text}")
    payload = response.json()
    return {
        "id": payload.get("id", ""),
        "url": payload.get("webViewLink") or payload.get("webContentLink") or "",
    }


def submit_daily_report(user: dict[str, Any], report_date: str, activities: dict[str, str] | None = None) -> dict[str, Any]:
    report = build_daily_report_data(user, report_date, activities)
    pdf = generate_daily_report_pdf(report)
    filename = f"{report['report_id']}.pdf"
    drive = upload_pdf_to_drive(pdf, filename)
    submitted_at = now_cambodia().strftime("%Y-%m-%d %H:%M:%S")
    gc = connect_to_google_sheets()
    worksheet = ensure_report_archive_worksheet(gc)
    headers = worksheet.row_values(1) or REPORT_ARCHIVE_COLUMNS
    row = {
        "Report_ID": report["report_id"],
        "Staff_ID": report["rm"]["staff_id"],
        "RM_Name": report["rm"]["name"],
        "Branch": report["rm"]["branch"],
        "Position": report["rm"]["position"],
        "Report_Date": report["report_date"],
        "Generated_At": report["generated_at"],
        "Submitted_At": submitted_at,
        "PDF_File_Name": filename,
        "PDF_Drive_URL": drive["url"],
        "Status": "Submitted",
        **report["kpis"],
    }
    worksheet.append_row([row.get(col, "") for col in headers])
    return {"ok": True, "message": "Daily report generated and submitted.", "report_id": report["report_id"], "pdf_url": drive["url"], "submitted_at": submitted_at}


def dashboard_summary(visits: pd.DataFrame, potentials: pd.DataFrame) -> dict[str, Any]:
    total_visits = len(visits)

    if not visits.empty and "Message_Date" in visits.columns:
        dates = pd.to_datetime(visits["Message_Date"], errors="coerce")
        total_visits = int(
            (
                (dates.dt.month == today_cambodia().month)
                & (dates.dt.year == today_cambodia().year)
            )
            .fillna(False)
            .sum()
        )

    converted = (
        len(
            potentials[
                potentials["Status"].astype(str).str.lower() == "converted"
            ]
        )
        if not potentials.empty and "Status" in potentials.columns
        else 0
    )

    due = 0
    if not potentials.empty and "Next_Follow_Up" in potentials.columns:
        follow_dates = pd.to_datetime(
            potentials["Next_Follow_Up"],
            errors="coerce"
        )

        today = pd.Timestamp(today_cambodia())

        due = int(
            (follow_dates <= today)
            .fillna(False)
            .sum()
        )

    expected = (
        sum(parse_amount(v) for v in potentials.get("Amount", []))
        if not potentials.empty
        else 0
    )

    upcoming = pd.DataFrame()

    if not potentials.empty:
        upcoming = potentials.copy()
        upcoming["_follow"] = pd.to_datetime(
            upcoming["Next_Follow_Up"],
            errors="coerce"
        )

        upcoming = (
            upcoming[upcoming["_follow"].notna()]
            .sort_values("_follow")
            .head(8)
        )

    recent = []

    if not potentials.empty:
        recent_df = (
            potentials.sort_values(
                "Last_Updated",
                ascending=False
            ).head(6)
            if "Last_Updated" in potentials.columns
            else potentials.head(6)
        )

        recent = [
            f"{safe_text(row.get('Name', 'Customer'))}: "
            f"{safe_text(row.get('Status', 'Interested'))}"
            for _, row in recent_df.iterrows()
        ]

    return {
        "metrics": {
            "totalVisitsThisMonth": total_visits,
            "potentialCustomers": len(potentials),
            "followUpsDue": due,
            "convertedCustomers": converted,
            "expectedLoanAmount": expected,
        },
        "recentActivities": recent,
        "upcomingFollowUps": to_records(
            upcoming.drop(columns=["_follow"], errors="ignore")
        ),
    }

def default_daily_tasks() -> list[dict[str, Any]]:
    return [
        {
            "start_time": "08:00",
            "end_time": "10:00",
            "activity": "",
            "location": "",
            "num_customers": "",
            "customers": [],
        },
        {
            "start_time": "10:00",
            "end_time": "12:00",
            "activity": "",
            "location": "",
            "num_customers": "",
            "customers": [],
        },
        {
            "start_time": "13:00",
            "end_time": "15:00",
            "activity": "",
            "location": "",
            "num_customers": "",
            "customers": [],
        },
        {
            "start_time": "15:00",
            "end_time": "17:00",
            "activity": "",
            "location": "",
            "num_customers": "",
            "customers": [],
        },
    ]
