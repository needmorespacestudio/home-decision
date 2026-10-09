import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from catalog_review_priorities import audit

class CatalogReviewTest(unittest.TestCase):
    def test_missing_evidence_and_deferred(self):
        p={'id':'x','recommendation_ready':True,'source_tier':'A','lifecycle':'current','verified_fields':['phase'],'phase':'1','evidence':{}}
        r=audit([p])
        self.assertEqual(r['queue'][0]['priority'],'high')
        self.assertIn('phase',r['queue'][0]['missing_evidence'])
        self.assertIsNone(r['market_denominator'])
        p['recommendation_ready']=False
        self.assertEqual(audit([p])['queue'][0]['priority'],'deferred')

if __name__=='__main__': unittest.main()
