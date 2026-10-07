"""Tier-C snapshot normalization and review, never a runtime catalog writer."""
import argparse, hashlib, json, re, unicodedata
from collections import Counter
from datetime import date
from pathlib import Path
from catalog_watcher import ROOT, read, write

FIELDS = ['model','family','inverter','nominal_btu','seer','energy_label','wifi_indicator','pm25_indicator','compressor_warranty_years','price_value','source_note']
ALIASES = {'ไดกิ้น':'Daikin','มิตซูบิชิ อีเล็คทริค':'Mitsubishi Electric','mitsubishi electric':'Mitsubishi Electric','mitsubishi heavy duty':'Mitsubishi Heavy Duty','mhi':'Mitsubishi Heavy Duty','พานาโซนิค':'Panasonic','แคเรียร์':'Carrier','โตชิบา':'Toshiba','ชาร์ป':'Sharp','ไฮเออร์':'Haier','ไฮเซนส์':'Hisense','ซัยโจ เด็นกิ':'Saijo Denki','xiaomi mijia':'Xiaomi','xiaomi':'Xiaomi','star aire':'Star Aire','shinflow':'Shinflow'}
MAJOR = {'Daikin','Mitsubishi Electric','Mitsubishi Heavy Duty','Carrier','Panasonic','Samsung','LG','Sharp','Toshiba','Haier'}

def brand_alias(value):
    return ALIASES.get(value.strip().casefold(),value.strip())

def model_key(value):
    value = unicodedata.normalize('NFKC',value or '').upper().strip()
    # Explicit slash shorthand only; suffix/color/electrical distinctions retained.
    m = re.fullmatch(r'(CS)/(CU)-(.+)',value)
    if m: value = f'CS-{m[3]}/CU-{m[3]}'
    return re.sub(r'\s+','',value)

def number(value):
    value = (value or '').replace(',','').strip()
    return float(value) if re.fullmatch(r'\d+(?:\.\d+)?',value) else None

def thai_search(value):
    # PDF glyph order varies; strip spaces and Thai combining marks for notes only.
    return re.sub(r'[\s\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]','',value)

def price_scope(model, note):
    compact = re.sub(r'\s+','',model+' '+note)
    if thai_search('ไม่รวมติดตั้ง') in thai_search(compact): return 'unit_only'
    if thai_search('รวมท่อ') in thai_search(compact): return 'includes_pipe'
    if thai_search('รวมติดตั้ง') in thai_search(compact): return 'includes_standard_installation'
    # Report says MOST prices include installation, which is not row evidence.
    return 'unclear'

