/**
 * LIMINAL SPACE — GetYourGuide·KKday 예약/취소 메일 → 홈페이지 신청 자동 반영 (Google Apps Script)
 * ------------------------------------------------------------
 * 설치 위치: GYG 공급사 메일을 받는 사업용 Gmail 계정의 script.google.com 프로젝트.
 * 스크립트 속성(프로젝트 설정 → 스크립트 속성):
 *   SYNC_URL     https://euhuiktqoslmndozqpsr.functions.supabase.co/gyg-sync
 *   SYNC_SECRET  Supabase 시크릿 GYG_SYNC_SECRET 과 같은 값
 *   DRY_RUN      true  → DB에 쓰지 않고 결과만 로그(처음 확인용). 확인 후 false 로 변경
 * 트리거: syncGygMails 를 5분마다 실행(시간 기반 트리거).
 *
 * 메일은 읽기만 한다(삭제·이동·답장 없음). 처리한 메일 ID는 스크립트 속성에 기록해 두 번 처리하지 않는다.
 * 읽을 수 없는 GYG 예약 메일은 이 계정으로 알림 메일을 한 번 보낸다(그 예약은 손으로 처리).
 */

var MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12 };

/** 메일 본문(텍스트) → 예약 정보. GYG 공급사 메일이 아니면 null */
function parseGygMail(text) {
  var t = String(text || '').replace(/\r/g, '').replace(/[ \t ]+/g, ' ');
  var refM = t.match(/\bGYG[A-Z0-9]{8,12}\b/);
  if (!refM) return null;
  var out = { ref: refM[0] };

  if (/was cancel+ed|has been cancel+ed/i.test(t)) out.action = 'cancel';
  else if (/Number of participants/i.test(t)) out.action = 'book';
  else return null;

  var dm = t.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (dm) {
    var h = Number(dm[4]) % 12 + (/pm/i.test(dm[6]) ? 12 : 0);
    out.date = dm[3] + '-' + pad2(MONTHS[dm[1].toLowerCase()]) + '-' + pad2(dm[2]);
    out.time = pad2(h) + ':' + dm[5];
  }
  if (out.action === 'cancel') return out;

  var sm = t.match(/\[(\d{2,3})\s*ml\]/i);
  out.size = sm ? sm[1] + 'ml' : '';

  var pblock = (t.match(/Number of participants([\s\S]{0,200}?)(Main customer|Tour language|Price|$)/i) || [])[1] || '';
  var people = 0, pm, re = /(\d+)\s*x\s/gi;
  while ((pm = re.exec(pblock))) people += Number(pm[1]);
  out.people = people || 1;

  var nm = t.match(/Main customer\s*:?\s*\n*\s*([^\n]+)/i);
  out.name = nm ? nm[1].trim() : '';
  var ph = t.match(/Phone:\s*(\+?[\d][\d\s()-]{6,}\d)/i);
  out.phone = ph ? ph[1].replace(/\s+/g, '') : '';
  var lg = t.match(/\bLanguage:\s*([A-Za-z]+)/);
  out.language = lg ? lg[1] : '';
  var pr = t.match(/Price\s*:?\s*\n*\s*₫\s*([\d.,]+)/i) || t.match(/₫\s*([\d.,]+)/);
  out.price = pr ? pr[1] : '';
  return out;
}

function pad2(n) { return (n < 10 ? '0' : '') + Number(n); }

/** KKday 공급사 메일(제목·본문) → 예약 정보. KKday 예약번호가 없으면 null
 *  - 주문 접수: 제목 "[KKday] 예약번호: 26KK… 주문이 접수되었습니다" → book
 *  - 취소 신청: 제목 "… 예약 취소 신청, 48시간 이내에 처리해 주세요." → cancel_request
 *    (판매자가 SCM에서 처리해야 하는 '신청' 단계라 홈페이지 자리는 풀지 않고 알림만)
 *  - 그 밖의 취소 관련 메일 → cancel_unknown (형식 확인 전이라 알림만) */
