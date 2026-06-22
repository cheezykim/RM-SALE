import hashlib
import json
import os
import tomllib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import gspread
import pandas as pd
import pytz
from google.oauth2.service_account import Credentials


BASE_DIR = Path(__file__).resolve().parent.parent
SHEET_ID = "1wM7DTHizhg_A3h0qV3EhX4os4hk46uolW-ESQSJkgZs"
WORKSHEET_NAME = "retail_data"
CRM_SHEET_NAME = "potential_customers"
NEW_CUSTOMER_SHEET_NAME = "New_customer"
CAMBODIA_TZ = pytz.timezone("Asia/Phnom_Penh")

CRM_COLUMNS = [
    "Customer_Key",
    "Salesperson_ID",
    "Salesperson_Name",
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
    "Dashboard",
    "Daily Planning",
    "Market Visit Customers",
    "My Potential Customers",
    "Performance Analytics",
    "Reports",
    "Settings",
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


def first_present_value(row: Any, *keys: str) -> str:
    for key in keys:
        value = safe_text(row.get(key, ""))
        if value:
            return value
    return ""


def normalize_identifier(value: Any) -> str:
    return safe_text(value).lower()


def lead_label(level: Any) -> str:
    normalized = safe_text(level).upper()
    if normalized in {"H", "HOT", "HIGH"}:
        return "Hot"
    if normalized in {"M", "WARM", "MEDIUM"}:
        return "Warm"
    return "Cold"


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
    creds_dict = get_service_account_info()
    if not creds_dict:
        raise RuntimeError("Google Sheets credentials not found.")
    credentials = Credentials.from_service_account_info(
        creds_dict,
        scopes=[
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ],
    )
    return gspread.authorize(credentials)


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
            "sender_id": first_present_value(
                user,
                "Sender_ID",
                "sender_ID",
                "sender_id",
                "send_ID",
                "send_id",
                "Sender ID",
                "Sender Id",
                "sender id",
            ),
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


def resolve_session_user(user: dict[str, Any]) -> dict[str, Any]:
    password = safe_text(user.get("staff_id", ""))
    authenticated = authenticate_simple_user(password)
    if not authenticated:
        return user
    return {
        **user,
        "username": authenticated.get("username", user.get("username", "Sales Officer")),
        "sender_id": authenticated.get("sender_id", user.get("sender_id", "")),
        "role": authenticated.get("role", user.get("role", "rm")),
        "branch": authenticated.get("branch", user.get("branch", "")),
        "allowed_sources": authenticated.get("allowed_sources", user.get("allowed_sources", "all")),
    }


def is_manager(user: dict[str, Any]) -> bool:
    return safe_text(user.get("role", "rm")).lower() in {"manager", "admin", "management", "head", "supervisor"}


def user_sender_id(user: dict[str, Any]) -> str:
    return first_present_value(user, "sender_id", "Sender_ID", "sender_ID", "staff_id")


def apply_visit_permissions(df: pd.DataFrame, user: dict[str, Any]) -> pd.DataFrame:
    if df.empty:
        return df

    if not is_manager(user):
        sender_id = normalize_identifier(user_sender_id(user))
        sender_column = next(
            (
                col
                for col in ("Sender_ID", "sender_ID", "sender_id", "send_ID", "send_id", "Sender ID", "Sender Id", "sender id")
                if col in df.columns
            ),
            "",
        )
        if sender_column:
            if not sender_id:
                return df.iloc[0:0]
            df = df[df[sender_column].apply(normalize_identifier) == sender_id]

    allowed_sources = user.get("allowed_sources", "all")
    if allowed_sources != "all" and "Source_Channel" in df.columns:
        return df[df["Source_Channel"].isin(allowed_sources)]
    return df


def load_visit_data_for_crm(user: dict[str, Any]) -> pd.DataFrame:
    gc = connect_to_google_sheets()
    df = load_sheet_data(gc, SHEET_ID, WORKSHEET_NAME)
    if df.empty:
        return pd.DataFrame()
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
    if not is_manager(user):
        df = df[df["Salesperson_ID"].astype(str).str.strip() == safe_text(user.get("staff_id", ""))]
    return clean_records(df)


def add_potential_customer(row: dict[str, Any], user: dict[str, Any]) -> tuple[bool, str]:
    gc = connect_to_google_sheets()
    worksheet = ensure_potential_worksheet(gc)
    potentials = load_potential_customers(user)
    key = crm_customer_key(row.get("Name", ""), row.get("Tel", ""), user.get("staff_id", ""))
    if not potentials.empty and key in potentials["Customer_Key"].astype(str).tolist():
        return False, "This customer is already in My Potential Customers."

    now_text = now_cambodia().strftime("%Y-%m-%d %H:%M:%S")
    record = {
        "Customer_Key": key,
        "Salesperson_ID": safe_text(user.get("staff_id", "")),
        "Salesperson_Name": safe_text(user.get("username", "Sales Officer")),
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
        "Status": "Interested",
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

    return True, "Customer successfully added to My Potential Customers."


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
    if "Status" in changes:
        activity_text = f"Status changed to {values.get('Status', 'Interested')}"
    elif "Next_Follow_Up" in changes:
        activity_text = f"Follow up scheduled for {values.get('Next_Follow_Up', '')}"
    elif "Notes" in changes:
        activity_text = "Notes updated"
    elif changes:
        activity_text = "Customer details updated"
    else:
        activity_text = "Customer reviewed"
    activity_line = f"{today_cambodia().strftime('%d %b %Y')} - {activity_text}"
    if activity_line not in activities:
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
