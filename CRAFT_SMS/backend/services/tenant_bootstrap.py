"""
services/tenant_bootstrap.py
==============================
Tenant Bootstrap Service.

When a new school is created via POST /api/tenants/schools, this service
automatically provisions the school with:
  - 1 current academic term
  - 6 default core subjects
  - 3 default class structures
  - 1 default grade category (Total Assessment)

A newly created school is immediately usable by a School Admin.

Usage:
    from services.tenant_bootstrap import bootstrap_new_tenant
    await bootstrap_new_tenant(school_id=new_school_id, db=db)
"""
from __future__ import annotations

import datetime
from typing import Any, Dict
from repositories import DatabaseProvider


DEFAULT_SUBJECTS = [
    {"name": "Mathematics",    "code": "MATH",  "department": "Sciences"},
    {"name": "English Language", "code": "ENG",  "department": "Arts"},
    {"name": "Science",         "code": "SCI",   "department": "Sciences"},
    {"name": "Social Studies",  "code": "SOC",   "department": "Humanities"},
    {"name": "ICT",             "code": "ICT",   "department": "Technology"},
    {"name": "French",          "code": "FRN",   "department": "Languages"},
]

DEFAULT_CLASSES = [
    {"name": "Grade 7",  "grade_level": "7"},
    {"name": "Grade 8",  "grade_level": "8"},
    {"name": "Grade 9",  "grade_level": "9"},
]

DEFAULT_GRADE_CATEGORY = {
    "name": "Total Assessment",
    "weight": 100.0,
}


async def bootstrap_new_tenant(school_id: str, db: DatabaseProvider) -> Dict[str, Any]:
    """
    Provisions a freshly-created school with default operational data.
    All inserts are fire-and-forget safe — any failure is caught and logged,
    ensuring the school record is NOT rolled back if seeding partially fails.
    """
    report: Dict[str, Any] = {
        "school_id": school_id,
        "academic_term": None,
        "subjects": [],
        "classes": [],
        "grade_categories": [],
        "errors": [],
    }

    # ── 1. Academic Term ────────────────────────────────────────────────
    try:
        now = datetime.datetime.now(datetime.timezone.utc)
        year = now.year
        term = await db.insert("academic_terms", {
            "school_id":  school_id,
            "name":       f"First Term {year}",
            "start_date": datetime.date(year, 9, 1),
            "end_date":   datetime.date(year, 12, 20),
            "is_current": True,
            "is_locked":  False,
        })
        report["academic_term"] = term
    except Exception as exc:
        report["errors"].append(f"academic_terms: {exc}")

    # ── 2. Default Subjects ─────────────────────────────────────────────
    for subj in DEFAULT_SUBJECTS:
        try:
            row = await db.insert("subjects", {**subj, "school_id": school_id})
            report["subjects"].append(row)
        except Exception as exc:
            report["errors"].append(f"subjects ({subj['name']}): {exc}")

    # ── 3. Default Classes ──────────────────────────────────────────────
    for cls in DEFAULT_CLASSES:
        try:
            row = await db.insert("classes", {**cls, "school_id": school_id})
            report["classes"].append(row)
        except Exception as exc:
            report["errors"].append(f"classes ({cls['name']}): {exc}")

    # ── 4. Default Grade Category ────────────────────────────────────────
    try:
        cat = await db.insert("grade_categories", {
            **DEFAULT_GRADE_CATEGORY,
            "school_id": school_id,
        })
        report["grade_categories"].append(cat)
    except Exception as exc:
        report["errors"].append(f"grade_categories: {exc}")

    return report