function parseKkdayMail(subject, text) {
  var s = String(subject || ''), t = String(text || '').replace(/\r/g, '').replace(/[ \t\u00a0]+/g, ' ');
  var refM = (s + '\n' + t).match(/\b\d{2}KK\d{6,}\b/);
  if (!refM) return null;
  var out = { source: 'kkday', ref: refM[0] };
  if (/취소\s*신청|cancel\w*\s*request/i.test(s)) { out.action = 'cancel_request'; return out; }
  if (/주문이\s*접수|new\s*order/i.test(s)) out.action = 'book';
  else if (/취소|cancel/i.test(s)) { out.action = 'cancel_unknown'; return out; }
  else return null;
  var dm = t.match(/사용\s*날짜\s*:\s*(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
  if (dm) out.date = dm[1] + '-' + pad2(dm[2]) + '-' + pad2(dm[3]);
  var tm = t.match(/이용\s*가능한\s*시간\s*:\s*(\d{1,2}):(\d{2})/);
  if (tm) out.time = pad2(tm[1]) + ':' + tm[2];
  var qm = t.match(/수량\s*:\s*(\d+)/);
  out.people = qm ? Number(qm[1]) : 1;
  var sm = t.match(/패키지\s*:[^\n]*?(\d{2,3})\s*ml/i);
  out.size = sm ? sm[1] + 'ml' : '';
  var nm = t.match(/대표\s*여행자\s*:\s*([^\n]+)/);
  out.name = nm ? nm[1].trim() : '';
  return out;
}

function syncGygMails() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SYNC_URL'), secret = props.getProperty('SYNC_SECRET');
  var dryRun = String(props.getProperty('DRY_RUN') || 'true') !== 'false';
  if (!url || !secret) throw new Error('스크립트 속성 SYNC_URL / SYNC_SECRET 을 먼저 설정하세요.');

  var done = JSON.parse(props.getProperty('DONE_IDS') || '[]');
  var threads = GmailApp.search('from:(getyourguide.com OR kkday.com) newer_than:3d', 0, 50);
  // 오래된 메일부터 처리 — 예약 메일보다 취소 메일을 먼저 처리하면 취소된 예약이 '확정'으로 들어가 버림
  var msgs = [];
  threads.forEach(function (th) { th.getMessages().forEach(function (m) { msgs.push(m); }); });
  msgs.sort(function (a, b) { return a.getDate() - b.getDate(); });
  msgs.forEach(function (m) {
      var id = m.getId();
      if (done.indexOf(id) >= 0) return;
      var body = m.getPlainBody();
      var info = parseGygMail(body) || parseKkdayMail(m.getSubject(), body);
      if (!info) {
        // 예약번호가 없거나 예약/취소 형식이 아닌 안내 메일은 기록만 하고 넘어감
        done.push(id);
        return;
      }
      if (info.action === 'cancel_request') {
        if (!dryRun) { alertOnce(info.ref, 'KKday 취소 신청이 들어왔어요. KKday SCM에서 48시간 안에 처리해 주세요. 홈페이지 자리는 아직 유지돼 있으니, 취소를 승인하면 어드민에서 이 예약을 "취소"로 바꿔 주세요.', m); done.push(id); }
        Logger.log((dryRun ? '[DRY] ' : '') + 'cancel_request ' + info.ref + ' → 알림만');
        return;
      }
      if (info.action === 'cancel_unknown') {
        if (!dryRun) { alertOnce(info.ref, '취소 관련 KKday 메일을 자동으로 처리하지 못했어요. 어드민에서 직접 확인해 주세요.', m); done.push(id); }
        Logger.log((dryRun ? '[DRY] ' : '') + 'cancel_unknown ' + info.ref);
        return;
      }
      if (info.action === 'book' && (!info.date || !info.time)) {
        alertOnce(info.ref, '날짜/시간을 읽지 못했어요', m);
        done.push(id);
        return;
      }
      info.dryRun = dryRun;
      var res = UrlFetchApp.fetch(url, {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true,
        headers: { 'x-sync-secret': secret }, payload: JSON.stringify(info),
      });
      var code = res.getResponseCode(), text = res.getContentText();
      Logger.log((dryRun ? '[DRY] ' : '') + info.action + ' ' + info.ref + ' → ' + code + ' ' + text);
      if (dryRun) return;                 // 시험 모드: 처리 완료로 표시하지 않음 → 실제 모드 전환 후 다시 처리됨
      if (code >= 200 && code < 300) done.push(id);
      else if (code >= 400 && code < 500) { alertOnce(info.ref, '서버가 거절했어요: ' + text, m); done.push(id); }
      // 5xx(일시 오류)는 표시하지 않아 다음 실행 때 다시 시도
  });
  props.setProperty('DONE_IDS', JSON.stringify(done.slice(-500)));
}

function alertOnce(ref, why, msg) {
  var me = Session.getEffectiveUser().getEmail();
  var pf = /^GYG/.test(ref) ? 'GYG' : 'KKday';
  MailApp.sendEmail(me, '[홈페이지 연동] ' + pf + ' 예약 확인 필요 - ' + ref,
    pf + ' 메일을 홈페이지 신청에 자동으로 반영하지 못했거나 직접 처리가 필요해요.\n\n' +
    '예약번호: ' + ref + '\n내용: ' + why + '\n메일 제목: ' + msg.getSubject());
}

/* 설치 직후 1회 실행: 5분마다 syncGygMails 를 돌리는 트리거 생성 */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncGygMails') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncGygMails').timeBased().everyMinutes(5).create();
}

if (typeof module !== 'undefined') module.exports = { parseGygMail: parseGygMail, parseKkdayMail: parseKkdayMail };