def normalize(row):
    cells = [' '.join(c.split()) for c in row['cells']]
    brand = brand_alias(row['brand'])
    if cells[2] not in ('Inverter','Fixed Speed'):
        cells = [cells[0], '', *cells[1:]] # Gree/Comfee have empty series column?
    if row['brand'] in ('KUKU','Shinflow','Star Aire','XIAOMI','Xiaomi'):
        cells = [cells[1],'',*cells[2:]]
    model, family, system, btu, seer, label, wifi, air, warranty, price, note = cells
    compact_note = re.sub(r'\s+','',note)
    historical = thai_search('รุ่นปีก่อน') in thai_search(compact_note)
    # Remove explanatory parentheses, but preserve enumerated colors and codes.
    candidate = re.sub(r'\([^)]*(?:inverter|ArtCool|DUALCOOL|CC-PRO|Elite|FreshIN|T-Pro)[^)]*\)','',model,flags=re.I).strip()
    candidate = re.sub(r'^(?:Air Creator|BUTTA|CD Series|MIJIA)\s+','',candidate,flags=re.I)
    candidate = candidate.split(' + ')[0]
    bundle = '+' in model
    colors = re.findall(r'\(([WKBPS/]+)\)',candidate)
    if '/B' in candidate and candidate.startswith('SRK'): colors.append('W1/B')
    exact = bool(re.fullmatch(r'[A-Z0-9][A-Z0-9./_()\-]+',candidate) and re.search(r'[A-Z]',candidate) and re.search(r'\d',candidate))
    if colors or bundle: exact = False
    model = candidate if exact else model
    p = {'id':row['id'],'brand':brand,'model':model,'family':family or None,'family_id':None,'model_key':model_key(model),'identity_status':'exact_code_reported' if exact else 'needs_model_code_review','type':'wall','inverter':system=='Inverter','nominal_btu':number(btu),'seer':number(seer),'energy_metric_type':'SEER' if number(seer) else None,'energy_metric_value':number(seer),'energy_label':{'number':5 if re.search(r'5',label) else None,'star_count':int(re.search(r'★(\d)',label)[1]) if re.search(r'★(\d)',label) else (0 if re.search(r'5',label) else None)},'wifi_indicator':True if '✓' in wifi else None,'wifi_status':'unknown','pm25_indicator':True if '✓' in air else None,'air_quality_capabilities':[],'compressor_warranty_years':number(warranty),'warranty_scopes':[],'price_value':number(price),'price_source':note,'price_source_type':'user_supplied_report','price_scope':price_scope(row['cells'][0],note),'price_status':'historical' if number(price) else 'no_price','price_checked_at':None,'price_history':[],'source_note':note,'lifecycle':'historical' if historical else 'unclear','lifecycle_note':note if historical else None,'availability_status':'unknown','bundle':bundle,'color_variant_indication':colors,'source_type':'user_supplied_report','source_tier':'C','verification_status':'ingested','recommendation_ready':False,'verified_fields':[],'evidence':{},'conflicts':[]}
    raw_model = row['cells'][1] if row['brand'] in ('KUKU','Shinflow','Star Aire','XIAOMI','Xiaomi') else row['cells'][0]
    p['price_scope'] = price_scope(raw_model,note)
    for field in ['min_btu','max_btu','phase','voltage','frequency_hz','refrigerant','noise_low_dba','noise_mode','official_source','image_url']: p[field]=None
    for field in FIELDS+['type','lifecycle','bundle','price_scope']:
        column=FIELDS.index(field) if field in FIELDS else None
        if column is not None and row['brand'] in ('KUKU','Shinflow','Star Aire','XIAOMI','Xiaomi'):
            column=1 if field=='model' else None if field=='family' else column
        p['evidence'][field]={'tier':'C','source_id':'aircon-thailand-2026-v2','page':row['page'],'table':row['table'],'row':row['row'],'column':column,'raw_cell':row['cells'][column] if column is not None else None,'continuations':row.get('continuations',[]),'bbox':row['bbox'],'raw_row_id':row['id'],'checked_at':None,'reported_at':'2026-10-07','confidence':'unverified_report','verification_status':'unverified'}
    if p['price_value'] is not None:
        p['price_history'].append({k:p[k] for k in ['price_value','price_source','price_source_type','price_scope','price_status','price_checked_at']} | {'reported_at':'2026-10-07','tier':'C'})
    return p

def promotion_errors(p,today=None):
    errors=[]
    if p.get('source_tier') != 'A' or p.get('source_type') != 'official_thailand': errors.append('official_record_required')
    if not isinstance(p.get('nominal_btu'),(int,float)) or isinstance(p.get('nominal_btu'),bool) or p.get('nominal_btu',0)<=0: errors.append('invalid_nominal_btu')
    if p.get('bundle') or p.get('identity_status') != 'exact_code_reported': errors.append('identity_not_exact_unit')
    if p.get('lifecycle') != 'current': errors.append('lifecycle_not_current')
    if p.get('conflicts'): errors.append('unresolved_conflict')
    for f in ('model','type','nominal_btu','phase','voltage','frequency_hz','refrigerant','lifecycle'):
        ev=p.get('evidence',{}).get(f,{})
        if p.get(f) is None or ev.get('tier')!='A' or ev.get('verification_status')!='verified' or not ev.get('checked_at') or not str(ev.get('source','')).startswith('https://'): errors.append('missing_official_'+f)
        else:
            if ev.get('value') != p.get(f): errors.append('evidence_value_mismatch_'+f)
            try:
                age=((today or date.today())-date.fromisoformat(ev['checked_at'])).days
                if not 0<=age<=30: errors.append('stale_'+f)
            except ValueError: errors.append('invalid_date_'+f)
    if not p.get('promotion_review',{}).get('reviewer'): errors.append('explicit_review_required')
    return errors

