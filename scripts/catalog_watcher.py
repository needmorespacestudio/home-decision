"""Read-only catalog comparison. Public reports only; never writes catalog/runtime."""
import argparse
import hashlib
import json
import re
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVENTS = {'NEW_MODEL', 'NEW_VARIANT', 'SPEC_CHANGED', 'PRICE_CHANGED',
          'POSSIBLE_DISCONTINUED', 'SOURCE_MOVED', 'SOURCE_BROKEN',
          'MODEL_RENAMED', 'DATA_STALE'}
SPEC_FIELDS = ('type', 'nominal_btu', 'min_btu', 'max_btu', 'seer', 'phase',
               'voltage', 'inverter', 'wifi', 'wifi_optional', 'noise_low_dba',
               'warranty_summary', 'refrigerant', 'feature_tags', 'verified_fields',
               'lifecycle', 'eer', 'cspf', 'frequency_hz', 'air_quality_features',
               'wifi_status', 'indoor_model', 'outdoor_model', 'noise', 'cleaning_features')
TARGETS = ['Daikin', 'Mitsubishi Electric', 'Mitsubishi Heavy Duty', 'Panasonic',
           'Carrier', 'Samsung', 'LG', 'Toshiba', 'Haier', 'Sharp', 'Hisense']


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def inline_catalog():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    return json.loads(re.search(r'const PRODUCTS=(\[.*?\]);', html, re.S).group(1))


def rows(snapshot):
    records = snapshot if isinstance(snapshot, list) else snapshot['products']
    ids = [p['id'] for p in records]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate stable product IDs')
    return {p['id']: p for p in records}


def verified(p, field):
    aliases = {'warranty_summary': 'warranty', 'price_thb': 'price'}
    return p.get(field) is not None and (field in p.get('verified_fields', []) or
                                       aliases.get(field) in p.get('verified_fields', []))


def verified_record(p):
    return bool(p.get('official_source') and p.get('checked_at') and
                all(verified(p, k) for k in ('model', 'type', 'nominal_btu')))


def ready_record(p):
    return (p.get('recommendation_ready') is True and verified_record(p)
            and p.get('lifecycle') in ('current', 'active', 'unclear'))


def verified_price(p):
    return (verified(p, 'price_thb') and isinstance(p.get('price_thb'), (float, int))
            and p['price_thb'] > 0 and bool(p.get('price_url') and p.get('price_checked_at')))


def stale(value, today, days):
    try:
        return (today - date.fromisoformat(value)).days >= days
    except (ValueError, TypeError):
        return True


class SnapshotAdapter:
    """Explicit saved discovery. Absence is meaningful only with brand scope evidence."""
    def discover(self, path):
        return read(path)


class ManualOfficialAdapter:
    """No fetching until source policy and adapter/parser fixtures are reviewed."""
    def discover(self, source):
        return {'products': [], 'complete_brands': [], 'status': 'discovery_stub',
                'source_id': source['id'], 'reason': 'Manual policy/denominator review required'}


ADAPTERS = {'snapshot': SnapshotAdapter, 'manual_official': ManualOfficialAdapter}


def compare(previous, current, today, stale_days=30):
    old, new = rows(previous), rows(current)
    events = []
    complete = set(current.get('complete_brands', [])) if isinstance(current, dict) else set()

    def emit(kind, product, detail):
        identity = json.dumps([kind, product['id'], detail], sort_keys=True)
        events.append({'event_id': hashlib.sha256(identity.encode()).hexdigest()[:20],
                       'type': kind, 'product_id': product['id'], 'brand': product['brand'],
                       'model': product['model'], 'detected_at': today.isoformat(),
                       'status': 'pending_review', 'detail': detail,
                       'auto_promoted': False})

    for key, p in new.items():
        if key not in old:
            family = p.get('family_id')
            is_variant = family and any(x.get('family_id') == family and x['brand'] == p['brand'] for x in old.values())
            emit('NEW_VARIANT' if is_variant else 'NEW_MODEL', p, {'stage': 'discovered'})
        else:
            before = old[key]
            changed = {f: {'before': before.get(f), 'after': p.get(f)} for f in SPEC_FIELDS if before.get(f) != p.get(f)}
            if changed:
                emit('SPEC_CHANGED', p, changed)
            if before.get('price_thb') != p.get('price_thb'):
                emit('PRICE_CHANGED', p, {'before': before.get('price_thb'), 'after': p.get('price_thb')})
            if before.get('official_source') != p.get('official_source'):
                emit('SOURCE_MOVED', p, {'before': before.get('official_source'), 'after': p.get('official_source')})
            if before['model'] != p['model']:
                emit('MODEL_RENAMED', p, {'before': before['model'], 'after': p['model']})
        # Observations must be explicit; a stub/timeout never invents a broken source.
        health = p.get('source_health', {})
        if health.get('status') == 'broken' and health.get('checked_at'):
            emit('SOURCE_BROKEN', p, health)
        if stale(p.get('checked_at'), today, stale_days):
            emit('DATA_STALE', p, {'checked_at': p.get('checked_at'), 'threshold_days': stale_days})
    for key, p in old.items():
        if key not in new and p['brand'] in complete:
            emit('POSSIBLE_DISCONTINUED', p, {'reason': 'Missing from complete comparable brand snapshot; human confirmation required'})
    return events


