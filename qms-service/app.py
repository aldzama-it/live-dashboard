from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import uuid
from collections import Counter
from datetime import date, datetime
from pathlib import Path
from threading import RLock
from typing import Any

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template, request, url_for
from werkzeug.exceptions import RequestEntityTooLarge

from kpi_parser import (
    CachedKpiRepository,
    KpiWorkbookParser,
    MONTH_NAMES,
    is_blank,
    is_no_report,
    month_number,
    normalize_label,
    parse_number,
)
from risk_parser import CachedRiskRepository, RiskWorkbookParser
from followup_parser import CachedFollowUpRepository, FollowUpWorkbookParser
from corrective_parser import (
    CachedCorrectiveActionRepository,
    CorrectiveActionWorkbookParser,
)
from kaizen_parser import CachedKaizenRepository, KaizenWorkbookParser

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def env_path(name: str, default: str = "") -> Path | None:
    """Membaca path dari .env dan membuat path relatif terhadap folder service."""
    raw_value = os.getenv(name, default).strip()
    if not raw_value:
        return None

    path = Path(raw_value).expanduser()
    if not path.is_absolute():
        path = BASE_DIR / path

    return path.resolve()


CONFIGURED_EXCEL_PATH = env_path("KPI_EXCEL_PATH")
CONFIGURED_RISK_EXCEL_PATH = env_path(
    "RISK_EXCEL_PATH",
    "data/3. RISK ASSESMENT - Consolidated FRM-602-009.xlsx",
) or (BASE_DIR / "data" / "3. RISK ASSESMENT - Consolidated FRM-602-009.xlsx")
CONFIGURED_FOLLOWUP_EXCEL_PATH = env_path(
    "FOLLOWUP_BOD_EXCEL_PATH",
    "data/4. FRM-AZM-602-021 Follow up Evaluasi dan Strategi BoD Register.xlsx",
) or (
    BASE_DIR
    / "data"
    / "4. FRM-AZM-602-021 Follow up Evaluasi dan Strategi BoD Register.xlsx"
)
CONFIGURED_CORRECTIVE_EXCEL_PATH = env_path(
    "CORRECTIVE_ACTION_EXCEL_PATH",
    "data/2. CORRECTIVE ACTION REGISTER.xlsx",
) or (BASE_DIR / "data" / "2. CORRECTIVE ACTION REGISTER.xlsx")
CONFIGURED_KAIZEN_EXCEL_PATH = env_path(
    "KAIZEN_RECAP_EXCEL_PATH",
    "data/5. KAIZEN RECAP.xlsx",
) or (BASE_DIR / "data" / "5. KAIZEN RECAP.xlsx")

UPLOAD_DIR = env_path("KPI_UPLOAD_DIR", "storage/uploads") or (
    BASE_DIR / "storage" / "uploads"
)
ACTIVE_UPLOAD_PATH = UPLOAD_DIR / "active_kpi.xlsx"
ACTIVE_UPLOAD_META_PATH = UPLOAD_DIR / "active_kpi.json"
MANUAL_KPI_PATH = UPLOAD_DIR / "manual_kpi.json"
MANUAL_MODULE_PATH = UPLOAD_DIR / "manual_modules.json"
HISTORY_DIR = UPLOAD_DIR / "history"
NO_WORKBOOK_PATH = UPLOAD_DIR / "__belum_ada_file_kpi__.xlsx"

RISK_UPLOAD_DIR = env_path(
    "RISK_UPLOAD_DIR",
    "storage/uploads/risk-assessment",
) or (BASE_DIR / "storage" / "uploads" / "risk-assessment")
ACTIVE_RISK_UPLOAD_PATH = RISK_UPLOAD_DIR / "active_risk_assessment.xlsx"
ACTIVE_RISK_UPLOAD_META_PATH = RISK_UPLOAD_DIR / "active_risk_assessment.json"
RISK_HISTORY_DIR = RISK_UPLOAD_DIR / "history"
NO_RISK_WORKBOOK_PATH = RISK_UPLOAD_DIR / "__belum_ada_file_risk_assessment__.xlsx"

FOLLOWUP_UPLOAD_DIR = env_path(
    "FOLLOWUP_BOD_UPLOAD_DIR",
    "storage/uploads/follow-up-bod",
) or (BASE_DIR / "storage" / "uploads" / "follow-up-bod")
ACTIVE_FOLLOWUP_UPLOAD_PATH = FOLLOWUP_UPLOAD_DIR / "active_follow_up_bod.xlsx"
ACTIVE_FOLLOWUP_UPLOAD_META_PATH = FOLLOWUP_UPLOAD_DIR / "active_follow_up_bod.json"
FOLLOWUP_HISTORY_DIR = FOLLOWUP_UPLOAD_DIR / "history"
NO_FOLLOWUP_WORKBOOK_PATH = FOLLOWUP_UPLOAD_DIR / "__belum_ada_file_follow_up_bod__.xlsx"

CORRECTIVE_UPLOAD_DIR = env_path(
    "CORRECTIVE_ACTION_UPLOAD_DIR",
    "storage/uploads/corrective-action",
) or (BASE_DIR / "storage" / "uploads" / "corrective-action")
ACTIVE_CORRECTIVE_UPLOAD_PATH = CORRECTIVE_UPLOAD_DIR / "active_corrective_action.xlsx"
ACTIVE_CORRECTIVE_UPLOAD_META_PATH = CORRECTIVE_UPLOAD_DIR / "active_corrective_action.json"
CORRECTIVE_HISTORY_DIR = CORRECTIVE_UPLOAD_DIR / "history"
NO_CORRECTIVE_WORKBOOK_PATH = CORRECTIVE_UPLOAD_DIR / "__belum_ada_file_corrective_action__.xlsx"

KAIZEN_UPLOAD_DIR = env_path(
    "KAIZEN_RECAP_UPLOAD_DIR",
    "storage/uploads/kaizen-recap",
) or (BASE_DIR / "storage" / "uploads" / "kaizen-recap")
ACTIVE_KAIZEN_UPLOAD_PATH = KAIZEN_UPLOAD_DIR / "active_kaizen_recap.xlsx"
ACTIVE_KAIZEN_UPLOAD_META_PATH = KAIZEN_UPLOAD_DIR / "active_kaizen_recap.json"
KAIZEN_HISTORY_DIR = KAIZEN_UPLOAD_DIR / "history"
NO_KAIZEN_WORKBOOK_PATH = KAIZEN_UPLOAD_DIR / "__belum_ada_file_kaizen_recap__.xlsx"

IGNORED_SHEETS = [
    item.strip()
    for item in os.getenv("KPI_IGNORED_SHEETS", "MENU,LIST").split(",")
    if item.strip()
]

DEFAULT_MONTH = int(os.getenv("KPI_DEFAULT_MONTH", "8"))
PORT = int(os.getenv("PORT", "5001"))
HOST = os.getenv("HOST", "127.0.0.1")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://127.0.0.1:8001")
MAX_UPLOAD_MB = max(1, int(os.getenv("KPI_MAX_UPLOAD_MB", "25")))
ALLOWED_EXTENSIONS = {".xlsx"}

DIVISION_DASHBOARDS = {
    "hrd": "HRD",
    "qms": "QMS",
    "legal": "Legal",
    "it": "IT",
    "finance": "Finance",
}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024
manual_kpi_lock = RLock()
manual_module_lock = RLock()
risk_upload_lock = RLock()
followup_upload_lock = RLock()
corrective_upload_lock = RLock()
kaizen_upload_lock = RLock()


