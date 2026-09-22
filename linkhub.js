/* LIMINAL SPACE — 홈화면(링크허브) 전용 스크립트. index.html에서만 로드됨(app.js·store.js와 독립).
 * 첫 로딩 속도가 중요한 페이지라 supabase-js SDK와 store.js(예약·스케줄용 무거운 초기화)를 쓰지 않고,
 * config.js의 SUPA_CONFIG로 REST API를 fetch() 한 번만 직접 호출한다. */
(function(){
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* 언어 — 좌측 상단에서 베트남어/영어/한글 순으로 고르며, 기본은 베트남어 */
  var LANGS=[['vi','VI'],['en','EN'],['ko','KO']];
  var curLang='vi';
  function txObj(v){ return (v&&typeof v==='object'&&!Array.isArray(v))?v:(v?{ko:String(v),en:String(v),vi:String(v)}:{}); }
  function Lval(v,lang){ var o=txObj(v); return o[lang||curLang]||o.vi||o.en||o.ko||''; }

  /* 홈화면(링크허브) 픽토그램은 항상 이 7종 고정 — store.js의 normalizeLinkHub와 동일한 규칙 */
  var LINKHUB_ICON_TYPES=['email','phone','googlemap','facebook','instagram','tiktok','threads'];
  function normalizeLinkHub(lh){
    lh=(lh&&typeof lh==='object')?lh:{};
    var byType={}; (Array.isArray(lh.icons)?lh.icons:[]).forEach(function(ic){ if(ic&&ic.type) byType[ic.type]=ic; });
    var icons=LINKHUB_ICON_TYPES.map(function(type,i){ var ex=byType[type];
      return { type:type, enabled: ex? ex.enabled!==false : false, order:(ex&&ex.order!=null)?ex.order:i, value:(ex&&ex.value)||'' }; });
    // 로고(워드마크)는 언어를 바꿔도 항상 같은 표기 — 언어별 객체가 들어와도 영어 우선으로 문자열 하나만 사용
    var name=(lh.name&&typeof lh.name==='object')?(lh.name.en||lh.name.vi||lh.name.ko||''):(lh.name||'');
    return { showQr: lh.showQr!==false, enabled: lh.enabled!==false, name: name,
      icons: icons, links:(Array.isArray(lh.links)?lh.links:[]).map(function(l){ return {
        id:l.id||'', title:txObj(l.title), image:l.image||'', url:l.url||'', enabled:l.enabled!==false, order:l.order||0 }; }) };
  }
  function sleep(ms){ return new Promise(function(res){ setTimeout(res,ms); }); }
  /* site_info 한 행(딱 필요한 linkhub_json 컬럼)만 직접 REST 호출 — 예약/스케줄 테이블은 전혀 건드리지 않음 */
  async function fetchLinkHub(){
    var cfg=window.SUPA_CONFIG||{};
    if(!cfg.url||!cfg.anonKey) return normalizeLinkHub({});
    try{
      var res=await Promise.race([
        fetch(cfg.url+'/rest/v1/site_info?select=linkhub_json&id=eq.main', { headers:{ apikey:cfg.anonKey } }),
        sleep(4000).then(function(){ throw new Error('timeout'); })
      ]);
      if(!res.ok) throw new Error('http '+res.status);
      var rows=await res.json();
      var row=(rows&&rows[0])||{};
      var raw={}; try{ raw=JSON.parse(row.linkhub_json||'{}'); }catch(e){}
      return normalizeLinkHub(raw);
    }catch(e){ console.warn('linkhub fetch failed', e); return normalizeLinkHub({}); }
  }

  /* ---------- 아이콘 스프라이트 (앱 아이콘 실행용 · app.js와 독립적으로 필요한 것만) ---------- */
  function ensureSvgDefs(){
    if(document.getElementById('lh-svgdefs')) return;
    var d=document.createElement('div'); d.id='lh-svgdefs'; d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML='<svg width="0" height="0" aria-hidden="true">'
      +'<symbol id="lh-ic-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="m4 7 8 6 8-6"/></symbol>'
      +'<symbol id="lh-ic-phone" viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.9c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1l-2 2Z"/></symbol>'
      +'<symbol id="lh-ic-map" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z"/></symbol>'
      +'<symbol id="lh-ic-instagram" viewBox="0 0 24 24"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.25" fill="currentColor"/></symbol>'
      +'<symbol id="lh-ic-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.5h2.52l.38-3h-2.9V8.55c0-.87.24-1.46 1.49-1.46h1.59V4.41c-.28-.04-1.23-.12-2.32-.12-2.3 0-3.87 1.4-3.87 3.98V10.5H8.2v3h2.66V21h2.64z"/></symbol>'
      +'<symbol id="lh-ic-tiktok" viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 3c.32 2.06 1.66 3.46 3.9 3.6v2.46c-1.3.13-2.43-.3-3.74-1.09v5.96c0 3.02-2.45 5.47-5.47 5.47A5.47 5.47 0 0 1 8.9 8.97v2.62a2.85 2.85 0 1 0 2 2.72V3h2.7z"/></symbol>'
      +'<symbol id="lh-ic-threads" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M15.6 8.3c-.7-1.4-2-2.2-3.7-2.2-3 0-4.9 2.4-4.9 6.1s1.9 6.2 5 6.2c2.8 0 4.5-1.5 4.8-3.7.3-2.5-1.1-4-3.6-4-1.7 0-2.9.9-2.9 2.2 0 .9.7 1.6 1.7 1.6"/></symbol>'
      +'<symbol id="lh-ic-share" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="18" cy="6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="18" cy="18" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.7" d="M8 10.8 16 6.8M8 13.2 16 17.2"/></symbol>'
      +'<symbol id="lh-ic-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.7" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></symbol>'
      +'<symbol id="lh-ic-dots" viewBox="0 0 24 24"><circle cx="12" cy="6" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="18" r="1.7" fill="currentColor"/></symbol>'
      +'<symbol id="lh-ic-link" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M9 15l6-6M9 10H7a3 3 0 0 0 0 6h2m6-6h2a3 3 0 0 1 0 6h-2"/></symbol>'
      +'</svg>';
    document.body.appendChild(d);
  }

  var ICON_SVG={ email:'lh-ic-mail', phone:'lh-ic-phone', googlemap:'lh-ic-map', facebook:'lh-ic-facebook', instagram:'lh-ic-instagram', tiktok:'lh-ic-tiktok', threads:'lh-ic-threads' };
  var ICON_LABEL_I18N={
    email:{vi:'Email',en:'Email',ko:'이메일'}, phone:{vi:'Điện thoại',en:'Phone',ko:'전화'},
    googlemap:{vi:'Google Maps',en:'Google Maps',ko:'구글맵'}, facebook:{vi:'Facebook',en:'Facebook',ko:'페이스북'},
    instagram:{vi:'Instagram',en:'Instagram',ko:'인스타그램'}, tiktok:{vi:'TikTok',en:'TikTok',ko:'틱톡'}, threads:{vi:'Threads',en:'Threads',ko:'쓰레드'}
  };
  function iconLabel(type){ var m=ICON_LABEL_I18N[type]; return (m&&(m[curLang]||m.vi))||type; }
  var ICON_CLASS={ email:'em', phone:'ph', googlemap:'gm', facebook:'fb', instagram:'ig', tiktok:'tk', threads:'th' };
  /* 화면에 노출되는 짧은 UI 문구 — 베트남어 기본, 언어 전환 시 함께 바뀜 */
  var UI_TEXT={
    vi:{ eyebrow:'PERFUME WORKSHOP · XƯỞNG NƯỚC HOA', shareTitle:'Chia sẻ', copy:'Sao chép liên kết', copied:'Đã sao chép ✓', copyFail:'Sao chép thất bại.', qr:'Xem trên điện thoại', shareAria:'Chia sẻ', moreAria:'Chia sẻ', closeAria:'Đóng', comingSoon:'Sắp ra mắt' },
    en:{ eyebrow:'PERFUME WORKSHOP', shareTitle:'Share', copy:'Copy link', copied:'Copied ✓', copyFail:'Copy failed.', qr:'View on mobile', shareAria:'Share', moreAria:'Share', closeAria:'Close', comingSoon:'Coming soon' },
    ko:{ eyebrow:'Perfume Workshop · 향수 공방', shareTitle:'공유하기', copy:'링크 복사', copied:'복사됨 ✓', copyFail:'복사에 실패했습니다.', qr:'모바일에서 보기', shareAria:'공유하기', moreAria:'공유', closeAria:'닫기', comingSoon:'준비 중입니다' }
  };
  function ui(key){ var t=UI_TEXT[curLang]||UI_TEXT.vi; return t[key]||UI_TEXT.vi[key]||''; }

  /* 아이콘 타입별로 실제 앱이 실행되도록 href를 구성 */
  function iconHref(type,value){
    value=(value||'').trim(); if(!value) return '';
    if(type==='email') return 'mailto:'+value;
    if(type==='phone') return 'tel:'+value.replace(/[^\d+]/g,'');
    if(type==='googlemap') return /^https?:\/\//i.test(value) ? value : ('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(value));
    return /^https?:\/\//i.test(value) ? value : ('https://'+value.replace(/^\/+/,''));
  }
  function enabledIcons(lh){
    return ((lh&&lh.icons)||[]).filter(function(ic){ return ic&&ic.enabled&&iconHref(ic.type,ic.value); })
      .sort(function(a,b){ return (a.order||0)-(b.order||0); });
  }
  function iconLinkHTML(ic){
    var href=iconHref(ic.type,ic.value);
    var external=(ic.type!=='email'&&ic.type!=='phone');
    return '<a class="lh-icon '+(ICON_CLASS[ic.type]||'')+'" href="'+esc(href)+'"'+(external?' target="_blank" rel="noopener"':'')+' aria-label="'+esc(iconLabel(ic.type))+'"><svg class="ic"><use href="#'+ICON_SVG[ic.type]+'"/></svg></a>';
  }

  function renderProfile(lh){
    var name=Lval(lh.name,curLang)||'LIMINAL SPACE';
    var eyebrow=ui('eyebrow');
    document.getElementById('lhNameEl').textContent=name;
    document.getElementById('lhEyebrowEl').textContent=eyebrow;
    document.getElementById('lhShareName').textContent=name;
    document.getElementById('lhShareSub').textContent=eyebrow;
    document.getElementById('lhShareHead').textContent=ui('shareTitle');
    document.getElementById('lhShareClose').setAttribute('aria-label',ui('closeAria'));
    document.getElementById('lhShareBtn').setAttribute('aria-label',ui('shareAria'));
    document.getElementById('lhCopyBtn').querySelector('span').textContent=ui('copy');
    document.getElementById('lhQrCaption').textContent=ui('qr');
    document.title=name+' — '+eyebrow;
  }
  function renderIconsRow(lh){
    var row=document.getElementById('lhIconsRow'); var icons=enabledIcons(lh);
    row.innerHTML=icons.map(iconLinkHTML).join('');
    row.style.display=icons.length?'':'none';
    document.getElementById('lhShareIcons').innerHTML=icons.map(iconLinkHTML).join('');
  }
  function renderLinks(lh){
    var wrap=document.getElementById('lhLinksList');
    var links=(lh.links||[]).filter(function(l){ return l&&l.enabled!==false&&l.url; }).sort(function(a,b){ return (a.order||0)-(b.order||0); });
    var moreAria=ui('moreAria');
    wrap.innerHTML=links.map(function(l){
      var abs; try{ abs=new URL(l.url,location.href).href; }catch(e){ abs=l.url; }
      var external=/^https?:\/\//i.test(l.url);
      var img=l.image ? '<img class="lh-link-thumb" src="'+esc(l.image)+'" alt="" loading="lazy" decoding="async" width="42" height="42" />' : '<span class="lh-link-thumb lh-link-thumb-ph"><svg class="ic"><use href="#lh-ic-link"/></svg></span>';
      return '<div class="lh-link">'
        +'<a class="lh-link-body" href="'+esc(l.url)+'"'+(external?' target="_blank" rel="noopener"':'')+'>'
          +img+'<span class="lh-link-title">'+esc(Lval(l.title,curLang))+'</span>'
        +'</a>'
        +'<button type="button" class="lh-link-more" data-share-url="'+esc(abs)+'" aria-label="'+esc(moreAria)+'"><svg class="ic"><use href="#lh-ic-dots"/></svg></button>'
        +'</div>';
    }).join('');
  }
  function renderQr(lh){
    var box=document.getElementById('lhQr');
    if(lh.showQr===false || !window.QRCode){ box.style.display='none'; return; }
    try{
      var el=document.getElementById('lhQrCanvas'); el.innerHTML='';
      var url=location.href.split('#')[0];
      new QRCode(el, { text:url, width:120, height:120, colorDark:'#16171a', colorLight:'#ffffff' });
      box.style.display='';
    }catch(e){ box.style.display='none'; }
  }
  function renderLang(){
    document.getElementById('lhLangCur').textContent=curLang.toUpperCase();
    document.querySelectorAll('#lhLangMenu button').forEach(function(b){ b.classList.toggle('active', b.dataset.lang===curLang); });
  }

  /* ---------- 공유하기 모달 ---------- */
  var overlay, shareUrl='';
  function openShare(url){
    shareUrl=url||location.href.split('#')[0];
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }
  function closeShare(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  function fallbackCopy(text){
    var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); var ok=false;
    try{ ok=document.execCommand('copy'); }catch(e){ ok=false; }
    document.body.removeChild(ta); return ok;
  }
  async function copyShareUrl(){
    var btn=document.getElementById('lhCopyBtn'); var span=btn.querySelector('span'); var prev=span.textContent;
    var ok=false;
    try{ if(navigator.clipboard&&navigator.clipboard.writeText){ await navigator.clipboard.writeText(shareUrl); ok=true; } }catch(e){ ok=false; }
    if(!ok) ok=fallbackCopy(shareUrl);
    if(ok){ span.textContent=ui('copied'); setTimeout(function(){ span.textContent=prev; },1500); }
    else{ alert(ui('copyFail')+'\n'+shareUrl); }
  }

  var currentData=null;
  function renderAll(){
    renderProfile(currentData);
    renderLang();
    var on=currentData.enabled!==false;
    var iconsRow=document.getElementById('lhIconsRow'), linksWrap=document.getElementById('lhLinksList');
    var shareBtn=document.getElementById('lhShareBtn'), comingSoon=document.getElementById('lhComingSoon');
    if(on){
      comingSoon.style.display='none'; shareBtn.style.display='';
      renderIconsRow(currentData); renderLinks(currentData);
    }else{
      comingSoon.style.display=''; comingSoon.textContent=ui('comingSoon'); shareBtn.style.display='none';
      iconsRow.innerHTML=''; iconsRow.style.display='none';
      linksWrap.innerHTML=''; linksWrap.style.display='none';
    }
  }
  function closeLangMenu(){ document.getElementById('lhLangBox').classList.remove('open'); document.getElementById('lhLangToggle').setAttribute('aria-expanded','false'); }
  function boot(lh){
    ensureSvgDefs();
    currentData=lh;
    renderAll();
    if(lh.enabled!==false) renderQr(lh); else document.getElementById('lhQr').style.display='none';
    // 정적 마크업(히어로 워드마크)이 먼저 그려져 있다가 아이콘·버튼이 뒤늦게 튀어나오는 느낌을 없애기 위해,
    // 데이터가 다 채워진 뒤 전체(히어로+아이콘+버튼)를 한 번에 페이드인 시킨다.
    document.getElementById('lhWrap').classList.add('lh-ready');

    overlay=document.getElementById('lhShareOverlay');
    document.getElementById('lhShareBtn').addEventListener('click',function(){ openShare(); });
    document.getElementById('lhShareClose').addEventListener('click',closeShare);
    overlay.addEventListener('click',function(e){ if(e.target===overlay) closeShare(); });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&overlay.classList.contains('open')) closeShare();
      if(e.key==='Escape') closeLangMenu();
    });
    document.getElementById('lhCopyBtn').addEventListener('click',copyShareUrl);
    document.getElementById('lhLinksList').addEventListener('click',function(e){
      var more=e.target.closest('.lh-link-more'); if(!more) return;
      e.preventDefault(); openShare(more.dataset.shareUrl);
    });

    /* 언어 선택 (VI·EN·KO) — 기본 베트남어 */
    var langBox=document.getElementById('lhLangBox');
    document.getElementById('lhLangToggle').addEventListener('click',function(e){
      e.stopPropagation();
      var open=langBox.classList.toggle('open');
      this.setAttribute('aria-expanded', open?'true':'false');
    });
    document.getElementById('lhLangMenu').addEventListener('click',function(e){
      var b=e.target.closest('button[data-lang]'); if(!b) return;
      curLang=b.dataset.lang; closeLangMenu(); renderAll();
    });
    document.addEventListener('click',function(e){ if(!langBox.contains(e.target)) closeLangMenu(); });
  }

  fetchLinkHub().then(boot);
})();
