"""Summarize voluntarily exported supervised beta files; no network or raw answers."""
import argparse
import json
import math
from collections import Counter
from pathlib import Path
from datetime import datetime

METRICS = ('started', 'completed', 'results', 'successful', 'siteChecks', 'detailFlows', 'officialFlows', 'quoteFlows')

def summarize(paths):
    latest, rejected = {}, []
    for path in paths:
        try:
            row = json.loads(Path(path).read_text(encoding='utf-8-sig'))
            if row.get('schema') != 'home-decision-supervised-beta-v1':
                raise ValueError('unsupported schema')
            identity = row.get('export_id')
            if not isinstance(identity, str) or not 1 <= len(identity) <= 100:
                raise ValueError('missing export id')
            timestamp = datetime.fromisoformat(row['exported_at'].replace('Z', '+00:00'))
            if not timestamp.tzinfo:
                raise ValueError('timestamp requires timezone')
            metrics = row['metrics']
            if any(type(metrics.get(k)) is not int or not 0 <= metrics[k] <= 100000 for k in METRICS):
                raise ValueError('invalid counters')
            if not metrics['successful'] <= metrics['completed'] <= metrics['started'] or metrics['results'] > metrics['started']:
                raise ValueError('inconsistent counters')
            if identity not in latest or timestamp > latest[identity][0]:
                latest[identity] = (timestamp, row)
        except (ValueError, KeyError, TypeError, OSError):
            rejected.append(Path(path).name)
    totals, comparisons, outcomes, ratings = Counter(), Counter(), Counter(), Counter()
    times, single_flow = [], 0
    for _, row in latest.values():
        metrics = row['metrics']
        totals.update({k: metrics[k] for k in METRICS})
        ratings.update({k: v for k, v in metrics.get('feedback', {}).items() if k in ('positive', 'neutral', 'negative') and type(v) is int and 0 <= v <= 100000})
        times.extend(v for v in metrics.get('times', []) if type(v) in (int, float) and math.isfinite(v) and 0 <= v <= 86400000)
        if metrics['started'] == metrics['completed'] == metrics['results'] == 1:
            single_flow += 1
            q = row.get('questionnaire', {})
            if q.get('comparison') in ('better', 'same', 'worse', 'not_tried'):
                comparisons[q['comparison']] += 1
            if q.get('outcome') in ('decided', 'shortlist', 'survey', 'unclear'):
                outcomes[q['outcome']] += 1
    compared = sum(comparisons[k] for k in ('better', 'same', 'worse'))
    times.sort()
    median = None if not times else (times[(len(times)-1)//2] + times[len(times)//2]) / 2
    return {'scope': 'supervised exported batch; not unique users, monthly KPI, purchases or Popular Choice evidence',
            'unique_page_exports': len(latest), 'single_completed_flow_exports': single_flow,
            'totals': dict(totals), 'feedback': dict(ratings), 'outcomes': dict(outcomes),
            'comparison': dict(comparisons), 'comparison_denominator': compared,
            'better_than_retailer_pct': round(100 * comparisons['better'] / compared, 1) if compared else None,
            'median_time_to_result_ms': median, 'rejected_files': rejected,
            'limitations': ['Owner must exclude synthetic QA and repeated people; exports have no personal identity.',
                            'Retailer comparison is self-report; facilitator must run the same real task on both sites.',
                            'Only single completed-flow exports contribute questionnaire results.',
                            'Absence of an export is not evidence of completion or satisfaction.']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('--output', type=Path, default=Path('reports/BETA_BATCH_SUMMARY.json'))
    args = parser.parse_args()
    result = summarize(sorted(args.directory.glob('*.json')))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'exports': result['unique_page_exports'], 'comparison_denominator': result['comparison_denominator'], 'rejected': len(result['rejected_files'])}))
