import sys,unittest,copy
from datetime import date
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from catalog_ingestion import *
class IngestionTests(unittest.TestCase):
 def setUp(self):
  self.raw=read(ROOT/'data/imports/aircon_thailand_2026_v2_raw.json')['rows'][0]
  self.p=normalize(self.raw)
 def test_complete_pages_and_rows(self):
  d=read(ROOT/'data/imports/aircon_thailand_2026_v2_raw.json');self.assertEqual([p['page'] for p in d['pages']],list(range(1,31)));self.assertEqual(len(d['rows']),362)
 def test_provenance_raw_cells(self):
  self.assertEqual(self.p['evidence']['nominal_btu']['raw_cell'],self.raw['cells'][3])
 def test_no_automatic_promotion(self):
  self.assertFalse(self.p['recommendation_ready']);self.assertTrue(promotion_errors(self.p,date(2026,10,7)))
 def test_empty_capabilities(self):
  self.assertEqual(self.p['air_quality_capabilities'],[])
 def test_price_history_unverified(self):
  for q in self.p['price_history']:self.assertEqual(q['tier'],'C');self.assertIsNone(q['price_checked_at'])
 def test_conflict_event(self):
  x=copy.deepcopy(self.p);x['identity_status']='exact_code_reported'
  c={'id':'existing','brand':x['brand'],'model':x['model'],'nominal_btu':1}
  x['reconciliation'],_=reconcile(x,[c]);self.assertIn('CONFLICTING_SPEC',x['reconciliation']);self.assertIn('SPEC_CONFLICT',[e['type'] for e in events(x)])
 def test_no_similar_name_merge(self):
  self.p['identity_status']='exact_code_reported';labels,ids=reconcile(self.p,[{'id':'other','brand':self.p['brand'],'model':self.p['model']+'B'}]);self.assertEqual(ids,[])
 def test_separate_mitsubishi_brands(self):
  self.p['identity_status']='exact_code_reported';self.p['brand']='Mitsubishi Electric';_,ids=reconcile(self.p,[{'id':'other','brand':'Mitsubishi Heavy Duty','model':self.p['model']}]);self.assertEqual(ids,[])
 def test_case_and_whitespace_aliases(self):
  for a,b in [('lg','LG'),('SAMSUNG','Samsung'),('COMFEE','Comfee'),('Mitsubishi  Heavy Duty','Mitsubishi Heavy Duty'),('แอลจี','LG')]:
   with self.subTest(a=a):self.assertEqual(brand_alias(a),b)
 def test_ambiguous_mitsubishi_not_assigned(self):
  self.assertEqual(brand_alias('Mitsubishi'),'Mitsubishi');self.assertEqual(brand_alias('มิตซูบิชิ'),'มิตซูบิชิ')
 def test_historical_extracted(self):
  ps=read(ROOT/'data/imports/aircon_thailand_2026_v2_normalized.json')['products'];self.assertEqual(sum(p['lifecycle']=='historical' for p in ps),35)
 def test_bundle_unready(self):
  ps=read(ROOT/'data/imports/aircon_thailand_2026_v2_normalized.json')['products'];self.assertEqual(sum(p['bundle'] for p in ps),2);self.assertTrue(all(not p['recommendation_ready'] for p in ps if p['bundle']))
 def test_color_groups_need_review(self):
  ps=read(ROOT/'data/imports/aircon_thailand_2026_v2_normalized.json')['products'];self.assertTrue(all(p['identity_status']=='needs_model_code_review' for p in ps if p['color_variant_indication']))
 def test_missing_fields_unknown(self):
  for f in ('min_btu','max_btu','phase','voltage','frequency_hz','refrigerant','noise_low_dba'):self.assertIsNone(self.p[f])
 def test_all_pdf_rows_unready(self):
  ps=read(ROOT/'data/imports/aircon_thailand_2026_v2_normalized.json')['products'];self.assertTrue(all(not p['recommendation_ready'] and p['source_tier']=='C' for p in ps))
 def test_stable_review_event_ids(self):self.p['reconciliation']=[];self.assertEqual(events(self.p),events(self.p))
 def test_ready_official_values_match(self):
  for p in read(ROOT/'data/discovery/batch_a_verification.json')['products']:
   if p.get('promotion_candidate'):self.assertEqual(promotion_errors(p,date(2026,10,7)),[])
 def test_receipts_match_stored_values(self):
  for path in ('data/discovery/batch_a_verification.json','data/aircon_catalog.json'):
   d=read(ROOT/path)
   for p in d if isinstance(d,list) else d['products']:
    for f,e in p.get('evidence',{}).items():
     if 'value' in e:self.assertEqual(e['value'],p.get(f),(p['id'],f))
 def test_gate_rejects_tier_c_even_if_marked_ready(self):
  self.p['recommendation_ready']=True;self.assertTrue(promotion_errors(self.p,date(2026,10,7)))
 def test_tier_c_with_copied_official_receipts_still_rejected(self):
  p=read(ROOT/'data/discovery/batch_a_verification.json')['products'][0];p['source_tier']='C';self.assertIn('official_record_required',promotion_errors(p,date(2026,10,7)))
 def test_gate_rejects_disputed_official_claim(self):
  p=read(ROOT/'data/discovery/batch_a_verification.json')['products'][0];p['conflicts']=[{'field':'nominal_btu'}];self.assertIn('unresolved_conflict',promotion_errors(p,date(2026,10,7)))
 def test_gate_rejects_wrong_evidence_value(self):
  p=read(ROOT/'data/discovery/batch_a_verification.json')['products'][0];p['nominal_btu']+=1;self.assertIn('evidence_value_mismatch_nominal_btu',promotion_errors(p,date(2026,10,7)))
 def test_gate_rejects_future_date(self):
  p=read(ROOT/'data/discovery/batch_a_verification.json')['products'][0];p['evidence']['model']['checked_at']='2027-01-01';self.assertIn('stale_model',promotion_errors(p,date(2026,10,7)))
 def test_gate_rejects_stale_date(self):
  p=read(ROOT/'data/discovery/batch_a_verification.json')['products'][0];p['evidence']['model']['checked_at']='2026-01-01';self.assertIn('stale_model',promotion_errors(p,date(2026,10,7)))
 def test_color_and_electrical_suffix_not_merged(self):
  self.assertNotEqual(model_key('ABC12W'),model_key('ABC12B'));self.assertNotEqual(model_key('ABC12-1'),model_key('ABC12-3'))

