"""Catalog review priorities; does not fetch sources or change eligibility."""
import json
from collections import Counter
from pathlib import Path

FIELDS=('model','nominal_btu','lifecycle','phase','voltage','noise_low_dba','wifi','seer')

def audit(rows):
    queue=[]; counts=Counter()
    for p in rows:
        ready=p.get('recommendation_ready') is True and p.get('source_tier')!='C' and p.get('lifecycle') in ('current','active')
        missing=[k for k in FIELDS if k not in p.get('verified_fields',[]) or p.get(k) is None or not (p.get('evidence') or {}).get(k)]
        if ready: counts.update(missing)
        priority='high' if ready and any(k in missing for k in ('model','nominal_btu','lifecycle','phase')) else 'medium' if ready else 'deferred'
        queue.append({'id':p['id'],'priority':priority,'missing_evidence':missing})
    queue.sort(key=lambda x:({'high':0,'medium':1,'deferred':2}[x['priority']],x['id']))
    return {'market_denominator':None,'stock_verified':False,'candidate_missing_evidence':dict(counts),'queue':queue}

if __name__=='__main__':
    rows=json.loads((Path(__file__).resolve().parents[1]/'data/aircon_catalog.json').read_text())
    print(json.dumps(audit(rows),ensure_ascii=False,indent=2))
