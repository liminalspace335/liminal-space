// GYG 메일 파서 검사: node scripts/gyg_parse_test.cjs  (실패 시 assert 오류)
const assert = require('assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'gyg-gmail-sync.gs'), 'utf8'), ctx);
const { parseGygMail } = ctx.module.exports;

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
console.log('gyg parser: all checks passed');
