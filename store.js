/* LIMINAL SPACE — 공용 데이터 계층 (정규화 테이블 / localStorage 자동 선택)
 * 원격(Supabase): branches, classes, class_details, default_slots, schedule_slots, schedule_days, applications
 *   - 화면 코드는 기존과 동일하게 settings 객체 / apps 배열을 다룹니다.
 *   - store.js가 테이블 ↔ 객체를 조립/분해하고, 지점/클래스는 자연키로 안정 ID를 유지합니다.
 *   - 신청(applications)은 branch_id / class_id (코드)로 저장됩니다.
 * 로컬(localStorage): 설정/신청을 JSON으로 저장(기존 동작 유지).
 */
(function(){
  var CFG = window.SUPA_CONFIG || {};
  var KEY_APPS = 'liminal_applications', KEY_SET = 'liminal_settings';
  var useRemote = !!(CFG.url && CFG.anonKey && window.supabase && window.supabase.createClient);
  var client = useRemote ? window.supabase.createClient(CFG.url, CFG.anonKey) : null;
  var cache = { settings:{}, apps:[] };
  // schedule/defaultSchedule의 "저장 전" 스냅샷 — cache.settings.schedule은 화면 코드가 saveSettings() 호출 *전에*
  // 직접 in-place로 미리 mutate해버리기 때문에(같은 객체 참조를 공유), cache.settings를 그대로 "old" 기준으로 쓰면
  // old와 new가 항상 같아져서 diff가 항상 "변경 없음"으로 오판한다. 그래서 별도로 깊은 복사본을 들고 있는다.
  var _lastSchedule=null, _lastDefaultSchedule=null;
  function deepClone(o){ try{ return JSON.parse(JSON.stringify(o||{})); }catch(e){ return {}; } }

  function lsGet(k,f){ try{ return JSON.parse(localStorage.getItem(k)||f); }catch(e){ return JSON.parse(f); } }
  function lsSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function rid(p){ return p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
  function ko(v){ return (v&&typeof v==='object')?(v.ko||v.en||v.vi||''):(v||''); }
  function en(v){ return (v&&typeof v==='object')?(v.en||''):''; }
  function vi(v){ return (v&&typeof v==='object')?(v.vi||''):''; }
  function tri(k,e,v){ return {ko:k||'',en:e||'',vi:v||''}; }
  function numOrNull(x){ if(x===''||x==null) return null; var n=Number(x); return isNaN(n)?null:n; }
  // 시간대 배열의 내용을 순서 무관하게 비교하기 위한 서명 (변경된 날짜/지점만 골라내는 데 사용)
  function slotSig(arr){ return (arr||[]).map(function(s){return (s.time||'')+'|'+(s.cls||'')+'|'+(s.cap||0);}).sort().join(',,'); }

  /* ---------- 조립: 테이블 rows → settings 객체 / apps 배열 ---------- */
  function assemble(t){
    var branchById={}, classById={}; // id→{branch,nameKo}
    var settings={ branches:[], branchClasses:[], classDetails:[], defaultSchedule:{}, schedule:{}, site:{}, gallery:[], partners:[], galleryFolders:[], space:[], spaceFolders:[] };
    (t.branches||[]).sort(function(a,b){return (a.sort||0)-(b.sort||0);}).forEach(function(b){
      branchById[b.id]=b.name;
      settings.branches.push({ id:b.id, name:b.name, nameI18n:{ko:b.name||'',en:b.name_en||'',vi:b.name_vi||''}, contact:b.contact||'', link:b.link||'',
        location:tri(b.location_ko,b.location_en,b.location_vi), hours:tri(b.hours_ko,b.hours_en,b.hours_vi),
        instagram:b.instagram||'', facebook:b.facebook||'', linktree:b.linktree||'', tiktok:b.tiktok||'' });
    });
    var si=(t.site_info||[])[0]; if(si){ settings.site={ brandName:si.brand_name||'', estYear:si.est_year||'', copyrightYear:si.copyright_year||'',
        bizName:si.biz_name||'', bizAddress:si.biz_address||'', bizTax:si.biz_tax||'', bizPhone:si.biz_phone||'', bizEmail:si.biz_email||'', moitUrl:si.moit_url||'', moitLogo:si.moit_logo||'', conceptMedia:si.concept_media||'', conceptAutoplay:si.concept_autoplay===true,
        heroLogo:si.hero_logo||'', notifyEmail:si.notify_email||'', notifyOn:si.notify_on!==false, zaloOn:si.zalo_on===true, confirmMailOn:si.confirm_mail_on===true,
        zaloRemindOn:si.zalo_remind_on===true, zaloRemindHour:si.zalo_remind_hour||'10:00',
        conceptList:(function(){var a=[];try{a=JSON.parse(si.concept_json||'[]')||[];}catch(e){a=[];} if(!a.length&&si.concept_media)a=[si.concept_media]; return a.filter(Boolean).slice(0,5);})() };
      try{ settings.gallery=JSON.parse(si.gallery_json||'[]')||[]; }catch(e){ settings.gallery=[]; }
      try{ settings.partners=JSON.parse(si.partners_json||'[]')||[]; }catch(e){ settings.partners=[]; }
      try{ settings.galleryFolders=JSON.parse(si.galleryfolders_json||'[]')||[]; }catch(e){ settings.galleryFolders=[]; }
      try{ settings.space=JSON.parse(si.space_json||'[]')||[]; }catch(e){ settings.space=[]; }
      try{ settings.spaceFolders=JSON.parse(si.spacefolders_json||'[]')||[]; }catch(e){ settings.spaceFolders=[]; } }
    (t.classes||[]).sort(function(a,b){return (a.sort||0)-(b.sort||0);}).forEach(function(c){
      var bn=branchById[c.branch_id]||''; classById[c.id]={branch:bn, nameKo:c.name_ko||''};
      settings.branchClasses.push({ id:c.id, branch:bn, order:c.sort||0,
        name:tri(c.name_ko,c.name_en,c.name_vi), desc:tri(c.desc_ko,c.desc_en,c.desc_vi), active:c.active!==false, inquiry:c.inquiry_only===true });
    });
    (t.class_details||[]).forEach(function(d){
      var cm=classById[d.class_id]||{};
      settings.classDetails.push({ id:d.id, branch:branchById[d.branch_id]||cm.branch||'', name:cm.nameKo||'',
        volume:(d.volume==null?'':d.volume), priceKRW:d.price_krw||'', priceVND:d.price_vnd||'', priceUSD:d.price_usd||'',
        discType:d.disc_type||'none', discVal:d.disc_val||'',
        detail:tri(d.detail_ko,d.detail_en,d.detail_vi) });
    });
    (t.default_slots||[]).sort(function(a,b){return (a.sort||0)-(b.sort||0);}).forEach(function(s){
      var bn=branchById[s.branch_id]||''; if(!bn)return; (settings.defaultSchedule[bn]=settings.defaultSchedule[bn]||[])
        .push({ cls:(s.class_id?(classById[s.class_id]||{}).nameKo||'':''), time:s.time||'', cap:s.cap||0 });
    });
    // 휴무(설정됐지만 빈) 날짜 먼저 표시
    (t.schedule_days||[]).forEach(function(d){ var bn=branchById[d.branch_id]||''; if(!bn)return;
      settings.schedule[bn]=settings.schedule[bn]||{}; if(!settings.schedule[bn][d.sched_date]) settings.schedule[bn][d.sched_date]=[]; });
    (t.schedule_slots||[]).forEach(function(s){ var bn=branchById[s.branch_id]||''; if(!bn)return;
      settings.schedule[bn]=settings.schedule[bn]||{};
      var arr=(settings.schedule[bn][s.sched_date]=settings.schedule[bn][s.sched_date]||[]);
      var cls=(s.class_id?(classById[s.class_id]||{}).nameKo||'':''), tm=s.time||'';
      if(arr.some(function(x){return x.time===tm && x.cls===cls;}))return;   // 같은 날짜·시간·클래스 중복 제외
      arr.push({ cls:cls, time:tm, cap:s.cap||0 }); });
    var apps=(t.applications||[]).map(function(a){ var cm=classById[a.class_id]||{};
      return { id:Number(a.id), createdAt:a.created_at, branch:branchById[a.branch_id]||'', 'class':cm.nameKo||'',
        size:a.size||'', date:a.want_date||'', time:a.want_time||'', people:a.people||'1',
        name:a.name||'', phone:a.phone||'', email:a.email||'', nationality:a.nationality||'', facebook:a.sns_facebook||'', instagram:a.sns_instagram||'', msg:a.msg||'', amount:a.amount||'', deposit:a.deposit||'', status:a.status||'new', confirmMail:a.confirm_mail||'', confirmMailAt:a.confirm_mail_at||'', confirmMailErr:a.confirm_mail_err||'', zaloSend:a.zalo_send||'', zaloSendAt:a.zalo_send_at||'', zaloSendErr:a.zalo_send_err||'', lang:a.lang||'' }; });
    return { settings:settings, apps:apps };
  }

  /* ---------- 분해: settings → 테이블 행 + 변경계획 (자연키로 안정 ID 유지) ---------- */
  function classKey(branch,nameKo){ return branch+'||'+nameKo; }
  function plan(oldS, s){
    var ob = oldS.branches||[], oc = oldS.branchClasses||[], od = oldS.classDetails||[];
    var branchIdByName={}; ob.forEach(function(b){branchIdByName[b.name]=b.id;});
    var classIdByKey={}; oc.forEach(function(c){classIdByKey[classKey(c.branch,ko(c.name))]=c.id;});
    var detailKey=function(d){return d.branch+'||'+d.name+'||'+d.volume;};
    var detIdByKey={}; od.forEach(function(d){detIdByKey[detailKey(d)]=d.id;});

    var brNameToId={}, clKeyToId={};
    var branchRows=(s.branches||[]).map(function(b,i){ var id=branchIdByName[b.name]||rid('br'); brNameToId[b.name]=id;
      return { id:id, name:b.name, name_en:(b.nameI18n?en(b.nameI18n):''), name_vi:(b.nameI18n?vi(b.nameI18n):''), contact:b.contact||'', link:b.link||'',
        location_ko:ko(b.location), location_en:en(b.location), location_vi:vi(b.location),
        hours_ko:ko(b.hours), hours_en:en(b.hours), hours_vi:vi(b.hours),
        instagram:b.instagram||'', facebook:b.facebook||'', linktree:b.linktree||'', tiktok:b.tiktok||'', sort:i }; });
    var _si=s.site||{};
    var siteRow={ id:'main', brand_name:_si.brandName||'', est_year:_si.estYear||'', copyright_year:_si.copyrightYear||'',
      biz_name:_si.bizName||'', biz_address:_si.bizAddress||'', biz_tax:_si.bizTax||'', biz_phone:_si.bizPhone||'', biz_email:_si.bizEmail||'', moit_url:_si.moitUrl||'', moit_logo:_si.moitLogo||'', concept_autoplay:!!_si.conceptAutoplay,
      hero_logo:_si.heroLogo||'', notify_email:_si.notifyEmail||'', notify_on:_si.notifyOn!==false, zalo_on:_si.zaloOn===true, confirm_mail_on:_si.confirmMailOn===true,
      zalo_remind_on:_si.zaloRemindOn===true, zalo_remind_hour:_si.zaloRemindHour||'10:00',
      concept_json:JSON.stringify((_si.conceptList||[]).filter(Boolean).slice(0,5)),
      concept_media:((_si.conceptList&&_si.conceptList.filter(Boolean)[0])||_si.conceptMedia||''),
      gallery_json:JSON.stringify(s.gallery||[]), partners_json:JSON.stringify(s.partners||[]), galleryfolders_json:JSON.stringify(s.galleryFolders||[]),
      space_json:JSON.stringify(s.space||[]), spacefolders_json:JSON.stringify(s.spaceFolders||[]) };
    var classRows=(s.branchClasses||[]).map(function(c,i){ var k=classKey(c.branch,ko(c.name)); var id=classIdByKey[k]||rid('cl'); clKeyToId[k]=id;
      return { id:id, branch_id:brNameToId[c.branch]||null, sort:(c.order!=null?c.order:i),
        name_ko:ko(c.name), name_en:en(c.name), name_vi:vi(c.name),
        desc_ko:ko(c.desc), desc_en:en(c.desc), desc_vi:vi(c.desc), active:c.active!==false, inquiry_only:!!c.inquiry }; });
    var detKeyToId={};
    var detailRows=(s.classDetails||[]).map(function(d){ var k=detailKey(d); var id=detIdByKey[k]||rid('cd'); detKeyToId[k]=id;
      return { id:id, branch_id:brNameToId[d.branch]||null, class_id:clKeyToId[classKey(d.branch,d.name)]||null,
        volume:numOrNull(d.volume), price_krw:d.priceKRW||'', price_vnd:d.priceVND||'', price_usd:d.priceUSD||'',
        disc_type:d.discType||'none', disc_val:d.discVal||'',
        detail_ko:ko(d.detail), detail_en:en(d.detail), detail_vi:vi(d.detail) }; });
    // 기본값(지점별 템플릿): 내용이 실제로 바뀐 지점만 삭제 후 재삽입 — 안 건드린 지점은 그대로 둔다
    var oldDef=oldS.defaultSchedule||{}, newDef=s.defaultSchedule||{};
    var defRows=[], delDefBranchIds=[];
    var defBranchSet={}; Object.keys(oldDef).forEach(function(bn){defBranchSet[bn]=1;}); Object.keys(newDef).forEach(function(bn){defBranchSet[bn]=1;});
    Object.keys(defBranchSet).forEach(function(bn){
      var bid=brNameToId[bn]||branchIdByName[bn]; if(!bid)return;
      var oldArr=oldDef[bn], newArr=newDef[bn];
      if(newArr===undefined){ delDefBranchIds.push(bid); return; }   // 지점 자체가 없어짐
      if(oldArr===undefined || slotSig(oldArr)!==slotSig(newArr)){
        delDefBranchIds.push(bid);
        (newArr||[]).forEach(function(sl,i){ defRows.push({ id:rid('dslot'), branch_id:bid,
          class_id:(sl.cls?clKeyToId[classKey(bn,sl.cls)]||null:null), time:sl.time||'', cap:sl.cap||0, sort:i }); });
      }
    });
    // 개별 날짜 스케줄: 새로 생겼거나 내용이 바뀌었거나 삭제된 (지점,날짜)만 건드린다 — 안 건드린 날짜는 절대 손대지 않는다
    var oldSc=oldS.schedule||{}, newSc=s.schedule||{};
    var schRows=[], dayRows=[], delDayKeys=[];
    var branchDateSet={};   // {branch: {date:1, ...}} - 문자열 키 합치기 대신 중첩 맵으로 구분자 충돌 위험을 없앤다
    function collectKeys(scObj){ Object.keys(scObj).forEach(function(bn){ branchDateSet[bn]=branchDateSet[bn]||{}; Object.keys(scObj[bn]||{}).forEach(function(dt){ branchDateSet[bn][dt]=1; }); }); }
    collectKeys(oldSc); collectKeys(newSc);
    Object.keys(branchDateSet).forEach(function(bn){
      var bid=brNameToId[bn]||branchIdByName[bn]; if(!bid)return;
      Object.keys(branchDateSet[bn]).forEach(function(dt){
        var oldArr=(oldSc[bn]||{})[dt], newArr=(newSc[bn]||{})[dt];
        if(newArr===undefined){ delDayKeys.push({branch_id:bid,sched_date:dt}); return; }   // 개별설정 해제됨
        if(oldArr===undefined || slotSig(oldArr)!==slotSig(newArr)){
          delDayKeys.push({branch_id:bid,sched_date:dt});   // 새로 생겼거나 내용이 바뀐 날짜만 지웠다가 다시 씀
          dayRows.push({branch_id:bid, sched_date:dt});
          (newArr||[]).forEach(function(sl){ schRows.push({ id:rid('sslot'), branch_id:bid, sched_date:dt,
            class_id:(sl.cls?clKeyToId[classKey(bn,sl.cls)]||null:null), time:sl.time||'', cap:sl.cap||0 }); });
        }
        // 내용이 같으면 완전히 건너뜀 (DB 안 건드림)
      });
    });

    var newBr={}; branchRows.forEach(function(r){newBr[r.id]=1;});
    var newCl={}; classRows.forEach(function(r){newCl[r.id]=1;});
    var newDt={}; detailRows.forEach(function(r){newDt[r.id]=1;});
    return { branchRows:branchRows, siteRow:siteRow, classRows:classRows, detailRows:detailRows,
      defRows:defRows, delDefBranchIds:delDefBranchIds, schRows:schRows, dayRows:dayRows, delDayKeys:delDayKeys,
      delBranchIds:ob.map(function(b){return b.id;}).filter(function(id){return id&&!newBr[id];}),
      delClassIds:oc.map(function(c){return c.id;}).filter(function(id){return id&&!newCl[id];}),
      delDetailIds:od.map(function(d){return d.id;}).filter(function(id){return id&&!newDt[id];}),
      brNameToId:brNameToId, clKeyToId:clKeyToId, detKeyToId:detKeyToId };
  }
  // 저장 후 캐시 객체에 안정 ID 주입 (다음 분해가 같은 ID를 재사용하도록)
  function applyIds(s,p){
    (s.branches||[]).forEach(function(b){ if(p.brNameToId[b.name]) b.id=p.brNameToId[b.name]; });
    (s.branchClasses||[]).forEach(function(c){ var id=p.clKeyToId[classKey(c.branch,ko(c.name))]; if(id) c.id=id; });
    (s.classDetails||[]).forEach(function(d){ var id=p.detKeyToId[d.branch+'||'+d.name+'||'+d.volume]; if(id) d.id=id; });
  }

  function appToRow(a){
    var bId=(cache.settings.branches||[]).reduce(function(r,b){return b.name===a.branch?b.id:r;},null);
    var cId=(cache.settings.branchClasses||[]).reduce(function(r,c){return (c.branch===a.branch&&ko(c.name)===a['class'])?c.id:r;},null);
    return { id:a.id, created_at:a.createdAt||new Date().toISOString(), branch_id:bId, class_id:cId,
      size:a.size||'', want_date:a.date||'', want_time:a.time||'', people:String(a.people||'1'),
      name:a.name||'', phone:a.phone||'', email:a.email||'', nationality:a.nationality||'', sns_facebook:a.facebook||'', sns_instagram:a.instagram||'', msg:a.msg||'', amount:a.amount||'', deposit:a.deposit||'', status:a.status||'new', lang:a.lang||'' }; }

  /* ---------- 원격 실행 ---------- */
  var onErr=null;   // 저장 실패 시 호출되는 콜백(LS.onError로 등록)
  async function _ck(promise,label){
    try{ var r=await promise; if(r&&r.error){return label+': '+(r.error.message||r.error.code||JSON.stringify(r.error));} return null; }
    catch(e){ return label+': '+(e&&e.message||e); }
  }
  // 순간적인 네트워크/서버 오류 시 짧은 대기 후 최대 2회 더 재시도(총 3회). fn은 매번 새 쿼리를 만들어 반환해야 함(재사용 불가한 빌더 특성 때문).
  async function _ckRetry(fn,label){
    var delays=[0,350,900], msg=null;
    for(var i=0;i<delays.length;i++){
      if(delays[i]) await new Promise(function(res){setTimeout(res,delays[i]);});
      msg=await _ck(fn(),label);
      if(!msg) return null;
    }
    return msg;
  }
  // (branch_id,sched_date) 쌍 목록을 PostgREST or() 필터 문자열로 변환 — 바뀐 날짜만 콕 집어 지우기 위함
  function dayKeyOrFilter(keys){ return keys.map(function(k){ return 'and(branch_id.eq.'+k.branch_id+',sched_date.eq.'+k.sched_date+')'; }).join(','); }
  // FK 순서를 지키되 독립 작업은 병렬로 — 저장 체감속도 개선
  // 스케줄/기본값은 이제 "바뀐 지점·바뀐 날짜"만 지웠다가 다시 쓴다(전체삭제 X) — 안 건드린 데이터는 절대 손대지 않는다
  async function pushPlan(p){
    var errs=[];
    function add(arr){ (arr||[]).forEach(function(e){ if(e) errs.push(e); }); }
    // 순간적인 오류(네트워크 끊김, 요청 몰림 등)로 한 번 실패해도 조용히 데이터가 안 반영되지 않도록,
    // pushApps/fetchTableWithRetry와 동일하게 모든 쓰기 작업에 자동 재시도(최대 3회)를 적용한다.
    // 1단계: 부모(branches)·site_info 업서트 + 바뀐 지점의 기본값만 삭제 + 바뀐 날짜만 스케줄 삭제 (서로 독립 → 병렬)
    add(await Promise.all([
      p.siteRow ? _ckRetry(function(){return client.from('site_info').upsert([p.siteRow]);},'site_info') : null,
      p.branchRows.length ? _ckRetry(function(){return client.from('branches').upsert(p.branchRows);},'branches') : null,
      p.delDefBranchIds.length ? _ckRetry(function(){return client.from('default_slots').delete().in('branch_id',p.delDefBranchIds);},'default_slots(del)') : null,
      p.delDayKeys.length ? _ckRetry(function(){return client.from('schedule_slots').delete().or(dayKeyOrFilter(p.delDayKeys));},'schedule_slots(del)') : null,
      p.delDayKeys.length ? _ckRetry(function(){return client.from('schedule_days').delete().or(dayKeyOrFilter(p.delDayKeys));},'schedule_days(del)') : null
    ]));
    // 2단계: classes 업서트 (branches 필요)
    if(p.classRows.length) add([await _ckRetry(function(){return client.from('classes').upsert(p.classRows);},'classes')]);
    // 3단계: class_details 업서트 + 바뀐 슬롯/휴무만 삽입 + 삭제분(detail) (branches·classes 필요 → 서로 독립 병렬)
    // dayRows/schRows는 위 1단계에서 이미 지운 (branch,date)에 대해서만 만들어지므로 순수 insert로 충분(충돌 없음)
    add(await Promise.all([
      p.detailRows.length ? _ckRetry(function(){return client.from('class_details').upsert(p.detailRows);},'class_details') : null,
      p.defRows.length ? _ckRetry(function(){return client.from('default_slots').insert(p.defRows);},'default_slots') : null,
      p.schRows.length ? _ckRetry(function(){return client.from('schedule_slots').insert(p.schRows);},'schedule_slots') : null,
      p.dayRows.length ? _ckRetry(function(){return client.from('schedule_days').insert(p.dayRows);},'schedule_days') : null,
      p.delDetailIds.length ? _ckRetry(function(){return client.from('class_details').delete().in('id',p.delDetailIds);},'class_details(del)') : null
    ]));
    // 4단계: 삭제된 classes·branches 제거 (branches 삭제는 종속행 cascade)
    add(await Promise.all([
      p.delClassIds.length ? _ckRetry(function(){return client.from('classes').delete().in('id',p.delClassIds);},'classes(del)') : null,
      p.delBranchIds.length ? _ckRetry(function(){return client.from('branches').delete().in('id',p.delBranchIds);},'branches(del)') : null
    ]));
    return errs;
  }
  async function pushApps(newArr){
    var old=cache.apps||[], oldById={}; old.forEach(function(a){oldById[a.id]=a;});
    // 신규 행과 기존 행 수정을 분리한다: upsert()는 내부적으로 "INSERT ... ON CONFLICT DO UPDATE"를 생성하는데,
    // Postgres RLS는 실제 충돌이 없어도 이 구문 자체에 UPDATE 권한을 요구한다. 익명(고객) 신청은 UPDATE 권한이 없으므로
    // 신규 신청까지 upsert로 보내면 전부 거부된다 — 신규는 반드시 순수 insert로, 기존 행 수정만 upsert로 보낸다.
    var keep={}, newRows=[], updateRows=[];
    newArr.forEach(function(a){ keep[a.id]=1; var o=oldById[a.id];
      if(!o) newRows.push(a); else if(JSON.stringify(o)!==JSON.stringify(a)) updateRows.push(a); });
    var del=old.filter(function(a){return !keep[a.id];}).map(function(a){return a.id;});
    var errs=[];
    if(newRows.length){ var nRows=newRows.map(appToRow); errs.push(await _ckRetry(function(){return client.from('applications').insert(nRows);},'applications')); }
    if(updateRows.length){ var uRows=updateRows.map(appToRow); errs.push(await _ckRetry(function(){return client.from('applications').upsert(uRows);},'applications')); }
    if(del.length) errs.push(await _ckRetry(function(){return client.from('applications').delete().in('id',del);},'applications(del)'));
    return errs.filter(Boolean);
  }

  function sleep(ms){ return new Promise(function(res){ setTimeout(res,ms); }); }
  // 순간적인 네트워크/서버 지연으로 조회 실패 시 짧은 대기 후 최대 2회 더 재시도(총 3회)
  // + PostgREST 기본 응답 상한(보통 1000행)에 걸려 뒷부분 데이터가 조용히 잘리지 않도록,
  //   1000행씩 range()로 끝까지 이어붙여 가져온다(테이블이 아무리 커져도 전체를 다 불러옴).
  async function fetchTableWithRetry(t){
    var delays=[0,350,900];
    var PAGE=1000;
    var all=[];
    var from=0;
    for(;;){
      var lastErr=null, page=null;
      for(var i=0;i<delays.length;i++){
        if(delays[i]) await sleep(delays[i]);
        try{
          var r=await client.from(t).select('*').range(from, from+PAGE-1);
          if(r && !r.error && r.data){ page=r.data; break; }
          lastErr=r&&r.error;
        }catch(e){ lastErr=e; }
      }
      if(page===null) return { data:null, error:lastErr||{message:'load failed'} };
      all=all.concat(page);
      if(page.length<PAGE) return { data:all, error:null };   // 마지막 페이지(꽉 안 채워짐) → 종료
      from+=PAGE;
    }
  }
  async function init(){
    if(useRemote){
      try{
        // 세션 복원(로그인 유지) 완료를 먼저 기다림 — 그래야 로그인된 상태의 요청에 인증 토큰이 실제로 실림.
        // (이걸 안 기다리면 applications처럼 authenticated 전용으로 막아둔 테이블이 로그인 중에도 빈 값으로 조회될 수 있음)
        try{ await client.auth.getSession(); }catch(e){}
        var isAuthed=false;
        try{ var sr=await client.auth.getSession(); isAuthed=!!(sr&&sr.data&&sr.data.session); }catch(e){}
        var tables=['branches','classes','class_details','default_slots','schedule_slots','schedule_days','site_info'];
        // applications: 로그인한 관리자는 전체(개인정보 포함) 테이블을, 비로그인 공개 신청 페이지는
        // 개인정보 없이 정원 계산용 컬럼만 노출하는 뷰(applications_public)를 대신 조회한다.
        // (신청 페이지 자체엔 어떤 권한 체크도 없음 — 그냥 anon이 볼 수 있는 데이터 범위가 다를 뿐)
        var appsSrc=isAuthed?'applications':'applications_public';
        var allTables=tables.concat([appsSrc]);
        var res={};
        var rs=await Promise.all(allTables.map(fetchTableWithRetry));
        var failed=[];
        allTables.forEach(function(t,i){ var ok=rs[i]&&!rs[i].error&&rs[i].data; var key=(t===appsSrc)?'applications':t; res[key]=ok?rs[i].data:[]; if(!ok)failed.push(t); });
        cache.loadError=failed.length?failed:null;   // 재시도까지 다 실패한 테이블 목록(없으면 null)
        if(failed.length) console.warn('일부 테이블 로드 실패(재시도 후에도):', failed);
        var a=assemble(res); cache.settings=a.settings; cache.apps=a.apps;
        _lastSchedule=deepClone(a.settings.schedule); _lastDefaultSchedule=deepClone(a.settings.defaultSchedule);
      }catch(e){ console.warn('Supabase init failed → localStorage', e); useRemote=false; }
    }
    if(!useRemote){ cache.settings=lsGet(KEY_SET,'{}'); cache.apps=lsGet(KEY_APPS,'[]'); }
  }

  function _report(errs){ if(errs&&errs.length){ console.warn('save errors',errs); if(onErr)onErr(errs.join('\n')); } }
  // schedule_slots/schedule_days 등은 저장할 때마다 테이블을 통째로 지웠다가 다시 쓰는 구조라,
  // 두 저장이 겹치면(비동기라 순서 보장이 없음) 늦게 끝나는 쪽(옛 데이터일 수 있음)이 이겨서 방금 저장한 걸 덮어써버린다.
  // 그래서 pushPlan 실행 자체를 큐에 넣어 항상 한 번에 하나씩, 호출 순서대로만 실행되게 한다.
  var _saveChain = Promise.resolve();
  function setSettings(v){
    if(useRemote){
      // schedule/defaultSchedule만 보호된 스냅샷(_lastSchedule/_lastDefaultSchedule)으로 old를 대체 —
      // cache.settings.schedule은 화면 코드가 이미 in-place로 새 값을 넣어놓은 상태라 old 기준으로 못 씀(위 주석 참고).
      // branches/classes/details는 기존 방식(자연키 매칭) 그대로 cache.settings를 사용.
      var oldForPlan=Object.assign({}, cache.settings||{}, { schedule:_lastSchedule||{}, defaultSchedule:_lastDefaultSchedule||{} });
      var p=plan(oldForPlan, v); applyIds(v,p);
      _lastSchedule=deepClone(v.schedule); _lastDefaultSchedule=deepClone(v.defaultSchedule);
      _saveChain = _saveChain.then(function(){ return pushPlan(p); }).then(_report, function(e){ _report([String(e&&e.message||e)]); });
    }
    else { lsSet(KEY_SET, v); }
    cache.settings = v;   // 안정 ID가 주입된 객체를 캐시 (다음 분해의 기준)
  }
  function setApps(v){
    if(useRemote){ pushApps(v).then(_report,function(e){_report([String(e&&e.message||e)]);}); }
    else { lsSet(KEY_APPS, v); }
    cache.apps = v;
  }
  /* 이미지 업로드 → Supabase Storage('images' 공개 버킷) → 공개 URL 반환 */
  async function uploadImage(file, prefix){
    if(!useRemote || !client || !client.storage) return { error:'Supabase 연결이 필요합니다(로컬 모드에서는 업로드 불가).' };
    try{
      var ext=((file.name||'').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
      var path=(prefix||'img')+'/'+Date.now()+'_'+Math.random().toString(36).slice(2,8)+'.'+ext;
      var up=await client.storage.from('images').upload(path, file, { upsert:false, contentType:file.type||'image/jpeg' });
      if(up.error) return { error:(up.error.message||'업로드 실패') };
      var pub=client.storage.from('images').getPublicUrl(path);
      return { url:(pub && pub.data && pub.data.publicUrl)||'' };
    }catch(e){ return { error:String(e&&e.message||e) }; }
  }

  /* 확정메일 재발송: confirm_mail 컬럼을 pending 으로 리셋 → DB 트리거가 confirm-mail 함수 재호출 */
  async function resendConfirm(id){
    if(!useRemote || !client) return { error:'Supabase 연결이 필요합니다(로컬 모드 불가).' };
    try{
      var r=await client.from('applications').update({ confirm_mail:'pending', confirm_mail_at:null, confirm_mail_err:null }).eq('id', id);
      if(r&&r.error) return { error:(r.error.message||'재발송 실패') };
      return { ok:true };
    }catch(e){ return { error:String(e&&e.message||e) }; }
  }
  /* 잘로 재발송: zalo_send 컬럼을 pending 으로 리셋 → DB 트리거가 zalo-notify 함수 재호출 */
  async function resendZalo(id){
    if(!useRemote || !client) return { error:'Supabase 연결이 필요합니다(로컬 모드 불가).' };
    try{
      var r=await client.from('applications').update({ zalo_send:'pending', zalo_send_at:null, zalo_send_err:null }).eq('id', id);
      if(r&&r.error) return { error:(r.error.message||'재발송 실패') };
      return { ok:true };
    }catch(e){ return { error:String(e&&e.message||e) }; }
  }

  window.LS = {
    init:init, useRemote:function(){return useRemote;},
    getClient:function(){return client;}, // 어드민 로그인(Supabase Auth)용 — 데이터 호출과 같은 client 인스턴스를 공유해야 세션이 적용됨
    hadLoadError:function(){return !!(cache.loadError&&cache.loadError.length);}, // 재시도까지 실패한 테이블이 있었는지
    loadErrorTables:function(){return cache.loadError||[];},
    resendConfirm:resendConfirm,          // 확정메일 재발송
    resendZalo:resendZalo,                // 잘로 재발송
    // 얕은 복사본을 반환 — 호출부가 받은 객체를 직접 수정해도 pushApps의 변경감지(캐시와의 JSON 비교)가
    // 같은 참조를 비교하는 바람에 "변경 없음"으로 오판해 저장이 누락되는 문제를 방지
    getApps:function(){ return Array.isArray(cache.apps)?cache.apps.map(function(a){return Object.assign({},a);}):[]; }, setApps:setApps,
    getSettings:function(){ return (cache.settings&&typeof cache.settings==='object')?cache.settings:{}; }, setSettings:setSettings,
    onError:function(fn){ onErr=fn; },   // 저장 실패 콜백 등록
    uploadImage:uploadImage,             // 이미지 업로드(Storage)
    _assemble:assemble, _plan:plan   // 단위 테스트용
  };
})();