def case(name,fn,*args):
 def test(self):fn(self,*args)
 setattr(IngestionTests,'test_'+name,test)
for i,(a,b) in enumerate([('ไดกิ้น','Daikin'),('mitsubishi electric','Mitsubishi Electric'),('MHI','Mitsubishi Heavy Duty'),('พานาโซนิค','Panasonic'),('แคเรียร์','Carrier'),('โตชิบา','Toshiba'),('ชาร์ป','Sharp'),('ไฮเออร์','Haier'),('ไฮเซนส์','Hisense'),('XIAOMI','Xiaomi')]):case('alias_'+str(i),lambda s,a,b:s.assertEqual(brand_alias(a),b),a,b)
for i,(a,b) in enumerate([('CS/CU-XU13AKT','CS-XU13AKT/CU-XU13AKT'),(' abc 12 w ','ABC12W'),('ＡＢＣ１２','ABC12')]):case('model_key_'+str(i),lambda s,a,b:s.assertEqual(model_key(a),b),a,b)
for i,(a,b) in enumerate([('12,000',12000),('18.6',18.6),('9,000–12,000',None),('-',None),('',None)]):case('numeric_'+str(i),lambda s,a,b:s.assertEqual(number(a),b),a,b)
for i,(a,b) in enumerate([('ไม่รวมติดตั้ง','unit_only'),('รวมท่อ 4 เมตร','includes_pipe'),('HomePro','unclear')]):case('price_scope_'+str(i),lambda s,a,b:s.assertEqual(price_scope('',a),b),a,b)
if __name__=='__main__':unittest.main()