def ensure_persistent_storage() -> None:
    """Membuat penyimpanan server yang tidak bergantung pada sesi browser."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    RISK_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    RISK_HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    FOLLOWUP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    FOLLOWUP_HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    CORRECTIVE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    CORRECTIVE_HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    KAIZEN_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    KAIZEN_HISTORY_DIR.mkdir(parents=True, exist_ok=True)


def empty_manual_store() -> dict[str, Any]:
    return {"version": 1, "records": []}


def read_manual_store() -> dict[str, Any]:
    """Membaca input/edit KPI yang dibuat melalui dashboard."""
    ensure_persistent_storage()
    if not MANUAL_KPI_PATH.is_file():
        return empty_manual_store()

    try:
        data = json.loads(MANUAL_KPI_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return empty_manual_store()

    records = data.get("records") if isinstance(data, dict) else None
    if not isinstance(records, list):
        return empty_manual_store()

    return {"version": 1, "records": [item for item in records if isinstance(item, dict)]}


def write_manual_store(store: dict[str, Any]) -> None:
    """Menyimpan data edit secara atomik dan persisten."""
    ensure_persistent_storage()
    temporary_path = UPLOAD_DIR / f".manual-kpi-{uuid.uuid4().hex}.json"
    temporary_path.write_text(
        json.dumps(store, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary_path, MANUAL_KPI_PATH)


def clean_text(value: Any, maximum: int = 500) -> str:
    text = str(value or "").strip()
    return text[:maximum]


def division_key(value: Any) -> str:
    return normalize_label(value)


def base_item_key(division: str, month: int, item: dict[str, Any]) -> str:
    plan_row = item.get("plan_row")
    actual_row = item.get("actual_row")
    if plan_row is not None and actual_row is not None:
        return f"excel:{division_key(division)}:{month}:{plan_row}:{actual_row}"

    signature = "|".join(
        normalize_label(item.get(field))
        for field in ("kpi", "variable", "unit", "target")
    )
    digest = hashlib.sha1(signature.encode("utf-8")).hexdigest()[:12]
    return f"excel:{division_key(division)}:{month}:sig:{digest}"


def evaluate_manual_item(item: dict[str, Any]) -> dict[str, str]:
    """Menilai data manual dengan aturan yang dipilih PIC QMS."""
    plan = item.get("plan")
    actual = item.get("actual")
    comparator = clean_text(item.get("comparator") or "auto", 20).lower()

    if comparator == "auto":
        return repository.parser._evaluate(
            kpi_name=clean_text(item.get("kpi")),
            variable=item.get("variable"),
            unit=item.get("unit"),
            target=item.get("target"),
            plan=plan,
            actual=actual,
        )

    if is_blank(plan) and is_blank(actual):
        return {
            "status": "tidak_dijadwalkan",
            "status_label": "Tidak dijadwalkan",
            "reason": "Plan dan Actual bulan ini kosong.",
        }
    if is_blank(plan):
        return {
            "status": "belum_lengkap",
            "status_label": "Belum lengkap",
            "reason": "Actual tersedia, tetapi Plan bulan ini kosong.",
        }
    if is_no_report(actual):
        return {
            "status": "belum_ada_laporan",
            "status_label": "Laporan belum diterima",
            "reason": "Actual belum dilaporkan oleh PIC divisi.",
        }
    if is_blank(actual):
        return {
            "status": "belum_lengkap",
            "status_label": "Belum lengkap",
            "reason": "Plan tersedia, tetapi Actual bulan ini belum diisi.",
        }

    plan_number = parse_number(plan)
    actual_number = parse_number(actual)
    if plan_number is None or actual_number is None:
        passed = normalize_label(plan) == normalize_label(actual)
        return repository.parser._comparison_result(
            passed,
            "Plan dan Actual dibandingkan sebagai teks.",
        )

    tolerance = max(abs(plan_number), 1.0) * 1e-9
    if comparator == "lte":
        passed = actual_number <= plan_number + tolerance
        reason = f"Actual harus ≤ Plan ({actual_number:g} ≤ {plan_number:g})."
    elif comparator == "lt":
        passed = actual_number < plan_number - tolerance
        reason = f"Actual harus < Plan ({actual_number:g} < {plan_number:g})."
    elif comparator == "gt":
        passed = actual_number > plan_number + tolerance
        reason = f"Actual harus > Plan ({actual_number:g} > {plan_number:g})."
    elif comparator == "eq":
        passed = abs(actual_number - plan_number) <= tolerance
        reason = f"Actual harus sama dengan Plan ({actual_number:g} = {plan_number:g})."
    else:
        passed = actual_number + tolerance >= plan_number
        reason = f"Actual harus ≥ Plan ({actual_number:g} ≥ {plan_number:g})."

    return repository.parser._comparison_result(passed, reason)


def decorate_item(
    item: dict[str, Any],
    *,
    division: str,
    month: int,
    source: str,
    record_id: str | None = None,
    item_key: str | None = None,
    comparator: str = "auto",
) -> dict[str, Any]:
    result = dict(item)
    result["source"] = source
    result["record_id"] = record_id
    result["item_key"] = item_key or base_item_key(division, month, item)
    result["comparator"] = comparator or "auto"
    result["editable"] = True
    return result


def apply_manual_kpi(payload: dict[str, Any], month: int) -> dict[str, Any]:
    """Menggabungkan workbook dengan input/edit KPI dari dashboard."""
    with manual_kpi_lock:
        records = read_manual_store().get("records", [])

    month_records = [
        record for record in records
        if int(record.get("month") or 0) == month
    ]
    overrides = {
        str(record.get("base_key")): record
        for record in month_records
        if record.get("mode") == "override" and record.get("base_key")
    }
    manual_by_division: dict[str, list[dict[str, Any]]] = {}
    for record in month_records:
        if record.get("mode") != "manual":
            continue
        manual_by_division.setdefault(division_key(record.get("division")), []).append(record)

    rebuilt_divisions: list[dict[str, Any]] = []
    seen_division_keys: set[str] = set()

    for division in payload.get("divisions", []):
        name = clean_text(division.get("division"), 120)
        normalized_division = division_key(name)
        seen_division_keys.add(normalized_division)
        items: list[dict[str, Any]] = []

        for base_item in division.get("items", []):
            key = base_item_key(name, month, base_item)
            record = overrides.get(key)
            if record is None:
                items.append(decorate_item(
                    base_item, division=name, month=month, source="excel", item_key=key
                ))
                continue

            merged = dict(base_item)
            for field in ("kpi", "variable", "unit", "target", "plan", "actual"):
                merged[field] = record.get(field, merged.get(field, "-"))
            evaluation = evaluate_manual_item({**merged, "comparator": record.get("comparator", "auto")})
            merged.update(evaluation)
            items.append(decorate_item(
                merged,
                division=name,
                month=month,
                source="override",
                record_id=str(record.get("id")),
                item_key=key,
                comparator=str(record.get("comparator") or "auto"),
            ))

        for record in manual_by_division.get(normalized_division, []):
            manual_item = {
                "kpi": record.get("kpi") or "KPI baru",
                "variable": record.get("variable") or "-",
                "unit": record.get("unit") or "-",
                "target": record.get("target") or "-",
                "plan": record.get("plan") or "-",
                "actual": record.get("actual") or "-",
            }
            manual_item.update(evaluate_manual_item({**manual_item, "comparator": record.get("comparator", "auto")}))
            manual_item["plan_row"] = None
            manual_item["actual_row"] = None
            items.append(decorate_item(
                manual_item,
                division=name,
                month=month,
                source="manual",
                record_id=str(record.get("id")),
                item_key=f"manual:{record.get('id')}",
                comparator=str(record.get("comparator") or "auto"),
            ))

        rebuilt_divisions.append(repository.parser._division_result(
            name, month, items, message=division.get("message")
        ))

    # Menjaga data manual tetap tampil jika sheet terkait tidak terbaca sementara.
    for normalized_division, division_records in manual_by_division.items():
        if normalized_division in seen_division_keys:
            continue
        name = clean_text(division_records[0].get("division"), 120) or "Divisi"
        items = []
        for record in division_records:
            item = {
                "kpi": record.get("kpi") or "KPI baru",
                "variable": record.get("variable") or "-",
                "unit": record.get("unit") or "-",
                "target": record.get("target") or "-",
                "plan": record.get("plan") or "-",
                "actual": record.get("actual") or "-",
            }
            item.update(evaluate_manual_item({**item, "comparator": record.get("comparator", "auto")}))
            items.append(decorate_item(
                item, division=name, month=month, source="manual",
                record_id=str(record.get("id")), item_key=f"manual:{record.get('id')}",
                comparator=str(record.get("comparator") or "auto"),
            ))
        rebuilt_divisions.append(repository.parser._division_result(name, month, items))

    rebuilt = repository.parser._build_month_summary(month, rebuilt_divisions)
    rebuilt["manual_data"] = {
        "records_for_month": len(month_records),
        "storage_file": str(MANUAL_KPI_PATH),
        "persistent": True,
    }
    return rebuilt



# ---------------------------------------------------------------------------
# Manual editor untuk Corrective Action, Risk Assessment, Follow-up BoD,
# dan Kaizen. Excel tetap menjadi sumber awal; perubahan dashboard disimpan
# sebagai override persisten pada storage/uploads/manual_modules.json.
# ---------------------------------------------------------------------------

MANUAL_MODULES = {"corrective", "risk", "followup", "kaizen"}


def empty_manual_module_store() -> dict[str, Any]:
    return {"version": 1, "records": []}


def read_manual_module_store() -> dict[str, Any]:
    ensure_persistent_storage()
    if not MANUAL_MODULE_PATH.is_file():
        return empty_manual_module_store()
    try:
        data = json.loads(MANUAL_MODULE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return empty_manual_module_store()
    records = data.get("records") if isinstance(data, dict) else None
    if not isinstance(records, list):
        return empty_manual_module_store()
    return {
        "version": 1,
        "records": [item for item in records if isinstance(item, dict)],
    }


def write_manual_module_store(store: dict[str, Any]) -> None:
    ensure_persistent_storage()
    temporary_path = UPLOAD_DIR / f".manual-modules-{uuid.uuid4().hex}.json"
    temporary_path.write_text(
        json.dumps(store, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary_path, MANUAL_MODULE_PATH)


def manual_records_for(module: str) -> list[dict[str, Any]]:
    with manual_module_lock:
        records = read_manual_module_store().get("records", [])
    return [
        item for item in records
        if item.get("module") == module and isinstance(item.get("values"), dict)
    ]


def iso_date(value: Any) -> str | None:
    text = clean_text(value, 40)
    if not text:
        return None
    if re.fullmatch(r"20\d{2}-\d{2}-\d{2}", text):
        try:
            return date.fromisoformat(text).isoformat()
        except ValueError:
            return None
    return None


def date_label(value: Any) -> str:
    text = clean_text(value, 80)
    parsed = iso_date(text)
    if not parsed:
        return text or "-"
    current = date.fromisoformat(parsed)
    short = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "Mei", 6: "Jun",
        7: "Jul", 8: "Agu", 9: "Sep", 10: "Okt", 11: "Nov", 12: "Des",
    }
    return f"{current.day:02d} {short[current.month]} {current.year}"


def pct(part: int, total: int) -> float:
    return round((part / total) * 100, 1) if total else 0.0


def status_key(value: Any, module: str) -> str:
    key = normalize_label(value)
    if module == "corrective":
        if any(word in key for word in ("closed", "close", "selesai", "done", "complete")):
            return "closed"
        if any(word in key for word in ("progress", "ongoing", "berjalan", "proses")):
            return "in_progress"
        if any(word in key for word in ("open", "pending", "belum", "todo")):
            return "open"
        return "unknown"
    if module == "followup":
        if any(word in key for word in ("done", "selesai", "closed", "complete")):
            return "done"
        if any(word in key for word in ("progress", "ongoing", "berjalan", "proses")):
            return "in_progress"
        if any(word in key for word in ("open", "pending", "belum", "todo")):
            return "open"
        return "unknown"
    return key


def risk_grade(value: Any) -> str:
    text = clean_text(value, 20).upper()
    match = re.search(r"\b([A-E])\b", text)
    return match.group(1) if match else "C"


RISK_GRADE_LABELS = {
    "A": "Rendah", "B": "Cukup Rendah", "C": "Sedang",
    "D": "Tinggi", "E": "Sangat Tinggi",
}
RISK_GRADE_ORDER = ["A", "B", "C", "D", "E"]
RISK_TYPE_ORDER_MANUAL = ["Strategic", "Operational", "Financial", "Compliance"]
FOLLOWUP_STATUS_LABELS = {
    "done": "Selesai", "in_progress": "Sedang berjalan",
    "open": "Belum dimulai", "unknown": "Status belum jelas",
}
CORRECTIVE_STATUS_LABELS = {
    "open": "Open", "in_progress": "On Progress",
    "closed": "Closed", "unknown": "Status belum jelas",
}


def merge_manual_records(
    base_records: list[dict[str, Any]],
    module: str,
    id_field: str,
) -> list[dict[str, Any]]:
    records = [dict(item) for item in base_records]
    indexed = {str(item.get(id_field) or item.get("id") or ""): item for item in records}
    manual_rows: list[dict[str, Any]] = []
    for change in manual_records_for(module):
        values = dict(change.get("values") or {})
        base_id = clean_text(change.get("base_id"), 180)
        if change.get("mode") == "override" and base_id and base_id in indexed:
            indexed[base_id].update(values)
            indexed[base_id]["manual_record_id"] = change.get("id")
            indexed[base_id]["source"] = "override"
        else:
            row = dict(values)
            row["manual_record_id"] = change.get("id")
            row["source"] = "manual"
            if not row.get(id_field):
                row[id_field] = f"manual:{change.get('id')}"
            manual_rows.append(row)
    records.extend(manual_rows)
    return records


def rebuild_corrective_payload(payload: dict[str, Any]) -> dict[str, Any]:
    records = merge_manual_records(
        list(payload.get("records") or []), "corrective", "id"
    )
    now = date.today()
    cleaned: list[dict[str, Any]] = []
    for index, item in enumerate(records, start=1):
        row = dict(item)
        row["id"] = clean_text(row.get("id"), 180) or f"manual-corrective:{index}"
        row["car_number"] = clean_text(row.get("car_number"), 120) or f"CAR-MANUAL-{index:03d}"
        row["audit_date_iso"] = iso_date(row.get("audit_date_iso") or row.get("audit_date"))
        row["audit_date"] = date_label(row.get("audit_date_iso") or row.get("audit_date"))
        row["division"] = clean_text(row.get("division"), 160) or "Belum ditentukan"
        row["department"] = clean_text(row.get("department"), 160) or "-"
        row["description"] = clean_text(row.get("description"), 4000) or "-"
        row["grade"] = clean_text(row.get("grade"), 100) or "-"
        row["pic"] = clean_text(row.get("pic"), 250) or "-"
        row["audit_type"] = clean_text(row.get("audit_type"), 160) or "Manual"
        row["target_date_iso"] = iso_date(row.get("target_date_iso") or row.get("target_date"))
        row["target_date"] = date_label(row.get("target_date_iso") or row.get("target_date"))
        row["corrective_action"] = clean_text(row.get("corrective_action"), 4000) or "-"
        row["status"] = status_key(row.get("status"), "corrective")
        row["status_label"] = CORRECTIVE_STATUS_LABELS[row["status"]]
        row["overdue"] = bool(
            row.get("target_date_iso")
            and row["status"] != "closed"
            and date.fromisoformat(row["target_date_iso"]) < now
        )
        cleaned.append(row)

    total = len(cleaned)
    status_counts = Counter(item["status"] for item in cleaned)
    division_counts = Counter(item["division"] for item in cleaned)
    audit_counts = Counter(item["audit_type"] for item in cleaned)
    grade_counts = Counter(item["grade"] for item in cleaned)
    status_order = ["open", "in_progress", "closed", "unknown"]
    status_distribution = [
        {
            "status": status,
            "label": CORRECTIVE_STATUS_LABELS[status],
            "count": int(status_counts[status]),
            "percentage": pct(int(status_counts[status]), total),
        }
        for status in status_order if status_counts[status] or status != "unknown"
    ]
    division_distribution = [
        {
            "division": division,
            "count": int(count),
            "open": sum(1 for item in cleaned if item["division"] == division and item["status"] == "open"),
            "in_progress": sum(1 for item in cleaned if item["division"] == division and item["status"] == "in_progress"),
            "closed": sum(1 for item in cleaned if item["division"] == division and item["status"] == "closed"),
        }
        for division, count in sorted(division_counts.items(), key=lambda pair: (-pair[1], pair[0].casefold()))
    ]
    result = dict(payload)
    result.update({
        "available": True,
        "total_actions": total,
        "summary": {
            "total": total,
            "open": int(status_counts["open"]),
            "in_progress": int(status_counts["in_progress"]),
            "closed": int(status_counts["closed"]),
            "unknown": int(status_counts["unknown"]),
            "overdue": sum(1 for item in cleaned if item.get("overdue")),
            "completion_percentage": pct(int(status_counts["closed"]), total),
            "active_percentage": pct(int(status_counts["open"] + status_counts["in_progress"]), total),
        },
        "status_distribution": status_distribution,
        "division_distribution": division_distribution,
        "records": cleaned,
        "filters": {
            "statuses": [{"value": row["status"], "label": row["label"], "count": row["count"]} for row in status_distribution],
            "divisions": [{"value": row["division"], "label": row["division"], "count": row["count"]} for row in division_distribution],
            "audit_types": [{"value": label, "label": label, "count": int(count)} for label, count in sorted(audit_counts.items(), key=lambda pair: (-pair[1], pair[0].casefold()))],
            "grades": [{"value": label, "label": label, "count": int(count)} for label, count in sorted(grade_counts.items(), key=lambda pair: (-pair[1], pair[0].casefold()))],
        },
    })
    result["manual_data"] = {"storage_file": str(MANUAL_MODULE_PATH), "persistent": True}
    return result


def rebuild_risk_payload(payload: dict[str, Any]) -> dict[str, Any]:
    records = merge_manual_records(list(payload.get("records") or []), "risk", "risk_id")
    cleaned: list[dict[str, Any]] = []
    for index, item in enumerate(records, start=1):
        row = dict(item)
        row["risk_id"] = clean_text(row.get("risk_id"), 140) or f"R-MANUAL-{index:04d}"
        row["number"] = clean_text(row.get("number"), 50) or str(index)
        row["risk_type"] = clean_text(row.get("risk_type"), 80).title() or "Operational"
        row["division"] = clean_text(row.get("division"), 160) or "Belum ditentukan"
        row["description"] = clean_text(row.get("description"), 4000) or "-"
        row["before_grade"] = risk_grade(row.get("before_grade"))
        row["after_grade"] = risk_grade(row.get("after_grade"))
        row["before_score"] = parse_number(row.get("before_score"))
        row["after_score"] = parse_number(row.get("after_score"))
        row["before_level"] = RISK_GRADE_LABELS[row["before_grade"]]
        row["after_level"] = RISK_GRADE_LABELS[row["after_grade"]]
        before_rank = RISK_GRADE_ORDER.index(row["before_grade"])
        after_rank = RISK_GRADE_ORDER.index(row["after_grade"])
        row["transition"] = "improved" if after_rank < before_rank else "worsened" if after_rank > before_rank else "unchanged"
        row["mitigation"] = clean_text(row.get("mitigation"), 4000) or "-"
        row["pic"] = clean_text(row.get("pic"), 250) or "-"
        row["due_date"] = clean_text(row.get("due_date"), 120) or "-"
        cleaned.append(row)

    total = len(cleaned)
    type_counts = Counter(item["risk_type"] for item in cleaned)
    before_counts = Counter(item["before_grade"] for item in cleaned)
    after_counts = Counter(item["after_grade"] for item in cleaned)
    transitions = Counter(item["transition"] for item in cleaned)
    divisions = Counter(item["division"] for item in cleaned)
    ordered_types = RISK_TYPE_ORDER_MANUAL + sorted(t for t in type_counts if t not in RISK_TYPE_ORDER_MANUAL)
    risk_types = []
    for risk_type in ordered_types:
        count = int(type_counts[risk_type])
        if not count and risk_type not in RISK_TYPE_ORDER_MANUAL:
            continue
        risk_types.append({
            "key": normalize_label(risk_type).replace(" ", "_"),
            "label": risk_type,
            "count": count,
            "percentage": pct(count, total),
            "high_before": sum(1 for item in cleaned if item["risk_type"] == risk_type and item["before_grade"] in {"D", "E"}),
            "high_after": sum(1 for item in cleaned if item["risk_type"] == risk_type and item["after_grade"] in {"D", "E"}),
        })
    grade_comparison = [{
        "grade": grade,
        "level": RISK_GRADE_LABELS[grade],
        "before": int(before_counts[grade]),
        "after": int(after_counts[grade]),
        "difference": int(after_counts[grade] - before_counts[grade]),
    } for grade in RISK_GRADE_ORDER]
    before_high = int(before_counts["D"] + before_counts["E"])
    after_high = int(after_counts["D"] + after_counts["E"])
    reduction = max(0, before_high - after_high)
    division_breakdown = [{
        "division": division,
        "count": int(count),
        "high_before": sum(1 for item in cleaned if item["division"] == division and item["before_grade"] in {"D", "E"}),
        "high_after": sum(1 for item in cleaned if item["division"] == division and item["after_grade"] in {"D", "E"}),
    } for division, count in sorted(divisions.items(), key=lambda pair: (-pair[1], pair[0].casefold()))]
    result = dict(payload)
    result.update({
        "available": True,
        "total_risks": total,
        "total_divisions": len(divisions),
        "risk_types": risk_types,
        "grade_comparison": grade_comparison,
        "high_risk": {
            "before": before_high,
            "after": after_high,
            "reduction": reduction,
            "reduction_percentage": pct(reduction, before_high),
        },
        "mitigation_effectiveness": {
            "improved": int(transitions["improved"]),
            "unchanged": int(transitions["unchanged"]),
            "worsened": int(transitions["worsened"]),
        },
        "division_breakdown": division_breakdown,
        "records": cleaned,
    })
    result["manual_data"] = {"storage_file": str(MANUAL_MODULE_PATH), "persistent": True}
    return result


def followup_priority(value: Any) -> str:
    key = normalize_label(value)
    if "critical" in key or "kritis" in key: return "Critical"
    if "high" in key or "tinggi" in key: return "High"
    if "medium" in key or "sedang" in key: return "Medium"
    if "low" in key or "rendah" in key: return "Low"
    return "Belum ditentukan"


def followup_month_label(month_key: str) -> str:
    try:
        year, month = map(int, month_key.split("-"))
        return f"{MONTH_NAMES.get(month, month)} {year}"
    except Exception:
        return month_key or "Periode"


def rebuild_followup_payload(payload: dict[str, Any]) -> dict[str, Any]:
    records = merge_manual_records(list(payload.get("records") or []), "followup", "id")
    cleaned: list[dict[str, Any]] = []
    today = date.today()
    for index, item in enumerate(records, start=1):
        row = dict(item)
        month_key = clean_text(row.get("month"), 20)
        if not re.fullmatch(r"20\d{2}-(0[1-9]|1[0-2])", month_key):
            month_key = f"2026-{int(row.get('month_number') or 1):02d}"
        year, month_number_value = map(int, month_key.split("-"))
        row["id"] = clean_text(row.get("id"), 160) or f"manual-followup:{index}"
        row["number"] = clean_text(row.get("number"), 50) or str(index)
        row["month"] = month_key
        row["month_label"] = followup_month_label(month_key)
        row["year"] = year
        row["month_number"] = month_number_value
        row["action_item"] = clean_text(row.get("action_item"), 4000) or "Tugas baru"
        row["pic"] = clean_text(row.get("pic"), 300) or "Belum ditentukan"
        row["owner_terms"] = [part.strip() for part in re.split(r"[/+&,]", row["pic"]) if part.strip()]
        row["due_date_iso"] = iso_date(row.get("due_date_iso") or row.get("due_date"))
        row["due_date"] = date_label(row.get("due_date_iso") or row.get("due_date"))
        row["status"] = status_key(row.get("status"), "followup")
        row["status_label"] = FOLLOWUP_STATUS_LABELS[row["status"]]
        row["priority"] = followup_priority(row.get("priority"))
        row["follow_up"] = clean_text(row.get("follow_up"), 2000) or "-"
        row["notes"] = clean_text(row.get("notes"), 2000) or "-"
        row["overdue"] = bool(row.get("due_date_iso") and row["status"] != "done" and date.fromisoformat(row["due_date_iso"]) < today)
        cleaned.append(row)

    cleaned.sort(key=lambda item: (item["month"], str(item.get("number") or "")))
    total = len(cleaned)
    status_counts = Counter(item["status"] for item in cleaned)
    priority_counts = Counter(item["priority"] for item in cleaned)
    owner_counts = Counter(item["pic"] for item in cleaned)
    months: list[dict[str, Any]] = []
    for month_key in sorted({item["month"] for item in cleaned}):
        rows = [item for item in cleaned if item["month"] == month_key]
        counts = Counter(item["status"] for item in rows)
        done = int(counts["done"])
        months.append({
            "key": month_key,
            "label": followup_month_label(month_key),
            "short_label": followup_month_label(month_key),
            "total": len(rows),
            "done": done,
            "in_progress": int(counts["in_progress"]),
            "open": int(counts["open"]),
            "unknown": int(counts["unknown"]),
            "overdue": sum(1 for item in rows if item.get("overdue")),
            "completion_percentage": pct(done, len(rows)),
        })
    status_order = ["done", "in_progress", "open", "unknown"]
    status_distribution = [{
        "status": status,
        "label": FOLLOWUP_STATUS_LABELS[status],
        "count": int(status_counts[status]),
        "percentage": pct(int(status_counts[status]), total),
    } for status in status_order if status_counts[status] or status != "unknown"]
    priority_order = ["Critical", "High", "Medium", "Low", "Belum ditentukan"]
    priority_distribution = [{
        "priority": priority,
        "count": int(priority_counts[priority]),
        "percentage": pct(int(priority_counts[priority]), total),
    } for priority in priority_order if priority_counts[priority]]
    owner_distribution = [{
        "owner": owner,
        "count": int(count),
        "done": sum(1 for item in cleaned if item["pic"] == owner and item["status"] == "done"),
        "in_progress": sum(1 for item in cleaned if item["pic"] == owner and item["status"] == "in_progress"),
        "open": sum(1 for item in cleaned if item["pic"] == owner and item["status"] == "open"),
    } for owner, count in sorted(owner_counts.items(), key=lambda pair: (-pair[1], pair[0].casefold()))]
    result = dict(payload)
    result.update({
        "available": True,
        "total_tasks": total,
        "summary": {
            "total": total,
            "done": int(status_counts["done"]),
            "in_progress": int(status_counts["in_progress"]),
            "open": int(status_counts["open"]),
            "unknown": int(status_counts["unknown"]),
            "overdue": sum(1 for item in cleaned if item.get("overdue")),
            "completion_percentage": pct(int(status_counts["done"]), total),
        },
        "months": months,
        "latest_month": months[-1]["key"] if months else "",
        "status_distribution": status_distribution,
        "priority_distribution": priority_distribution,
        "owner_distribution": owner_distribution,
        "records": cleaned,
        "filters": {
            "months": [{"value": row["key"], "label": row["label"], "count": row["total"]} for row in months],
            "statuses": [{"value": row["status"], "label": row["label"], "count": row["count"]} for row in status_distribution],
            "owners": [{"value": row["owner"], "label": row["owner"], "count": row["count"]} for row in owner_distribution],
            "priorities": [{"value": row["priority"], "label": row["priority"], "count": row["count"]} for row in priority_distribution],
        },
    })
    result["manual_data"] = {"storage_file": str(MANUAL_MODULE_PATH), "persistent": True}
    return result


def rebuild_kaizen_payload(payload: dict[str, Any]) -> dict[str, Any]:
    base_records = list(payload.get("records") or payload.get("top_10") or [])
    records = merge_manual_records(base_records, "kaizen", "id")
    cleaned: list[dict[str, Any]] = []
    for index, item in enumerate(records, start=1):
        row = dict(item)
        row["id"] = clean_text(row.get("id"), 160) or f"manual-kaizen:{index}"
        row["name"] = clean_text(row.get("name"), 220) or "Peserta Kaizen"
        row["idea_number"] = clean_text(row.get("idea_number"), 80)
        row["area"] = clean_text(row.get("area"), 220)
        row["idea"] = clean_text(row.get("idea"), 4000)
        director = parse_number(row.get("director_average"))
        manager = parse_number(row.get("manager_average"))
        score = parse_number(row.get("score"))
        if director is not None and manager is not None:
            score = (0.60 * director) + (0.40 * manager)
        if score is None:
            score = 0.0
        row["director_average"] = None if director is None else round(float(director), 2)
        row["manager_average"] = None if manager is None else round(float(manager), 2)
        row["score"] = round(float(score), 2)
        cleaned.append(row)
    cleaned.sort(key=lambda item: (-float(item.get("score") or 0), item["name"].casefold()))
    for rank, row in enumerate(cleaned, start=1):
        row["rank"] = rank
    top_10 = [dict(row) for row in cleaned[:10]]
    result = dict(payload)
    result.update({
        "available": bool(cleaned),
        "ranking_basis": "Weighted Average 60/40",
        "ranking_note": "Score = 60% Director's Average + 40% Manager's Average",
        "visible_limit": 5,
        "top_limit": 10,
        "total_scored_entries": len(cleaned),
        "winner": top_10[0] if top_10 else None,
        "top_10": top_10,
        "records": cleaned,
    })
    result["manual_data"] = {"storage_file": str(MANUAL_MODULE_PATH), "persistent": True}
    return result


def validate_manual_module_values(module: str, raw: dict[str, Any]) -> dict[str, Any]:
    if module == "corrective":
        return {
            "car_number": clean_text(raw.get("car_number"), 120),
            "audit_date_iso": iso_date(raw.get("audit_date_iso") or raw.get("audit_date")),
            "division": clean_text(raw.get("division"), 160),
            "department": clean_text(raw.get("department"), 160),
            "description": clean_text(raw.get("description"), 4000),
            "grade": clean_text(raw.get("grade"), 100),
            "pic": clean_text(raw.get("pic"), 250),
            "audit_type": clean_text(raw.get("audit_type"), 160),
            "target_date_iso": iso_date(raw.get("target_date_iso") or raw.get("target_date")),
            "corrective_action": clean_text(raw.get("corrective_action"), 4000),
            "status": status_key(raw.get("status"), "corrective"),
        }
    if module == "risk":
        return {
            "risk_id": clean_text(raw.get("risk_id"), 140),
            "risk_type": clean_text(raw.get("risk_type"), 80),
            "division": clean_text(raw.get("division"), 160),
            "description": clean_text(raw.get("description"), 4000),
            "before_score": parse_number(raw.get("before_score")),
            "before_grade": risk_grade(raw.get("before_grade")),
            "after_score": parse_number(raw.get("after_score")),
            "after_grade": risk_grade(raw.get("after_grade")),
            "mitigation": clean_text(raw.get("mitigation"), 4000),
            "pic": clean_text(raw.get("pic"), 250),
            "due_date": clean_text(raw.get("due_date"), 120),
        }
    if module == "followup":
        month_key = clean_text(raw.get("month"), 20)
        if not re.fullmatch(r"20\d{2}-(0[1-9]|1[0-2])", month_key):
            raise ValueError("Periode Follow-up harus berformat YYYY-MM.")
        return {
            "number": clean_text(raw.get("number"), 50),
            "month": month_key,
            "action_item": clean_text(raw.get("action_item"), 4000),
            "pic": clean_text(raw.get("pic"), 300),
            "due_date_iso": iso_date(raw.get("due_date_iso") or raw.get("due_date")),
            "status": status_key(raw.get("status"), "followup"),
            "priority": followup_priority(raw.get("priority")),
            "follow_up": clean_text(raw.get("follow_up"), 2000),
            "notes": clean_text(raw.get("notes"), 2000),
        }
    if module == "kaizen":
        return {
            "name": clean_text(raw.get("name"), 220),
            "idea_number": clean_text(raw.get("idea_number"), 80),
            "area": clean_text(raw.get("area"), 220),
            "idea": clean_text(raw.get("idea"), 4000),
            "director_average": parse_number(raw.get("director_average")),
            "manager_average": parse_number(raw.get("manager_average")),
            "score": parse_number(raw.get("score")),
        }
    raise ValueError("Modul edit tidak dikenali.")


def read_upload_metadata() -> dict[str, Any]:
    if not ACTIVE_UPLOAD_META_PATH.is_file():
        return {}

    try:
        data = json.loads(ACTIVE_UPLOAD_META_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}

    return data if isinstance(data, dict) else {}


def write_upload_metadata(metadata: dict[str, Any]) -> None:
    """Menulis status workbook aktif secara atomik agar tidak mudah rusak."""
    ensure_persistent_storage()
    temporary_meta = UPLOAD_DIR / f".active-kpi-{uuid.uuid4().hex}.json"
    temporary_meta.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary_meta, ACTIVE_UPLOAD_META_PATH)


def history_path_from_metadata(metadata: dict[str, Any]) -> Path | None:
    raw_path = str(metadata.get("history_file") or "").strip()
    if not raw_path:
        return None

    candidate = (UPLOAD_DIR / raw_path).resolve()
    try:
        candidate.relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        return None

    return candidate if candidate.is_file() else None


def recover_active_upload() -> bool:
    """Memulihkan file aktif dari riwayat bila active_kpi.xlsx terhapus."""
    ensure_persistent_storage()
    if ACTIVE_UPLOAD_PATH.is_file():
        return True

    metadata = read_upload_metadata()
    history_path = history_path_from_metadata(metadata)
    if history_path is None:
        history_files = sorted(
            HISTORY_DIR.glob("*.xlsx"),
            key=lambda path: path.stat().st_mtime,
            reverse=True,
        )
        history_path = history_files[0] if history_files else None

    if history_path is None:
        return False

    shutil.copy2(history_path, ACTIVE_UPLOAD_PATH)
    return ACTIVE_UPLOAD_PATH.is_file()


def active_excel_path() -> Path:
    """Menentukan workbook KPI aktif yang tersimpan permanen pada server."""
    if recover_active_upload():
        return ACTIVE_UPLOAD_PATH

    if CONFIGURED_EXCEL_PATH is not None:
        return CONFIGURED_EXCEL_PATH

    return NO_WORKBOOK_PATH


def read_risk_upload_metadata() -> dict[str, Any]:
    if not ACTIVE_RISK_UPLOAD_META_PATH.is_file():
        return {}
    try:
        data = json.loads(ACTIVE_RISK_UPLOAD_META_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def write_risk_upload_metadata(metadata: dict[str, Any]) -> None:
    ensure_persistent_storage()
    temporary_meta = RISK_UPLOAD_DIR / f".active-risk-{uuid.uuid4().hex}.json"
    temporary_meta.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary_meta, ACTIVE_RISK_UPLOAD_META_PATH)


def risk_history_path_from_metadata(metadata: dict[str, Any]) -> Path | None:
    raw_path = str(metadata.get("history_file") or "").strip()
    if not raw_path:
        return None

    candidate = (RISK_UPLOAD_DIR / raw_path).resolve()
    try:
        candidate.relative_to(RISK_UPLOAD_DIR.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def recover_active_risk_upload() -> bool:
    """Memulihkan file Risk Assessment aktif dari riwayat upload."""
    ensure_persistent_storage()
    if ACTIVE_RISK_UPLOAD_PATH.is_file():
        return True

    metadata = read_risk_upload_metadata()
    history_path = risk_history_path_from_metadata(metadata)
    if history_path is None:
        history_files = sorted(
            RISK_HISTORY_DIR.glob("*.xlsx"),
            key=lambda item: item.stat().st_mtime,
            reverse=True,
        )
        history_path = history_files[0] if history_files else None

    if history_path is None:
        return False

    shutil.copy2(history_path, ACTIVE_RISK_UPLOAD_PATH)
    return ACTIVE_RISK_UPLOAD_PATH.is_file()


def read_followup_upload_metadata() -> dict[str, Any]:
    if not ACTIVE_FOLLOWUP_UPLOAD_META_PATH.is_file():
        return {}
    try:
        data = json.loads(ACTIVE_FOLLOWUP_UPLOAD_META_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def write_followup_upload_metadata(metadata: dict[str, Any]) -> None:
    ensure_persistent_storage()
    temporary_meta = FOLLOWUP_UPLOAD_DIR / f".active-followup-{uuid.uuid4().hex}.json"
    temporary_meta.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary_meta, ACTIVE_FOLLOWUP_UPLOAD_META_PATH)


def followup_history_path_from_metadata(metadata: dict[str, Any]) -> Path | None:
    raw_path = str(metadata.get("history_file") or "").strip()
    if not raw_path:
        return None
    candidate = (FOLLOWUP_UPLOAD_DIR / raw_path).resolve()
    try:
        candidate.relative_to(FOLLOWUP_UPLOAD_DIR.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def recover_active_followup_upload() -> bool:
    """Memulihkan workbook Follow-up BoD aktif dari riwayat upload."""
    ensure_persistent_storage()
    if ACTIVE_FOLLOWUP_UPLOAD_PATH.is_file():
        return True

    metadata = read_followup_upload_metadata()
    history_path = followup_history_path_from_metadata(metadata)
    if history_path is None:
        history_files = sorted(
            FOLLOWUP_HISTORY_DIR.glob("*.xlsx"),
            key=lambda item: item.stat().st_mtime,
            reverse=True,
        )
        history_path = history_files[0] if history_files else None
    if history_path is None:
        return False
    shutil.copy2(history_path, ACTIVE_FOLLOWUP_UPLOAD_PATH)
    return ACTIVE_FOLLOWUP_UPLOAD_PATH.is_file()


def read_corrective_upload_metadata() -> dict[str, Any]:
    if not ACTIVE_CORRECTIVE_UPLOAD_META_PATH.is_file():
        return {}
    try:
        data = json.loads(
            ACTIVE_CORRECTIVE_UPLOAD_META_PATH.read_text(encoding="utf-8")
        )
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def write_corrective_upload_metadata(metadata: dict[str, Any]) -> None:
    ensure_persistent_storage()
    temporary_meta = CORRECTIVE_UPLOAD_DIR / f".active-corrective-{uuid.uuid4().hex}.json"
    temporary_meta.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary_meta, ACTIVE_CORRECTIVE_UPLOAD_META_PATH)


def corrective_history_path_from_metadata(metadata: dict[str, Any]) -> Path | None:
    raw_path = str(metadata.get("history_file") or "").strip()
    if not raw_path:
        return None
    candidate = (CORRECTIVE_UPLOAD_DIR / raw_path).resolve()
    try:
        candidate.relative_to(CORRECTIVE_UPLOAD_DIR.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def recover_active_corrective_upload() -> bool:
    """Memulihkan Corrective Action Register aktif dari riwayat upload."""
    ensure_persistent_storage()
    if ACTIVE_CORRECTIVE_UPLOAD_PATH.is_file():
        return True

    metadata = read_corrective_upload_metadata()
    history_path = corrective_history_path_from_metadata(metadata)
    if history_path is None:
        history_files = sorted(
            CORRECTIVE_HISTORY_DIR.glob("*.xlsx"),
            key=lambda item: item.stat().st_mtime,
            reverse=True,
        )
        history_path = history_files[0] if history_files else None
    if history_path is None:
        return False
    shutil.copy2(history_path, ACTIVE_CORRECTIVE_UPLOAD_PATH)
    return ACTIVE_CORRECTIVE_UPLOAD_PATH.is_file()


def active_corrective_excel_path() -> Path:
    """Menentukan Corrective Action Register yang digunakan dashboard."""
    if recover_active_corrective_upload():
        return ACTIVE_CORRECTIVE_UPLOAD_PATH
    if CONFIGURED_CORRECTIVE_EXCEL_PATH is not None:
        return CONFIGURED_CORRECTIVE_EXCEL_PATH
    return NO_CORRECTIVE_WORKBOOK_PATH


def read_kaizen_upload_metadata() -> dict[str, Any]:
    if not ACTIVE_KAIZEN_UPLOAD_META_PATH.is_file():
        return {}
    try:
        data = json.loads(ACTIVE_KAIZEN_UPLOAD_META_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def write_kaizen_upload_metadata(metadata: dict[str, Any]) -> None:
    ensure_persistent_storage()
    temporary_meta = KAIZEN_UPLOAD_DIR / f".active-kaizen-{uuid.uuid4().hex}.json"
    temporary_meta.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary_meta, ACTIVE_KAIZEN_UPLOAD_META_PATH)


def kaizen_history_path_from_metadata(metadata: dict[str, Any]) -> Path | None:
    raw_path = str(metadata.get("history_file") or "").strip()
    if not raw_path:
        return None
    candidate = (KAIZEN_UPLOAD_DIR / raw_path).resolve()
    try:
        candidate.relative_to(KAIZEN_UPLOAD_DIR.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def recover_active_kaizen_upload() -> bool:
    """Memulihkan workbook Kaizen aktif dari riwayat upload."""
    ensure_persistent_storage()
    if ACTIVE_KAIZEN_UPLOAD_PATH.is_file():
        return True

    metadata = read_kaizen_upload_metadata()
    history_path = kaizen_history_path_from_metadata(metadata)
    if history_path is None:
        history_files = sorted(
            KAIZEN_HISTORY_DIR.glob("*.xlsx"),
            key=lambda item: item.stat().st_mtime,
            reverse=True,
        )
        history_path = history_files[0] if history_files else None
    if history_path is None:
        return False
    shutil.copy2(history_path, ACTIVE_KAIZEN_UPLOAD_PATH)
    return ACTIVE_KAIZEN_UPLOAD_PATH.is_file()


def active_kaizen_excel_path() -> Path:
    """Menentukan workbook Kaizen Recap yang digunakan dashboard."""
    if recover_active_kaizen_upload():
        return ACTIVE_KAIZEN_UPLOAD_PATH
    if CONFIGURED_KAIZEN_EXCEL_PATH is not None:
        return CONFIGURED_KAIZEN_EXCEL_PATH
    return NO_KAIZEN_WORKBOOK_PATH


def active_followup_excel_path() -> Path:
    """Menentukan workbook Follow-up BoD yang digunakan dashboard."""
    if recover_active_followup_upload():
        return ACTIVE_FOLLOWUP_UPLOAD_PATH
    if CONFIGURED_FOLLOWUP_EXCEL_PATH is not None:
        return CONFIGURED_FOLLOWUP_EXCEL_PATH
    return NO_FOLLOWUP_WORKBOOK_PATH


def active_risk_excel_path() -> Path:
    """Menentukan file Risk Assessment aktif tanpa akses backend manual."""
    if recover_active_risk_upload():
        return ACTIVE_RISK_UPLOAD_PATH
    if CONFIGURED_RISK_EXCEL_PATH is not None:
        return CONFIGURED_RISK_EXCEL_PATH
    return NO_RISK_WORKBOOK_PATH


ensure_persistent_storage()

repository = CachedKpiRepository(
    KpiWorkbookParser(
        excel_path=active_excel_path(),
        ignored_sheets=IGNORED_SHEETS,
    )
)


risk_repository = CachedRiskRepository(
    RiskWorkbookParser(excel_path=active_risk_excel_path())
)

followup_repository = CachedFollowUpRepository(
    FollowUpWorkbookParser(excel_path=active_followup_excel_path())
)

corrective_repository = CachedCorrectiveActionRepository(
    CorrectiveActionWorkbookParser(excel_path=active_corrective_excel_path())
)

kaizen_repository = CachedKaizenRepository(
    KaizenWorkbookParser(excel_path=active_kaizen_excel_path(), top_limit=10)
)


def sync_repository_source() -> None:
    """Menyelaraskan repository dengan file upload/fallback yang sedang aktif."""
    expected_path = active_excel_path()
    if repository.parser.excel_path != expected_path:
        repository.set_excel_path(expected_path)


def resolve_month(value: Any) -> int:
    if value is None or str(value).strip() == "":
        return DEFAULT_MONTH

    text = str(value).strip()
    if text.isdigit():
        month = int(text)
        if month in MONTH_NAMES:
            return month

    detected = month_number(text)
    if detected is not None:
        return detected

    raise ValueError("Parameter month harus berupa angka 1-12 atau nama bulan.")


def same_path(left: Path, right: Path) -> bool:
    try:
        return left.resolve() == right.resolve()
    except OSError:
        return left.absolute() == right.absolute()


def source_payload(workbook_source: dict[str, Any]) -> dict[str, Any]:
    source = dict(workbook_source)
    current_path = repository.parser.excel_path
    is_uploaded = same_path(current_path, ACTIVE_UPLOAD_PATH)
    source["is_uploaded"] = is_uploaded

    if is_uploaded:
        metadata = read_upload_metadata()
        original_name = metadata.get("original_name")
        if original_name:
            source["stored_file_name"] = source.get("file_name")
            source["file_name"] = original_name
        source["uploaded_at"] = metadata.get("uploaded_at")
        source["size_bytes"] = metadata.get("size_bytes")
        source["sha256"] = metadata.get("sha256")
        source["persistent"] = True
    else:
        source["uploaded_at"] = None
        source["persistent"] = False

    return source


def sync_risk_repository_source() -> None:
    expected_path = active_risk_excel_path()
    if risk_repository.parser.excel_path != expected_path:
        risk_repository.set_excel_path(expected_path)


def risk_source_payload(workbook_source: dict[str, Any]) -> dict[str, Any]:
    source = dict(workbook_source)
    current_path = risk_repository.parser.excel_path
    is_uploaded = same_path(current_path, ACTIVE_RISK_UPLOAD_PATH)
    source["is_uploaded"] = is_uploaded

    if is_uploaded:
        metadata = read_risk_upload_metadata()
        original_name = metadata.get("original_name")
        if original_name:
            source["stored_file_name"] = source.get("file_name")
            source["file_name"] = original_name
        source["uploaded_at"] = metadata.get("uploaded_at")
        source["size_bytes"] = metadata.get("size_bytes")
        source["sha256"] = metadata.get("sha256")
        source["persistent"] = True
    else:
        source["uploaded_at"] = None
        source["persistent"] = False

    return source


def build_risk_payload(force_refresh: bool = False) -> dict[str, Any]:
    """Membaca Risk Assessment tanpa membuat dashboard KPI ikut gagal."""
    sync_risk_repository_source()
    current_path = risk_repository.parser.excel_path
    try:
        payload = dict(risk_repository.get(force_refresh=force_refresh))
        payload["source"] = risk_source_payload(payload.get("source", {}))
        return rebuild_risk_payload(payload)
    except FileNotFoundError as exc:
        return {
            "available": False,
            "error": "File Risk Assessment belum tersedia.",
            "detail": str(exc),
            "source": {
                "file_name": current_path.name,
                "is_uploaded": False,
                "persistent": False,
            },
        }
    except Exception as exc:
        app.logger.exception("Gagal membaca Risk Assessment")
        return {
            "available": False,
            "error": "Data Risk Assessment gagal dibaca.",
            "detail": str(exc),
            "source": {
                "file_name": current_path.name,
                "is_uploaded": same_path(current_path, ACTIVE_RISK_UPLOAD_PATH),
                "persistent": current_path.is_file(),
            },
        }


def sync_followup_repository_source() -> None:
    expected_path = active_followup_excel_path()
    if followup_repository.parser.excel_path != expected_path:
        followup_repository.set_excel_path(expected_path)


def followup_source_payload(workbook_source: dict[str, Any]) -> dict[str, Any]:
    source = dict(workbook_source)
    current_path = followup_repository.parser.excel_path
    is_uploaded = same_path(current_path, ACTIVE_FOLLOWUP_UPLOAD_PATH)
    source["is_uploaded"] = is_uploaded
    if is_uploaded:
        metadata = read_followup_upload_metadata()
        original_name = metadata.get("original_name")
        if original_name:
            source["stored_file_name"] = source.get("file_name")
            source["file_name"] = original_name
        source["uploaded_at"] = metadata.get("uploaded_at")
        source["size_bytes"] = metadata.get("size_bytes")
        source["sha256"] = metadata.get("sha256")
        source["persistent"] = True
    else:
        source["uploaded_at"] = None
        source["persistent"] = False
    return source


def build_followup_payload(force_refresh: bool = False) -> dict[str, Any]:
    """Membaca register tugas BoD tanpa membuat KPI/Risk ikut gagal."""
    sync_followup_repository_source()
    current_path = followup_repository.parser.excel_path
    try:
        payload = dict(followup_repository.get(force_refresh=force_refresh))
        payload["source"] = followup_source_payload(payload.get("source", {}))
        return rebuild_followup_payload(payload)
    except FileNotFoundError as exc:
        return {
            "available": False,
            "error": "File Follow-up Evaluasi BoD belum tersedia.",
            "detail": str(exc),
            "source": {
                "file_name": current_path.name,
                "is_uploaded": False,
                "persistent": False,
            },
        }
    except Exception as exc:
        app.logger.exception("Gagal membaca Follow-up Evaluasi BoD")
        return {
            "available": False,
            "error": "Data Follow-up Evaluasi BoD gagal dibaca.",
            "detail": str(exc),
            "source": {
                "file_name": current_path.name,
                "is_uploaded": same_path(current_path, ACTIVE_FOLLOWUP_UPLOAD_PATH),
                "persistent": current_path.is_file(),
            },
        }


def sync_corrective_repository_source() -> None:
    expected_path = active_corrective_excel_path()
    if corrective_repository.parser.excel_path != expected_path:
        corrective_repository.set_excel_path(expected_path)


def corrective_source_payload(workbook_source: dict[str, Any]) -> dict[str, Any]:
    source = dict(workbook_source)
    current_path = corrective_repository.parser.excel_path
    is_uploaded = same_path(current_path, ACTIVE_CORRECTIVE_UPLOAD_PATH)
    source["is_uploaded"] = is_uploaded
    if is_uploaded:
        metadata = read_corrective_upload_metadata()
        original_name = metadata.get("original_name")
        if original_name:
            source["stored_file_name"] = source.get("file_name")
            source["file_name"] = original_name
        source["uploaded_at"] = metadata.get("uploaded_at")
        source["size_bytes"] = metadata.get("size_bytes")
        source["sha256"] = metadata.get("sha256")
        source["persistent"] = True
    else:
        source["uploaded_at"] = None
        source["persistent"] = False
    return source


def build_corrective_payload(force_refresh: bool = False) -> dict[str, Any]:
    """Membaca Corrective Action Register tanpa membuat modul lain ikut gagal."""
    sync_corrective_repository_source()
    current_path = corrective_repository.parser.excel_path
    try:
        payload = dict(corrective_repository.get(force_refresh=force_refresh))
        payload["source"] = corrective_source_payload(payload.get("source", {}))
        return rebuild_corrective_payload(payload)
    except FileNotFoundError as exc:
        return {
            "available": False,
            "error": "File Corrective Action Register belum tersedia.",
            "detail": str(exc),
            "source": {
                "file_name": current_path.name,
                "is_uploaded": False,
                "persistent": False,
            },
        }
    except Exception as exc:
        app.logger.exception("Gagal membaca Corrective Action Register")
        return {
            "available": False,
            "error": "Data Corrective Action gagal dibaca.",
            "detail": str(exc),
            "source": {
                "file_name": current_path.name,
                "is_uploaded": same_path(current_path, ACTIVE_CORRECTIVE_UPLOAD_PATH),
                "persistent": current_path.is_file(),
            },
        }


def sync_kaizen_repository_source() -> None:
    expected_path = active_kaizen_excel_path()
    if kaizen_repository.parser.excel_path != expected_path:
        kaizen_repository.set_excel_path(expected_path)


def kaizen_source_payload(workbook_source: dict[str, Any]) -> dict[str, Any]:
    source = dict(workbook_source)
    current_path = kaizen_repository.parser.excel_path
    is_uploaded = same_path(current_path, ACTIVE_KAIZEN_UPLOAD_PATH)
    source["is_uploaded"] = is_uploaded
    if is_uploaded:
        metadata = read_kaizen_upload_metadata()
        original_name = metadata.get("original_name")
        if original_name:
            source["stored_file_name"] = source.get("file_name")
            source["file_name"] = original_name
        source["uploaded_at"] = metadata.get("uploaded_at")
        source["size_bytes"] = metadata.get("size_bytes")
        source["sha256"] = metadata.get("sha256")
        source["persistent"] = True
    else:
        source["uploaded_at"] = None
        source["persistent"] = False
    return source


def build_kaizen_payload(force_refresh: bool = False) -> dict[str, Any]:
    """Membaca Kaizen Recap dan membuat Top 10 otomatis."""
    sync_kaizen_repository_source()
    current_path = kaizen_repository.parser.excel_path
    try:
        payload = dict(kaizen_repository.get(force_refresh=force_refresh))
        payload["source"] = kaizen_source_payload(payload.get("source", {}))
        return rebuild_kaizen_payload(payload)
    except FileNotFoundError as exc:
        return {
            "available": False,
            "error": "File Kaizen Recap belum tersedia.",
            "detail": str(exc),
            "source": {
                "file_name": current_path.name,
                "is_uploaded": False,
                "persistent": False,
            },
        }
    except Exception as exc:
        app.logger.exception("Gagal membaca Kaizen Recap")
        return {
            "available": False,
            "error": "Data Kaizen Recap gagal dibaca.",
            "detail": str(exc),
            "source": {
                "file_name": current_path.name,
                "is_uploaded": same_path(current_path, ACTIVE_KAIZEN_UPLOAD_PATH),
                "persistent": current_path.is_file(),
            },
        }


def build_month_payload(
    month_value: Any = None,
    *,
    force_refresh: bool = False,
) -> dict[str, Any]:
    sync_repository_source()

    month = resolve_month(
        request.args.get("month") if month_value is None else month_value
    )
    workbook_data = repository.get(force_refresh=force_refresh)

    # Ringkasan dua belas bulan dipakai oleh grafik mini pada dashboard.
    # apply_manual_kpi dipanggil untuk setiap bulan agar input/edit dari tombol
    # Kelola KPI tetap ikut terhitung, bukan hanya data asli dari Excel.
    adjusted_months: dict[int, dict[str, Any]] = {}
    monthly_overview: list[dict[str, Any]] = []

    for month_number_value in sorted(MONTH_NAMES):
        raw_month = workbook_data["months"].get(str(month_number_value))
        if raw_month is None:
            continue

        adjusted = apply_manual_kpi(raw_month, month_number_value)
        adjusted_months[month_number_value] = adjusted
        summary = adjusted.get("summary", {})
        monthly_overview.append(
            {
                "month": month_number_value,
                "month_name": adjusted.get(
                    "month_name",
                    MONTH_NAMES.get(month_number_value, str(month_number_value)),
                ),
                "total_divisions": int(summary.get("total_divisions") or 0),
                "meeting_count": int(summary.get("meeting_count") or 0),
                "not_meeting_count": int(summary.get("not_meeting_count") or 0),
                "report_pending_count": int(
                    summary.get("report_pending_count")
                    or summary.get("incomplete_count")
                    or 0
                ),
                "compliance_percentage": float(
                    summary.get("compliance_percentage") or 0
                ),
            }
        )

    payload = adjusted_months.get(month)
    if payload is None:
        payload = apply_manual_kpi(workbook_data["months"][str(month)], month)

    return {
        **payload,
        "monthly_overview": monthly_overview,
        "corrective_action": build_corrective_payload(force_refresh=force_refresh),
        "risk_assessment": build_risk_payload(force_refresh=force_refresh),
        "follow_up_bod": build_followup_payload(force_refresh=force_refresh),
        "kaizen_recap": build_kaizen_payload(force_refresh=force_refresh),
        "source": source_payload(workbook_data["source"]),
        "diagnostics": workbook_data["diagnostics"],
    }


def safe_upload_name(filename: str) -> str:
    stem = Path(filename).stem.strip() or "monitoring-kpi"
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-._")
    return (cleaned or "monitoring-kpi")[:80]


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def persist_uploaded_workbook(temporary_path: Path, display_name: str) -> dict[str, Any]:
    """Menyimpan workbook aktif dan salinan riwayat pada disk server."""
    ensure_persistent_storage()
    uploaded_at = datetime.now()
    digest = file_sha256(temporary_path)
    history_name = (
        f"{uploaded_at:%Y%m%d-%H%M%S}-{digest[:10]}-"
        f"{safe_upload_name(display_name)}.xlsx"
    )
    history_path = HISTORY_DIR / history_name

    # Salinan riwayat membuat data tetap dapat dipulihkan bila file aktif hilang.
    if not history_path.exists():
        shutil.copy2(temporary_path, history_path)

    # Penggantian atomik mencegah dashboard membaca file setengah terunggah.
    os.replace(temporary_path, ACTIVE_UPLOAD_PATH)

    metadata = {
        "original_name": display_name,
        "uploaded_at": uploaded_at.isoformat(timespec="seconds"),
        "size_bytes": ACTIVE_UPLOAD_PATH.stat().st_size,
        "sha256": digest,
        "history_file": str(history_path.relative_to(UPLOAD_DIR)),
        "persistent": True,
    }
    write_upload_metadata(metadata)
    return metadata


def validate_uploaded_workbook(path: Path) -> dict[str, Any]:
    """Memastikan file dapat dibuka dan pola KPI-nya benar sebelum diaktifkan."""
    parser = KpiWorkbookParser(
        excel_path=path,
        ignored_sheets=IGNORED_SHEETS,
    )
    data = parser.parse()

    detected_divisions = max(
        (
            month_data.get("summary", {}).get("total_divisions", 0)
            for month_data in data.get("months", {}).values()
        ),
        default=0,
    )
    detected_items = max(
        (
            sum(len(division.get("items", [])) for division in month_data.get("divisions", []))
            for month_data in data.get("months", {}).values()
        ),
        default=0,
    )

    if detected_divisions < 1 or detected_items < 1:
        raise ValueError(
            "Format workbook belum terbaca. Pastikan setiap sheet divisi "
            "memiliki header bulan serta pasangan baris Plan dan Actual."
        )

    return data


def persist_uploaded_risk_workbook(
    temporary_path: Path,
    display_name: str,
) -> dict[str, Any]:
    """Menyimpan Risk Assessment aktif beserta riwayatnya secara persisten."""
    ensure_persistent_storage()
    uploaded_at = datetime.now()
    digest = file_sha256(temporary_path)
    history_name = (
        f"{uploaded_at:%Y%m%d-%H%M%S}-{digest[:10]}-"
        f"{safe_upload_name(display_name)}.xlsx"
    )
    history_path = RISK_HISTORY_DIR / history_name

    if not history_path.exists():
        shutil.copy2(temporary_path, history_path)

    os.replace(temporary_path, ACTIVE_RISK_UPLOAD_PATH)
    metadata = {
        "original_name": display_name,
        "uploaded_at": uploaded_at.isoformat(timespec="seconds"),
        "size_bytes": ACTIVE_RISK_UPLOAD_PATH.stat().st_size,
        "sha256": digest,
        "history_file": str(history_path.relative_to(RISK_UPLOAD_DIR)),
        "persistent": True,
    }
    write_risk_upload_metadata(metadata)
    return metadata


def validate_uploaded_risk_workbook(path: Path) -> dict[str, Any]:
    """Menolak file yang bukan workbook Risk Assessment yang didukung."""
    data = RiskWorkbookParser(excel_path=path).parse()
    total_risks = int(data.get("total_risks") or 0)
    records = data.get("records")
    if total_risks < 1 or not isinstance(records, list) or not records:
        raise ValueError(
            "Data risiko tidak ditemukan. Pastikan file memiliki sheet Risk Assessment "
            "dengan kolom Risk Type, Risk Grade, dan Residual Grade."
        )
    return data


def persist_uploaded_followup_workbook(
    temporary_path: Path,
    display_name: str,
) -> dict[str, Any]:
    """Menyimpan register Follow-up BoD aktif beserta riwayat upload."""
    ensure_persistent_storage()
    uploaded_at = datetime.now()
    digest = file_sha256(temporary_path)
    history_name = (
        f"{uploaded_at:%Y%m%d-%H%M%S}-{digest[:10]}-"
        f"{safe_upload_name(display_name)}.xlsx"
    )
    history_path = FOLLOWUP_HISTORY_DIR / history_name
    if not history_path.exists():
        shutil.copy2(temporary_path, history_path)
    os.replace(temporary_path, ACTIVE_FOLLOWUP_UPLOAD_PATH)
    metadata = {
        "original_name": display_name,
        "uploaded_at": uploaded_at.isoformat(timespec="seconds"),
        "size_bytes": ACTIVE_FOLLOWUP_UPLOAD_PATH.stat().st_size,
        "sha256": digest,
        "history_file": str(history_path.relative_to(FOLLOWUP_UPLOAD_DIR)),
        "persistent": True,
    }
    write_followup_upload_metadata(metadata)
    return metadata


def validate_uploaded_followup_workbook(path: Path) -> dict[str, Any]:
    data = FollowUpWorkbookParser(excel_path=path).parse()
    total_tasks = int(data.get("total_tasks") or 0)
    months = data.get("months")
    records = data.get("records")
    if total_tasks < 1 or not isinstance(months, list) or not months or not isinstance(records, list):
        raise ValueError(
            "Action item BoD tidak ditemukan. Pastikan nama sheet memuat bulan dan tahun "
            "serta memiliki kolom Action Item, PIC, Planned Due Date, dan Status."
        )
    return data


def persist_uploaded_corrective_workbook(
    temporary_path: Path,
    display_name: str,
) -> dict[str, Any]:
    """Menyimpan Corrective Action Register aktif beserta riwayat upload."""
    ensure_persistent_storage()
    uploaded_at = datetime.now()
    digest = file_sha256(temporary_path)
    history_name = (
        f"{uploaded_at:%Y%m%d-%H%M%S}-{digest[:10]}-"
        f"{safe_upload_name(display_name)}.xlsx"
    )
    history_path = CORRECTIVE_HISTORY_DIR / history_name
    if not history_path.exists():
        shutil.copy2(temporary_path, history_path)
    os.replace(temporary_path, ACTIVE_CORRECTIVE_UPLOAD_PATH)
    metadata = {
        "original_name": display_name,
        "uploaded_at": uploaded_at.isoformat(timespec="seconds"),
        "size_bytes": ACTIVE_CORRECTIVE_UPLOAD_PATH.stat().st_size,
        "sha256": digest,
        "history_file": str(history_path.relative_to(CORRECTIVE_UPLOAD_DIR)),
        "persistent": True,
    }
    write_corrective_upload_metadata(metadata)
    return metadata


def validate_uploaded_corrective_workbook(path: Path) -> dict[str, Any]:
    data = CorrectiveActionWorkbookParser(excel_path=path).parse()
    total_actions = int(data.get("total_actions") or 0)
    records = data.get("records")
    if total_actions < 1 or not isinstance(records, list) or not records:
        raise ValueError(
            "Data Corrective Action tidak ditemukan. Pastikan file memiliki sheet "
            "CAR Register dengan kolom NO CAR dan Status."
        )
    return data


def persist_uploaded_kaizen_workbook(
    temporary_path: Path,
    display_name: str,
) -> dict[str, Any]:
    """Menyimpan Kaizen Recap aktif beserta riwayat upload."""
    ensure_persistent_storage()
    uploaded_at = datetime.now()
    digest = file_sha256(temporary_path)
    history_name = (
        f"{uploaded_at:%Y%m%d-%H%M%S}-{digest[:10]}-"
        f"{safe_upload_name(display_name)}.xlsx"
    )
    history_path = KAIZEN_HISTORY_DIR / history_name
    if not history_path.exists():
        shutil.copy2(temporary_path, history_path)
    os.replace(temporary_path, ACTIVE_KAIZEN_UPLOAD_PATH)
    metadata = {
        "original_name": display_name,
        "uploaded_at": uploaded_at.isoformat(timespec="seconds"),
        "size_bytes": ACTIVE_KAIZEN_UPLOAD_PATH.stat().st_size,
        "sha256": digest,
        "history_file": str(history_path.relative_to(KAIZEN_UPLOAD_DIR)),
        "persistent": True,
    }
    write_kaizen_upload_metadata(metadata)
    return metadata


def validate_uploaded_kaizen_workbook(path: Path) -> dict[str, Any]:
    data = KaizenWorkbookParser(excel_path=path, top_limit=10).parse()
    top_rows = data.get("top_10")
    if not isinstance(top_rows, list) or not top_rows:
        raise ValueError(
            "Ranking Kaizen tidak ditemukan. Pastikan file memiliki sheet Consolidated Scores "
            "dengan kolom NAMA dan nilai Director/Manager atau Weighted Average 60/40."
        )
    return data


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.errorhandler(RequestEntityTooLarge)
def handle_large_upload(_error):
    return jsonify(
        {
            "error": "Ukuran file terlalu besar.",
            "detail": f"Batas maksimum upload adalah {MAX_UPLOAD_MB} MB.",
        }
    ), 413


@app.get("/")
def index():
    return redirect(url_for("live_kpi"))


@app.get("/dashboard/<division_key>")
def division_dashboard(division_key: str):
    normalized = division_key.strip().lower()
    division_name = DIVISION_DASHBOARDS.get(normalized)

    if division_name is None:
        return render_template(
            "division_placeholder.html",
            active_division="",
            division_name="Dashboard tidak ditemukan",
            is_unknown=True,
        ), 404

    if normalized == "qms":
        return redirect(url_for("live_kpi"))

    return render_template(
        "division_placeholder.html",
        active_division=normalized,
        division_name=division_name,
        is_unknown=False,
    )


@app.get("/live-kpi")
def live_kpi():
    try:
        selected_month = resolve_month(request.args.get("month"))
    except ValueError:
        selected_month = DEFAULT_MONTH

    return render_template(
        "live_kpi.html",
        months=MONTH_NAMES,
        selected_month=selected_month,
        refresh_seconds=int(os.getenv("KPI_REFRESH_SECONDS", "60")),
        max_upload_mb=MAX_UPLOAD_MB,
    )


@app.get("/api/live-kpi")
def api_live_kpi():
    try:
        force_refresh = request.args.get("refresh") == "1"
        return jsonify(build_month_payload(force_refresh=force_refresh))
    except FileNotFoundError:
        return jsonify(
            {
                "error": "Belum ada file Excel KPI aktif.",
                "detail": (
                    "Pilih file .xlsx pada bagian Import Excel KPI, lalu tekan "
                    "Import dan Tampilkan."
                ),
            }
        ), 400
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Gagal membaca KPI")
        return jsonify(
            {
                "error": "Data KPI gagal dibaca.",
                "detail": str(exc),
            }
        ), 500


@app.post("/api/live-kpi/upload")
def api_upload_live_kpi():
    uploaded_file = request.files.get("excel_file")
    if uploaded_file is None:
        return jsonify(
            {
                "error": "File Excel belum dipilih.",
                "detail": "Pilih file .xlsx lalu tekan Import dan Tampilkan.",
            }
        ), 400

    display_name = (
        (uploaded_file.filename or "")
        .replace("\\", "/")
        .rsplit("/", 1)[-1]
        .strip()
    )
    if not display_name:
        return jsonify({"error": "Nama file Excel tidak valid."}), 400

    extension = Path(display_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        return jsonify(
            {
                "error": "Format file tidak didukung.",
                "detail": "Gunakan Microsoft Excel dengan ekstensi .xlsx.",
            }
        ), 400

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    temporary_path = UPLOAD_DIR / f".upload-{uuid.uuid4().hex}.xlsx"

    try:
        uploaded_file.save(temporary_path)
        if not temporary_path.is_file() or temporary_path.stat().st_size == 0:
            raise ValueError("File upload kosong atau gagal disimpan.")

        # File lama tetap aman apabila workbook baru gagal divalidasi.
        validate_uploaded_workbook(temporary_path)
        metadata = persist_uploaded_workbook(temporary_path, display_name)

        repository.set_excel_path(ACTIVE_UPLOAD_PATH)
        payload = build_month_payload(
            request.form.get("month"),
            force_refresh=True,
        )

        return jsonify(
            {
                **payload,
                "message": (
                    f"File {display_name} berhasil disimpan. "
                    "Data akan tetap digunakan tanpa perlu import ulang."
                ),
            }
        )
    except ValueError as exc:
        return jsonify(
            {
                "error": "File Excel tidak dapat diproses.",
                "detail": str(exc),
            }
        ), 422
    except Exception as exc:
        app.logger.exception("Gagal mengimport file Excel")
        return jsonify(
            {
                "error": "Import Excel gagal.",
                "detail": str(exc),
            }
        ), 500
    finally:
        try:
            temporary_path.unlink(missing_ok=True)
        except OSError:
            pass


@app.post("/api/risk-assessment/upload")
def api_upload_risk_assessment():
    """Mengganti sumber Risk Assessment melalui dashboard, bukan backend."""
    uploaded_file = request.files.get("excel_file")
    if uploaded_file is None:
        return jsonify(
            {
                "error": "File Risk Assessment belum dipilih.",
                "detail": "Pilih file .xlsx lalu tekan Simpan dan Perbarui Dashboard.",
            }
        ), 400

    display_name = (
        (uploaded_file.filename or "")
        .replace("\\", "/")
        .rsplit("/", 1)[-1]
        .strip()
    )
    if not display_name:
        return jsonify({"error": "Nama file Risk Assessment tidak valid."}), 400

    if Path(display_name).suffix.lower() not in ALLOWED_EXTENSIONS:
        return jsonify(
            {
                "error": "Format file tidak didukung.",
                "detail": "Gunakan Microsoft Excel dengan ekstensi .xlsx.",
            }
        ), 400

    ensure_persistent_storage()
    temporary_path = RISK_UPLOAD_DIR / f".upload-risk-{uuid.uuid4().hex}.xlsx"

    try:
        uploaded_file.save(temporary_path)
        if not temporary_path.is_file() or temporary_path.stat().st_size == 0:
            raise ValueError("File upload kosong atau gagal disimpan.")

        # Validasi dilakukan sebelum file aktif diganti. Bila file baru salah,
        # dashboard tetap memakai file lama yang masih valid.
        validated = validate_uploaded_risk_workbook(temporary_path)
        with risk_upload_lock:
            persist_uploaded_risk_workbook(temporary_path, display_name)
            risk_repository.set_excel_path(ACTIVE_RISK_UPLOAD_PATH)
            risk_payload = build_risk_payload(force_refresh=True)

        return jsonify(
            {
                "risk_assessment": risk_payload,
                "message": (
                    f"File {display_name} berhasil disimpan. "
                    f"{int(validated.get('total_risks') or 0)} risiko telah dibaca "
                    "dan akan tetap digunakan setelah restart."
                ),
            }
        )
    except ValueError as exc:
        return jsonify(
            {
                "error": "File Risk Assessment tidak dapat diproses.",
                "detail": str(exc),
            }
        ), 422
    except Exception as exc:
        app.logger.exception("Gagal mengimport Risk Assessment")
        return jsonify(
            {
                "error": "Import Risk Assessment gagal.",
                "detail": str(exc),
            }
        ), 500
    finally:
        try:
            temporary_path.unlink(missing_ok=True)
        except OSError:
            pass


@app.post("/api/corrective-action/upload")
def api_upload_corrective_action():
    """Mengganti Corrective Action Register melalui dashboard."""
    uploaded_file = request.files.get("excel_file")
    if uploaded_file is None:
        return jsonify({
            "error": "File Corrective Action belum dipilih.",
            "detail": "Pilih file .xlsx lalu tekan Simpan dan Perbarui Dashboard.",
        }), 400

    display_name = (
        (uploaded_file.filename or "")
        .replace("\\", "/")
        .rsplit("/", 1)[-1]
        .strip()
    )
    if not display_name:
        return jsonify({"error": "Nama file Corrective Action tidak valid."}), 400
    if Path(display_name).suffix.lower() not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": "Format file tidak didukung.",
            "detail": "Gunakan Microsoft Excel dengan ekstensi .xlsx.",
        }), 400

    ensure_persistent_storage()
    temporary_path = CORRECTIVE_UPLOAD_DIR / f".upload-corrective-{uuid.uuid4().hex}.xlsx"
    try:
        uploaded_file.save(temporary_path)
        if not temporary_path.is_file() or temporary_path.stat().st_size == 0:
            raise ValueError("File upload kosong atau gagal disimpan.")

        validated = validate_uploaded_corrective_workbook(temporary_path)
        with corrective_upload_lock:
            persist_uploaded_corrective_workbook(temporary_path, display_name)
            corrective_repository.set_excel_path(ACTIVE_CORRECTIVE_UPLOAD_PATH)
            corrective_payload = build_corrective_payload(force_refresh=True)

        return jsonify({
            "corrective_action": corrective_payload,
            "message": (
                f"File {display_name} berhasil disimpan. "
                f"{int(validated.get('total_actions') or 0)} corrective action berhasil dibaca."
            ),
        })
    except ValueError as exc:
        return jsonify({
            "error": "File Corrective Action tidak dapat diproses.",
            "detail": str(exc),
        }), 422
    except Exception as exc:
        app.logger.exception("Gagal mengimport Corrective Action Register")
        return jsonify({
            "error": "Import Corrective Action gagal.",
            "detail": str(exc),
        }), 500
    finally:
        try:
            temporary_path.unlink(missing_ok=True)
        except OSError:
            pass


@app.post("/api/follow-up-bod/upload")
def api_upload_follow_up_bod():
    """Mengganti register tugas rapat BoD melalui dashboard."""
    uploaded_file = request.files.get("excel_file")
    if uploaded_file is None:
        return jsonify({
            "error": "File Follow-up BoD belum dipilih.",
            "detail": "Pilih file .xlsx lalu tekan Simpan dan Perbarui Dashboard.",
        }), 400

    display_name = (
        (uploaded_file.filename or "")
        .replace("\\", "/")
        .rsplit("/", 1)[-1]
        .strip()
    )
    if not display_name:
        return jsonify({"error": "Nama file Follow-up BoD tidak valid."}), 400
    if Path(display_name).suffix.lower() not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": "Format file tidak didukung.",
            "detail": "Gunakan Microsoft Excel dengan ekstensi .xlsx.",
        }), 400

    ensure_persistent_storage()
    temporary_path = FOLLOWUP_UPLOAD_DIR / f".upload-followup-{uuid.uuid4().hex}.xlsx"
    try:
        uploaded_file.save(temporary_path)
        if not temporary_path.is_file() or temporary_path.stat().st_size == 0:
            raise ValueError("File upload kosong atau gagal disimpan.")

        validated = validate_uploaded_followup_workbook(temporary_path)
        with followup_upload_lock:
            persist_uploaded_followup_workbook(temporary_path, display_name)
            followup_repository.set_excel_path(ACTIVE_FOLLOWUP_UPLOAD_PATH)
            followup_payload = build_followup_payload(force_refresh=True)

        return jsonify({
            "follow_up_bod": followup_payload,
            "message": (
                f"File {display_name} berhasil disimpan. "
                f"{int(validated.get('total_tasks') or 0)} tugas dari "
                f"{len(validated.get('months') or [])} periode berhasil dibaca."
            ),
        })
    except ValueError as exc:
        return jsonify({
            "error": "File Follow-up BoD tidak dapat diproses.",
            "detail": str(exc),
        }), 422
    except Exception as exc:
        app.logger.exception("Gagal mengimport Follow-up BoD")
        return jsonify({
            "error": "Import Follow-up BoD gagal.",
            "detail": str(exc),
        }), 500
    finally:
        try:
            temporary_path.unlink(missing_ok=True)
        except OSError:
            pass


@app.post("/api/kaizen-recap/upload")
def api_upload_kaizen_recap():
    """Mengganti file Kaizen Recap dan menghitung ulang Top 10."""
    uploaded_file = request.files.get("excel_file")
    if uploaded_file is None:
        return jsonify({
            "error": "File Kaizen Recap belum dipilih.",
            "detail": "Pilih file .xlsx lalu tekan Simpan dan Perbarui Dashboard.",
        }), 400

    display_name = (
        (uploaded_file.filename or "")
        .replace("\\", "/")
        .rsplit("/", 1)[-1]
        .strip()
    )
    if not display_name:
        return jsonify({"error": "Nama file Kaizen Recap tidak valid."}), 400
    if Path(display_name).suffix.lower() not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": "Format file tidak didukung.",
            "detail": "Gunakan Microsoft Excel dengan ekstensi .xlsx.",
        }), 400

    ensure_persistent_storage()
    temporary_path = KAIZEN_UPLOAD_DIR / f".upload-kaizen-{uuid.uuid4().hex}.xlsx"
    try:
        uploaded_file.save(temporary_path)
        if not temporary_path.is_file() or temporary_path.stat().st_size == 0:
            raise ValueError("File upload kosong atau gagal disimpan.")

        validated = validate_uploaded_kaizen_workbook(temporary_path)
        with kaizen_upload_lock:
            persist_uploaded_kaizen_workbook(temporary_path, display_name)
            kaizen_repository.set_excel_path(ACTIVE_KAIZEN_UPLOAD_PATH)
            kaizen_payload = build_kaizen_payload(force_refresh=True)

        winner = validated.get("winner") or {}
        return jsonify({
            "kaizen_recap": kaizen_payload,
            "message": (
                f"File {display_name} berhasil disimpan. "
                f"Top 10 dihitung otomatis dari {int(validated.get('total_scored_entries') or 0)} ide. "
                f"Peringkat 1: {winner.get('name', '-')} ({winner.get('score', '-')})."
            ),
        })
    except ValueError as exc:
        return jsonify({
            "error": "File Kaizen Recap tidak dapat diproses.",
            "detail": str(exc),
        }), 422
    except Exception as exc:
        app.logger.exception("Gagal mengimport Kaizen Recap")
        return jsonify({
            "error": "Import Kaizen Recap gagal.",
            "detail": str(exc),
        }), 500
    finally:
        try:
            temporary_path.unlink(missing_ok=True)
        except OSError:
            pass


def request_json() -> dict[str, Any]:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("Data form KPI tidak valid.")
    return data


def validate_editor_payload(data: dict[str, Any]) -> dict[str, Any]:
    division = clean_text(data.get("division"), 120)
    kpi_name = clean_text(data.get("kpi"), 300)
    if not division:
        raise ValueError("Divisi wajib dipilih.")
    if not kpi_name:
        raise ValueError("Nama KPI wajib diisi.")

    month = resolve_month(data.get("month"))
    comparator = clean_text(data.get("comparator") or "auto", 20).lower()
    if comparator not in {"auto", "gte", "lte", "gt", "lt", "eq"}:
        raise ValueError("Aturan penilaian KPI tidak valid.")

    return {
        "division": division,
        "month": month,
        "kpi": kpi_name,
        "variable": clean_text(data.get("variable"), 500),
        "unit": clean_text(data.get("unit"), 120),
        "target": clean_text(data.get("target"), 200),
        "plan": clean_text(data.get("plan"), 200),
        "actual": clean_text(data.get("actual"), 200),
        "comparator": comparator,
        "base_key": clean_text(data.get("item_key"), 300),
        "record_id": clean_text(data.get("record_id"), 80),
        "source": clean_text(data.get("source"), 30),
    }


@app.post("/api/live-kpi/manual/save")
def api_save_manual_kpi():
    try:
        values = validate_editor_payload(request_json())
        now = datetime.now().isoformat(timespec="seconds")

        with manual_kpi_lock:
            store = read_manual_store()
            records = store["records"]
            record = None

            if values["record_id"]:
                record = next(
                    (item for item in records if str(item.get("id")) == values["record_id"]),
                    None,
                )

            if record is None and values["base_key"] and values["source"] != "manual":
                record = next(
                    (item for item in records if item.get("mode") == "override"
                     and item.get("base_key") == values["base_key"]),
                    None,
                )

            is_new = record is None
            if is_new:
                record = {
                    "id": uuid.uuid4().hex,
                    "created_at": now,
                }
                records.append(record)

            record.update({
                "mode": "override" if values["base_key"] and values["source"] != "manual" else "manual",
                "base_key": values["base_key"] or None,
                "division": values["division"],
                "month": values["month"],
                "kpi": values["kpi"],
                "variable": values["variable"],
                "unit": values["unit"],
                "target": values["target"],
                "plan": values["plan"],
                "actual": values["actual"],
                "comparator": values["comparator"],
                "updated_at": now,
            })
            write_manual_store(store)

        payload = build_month_payload(values["month"], force_refresh=False)
        return jsonify({
            **payload,
            "message": "KPI berhasil disimpan permanen pada dashboard.",
            "saved_record_id": record["id"],
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Gagal menyimpan KPI manual")
        return jsonify({"error": "KPI gagal disimpan.", "detail": str(exc)}), 500


@app.post("/api/live-kpi/manual/delete")
def api_delete_manual_kpi():
    try:
        data = request_json()
        record_id = clean_text(data.get("record_id"), 80)
        if not record_id:
            raise ValueError("ID perubahan KPI tidak tersedia.")
        month = resolve_month(data.get("month"))

        with manual_kpi_lock:
            store = read_manual_store()
            before = len(store["records"])
            store["records"] = [
                item for item in store["records"]
                if str(item.get("id")) != record_id
            ]
            if len(store["records"]) == before:
                raise ValueError("Data KPI yang akan dihapus tidak ditemukan.")
            write_manual_store(store)

        payload = build_month_payload(month, force_refresh=False)
        return jsonify({
            **payload,
            "message": "Perubahan KPI dihapus. Nilai Excel asli dipulihkan bila tersedia.",
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Gagal menghapus KPI manual")
        return jsonify({"error": "Perubahan KPI gagal dihapus.", "detail": str(exc)}), 500



@app.post("/api/dashboard/manual/save")
def api_save_dashboard_manual():
    try:
        body = request_json()
        module = clean_text(body.get("module"), 40).lower()
        if module not in MANUAL_MODULES:
            raise ValueError("Modul tidak dikenali.")
        values = validate_manual_module_values(module, body.get("values") or {})
        record_id = clean_text(body.get("record_id"), 120)
        base_id = clean_text(body.get("base_id"), 180)
        now = datetime.now().isoformat(timespec="seconds")

        with manual_module_lock:
            store = read_manual_module_store()
            records = store["records"]
            record = next((row for row in records if str(row.get("id")) == record_id), None) if record_id else None
            if record is None and base_id:
                record = next((row for row in records if row.get("module") == module and row.get("base_id") == base_id), None)
            if record is None:
                record = {
                    "id": uuid.uuid4().hex,
                    "module": module,
                    "base_id": base_id,
                    "mode": "override" if base_id else "manual",
                    "created_at": now,
                }
                records.append(record)
            record.update({
                "module": module,
                "base_id": base_id,
                "mode": "override" if base_id else "manual",
                "values": values,
                "updated_at": now,
            })
            write_manual_module_store(store)

        month = body.get("month") or request.args.get("month")
        payload = build_month_payload(month_value=month, force_refresh=False)
        return jsonify({**payload, "message": "Perubahan manual berhasil disimpan.", "saved_record_id": record["id"]})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Gagal menyimpan edit manual dashboard")
        return jsonify({"error": "Perubahan manual gagal disimpan.", "detail": str(exc)}), 500


@app.post("/api/dashboard/manual/delete")
def api_delete_dashboard_manual():
    try:
        body = request_json()
        record_id = clean_text(body.get("record_id"), 120)
        if not record_id:
            raise ValueError("ID perubahan tidak tersedia.")
        with manual_module_lock:
            store = read_manual_module_store()
            before = len(store["records"])
            store["records"] = [row for row in store["records"] if str(row.get("id")) != record_id]
            if len(store["records"]) == before:
                raise ValueError("Perubahan manual tidak ditemukan.")
            write_manual_module_store(store)
        month = body.get("month") or request.args.get("month")
        payload = build_month_payload(month_value=month, force_refresh=False)
        return jsonify({**payload, "message": "Perubahan manual dihapus; data kembali ke sumber Excel bila tersedia."})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Gagal menghapus edit manual dashboard")
        return jsonify({"error": "Perubahan manual gagal dihapus.", "detail": str(exc)}), 500


@app.get("/api/health")
def api_health():
    sync_repository_source()
    sync_risk_repository_source()
    sync_followup_repository_source()
    sync_corrective_repository_source()
    path = repository.parser.excel_path
    is_uploaded = same_path(path, ACTIVE_UPLOAD_PATH)
    metadata = read_upload_metadata() if is_uploaded else {}
    risk_path = risk_repository.parser.excel_path
    risk_is_uploaded = same_path(risk_path, ACTIVE_RISK_UPLOAD_PATH)
    risk_metadata = read_risk_upload_metadata() if risk_is_uploaded else {}
    followup_path = followup_repository.parser.excel_path
    followup_is_uploaded = same_path(followup_path, ACTIVE_FOLLOWUP_UPLOAD_PATH)
    followup_metadata = read_followup_upload_metadata() if followup_is_uploaded else {}
    corrective_path = corrective_repository.parser.excel_path
    corrective_is_uploaded = same_path(corrective_path, ACTIVE_CORRECTIVE_UPLOAD_PATH)
    corrective_metadata = (
        read_corrective_upload_metadata() if corrective_is_uploaded else {}
    )

    if path.is_file():
        status = "ok"
    elif CONFIGURED_EXCEL_PATH is None:
        status = "upload_required"
    else:
        status = "file_not_found"

    return jsonify(
        {
            "status": status,
            "excel_path": str(path) if path.is_file() else None,
            "file_exists": path.is_file(),
            "source_type": "uploaded" if is_uploaded else "default",
            "original_file_name": metadata.get("original_name"),
            "uploaded_at": metadata.get("uploaded_at"),
            "persistent": bool(is_uploaded and path.is_file()),
            "history_file": metadata.get("history_file"),
            "upload_directory": str(UPLOAD_DIR),
            "manual_kpi_file": str(MANUAL_KPI_PATH),
            "manual_kpi_exists": MANUAL_KPI_PATH.is_file(),
            "manual_kpi_records": len(read_manual_store().get("records", [])),
            "manual_module_file": str(MANUAL_MODULE_PATH),
            "manual_module_records": len(read_manual_module_store().get("records", [])),
            "risk_excel_path": str(risk_path) if risk_path.is_file() else None,
            "risk_file_exists": risk_path.is_file(),
            "risk_source_type": "uploaded" if risk_is_uploaded else "default",
            "risk_original_file_name": risk_metadata.get("original_name"),
            "risk_uploaded_at": risk_metadata.get("uploaded_at"),
            "risk_persistent": bool(risk_is_uploaded and risk_path.is_file()),
            "risk_upload_directory": str(RISK_UPLOAD_DIR),
            "followup_excel_path": str(followup_path) if followup_path.is_file() else None,
            "followup_file_exists": followup_path.is_file(),
            "followup_source_type": "uploaded" if followup_is_uploaded else "default",
            "followup_original_file_name": followup_metadata.get("original_name"),
            "followup_uploaded_at": followup_metadata.get("uploaded_at"),
            "followup_persistent": bool(followup_is_uploaded and followup_path.is_file()),
            "followup_upload_directory": str(FOLLOWUP_UPLOAD_DIR),
            "corrective_excel_path": str(corrective_path) if corrective_path.is_file() else None,
            "corrective_file_exists": corrective_path.is_file(),
            "corrective_source_type": "uploaded" if corrective_is_uploaded else "default",
            "corrective_original_file_name": corrective_metadata.get("original_name"),
            "corrective_uploaded_at": corrective_metadata.get("uploaded_at"),
            "corrective_persistent": bool(
                corrective_is_uploaded and corrective_path.is_file()
            ),
            "corrective_upload_directory": str(CORRECTIVE_UPLOAD_DIR),
        }
    )


if __name__ == "__main__":
    debug_enabled = os.getenv("FLASK_DEBUG", "1").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    app.run(host=HOST, port=PORT, debug=debug_enabled)
