// GYG 메일 파서 검사: node scripts/gyg_parse_test.cjs  (실패 시 assert 오류)
const assert = require('assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'gyg-gmail-sync.gs'), 'utf8'), ctx);
const { parseGygMail, parseKkdayMail, parseViatorMail, htmlToText } = ctx.module.exports;

// 공급사 예약 메일(2026-11-21 실제 메일 내용 기준) — 줄바꿈형
const bookLines = `Ho Chi Minh City: Perfume Workshop with Scent Designer
Ho Chi Minh City: Scent Workshop with Scent Designer [30ml]
Reference number
GYGMX358VFRX
Date
November 29, 2026, 11:00 AM
Number of participants
1 x Adult (Age 0 - 99)
Main customer
Park Kwon Ho
customer-7ctoe7a7lgnbn5k5@reply.getyourguide.com
Phone: +84941406510
Language: Korean
Tour language
Korean (Instructor)
Price
₫ 450,000
Open booking`;
// 같은 내용이 한 줄로 붙어 나오는 경우
const bookInline = bookLines.replace(/\n/g, ' ').replace('Main customer ', 'Main customer\n');
const cancel = `GYGMX358VFRX was cancelled
Hi supply partner,
We're writing to let you know that the following booking has been canceled.
Reference Number: GYGMX358VFRX
Tour: Ho Chi Minh City: Perfume Workshop with Scent Designer [30ml]
Name: Park Kwon Ho
Date: November 29, 2026, 11:00 AM`;

const b = parseGygMail(bookLines);
assert.deepStrictEqual(
  { a: b.action, r: b.ref, d: b.date, t: b.time, s: b.size, p: b.people, n: b.name, ph: b.phone, l: b.language, pr: b.price },
  { a: 'book', r: 'GYGMX358VFRX', d: '2026-11-29', t: '11:00', s: '30ml', p: 1, n: 'Park Kwon Ho', ph: '+84941406510', l: 'Korean', pr: '450,000' });
const bi = parseGygMail(bookInline);
assert.strictEqual(bi.date, '2026-11-29'); assert.strictEqual(bi.people, 1); assert.strictEqual(bi.price, '450,000');

const c = parseGygMail(cancel);
assert.deepStrictEqual({ a: c.action, r: c.ref, d: c.date, t: c.time }, { a: 'cancel', r: 'GYGMX358VFRX', d: '2026-11-29', t: '11:00' });

// 여러 명·오후 시간·50ml
const multi = parseGygMail(bookLines.replace('1 x Adult (Age 0 - 99)', '2 x Adult\n1 x Child').replace('11:00 AM', '7:00 PM').replace('[30ml]', '[50ml]'));
assert.deepStrictEqual({ p: multi.people, t: multi.time, s: multi.size }, { p: 3, t: '19:00', s: '50ml' });
// 12시 경계
assert.strictEqual(parseGygMail(bookLines.replace('11:00 AM', '12:00 PM')).time, '12:00');
// 예약번호 없는 GYG 안내 메일은 무시
assert.strictEqual(parseGygMail('Your weekly performance report from GetYourGuide'), null);

// ---- KKday (2026-11-23 실제 공급사 메일 내용 기준) ----
const kkBook = `If the content of the following letter is garbled, please click this link:https://scm.kkday.com/v1/zh-tw/order/index/26KK221534633 to view it at SCM, please contact your KKday sales staff.

축하드립니다. 새로운 주문이 접수되었습니다.
예약번호 : 26KK221534633
상품번호 : 931711
상품명 : 호치민 향수 만들기 클래스 | 1군에서 나만의 시그니처 향수 만들기
패키지 : LIMINAL SPACE 호치민 - 향수 만들기 클래스 (30ml 보틀)
사용 날짜 : 2026/11/30
유효기간 : 2026/11/30 ~ 2026/11/30
이용 가능한 시간: 11:00
수량 : 1명
대표 여행자 : park, kwonho`;
const k = parseKkdayMail('[KKday] 예약번호: 26KK221534633 주문이 접수되었습니다', kkBook);
assert.deepStrictEqual({ s:k.source, a:k.action, r:k.ref, d:k.date, t:k.time, p:k.people, z:k.size, n:k.name },
  { s:'kkday', a:'book', r:'26KK221534633', d:'2026-11-30', t:'11:00', p:1, z:'30ml', n:'park, kwonho' });
const kc = parseKkdayMail('[KKday] 예약번호:26KK221534633 예약 취소 신청, 48시간 이내에 처리해 주세요.',
  '예약번호 : 26KK221534633\n본 예약은 2026/11/23 (+07:00 )에 취소 신청되었습니다.\n취소 사유 : 개인');
assert.deepStrictEqual({ a:kc.action, r:kc.ref }, { a:'cancel_request', r:'26KK221534633' });
// 50ml·2명·한 자리 시간
const k2 = parseKkdayMail('[KKday] 예약번호: 26KK000000001 주문이 접수되었습니다', kkBook.replace('30ml','50ml').replace('수량 : 1명','수량 : 2명').replace('시간: 11:00','시간: 9:00').replace(/26KK221534633/g,'26KK000000001'));
assert.deepStrictEqual({ z:k2.size, p:k2.people, t:k2.time, r:k2.ref }, { z:'50ml', p:2, t:'09:00', r:'26KK000000001' });
// KKday 안내 메일(예약번호 없음)·GYG 메일은 KKday로 안 읽힘
assert.strictEqual(parseKkdayMail('[KKday] 정산 안내', '이번 달 정산 내역입니다'), null);
assert.strictEqual(parseKkdayMail('Booking', bookLines), null);
// KKday 메일은 GYG 파서가 안 읽음
assert.strictEqual(parseGygMail(kkBook), null);

// ---- Viator (2026-11-27 실제 공급사 메일 HTML 구조 기준, 이름·전화는 가짜) ----
const td = (l, v) => `<tr>\n<td align="left" style="padding: 0px 0px 8px;">\n${l}: <span style="color:#666666;">${v}</span>\n</td>\n</tr>`;
const vBookHtml = `<style>a{color:#186b69}</style><table><tr><td>예약 확인</td></tr>
<tr><td align="center">예약 참조: <span style="font-weight:bold;">BR-1467602419 </span></td></tr>
${td('투어 이름', 'Ho Chi Minh City Make Your Own Perfume Workshop in District 1')}
${td('여행 날짜', 'Fri, Jan 01, 2027')}
${td('여행 인솔자 이름', 'Test Traveler')}
${td('여행자 이름', 'Test Traveler')}
${td('여행자', '1 Adult')}
${td('상품 코드', '5714429P3 ')}
${td('투어 등급', '50ml Bottle 11:00')}
${td('투어 등급 코드', 'TG2~11:00 ')}
${td('투어 언어', 'English - Guide ')}
${td('기본 요금', 'VND 491,400.')}
${td('전화', ' (Alternate Phone)KR+82 01000000000 ')} <a href="x">고객에게 메시지를 전송합니다.</a>
${td('특별 요구 사항', 'No')}</table>`;
const vSubj = 'Fri, Jan 01, 2027(#BR-1467602419)에 대한 새로운 예약';
const v = parseViatorMail(vSubj, htmlToText(vBookHtml));
assert.deepStrictEqual(
  { s: v.source, a: v.action, r: v.ref, d: v.date, t: v.time, z: v.size, p: v.people, n: v.name, ph: v.phone, l: v.language, pr: v.price },
  { s: 'viator', a: 'book', r: 'BR-1467602419', d: '2027-01-01', t: '11:00', z: '50ml', p: 1, n: 'Test Traveler', ph: '+8201000000000', l: 'English', pr: '491,400' });
// 여러 명·30ml·오후·다른 달
const v2 = parseViatorMail(vSubj, htmlToText(vBookHtml.replace('1 Adult', '2 Adults, 1 Child').replace('50ml Bottle 11:00', '30ml Bottle 15:00').replace('Fri, Jan 01, 2027', 'Sat, Dec 05, 2026')));
assert.deepStrictEqual({ p: v2.people, z: v2.size, t: v2.time, d: v2.date }, { p: 3, z: '30ml', t: '15:00', d: '2026-12-05' });
// 취소: 제목엔 예약번호 없음, 본문에 #BR-…
const vc = parseViatorMail('취소된 예약: Fri, Jan 01, 2027', htmlToText(`<table><tr><td>예약 취소됨</td></tr>
<tr><td>예약 참조: #BR-1467602419</td></tr><tr><td>취소됨</td></tr>${td('투어 옵션', '50ml Bottle 11:00')}${td('여행 날짜', 'Fri, Jan 01, 2027')}</table>`));
assert.deepStrictEqual({ a: vc.action, r: vc.ref }, { a: 'cancel', r: 'BR-1467602419' });
// 변경 메일은 알림만, 예약번호 없는 Viator 메일(2단계 인증·설문)은 무시
assert.strictEqual(parseViatorMail('Amended booking: Fri, Jan 01, 2027', '예약 참조: BR-1467602419').action, 'notify');
assert.strictEqual(parseViatorMail('Your two-factor authentication code request', 'Your code expires in 20 minutes'), null);
// Viator 메일은 GYG·KKday 파서가 안 읽음
assert.strictEqual(parseGygMail(htmlToText(vBookHtml)), null);
assert.strictEqual(parseKkdayMail(vSubj, htmlToText(vBookHtml)), null);
console.log('gyg + kkday + viator parser: all checks passed');
