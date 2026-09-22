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
      +'<symbol id="lh-ic-zalo" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.3-3.7A8 8 0 0 1 4 12Z"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M9 9.3h5.2L9.6 14.7H15"/></symbol>'
      +'<symbol id="lh-ic-whatsapp" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.3-3.7A8 8 0 0 1 4 12Z"/><path fill="currentColor" d="M9.3 9.3c.3-.3.6-.3.8-.1.3.3.9 1.4.9 1.6s0 .3-.2.5l-.4.4c-.1.1-.2.3 0 .5.3.5 1.6 1.9 2.7 2.2.2.1.3 0 .4-.1l.4-.5c.2-.2.3-.2.5-.1.4.2 1.3.6 1.6.8.2.1.3.2.3.4 0 .5-.4 1-.8 1.1-.4.1-1.7.3-3.6-1-1.9-1.2-2.7-2.8-2.8-3-.1-.2-.6-.8-.6-1.5 0-.7.4-1.1.5-1.2Z"/></symbol>'
      +'<symbol id="lh-ic-messenger" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.3-3.7A8 8 0 0 1 4 12Z"/><path fill="currentColor" d="M12.3 8.5 9 12.9h2.4l-.1 2.9 3.3-4.4h-2.4l.1-2.9Z"/></symbol>'
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
    vi:{ eyebrow:'PERFUME WORKSHOP · XƯỞNG NƯỚC HOA', shareTitle:'Chia sẻ', copy:'Sao chép liên kết', copied:'Đã sao chép ✓', copyFail:'Sao chép thất bại.', qr:'Xem trên điện thoại', shareAria:'Chia sẻ', moreAria:'Chia sẻ', closeAria:'Đóng', comingSoon:'Sắp ra mắt',
      messengerFail:'Không tìm thấy ứng dụng Messenger trên thiết bị này.', instagramFail:'Không tìm thấy ứng dụng Instagram trên thiết bị này.', linkCopiedHint:'Đã sao chép liên kết — hãy dán vào ứng dụng để chia sẻ.' },
    en:{ eyebrow:'PERFUME WORKSHOP', shareTitle:'Share', copy:'Copy link', copied:'Copied ✓', copyFail:'Copy failed.', qr:'View on mobile', shareAria:'Share', moreAria:'Share', closeAria:'Close', comingSoon:'Coming soon',
      messengerFail:"Couldn't find the Messenger app on this device.", instagramFail:"Couldn't find the Instagram app on this device.", linkCopiedHint:'Copied the link — paste it in the app to share.' },
    ko:{ eyebrow:'Perfume Workshop · 향수 공방', shareTitle:'공유하기', copy:'링크 복사', copied:'복사됨 ✓', copyFail:'복사에 실패했습니다.', qr:'모바일에서 보기', shareAria:'공유하기', moreAria:'공유', closeAria:'닫기', comingSoon:'준비 중입니다',
      messengerFail:'이 기기에서 메신저 앱을 찾을 수 없습니다.', instagramFail:'이 기기에서 인스타그램 앱을 찾을 수 없습니다.', linkCopiedHint:'링크를 복사했습니다 — 앱에서 붙여넣어 공유해 주세요.' }
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

  /* 공유하기 모달 아이콘 — 픽토그램과 별개로, 항상 이 순서로 고정: 잘로·왓츠앱·메신저·인스타·이메일 */
  var SHARE_CHANNELS=['zalo','whatsapp','messenger','instagram','email'];
  var SHARE_ICON_SVG={ zalo:'lh-ic-zalo', whatsapp:'lh-ic-whatsapp', messenger:'lh-ic-messenger', instagram:'lh-ic-instagram', email:'lh-ic-mail' };
  var SHARE_ICON_CLASS={ zalo:'zl', whatsapp:'wa', messenger:'ms', instagram:'ig', email:'em' };
  var SHARE_LABEL_I18N={
    zalo:{vi:'Zalo',en:'Zalo',ko:'잘로'}, whatsapp:{vi:'WhatsApp',en:'WhatsApp',ko:'왓츠앱'},
    messenger:{vi:'Messenger',en:'Messenger',ko:'메신저'}, instagram:{vi:'Instagram',en:'Instagram',ko:'인스타그램'}, email:{vi:'Email',en:'Email',ko:'이메일'}
  };
  function shareChannelHref(type,url,title){
    var enc=encodeURIComponent(url);
    switch(type){
      // zalo.me(루트 도메인)로 시도했더니 앱은 열리지만 /share 경로를 앱이 제대로 못 받아 웹과
      // 앱 사이를 반복 전환하다 오류가 나는 문제가 있어, 안정적으로 동작하는 웹 공유 페이지(sp.zalo.me)로 되돌림.
      // 앱에서 완전히 네이티브로 여는 공유는 Zalo 자체 Share SDK(App ID 등록 필요) 없이는 안정적으로 구현 불가.
      case 'zalo': return 'https://sp.zalo.me/share?u='+enc+(title?('&title='+encodeURIComponent(title)):'');
      case 'whatsapp': return 'https://wa.me/?text='+encodeURIComponent((title?title+' ':'')+url);
      // 메신저·인스타그램 다이렉트는 앱 딥링크만 공개적으로 열려있음(브라우저 URL로는 상대 지정 불가) — 앱이 설치된 기기에서만 열림
      case 'messenger': return 'fb-messenger://share?link='+enc;
      case 'instagram': return 'instagram://direct';
      case 'email': return 'mailto:?subject='+encodeURIComponent(title||'')+'&body='+enc;
    }
    return '';
  }
  function shareIconHTML(type,url,title){
    var href=shareChannelHref(type,url,title);
    var m=SHARE_LABEL_I18N[type]; var label=(m&&(m[curLang]||m.vi))||type;
    var isAppOnly=(type==='messenger'||type==='instagram');
    // 메신저·인스타는 앱 전용 딥링크라 앱이 없으면 아무 반응이 없어 보임 — 클릭을 가로채서 앱 전환 성공 여부를 감지하고,
    // 실패로 보이면(아래 tryOpenApp) 알림 + 링크 복사로 사용자가 "오류인가?" 헷갈리지 않게 한다.
    return '<a class="lh-icon '+(SHARE_ICON_CLASS[type]||'')+'" href="'+esc(href)+'"'
      +(isAppOnly?(' data-app-link="'+esc(href)+'" data-app-type="'+type+'"'):' target="_blank" rel="noopener"')
      +' aria-label="'+esc(label)+'"><svg class="ic"><use href="#'+SHARE_ICON_SVG[type]+'"/></svg></a>';
  }
  /* 앱 전용 딥링크(fb-messenger://, instagram://) 클릭 처리: 시도 후 일정 시간 안에 화면이 전환(blur)되지 않으면
     앱이 없다고 보고, 링크를 대신 복사한 뒤 안내창을 띄운다(사용자가 "안 눌리나?" 헷갈리지 않도록). */
  async function copyText(text){
    try{ if(navigator.clipboard&&navigator.clipboard.writeText){ await navigator.clipboard.writeText(text); return true; } }catch(e){}
    return fallbackCopy(text);
  }
  function tryOpenApp(deepLink,type){
    var opened=false;
    function markOpened(){ opened=true; }
    window.addEventListener('blur',markOpened,{once:true});
    document.addEventListener('visibilitychange',function onVis(){ if(document.hidden){ markOpened(); } document.removeEventListener('visibilitychange',onVis); });
    // location.href로 미등록 스킴을 시도하면 일부 브라우저(iOS Safari·Android Chrome)가 현재 페이지에
    // "주소를 찾을 수 없음" 오류를 띄우거나 페이지 자체를 이동시켜, 아래 대체 안내(alert)가 아예 안 뜨는 문제가 있었다.
    // 보이지 않는 iframe으로 시도하면 실패해도 현재 페이지·스크립트에 영향이 없어 대체 안내가 항상 뜬다.
    try{
      var ifr=document.createElement('iframe');
      ifr.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
      ifr.src=deepLink;
      document.body.appendChild(ifr);
      setTimeout(function(){ if(ifr.parentNode) ifr.parentNode.removeChild(ifr); },2000);
    }catch(e){}
    setTimeout(async function(){
      window.removeEventListener('blur',markOpened);
      if(opened) return;
      var copied=await copyText(shareUrl);
      var failMsg=ui(type==='messenger'?'messengerFail':'instagramFail');
      alert(failMsg+(copied?('\n\n'+ui('linkCopiedHint')):''));
    },1400);
  }
  function renderShareIcons(url){
    var name=Lval((currentData||{}).name,curLang)||'LIMINAL SPACE';
    document.getElementById('lhShareIcons').innerHTML=SHARE_CHANNELS.map(function(t){ return shareIconHTML(t,url,name); }).join('');
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
  }
  function renderLinks(lh){
    var wrap=document.getElementById('lhLinksList');
    var links=(lh.links||[]).filter(function(l){ return l&&l.enabled!==false&&l.url; }).sort(function(a,b){ return (a.order||0)-(b.order||0); });
    var moreAria=ui('moreAria');
    wrap.innerHTML=links.map(function(l){
      var abs; try{ abs=new URL(l.url,location.href).href; }catch(e){ abs=l.url; }
      var host=''; try{ host=new URL(abs).hostname.replace(/^www\./,''); }catch(e){}
      var external=/^https?:\/\//i.test(l.url);
      var title=Lval(l.title,curLang);
      var img=l.image ? '<img class="lh-link-thumb" src="'+esc(l.image)+'" alt="" loading="lazy" decoding="async" width="42" height="42" />' : '<span class="lh-link-thumb lh-link-thumb-ph"><svg class="ic"><use href="#lh-ic-link"/></svg></span>';
      return '<div class="lh-link">'
        +'<a class="lh-link-body" href="'+esc(l.url)+'"'+(external?' target="_blank" rel="noopener"':'')+'>'
          +img+'<span class="lh-link-title">'+esc(title)+'</span>'
        +'</a>'
        +'<button type="button" class="lh-link-more" data-share-url="'+esc(abs)+'" data-share-title="'+esc(title)+'" data-share-image="'+esc(l.image||'')+'" data-share-domain="'+esc(host)+'" aria-label="'+esc(moreAria)+'"><svg class="ic"><use href="#lh-ic-dots"/></svg></button>'
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
  // preview: {image,title,domain} — 버튼별 공유(⋮)는 실제 링크트리처럼 그 링크의 썸네일·제목을 미리보기로 보여준다.
  // 전체 페이지 공유(상단 공유 버튼)는 preview 없이 기존 프로필 카드(로고 이름+eyebrow)를 그대로 보여준다.
  function openShare(url,preview){
    shareUrl=url||location.href.split('#')[0];
    renderShareCard(preview);
    renderShareIcons(shareUrl);
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }
  function renderShareCard(preview){
    var card=document.getElementById('lhShareCard');
    var img=preview&&preview.image;
    if(img){
      card.style.backgroundImage='linear-gradient(to top,rgba(10,10,12,.85),rgba(10,10,12,.15) 60%),url("'+img.replace(/"/g,'%22')+'")';
      card.classList.add('has-image');
      document.getElementById('lhShareName').textContent=preview.title||'';
      document.getElementById('lhShareSub').textContent=preview.domain||'';
    }else{
      card.style.backgroundImage='';
      card.classList.remove('has-image');
      var name=(preview&&preview.title)||Lval((currentData||{}).name,curLang)||'LIMINAL SPACE';
      document.getElementById('lhShareName').textContent=name;
      document.getElementById('lhShareSub').textContent=(preview&&preview.domain)||ui('eyebrow');
    }
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
      e.preventDefault();
      openShare(more.dataset.shareUrl,{ image:more.dataset.shareImage, title:more.dataset.shareTitle, domain:more.dataset.shareDomain });
    });
    document.getElementById('lhShareIcons').addEventListener('click',function(e){
      var a=e.target.closest('[data-app-link]'); if(!a) return;
      e.preventDefault(); tryOpenApp(a.dataset.appLink,a.dataset.appType);
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
