"""Offline evidence-gap triage for the public catalog. Never verifies live sources."""
import json
from collections import Counter
from datetime import date
from pathlib import Path

TECHNICAL_FIELDS = (
    "model", "nominal_btu", "lifecycle", "phase", "voltage",
    "noise_low_dba", "wifi", "seer",
)
SAFETY_FIELDS = ("model", "nominal_btu", "lifecycle", "phase", "voltage")
REVIEW_INTERVAL_DAYS = 30


def _field_has_evidence(product, field):
    item = (product.get("evidence") or {}).get(field)
    value = product.get(field)
    return (
        field in (product.get("verified_fields") or [])
        and value is not None and value != ""
        and isinstance(item, dict)
        and bool(item.get("source")) and bool(item.get("checked_at"))
    )


def _review_age_days(value, as_of):
    try:
        checked = date.fromisoformat(value)
    except (TypeError, ValueError):
        return None
    age = (as_of - checked).days
    return age if age >= 0 else None


def _has_current_unit_price(product):
    """Conservative review marker, not proof of stock or a retail offer."""
    price = product.get("price_thb")
    return (
        isinstance(price, (int, float)) and not isinstance(price, bool)
        and price > 0
        and product.get("price_scope") in ("unit_only", "equipment_only")
        and product.get("price_status") in ("current", "verified_current")
        and bool(product.get("price_url"))
        and _review_age_days(product.get("price_checked_at"), date.today()) is not None
        and ("price_thb" in (product.get("verified_fields") or [])
             or "price" in (product.get("verified_fields") or []))
    )


def audit(rows, as_of=None):
    """Produce deterministic triage for a given date; no external requests."""
    as_of = as_of or date.today()
    if isinstance(as_of, str):
        as_of = date.fromisoformat(as_of)
    queue = []
    gaps = Counter()
    ready_count = missing_price = missing_phase = review_due = 0
    for product in rows:
        ready = product.get("recommendation_ready") is True
        missing = [field for field in TECHNICAL_FIELDS
                   if not _field_has_evidence(product, field)]
        age = _review_age_days(product.get("checked_at"), as_of)
        due = age is None or age > REVIEW_INTERVAL_DAYS
        inherited = sorted(
            field for field, evidence in (product.get("evidence") or {}).items()
            if isinstance(evidence, dict)
            and "inherited" in str(evidence.get("confidence_scope", "")).lower()
        )
        current_unit_price = _has_current_unit_price(product)
        if ready:
            ready_count += 1
            gaps.update(missing)
            missing_price += not current_unit_price
            missing_phase += "phase" in missing
            review_due += due
        safety_gaps = sum(field in missing for field in SAFETY_FIELDS)
        priority = ("high" if ready and safety_gaps else
                    "medium" if ready else "deferred")
        queue.append({
            "id": product["id"],
            "priority": priority,
            "recommendation_ready_flag": ready,
            "missing_field_evidence": missing,
            "missing_current_unit_price_evidence": not current_unit_price,
            "review_age_days": age,
            "source_review_due": due,
            "inherited_evidence_fields": inherited,
            "lifecycle_recheck_required": (
                product.get("lifecycle") not in ("current", "active")
                or not _field_has_evidence(product, "lifecycle")
            ),
        })
    order = {"high": 0, "medium": 1, "deferred": 2}
    queue.sort(key=lambda item: (
        order[item["priority"]],
        -sum(f in item["missing_field_evidence"] for f in SAFETY_FIELDS),
        item["id"],
    ))
    return {
        "schema_version": 1,
        "as_of": as_of.isoformat(),
        "scope": "offline_public_catalog_evidence_triage",
        "market_denominator": None,
        "stock_verified": False,
        "source_links_rechecked": False,
        "summary": {
            "records": len(rows),
            "recommendation_ready_flagged": ready_count,
            "ready_missing_current_unit_price_evidence": missing_price,
            "ready_missing_phase_evidence": missing_phase,
            "ready_source_review_due": review_due,
            "priority_counts": dict(Counter(x["priority"] for x in queue)),
        },
        "candidate_missing_evidence": dict(sorted(gaps.items())),
        "queue": queue,
    }


if __name__ == "__main__":
    products = json.loads(
        (Path(__file__).resolve().parents[1] / "data/aircon_catalog.json")
        .read_text(encoding="utf-8")
    )
    print(json.dumps(audit(products), ensure_ascii=False, indent=2))
