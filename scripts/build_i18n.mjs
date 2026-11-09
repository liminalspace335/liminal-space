#!/usr/bin/env node
/* 구글 검색용 언어별 페이지(/vi /en /ru /ko)와 sitemap.xml 생성.
 *   node scripts/build_i18n.mjs          생성
 *   node scripts/build_i18n.mjs --check  생성물이 원본과 어긋나면 실패(PR에서 자동 실행)
 * 원본은 루트의 HTML과 app.js의 I18N이다. vi/ en/ ru/ ko/ 안의 파일은 직접 고치지 말 것.
 * 루트 HTML은 <!-- seo:auto --> 구간만 이 스크립트가 쓴다. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 자체 도메인을 연결하면 이 값만 바꾸고 다시 생성한다.
const SITE = 'https://liminalspace335.github.io/liminal-space/';
const LANGS = ['vi', 'en', 'ru', 'ko'];
const DEFAULT_LANG = 'vi';   // 언어를 저장하지 않은 방문자·구글이 루트에서 보는 언어(app.js와 동일)
const PAGES = ['index', 'brand', 'space', 'classes', 'gallery', 'location'];
const LOCALE = { vi: 'vi_VN', en: 'en_US', ru: 'ru_RU', ko: 'ko_KR' };
const IMAGE = SITE + 'assets/og-share.jpg';   // 링크 공유 카드용 1200×630
// 구글 서치 콘솔 소유권 인증 태그. 삭제하면 인증이 풀린다. 사이트 주소(SITE)를 바꾸면 새로 받아야 한다.
const GOOGLE_VERIFY = '<meta name="google-site-verification" content="-pdQ4gGfk5ADUp6oCXtBYA3mA_XEq8r7VFTkphag_Gw" />';

// ponytail: 관리자 지점 설정의 복사본(지점 1개 기준). 주소·전화·영업시간이 바뀌면 여기도 고치고, 지점이 늘면 배열로 바꾼다.
const BUSINESS = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'LIMINAL SPACE',
  image: IMAGE,
  telephone: '+84818880504',
  address: { '@type': 'PostalAddress', streetAddress: '33/5 Lý Văn Phức', addressLocality: 'Tân Định', addressRegion: 'Hồ Chí Minh', addressCountry: 'VN' },
  geo: { '@type': 'GeoCoordinates', latitude: 10.790969, longitude: 106.693581 },
  hasMap: 'https://maps.app.goo.gl/nSZv3Nfd9kfWTm7d9',
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '11:00', closes: '20:00' }],
  sameAs: ['https://www.instagram.com/liminalspace_sg', 'https://www.facebook.com/profile.php?id=61590254235276', 'https://www.tiktok.com/@liminal_space33.5'],
};

const COPY = {
  index: {
    vi: ['Workshop Làm Nước Hoa tại TP.HCM | LIMINAL SPACE', 'Workshop làm nước hoa tại Tân Định, TP.HCM. Thử hơn 100 loại hương, 1:1 cùng Scent Designer và mang về chai nước hoa của riêng bạn. Đặt lịch trước, 1–2 giờ.'],
    en: ['Perfume Making Workshop in Ho Chi Minh City | LIMINAL SPACE', 'Make your own perfume in Ho Chi Minh City. Smell over 100 notes, blend 1:1 with a Scent Designer and take home your own bottle. 1–2 hours, by reservation.'],
    ru: ['Мастер-класс по созданию духов в Хошимине | LIMINAL SPACE', 'Создайте собственные духи в Хошимине: более 100 нот, работа 1:1 с парфюмерным дизайнером и флакон, который вы заберёте с собой. 1–2 часа, по записи.'],
    ko: ['호치민 향수 만들기 공방 클래스 | LIMINAL SPACE', '호치민 떤딘의 향수 공방. 100여 종의 향을 맡고 센트 디자이너와 1:1로 조향해 나만의 향수를 담아가세요. 소요 1–2시간, 사전 예약제.'],
  },
  brand: {
    vi: ['Giới Thiệu Xưởng Nước Hoa tại TP.HCM | LIMINAL SPACE', 'LIMINAL SPACE là xưởng nước hoa tại TP.HCM, nơi bạn khám phá gu mùi hương của mình cùng Scent Designer và tạo nên mùi hương độc nhất.'],
    en: ['About Our Perfume Studio in Ho Chi Minh City | LIMINAL SPACE', 'LIMINAL SPACE is a perfume workshop in Ho Chi Minh City where you discover your taste with a Scent Designer and create a one-of-a-kind scent.'],
    ru: ['О парфюмерной мастерской в Хошимине | LIMINAL SPACE', 'LIMINAL SPACE — парфюмерная мастерская в Хошимине, где вместе с парфюмерным дизайнером вы найдёте свой вкус и создадите единственный в своём роде аромат.'],
    ko: ['호치민 향수 공방 소개 | LIMINAL SPACE', 'LIMINAL SPACE는 호치민의 향수 공방입니다. 센트 디자이너와 함께 나의 취향을 발견하고 세상에 하나뿐인 향을 완성합니다.'],
  },
  space: {
    vi: ['Không Gian Xưởng Nước Hoa tại Tân Định, TP.HCM | LIMINAL SPACE', 'Khám phá không gian của LIMINAL SPACE tại Tân Định, TP.HCM, với phòng hương hơn 100 loại để bạn tự do trải nghiệm.'],
    en: ['Our Perfume Studio Space in Tan Dinh, Ho Chi Minh City | LIMINAL SPACE', 'Step inside LIMINAL SPACE in Tan Dinh, Ho Chi Minh City, and explore a scent room with over 100 notes.'],
    ru: ['Пространство парфюмерной мастерской в Хошимине | LIMINAL SPACE', 'Загляните в LIMINAL SPACE в районе Тан Динь, Хошимин: комната ароматов с более чем 100 нотами.'],
    ko: ['호치민 떤딘 향수 공방 공간 | LIMINAL SPACE', '호치민 떤딘에 있는 LIMINAL SPACE의 공간을 만나보세요. 100여 종의 향이 있는 향기룸에서 자유롭게 시향할 수 있습니다.'],
  },
  classes: {
    vi: ['Lớp Học Làm Nước Hoa tại TP.HCM | LIMINAL SPACE', 'Các lớp học làm nước hoa tại TP.HCM: tư vấn 1:1, thử hương, thiết kế công thức, pha chế và đóng gói. Thời lượng 1–2 giờ, đặt lịch trước.'],
    en: ['Perfume Making Classes in Ho Chi Minh City | LIMINAL SPACE', 'Perfume making classes in Ho Chi Minh City: 1:1 consultation, smelling, composing, blending and packaging. 1–2 hours, by reservation only.'],
    ru: ['Занятия по созданию духов в Хошимине | LIMINAL SPACE', 'Занятия по созданию духов в Хошимине: консультация 1:1, знакомство с нотами, композиция, смешивание и упаковка. 1–2 часа, только по записи.'],
    ko: ['호치민 향수 만들기 클래스 안내 | LIMINAL SPACE', '호치민 향수 만들기 클래스. 1:1 상담, 시향, 조향 설계, 조향, 패키징까지 소요 1–2시간, 사전 예약제로 운영합니다.'],
  },
  gallery: {
    vi: ['Thư Viện Ảnh Workshop Nước Hoa tại TP.HCM | LIMINAL SPACE', 'Hình ảnh các buổi workshop làm nước hoa và không gian của LIMINAL SPACE tại TP.HCM.'],
    en: ['Perfume Workshop Photo Gallery, Ho Chi Minh City | LIMINAL SPACE', 'Photos of perfume making workshops and the studio at LIMINAL SPACE in Ho Chi Minh City.'],
    ru: ['Галерея парфюмерной мастерской в Хошимине | LIMINAL SPACE', 'Фотографии мастер-классов по созданию духов и пространства LIMINAL SPACE в Хошимине.'],
    ko: ['호치민 향수 공방 갤러리 | LIMINAL SPACE', '호치민 향수 공방 LIMINAL SPACE의 클래스와 공간 사진을 만나보세요.'],
  },
  location: {
    vi: ['Địa Chỉ: 33/5 Lý Văn Phức, Tân Định, TP.HCM | LIMINAL SPACE', 'Đường đến LIMINAL SPACE: 33/5 Lý Văn Phức, Tân Định, TP.HCM. Mở cửa 11:00–20:00, đặt lịch trước.'],
    en: ['Find Us: 33/5 Ly Van Phuc, Tan Dinh, Ho Chi Minh City | LIMINAL SPACE', 'Getting to LIMINAL SPACE: 33/5 Lý Văn Phức, Tan Dinh, Ho Chi Minh City. Open 11:00–20:00, by reservation.'],
    ru: ['Как добраться: 33/5 Ly Van Phuc, Хошимин | LIMINAL SPACE', 'Как добраться до LIMINAL SPACE: 33/5 Lý Văn Phức, Tân Định, Хошимин. Открыто 11:00–20:00, по предварительной записи.'],
    ko: ['오시는 길: 호치민 떤딘 33/5 Lý Văn Phức | LIMINAL SPACE', 'LIMINAL SPACE 찾아오는 길: 33/5 Lý Văn Phức, Tân Định, 호치민. 영업시간 11:00–20:00, 사전 예약제.'],
  },
};

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pageUrl = (lang, page) => `${SITE}${lang}/${page === 'index' ? '' : page + '.html'}`;
const strip = (html) => html.replace(/\n?<!-- seo:auto -->[\s\S]*?<!-- \/seo:auto -->/, '');
const inlineJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const i18nSrc = read('app.js').match(/const I18N = (\{[\s\S]*?\n\});/);
if (!i18nSrc) throw new Error('app.js에서 I18N을 찾지 못했습니다');
const I18N = vm.runInNewContext(`(${i18nSrc[1]})`);

// app.js의 i18nGet과 같은 대체 규칙
const translate = (lang, key, ko) => I18N[lang]?.[key] ?? (lang === 'ru' ? I18N.en[key] : undefined) ?? ko;

function metaTags(lang, page, withAlternates) {
  const [title, desc] = COPY[page][lang];
  const url = pageUrl(lang, page);
  const tags = [
    `<meta name="description" content="${attr(desc)}" />`,
    `<link rel="canonical" href="${url}" />`,
  ];
  if (!withAlternates && page === 'index') tags.push(GOOGLE_VERIFY);   // 서치 콘솔이 확인하는 주소는 루트 홈 하나
  if (withAlternates) {
    for (const l of LANGS) tags.push(`<link rel="alternate" hreflang="${l}" href="${pageUrl(l, page)}" />`);
    tags.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(DEFAULT_LANG, page)}" />`);
  }
  tags.push(
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="LIMINAL SPACE" />`,
    `<meta property="og:title" content="${attr(title)}" />`,
    `<meta property="og:description" content="${attr(desc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${IMAGE}" />`,
    `<meta property="og:locale" content="${LOCALE[lang]}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  );
  if (withAlternates && (page === 'index' || page === 'location')) {
    const data = { ...BUSINESS, url: pageUrl(lang, 'index'), description: COPY.index[lang][1] };
    tags.push(`<script type="application/ld+json">${inlineJson(data)}</script>`);
  }
  return `<!-- seo:auto -->\n${tags.join('\n')}\n<!-- /seo:auto -->`;
}

// 루트 페이지는 화면을 그대로 두고 head 안내만 붙인다. 구글이 루트에서 보는 내용은 기본 언어 페이지와 같으므로 그쪽을 대표 주소로 지정한다.
function rootPage(page, src) {
  const out = strip(src).replace(/<\/title>/, () => `</title>\n${metaTags(DEFAULT_LANG, page, false)}`);
  if (out === strip(src)) throw new Error(`${page}.html에 <title>이 없습니다`);
  return out;
}

function langPage(lang, page, src) {
  const expected = (src.match(/\sdata-i18n="/g) || []).length;
  const ko = {};
  let baked = 0;
  let html = strip(src).replace(/<([a-z0-9]+)((?:\s[^>]*?)?\sdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (_, tag, attrs, key, inner) => {
    baked++;
    ko[key] = inner;
    return `<${tag}${attrs}>${translate(lang, key, inner)}</${tag}>`;
  });
  if (baked !== expected) throw new Error(`${page}.html: data-i18n ${expected}개 중 ${baked}개만 처리됨`);

  const boot = `<script>window.LS_PAGE_LANG=${inlineJson(lang)};window.LS_KO=${inlineJson(ko)};</script>\n`;
  html = html
    .replace('<html lang="ko">', `<html lang="${lang}">`)
    .replace(/<title>[^<]*<\/title>/, () => `<title>${attr(COPY[page][lang][0])}</title>\n${metaTags(lang, page, true)}`)
    .replace(/href="styles\.css/g, 'href="../styles.css')
    .replace(/src="(vendor\/|config\.js|store\.js|app\.js)/g, 'src="../$1')
    .replace('<script src="../vendor/', () => `${boot}<script src="../vendor/`);
  if (!html.includes('window.LS_PAGE_LANG')) throw new Error(`${page}.html: 스크립트 위치를 찾지 못했습니다`);
  return html;
}

function buildAll() {
  const files = new Map();
  for (const page of PAGES) {
    const f = `${page}.html`;
    const src = read(f);
    files.set(f, rootPage(page, src));
    for (const lang of LANGS) files.set(`${lang}/${f}`, langPage(lang, page, src));
  }
  const urls = LANGS.flatMap((l) => PAGES.map((p) => `  <url><loc>${pageUrl(l, p)}</loc></url>`));
  files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  return files;
}

const files = buildAll();
if (process.argv.includes('--check')) {
  const stale = [...files].filter(([f, c]) => !fs.existsSync(path.join(ROOT, f)) || read(f) !== c).map(([f]) => f);
  if (stale.length) {
    console.error(`언어별 페이지가 원본과 다릅니다. node scripts/build_i18n.mjs 실행 후 커밋하세요:\n  ${stale.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`OK: ${files.size}개 파일이 원본과 일치`);
} else {
  for (const [f, c] of files) {
    fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, f), c);
  }
  console.log(`생성 완료: ${files.size}개 파일`);
}
