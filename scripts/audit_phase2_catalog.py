"""Read-only verification coverage audit of the exact catalog embedded in index.html.
This does NOT fetch official sources or certify market availability.
"""
import json
import re
from collections import Counter
from pathlib import Path

html=(Path(__file__).resolve().parents[1]/"index.html").read_text(encoding="utf-8")
match=re.search(r"const PRODUCTS=(\[.*?\]);",html,re.S)
assert match, "Inline catalog missing"
products=json.loads(match.group(1))
ids=[p["id"] for p in products]
assert len(set(ids))==len(ids),"Duplicate model IDs"
required=("id","brand","model","type","nominal_btu","official_source","checked_at","verified_fields")
for p in products:
    for field in required:
        assert field in p, f"{p.get('id','?')}: missing {field}"
    assert p["nominal_btu"]>0,f"{p['id']}: nonpositive capacity"
    assert (p["official_source"] or "").startswith("https://"),f"{p['id']}: missing HTTPS official URL"
    assert "nominal_btu" in p["verified_fields"],f"{p['id']}: BTU lacks verification flag"
ready=[p for p in products if p.get("recommendation_ready") is not False]
flags={
 "no_verified_equipment_price": lambda p:not(p.get("price_thb") and "price_thb" in p.get("verified_fields",[]) or p.get("price_thb") and "price" in p.get("verified_fields",[])),
 "electrical_phase_not_verified":lambda p:"phase" not in p["verified_fields"],
 "not_confirmed_active":lambda p:p.get("lifecycle")!="active",
 "not_freshly_audited":lambda p:p.get("verification_basis")!="fresh_manual",
 "missing_noise_evidence":lambda p:"noise_low_dba" not in p["verified_fields"],
}
report={"total_records":len(products),"brands":dict(Counter(p["brand"] for p in products)),"ready":len(ready),"not_ready":len(products)-len(ready),"gaps_in_ready":{name:sum(fn(p) for p in ready) for name,fn in flags.items()}}
print(json.dumps(report,ensure_ascii=False,sort_keys=True,indent=2))