def coverage(products, registry, today):
    by_brand = []
    sources = {s['brand']: s for s in registry['sources']}
    for brand in TARGETS:
        group = [p for p in products if p['brand'] == brand]
        source = sources[brand]
        # Unknown official denominators are null, never the current ingested count.
        by_brand.append({'brand': brand, 'official_catalog_urls': source['official_catalog_urls'],
                         'discovered_count': None, 'denominator_scope': None,
                         'ingested_count': len(group), 'verified_count': sum(verified_record(p) for p in group),
                         'recommendation_ready_count': sum(ready_record(p) for p in group),
                         'coverage_pct': None, 'last_discovery_at': source.get('last_discovery_at'),
                         'last_verified_at': max((p['checked_at'] for p in group if p.get('checked_at')), default=None),
                         'status': 'beta_incomplete' if group else 'not_ingested'})
    metrics = {'records': len(products), 'brands_ingested': len(set(p['brand'] for p in products)),
               'verified_records': sum(verified_record(p) for p in products),
               'recommendation_ready': sum(ready_record(p) for p in products),
               'types': dict(Counter(p['type'] for p in products)),
               'nominal_btu_min': min(p['nominal_btu'] for p in products),
               'nominal_btu_max': max(p['nominal_btu'] for p in products),
               'missing_price': sum(not verified_price(p) for p in products),
               'missing_min_max': sum(not (verified(p, 'min_btu') and verified(p, 'max_btu')) for p in products),
               'stale_specs': sum(stale(p.get('checked_at'), today, 30) for p in products),
               'link_health_unknown': sum(not p.get('source_health') for p in products)}
    for field in ('phase', 'seer', 'voltage', 'wifi', 'noise_low_dba', 'warranty_summary'):
        metrics['missing_' + field] = sum(not verified(p, field) for p in products)
    return {'schema_version': 1, 'generated_at': today.isoformat(), 'coverage_status': 'beta/incomplete',
            'verification_basis': 'Mixed: explicitly labelled inherited baseline and fresh manual official field review',
            'global': metrics, 'brands': by_brand}


def report(cov, queue):
    counts = Counter(e['type'] for e in queue['events'] if e['status'] == 'pending_review')
    lines = ['# Catalog health', '', f"Generated: {cov['generated_at']} · Beta / incomplete", '',
             'Official market denominators unknown; no market coverage percentage is asserted.',
             'Verified means field-scoped identity/type/BTU evidence; inherited and fresh review are labelled separately.',
             'Link health is untested unless an adapter supplies an explicit observation.', '', '## Metrics', '']
    lines += [f'- {k}: {v}' for k, v in cov['global'].items()]
    lines += ['', '## Review queue', ''] + [f'- {k}: {counts[k]}' for k in sorted(EVENTS)]
    lines += ['', '## Brand coverage', '', '| Brand | Ingested | Verified | Ready | Discovered | Coverage | Status |',
              '|---|---:|---:|---:|---|---|---|']
    for b in cov['brands']:
        lines.append(f"| {b['brand']} | {b['ingested_count']} | {b['verified_count']} | {b['recommendation_ready_count']} | Unknown | Not audited | {b['status']} |")
    lines += ['', '## Pending events', '']
    lines += [f"- {e['type']} · {e['product_id']} · {json.dumps(e['detail'], ensure_ascii=False)}" for e in queue['events'] if e['status'] == 'pending_review']
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--previous', type=Path, default=ROOT / 'data/aircon_catalog.json')
    parser.add_argument('--current', type=Path, help='Saved discovered snapshot; omission uses mirror, no network discovery')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'reports/latest')
    parser.add_argument('--as-of', default=date.today().isoformat())
    parser.add_argument('--check-mirror', action='store_true')
    args = parser.parse_args()
    previous = read(args.previous)
    mirror = read(ROOT / 'data/aircon_catalog.json')
    if args.check_mirror and mirror != inline_catalog():
        raise SystemExit('Catalog mirror differs from runtime PRODUCTS')
    current = SnapshotAdapter().discover(args.current) if args.current else mirror
    today = date.fromisoformat(args.as_of)
    events = compare(previous, current, today)
    base_queue = read(ROOT / 'data/catalog_review_queue.json')
    merged = {e['event_id']: e for e in base_queue['events']}
    for event in events:
        merged.setdefault(event['event_id'], event)
    queue = {'schema_version': 1, 'generated_at': today.isoformat(),
             'mode': 'saved_snapshot' if args.current else 'offline_baseline_no_discovery',
             'events': list(merged.values()), 'automatic_promotion': False}
    cov = coverage(mirror, read(ROOT / 'data/source_registry.json'), today)
    # Even user-supplied outputs may not overwrite recommendation data.
    output = args.output_dir.resolve()
    if output == (ROOT / 'data').resolve() or (ROOT / 'data').resolve() in output.parents:
        raise SystemExit('Reports cannot be written inside data/')
    write(output / 'catalog_review_queue.json', queue)
    write(output / 'aircon_catalog_coverage.json', cov)
    (output / 'CATALOG_HEALTH.md').write_text(report(cov, queue), encoding='utf-8')
    print(f'{len(rows(mirror))} runtime-mirrored records; {len(events)} events; no catalog mutations; {queue["mode"]}')


if __name__ == '__main__':
    main()
