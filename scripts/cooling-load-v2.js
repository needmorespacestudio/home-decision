(function(){
  'use strict';

  const HD_CLV2_VERSION='2.0-shadow';
  const legacyLoad=typeof load==='function'?load:null;
  const legacyGetQs=typeof getQs==='function'?getQs:null;
  const legacySiteFlags=typeof siteFlags==='function'?siteFlags:null;
  const legacyConfigurationResult=typeof configurationResult==='function'?configurationResult:null;

  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  function known(v){return v!==null&&v!==undefined&&v!==''&&v!=='unknown'}
  function round(v){return Math.round(v)}
  function btuFromW(w){return w*3.412142}
  function quickLoadQuestions(){
    if(typeof flowMode==='undefined'||flowMode!=='quick'||typeof s==='undefined')return [];
    const q=[];
    const strong=['afternoon','all'].includes(s.sun);
    if((strong||Number(s.area)>=25||s.room==='ld')&&!known(s.glass)){
      q.push(['glass','กระจกฝั่งที่รับแดดเยอะประมาณไหน?',[
        ['low','น้อย — ไม่ถึงประมาณ 1/4 ของผนัง'],
        ['medium','ปานกลาง — ราว 1/4 ถึงครึ่งผนัง'],
        ['high','เยอะ — มากกว่าครึ่งผนัง'],
        ['unknown','ไม่แน่ใจ']
      ]]);
    }
    if((strong||Number(s.area)>=25)&&!known(s.roof)){
      q.push(['roof','ห้องนี้อยู่ชั้นบนสุดหรือใต้หลังคาร้อนไหม?',[
        ['no','ไม่ — มีห้องหรือพื้นที่ใช้งานอยู่ด้านบน'],
        ['yes','ใช่ — อยู่ชั้นบนสุด / ใต้หลังคา'],
        ['unknown','ไม่แน่ใจ']
      ]]);
    }
    if((Number(s.area)>=30||s.room==='ld')&&!known(s.open)){
      q.push(['open','พื้นที่นี้เปิดเชื่อมกับส่วนอื่นมากแค่ไหน?',[
        ['closed','ค่อนข้างปิด — มีประตู/ผนังกั้นชัดเจน'],
        ['partial','เปิดเชื่อมบางส่วน'],
        ['open','Open plan — เชื่อมต่อกันกว้าง'],
        ['unknown','ไม่แน่ใจ']
      ]]);
    }
    return q;
  }

  function windowRatio(v){return ({low:.08,medium:.20,high:.38,unknown:.22}[v]??.22)}
  function exposedWallFactor(room){return ({bed:.45,living:.60,ld:.72,office:.55}[room]??.58)}
  function ach(open,room){
    const base=({closed:.35,partial:.65,open:1.0,unknown:.60}[open]??.60);
    return room==='ld'?base+.10:base;
  }
  function usageSolarFactor(usage){return ({night:.20,day:.80,afternoon:1.00,long:.90}[usage]??.85)}
  function solarFlux(sun){return ({shade:55,morning:145,afternoon:265,all:320,unknown:195}[sun]??195)}
  function internalWm2(room){return ({bed:5,living:8,ld:10,office:13}[room]??8)}

  function componentLoad(){
    const area=clamp(Number(s.area)||15,5,250);
    const h=clamp(Number(s.height)||2.7,2.3,5.5);
    const deltaT=11;
    const perimeter=4*Math.sqrt(area);
    const exposedWall=Math.max(0,perimeter*h*exposedWallFactor(s.room));
    const winArea=exposedWall*windowRatio(s.glass);
    const opaqueWall=Math.max(0,exposedWall-winArea);
    const roofArea=s.roof==='yes'?area:s.roof==='unknown'?area*.35:area*.08;

    const Uwall=2.2, Uroof=1.5, Uwindow=5.7, shgc=.65;
    const wallTransmission=Uwall*opaqueWall*deltaT;
    const roofTransmission=Uroof*roofArea*deltaT;
    const windowTransmission=Uwindow*winArea*deltaT;

    const wallSolarEquivalent=opaqueWall*({shade:12,morning:24,afternoon:42,all:50,unknown:30}[s.sun]??30)*usageSolarFactor(s.usage);
    const roofSolarEquivalent=roofArea*(s.roof==='yes'?58:s.roof==='unknown'?20:5)*usageSolarFactor(s.usage);
    const solarWindow=winArea*shgc*solarFlux(s.sun)*usageSolarFactor(s.usage);

    const volume=area*h;
    const airChanges=ach(s.open,s.room);
    const flow=airChanges*volume/3600;
    const infiltrationSensible=1.2*1000*flow*deltaT;
    const deltaW=({closed:.0075,partial:.0085,open:.0100,unknown:.0085}[s.open]??.0085);
    const infiltrationLatent=3.01e6*flow*deltaW;

    const people=Math.max(1,Number(s.people)||2);
    const peopleSensible=people*75;
    const peopleLatent=people*55;
    const internal=area*internalWm2(s.room);

    const sensibleW=wallTransmission+roofTransmission+windowTransmission+wallSolarEquivalent+roofSolarEquivalent+solarWindow+infiltrationSensible+peopleSensible+internal;
    const latentW=infiltrationLatent+peopleLatent;
    const totalW=sensibleW+latentW;

    const unresolved=[];
    if(!known(s.glass))unresolved.push('พื้นที่กระจก');
    if(!known(s.roof))unresolved.push('สภาพชั้นบน/หลังคา');
    if(!known(s.open))unresolved.push('การเปิดเชื่อมพื้นที่');
    if(!known(s.height))unresolved.push('ความสูงฝ้า');
    if(!known(s.sun))unresolved.push('แดด');
    if(!known(s.people))unresolved.push('จำนวนคน');

    const risky=[];
    if(area>=80)risky.push('large_area');
    if(h>3.5)risky.push('high_ceiling');
    if(s.glass==='high'&&['afternoon','all'].includes(s.sun))risky.push('high_solar_glazing');
    if(s.open==='open')risky.push('open_plan');
    if(s.shape==='connected')risky.push('connected_rooms');
    if(s.room==='ld')risky.push('pantry_heat_source_unknown');

    let confidence='high';
    if(unresolved.length>=2||risky.length>=2)confidence='low';
    else if(unresolved.length||risky.length)confidence='medium';
    const uncertainty=confidence==='high'?.12:confidence==='medium'?.20:.30;
    const mid=btuFromW(totalW);
    const low=mid*(1-uncertainty);
    const high=mid*(1+uncertainty);

    const legacy=legacyLoad?legacyLoad():null;
    const ratio=legacy&&legacy.mid?mid/legacy.mid:null;
    const crosscheck=ratio==null?'unavailable':ratio<.70?'component_lower_than_legacy':ratio>1.35?'component_higher_than_legacy':'aligned';

    return {
      version:HD_CLV2_VERSION,
      method:'component_shadow',
      sensible_btu:round(btuFromW(sensibleW)),
      latent_btu:round(btuFromW(latentW)),
      mid:round(mid),low:round(low),high:round(high),
      confidence,unresolved,risky,crosscheck,
      legacy:legacy?{low:round(legacy.low),mid:round(legacy.mid),high:round(legacy.high)}:null,
      components:{
        opaque_wall:round(btuFromW(wallTransmission+wallSolarEquivalent)),
        roof:round(btuFromW(roofTransmission+roofSolarEquivalent)),
        glazing:round(btuFromW(windowTransmission+solarWindow)),
        infiltration_sensible:round(btuFromW(infiltrationSensible)),
        infiltration_latent:round(btuFromW(infiltrationLatent)),
        occupants:round(btuFromW(peopleSensible+peopleLatent)),
        internal:round(btuFromW(internal))
      },
      assumptions:{
        indoor_c:24,outdoor_c:35,delta_t_k:deltaT,
        envelope_archetype:'default_thai_residential_unverified',
        window_ratio:windowRatio(s.glass),
        exposed_wall_factor:exposedWallFactor(s.room),
        air_changes_per_hour:Math.round(airChanges*100)/100,
        note:'Engineering-informed shadow estimator only; not Manual J/ASHRAE-compliant software and not yet promoted to production sizing.'
      }
    };
  }

  window.homeDecisionCoolingLoadV2=componentLoad;

  if(legacyGetQs){
    getQs=function(){
      const current=legacyGetQs();
      if(typeof flowMode==='undefined'||flowMode!=='quick')return current;
      const extras=quickLoadQuestions().filter(q=>!current.some(x=>x[0]===q[0]));
      if(!extras.length)return current;
      const sunIndex=current.findIndex(q=>q[0]==='sun');
      const insertAt=sunIndex>=0?sunIndex+1:Math.min(3,current.length);
      return [...current.slice(0,insertAt),...extras,...current.slice(insertAt)];
    };
  }

  if(legacyLoad){
    load=function(){
      const primary=legacyLoad();
      const engineering=componentLoad();
      const confidence=engineering.confidence;
      const rangePenalty=confidence==='low'?.12:confidence==='medium'?.06:0;
      return {
        ...primary,
        low:primary.low*(1-rangePenalty),
        high:primary.high*(1+rangePenalty),
        engineering_v2:engineering,
        confidence,
        method:'validated_legacy_primary_with_v2_shadow'
      };
    };
  }

  if(legacySiteFlags){
    siteFlags=function(){
      const flags=legacySiteFlags();
      const L=load();
      const e=L.engineering_v2;
      if(e?.confidence==='low')flags.push('ข้อมูล Cooling Load ยังไม่พอสำหรับความมั่นใจสูง ต้องตรวจหน้างานก่อนซื้อ');
      if(e?.crosscheck==='component_lower_than_legacy'||e?.crosscheck==='component_higher_than_legacy')flags.push('โมเดลคำนวณสองวิธีให้ผลต่างกันมาก ต้องให้ผู้เชี่ยวชาญตรวจค่าก่อนฟันธงขนาด');
      return [...new Set(flags)];
    };
  }

  function confidenceThai(v){return v==='high'?'สูง':v==='medium'?'ปานกลาง':'ต่ำ'}
  function componentRows(e){
    const names={opaque_wall:'ผนังภายนอก',roof:'หลังคา/ฝ้า',glazing:'กระจกและแดด',infiltration_sensible:'อากาศภายนอก — sensible',infiltration_latent:'อากาศภายนอก — latent/ความชื้น',occupants:'คน',internal:'ไฟ/อุปกรณ์โดยประมาณ'};
    return Object.entries(e.components).map(([k,v])=>`<p><b>${names[k]||k}</b>: ${Number(v).toLocaleString('th-TH')} BTU/h</p>`).join('');
  }
  function loadAuditHTML(){
    const e=componentLoad();
    const unresolved=e.unresolved.length?`<p class="warning">ถ้าอยากให้แม่นขึ้น: ${e.unresolved.join(' · ')}</p>`:'';
    const discrepancy=e.crosscheck==='aligned'?'ข้อมูลช่วยประเมินช่วงขนาดเบื้องต้นได้ แต่ยังต้องตรวจเงื่อนไขติดตั้งจริง':e.crosscheck==='unavailable'?'ข้อมูลสำหรับตรวจขนาดซ้ำยังไม่ครบ ควรให้ช่างตรวจ':'ช่วงขนาดยังมีความไม่แน่นอนสูง ควรให้ช่างตรวจหน้างานก่อนเลือกเครื่องจริง';
    return `<section class="loadAudit card"><span class="kicker">สิ่งที่ควรตรวจเพิ่ม</span><h3>ความครบของข้อมูลห้อง: ${confidenceThai(e.confidence)}</h3><p>ข้อมูลห้องที่ชัดเจนช่วยลดตัวเลือกได้ แต่ยังไม่ยืนยันขนาดเครื่องและตำแหน่งติดตั้งหน้างาน</p>${unresolved}<p class="muted">${discrepancy}</p><details class="disclosure"><summary>ดูรายละเอียดการคำนวณแบบแยกองค์ประกอบ</summary><p><b>Sensible</b>: ${e.sensible_btu.toLocaleString('th-TH')} BTU/h</p><p><b>Latent / ความชื้น</b>: ${e.latent_btu.toLocaleString('th-TH')} BTU/h</p><p><b>ช่วงประเมินประกอบการตรวจซ้ำ</b>: ${e.low.toLocaleString('th-TH')}–${e.high.toLocaleString('th-TH')} BTU/h</p>${componentRows(e)}<p class="disclaimer">เป็นค่าประเมินเพิ่มเติมที่ยังรอการตรวจจากผู้เชี่ยวชาญ ไม่ใช่ผลสำรวจหรือแบบวิศวกรรม และไม่ใช้แทนการตรวจหน้างาน</p></details></section>`;
  }

  if(legacyConfigurationResult){
    configurationResult=function(){
      legacyConfigurationResult();
      const hero=document.querySelector('#result .answerHero');
      if(hero&&!document.querySelector('#result .loadAudit'))hero.insertAdjacentHTML('afterend',loadAuditHTML());
    };
  }
})();