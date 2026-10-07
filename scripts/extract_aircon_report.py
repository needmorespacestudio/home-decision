import pdfplumber, json, re, hashlib, argparse
from pathlib import Path
from collections import Counter

parser = argparse.ArgumentParser(description='Extract all 30 pages as a Tier C discovery snapshot; requires pdfplumber')
parser.add_argument('--pdf', required=True, type=Path)
args = parser.parse_args()
pdf = args.pdf
out = Path(__file__).resolve().parents[1] / 'data/imports'
out.mkdir(parents=True, exist_ok=True)
brands = ['Daikin','Mitsubishi Electric','Mitsubishi Heavy Duty','Carrier','Panasonic','Samsung','LG','Sharp','Toshiba','Hitachi','Haier','TCL','Hisense','Midea','AUX','Electrolux','Gree','Comfee','Saijo Denki','Other']
pages, raw, summaries = [], [], []
current = None
with pdfplumber.open(pdf) as doc:
    assert len(doc.pages) == 30, 'Unexpected PDF page count; review extraction rules before importing'
    for pi,p in enumerate(doc.pages,1):
        text = p.extract_text()
        tables = p.find_tables()
        pages.append({'page':pi,'text':text,'tables':[{'bbox':list(t.bbox),'cells':t.extract()} for t in tables]})
        if pi < 6 or pi > 28: continue
        for ti,t in enumerate(tables,1):
            preceding = p.crop((0,0,p.width,t.bbox[1])).extract_text() or ''
            headings = re.findall(r'^2\.(\d+)\s',preceding,re.M)
            if headings: current = brands[int(headings[-1])-1]
            cells = t.extract()
            if len(cells[0]) != 11:
                summaries.append({'page':pi,'table':ti,'brand':current,'bbox':list(t.bbox),'cells':cells})
                continue
            for ri,row in enumerate(cells,1):
                row = [x or '' for x in row]
                if not any(x in ('Inverter','Fixed Speed') for x in row):
                    if raw and raw[-1]['page']==pi and raw[-1]['table']==ti and not row[0] and any(row[2:]):
                        raw[-1].setdefault('continuations',[]).append({'row':ri,'bbox':list(t.rows[ri-1].bbox),'cells':row})
                        for ci,value in enumerate(row):
                            if value: raw[-1]['cells'][ci]+='\n'+value
                    continue
                brand = current
                if current == 'Other':
                    brand = {'KUKU':'KUKU','SHINFLOW':'Shinflow','STAR AIRE':'Star Aire','XIAOMI MIJIA':'Xiaomi'}.get(row[0],row[0])
                raw.append({'id':f'pdf2026-p{pi:02}-t{ti}-r{ri:02}','brand':brand,'page':pi,'table':ti,'row':ri,'bbox':list(t.rows[ri-1].bbox),'cells':row,'source_tier':'C'})

def write(name,value): (out/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
write('aircon_thailand_2026_v2_raw.json',{'source':'user_supplied_report','sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'reported_date':'2026-10-07','reported_rows':362,'reported_brands':22,'pages':pages,'rows':raw,'summaries':summaries})
print(len(raw),Counter(r['brand'] for r in raw))