def reconcile(p,catalog):
    labels=[]
    if p['lifecycle']=='historical': labels.append('HISTORICAL/PREVIOUS_YEAR')
    if p['identity_status']!='exact_code_reported': return labels+['NEEDS_MODEL_CODE_REVIEW'],[]
    matches=[x for x in catalog if brand_alias(x['brand'])==p['brand'] and (model_key(x['model'])==p['model_key'] or (x.get('indoor_model') and model_key(x['indoor_model'])==p['model_key']))]
    if len(matches)>1: labels.append('POSSIBLE_DUPLICATE')
    if matches:
        labels.append('EXACT_MATCH_EXISTING')
        for x in matches:
            for f in ('nominal_btu','seer','inverter'):
                if p.get(f) is not None and x.get(f) is not None and p[f]!=x[f]:
                    p['conflicts'].append({'field':f,'reported_value':p[f],'catalog_value':x[f],'catalog_id':x['id'],'status':'pending_review'})
        if p['conflicts']: labels.append('CONFLICTING_SPEC')
    else: labels.append('NEW_EXACT_MODEL')
    # Same-family status needs explicit stable family_id, never naming resemblance.
    if p.get('family_id') and any(x.get('family_id')==p['family_id'] and x['brand']==p['brand'] for x in catalog): labels.append('SAME_FAMILY_NEW_CAPACITY')
    return labels,[x['id'] for x in matches]

def events(p):
    kinds=[]
    if 'NEW_EXACT_MODEL' in p['reconciliation']: kinds.append('NEW_MODEL')
    if 'SAME_FAMILY_NEW_CAPACITY' in p['reconciliation']: kinds.append('NEW_VARIANT')
    if 'NEEDS_MODEL_CODE_REVIEW' in p['reconciliation']: kinds.append('POSSIBLE_DUPLICATE')
    if p['conflicts']: kinds.append('SPEC_CONFLICT')
    if p['price_value']: kinds.append('PRICE_REFRESH_REQUIRED')
    if p['lifecycle']!='current': kinds.append('LIFECYCLE_UNCLEAR')
    if p['lifecycle']=='historical': kinds.append('POSSIBLE_DISCONTINUED')
    kinds += ['SOURCE_MISSING','AIR_QUALITY_UNVERIFIED','ELECTRICAL_UNVERIFIED','IMAGE_MISSING']
    priority=1 if p['brand'] in MAJOR and p['nominal_btu'] and 8000<=p['nominal_btu']<=26000 and p['lifecycle']!='historical' else 2 if p['nominal_btu'] and p['nominal_btu']>=28000 else 3
    return [{'event_id':hashlib.sha256((k+p['id']).encode()).hexdigest()[:20],'type':k,'product_id':p['id'],'brand':p['brand'],'model':p['model'],'detected_at':'2026-10-07','status':'pending_review','priority':priority,'detail':{'import_source':'aircon-thailand-2026-v2','reconciliation':p['reconciliation'],'conflicts':p['conflicts']},'auto_promoted':False} for k in kinds]

