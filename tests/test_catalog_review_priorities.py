import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from catalog_review_priorities import audit


def sample(**overrides):
    p = {
        "id": "synthetic-model",
        "recommendation_ready": True,
        "source_tier": "A",
        "lifecycle": "current",
        "checked_at": "2026-10-07",
        "model": "SYN-1",
        "nominal_btu": 12000,
        "phase": None,
        "voltage": None,
        "verified_fields": ["model", "nominal_btu", "lifecycle"],
        "evidence": {
            key: {"source": "https://example.org/spec", "checked_at": "2026-10-07"}
            for key in ("model", "nominal_btu", "lifecycle")
        },
        "price_status": "no_price",
        "price_scope": "unclear",
    }
    p.update(overrides)
    return p


class CatalogReviewTest(unittest.TestCase):
    def test_missing_safety_evidence_is_high_priority(self):
        r = audit([sample()], as_of="2026-10-11")
        row = r["queue"][0]
        self.assertEqual(row["priority"], "high")
        self.assertIn("phase", row["missing_field_evidence"])
        self.assertIn("voltage", row["missing_field_evidence"])
        self.assertTrue(row["missing_current_unit_price_evidence"])
        self.assertEqual(r["summary"]["ready_missing_phase_evidence"], 1)
        self.assertEqual(r["summary"]["ready_missing_current_unit_price_evidence"], 1)
        self.assertIsNone(r["market_denominator"])
        self.assertFalse(r["source_links_rechecked"])

    def test_source_review_age_is_not_link_liveness(self):
        old = sample(checked_at="2026-08-01")
        r = audit([old], as_of="2026-10-11")
        self.assertTrue(r["queue"][0]["source_review_due"])
        self.assertEqual(r["summary"]["ready_source_review_due"], 1)
        self.assertFalse(r["stock_verified"])

    def test_missing_evidence_even_if_field_value_exists(self):
        p = sample(phase="1", verified_fields=["model", "nominal_btu", "lifecycle", "phase"])
        r = audit([p], as_of="2026-10-11")
        self.assertIn("phase", r["queue"][0]["missing_field_evidence"])

    def test_deferred_notready_does_not_inflate_ready_counts(self):
        p = sample(recommendation_ready=False)
        r = audit([p], as_of="2026-10-11")
        self.assertEqual(r["queue"][0]["priority"], "deferred")
        self.assertEqual(r["summary"]["recommendation_ready_flagged"], 0)
        self.assertEqual(r["summary"]["ready_missing_current_unit_price_evidence"], 0)

    def test_order_stable_and_inherited_evidence_disclosed(self):
        a = sample(id="a", evidence={
            "model": {"source": "https://example.org", "checked_at": "2026-10-07",
                      "confidence_scope": "inherited_baseline_not_fresh_audit"}
        })
        b = sample(id="b", recommendation_ready=False)
        r = audit([b, a], as_of="2026-10-11")
        self.assertEqual([x["id"] for x in r["queue"]], ["a", "b"])
        self.assertEqual(r["queue"][0]["inherited_evidence_fields"], ["model"])


if __name__ == "__main__":
    unittest.main()
