import json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from catalog_watcher import ROOT,read,verified,ready_record

class IntegrityTests(unittest.TestCase):
    def setUp(self): self.p=read(ROOT/'data/aircon_catalog.json')
    def test_unique_exact_variants(self):
        keys=[(p['brand'],p['model'],p.get('phase')) for p in self.p]
        self.assertEqual(len(keys),len(set(keys)))
    def test_ready_minimum_evidence(self):
        self.assertTrue(all(ready_record(p) for p in self.p if p.get("recommendation_ready")))
        self.assertTrue(all(p.get('evidence') and p.get('source_type')=='official_thailand' for p in self.p))
    def test_ranges_and_units(self):
        for p in self.p:
            self.assertTrue(4000<=p['nominal_btu']<=60000,p['id'])
            if verified(p,'min_btu') and verified(p,'max_btu'):
                # Published class BTU and kW converted BTU can differ by rounding (<1%).
                self.assertTrue(0<p['min_btu']<=p['nominal_btu']<=p['max_btu']*1.01,p['id'])
            if verified(p,'seer'): self.assertTrue(10<=p['seer']<=40,p['id'])
    def test_electrical_consistency(self):
        for p in self.p:
            if verified(p,'phase') and verified(p,'voltage'):
                self.assertFalse(p['phase']=='1' and '380' in str(p['voltage']),p['id'])
    def test_evidence_on_new_fields(self):
        for p in self.p:
            if p['verification_basis']=='fresh_manual_official_review':
                for key in p['verified_fields']:
                    self.assertTrue(p['evidence'][key]['source'].startswith('https://'),(p['id'],key))
                    self.assertEqual(p['evidence'][key]['checked_at'],'2026-10-07')
    def test_partial_snapshots_do_not_promote(self):
        for path in (ROOT/'data/discovery').glob('*.json'):
            d=read(path)
            self.assertEqual(d['complete_brands'],[])
            if not path.name.startswith('baseline'):
                self.assertTrue(all(p['recommendation_ready'] is False for p in d['products']))

if __name__=='__main__': unittest.main()
