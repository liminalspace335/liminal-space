/* LIMINAL SPACE — 공용 데이터 계층
 * Supabase(설정 시) 또는 localStorage(미설정/로컬) 자동 선택.
 *  - 설정(settings): kv 테이블의 JSON 한 행
 *  - 신청(applications): 전용 테이블에 "행 단위"로 저장 (동시 신청 경합 방지)
 * 동기 접근(LS.getApps/getSettings)은 메모리 캐시를 읽고, 쓰기는 캐시 갱신 + 원격 반영.
 */
(function(){
  var CFG = window.SUPA_CONFIG || {};
  var KEY_APPS = 'liminal_applications';
  var KEY_SET  = 'liminal_settings';
  var useRemote = !!(CFG.url && CFG.anonKey && window.supabase && window.supabase.createClient);
  var client = useRemote ? window.supabase.createClient(CFG.url, CFG.anonKey) : null;
  var cache = {}; cache[KEY_APPS] = []; cache[KEY_SET] = {};

  function lsGet(k, f){ try{ return JSON.parse(localStorage.getItem(k) || f); }catch(e){ return JSON.parse(f); } }
  function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  // 신청 객체 <-> 테이블 행 매핑 (예약어 회피: class→class_name, date→want_date, time→want_time)
  function toRow(a){ return {
    id:a.id, created_at:a.createdAt||new Date().toISOString(),
    branch:a.branch||'', name:a.name||'', phone:a.phone||'', email:a.email||'', nationality:a.nationality||'',
    class_name:a['class']||'', size:a.size||'', want_date:a.date||'', want_time:a.time||'',
    people:String(a.people||'1'), msg:a.msg||'', status:a.status||'new'
  };}
  function fromRow(r){ return {
    id:Number(r.id), createdAt:r.created_at,
    branch:r.branch||'', name:r.name||'', phone:r.phone||'', email:r.email||'', nationality:r.nationality||'',
    'class':r.class_name||'', size:r.size||'', date:r.want_date||'', time:r.want_time||'',
    people:r.people||'1', msg:r.msg||'', status:r.status||'new'
  };}

  async function init(){
    if(useRemote){
      try{
        var sres = await client.from('kv').select('data').eq('key', KEY_SET).maybeSingle();
        cache[KEY_SET] = (sres && !sres.error && sres.data && sres.data.data) ? sres.data.data : {};
        var ares = await client.from('applications').select('*').order('id', { ascending:false });
        cache[KEY_APPS] = (ares && !ares.error && ares.data) ? ares.data.map(fromRow) : [];
      }catch(e){ console.warn('Supabase init failed → localStorage', e); useRemote = false; }
    }
    if(!useRemote){
      cache[KEY_APPS] = lsGet(KEY_APPS, '[]');
      cache[KEY_SET]  = lsGet(KEY_SET, '{}');
    }
  }

  function setSettings(v){
    cache[KEY_SET] = v;
    if(useRemote){ client.from('kv').upsert({ key:KEY_SET, data:v, updated_at:new Date().toISOString() })
      .then(function(r){ if(r.error) console.warn('settings save error', r.error); }); }
    else { lsSet(KEY_SET, v); }
  }

  // 전체 배열을 받아 이전 캐시와 비교 → 변경/추가는 upsert, 사라진 건 delete (행 단위)
  function setApps(newArr){
    var old = cache[KEY_APPS] || [];
    if(useRemote){
      var oldById = {}; old.forEach(function(a){ oldById[a.id] = a; });
      var keep = {}; var changed = [];
      newArr.forEach(function(a){ keep[a.id] = 1; var o = oldById[a.id];
        if(!o || JSON.stringify(o) !== JSON.stringify(a)) changed.push(a); });
      var del = old.filter(function(a){ return !keep[a.id]; }).map(function(a){ return a.id; });
      if(changed.length) client.from('applications').upsert(changed.map(toRow))
        .then(function(r){ if(r.error) console.warn('app upsert error', r.error); });
      if(del.length) client.from('applications').delete().in('id', del)
        .then(function(r){ if(r.error) console.warn('app delete error', r.error); });
    } else {
      lsSet(KEY_APPS, newArr);
    }
    cache[KEY_APPS] = newArr;
  }

  window.LS = {
    init: init,
    useRemote: function(){ return useRemote; },
    getApps: function(){ return Array.isArray(cache[KEY_APPS]) ? cache[KEY_APPS] : []; },
    setApps: setApps,
    getSettings: function(){ return (cache[KEY_SET] && typeof cache[KEY_SET]==='object') ? cache[KEY_SET] : {}; },
    setSettings: setSettings
  };
})();
