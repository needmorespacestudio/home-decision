import copy
import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from catalog_watcher import compare, coverage, inline_catalog, read, ROOT, EVENTS


class WatcherTests(unittest.TestCase):
    def test_all_event_types_and_no_promotion(self):
        p = {'id': 'existing', 'brand': 'Brand', 'model': 'Model', 'family_id': 'family',
             'checked_at': '2026-08-01', 'official_source': 'https://example.test/old',
             'recommendation_ready': False, 'seer': 18, 'price_thb': 100}
        absent = dict(p, id='absent')
        changed = dict(p, model='Renamed', seer=20, price_thb=110,
                       official_source='https://example.test/new',
                       source_health={'status': 'broken', 'checked_at': '2026-10-07'})
        variant = dict(p, id='variant')
        new = dict(p, id='new', family_id='new-family')
        previous = [p, absent]
        current = {'products': [changed, variant, new], 'complete_brands': ['Brand']}
        before = copy.deepcopy((previous, current))
        events = compare(previous, current, date(2026, 10, 7))
        self.assertEqual({e['type'] for e in events}, EVENTS)
        self.assertEqual((previous, current), before)
        self.assertTrue(all(not e['auto_promoted'] for e in events))
        self.assertTrue(all(not x['recommendation_ready'] for x in current['products']))

    def test_incomplete_discovery_never_discontinues(self):
        old = inline_catalog()
        self.assertEqual(compare(old, {'products': [], 'complete_brands': []}, date(2026, 10, 7)), [])

    def test_mirror_and_unknown_denominators(self):
        products = read(ROOT / 'data/aircon_catalog.json')
        self.assertEqual(products, inline_catalog())
        cov = coverage(products, read(ROOT / 'data/source_registry.json'), date(2026, 10, 7))
        self.assertEqual(cov['global']['records'], len(products))
        self.assertTrue(all(b['coverage_pct'] is None and b['discovered_count'] is None for b in cov['brands']))

    def test_staleness_boundary_and_idempotent_events(self):
        p = dict(inline_catalog()[0], checked_at='2026-09-07')
        self.assertEqual(compare([p], [p], date(2026, 10, 6)), [])
        first = compare([p], [p], date(2026, 10, 7))
        later = compare([p], [p], date(2026, 10, 8))
        self.assertEqual(first[0]['type'], 'DATA_STALE')
        self.assertEqual(first[0]['event_id'], later[0]['event_id'])


if __name__ == '__main__':
    unittest.main()
