import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('beta_summary', Path(__file__).parents[1] / 'scripts/beta_summary.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SummaryTests(unittest.TestCase):
    def test_dedup_and_denominator(self):
        with tempfile.TemporaryDirectory() as folder:
            files = []
            for n, identity, comparison, started in [(1,'a','same',1),(2,'a','better',1),(3,'b','not_tried',1),(4,'c','worse',2)]:
                row = {'schema':'home-decision-supervised-beta-v1','export_id':identity,'exported_at':f'2026-10-08T12:00:0{n}Z',
                       'metrics':dict(started=started,completed=started,results=started,successful=1,siteChecks=0,detailFlows=0,officialFlows=0,quoteFlows=0,times=[1000]),
                       'questionnaire':{'comparison':comparison,'outcome':'decided'},'private':'must not be forwarded'}
                path = Path(folder) / f'{n}.json'
                path.write_text(json.dumps(row));files.append(path)
            result = module.summarize(files)
            self.assertEqual(result['unique_page_exports'],3)
            self.assertEqual(result['comparison_denominator'],1)
            self.assertEqual(result['better_than_retailer_pct'],100)
            self.assertEqual(result['comparison']['not_tried'],1)
            self.assertNotIn('private',json.dumps(result))

    def test_rejects_wrong_schema_and_invalid_counters(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'bad.json';path.write_text('{"schema":"wrong"}')
            result = module.summarize([path])
            self.assertEqual(result['unique_page_exports'],0)
            self.assertIsNone(result['better_than_retailer_pct'])
            self.assertEqual(result['rejected_files'],['bad.json'])

if __name__ == '__main__':
    unittest.main()