def main():
    source=read(ROOT/'data/imports/aircon_thailand_2026_v2_raw.json')
    catalog=read(ROOT/'data/aircon_catalog.json')
    products=[normalize(x) for x in source['rows']]
    counts=Counter((p['brand'],p['model_key']) for p in products)
    for p in products:
        p['reconciliation'],p['existing_catalog_ids']=reconcile(p,catalog)
        if counts[p['brand'],p['model_key']]>1: p['reconciliation'].append('POSSIBLE_DUPLICATE')
    write(ROOT/'data/imports/aircon_thailand_2026_v2_normalized.json',{'products':products,'complete_brands':[],'source_tier':'C','no_auto_promotion':True})
    write(ROOT/'data/imports/aircon_thailand_2026_v2_provenance.json',{'sha256':source['sha256'],'pages_read':list(range(1,31)),'fields':{p['id']:p['evidence'] for p in products},'brand_summaries':source['summaries'],'notes_by_page':[{'page':p['page'],'text':p['text']} for p in source['pages'] if p['page'] in [4,5,8,10,13,17,21,22,23,24,27,28,29,30]]})
    queue=read(ROOT/'data/catalog_review_queue.json')
    existing=queue if isinstance(queue,list) else queue['events']
    generated={e['event_id']:e for p in products for e in events(p)}
    known={e['event_id'] for e in existing}
    new=[e for key,e in generated.items() if key not in known]
    # Refresh pending findings after extraction fixes; retain reviewer decisions.
    merged=[generated.get(e['event_id'],e) if e.get('status')=='pending_review' else e for e in existing]+new
    write(ROOT/'data/catalog_review_queue.json',merged if isinstance(queue,list) else queue|{'events':merged})
    metrics={'source_sha256':source['sha256'],'pages_read':30,'reported_rows':362,'extracted_rows':len(products),'row_brands':len(set(p['brand'] for p in products)),'unique_exact_codes':len({(p['brand'],p['model_key']) for p in products if p['identity_status']=='exact_code_reported'}),'bundle_rows':sum(p['bundle'] for p in products),'color_group_rows':sum(bool(p['color_variant_indication']) for p in products),'historical_rows':sum(p['lifecycle']=='historical' for p in products),'conflict_rows':sum(bool(p['conflicts']) for p in products),'classifications':dict(Counter(c for p in products for c in p['reconciliation'])),'per_brand':dict(Counter(p['brand'] for p in products)),'discovered_type_counts':dict(Counter(p['type'] for p in products)),'price_scopes':dict(Counter(p['price_scope'] for p in products)),'price_status':dict(Counter(p['price_status'] for p in products)),'pdf_official_verified':0,'pdf_authorized_retailer_verified':0,'pdf_recommendation_ready':0,'runtime_records':len(catalog),'runtime_ready_total':sum(p.get('recommendation_ready',False) for p in catalog),'runtime_ready_inherited':sum(p.get('recommendation_ready',False) and p.get('verification_basis')=='inherited_baseline' for p in catalog),'denominator_coverage':None,'new_review_events':len(new)}
    batch_path=ROOT/'data/discovery/batch_a_verification.json'
    batch=read(batch_path)['products'] if batch_path.exists() else []
    metrics['manual_official_review']={'candidates':len(batch),'field_verified':sum(bool(p.get('evidence')) for p in batch),'promotion_candidates':sum(p.get('promotion_candidate',False) for p in batch),'recommendation_ready_in_staging':sum(p.get('recommendation_ready',False) for p in batch),'unresolved_conflicts':sum(bool(p.get('conflicts')) for p in batch)}
    metrics['pdf_field_presence']={f:sum(p.get(f) is not None for p in products) for f in ('nominal_btu','seer','wifi_indicator','pm25_indicator','price_value','phase','voltage','frequency_hz','noise_low_dba')}
    metrics['runtime_field_completeness']={f:{'present':sum(p.get(f) is not None for p in catalog),'denominator':len(catalog)} for f in ('nominal_btu','seer','phase','voltage','frequency_hz','noise_low_dba')}
    metrics['per_brand_lifecycle']={b:dict(Counter(p['lifecycle'] for p in products if p['brand']==b)) for b in metrics['per_brand']}
    def bucket(p):
        if p['nominal_btu'] is None: return 'unknown'
        k=min((9000,12000,15000,18000,24000,30000,36000),key=lambda k:abs(p['nominal_btu']-k))
        return str(k) if abs(p['nominal_btu']-k)<=k*.12 else 'other'
    metrics['reported_btu_buckets']=dict(Counter(bucket(p) for p in products))
    metrics['review_queue']={'events':len(merged),'pending_priorities':dict(Counter(str(e.get('priority','legacy')) for e in merged if e.get('status')=='pending_review'))}
    metrics['deployment_status']='prepared_not_published'
    write(ROOT/'reports/catalog_ingestion_health.json',metrics)
    print(json.dumps(metrics,ensure_ascii=False))

if __name__=='__main__': main()
