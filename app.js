/* ---------- 홈(인덱스) 새로고침 시 항상 히어로(맨 위)부터 ---------- */
(function(){
  var seg=location.pathname.split('/').pop();
  if(seg!==''&&seg!=='index.html') return;            // 홈에서만 동작
  if('scrollRestoration' in history) history.scrollRestoration='manual'; // 브라우저 스크롤 복원 끔
  function toTop(){
    if(location.hash) history.replaceState(null,'',location.pathname+location.search); // 앵커 제거
    window.scrollTo(0,0);
  }
  toTop();
  window.addEventListener('load',function(){ setTimeout(toTop,0); });
})();

/* ---------- 공통 마크업 주입: 신청 팝업 · 모바일 하단 CTA · 맨 위로 (6개 페이지 중복 제거)
   i18n 한국어 기본값 수집(아래) 전에 넣어야 data-i18n 문구가 함께 수집됨 ---------- */
document.body.insertAdjacentHTML('beforeend',
  '<div class="modal-overlay" id="applyModal" aria-hidden="true"><div class="modal" role="dialog" aria-modal="true" aria-label="LIMINAL SPACE">'
 +'<aside class="am-rail" id="amRail"></aside>'
 +'<div class="am-main"><div class="am-mhead"><div class="am-brand"><b>LIMINAL SPACE</b><i></i><span class="am-sub"></span></div><button type="button" class="am-close" aria-label="close">×</button></div>'
 +'<div class="am-body" id="amBody"></div>'
 +'<div class="am-foot"><button type="button" class="am-back" id="btnBack"></button><button type="button" class="am-next" id="btnNext"></button></div></div>'
 +'<button type="button" class="am-close am-close-abs" aria-label="close">×</button>'
 +'<div class="am-toast" id="amToast" role="status" aria-live="polite"></div></div></div>'
 +'<div class="mcta" id="mcta"><button type="button" class="mcta-btn" data-open-apply><span data-i18n="hero.cta">클래스 신청하기</span><span class="mcta-price" id="mctaPrice"></span></button><button type="button" class="top-btn" data-to-top aria-label="top">↑</button></div>'
 +'<button type="button" class="top-fab" id="topFab" data-to-top aria-label="top">↑</button>');
ensureSvgDefs();   // 헤더 SNS 토글 아이콘(#ic-sns)이 데이터 로드 전에도 보이도록

/* ---------- i18n ---------- */
const I18N = {
  ko: { "ph.nat":"검색 또는 선택","ph.phone":"전화번호","ph.fb":"아이디 또는 링크","ph.ig":"아이디" }, // 기본값은 HTML에 그대로 둠 (data-i18n 키만 매핑) + placeholder(ph.*)
  en: {
    "nav.concept":"Brand","nav.home":"About","nav.space":"Space","nav.classes":"Classes","nav.apply":"Apply","nav.gallery":"Gallery","nav.location":"Location","nav.contact":"Apply · Contact","space.title":"The Space","space.more":"More about the space →","contact.title":"Contact","contact.note":"Inquiries for classes, companies/groups and collaborations are welcome.","connect.title":"Follow us",
    "cta.lead":"Complete your own scent, together with a scent designer.","cta.sub":"A premium perfume workshop where you smell 100+ notes, blend, and take home your own bottle.","cta.btn":"Book a class",
    "gallery.title":"Gallery","gallery.featured":"Featured with","gallery.more":"View full gallery →",
    "hero.eyebrow":"Perfume Workshop","hero.sub":"The scent of moments between boundaries. A workshop where you blend and bottle a perfume of your own.",
    "hero.tag1":"Completely new experience","hero.tag2":"Eau de Parfum","hero.cta":"Apply for a class","hero.cta2":"View classes",
    "concept.title":"A scent that begins at the threshold",
    "concept.pa.t":"Over 100 notes","concept.pa.d":"Smell them yourself and discover a taste you never knew.",
    "concept.pb.t":"1:1 with a Scent Designer","concept.pb.d":"A deep moment translating your senses and emotions into words.",
    "concept.pc.t":"A one-of-a-kind scent","concept.pc.d":"Name it and complete it as your own signature.",
    "m.lead":"We all experience moments that belong nowhere entirely. An unfamiliar space, an empty stretch of time, an emotion we cannot name. Beginning from the Latin 'limen' — the threshold — LIMINAL SPACE means a moment of transition undefined by any state. We record that invisible gap as scent.",
    "m.p1":"Scent is not merely a pleasant smell. It is the most primal sense that recalls memory, leaves emotion, and stores a state. The air of a place that once put you at ease, the warmth of a memory shared with someone dear, emotions still lingering without a name. We focus on the time and space made of scent, more than the scent itself.",
    "m.p2":"Here you smell over 100 scents to discover your own taste, recall a past moment to define your present emotion, and complete a still-nameless state as scent. This is not a simple pick-your-scent DIY. Together with a Scent Designer you put your senses and emotions into words, discover a taste you never knew, and complete a one-of-a-kind perfume — that is LIMINAL SPACE.",
    "m.p3":"It is an experience offered for the first time in Vietnam. There have been places to smell, choose and make scents, but never an experience to discover why you are drawn to a scent and who you are. A fun, effortless day — yet by the end you will surely feel something has changed. Starting from an empty, undefined space, when you leave you will have made a scent defined by yourself.",
    "m.quote":"Until you define it, this place is nothing. The moment you define it, this place becomes only yours.",
    "classes.title":"Classes & Programs","classes.inquire":"Inquire","prog.inquiry":"Inquire for price","prog.permonth":"Monthly",
    "apply.title":"How to apply","apply.lede":"Booking takes four steps. Choose a class, design your scent, and take home a bottle of your own.",
    "apply.cta":"Start application","apply.note":"Duration 1–2 hours · By reservation only.",
    "how.s1.t":"Explore scents","how.s1.d":"Smell 100+ curated notes to find your olfactory taste.",
    "how.s2.t":"Design the formula","how.s2.d":"Blend your favorite notes into your own formula with a designer.",
    "how.s3.t":"Name it","how.s3.d":"Name your scent to complete your own signature.",
    "how.s4.t":"Bottling","how.s4.d":"Choose 10·30·50ml, bottled with a pouch to take home.",
    "proc.title":"The Class Process",
    "proc.s1.t":"Consultation","proc.s1.d":"Through a 1:1 consultation and guided session with a scent designer, we discover the scents you love together.",
    "proc.s2.t":"Scent testing","proc.s2.d":"Freely sample over 100 scents in our scent room and bring your preferences into focus.",
    "proc.s3.t":"Fragrance design","proc.s3.d":"Using the notes you chose, we design a scent that is uniquely yours — your scent designer guides you so it fits your taste perfectly.",
    "proc.s4.t":"Blending","proc.s4.d":"Through several rounds of blending, you refine and complete your very own perfume.",
    "proc.s5.t":"Packaging","proc.s5.d":"We carefully wrap it in LIMINAL SPACE's own signature packaging.",
    "proc.philosophy":"LIMINAL SPACE is not a DIY where you simply mix scents. We interpret how fragrance interacts with people, personality, weather and circumstance, running the workshop so you can create the scent you truly want.",
    "proc.close":"Make a special memory in the one-of-a-kind space that is LIMINAL SPACE.",
    "form.name":"Name","form.phone":"Phone","form.email":"Email","form.class":"Class","form.date":"Preferred date","form.people":"People","form.msg":"Message (optional)","form.nationality":"Nationality","form.fb":"Facebook (optional)","form.ig":"Instagram (optional)",
    "ph.nat":"Search or select","ph.phone":"Phone number","ph.fb":"ID or link","ph.ig":"ID / handle",
    "modal.confirmlabel":"CONFIRM","modal.confirmq":"Please review your details.","modal.confirmnote":"Please double-check your email address. If your information is incorrect, you may not receive the booking confirmation. Review your details before tapping Submit.",
    "modal.sub":"Class application · 5 steps","modal.step1":"STEP 1 / 5","modal.q0":"Please choose a branch to visit.",
    "modal.step2":"STEP 2 / 5","modal.q1":"Which program would you like?",
    "modal.err":"Please select an option.","modal.step3":"STEP 3 / 5","modal.q2":"Choose your perfume volume.","modal.sizeinc":"Bottle + pouch included",
    "modal.step4":"STEP 4 / 5","modal.q3":"Tell us your visit details.","modal.time":"Preferred time","modal.errdate":"Please enter date and time.","modal.pickdate":"Select a date first",
    "modal.step5":"STEP 5 / 5","modal.q4":"Enter your details and confirm.","modal.errcontact":"Please fill in all fields except the message.",
    "modal.donet":"Your application is received","modal.doned":"After review, we will confirm your booking via your contact.","modal.back":"Back","modal.next":"Next",
    "loc.title":"Getting here","loc.addr.t":"Address","loc.hours.t":"Hours","loc.hours.d":"Tue–Sun 11:00 – 20:00 (Mon closed)","loc.contact.t":"Contact","loc.mapnote":"Map area","slot":"Photo area"
  },
  vi: {
    "nav.concept":"Thương hiệu","nav.home":"Giới thiệu","nav.space":"Không gian","nav.classes":"Lớp học","nav.apply":"Đăng ký","nav.gallery":"Thư viện","nav.location":"Vị trí","nav.contact":"Đăng ký · Liên hệ","space.title":"Không gian","space.more":"Xem thêm về không gian →","contact.title":"Liên hệ","contact.note":"Chào đón liên hệ về lớp học, doanh nghiệp/nhóm và hợp tác.",
    "cta.lead":"Hoàn thiện mùi hương của riêng bạn, cùng scent designer.","cta.sub":"Workshop nước hoa cao cấp: thử hơn 100 loại hương, pha chế và mang về chai của riêng bạn.","cta.btn":"Đăng ký lớp học",
    "gallery.title":"Thư viện","gallery.featured":"Đã đồng hành cùng","gallery.more":"Xem toàn bộ thư viện →",
    "hero.eyebrow":"Perfume Workshop · Xưởng nước hoa",
    "hero.sub":"Hương thơm của khoảnh khắc giữa hai ranh giới. Lớp học tự pha chế và mang về một chai nước hoa của riêng bạn.",
    "hero.tag1":"Completely new experience","hero.tag2":"Eau de Parfum",
    "hero.cta":"Đăng ký lớp học","hero.cta2":"Xem lớp học",
    "concept.title":"Mùi hương bắt đầu từ ngưỡng cửa",
    "concept.pa.t":"Hơn 100 loại hương","concept.pa.d":"Tự mình ngửi và khám phá mùi hương bạn chưa từng biết.",
    "concept.pb.t":"1:1 cùng Scent Designer","concept.pb.d":"Khoảng thời gian sâu lắng diễn đạt cảm giác và cảm xúc thành ngôn từ.",
    "concept.pc.t":"Mùi hương độc nhất","concept.pc.d":"Đặt tên và hoàn thiện thành dấu ấn của riêng bạn.",
    "m.lead":"Chúng ta đều trải qua những khoảnh khắc không hoàn toàn thuộc về đâu cả. Một không gian xa lạ, một không gian trống rỗng, một cảm xúc không thể gọi tên. Bắt nguồn từ tiếng Latin 'limen' — ngưỡng cửa, LIMINAL SPACE là khoảnh khắc chuyển tiếp chưa được định nghĩa bởi bất kỳ trạng thái nào. Chúng tôi ghi lại khe hở vô hình ấy bằng mùi hương.",
    "m.p1":"Mùi hương không chỉ là một thứ thơm tho. Đó là giác quan nguyên thủy nhất gợi lại ký ức, lưu lại cảm xúc và lưu giữ trạng thái. Bầu không khí của một nơi từng khiến lòng ta bình yên, hơi ấm của ký ức chia sẻ cùng người thương, những cảm xúc còn nán lại mà chưa thể gọi tên. Chúng tôi tập trung vào thời gian và không gian được tạo nên từ hương, hơn cả bản thân mùi hương.",
    "m.p2":"Tại đây, bạn ngửi hơn 100 loại hương để khám phá gu của chính mình, gọi lại khoảnh khắc quá khứ để định nghĩa cảm xúc hiện tại, và hoàn thiện trạng thái chưa tên bằng mùi hương. Đây không chỉ là DIY chọn hương. Cùng Scent Designer diễn đạt cảm giác và cảm xúc thành ngôn từ, khám phá gu bạn chưa từng biết và hoàn thiện chai nước hoa độc nhất — đó chính là LIMINAL SPACE.",
    "m.p3":"Đây là trải nghiệm lần đầu tiên có mặt tại Việt Nam. Đã có những nơi để ngửi, chọn và làm hương, nhưng chưa từng có trải nghiệm khám phá vì sao bạn bị cuốn hút bởi mùi hương ấy, và bạn là ai. Một ngày thú vị, không hề khó, nhưng khi kết thúc chắc chắn bạn sẽ cảm nhận điều gì đó đã khác. Bắt đầu từ một không gian trống rỗng và chưa định nghĩa, khi rời khỏi đây bạn tạo nên mùi hương do chính mình định nghĩa — như nơi vốn là khoảng không trở thành không gian độc nhất được lấp đầy bằng giác quan của bạn.",
    "m.quote":"Trước khi bạn định nghĩa, nơi này chẳng là gì cả. Khoảnh khắc bạn định nghĩa, nơi này trở thành của riêng bạn.",
    "classes.title":"Lớp học & Chương trình",
    "classes.inquire":"Liên hệ",
    "prog.inquiry":"Liên hệ báo giá","prog.permonth":"Gói tháng",
    "prog.w.tag":"Signature Scent Workshop","prog.w.name":"Signature Scent Workshop","prog.w.desc":"Tự ngửi hơn 100 loại hương và cùng Scent Designer hoàn thiện chai nước hoa signature của riêng bạn. Thời lượng 1–2 giờ.",
    "prog.sub.tag":"Subscription","prog.sub.name":"Liminal Pick · Đăng ký","prog.sub.desc":"Mỗi tháng 2 lần giao nước hoa 10ml tận nhà. Tùy chỉnh theo gu qua chat 1:1, lưu dữ liệu sử dụng, kèm mẫu thử · túi · móc khóa nước hoa.",
    "prog.corp.tag":"Corporate / Group","prog.corp.name":"Đặt làm doanh nghiệp · tập thể","prog.corp.desc":"Lên ý tưởng sự kiện và chế tác · cung cấp hương cho doanh nghiệp, cơ quan, tập thể.",
    "prog.rent.tag":"Rental / Collaboration","prog.rent.name":"Cho thuê · Hợp tác","prog.rent.desc":"Cho thuê không gian và đồng hành cùng các dự án hợp tác thương hiệu.",
    "prog.inf.tag":"Influencer / Marketer","prog.inf.name":"Influencer · Marketer","prog.inf.desc":"Chương trình hợp tác và nội dung dành cho influencer · marketer.",
    "apply.title":"Cách đăng ký",
    "apply.lede":"Đặt chỗ gồm bốn bước. Chọn lớp học, thiết kế mùi hương và mang về một chai của riêng bạn.",
    "apply.cta":"Bắt đầu đăng ký","apply.note":"Thời lượng 1–2 giờ · Vận hành theo hình thức đặt trước.",
    "how.s1.t":"Khám phá hương","how.s1.d":"Ngửi hơn 30 loại note tuyển chọn để tìm gu khứu giác của bạn.",
    "how.s2.t":"Thiết kế công thức","how.s2.d":"Cùng chuyên gia pha trộn các note yêu thích thành công thức riêng.",
    "how.s3.t":"Đặt tên","how.s3.d":"Đặt tên cho mùi hương để hoàn thiện dấu ấn của riêng bạn.",
    "how.s4.t":"Đóng chai","how.s4.d":"Chọn 10·30·50ml, đóng vào chai và túi để mang về.",
    "proc.title":"Quy trình lớp học",
    "proc.s1.t":"Tư vấn","proc.s1.d":"Qua buổi tư vấn 1:1 và hướng dẫn cùng Scent Designer, chúng ta cùng khám phá gu hương bạn yêu thích.",
    "proc.s2.t":"Thử hương","proc.s2.d":"Tự do thử hơn 100 loại hương trong phòng hương và làm rõ gu của bạn.",
    "proc.s3.t":"Thiết kế hương","proc.s3.d":"Dựa trên những nốt hương bạn chọn, chúng tôi thiết kế mùi hương độc nhất của riêng bạn — Scent Designer đồng hành để hợp gu bạn nhất.",
    "proc.s4.t":"Pha chế","proc.s4.d":"Qua nhiều bước pha chế, bạn tinh chỉnh và hoàn thiện chai nước hoa của riêng mình.",
    "proc.s5.t":"Đóng gói","proc.s5.d":"Chúng tôi đóng gói tỉ mỉ trong bao bì riêng của LIMINAL SPACE.",
    "proc.philosophy":"LIMINAL SPACE không phải là DIY chỉ trộn hương. Chúng tôi diễn giải mối quan hệ giữa hương thơm với con người, tính cách, thời tiết và hoàn cảnh, tổ chức workshop để bạn tạo nên mùi hương mình thực sự mong muốn.",
    "proc.close":"Hãy tạo nên kỷ niệm đặc biệt trong không gian độc nhất của LIMINAL SPACE.",
    "form.name":"Họ tên","form.phone":"Số điện thoại","form.email":"Email","form.class":"Lớp học","form.date":"Ngày mong muốn","form.people":"Số người","form.msg":"Lời nhắn (tùy chọn)","form.nationality":"Quốc tịch","form.fb":"Facebook (tùy chọn)","form.ig":"Instagram (tùy chọn)","connect.title":"Theo dõi chúng tôi",
    "ph.nat":"Tìm hoặc chọn","ph.phone":"Số điện thoại","ph.fb":"ID hoặc liên kết","ph.ig":"ID",
    "modal.confirmlabel":"XÁC NHẬN","modal.confirmq":"Vui lòng kiểm tra thông tin của bạn.","modal.confirmnote":"Vui lòng kiểm tra lại địa chỉ email của bạn. Nếu thông tin sai, bạn có thể không nhận được xác nhận đặt lịch. Hãy kiểm tra kỹ trước khi nhấn Hoàn tất.",
    "form.opt1":"Pha chế Signature","form.opt2":"Cặp đôi · Nhóm","form.opt3":"Atelier nâng cao",
    "form.submit":"Gửi đăng ký","form.note":"* Đây là bản nháp. Việc gửi thực sẽ hoạt động sau khi tích hợp.","form.ok":"Đã nhận đăng ký. Chúng tôi sẽ liên hệ với bạn.",
    "classes.select":"Đăng ký lớp này",
    "modal.sub":"Đăng ký lớp học · 5 bước",
    "modal.step1":"BƯỚC 1 / 5","modal.q0":"Vui lòng chọn chi nhánh bạn muốn đến.",
    "modal.br1":"Sài Gòn (Saigon)","modal.br1d":"10° 47' 27.49\" N 106° 41' 36.89\" E · Bình Thạnh",
    "modal.br2":"Hà Nội (Hanoi)","modal.br2d":"Phố cổ · Hoàn Kiếm",
    "modal.step2":"BƯỚC 2 / 5","modal.q1":"Bạn muốn đăng ký chương trình nào?",
    "modal.c1d":"Hơn 100 loại hương · hoàn thiện signature của bạn","modal.c2d":"Mỗi tháng 2 lần giao 10ml · tùy chỉnh","modal.c3d":"Lên ý tưởng sự kiện · chế tác/cung cấp hương","modal.c4d":"Cho thuê không gian · hợp tác thương hiệu","modal.c5d":"Chương trình hợp tác · nội dung",
    "modal.err":"Vui lòng chọn một mục.",
    "modal.step3":"BƯỚC 3 / 5","modal.q2":"Chọn dung tích nước hoa hoàn thiện.","modal.sizeinc":"Bao gồm chai + túi",
    "modal.step4":"BƯỚC 4 / 5","modal.q3":"Cho chúng tôi biết thông tin ghé thăm.","modal.time":"Giờ mong muốn","modal.errdate":"Vui lòng nhập ngày và giờ.","modal.pickdate":"Chọn ngày trước",
    "modal.step5":"BƯỚC 5 / 5","modal.q4":"Nhập thông tin và xác nhận.","modal.errcontact":"Vui lòng điền tất cả mục trừ lời nhắn.",
    "modal.donet":"Đã nhận đăng ký","modal.doned":"Sau khi xác nhận, chúng tôi sẽ thông báo đặt chỗ qua liên hệ của bạn.",
    "modal.back":"Quay lại","modal.next":"Tiếp theo",
    "loc.title":"Đường đến","loc.addr.t":"Địa chỉ","loc.addr.d":"10° 47' 27.49\" N 106° 41' 36.89\" E","loc.hours.t":"Giờ mở cửa","loc.hours.d":"Thứ 3–CN 11:00 – 20:00 (nghỉ thứ 2)","loc.contact.t":"Liên hệ",
    "loc.mapnote":"Khu vực bản đồ","slot":"Khu vực ảnh"
  },
  ru: {
    "nav.home":"О нас","nav.space":"Пространство","nav.classes":"Классы","nav.gallery":"Галерея","nav.location":"Как добраться","nav.contact":"Запись · Контакты","space.title":"Пространство","space.more":"Подробнее о пространстве →","contact.title":"Контакты","contact.note":"Будем рады вопросам о классах, корпоративных и групповых программах, а также о сотрудничестве.","connect.title":"Мы в соцсетях",
    "cta.lead":"Создайте свой аромат вместе с парфюмерным дизайнером.","cta.sub":"Премиальная парфюмерная мастерская: более 100 нот, собственный купаж и флакон, который вы заберёте с собой.","cta.btn":"Записаться на класс",
    "gallery.title":"Галерея","gallery.featured":"Мы сотрудничали с","gallery.more":"Вся галерея →",
    "hero.eyebrow":"Perfume Workshop · Парфюмерная мастерская","hero.sub":"Аромат мгновений на границе. Мастерская, где вы смешиваете и разливаете во флакон собственные духи.",
    "hero.tag1":"Completely new experience","hero.tag2":"Eau de Parfum","hero.cta":"Записаться на класс","hero.cta2":"Смотреть классы",
    "concept.title":"Аромат, который начинается на пороге",
    "concept.pa.t":"Более 100 нот","concept.pa.d":"Попробуйте их сами и откройте вкус, о котором вы не знали.",
    "concept.pb.t":"1:1 с парфюмерным дизайнером","concept.pb.d":"Особое время, чтобы облечь ваши ощущения и эмоции в слова.",
    "concept.pc.t":"Единственный в своём роде аромат","concept.pc.d":"Дайте ему имя и сделайте своей личной подписью.",
    "m.lead":"Все мы переживаем моменты, которые не принадлежат ни одному месту. Незнакомое пространство, пустой отрезок времени, чувство, которому нет названия. LIMINAL SPACE — от латинского «limen», порог — это миг перехода, не определённый никаким состоянием. Мы запечатлеваем этот невидимый промежуток в аромате.",
    "m.p1":"Аромат — это не просто приятный запах. Это самое первобытное чувство: оно возвращает воспоминания, хранит эмоции и состояния. Воздух места, где когда-то было спокойно, тепло воспоминаний о близком человеке, чувства, которые всё ещё живут без названия. Нас интересуют время и пространство, созданные ароматом, больше, чем сам аромат.",
    "m.p2":"Здесь вы пробуете более 100 ароматов, чтобы найти свой вкус, вспоминаете прошлое, чтобы назвать то, что чувствуете сейчас, и превращаете ещё безымянное состояние в аромат. Это не просто DIY, где выбирают запах. Вместе с парфюмерным дизайнером вы облекаете ощущения и эмоции в слова, открываете вкус, о котором не знали, и создаёте единственные в своём роде духи — это и есть LIMINAL SPACE.",
    "m.p3":"Такой опыт впервые предлагается во Вьетнаме. Места, где можно понюхать, выбрать и сделать аромат, были и раньше, но не было опыта, который помогает понять, почему вас притягивает аромат и кто вы. Лёгкий и увлекательный день — но в конце вы точно почувствуете, что что-то изменилось. Начав с пустого, неопределённого пространства, вы уйдёте с ароматом, который определили сами.",
    "m.quote":"Пока вы не дали ему определения, это место — ничто. В тот миг, когда вы его определяете, оно становится только вашим.",
    "classes.title":"Классы и программы",
    "apply.note":"Длительность 1–2 часа · Только по предварительной записи.",
    "proc.title":"Как проходит класс",
    "proc.s1.t":"Консультация","proc.s1.d":"На личной консультации с парфюмерным дизайнером мы вместе находим ароматы, которые вам нравятся.",
    "proc.s2.t":"Знакомство с ароматами","proc.s2.d":"Свободно пробуйте более 100 ароматов в нашей комнате ароматов и уточняйте свои предпочтения.",
    "proc.s3.t":"Создание композиции","proc.s3.d":"Из выбранных вами нот мы создаём аромат, который принадлежит только вам, — дизайнер помогает точно попасть в ваш вкус.",
    "proc.s4.t":"Купажирование","proc.s4.d":"За несколько этапов смешивания вы доводите свои духи до совершенства.",
    "proc.s5.t":"Упаковка","proc.s5.d":"Мы бережно упаковываем флакон в фирменную упаковку LIMINAL SPACE.",
    "proc.philosophy":"LIMINAL SPACE — это не DIY, где просто смешивают ароматы. Мы учитываем, как аромат взаимодействует с человеком, характером, погодой и обстоятельствами, чтобы вы создали именно тот аромат, который хотите.",
    "proc.close":"Подарите себе особенное воспоминание в единственном в своём роде пространстве LIMINAL SPACE.",
    "form.name":"Имя","form.phone":"Телефон","form.email":"Email","form.date":"Желаемая дата","form.people":"Количество человек","form.msg":"Сообщение (необязательно)","form.nationality":"Гражданство","form.fb":"Facebook (необязательно)","form.ig":"Instagram (необязательно)",
    "ph.nat":"Поиск или выбор","ph.phone":"Номер телефона","ph.fb":"ID или ссылка","ph.ig":"ID / ник",
    "modal.confirmlabel":"ПРОВЕРКА","modal.confirmq":"Пожалуйста, проверьте данные.","modal.confirmnote":"Пожалуйста, ещё раз проверьте адрес email. Если данные указаны неверно, вы можете не получить подтверждение записи. Проверьте всё перед отправкой.",
    "modal.sub":"Запись на класс · 5 шагов","modal.step1":"ШАГ 1 / 5","modal.q0":"Выберите филиал, который хотите посетить.",
    "modal.step2":"ШАГ 2 / 5","modal.q1":"Какую программу вы выбираете?",
    "modal.err":"Пожалуйста, выберите вариант.","modal.step3":"ШАГ 3 / 5","modal.q2":"Выберите объём духов.",
    "modal.step4":"ШАГ 4 / 5","modal.q3":"Укажите детали визита.","modal.time":"Желаемое время","modal.errdate":"Пожалуйста, укажите дату и время.","modal.pickdate":"Сначала выберите дату",
    "modal.step5":"ШАГ 5 / 5","modal.q4":"Введите свои данные и подтвердите.","modal.errcontact":"Пожалуйста, заполните все поля, кроме сообщения.",
    "modal.donet":"Ваша заявка принята","modal.doned":"После проверки мы подтвердим запись по указанным контактам.","modal.back":"Назад","modal.next":"Далее",
    "loc.title":"Как добраться","loc.addr.t":"Адрес","loc.hours.t":"Часы работы","loc.hours.d":"Вт–Вс 11:00 – 20:00 (Пн — выходной)","loc.contact.t":"Контакты","loc.mapnote":"Карта"
  }
};
// 한국어 기본값을 DOM에서 수집해 저장
document.querySelectorAll('[data-i18n]').forEach(el=>{
  I18N.ko[el.getAttribute('data-i18n')] = el.innerHTML;
});
function i18nGet(lang,k){
  if(I18N[lang] && I18N[lang][k]!==undefined) return I18N[lang][k];
  if(lang==='ru' && I18N.en[k]!==undefined) return I18N.en[k];
  return I18N.ko[k];
}
function setLang(lang){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    const t = i18nGet(lang,k);  // 없으면 한국어 폴백(러시아어는 영어 먼저)
    if(t!==undefined) el.innerHTML = t;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{   // placeholder 다국어
    const k = el.getAttribute('data-i18n-ph');
    const t = i18nGet(lang,k);
    if(t!=null) el.setAttribute('placeholder', t);
  });
  document.querySelectorAll('.lang button').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang===lang);
  });
  document.querySelectorAll('.lang-cur').forEach(el=>{ el.textContent=lang.toUpperCase(); }); // 모바일 드롭다운 토글 라벨 동기화
  // 모달이 열려 있으면 현재 단계를 새 언어로 다시 그림
  if(typeof modal!=='undefined' && modal.classList.contains('open')) renderModal(true);
  if(typeof renderMctaPrice==='function') renderMctaPrice();
  if(typeof renderPageDesc==='function') renderPageDesc();
  if(typeof applyActiveStates==='function') applyActiveStates();  // 카드 준비중 재적용
  if(typeof renderClasses==='function') renderClasses();          // 클래스 카드 언어/데이터 재적용
  if(typeof renderLocation==='function') renderLocation();        // 위치 섹션 언어 재적용
  if(typeof renderMap==='function') renderMap();                  // 지도(언어별 위치 텍스트) 재적용
  if(typeof renderFolderChips==='function') renderFolderChips();  // 폴더 칩 언어 재적용
  if(typeof renderGallery==='function') renderGallery();          // 갤러리 캡션 언어 재적용
  if(typeof renderPartners==='function') renderPartners();
  if(typeof renderSpaceFolderChips==='function') renderSpaceFolderChips(); // 공간 폴더 칩 언어 재적용
  if(typeof initSpaceCarousel==='function') initSpaceCarousel();   // 공간 마퀴 캡션 언어 재적용
  if(typeof renderSpaceGrid==='function') renderSpaceGrid();       // 공간 그리드(space.html) 캡션 언어 재적용
  if(typeof renderSiteInfo==='function') renderSiteInfo();         // 푸터 사업자정보 라벨 언어 재적용
}
document.querySelectorAll('.lang button[data-lang]').forEach(b=>{   // data-lang 있는 실제 언어 버튼만(토글 버튼은 data-lang이 없어서 제외됨)
  b.addEventListener('click',()=>{ setLang(b.dataset.lang); try{ localStorage.setItem('ls_lang',b.dataset.lang); }catch(e){} });   // 선택 언어 기억(다른 페이지로 이동해도 유지)
});
/* 모바일 언어·SNS 드롭다운 토글(개념 유지: 클릭 열기/닫기, 바깥 클릭·다른쪽 열림 시 자동 닫힘) */
(function(){
  var langBox=document.querySelector('header .lang'), langBtn=document.getElementById('langToggle');
  var snsBox=document.getElementById('snsDrop'), snsBtn=document.getElementById('snsToggle');
  function closeAll(){
    if(langBox){ langBox.classList.remove('open'); if(langBtn)langBtn.setAttribute('aria-expanded','false'); }
    if(snsBox){ snsBox.classList.remove('open'); if(snsBtn)snsBtn.setAttribute('aria-expanded','false'); }
  }
  if(langBtn && langBox){
    langBtn.addEventListener('click', function(e){
      e.stopPropagation();
      var willOpen=!langBox.classList.contains('open');
      closeAll(); langBox.classList.toggle('open', willOpen);
      langBtn.setAttribute('aria-expanded', willOpen?'true':'false');
    });
    langBox.querySelectorAll('.lang-menu button[data-lang]').forEach(function(b){
      b.addEventListener('click', function(){ langBox.classList.remove('open'); langBtn.setAttribute('aria-expanded','false'); });
    });
  }
  if(snsBtn && snsBox){
    snsBtn.addEventListener('click', function(e){
      e.stopPropagation();
      var willOpen=!snsBox.classList.contains('open');
      closeAll(); snsBox.classList.toggle('open', willOpen);
      snsBtn.setAttribute('aria-expanded', willOpen?'true':'false');
    });
    snsBox.addEventListener('click', function(e){ if(e.target.closest('#navSocials a')) snsBox.classList.remove('open'); });
  }
  document.addEventListener('click', function(e){
    if(langBox && !langBox.contains(e.target)){ langBox.classList.remove('open'); if(langBtn)langBtn.setAttribute('aria-expanded','false'); }
    if(snsBox && !snsBox.contains(e.target)){ snsBox.classList.remove('open'); if(snsBtn)snsBtn.setAttribute('aria-expanded','false'); }
  });
  window.addEventListener('resize', function(){ if(window.innerWidth>640) closeAll(); });
})();

/* ---------- 푸터 소셜 링크 (지점별 소셜 연동 — 첫 지점 기준) ---------- */
function renderFooterSocial(){
  let brs=(getSettings().branches)||[];
  const el=document.getElementById('socialLinks');if(!el)return;
  const insta=(brs.find(b=>b.instagram)||{}).instagram;
  const fb=(brs.find(b=>b.facebook)||{}).facebook;
  const links=[];
  if(insta)links.push(`<a href="${insta}" target="_blank" rel="noopener">Instagram</a>`);
  if(fb)links.push(`<a href="${fb}" target="_blank" rel="noopener">Facebook</a>`);
  el.innerHTML=links.join('');
}

/* ---------- mobile menu ---------- */
document.getElementById('menuToggle').addEventListener('click',()=>{
  document.getElementById('navLinks').classList.toggle('open');
});
document.querySelectorAll('#navLinks a').forEach(a=>{
  a.addEventListener('click',()=>document.getElementById('navLinks').classList.remove('open'));
});

/* ---------- APPLY MODAL WIZARD ---------- */
const STORE_KEY='liminal_applications';
const SET_KEY='liminal_settings';
const DEFAULT_DAY=[{cls:'',time:'11:00',cap:6},{cls:'',time:'14:00',cap:6},{cls:'',time:'17:00',cap:6}];
/* 다국어 helper */
function curLang(){return document.documentElement.lang||'vi';}
function txObj(v){return (v&&typeof v==='object'&&!Array.isArray(v))?v:(v?{ko:String(v)}:{});}
function Lval(v,lang){lang=lang||curLang();const o=txObj(v);return o[lang]||(lang==='ru'&&o.en)||o.ko||o.en||o.vi||'';}   // 러시아어 값이 없으면 영어 우선
/* 화면 문구 언어 선택: tr({ko,en,vi,ru}) — 해당 언어가 없으면 러시아어는 영어, 나머지는 한국어 */
function tr(o,lang){lang=lang||curLang();return o[lang]!=null?o[lang]:(lang==='ru'&&o.en!=null?o.en:o.ko);}
function keyOf(v){const o=txObj(v);return o.ko||o.en||o.vi||'';}
function tri(ko,en,vi){return {ko:ko||'',en:en||'',vi:vi||''};}
const _wd=tri('100여 종 향 · 나만의 시그니처 완성','Over 100 notes · craft your signature','Hơn 100 loại hương · tạo signature của bạn');
const _di=tri('보틀 + 파우치 포함','Bottle + pouch included','Bao gồm chai + túi');
const INDEX_DEFAULTS={
  branches:[],
  site:{brandName:'LIMINAL SPACE',estYear:'2026',copyrightYear:'2026'},
  branchClasses:[],
  classDetails:[],
  defaultSchedule:{},schedule:{}
};
function getSettings(){const s=(window.LS?LS.getSettings():{})||{};
  // 실제 데이터(Supabase)만 사용. 키가 아예 없을 때만 기본값으로 채움(로컬 폴백).
  return Object.assign({},INDEX_DEFAULTS,s);}
function getApps(){return window.LS?LS.getApps():[];}
const DAYKEYS=['sun','mon','tue','wed','thu','fri','sat'];
function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
/* ---- 지점 기반 데이터 helpers ---- */
function branchClassesOf(branch){return (getSettings().branchClasses||[]).filter(c=>c.branch===branch).sort((a,b)=>(a.order??99)-(b.order??99));}
function programList(branch){const seen={};const out=[];branchClassesOf(branch).forEach(c=>{const k=keyOf(c.name);if(!(k in seen)){seen[k]=1;out.push(c);}});return out;}
function detailsOf(branch,name){return (getSettings().classDetails||[]).filter(d=>d.branch===branch&&d.name===name);}
function volumesForName(branch,name){return detailsOf(branch,name).filter(d=>d.volume!==''&&d.volume!=null);}
function isClassActive(branch,name){const c=branchClassesOf(branch).find(c=>keyOf(c.name)===name);return !c||c.active!==false;}
function priceNum(p){const n=parseInt(String(p||'').replace(/[^0-9]/g,''),10);return isNaN(n)?Infinity:n;}
function fmtMoney(v,sym){v=(v==null?'':String(v)).trim();if(!v)return '';if(/^[0-9,]+$/.test(v))return Number(v.replace(/,/g,'')).toLocaleString('en-US')+sym;return v;}
function priceDisplay(d){if(!d)return '';if(d.priceVND)return fmtMoney(d.priceVND,'₫');if(d.priceKRW)return fmtMoney(d.priceKRW,'₩');if(d.priceUSD)return fmtMoney(d.priceUSD,'$');return '';}
/* 표시 통화(동→원→달러 우선) */
function chosenCurr(d){if(!d)return null;if(d.priceVND)return{raw:d.priceVND,sym:'₫'};if(d.priceKRW)return{raw:d.priceKRW,sym:'₩'};if(d.priceUSD)return{raw:d.priceUSD,sym:'$'};return null;}
/* 할인 계산 → {orig,final,sym,origStr,finalStr,label} (할인 없으면 final=null) */
function discInfo(d){
  const cp=chosenCurr(d); if(!cp)return null;
  const orig=parseInt(String(cp.raw).replace(/[^0-9]/g,''),10); if(isNaN(orig))return null;
  const type=(d.discType||'none'), val=parseFloat(d.discVal);
  let fin=null,label='';
  if(type==='percent'&&val>0){fin=Math.max(0,Math.round(orig*(1-val/100)));label=(val%1===0?val:val)+'%';}
  else if(type==='fixed'&&val>0){fin=Math.max(0,orig-Math.round(val));label='-'+Math.round(val).toLocaleString('en-US')+cp.sym;}
  const origStr=orig.toLocaleString('en-US')+cp.sym;
  if(fin==null||fin>=orig)return {orig,final:null,sym:cp.sym,origStr};
  return {orig,final:fin,sym:cp.sym,origStr,finalStr:fin.toLocaleString('en-US')+cp.sym,label};
}
/* 최저가 비교용 실효가(할인 적용) */
function effPriceNum(d){const di=discInfo(d);if(!di)return priceNum(priceDisplay(d));return di.final!=null?di.final:di.orig;}
/* 가격 HTML (할인 시 정가 취소선 + 할인가 + 배지) */
/* 가격 표시 조각: 현재가(할인 적용) · 정가(할인 시) · 할인 라벨 */
function priceParts(d){const di=discInfo(d);if(!di)return {now:priceDisplay(d),old:'',label:''};if(di.final==null)return {now:di.origStr,old:'',label:''};return {now:di.finalStr,old:di.origStr,label:di.label};}
function minDetail(vols){return vols.reduce((m,t)=>effPriceNum(t)<effPriceNum(m)?t:m);}
function needsSize(){return volumesForName(data.branch,data.class).length>0;}
/* 선택한 용량의 상세(가격) + 결제 예정 금액(실효가 × 인원) */
function selectedDetail(){var vols=volumesForName(data.branch,data.class);if(!vols.length)return null;var sz=String(data.size||'').replace('ml','').trim();return vols.filter(function(d){return String(d.volume)===sz;})[0]||null;}
function expectedAmountStr(){var d=selectedDetail();if(!d)return '';var di=discInfo(d);if(!di)return '';var unit=(di.final!=null?di.final:di.orig);if(!isFinite(unit)||unit<=0)return '';var ppl=parseInt(data.people||'1',10)||1;return (unit*ppl).toLocaleString('en-US')+di.sym;}
function slotsFor(dateStr){
  if(!dateStr||!data.branch) return [];
  const s=getSettings();const sc=(s.schedule||{})[data.branch]||{};
  const slots=(sc[dateStr]||[]).filter(sl=>!sl.cls || sl.cls===data.class);   // 개별 설정일만 오픈
  var seen={};   // 같은 시간·클래스 중복 제거
  return slots.filter(function(sl){var k=(sl.time||'')+'|'+(sl.cls||'');if(seen[k])return false;seen[k]=1;return true;});
}
/* 일시적 조회 실패(재시도까지 실패) 시 안내 — 실제로 등록된 항목이 없는 것과 구분 */
function loadErrorHTML(){
  const lang=curLang();
  const msg=tr({en:'Temporarily unable to load data. Please refresh and try again.',vi:'Tạm thời không tải được dữ liệu. Vui lòng tải lại trang và thử lại.',ru:'Временно не удалось загрузить данные. Обновите страницу и попробуйте снова.',ko:'일시적인 오류로 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'},lang);
  const btn=tr({en:'Refresh',vi:'Tải lại trang',ru:'Обновить',ko:'새로고침'},lang);
  return `<div class="opt-loaderr">${esc(msg)}<button type="button" class="opt-loaderr-btn" onclick="location.reload()">${esc(btn)}</button></div>`;
}
/* 인덱스 카드 비활성 클래스 → "오픈 준비중" (모든 지점에서 비활성일 때) */
function isClassActiveAnywhere(name){const cs=(getSettings().branchClasses||[]).filter(c=>keyOf(c.name)===name);if(!cs.length)return true;return cs.some(c=>c.active!==false);}
function applyActiveStates(){
  document.querySelectorAll('.card-cta[data-class]').forEach(btn=>{
    if(!isClassActiveAnywhere(btn.dataset.class)){btn.dataset.disabled='1';btn.classList.add('soon-btn');btn.textContent='오픈 준비중';}
  });
}
/* 클래스/프로그램 섹션 — 지점별 탭 + 실제 데이터(용량이 있는 클래스는 검정 시그니처 카드, 문의 전용은 메탈 카드) */
let classTabBranch='';
function renderClasses(){
  const wrap=document.querySelector('#classes .class-grid'); if(!wrap)return;
  const tabs=document.getElementById('classTabs');
  const lang=curLang();
  const L=tr({en:{inq:'Inquire for price',cta:'Apply',soon:'Opening soon',none:'No programs registered yet.'},
    vi:{inq:'Liên hệ báo giá',cta:'Đăng ký',soon:'Sắp mở',none:'Chưa có chương trình nào.'},
    ru:{inq:'Цена по запросу',cta:'Записаться',soon:'Скоро открытие',none:'Программы пока не добавлены.'},
    ko:{inq:'가격 문의',cta:'신청하기',soon:'오픈 준비중',none:'등록된 프로그램이 없습니다.'}},lang);
  const branches=(getSettings().branches||[]).filter(b=>b&&b.name);
  if(!branches.length){ if(tabs)tabs.innerHTML=''; wrap.innerHTML=`<div class="class-empty">${L.none}</div>`; return; }
  if(!classTabBranch || !branches.some(b=>b.name===classTabBranch)) classTabBranch=branches[0].name;
  if(tabs){
    tabs.innerHTML=branches.map(b=>`<button type="button" class="branch-tab ${b.name===classTabBranch?'active':''}" data-b="${esc(b.name)}">${esc(branchLabel(b.name))}</button>`).join('');
    tabs.querySelectorAll('.branch-tab').forEach(t=>t.addEventListener('click',()=>{classTabBranch=t.dataset.b;renderClasses();}));
  }
  const branch=classTabBranch;
  const progs=programList(branch);
  if(!progs.length){ wrap.innerHTML=`<div class="class-empty">${L.none}</div>`; return; }
  wrap.innerHTML=progs.map(c=>{
    const key=keyOf(c.name), active=c.active!==false, vols=volumesForName(branch,key);
    const name=esc(Lval(c.name,lang)), desc=esc(Lval(c.desc,lang));
    const open=`data-open-apply data-class="${esc(key)}" data-branch="${esc(branch)}"`;
    if(vols.length && !c.inquiry){
      const cards=vols.map(t=>{const p=priceParts(t), dt=Lval(t.detail,lang);
        return `<div class="vol-card lift-ink"><div class="vol-top"><span>VOLUME</span>${p.label?`<span class="vol-badge">${esc(p.label)}</span>`:''}</div>`
          +`<div class="vol-ml">${esc(t.volume)}ml</div><div class="vol-bottom">${p.old?`<div class="vol-old">${esc(p.old)}</div>`:''}<div class="vol-price">${esc(p.now)}</div>${dt?`<div class="vol-de">${esc(dt)}</div>`:''}</div></div>`;}).join('');
      const btn=active?`<button type="button" class="btn-white lift" ${open}><span>${L.cta}</span><span>→</span></button>`:`<span class="btn-white is-soon">${L.soon}</span>`;
      return `<div class="sig-card"><div class="sig-main"><div class="sig-name">${name}</div>${desc?`<div class="sig-desc">${desc}</div>`:''}${btn}</div><div class="vol-grid">${cards}</div></div>`;
    }
    const inner=`<div><div class="inq-t">${name}</div>${desc?`<div class="inq-d">${desc}</div>`:''}</div><span class="tag">${active?L.inq:L.soon}</span>`;
    return active?`<button type="button" class="inq-card lift" ${open}>${inner}</button>`:`<div class="inq-card is-soon">${inner}</div>`;
  }).join('');
}
/* 사이트 정보(브랜드명·연도)를 히어로 EST·푸터에 반영 */
function renderSiteInfo(){
  var si=(getSettings().site)||{};
  var brand=si.brandName||'LIMINAL SPACE';
  var est=si.estYear||'', copy=si.copyrightYear||'';
  var e=document.getElementById('estYear'); if(e&&est) e.textContent='EST. '+est;
  var fb=document.getElementById('footBrand'); if(fb) fb.textContent=brand;
  var fc=document.getElementById('footCopy'); if(fc) fc.textContent='© '+(copy||est||'')+' '+brand;
  // 푸터 "문의하기" 이메일 — 사업자 정보(관리자 › 지점설정)의 이메일로 실제 반영(미설정 시 기본 문구 유지)
  var bizEmail=(si.bizEmail||'').trim();
  var fe=document.getElementById('footEmail'); if(fe&&bizEmail){ fe.textContent=bizEmail; fe.href='mailto:'+bizEmail; }
  renderFootBiz(si);
}
/* 베트남 전자상거래법 푸터 사업자 정보 + Bộ Công Thương 신고 뱃지 (전 페이지 공통, app.js가 주입) */
function renderFootBiz(si){
  var foot=document.getElementById('contact'); if(!foot)return;
  si=si||{};
  var L=curLang();
  var lab=tr({en:{name:'Company',addr:'Address',tax:'Tax code',tel:'Tel',email:'Email'},
        vi:{name:'Tên',addr:'Địa chỉ',tax:'MST',tel:'ĐT',email:'Email'},
        ru:{name:'Компания',addr:'Адрес',tax:'ИНН',tel:'Тел.',email:'Email'},
        ko:{name:'상호',addr:'주소',tax:'세금코드',tel:'전화',email:'이메일'}},L);
  function pair(k,v){return v?('<span class="fb-i"><b>'+lab[k]+'</b> '+esc(v)+'</span>'):'';}
  var line1=[pair('name',si.bizName),pair('addr',si.bizAddress)].filter(Boolean).join('<span class="fb-sep">·</span>');
  var line2=[pair('tax',si.bizTax),pair('tel',si.bizPhone),pair('email',si.bizEmail)].filter(Boolean).join('<span class="fb-sep">·</span>');
  var badge='';
  if(si.moitUrl){
    var inner=si.moitLogo?('<img src="'+esc(si.moitLogo)+'" alt="Đã thông báo Bộ Công Thương" />')
      :'<span class="fb-badge-txt">Đã thông báo Bộ Công Thương</span>';
    badge='<a class="fb-badge" href="'+esc(si.moitUrl)+'" target="_blank" rel="noopener">'+inner+'</a>';
  }
  var box=document.getElementById('footBiz');
  if(!line1&&!line2&&!badge){ if(box)box.parentNode.removeChild(box); return; }
  if(!box){ box=document.createElement('div'); box.id='footBiz'; box.className='foot-biz'; foot.appendChild(box); }
  box.innerHTML=(line1?'<div class="fb-line">'+line1+'</div>':'')+(line2?'<div class="fb-line">'+line2+'</div>':'')+badge;
}
/* 위치 섹션을 지점설정과 연동 — 지점 카드(BRANCH 0N · 주소 · 영업시간 · 연락처 · 지도 링크) */
function renderLocation(){
  const box=document.getElementById('locInfo'); if(!box)return;
  const brs=(getSettings().branches||[]).filter(b=>b&&b.name); if(!brs.length)return;
  const lang=curLang();
  const L=tr({en:{addr:'Address',hours:'Hours',contact:'Contact',map:'View on map ↗'},vi:{addr:'Địa chỉ',hours:'Giờ mở cửa',contact:'Liên hệ',map:'Xem bản đồ ↗'},
    ru:{addr:'Адрес',hours:'Часы работы',contact:'Контакты',map:'Открыть карту ↗'},ko:{addr:'Address',hours:'Hours',contact:'Contact',map:'지도에서 보기 ↗'}},lang);
  const row=(k,v)=>`<div><div class="loc-k">${k}</div><div class="loc-v">${esc(v)}</div></div>`;
  box.innerHTML=brs.map((b,i)=>{
    const loc=Lval(b.location,lang), hrs=Lval(b.hours,lang);
    return `<div class="loc-card lift"><div class="loc-top"><span class="loc-lbl">BRANCH ${String(i+1).padStart(2,'0')}</span><span class="loc-name">${esc(branchLabel(b.name))}</span></div><div class="loc-hr"></div>`
      +(loc?row(L.addr,loc):'')+(hrs?row(L.hours,hrs):'')+(b.contact?row(L.contact,b.contact):'')
      +(b.link?`<a class="btn-ink-sm" href="${esc(b.link)}" target="_blank" rel="noopener">${L.map}</a>`:'')+`</div>`;
  }).join('');
}
/* 찾아오는 길 지도 — 저장된 위치를 구글맵으로 표시(클릭 시 새 창) */
function renderMap(){
  const el=document.getElementById('mapArea'); if(!el)return;
  const lang=curLang();
  const brs=(getSettings().branches||[]).filter(b=>b&&b.name);
  const b=brs[0];
  const loc=b?Lval(b.location,lang):'';
  if(!loc){ el.innerHTML=`<div class="pin">◎<br><span>${tr({en:'Map area',vi:'Khu vực bản đồ',ru:'Карта',ko:'지도 영역'},lang)}</span></div>`; return; }
  const brand=(getSettings().site&&getSettings().site.brandName)||'LIMINAL SPACE';
  const q=encodeURIComponent(brand+', '+loc);   // 지도 위 핀 이름이 주소 대신 브랜드명으로 표시되도록 검색어 앞에 브랜드명을 붙임
  const embed=`https://www.google.com/maps?q=${q}&z=16&output=embed`;
  // "지도에서 열기"는 위치설정의 "Xem/바로가기"(b.link)와 동일한 곳으로 가야 함 — 주소 텍스트 재검색(부정확할 수 있음) 대신 관리자가 지정한 정확한 링크 우선 사용
  const open=b.link||`https://www.google.com/maps/search/?api=1&query=${q}`;
  const hint=tr({en:'Open in Google Maps ↗',vi:'Mở trong Google Maps ↗',ru:'Открыть в Google Maps ↗',ko:'Google 지도에서 보기 ↗'},lang);
  el.innerHTML=`<a class="map-link" href="${open}" target="_blank" rel="noopener" aria-label="${esc(loc)}">`
    +`<iframe class="map-frame" src="${embed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${esc(loc)}"></iframe>`
    +`<span class="map-cover"></span>`
    +`<span class="map-hint">${hint}</span></a>`;
}
/* 공간 폴더 칩 (갤러리와 동일 구조) */
var spaceFolder='';
function spaceItemsAll(){var it=(getSettings().space||[]).filter(function(g){return g&&g.img;});if(!it.length)it=GALLERY_PLACEHOLDER;return it;}
function spaceCover(fid){var inf=sortGal(spaceItemsAll().filter(function(g){return (g.folder||'')===fid;}));return inf[0]?inf[0].img:'';}
function renderSpaceFolderChips(){
  var box=document.getElementById('spaceFolders'); if(!box)return;
  var lang=curLang();
  var folders=(getSettings().spaceFolders||[]).slice().sort(function(a,b){return (Number(a.order)||999)-(Number(b.order)||999);});
  if(!folders.length){ box.innerHTML=''; box.style.display='none'; spaceFolder=''; return; }
  box.style.display='';
  var allLabel=tr({en:'All',vi:'Tất cả',ru:'Все',ko:'전체'},lang);
  function chip(fid,name,cover){return '<button class="folder-chip '+(spaceFolder===fid?'active':'')+'" data-fid="'+esc(fid)+'"><span class="fc-name">'+esc(name)+'</span></button>';}
  var html=chip('',allLabel,(sortGal(spaceItemsAll())[0]||{}).img||'');   // 전체 = 모든 공간 사진 중 첫 번째(대표 우선)
  folders.forEach(function(f){ html+=chip(f.id,Lval(f.name,lang),spaceCover(f.id)); });
  box.innerHTML=html;
  box.querySelectorAll('.folder-chip').forEach(function(b){b.addEventListener('click',function(){spaceFolder=b.dataset.fid||'';renderSpaceFolderChips();initSpaceCarousel();renderSpaceGrid();});});
}
/* 공간 캐러셀 — 연속 흐름 마퀴(공간 사진) */
/* 미디어(이미지/영상) 공용 — URL 확장자로 영상 판별, view=true면 컨트롤바(라이트박스용) */
function isVideoUrl(u){return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(u||'');}
/* Supabase Storage 사진은 원본(수 MB PNG) 대신 화면 크기에 맞춘 사본(WebP 자동 변환)을 받음 — Storage 이미지 변환(render) 사용.
   원본 파일은 그대로 두고, 변환 실패 시 imgFallback()이 원본으로 다시 불러옴 */
function imgUrl(u,w){ if(!u||!/\/storage\/v1\/object\/public\/[^?#]+\.(png|jpe?g|webp)(\?|#|$)/i.test(u)) return u;
  return u.split('?')[0].replace('/storage/v1/object/public/','/storage/v1/render/image/public/')+'?width='+w+'&height='+w+'&resize=contain&quality=75'; }   // 가로·세로 모두 w 안에 비율 유지(width만 주면 원본 높이로 잘림)
function imgFallback(el){ var o=el.getAttribute('data-orig'); if(o&&el.getAttribute('src')!==o) el.src=o; }
function imgTag(url,w,alt,extra){ return '<img src="'+esc(imgUrl(url,w))+'" data-orig="'+esc(url)+'" onerror="imgFallback(this)" alt="'+esc(alt)+'"'+(extra||'')+'>'; }
function mediaHTML(url,alt,view){
  var u=esc(url||'');
  if(isVideoUrl(url)){
    return view ? '<video src="'+u+'" controls playsinline preload="metadata"></video>'
                : '<video src="'+u+'" muted loop playsinline preload="metadata" tabindex="0"></video>';   // 카드: 음소거·호버 시 재생
  }
  return imgTag(url,800,alt||'LIMINAL SPACE',' loading="lazy" decoding="async"');
}
/* 히어로 로고 — 어드민에서 이미지 설정 시 텍스트 대신 이미지(좌측정렬 유지) */
function renderHero(){
  var h1=document.querySelector('.hero h1'); if(!h1)return;
  var url=(getSettings().site&&getSettings().site.heroLogo)||'';
  var coord=document.querySelector('.hero-coord');
  if(!url){ if(coord)coord.style.display=''; fitHeroCoord(); return; }   // 미설정 시 텍스트 워드마크+좌표 유지
  h1.innerHTML='<img class="hero-logo" src="'+esc(url)+'" alt="LIMINAL SPACE">';
  h1.classList.add('has-logo');
  if(coord)coord.style.display='none';   // 로고 이미지에 좌표가 포함되므로 텍스트 좌표 숨김
}
/* 좌표를 'LIMINAL SPACE' 폭에 꽉 차게 글자마다 동일 간격으로 분배(flex space-between) */
function fitHeroCoord(){
  var c=document.querySelector('.hero-coord');
  if(!c||c.style.display==='none'||c.getAttribute('data-spread'))return;
  var t=c.textContent;
  c.innerHTML=t.split('').map(function(ch){return ch===' '?'<span>&nbsp;</span>':'<span>'+esc(ch)+'</span>';}).join('');
  c.setAttribute('data-spread','1');
}
window.addEventListener('resize',function(){ if(typeof fitHeroCoord==='function') fitHeroCoord(); });
window.addEventListener('load',function(){ if(typeof fitHeroCoord==='function') fitHeroCoord(); });
try{ if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){ if(typeof fitHeroCoord==='function') fitHeroCoord(); }); }catch(e){}
/* 컨셉 섹션 미디어 — 어드민에서 설정한 이미지/영상으로 교체(없으면 기존 기본 이미지 유지) */
function renderConcept(){
  var fig=document.querySelector('.concept-figure'); if(!fig)return;
  var st=getSettings().site||{};
  var list=((st.conceptList&&st.conceptList.length)?st.conceptList:(st.conceptMedia?[st.conceptMedia]:[])).filter(Boolean).slice(0,5);
  if(!list.length) return;   // 미설정 시 HTML의 기본 이미지(assets/concept.jpg) 유지
  if(fig._seq){ clearTimeout(fig._seq.t); fig._seq=null; }   // 이전 시퀀스 정리
  if(list.length===1){
    var url=list[0];
    if(isVideoUrl(url)){ var auto=!!st.conceptAutoplay; fig.innerHTML='<video src="'+esc(url)+'" '+(auto?'autoplay ':'')+'muted loop playsinline preload="metadata" tabindex="0" data-hover="'+(auto?'pause':'play')+'"></video>'; }
    else fig.innerHTML=imgTag(url,1400,'LIMINAL SPACE — Eau de Parfum',' loading="lazy"');
    return;
  }
  // 다중(2~5개): 전부 미리 겹쳐 로드해 두고, 다음 미디어가 실제 재생되기 시작하면 위로 크로스페이드
  //  → 이전 것이 아래에 계속 보이므로 회색 로딩 화면이 없음. 박스 크기는 첫 미디어가 정함(전환 시 높이 변화 없음)
  var FADE=600, IMG_MS=5000, seq={t:0}; fig._seq=seq;
  function tag(u){ return isVideoUrl(u) ? '<video src="'+esc(u)+'" muted playsinline preload="auto" tabindex="0" data-hover="pause"></video>' : imgTag(u,1400,'LIMINAL SPACE — Eau de Parfum',' decoding="async"'); }
  fig.innerHTML='<div class="concept-seq">'+list.map(tag).join('')+'</div>';
  var els=[].slice.call(fig.querySelectorAll('.concept-seq > *')), cur=-1, z=1;
  function next(){ show((cur+1)%els.length); }
  function show(i){
    var el=els[i], prev=els[cur];
    function reveal(){
      if(el.tagName!=='VIDEO') seq.t=setTimeout(next,IMG_MS);   // 이미지: IMG_MS 후 다음
      el.style.zIndex=++z; el.classList.add('on'); cur=i;
      setTimeout(function(){ if(prev&&prev!==el){ prev.classList.remove('on'); if(prev.pause)prev.pause(); } },FADE);   // 다 덮인 뒤 이전 것 정리
    }
    if(el.tagName==='VIDEO'){
      el.muted=true; el.currentTime=0; el._next=false;
      el.addEventListener('playing',reveal,{once:true});
      try{ var p=el.play(); if(p&&p.catch)p.catch(function(){}); }catch(e){}
    } else if(el.complete) reveal(); else el.addEventListener('load',reveal,{once:true});
  }
  els.forEach(function(el){ if(el.tagName==='VIDEO') el.addEventListener('timeupdate',function(){   // 끝나기 직전에 다음 것 재생 시작
    if(el===els[cur] && !el._next && el.duration && el.duration-el.currentTime<FADE/1000+0.3){ el._next=true; next(); } }); });
  show(0);
}
/* 홈 06 SPACE — 공간 사진 가로 스크롤(라운드 3:4), 폴더 필터 + 대표/순서 정렬 */
function initSpaceCarousel(){
  const track=document.getElementById('spaceTrack'); if(!track)return;
  const sec=document.getElementById('space');
  let items=spaceItemsAll();
  if(spaceFolder) items=items.filter(function(g){return (g.folder||'')===spaceFolder;});
  items=sortGal(items);
  if(!items.length){ if(sec)sec.style.display='none'; return; }
  if(sec)sec.style.display='';
  const lang=curLang();
  track.innerHTML=items.map(g=>{
    const t=Lval(g.title,lang), d=Lval(g.desc,lang);
    return `<div class="mcard"><div class="mc-img">${mediaHTML(g.img,t||d||'LIMINAL SPACE')}</div>`
      +((t||d)?`<div class="mc-cap">${t?`<div class="mc-t">${esc(t)}</div>`:''}${d?`<div class="mc-d">${esc(d)}</div>`:''}</div>`:'')+`</div>`;
  }).join('');
}
/* 갤러리 · 협업 로고 (어드민 관리; 비어있으면 예시 플레이스홀더 표시) */
var GALLERY_PLACEHOLDER=(function(){var a=[];var d=tri(
  '리미널 스페이스에서 진행된 향수 워크숍의 한 장면입니다. 공간과 향이 어우러진 순간을 기록합니다. (임시 설명 — 실제 내용으로 교체 예정)',
  'A moment from a perfume workshop at LIMINAL SPACE, where space and scent meet. (Placeholder text — to be replaced.)',
  'Một khoảnh khắc trong workshop nước hoa tại LIMINAL SPACE, nơi không gian và hương gặp nhau. (Văn bản tạm thời — sẽ thay thế.)');
  for(var i=1;i<=20;i++){a.push({img:'assets/gallery-'+i+'.jpg',title:tri('',''),desc:d});}return a;})();
/* 공간 페이지(space.html): 사진 그리드 + 사진별 번호·설명(관리자 › 공간 사진의 제목/설명, 비어 있으면 사진만). 설명은 alt에도 넣음 */
function renderSpaceGrid(){
  var grid=document.getElementById('spaceGrid'); if(!grid)return;
  var lang=curLang();
  var items=spaceItemsAll();
  if(spaceFolder) items=items.filter(function(g){return (g.folder||'')===spaceFolder;});
  items=sortGal(items);
  grid.innerHTML=items.map(function(g,i){
    var t=Lval(g.title,lang).trim(), d=Lval(g.desc,lang).trim(), cap=[t,d].filter(Boolean).join(' — ');
    var media=mediaHTML(g.img,cap||'LIMINAL SPACE');
    var box=g.link?'<a class="gitem" href="'+esc(g.link)+'" target="_blank" rel="noopener">'+media+'</a>':'<div class="gitem" data-cap="'+esc(cap)+'">'+media+'</div>';
    var fc=cap?'<figcaption class="space-cap"><span class="n">'+String(i+1).padStart(2,'0')+'</span><span class="t">'+(t?'<b>'+esc(t)+'</b>'+(d?' ':''):'')+esc(d)+'</span></figcaption>':'';
    return '<figure class="space-fig">'+box+fc+'</figure>';
  }).join('');
}
/* 서브페이지 상단 '페이지 설명' — 값이 있을 때만 표시(비어 있으면 영역 전체 숨김), 줄바꿈은 문단으로 */
function renderPageDesc(){
  var box=document.getElementById('pageDesc'); if(!box)return;
  var pd=(getSettings().pageDesc||{})[box.dataset.page];
  var txt=(pd?Lval(pd):'').trim();
  if(!txt){ box.hidden=true; box.innerHTML=''; return; }
  box.innerHTML='<span class="sec-label">ABOUT THIS '+esc(box.dataset.en)+'</span><div class="page-desc-body">'+txt.split(/\n+/).map(function(p){return '<p>'+esc(p)+'</p>';}).join('')+'</div>';
  box.hidden=false;
}
var galleryFolder='';   // 활성 폴더 id ('' = 전체)
function sortGal(arr){return arr.slice().sort(function(a,b){var fa=a.featured?0:1,fb=b.featured?0:1;if(fa!==fb)return fa-fb;return (Number(a.order)||999)-(Number(b.order)||999);});}
function galItems(){var it=(getSettings().gallery||[]).filter(function(g){return g&&g.img;});if(!it.length)it=GALLERY_PLACEHOLDER;return it;}
function folderCover(fid){var inf=sortGal(galItems().filter(function(g){return (g.folder||'')===fid;}));return inf[0]?inf[0].img:'';}
function renderFolderChips(){
  var box=document.getElementById('galleryFolders'); if(!box)return;
  var lang=curLang();
  var folders=(getSettings().galleryFolders||[]).slice().sort(function(a,b){return (Number(a.order)||999)-(Number(b.order)||999);});
  if(!folders.length){ box.innerHTML=''; box.style.display='none'; galleryFolder=''; return; }
  if(!galleryFolder || !folders.some(function(f){return f.id===galleryFolder;})) galleryFolder=folders[0].id;   // '전체' 제거 → 첫 폴더 기본 선택
  box.style.display='';
  function chip(fid,name,cover){return '<button class="folder-chip '+(galleryFolder===fid?'active':'')+'" data-fid="'+esc(fid)+'"><span class="fc-name">'+esc(name)+'</span></button>';}
  var html='';
  folders.forEach(function(f){ html+=chip(f.id,Lval(f.name,lang),folderCover(f.id)); });
  box.innerHTML=html;
  box.querySelectorAll('.folder-chip').forEach(function(b){b.addEventListener('click',function(){galleryFolder=b.dataset.fid||'';renderFolderChips();renderGallery();});});
}
function renderGallery(){
  const grid=document.getElementById('galleryGrid'); if(!grid)return;
  const lang=curLang();
  let items=galItems();
  if(galleryFolder) items=items.filter(function(g){return (g.folder||'')===galleryFolder;});
  items=sortGal(items);
  if(!grid.hasAttribute('data-full')) items=items.slice(0,8);   // 홈은 8개, 갤러리 페이지(data-full)는 전체
  grid.innerHTML=items.map(g=>{
    const t=esc(Lval(g.title,lang)), d=esc(Lval(g.desc,lang));
    const inner=`${mediaHTML(g.img,(t||'LIMINAL SPACE'))}${(t||d)?`<div class="cap">${t?`<div class="gcap-t">${t}</div>`:''}${d?`<div class="gcap-d">${d}</div>`:''}</div>`:''}`;
    return g.link?`<a class="gitem" href="${esc(g.link)}" target="_blank" rel="noopener">${inner}</a>`:`<div class="gitem">${inner}</div>`;
  }).join('');
}
/* 히어로 하단 협력업체 로고 띠 — 관리자 '협업 로고' 이미지가 1개 이상일 때만 표시(0개면 띠 전체 숨김, 텍스트 대체 없음) */
function renderPartners(){
  const box=document.getElementById('partners'); if(!box)return;
  const logos=(getSettings().partners||[]).filter(p=>p&&p.logo);
  if(!logos.length){ box.hidden=true; box.innerHTML=''; return; }
  let base=[]; while(base.length<12) base=base.concat(logos);   // 로고가 적어도 한 줄을 채울 때까지 반복 → 두 벌 이어 붙여 끊김 없이 흐름
  box.innerHTML='<div class="partners-track">'+base.concat(base).map((p,i)=>`<div class="partners-item">${imgTag(p.logo,320,i<logos.length?(p.name||''):'',' loading="lazy"')}</div>`).join('')+'</div>';
  box.hidden=false;
}
/* 모바일 하단 CTA 금액: 신청 가능한 클래스 용량 중 최저가 + '~' */
function renderMctaPrice(){
  const el=document.getElementById('mctaPrice'); if(!el)return;
  const ds=(getSettings().classDetails||[]).filter(d=>d.volume!==''&&d.volume!=null&&isClassActive(d.branch,d.name)&&!((branchClassesOf(d.branch).find(c=>keyOf(c.name)===d.name)||{}).inquiry));
  el.textContent=ds.length?priceParts(minDetail(ds)).now+'~':'';
}
function bookedOn(dateStr,time){
  return getApps().filter(a=>a.date===dateStr && a.time===time && a.status!=='cancel')
    .reduce((s,a)=>s+(parseInt(a.people)||1),0);
}
/* 날짜 상태: none(미등록) / closed(휴무지정) / open(시간대 있음) */
function dayState(dateStr){if(!dateStr||!data.branch)return 'none';const sc=(getSettings().schedule||{})[data.branch]||{};if(sc[dateStr]===undefined)return 'none';return (sc[dateStr]||[]).length?'open':'closed';}
function dayMsg(dateStr){const lang=curLang();const st=dayState(dateStr);
  if(st==='none')return tr({en:'No classes are registered. Please contact the administrator.',vi:'Chưa có lớp nào được đăng ký. Vui lòng liên hệ quản trị viên.',ru:'На этот день нет занятий. Пожалуйста, свяжитесь с нами.',ko:'등록된 클래스가 없습니다. 관리자에게 문의하세요.'},lang);
  return tr({en:'Closed on this day.',vi:'Ngày này nghỉ.',ru:'В этот день выходной.',ko:'휴무일입니다.'},lang);}
/* 베트남 시간(UTC+7) 기준 */
function vnNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh'}));}
function vnToday(){const d=vnNow();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function vnHM(){const d=vnNow();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
// 예약 가능 상한(오늘부터 N일, config.js) — store.js가 공개 조회 시 스케줄을 같은 기간만 불러오므로 반드시 맞춰야 함
function vnMaxDate(){const d=vnNow();d.setDate(d.getDate()+(window.RESERVATION_WINDOW_DAYS||90));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function isPastSlot(dateStr,time){if(!dateStr)return false;if(dateStr<vnToday())return true;if(dateStr===vnToday()&&time&&time<=vnHM())return true;return false;}
/* ===== 클래스 신청 팝업 ===== */
const modal=document.getElementById('applyModal');
const amBody=document.getElementById('amBody'), amRail=document.getElementById('amRail');
const btnBack=document.getElementById('btnBack');
const btnNext=document.getElementById('btnNext');
const TOTAL=5; // 입력 단계 수 (6=확인, 7=완료)
let cur=1;
let editing=null, returnTo=null, snap=null, editFrom='', sumOpen=false, calMonth='', submitErr='';   // 변경 흐름 · 요약 펼침 · 캘린더 표시 월 · 저장 실패 메시지
const data={branch:'',class:'',size:'',date:'',time:'',people:'1',name:'',phone:'',dialcode:'',email:'',nationality:'',facebook:'',instagram:'',msg:''};
const mqMob=window.matchMedia('(max-width:640px)');
/* 국가 목록: 코드+국가번호+언어별 라벨. 표시는 현재 언어, 저장은 영문 표준값(co.en)으로 통일 */
const COUNTRY_LIST=[
 {c:'VN',d:'+84',ko:'베트남',en:'Vietnam',vi:'Việt Nam'},
 {c:'KR',d:'+82',ko:'대한민국',en:'Korea',vi:'Hàn Quốc'},
 {c:'JP',d:'+81',ko:'일본',en:'Japan',vi:'Nhật Bản'},
 {c:'CN',d:'+86',ko:'중국',en:'China',vi:'Trung Quốc'},
 {c:'TW',d:'+886',ko:'대만',en:'Taiwan',vi:'Đài Loan'},
 {c:'HK',d:'+852',ko:'홍콩',en:'Hong Kong',vi:'Hồng Kông'},
 {c:'SG',d:'+65',ko:'싱가포르',en:'Singapore',vi:'Singapore'},
 {c:'MY',d:'+60',ko:'말레이시아',en:'Malaysia',vi:'Malaysia'},
 {c:'TH',d:'+66',ko:'태국',en:'Thailand',vi:'Thái Lan'},
 {c:'ID',d:'+62',ko:'인도네시아',en:'Indonesia',vi:'Indonesia'},
 {c:'PH',d:'+63',ko:'필리핀',en:'Philippines',vi:'Philippines'},
 {c:'IN',d:'+91',ko:'인도',en:'India',vi:'Ấn Độ'},
 {c:'US',d:'+1',ko:'미국',en:'USA',vi:'Mỹ'},
 {c:'CA',d:'+1',ko:'캐나다',en:'Canada',vi:'Canada'},
 {c:'GB',d:'+44',ko:'영국',en:'UK',vi:'Anh'},
 {c:'FR',d:'+33',ko:'프랑스',en:'France',vi:'Pháp'},
 {c:'DE',d:'+49',ko:'독일',en:'Germany',vi:'Đức'},
 {c:'IT',d:'+39',ko:'이탈리아',en:'Italy',vi:'Ý'},
 {c:'ES',d:'+34',ko:'스페인',en:'Spain',vi:'Tây Ban Nha'},
 {c:'NL',d:'+31',ko:'네덜란드',en:'Netherlands',vi:'Hà Lan'},
 {c:'CH',d:'+41',ko:'스위스',en:'Switzerland',vi:'Thụy Sĩ'},
 {c:'SE',d:'+46',ko:'스웨덴',en:'Sweden',vi:'Thụy Điển'},
 {c:'RU',d:'+7',ko:'러시아',en:'Russia',vi:'Nga'},
 {c:'AU',d:'+61',ko:'호주',en:'Australia',vi:'Úc'},
 {c:'NZ',d:'+64',ko:'뉴질랜드',en:'New Zealand',vi:'New Zealand'},
 {c:'BR',d:'+55',ko:'브라질',en:'Brazil',vi:'Brazil'},
 {c:'MX',d:'+52',ko:'멕시코',en:'Mexico',vi:'Mexico'},
 {c:'AE',d:'+971',ko:'아랍에미리트',en:'UAE',vi:'UAE'},
 {c:'SA',d:'+966',ko:'사우디아라비아',en:'Saudi Arabia',vi:'Ả Rập Xê Út'},
 {c:'TR',d:'+90',ko:'튀르키예',en:'Türkiye',vi:'Thổ Nhĩ Kỳ'},
 {c:'OTHER',d:'',ko:'기타',en:'Other',vi:'Khác'}
];
function natLabel(co,lang){lang=lang||curLang();var base=co[lang]||co.en;return base===co.en?co.en:(base+' ('+co.en+')');}
function findCountry(v){v=String(v||'').trim().toLowerCase();if(!v)return null;
  return COUNTRY_LIST.find(function(co){
    if(v===co.en.toLowerCase()||v===co.ko.toLowerCase()||v===co.vi.toLowerCase()||v===co.c.toLowerCase())return true;
    return ['ko','en','vi'].some(function(l){return v===natLabel(co,l).toLowerCase();});
  })||null;
}
/* 저장/표시 표준화: 어떤 언어로 입력해도 영문 국가명 + 국가번호로 통일 */
function normNat(v){var co=findCountry(v);return co?co.en:String(v||'').trim();}   // 영문 표준명
function codeOf(v){var co=findCountry(v);return co?co.c:'';}                          // 국가 코드(VN 등)
function dialOf(v){var co=findCountry(v);return co?co.d:'';}                          // 국가번호(+84 등)
function natName(v,lang){var co=findCountry(v);return co?(co[lang||curLang()]||co.en):String(v||'');}  // 표시용 국가명(현재 언어)
/* 국적 드롭다운 옵션 — 값은 국가 코드, 표시는 현재 언어 국가명 */
function natOptionsHTML(){
  var lang=curLang(), ph=tr({en:'Select nationality',vi:'Chọn quốc tịch',ru:'Выберите гражданство',ko:'국적 선택'},lang), code=codeOf(data.nationality);
  return '<option value="">'+esc(ph)+'</option>'+COUNTRY_LIST.map(function(co){return '<option value="'+co.c+'"'+(co.c===code?' selected':'')+'>'+esc(natLabel(co,lang))+'</option>';}).join('');
}
/* 이메일 도메인 빠른선택: 입력칸 옆 드롭다운(기본 '직접 입력' → 고르면 @도메인 자동완성) */
var EMAIL_DOMAINS=['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','naver.com','daum.net','hanmail.net','kakao.com'];
function emailDomainOptions(){
  var manual=tr({en:'Enter manually',vi:'Nhập thủ công',ru:'Ввести вручную',ko:'직접 입력'});
  return '<option value="">'+esc(manual)+'</option>'+EMAIL_DOMAINS.map(function(d){return '<option value="'+d+'">@'+d+'</option>';}).join('');
}

function classObjOf(){return branchClassesOf(data.branch).find(c=>keyOf(c.name)===data.class);}
function isInquiry(){const c=classObjOf();return !!(c&&c.inquiry);}
function inquiryTemplate(){
  return tr({en:'[Inquiry]\n- Group size: \n- Preferred date/time: \n- Details: \n',
    vi:'[Liên hệ]\n- Số người: \n- Ngày/giờ mong muốn: \n- Nội dung: \n',
    ru:'[Запрос]\n- Количество человек: \n- Желаемая дата/время: \n- Подробности: \n',
    ko:'[문의 내용]\n- 희망 인원: \n- 희망 일정/시간: \n- 문의 사항: \n'});
}
/* ---- 팝업 문구(4개 언어) — 기존 modal.* 문구는 그대로 옮기고, 새 UI 문구만 추가 ---- */
const AM={
  sub:{ko:'클래스 신청',en:'Class booking',vi:'Đăng ký lớp học',ru:'Запись на класс'},
  step:[null,
    {ko:'지점',en:'Branch',vi:'Chi nhánh',ru:'Филиал'},
    {ko:'프로그램',en:'Program',vi:'Chương trình',ru:'Программа'},
    {ko:'용량',en:'Volume',vi:'Dung tích',ru:'Объём'},
    {ko:'방문 정보',en:'Visit',vi:'Thông tin ghé thăm',ru:'Визит'},
    {ko:'신청자 정보',en:'Your details',vi:'Thông tin của bạn',ru:'Ваши данные'}],
  q:[null,
    {ko:'방문할 지점을 선택해 주세요.',en:'Please choose a branch to visit.',vi:'Vui lòng chọn chi nhánh bạn muốn đến.',ru:'Выберите филиал, который хотите посетить.'},
    {ko:'어떤 프로그램을 신청할까요?',en:'Which program would you like?',vi:'Bạn muốn đăng ký chương trình nào?',ru:'Какую программу вы выбираете?'},
    {ko:'완성할 향수 용량을 골라주세요.',en:'Choose your perfume volume.',vi:'Chọn dung tích nước hoa hoàn thiện.',ru:'Выберите объём духов.'},
    {ko:'방문 정보를 알려주세요.',en:'Tell us your visit details.',vi:'Cho chúng tôi biết thông tin ghé thăm.',ru:'Укажите детали визита.'},
    {ko:'신청자 정보를 입력하고 확인해 주세요.',en:'Enter your details and confirm.',vi:'Nhập thông tin và xác nhận.',ru:'Введите свои данные и подтвердите.'}],
  edit:{ko:'변경',en:'Edit',vi:'Sửa',ru:'Изменить'},
  fold:{ko:'접기',en:'Collapse',vi:'Thu gọn',ru:'Свернуть'},
  typing:{ko:'입력 중',en:'In progress',vi:'Đang nhập',ru:'Заполняется'},
  kept:{ko:'유지됨',en:'Kept',vi:'Giữ nguyên',ru:'Без изменений'},
  editing:{ko:'변경 중',en:'Editing',vi:'Đang sửa',ru:'Изменение'},
  current:{ko:'현재',en:'current',vi:'hiện tại',ru:'текущий'},
  curSel:{ko:'현재 선택',en:'CURRENT',vi:'ĐANG CHỌN',ru:'ТЕКУЩИЙ'},
  cancel:{ko:'취소',en:'Cancel',vi:'Hủy',ru:'Отмена'},
  saveback:{ko:'저장하고 돌아가기',en:'Save & return',vi:'Lưu và quay lại',ru:'Сохранить и вернуться'},
  editdesc:{ko:'저장하면 진행 중이던 단계로 바로 돌아갑니다.',en:'Saving takes you straight back to where you left off.',vi:'Lưu xong sẽ quay lại ngay bước bạn đang làm.',ru:'После сохранения вы сразу вернётесь к текущему шагу.'},
  back:{ko:'이전',en:'Back',vi:'Quay lại',ru:'Назад'},
  next:{ko:'다음',en:'Next',vi:'Tiếp theo',ru:'Далее'},
  finish:{ko:'신청완료',en:'Confirm & apply',vi:'Hoàn tất đăng ký',ru:'Подтвердить запись'},
  ok:{ko:'확인',en:'Close',vi:'Đóng',ru:'Закрыть'},
  inqtag:{ko:'가격 문의',en:'Inquire for price',vi:'Liên hệ báo giá',ru:'Цена по запросу'},
  inqnote:{ko:'가격 문의 프로그램은 용량 선택 없이 문의로 접수됩니다.',en:'Price-on-inquiry programs are sent as an inquiry, without choosing a volume.',vi:'Chương trình liên hệ báo giá được gửi dưới dạng yêu cầu, không cần chọn dung tích.',ru:'Программы с ценой по запросу отправляются как запрос, без выбора объёма.'},
  soon:{ko:' · 오픈 준비중',en:' · Opening soon',vi:' · Sắp mở',ru:' · Скоро открытие'},
  map:{ko:'지도',en:'Map',vi:'Bản đồ',ru:'Карта'},
  mapview:{ko:'지도에서 보기',en:'View on map',vi:'Xem bản đồ',ru:'Открыть карту'},
  pickdate:{ko:'날짜를 먼저 선택',en:'Select a date first',vi:'Chọn ngày trước',ru:'Сначала выберите дату'},
  people:{ko:'인원',en:'People',vi:'Số người',ru:'Гости'},
  low:{ko:'잔여 적음',en:'Few left',vi:'Còn ít chỗ',ru:'Мало мест'},
  closed:{ko:'휴무',en:'Closed',vi:'Nghỉ',ru:'Выходной'},
  full:{ko:'마감',en:'Full',vi:'Hết chỗ',ru:'Мест нет'},
  passed:{ko:'지난 시간',en:'Passed',vi:'Đã qua',ru:'Прошло'},
  amount:{ko:'결제 예정 금액',en:'Estimated payment',vi:'Số tiền dự kiến',ru:'Ориентировочная сумма'},
  perOne:{ko:'1인 기준',en:'per person',vi:'mỗi người',ru:'за 1 человека'},
  booking:{ko:'예약 정보',en:'Booking',vi:'Thông tin đặt lịch',ru:'Запись'},
  date:{ko:'날짜',en:'date',vi:'ngày',ru:'дата'},
  time:{ko:'시간',en:'time',vi:'giờ',ru:'время'},
  keptMsg:{ko:'나머지 선택은 그대로 유지됩니다.',en:'Your other choices are kept.',vi:'Các lựa chọn khác được giữ nguyên.',ru:'Остальные данные сохранены.'},
  resetMsg:{ko:'다시 선택해 주세요: ',en:'Please choose again: ',vi:'Vui lòng chọn lại: ',ru:'Выберите заново: '}
};
const ERR={sel:{ko:'항목을 선택해 주세요.',en:'Please select an option.',vi:'Vui lòng chọn một mục.',ru:'Пожалуйста, выберите вариант.'},
  visit:{ko:'날짜와 시간을 입력해 주세요.',en:'Please enter date and time.',vi:'Vui lòng nhập ngày và giờ.',ru:'Пожалуйста, укажите дату и время.'},
  contact:{ko:'이름·국적·연락처·이메일을 입력해 주세요.',en:'Please fill in all fields except the message.',vi:'Vui lòng điền tất cả mục trừ lời nhắn.',ru:'Пожалуйста, заполните все поля, кроме сообщения.'}};
function remainChip(n){return tr({ko:'잔여 '+n,en:n+' left',vi:'Còn '+n,ru:'Осталось '+n});}
function remainPpl(n){return tr({ko:'잔여 '+n+'명',en:n+' spots left',vi:'Còn '+n+' chỗ',ru:'Осталось мест: '+n});}
function pplStr(n){n=Math.max(1,parseInt(n)||1);return tr({ko:n+'인',en:n+(n>1?' people':' person'),vi:n+' người',ru:n+' чел.'});}
function fromStr(v){return tr({ko:v+'부터',en:'from '+v,vi:'từ '+v,ru:'от '+v});}
function errHTML(name,msg){return '<div class="err" data-err="'+name+'">'+(msg?esc(tr(msg)):'')+'</div>';}
/* ---- 날짜 표기 ---- */
const WD={ko:['일','월','화','수','목','금','토'],en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],vi:['CN','T2','T3','T4','T5','T6','T7'],ru:['Вс','Пн','Вт','Ср','Чт','Пт','Сб']};
function ymdParts(ds){const p=ds.split('-');return [+p[0],+p[1],+p[2]];}
function wdName(ds){const p=ymdParts(ds);return (WD[curLang()]||WD.ko)[new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()];}
function fmtDay(ds){if(!ds)return '';const p=ymdParts(ds);return p[1]+'.'+p[2]+' '+wdName(ds);}
function fmtDate(ds){if(!ds)return '-';return ds.replace(/-/g,'.')+' ('+wdName(ds)+')';}
function fmtDayLong(ds){const p=ymdParts(ds),loc={ko:'ko-KR',en:'en-US',vi:'vi-VN',ru:'ru-RU'}[curLang()]||'ko-KR';let w;try{w=new Intl.DateTimeFormat(loc,{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(p[0],p[1]-1,p[2])));}catch(e){w=wdName(ds);}return p[1]+'.'+p[2]+' '+w;}
function monthLabel(y,m){const l=curLang();if(l==='ko')return y+'년 '+m+'월';if(l==='vi')return 'Tháng '+m+', '+y;
  try{const s=new Intl.DateTimeFormat(l==='ru'?'ru-RU':'en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1)));return s.charAt(0).toUpperCase()+s.slice(1);}catch(e){return y+'.'+m;}}
function addDays(ds,n){const p=ymdParts(ds),d=new Date(Date.UTC(p[0],p[1]-1,p[2]+n));return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
function addMonths(ym,n){const p=ym.split('-'),d=new Date(Date.UTC(+p[0],+p[1]-1+n,1));return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');}
/* ---- 예약 가능 상태 (기존 slotsFor·bookedOn·isPastSlot·90일 제한 그대로 사용) ---- */
/* 날짜: off(지난·범위 밖·휴무·미등록) / full(남은 시간 모두 마감) / open(+low: 가장 많이 남은 시간도 3명 이하) */
function dayInfo(ds){
  if(ds<vnToday()) return {st:'off'};
  if(isInquiry()) return {st:'open'};            // 문의 전용: 스케줄과 무관하게 오늘 이후 선택 가능(기존과 동일, 90일 제한 없음)
  if(ds>vnMaxDate()) return {st:'off'};
  const slots=slotsFor(ds).filter(s=>!isPastSlot(ds,s.time));
  if(!slots.length) return {st:'off'};
  let best=0; slots.forEach(s=>{best=Math.max(best,s.cap-bookedOn(ds,s.time));});
  return best<=0?{st:'full'}:{st:'open',low:best<=3};
}
function slotRemain(){if(!data.date||!data.time)return null;const s=slotsFor(data.date).find(x=>x.time===data.time);return s?s.cap-bookedOn(data.date,data.time):null;}
function firstOpenTime(ds){return slotsFor(ds).filter(x=>!isPastSlot(ds,x.time)&&x.cap-bookedOn(ds,x.time)>0).map(x=>x.time).sort()[0]||'';}
function clampPeople(){const r=slotRemain();let p=Math.max(1,parseInt(data.people)||1);if(r!=null&&r>0&&p>r)p=r;data.people=String(p);}
function selUnitStr(){const d=selectedDetail();return d?priceParts(d).now:'';}
/* 열 때마다 기본값으로 리셋(캐시 잔존 방지): 첫 지점·첫 클래스·30ml·가장 빠른 예약 가능일·가장 빠른 시간·1명·신청자 공란 */
function resetApplyData(preClass,preBranch){
  var brs=(getSettings().branches||[]).filter(function(b){return b&&b.name;});
  data.branch=(preBranch&&brs.some(function(b){return b.name===preBranch;}))?preBranch:(brs.length?brs[0].name:'');
  var progs=programList(data.branch);
  data.class=preClass||(progs.length?keyOf(progs[0].name):'');
  defaultSize();
  data.people='1';
  data.name='';data.phone='';data.dialcode='';data.email='';data.nationality='';data.facebook='';data.instagram='';data.msg='';
  data.date=vnToday(); data.time='';
  if(!isInquiry()){
    var d=vnToday(); while(d<=vnMaxDate()){ if(dayInfo(d).st==='open'){ data.date=d; break; } d=addDays(d,1); }
    data.time=firstOpenTime(data.date);
  }
}
function defaultSize(){var vols=volumesForName(data.branch,data.class);if(vols.length){var v30=vols.find(function(v){return String(v.volume)==='30';});data.size=((v30?v30.volume:vols[0].volume))+'ml';}else data.size='';}
function openModal(preClass,preBranch){
  resetApplyData(preClass||'',preBranch||'');     // 매번 기본값으로 초기화
  submitErr='';
  goto(1);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  document.getElementById('amToast').classList.remove('show');
}
function goto(n){
  cur=n; editing=null; returnTo=null; snap=null; sumOpen=false;
  if(n===4) calMonth=(data.date||vnToday()).slice(0,7);
  if(n===5 && isInquiry() && !data.msg) data.msg=inquiryTemplate();
  renderModal(false);
}
/* ---- 화면 그리기: 같은 상태(data·cur·editing)로 웹(레일+패널)/모바일(스택)을 그림 → 화면 크기가 바뀌어도 단계 유지 ---- */
function isMob(){return mqMob.matches;}
function renderModal(keepScroll){
  const mob=isMob(), st=amBody.scrollTop;
  modal.querySelectorAll('.am-sub').forEach(e=>{e.textContent=tr(AM.sub);});
  amRail.innerHTML=mob?'':railHTML();
  amBody.classList.toggle('anim',!keepScroll);
  amBody.innerHTML=mob?mobileHTML():panelHTML();
  renderFoot(mob);
  amBody.scrollTop=keepScroll?st:0;
}
if(mqMob.addEventListener) mqMob.addEventListener('change',function(){ if(modal.classList.contains('open')) renderModal(true); });
function stepOn(s){return s!==3||(needsSize()&&!isInquiry());}   // 용량 단계: 용량 없는 클래스·문의 전용이면 건너뜀(기존과 동일)
function stepsOn(){return [1,2,3,4,5].filter(stepOn);}
function className(){const c=classObjOf();return c?Lval(c.name,curLang()):data.class;}
function stepVal(s){
  if(s===1) return data.branch?branchLabel(data.branch):'';
  if(s===2) return data.class?className():'';
  if(s===3) return data.size||'';
  if(s===4){ if(!data.date)return ''; const a=[fmtDay(data.date)]; if(!isInquiry()){ if(data.time)a.push(data.time); a.push(pplStr(data.people)); } return a.join(' · '); }
  if(s===5) return data.name||'';
  return '';
}
function summaryVal(n){   // 4단계: 1–3 요약, 5단계: 1–4 요약
  if(n===4) return [stepVal(1),stepVal(2),stepOn(3)?data.size:''].filter(Boolean).join(' · ');
  const inq=isInquiry();
  return [[className(),stepOn(3)?data.size:''].filter(Boolean).join(' '),[fmtDay(data.date),inq?'':data.time].filter(Boolean).join(' '),inq?'':pplStr(data.people)].filter(Boolean).join(' · ');
}
function stepHTML(n,mob){
  if(n===1) return branchHTML(mob)+errHTML('branch',ERR.sel);
  if(n===2) return programHTML(mob)+errHTML('class',ERR.sel);
  if(n===3) return sizeHTML(mob)+errHTML('size',ERR.sel);
  if(n===4) return visitHTML(mob);
  return formHTML();
}
function spacePhoto(){const g=sortGal(spaceItemsAll()).find(x=>x.img&&!isVideoUrl(x.img));return g?g.img:'';}
function branchHTML(mob){
  const brs=(getSettings().branches||[]).filter(b=>b&&b.name);
  if(!brs.length) return (window.LS&&LS.hadLoadError&&LS.hadLoadError())?loadErrorHTML():'';
  const lang=curLang(), ph=mob?'':spacePhoto();
  return (mob?'<div class="opt-list">':'')+brs.map((b,i)=>{
    const sel=b.name===data.branch, loc=Lval(b.location,lang), hrs=Lval(b.hours,lang);
    const attr=`data-pick="branch" data-val="${esc(b.name)}" role="button" tabindex="0" aria-pressed="${sel}"`;
    if(mob) return `<div class="opt ${sel?'sel':''}" ${attr}><div class="mid"><div class="ti">${esc(branchLabel(b.name))}</div>${loc?`<div class="de">${esc(loc)}</div>`:''}${hrs?`<div class="de2">${esc(hrs)}</div>`:''}</div>`
      +(b.link?`<a class="map-a" href="${esc(b.link)}" target="_blank" rel="noopener">${esc(tr(AM.map))} ↗</a>`:'')+`</div>`;
    return `<div class="w-branch ${sel?'sel':''} ${ph?'':'nophoto'}" ${attr}>${ph?`<div class="wb-ph" style="background-image:url('${esc(imgUrl(ph,600))}')"></div>`:''}<div class="wb-in">`
      +`<div class="wb-top"><span>BRANCH ${String(i+1).padStart(2,'0')}</span>${sel?'<span class="ck">✓</span>':''}</div><div class="wb-name">${esc(branchLabel(b.name))}</div><div class="wb-hr"></div>`
      +(loc?`<div class="wb-row"><span>ADDRESS</span><b>${esc(loc)}</b></div>`:'')+(hrs?`<div class="wb-row"><span>HOURS</span><b>${esc(hrs)}</b></div>`:'')
      +(b.link?`<a class="wb-map" href="${esc(b.link)}" target="_blank" rel="noopener">${esc(tr(AM.mapview))} ↗</a>`:'')+`</div></div>`;
  }).join('')+(mob?'</div>':'');
}
function programHTML(mob){
  const progs=programList(data.branch);
  if(!progs.length) return (window.LS&&LS.hadLoadError&&LS.hadLoadError())?loadErrorHTML():'';
  const lang=curLang();
  const rows=progs.map(c=>{
    const key=keyOf(c.name), off=c.active===false, sel=key===data.class, vols=volumesForName(data.branch,key);
    let right;
    if(c.inquiry||!vols.length) right=`<span class="tag">${esc(tr(AM.inqtag))}</span>`;
    else { const m=minDetail(vols); right=`<div class="pr"><small>${esc(mob?m.volume+'ml':fromStr(m.volume+'ml'))}</small>${esc(priceParts(m).now)}${vols.length>1?'~':''}</div>`; }
    const mark=(editing===2&&snap&&snap.class===key)?`<span class="cur-mark">${esc(tr(AM.current))}</span>`:'';
    return `<div class="opt ${mob?'':'w-prog'} ${off?'disabled':''} ${sel?'sel':''}" data-pick="class" data-val="${esc(key)}" role="button" tabindex="0" aria-pressed="${sel}"${off?' aria-disabled="true"':''}>`
      +`${mob?'':'<span class="radio"></span>'}<div class="mid"><div class="ti">${esc(Lval(c.name,lang))}${mark}</div><div class="de">${esc(Lval(c.desc,lang))}${off?esc(tr(AM.soon)):''}</div></div>${right}</div>`;
  }).join('');
  return `<div class="opt-list">${rows}</div>`+(progs.some(c=>c.inquiry)?`<p class="am-note">${esc(tr(AM.inqnote))}</p>`:'');
}
function sizeHTML(mob){
  const lang=curLang(), vols=volumesForName(data.branch,data.class);
  return (mob?'<div class="opt-list">':'<div class="w-vols">')+vols.map(t=>{
    const v=t.volume+'ml', sel=v===data.size, p=priceParts(t), dt=Lval(t.detail,lang), isCur=editing===3&&snap&&snap.size===v;
    const attr=`data-pick="size" data-val="${esc(v)}" role="button" tabindex="0" aria-pressed="${sel}"`;
    const badge=p.label?`<span class="pct">${esc(p.label)}</span>`:'', old=p.old?`<span class="old">${esc(p.old)}</span>`:'';
    if(mob) return `<div class="opt ${sel?'sel':''}" ${attr}><div class="mid"><div class="ti">${esc(v)}${badge}${isCur?`<span class="cur-mark">${esc(tr(AM.current))}</span>`:''}</div>${dt?`<div class="de">${esc(dt)}</div>`:''}</div><div class="pr">${old}${esc(p.now)}</div></div>`;
    return `<div class="w-vol ${sel?'sel':''}" ${attr}><div class="wv-top"><span>${isCur?esc(tr(AM.curSel)):'VOLUME'}</span>${badge}</div><div class="wv-ml">${esc(v)}</div><div class="wv-b">${old}<div class="wv-p">${esc(p.now)}</div>${dt?`<div class="wv-d">${esc(dt)}</div>`:''}</div></div>`;
  }).join('')+'</div>';
}
function windowNote(){const days=(window.RESERVATION_WINDOW_DAYS||90);
  return tr({en:'Online booking is available up to '+days+' days ahead. For dates further out, please contact us directly.',
    vi:'Đặt lịch trực tuyến chỉ khả dụng trong vòng '+days+' ngày tới. Với ngày xa hơn, vui lòng liên hệ trực tiếp.',
    ru:'Онлайн-запись доступна не более чем на '+days+' дней вперёд. Для более поздних дат свяжитесь с нами напрямую.',
    ko:'온라인 예약은 오늘로부터 '+days+'일 이내만 가능합니다. 그 이후 날짜는 직접 문의해 주세요.'});}
function calHTML(mob){
  const inq=isInquiry(), today=vnToday();
  if(!calMonth) calMonth=(data.date||today).slice(0,7);
  const y=+calMonth.slice(0,4), m=+calMonth.slice(5,7);
  const first=new Date(Date.UTC(y,m-1,1)).getUTCDay(), days=new Date(Date.UTC(y,m,0)).getUTCDate();
  const minM=today.slice(0,7), maxM=inq?addMonths(minM,12):vnMaxDate().slice(0,7);
  let cells='';
  for(let i=0;i<first;i++) cells+='<span></span>';
  for(let d=1;d<=days;d++){
    const ds=calMonth+'-'+String(d).padStart(2,'0'), inf=dayInfo(ds), sel=ds===data.date;
    cells+=`<button type="button" class="cal-d ${inf.st==='open'?(inf.low?'low':''):inf.st} ${sel?'sel':''}" ${inf.st==='open'?`data-day="${ds}"`:'disabled aria-disabled="true"'} aria-label="${ds}"${sel?' aria-pressed="true"':''}><span>${d}</span></button>`;
  }
  const wd=(WD[curLang()]||WD.ko).map(w=>`<span>${w}</span>`).join('');
  const legend=(!mob&&!inq)?`<div class="cal-legend"><span>● ${esc(tr(AM.low))}</span><span class="lg-off">${esc(tr(AM.closed))}</span><span class="lg-full">${esc(tr(AM.full))}</span></div>`:'';
  return `<div class="cal"><div class="cal-h"><b class="cal-m">${esc(monthLabel(y,m))}</b><div class="cal-nav"><button type="button" data-act="prev" aria-label="prev"${calMonth<=minM?' disabled':''}>‹</button><button type="button" data-act="next" aria-label="next"${calMonth>=maxM?' disabled':''}>›</button></div></div>`
    +`<div class="cal-wd">${wd}</div><div class="cal-g">${cells}</div>${legend}</div>`+(inq?'':`<p class="cal-note">${esc(windowNote())}</p>`);
}
function timesHTML(mob){
  if(!data.date) return `<p class="t-empty">${esc(tr(AM.pickdate))}</p>`;
  const slots=slotsFor(data.date).slice().sort((a,b)=>a.time<b.time?-1:a.time>b.time?1:0);
  if(!slots.length) return `<p class="t-empty">${esc(dayMsg(data.date))}</p>`;
  return '<div class="times">'+slots.map(s=>{
    const rem=s.cap-bookedOn(data.date,s.time), past=isPastSlot(data.date,s.time), off=rem<=0||past, sel=!off&&s.time===data.time;
    const sub=mob?'':`<small>${esc(past?tr(AM.passed):off?tr(AM.full):remainChip(rem))}</small>`;
    return `<button type="button" class="tchip ${off?'full':''} ${sel?'sel':''}" ${off?'disabled aria-disabled="true"':`data-time="${esc(s.time)}"`}${sel?' aria-pressed="true"':''}>${esc(s.time)}${sub}</button>`;
  }).join('')+'</div>';
}
function pplHTML(){
  const p=Math.max(1,parseInt(data.people)||1), r=slotRemain();
  return `<div class="ppl"><div><span class="k">${esc(tr(AM.people))}</span>${r!=null&&r>0?`<span class="r">${esc(remainPpl(r))}</span>`:''}</div>`
    +`<div class="stp"><button type="button" class="minus" data-act="minus" aria-label="-"${p<=1?' disabled':''}>−</button><b aria-live="polite">${p}</b><button type="button" class="plus" data-act="plus" aria-label="+"${r!=null&&p>=r?' disabled':''}>+</button></div></div>`;
}
function visitHTML(mob){
  const cal=calHTML(mob), errs=errHTML('visit',ERR.visit)+errHTML('cap');
  if(isInquiry()) return cal+errs;                 // 문의 전용: 시간/인원 없이 날짜만(기존과 동일)
  if(mob) return cal+timesHTML(true)+pplHTML()+errs;
  return `<div class="visit"><div>${cal}</div><div><div class="v-rh"><span>TIME</span><b>${data.date?esc(fmtDayLong(data.date)):''}</b></div>${timesHTML(false)}${pplHTML()}</div></div>`+errs;
}
function formHTML(){
  const L=tr({ko:{name:'이름',nat:'국적',phone:'연락처',email:'이메일',fb:'Facebook (선택)',ig:'Instagram (선택)',msg:'남길 말 (선택)',pph:'전화번호',pfb:'아이디 또는 링크',pig:'아이디'},
    en:{name:'Name',nat:'Nationality',phone:'Phone',email:'Email',fb:'Facebook (optional)',ig:'Instagram (optional)',msg:'Message (optional)',pph:'Phone number',pfb:'ID or link',pig:'ID / handle'},
    vi:{name:'Họ tên',nat:'Quốc tịch',phone:'Số điện thoại',email:'Email',fb:'Facebook (tùy chọn)',ig:'Instagram (tùy chọn)',msg:'Lời nhắn (tùy chọn)',pph:'Số điện thoại',pfb:'ID hoặc liên kết',pig:'ID'},
    ru:{name:'Имя',nat:'Гражданство',phone:'Телефон',email:'Email',fb:'Facebook (необязательно)',ig:'Instagram (необязательно)',msg:'Сообщение (необязательно)',pph:'Номер телефона',pfb:'ID или ссылка',pig:'ID / ник'}});
  const v=k=>esc(data[k]||'');
  return '<div class="fgrid">'
    +`<div class="ff"><label for="af-name">${L.name}</label><input id="af-name" type="text" data-field="name" autocomplete="name" value="${v('name')}"></div>`
    +`<div class="ff"><label for="af-nat">${L.nat}</label><select id="af-nat" data-field="nationality" required>${natOptionsHTML()}</select></div>`
    +`<div class="ff full"><label for="af-phone">${L.phone}</label><div class="phone-row"><input class="dialcode" data-field="dialcode" readonly tabindex="-1" placeholder="+--" value="${esc(dialOf(data.nationality)||data.dialcode||'')}"><input id="af-phone" type="tel" data-field="phone" inputmode="numeric" autocomplete="tel-national" placeholder="${esc(L.pph)}" value="${v('phone')}"></div></div>`
    +`<div class="ff full"><label for="af-email">${L.email}</label><div class="email-row"><input id="af-email" type="email" data-field="email" autocomplete="email" value="${v('email')}"><select class="email-domain" aria-label="email domain">${emailDomainOptions()}</select></div></div>`
    +`<div class="ff"><label for="af-fb">${L.fb}</label><input id="af-fb" type="text" data-field="facebook" placeholder="${esc(L.pfb)}" value="${v('facebook')}"></div>`
    +`<div class="ff"><label for="af-ig">${L.ig}</label><input id="af-ig" type="text" data-field="instagram" placeholder="${esc(L.pig)}" value="${v('instagram')}"></div>`
    +`<div class="ff full"><label for="af-msg">${L.msg}</label><textarea id="af-msg" data-field="msg" rows="2">${v('msg')}</textarea></div>`
    +'</div>'+errHTML('contact',ERR.contact);
}
/* ---- 모바일: 스택 스텝 (끝낸 단계 → 완료 행 · 4단계부터 요약 행 · 현재 단계 카드 · 대기 행) ---- */
function doneRow(s){
  return `<div class="srow ${editing===s?'hl':''}"><span class="ck">✓</span><span class="k">${esc(tr(AM.step[s]))}</span><span class="v">${esc(stepVal(s))}</span><button type="button" class="edit-link" data-edit="${s}">${esc(tr(AM.edit))}</button></div>`;
}
function pendRow(s){return `<div class="spend"><span class="num">${s}</span><span class="t">${esc(tr(AM.step[s]))}</span></div>`;}
function stackCard(n,isEdit){
  const t=tr(AM.step[n]), title=isEdit?tr({ko:t+' 변경',en:'Edit · '+t,vi:'Sửa · '+t,ru:'Изменить · '+t}):t;
  return `<div class="scard"><div class="scard-h"><span class="num-o">${n}</span><span class="scard-t">${esc(title)}</span>${isEdit?`<button type="button" class="scard-x" data-act="cancel">${esc(tr(AM.cancel))}</button>`:''}</div><div class="am-content">${stepHTML(n,true)}</div></div>`;
}
function mobileHTML(){
  if(cur===6) return confirmHTML(true);
  if(cur===7) return doneHTML(true);
  const on=stepsOn(), out=[];
  if(editing){
    on.filter(s=>s<editing).forEach(s=>out.push(doneRow(s)));
    out.push(stackCard(editing,true));
    out.push(`<div class="skept"><span class="num">${returnTo}</span><span class="v">${esc(tr(AM.step[returnTo]))}${stepVal(returnTo)?' · '+esc(stepVal(returnTo)):''}</span><span class="kt">${esc(tr(AM.kept))}</span></div>`);
    on.filter(s=>s>returnTo).forEach(s=>out.push(pendRow(s)));
    return out.join('');
  }
  const before=on.filter(s=>s<cur);
  if(cur>=4){
    const lbl='STEP 1–'+(cur-1);
    if(sumOpen) out.push(`<div class="sgroup"><div class="sg-h"><span>${lbl}</span><button type="button" data-act="fold">${esc(tr(AM.fold))} ▴</button></div>${before.map(s=>doneRow(s)).join('')}</div>`);
    else out.push(`<div class="ssum"><span class="ck">✓</span><div class="tx"><div class="k">${lbl}</div><div class="v">${esc(summaryVal(cur))}</div></div><button type="button" class="edit-link" data-act="expand">${esc(tr(AM.edit))}</button></div>`);
  } else before.forEach(s=>out.push(doneRow(s)));
  if(sumOpen){   // 요약 펼침 중: 현재 단계는 입력값 칩으로 축소
    const inq=isInquiry(), chips=(cur===4?[fmtDay(data.date),inq?'':data.time,inq?'':pplStr(data.people)]:[data.name]).filter(Boolean);
    out.push(`<div class="scard" data-act="fold" role="button" tabindex="0"><div class="scard-h"><span class="num-o">${cur}</span><span class="scard-t">${esc(tr(AM.step[cur]))}</span><span class="scard-x">${esc(tr(AM.typing))}</span></div>${chips.length?`<div class="chips-sm">${chips.map(c=>`<span>${esc(c)}</span>`).join('')}</div>`:''}</div>`);
  } else out.push(stackCard(cur,false));
  on.filter(s=>s>cur).forEach(s=>out.push(pendRow(s)));
  return out.join('');
}
/* ---- 웹: 왼쪽 단계 레일(항상 전체 단계) + 오른쪽 패널 ---- */
function railHTML(){
  const fin=cur>=6, base=editing?returnTo:cur;
  const rows=stepsOn().map(s=>{
    const name=esc(tr(AM.step[s])), val=esc(stepVal(s));
    const done=(canEdit)=>`<div class="rs done"><span class="rs-dot">✓</span><div class="rs-tx"><span class="rs-k">${name}</span><span class="rs-v">${val||'—'}</span></div>${canEdit?`<button type="button" class="edit-link" data-edit="${s}">${esc(tr(AM.edit))}</button>`:''}</div>`;
    if(fin) return done(false);
    if(editing&&s===editing) return `<div class="rs done editing"><span class="rs-dot">✓</span><div class="rs-tx"><span class="rs-k">${name}</span><span class="rs-v">${esc(editFrom||'—')} → ${esc(tr(AM.editing))}</span></div><button type="button" class="edit-link" data-act="cancel">${esc(tr(AM.edit))}</button></div>`;
    if(editing&&s===returnTo) return `<div class="rs kept"><span class="rs-dot">${s}</span><div class="rs-tx"><span class="rs-k">${name}</span><span class="rs-v">${val||'—'}</span></div><span class="rs-kept">${esc(tr(AM.kept))}</span></div>`;
    if(s<base) return done(!editing||s<editing);
    if(s===cur) return `<div class="rs cur"><span class="rs-dot">${s}</span><div class="rs-tx"><span class="rs-t">${name}</span>${val?`<span class="rs-sub">${val}</span>`:''}</div></div>`;
    return `<div class="rs pending"><span class="rs-dot">${s}</span><span class="rs-t">${name}</span></div>`;
  }).join('');
  let bottom='';
  if(cur===7) bottom=`<div class="rail-coord">10° 47' 27.49" N 106° 41' 36.89" E</div>`;
  else if(cur>=3&&!isInquiry()){
    const amt=expectedAmountStr();
    if(amt) bottom=`<div class="rail-amt"><div><span class="k">${esc(tr(AM.amount))}</span><span class="v">${esc(amt)}</span></div><span class="f">${esc(cur===3&&!editing?tr(AM.perOne):selUnitStr()+' × '+pplStr(data.people))}</span></div>`;
  }
  return `<div class="am-brand"><b>LIMINAL SPACE</b><i></i><span class="am-sub">${esc(tr(AM.sub))}</span></div><div class="rail-steps">${rows}</div>${bottom}`;
}
function panelHTML(){
  if(cur===6) return confirmHTML(false);
  if(cur===7) return doneHTML(false);
  const n=editing||cur;
  const eb=editing?`STEP 0${n} · ${esc(tr(AM.edit))} <span class="am-badge">${esc(tr(AM.editing))}</span>`:`STEP 0${n} / 05`;
  return `<div class="am-eyebrow">${eb}</div><h3 class="am-title">${esc(tr(AM.q[n]))}</h3>${editing?`<p class="am-desc">${esc(tr(AM.editdesc))}</p>`:''}<div class="am-content">${stepHTML(n,false)}</div>`;
}
function renderFoot(mob){
  let back=true, label, sub='', arrow=!mob;
  if(cur===7){ back=false; label=tr(AM.ok); arrow=false; }
  else if(editing){ label=tr(AM.saveback); arrow=false; }
  else if(cur===6){ label=tr(AM.finish); arrow=false; }
  else{
    back=cur>1; label=tr(AM.next);
    if(mob&&!isInquiry()){ if(cur===3) sub=selUnitStr(); else if(cur===4){ const a=expectedAmountStr(); if(a) sub=a+' · '+pplStr(data.people); } }
  }
  btnBack.style.display=back?'':'none';
  btnBack.textContent=editing?(mob?'←':tr(AM.cancel)):(mob?'←':'← '+tr(AM.back));
  btnBack.setAttribute('aria-label',editing?tr(AM.cancel):tr(AM.back));
  btnNext.innerHTML=`<span>${esc(label)}</span>`+(sub?`<span class="sub">${esc(sub)}</span>`:arrow?'<span aria-hidden="true">→</span>':'');
  btnNext.classList.toggle('has-sub',!!sub);
}
/* ---- '변경' 흐름: 특정 단계만 다시 열고, 저장하면 원래 단계로 복귀 ---- */
function startEdit(s){
  const base=editing?returnTo:cur;
  if(cur>=6||s>=base||!stepOn(s))return;
  if(editing) Object.assign(data,snap); else { snap=Object.assign({},data); returnTo=cur; }
  editing=s; editFrom=stepVal(s); sumOpen=false;
  if(s===4) calMonth=(data.date||vnToday()).slice(0,7);
  renderModal(false);
}
function cancelEdit(){ const r=returnTo; Object.assign(data,snap); goto(r); }
/* 종속값 초기화: 지점 변경 → 프로그램·용량·날짜·시간 / 프로그램 변경 → 용량·시간(해당 날짜에 슬롯 없으면 날짜도) / 용량 변경 → 금액만 재계산.
   초기화가 생기면 비워진 단계로 이동하고 토스트로 안내 */
function saveEdit(){
  const s=editing, r=returnTo, b=snap, reset=[];
  if(data.branch!==b.branch){ data.class='';data.size='';data.date='';data.time=''; reset.push(AM.step[2],AM.step[3],AM.date,AM.time); }
  else if(data.class!==b.class){
    if(b.size) reset.push(AM.step[3]); if(b.time) reset.push(AM.time);
    data.size=''; data.time='';
    if(data.date&&!isInquiry()&&!slotsFor(data.date).length){ data.date=''; reset.push(AM.date); }
  }
  const title=tr(AM.step[s])+' → '+(stepVal(s)||'—');
  let t=r;
  if(!data.class) t=2; else if(stepOn(3)&&!data.size) t=3; else if(!data.date||(!isInquiry()&&!data.time)) t=4;
  goto(Math.min(t,r));
  toast(title, reset.length?tr(AM.resetMsg)+reset.map(x=>tr(x)).join(', '):tr(AM.keptMsg));
}
let toastT=0;
function toast(title,sub){
  const el=document.getElementById('amToast');
  el.innerHTML=`<span class="ck">✓</span><div><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`;
  el.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2500);
}
function hideErrors(){modal.querySelectorAll('.err').forEach(e=>e.style.display='none');}
function showErr(name){const e=modal.querySelector(`[data-err="${name}"]`);if(e)e.style.display='block';}
function showCapErr(remain){
  const e=modal.querySelector('[data-err="cap"]');
  e.textContent = remain<=0
    ? tr({vi:'Ngày này đã kín chỗ. Vui lòng chọn ngày khác.',en:'This date is fully booked. Please choose another date.',ru:'На эту дату мест нет. Пожалуйста, выберите другую дату.',ko:'해당 날짜는 마감되었습니다. 다른 날짜를 선택해 주세요.'})
    : tr({vi:`Chỉ còn ${remain} chỗ. Vui lòng điều chỉnh số người.`,en:`Only ${remain} spots left. Please adjust the number of people.`,ru:`Осталось мест: ${remain}. Пожалуйста, измените количество человек.`,ko:`이 날짜는 잔여 ${remain}명입니다. 인원을 조정해 주세요.`});
  e.style.display='block';
}

function collectInputs(){
  modal.querySelectorAll('[data-field]').forEach(inp=>{
    if(inp.tagName==='INPUT'||inp.tagName==='TEXTAREA'||inp.tagName==='SELECT') data[inp.dataset.field]=inp.value.trim();
  });
}
function validate(n){
  collectInputs();
  if(n===1&&!data.branch){showErr('branch');return false;}
  if(n===2&&!data.class){showErr('class');return false;}
  if(n===3 && !isInquiry() && !data.size){showErr('size');return false;}
  if(n===4){
    if(!data.date){showErr('visit');return false;}
    if(data.date<vnToday()){const e=modal.querySelector('[data-err="cap"]');e.textContent=tr({vi:'Không thể chọn ngày đã qua.',en:'Past dates cannot be selected.',ru:'Нельзя выбрать прошедшую дату.',ko:'지난 날짜는 선택할 수 없습니다.'});e.style.display='block';return false;}
    if(isInquiry()) return true;   // 문의전용: 날짜만 확인(시간/슬롯/정원 검증 없음, 90일 제한도 적용 안 함 — 스케줄 데이터를 안 쓰므로)
    if(data.date>vnMaxDate()){const e=modal.querySelector('[data-err="cap"]');e.textContent=tr({vi:'Ngày này còn quá xa, vui lòng liên hệ trực tiếp để đặt lịch.',en:'This date is too far ahead — please contact us directly to book.',ru:'Эта дата слишком далеко — для записи свяжитесь с нами напрямую.',ko:'너무 먼 날짜는 온라인 예약이 불가합니다. 직접 문의해 주세요.'});e.style.display='block';return false;}
    const slots=slotsFor(data.date);
    if(!slots.length){const e=modal.querySelector('[data-err="cap"]');e.textContent=dayMsg(data.date);e.style.display='block';return false;}
    if(!data.time){showErr('visit');return false;}
    if(isPastSlot(data.date,data.time)){const e=modal.querySelector('[data-err="cap"]');e.textContent=tr({vi:'Khung giờ đã qua. Vui lòng chọn giờ khác.',en:'This time has passed. Please choose another time.',ru:'Это время уже прошло. Пожалуйста, выберите другое.',ko:'이미 지난 시간입니다. 다른 시간을 선택해 주세요.'});e.style.display='block';return false;}
    const slot=slots.find(s=>s.time===data.time);
    if(!slot){showErr('visit');return false;}
    const remain=slot.cap-bookedOn(data.date,data.time);
    const req=Math.max(1,parseInt(data.people)||1);
    if(remain<=0||req>remain){showCapErr(remain);return false;}
  }
  if(n===5&&(!data.name||!data.phone||!data.email||!data.nationality)){showErr('contact');return false;}
  if(n===5 && codeOf(data.nationality)==='VN' && looksInvalidVNPhone(data.phone)){
    const lang=curLang();
    const msg=tr({en:"This doesn't look like a valid Vietnamese phone number. Please double-check it.\n\nSubmit anyway?",
      vi:'Số điện thoại này có vẻ không đúng định dạng Việt Nam. Vui lòng kiểm tra lại.\n\nBạn vẫn muốn gửi?',
      ru:'Похоже, это не вьетнамский номер телефона. Пожалуйста, проверьте его.\n\nВсё равно отправить?',
      ko:'베트남 번호 형식이 아닌 것 같습니다. 전화번호를 다시 확인해 주세요.\n\n이대로 접수하시겠습니까?'},lang);
    if(!confirm(msg)) return false;   // 입력 자체는 막지 않고, 확인만 거쳐서 진행 가능
  }
  return true;
}
/* 베트남 휴대폰 형식(0 3/5/7/8/9 + 9자리) 대략 확인 — 접수를 막진 않고 확인창만 띄우는 용도 */
function looksInvalidVNPhone(phone){
  var d=String(phone||'').replace(/[^0-9]/g,''); if(!d)return false;
  if(d.startsWith('84'))d='0'+d.slice(2);
  if(d.length!==10)return true;
  return !/^0[35789]/.test(d);
}
function confirmHTML(mob){
  const lang=curLang(), inq=isInquiry();
  const L = tr({en:{branch:'Branch',class:'Class',size:'Volume',date:'Date',time:'Time',people:'People',amount:'Estimated payment',name:'Name',phone:'Phone',email:'Email',nat:'Nationality',fb:'Facebook',ig:'Instagram',msg:'Note'},
    vi:{branch:'Chi nhánh',class:'Lớp',size:'Dung tích',date:'Ngày',time:'Giờ',people:'Số người',amount:'Số tiền dự kiến',name:'Họ tên',phone:'SĐT',email:'Email',nat:'Quốc tịch',fb:'Facebook',ig:'Instagram',msg:'Ghi chú'},
    ru:{branch:'Филиал',class:'Класс',size:'Объём',date:'Дата',time:'Время',people:'Человек',amount:'Ориентировочная сумма',name:'Имя',phone:'Телефон',email:'Email',nat:'Гражданство',fb:'Facebook',ig:'Instagram',msg:'Комментарий'},
    ko:{branch:'지점',class:'클래스',size:'용량',date:'날짜',time:'시간',people:'인원',amount:'결제 예정 금액',name:'이름',phone:'연락처',email:'이메일',nat:'국적',fb:'Facebook',ig:'Instagram',msg:'메모'}},lang);
  const book=[['branch',branchLabel(data.branch)],['class',className()]];
  if(data.size && !inq) book.push(['size',data.size]);
  book.push(['date',fmtDate(data.date)]);
  if(!inq) book.push(['time',data.time||'-'],['people',String(Math.max(1,parseInt(data.people)||1))]);
  const dial=dialOf(data.nationality)||data.dialcode||'';
  const who=[['name',data.name],['nat',natName(data.nationality)],['phone',(dial?dial+' ':'')+data.phone],['email',data.email]];
  if(data.facebook) who.push(['fb',data.facebook]);
  if(data.instagram) who.push(['ig',data.instagram]);
  if(data.msg) who.push(['msg',data.msg]);
  const amt=inq?'':expectedAmountStr();
  const row=([k,v])=>`<div class="cr ${k==='email'?'em':k==='amount'?'amt':k==='msg'?'msg':''}"><span class="k">${esc(L[k])}</span><span class="v">${esc(v)}</span></div>`;
  const amtRow=amt?row(['amount',amt]):'';
  const head=`<div class="am-eyebrow">${esc(tr({ko:'CONFIRM',en:'CONFIRM',vi:'XÁC NHẬN',ru:'ПРОВЕРКА'},lang))}</div><h3 class="am-title">${esc(tr({ko:'입력하신 내용을 확인해 주세요.',en:'Please review your details.',vi:'Vui lòng kiểm tra thông tin của bạn.',ru:'Пожалуйста, проверьте данные.'},lang))}</h3>`;
  const note=`<p class="conf-note">${esc(tr({ko:'이메일 주소가 정확한지 다시 한번 확인해 주세요. 정보가 잘못되면 예약 확정 안내를 받지 못할 수 있습니다. 확인 후 신청완료를 눌러 주세요.',
    en:'Please double-check your email address. If your information is incorrect, you may not receive the booking confirmation. Review your details before tapping Submit.',
    vi:'Vui lòng kiểm tra lại địa chỉ email của bạn. Nếu thông tin sai, bạn có thể không nhận được xác nhận đặt lịch. Hãy kiểm tra kỹ trước khi nhấn Hoàn tất.',
    ru:'Пожалуйста, ещё раз проверьте адрес email. Если данные указаны неверно, вы можете не получить подтверждение записи. Проверьте всё перед отправкой.'},lang))}</p>`;
  if(mob) return head+`<div class="conf-card">${book.map(row).join('')}${who.map(row).join('')}${amtRow}</div>`+note;
  return head+`<div class="am-content conf-cols"><div class="conf-card"><h5>${esc(tr(AM.booking))}</h5>${book.map(row).join('')}${amtRow}</div><div class="conf-card"><h5>${esc(tr(AM.step[5]))}</h5>${who.map(row).join('')}</div></div>`+note;
}
/* 완료 화면: 문의는 '접수완료', 클래스 신청(결제없음→확정)은 '확정완료' + 이메일/잘로 안내 + 문의 연락처 */
var CONTACT_TEL='0818880504';
/* 연락처를 tel: 링크(모바일 탭하면 바로 전화)+복사 버튼으로 렌더 */
function telLinkHTML(tel,lang){
  var href='tel:+84'+String(tel).replace(/^0/,'');
  var label=tr({en:'Copy',vi:'Sao chép',ru:'Копировать',ko:'복사'},lang);
  return '<span class="tel-wrap"><a href="'+href+'" class="tel-link">'+esc(tel)+'</a>'
    +'<button type="button" class="tel-copy" data-tel="'+esc(tel)+'" data-label="'+esc(label)+'">'+esc(label)+'</button></span>';
}
function fallbackCopyText(text){
  try{ var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }catch(e){}
}
document.addEventListener('click',function(e){
  var btn=e.target.closest&&e.target.closest('.tel-copy'); if(!btn)return;
  e.preventDefault();
  var tel=btn.dataset.tel, label=btn.dataset.label;
  var showDone=function(){
    var doneTxt=tr({en:'Copied!',vi:'Đã chép!',ru:'Скопировано!',ko:'복사됨!'});
    btn.textContent=doneTxt; btn.classList.add('copied');
    setTimeout(function(){ btn.textContent=label; btn.classList.remove('copied'); },1400);
  };
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(tel).then(showDone).catch(function(){fallbackCopyText(tel);showDone();}); }
  else { fallbackCopyText(tel); showDone(); }
});
/* 완료 화면: 문의는 '접수완료', 클래스 신청(결제없음→확정)은 '확정완료' + 이메일/잘로 안내 + 문의 연락처 + 향수 라벨 카드 */
function doneHTML(mob){
  const inq=isInquiry(), l=curLang();
  const title=inq?tr({en:'Your inquiry has been received',vi:'Đã nhận liên hệ của bạn',ru:'Ваш запрос получен',ko:'문의가 접수되었습니다'},l)
    :tr({en:'Your booking is confirmed',vi:'Đặt lịch của bạn đã được xác nhận',ru:'Ваша запись подтверждена',ko:'예약이 확정되었습니다'},l);
  const desc=inq?esc(tr({en:'We will get back to you after review.',vi:'Chúng tôi sẽ liên hệ lại với bạn sau khi xem xét.',ru:'Мы свяжемся с вами после рассмотрения.',ko:'확인 후 입력하신 연락처로 안내드리겠습니다.'},l))
    :tr({en:'Please check the confirmation sent to your <b>email</b> or <b>Zalo</b>.',vi:'Vui lòng kiểm tra xác nhận được gửi qua <b>email</b> hoặc <b>Zalo</b>.',
      ru:'Проверьте подтверждение, отправленное на <b>email</b> или в <b>Zalo</b>.',ko:'<b>이메일</b> 또는 <b>잘로(Zalo)</b>로 보내드린 확정 안내를 확인해 주세요.'},l);
  let note='';
  if(!inq){ const tel=telLinkHTML(CONTACT_TEL,l);
    note='<div class="done-note">'+tr({en:'If you don\'t hear back via Zalo or email within <b>2–3 minutes</b>, please call us at '+tel+'.',
      vi:'Nếu trong vòng <b>2–3 phút</b> bạn chưa nhận được phản hồi qua Zalo hoặc email, vui lòng gọi '+tel+'.',
      ru:'Если в течение <b>2–3 минут</b> вы не получите ответ в Zalo или по email, позвоните нам: '+tel+'.',
      ko:'<b>2~3분 이내</b>에 잘로 또는 이메일로 회신이 오지 않으면, 아래 번호로 연락해 주세요: '+tel},l)+'</div>'; }
  // 저장이 재시도까지 실패한 경우 — CAPACITY_FULL: 동시신청으로 방금 마감(prevent_overbooking.sql 트리거)
  const fail=!submitErr?'':'<div class="done-fail">'+esc(/CAPACITY_FULL/.test(submitErr)
    ? tr({en:'Sorry, this time slot just became full. Please contact us to check other times.',vi:'Rất tiếc, khung giờ này vừa hết chỗ. Vui lòng liên hệ để kiểm tra giờ khác.',
      ru:'К сожалению, на это время только что закончились места. Свяжитесь с нами, чтобы подобрать другое время.',ko:'죄송합니다, 방금 이 시간대가 마감되었습니다. 다른 시간을 문의해 주세요.'},l)
    : tr({en:'Your submission was not completed. Please contact us to confirm.',vi:'Yêu cầu của bạn chưa được hoàn tất. Vui lòng liên hệ để xác nhận.',
      ru:'Заявка не была отправлена. Пожалуйста, свяжитесь с нами для подтверждения.',ko:'접수가 완료되지 않았습니다. 담당자에게 확인해주세요.'},l))+'</div>';
  const rows=[['DATE',data.date?data.date.replace(/-/g,'.')+(!inq&&data.time?' · '+data.time:''):'-'],['CLASS',className()+(data.size&&!inq?' · '+data.size:'')]];
  if(!inq) rows.push(['GUESTS',String(Math.max(1,parseInt(data.people)||1))]);
  rows.push(['BRANCH',branchLabel(data.branch)]);
  const label=`<div class="plabel"><div class="plabel-in"><div class="pl-e">EAU DE PARFUM</div><div class="pl-b">LIMINAL SPACE</div><div class="pl-c">10° 47' 27.49" N 106° 41' 36.89" E</div><div class="pl-hr"></div>`
    +rows.map(r=>`<div class="pl-r"><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')+`</div></div>`;
  const cks='<div class="done-cks">'+'<span class="ck">✓</span>'.repeat(5)+'</div>';
  if(mob) return `<div class="modal-done">${fail}${cks}<h3>${esc(title)}</h3><p class="dd">${desc}</p>${label}${note}</div>`;
  return `<div class="modal-done done-web"><div>${fail}${cks}<div class="am-eyebrow">RECEIVED</div><h3>${esc(title)}</h3><p class="dd">${desc}</p>${note}</div>${label}</div>`;
}
function submitApplication(){
  const inq=isInquiry();
  const _nat=codeOf(data.nationality)||data.nationality; const _dial=dialOf(data.nationality)||data.dialcode||'';
  const entry={id:Date.now(),createdAt:new Date().toISOString(),
    branch:data.branch,name:data.name,phone:(_dial?_dial+' ':'')+(data.phone||''),email:data.email,nationality:_nat,
    facebook:data.facebook||'',instagram:data.instagram||'',class:data.class,
    size:inq?'':data.size,date:data.date,time:inq?'':data.time,people:inq?'':String(Math.max(1,parseInt(data.people)||1)),
    amount:inq?'':expectedAmountStr(),deposit:'',
    msg:data.msg,status:inq?'new':'confirmed',   // 결제 없음 → 클래스 신청은 접수 즉시 '확정'(문의는 '신규' 유지)
    lang:curLang()};                              // 신청 당시 언어(확정메일 언어 결정)
  submitErr='';
  try{const list=(window.LS?LS.getApps():[]).slice();list.push(entry);LS.setApps(list);}catch(err){console.warn('저장 실패',err);}
  goto(7);
}
/* 신청 저장이 재시도까지 실패하면(순간 네트워크 오류 등) 완료 화면(7단계)에 그대로 있는 고객에게도 안내.
   이미 화면을 벗어났으면(모달 닫힘 등) 되돌릴 방법이 없어 콘솔 로그만 남긴다. */
if(window.LS&&LS.onError) LS.onError(function(msg){
  if(cur!==7)return;
  submitErr=String(msg||'error');
  if(modal.classList.contains('open')) renderModal(true);
});
/* ---- 팝업 이벤트(위임: 다시 그려도 바인딩 유지) ---- */
function pick(field,val){
  if(field==='branch'){ if(val!==data.branch){ data.branch=val; data.class=''; data.size=''; data.time=''; } }   // 지점마다 클래스/스케줄이 다름
  else if(field==='class'){ if(val!==data.class){ data.class=val; if(editing!==2) defaultSize(); } }          // 변경 흐름에서는 저장할 때 규칙대로 초기화
  else data[field]=val;
  renderModal(true);
}
modal.addEventListener('click',function(e){
  const t=e.target;
  if(t.closest('.am-close')){closeModal();return;}
  const ed=t.closest('[data-edit]'); if(ed){startEdit(+ed.dataset.edit);return;}
  const act=t.closest('[data-act]');
  if(act){
    const a=act.dataset.act;
    if(a==='expand'){sumOpen=true;renderModal(true);}
    else if(a==='fold'){sumOpen=false;renderModal(true);}
    else if(a==='cancel') cancelEdit();
    else if(a==='prev'||a==='next'){calMonth=addMonths(calMonth,a==='next'?1:-1);renderModal(true);}
    else if(a==='minus'||a==='plus'){
      const p=Math.max(1,(parseInt(data.people)||1)+(a==='plus'?1:-1)), r=slotRemain();
      data.people=String(r!=null&&r>0?Math.min(p,r):p); renderModal(true);
    }
    return;
  }
  if(t.closest('a')) return;                       // 지도 링크 등은 그대로 이동
  const pk=t.closest('[data-pick]'); if(pk){ if(!pk.classList.contains('disabled')) pick(pk.dataset.pick,pk.dataset.val); return; }
  const dy=t.closest('[data-day]'); if(dy){ data.date=dy.dataset.day; data.time=isInquiry()?'':firstOpenTime(data.date); clampPeople(); renderModal(true); return; }
  const tm=t.closest('[data-time]'); if(tm){ data.time=tm.dataset.time; clampPeople(); renderModal(true); }
});
/* 키보드: role=button 카드도 Enter/Space로 선택 + 다시 그린 뒤 같은 카드에 포커스 유지 */
modal.addEventListener('keydown',function(e){
  if(e.key!=='Enter'&&e.key!==' ')return;
  const el=e.target.closest&&e.target.closest('[role="button"]'); if(!el||el.tagName==='BUTTON')return;
  e.preventDefault();
  const sel=el.dataset.pick?'[data-pick="'+el.dataset.pick+'"][data-val="'+CSS.escape(el.dataset.val)+'"]':null;
  el.click();
  const n=sel&&amBody.querySelector(sel); if(n)n.focus();
});
modal.addEventListener('input',function(e){ const f=e.target.dataset&&e.target.dataset.field; if(f){ data[f]=e.target.value; hideErrors(); } });
modal.addEventListener('change',function(e){
  const t=e.target;
  if(t.dataset.field==='nationality'){   // 국적 선택 → 국가번호 자동 입력(수정 불가)
    data.nationality=t.value; data.dialcode=dialOf(t.value);
    const dc=modal.querySelector('[data-field="dialcode"]'); if(dc)dc.value=data.dialcode; hideErrors();
  } else if(t.classList.contains('email-domain')){
    const inp=modal.querySelector('[data-field="email"]'), d=t.value; t.value='';
    if(!d||!inp)return;
    const v=(inp.value||'').split('@')[0]; inp.value=v+'@'+d; data.email=inp.value;
    inp.focus(); try{ inp.setSelectionRange(v.length,v.length); }catch(_){}
  }
});
/* nav */
btnNext.addEventListener('click',()=>{
  if(cur===7){closeModal();return;}
  if(cur===6){submitApplication();return;}          // 확인 화면 → 접수완료
  if(editing){ if(validate(editing)) saveEdit(); return; }
  if(!validate(cur))return;
  if(cur===5){goto(6);return;}                       // STEP5 → 확인 화면
  let n=cur+1;
  if(n===3 && !stepOn(3)) n=4;                       // 용량 단계 건너뛰기(문의전용 포함)
  goto(n);
});
btnBack.addEventListener('click',()=>{
  if(editing){cancelEdit();return;}
  if(cur===6){goto(5);return;}                       // 확인 → 다시 입력
  let n=cur-1;
  if(n===3 && !stepOn(3)) n=2;
  if(n>=1) goto(n);
});
/* open triggers (위임: 데이터로 그린 카드 버튼 포함) · 맨 위로 */
document.addEventListener('click',function(e){
  const b=e.target.closest&&e.target.closest('[data-open-apply]');
  if(b){ e.preventDefault(); if(b.dataset.disabled)return; document.getElementById('navLinks').classList.remove('open'); openModal(b.dataset.class||'',b.dataset.branch||''); return; }
  if(e.target.closest&&e.target.closest('[data-to-top]')) window.scrollTo({top:0,behavior:'smooth'});
});
/* 지점명 언어별 라벨 (지점명은 단일 문자열이라, 알려진 지점명을 언어에 맞게 변환·없으면 원문) */
var BRANCH_I18N={
  '호치민':{ko:'호치민',en:'Ho Chi Minh',vi:'Hồ Chí Minh',ru:'Хошимин'},
  '하노이':{ko:'하노이',en:'Hanoi',vi:'Hà Nội',ru:'Ханой'},
  '다낭':{ko:'다낭',en:'Da Nang',vi:'Đà Nẵng',ru:'Дананг'}
};
function branchLabel(name){
  var L=curLang();
  var brs=(getSettings().branches||[]), b=null;
  for(var i=0;i<brs.length;i++){ if(brs[i]&&brs[i].name===name){ b=brs[i]; break; } }
  if(b&&b.nameI18n&&b.nameI18n[L]) return b.nameI18n[L];       // 1) 저장된 해당 언어 지점명
  var key=((name||'').split('(')[0]||name||'').trim();
  var m=BRANCH_I18N[key]; if(m&&m[L]) return m[L];             // 2) 알려진 지점명 매핑 폴백
  if(L==='ru'&&b&&b.nameI18n&&b.nameI18n.en) return b.nameI18n.en; // 3) 러시아어는 저장된 영어
  if(b&&b.nameI18n&&b.nameI18n.ko) return b.nameI18n.ko;        // 4) 저장된 한국어
  return name||'';
}
/* 상단 네비 지점별 소셜 버튼(호버 펼침) — 어드민 지점설정의 인스타·페북·링크트리 링크 사용 */
function ensureSvgDefs(){
  if(document.getElementById('ls-svgdefs'))return;
  var d=document.createElement('div'); d.id='ls-svgdefs'; d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML='<svg width="0" height="0" aria-hidden="true"><symbol id="ic-instagram" viewBox="0 0 24 24"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.25" fill="currentColor"/></symbol><symbol id="ic-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.5h2.52l.38-3h-2.9V8.55c0-.87.24-1.46 1.49-1.46h1.59V4.41c-.28-.04-1.23-.12-2.32-.12-2.3 0-3.87 1.4-3.87 3.98V10.5H8.2v3h2.66V21h2.64z"/></symbol><symbol id="ic-linktree" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M10.5 13.6a3.5 3.5 0 0 0 5 0l2.3-2.3a3.5 3.5 0 0 0-5-5l-1 1M13.5 10.4a3.5 3.5 0 0 0-5 0l-2.3 2.3a3.5 3.5 0 0 0 5 5l1-1"/></symbol><symbol id="ic-tiktok" viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 3c.32 2.06 1.66 3.46 3.9 3.6v2.46c-1.3.13-2.43-.3-3.74-1.09v5.96c0 3.02-2.45 5.47-5.47 5.47A5.47 5.47 0 0 1 8.9 8.97v2.62a2.85 2.85 0 1 0 2 2.72V3h2.7z"/></symbol><symbol id="ic-map" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z"/></symbol><symbol id="ic-sns" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="18" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8.1 10.8 15.4 7.2M8.1 13.2l7.3 3.6"/></symbol></svg>';
  document.body.appendChild(d);
}
/* 05 CONNECT — 지점 소셜 링크 카드 */
function renderSocialCards(){
  var box=document.getElementById('socialCards'); if(!box)return;
  var brs=(getSettings().branches||[]);
  function pick(f){for(var i=0;i<brs.length;i++){if(brs[i]&&brs[i][f])return brs[i][f];}return '';}
  var items=[['instagram','Instagram'],['facebook','Facebook'],['tiktok','TikTok'],['linktree','Linktree'],['link','Google Maps']]
    .map(function(a){return {name:a[1],url:pick(a[0])};}).filter(function(it){return it.url;});
  var sec=document.getElementById('connect');
  if(!items.length){ if(sec)sec.style.display='none'; return; }
  if(sec)sec.style.display='';
  box.innerHTML=items.map(function(it){return '<a class="connect-card lift" href="'+esc(it.url)+'" target="_blank" rel="noopener"><span>'+it.name+'</span><span class="cc-go" aria-hidden="true">↗</span></a>';}).join('');
}
/* 헤더 SNS(Instagram·Facebook·TikTok) — PC는 아이콘 3개, 모바일은 버튼 1개 탭 시 펼침.
   데이터 로드 전엔 지난번에 저장한 SNS를 먼저 그림 → 페이지 이동 때마다 SNS가 늦게 끼어들며 메뉴가 밀리지 않게 */
var navSocReady=false;
function renderNavSocials(){
  var drop=document.getElementById('snsDrop'); if(!drop)return;
  ensureSvgDefs();
  var html=null;
  if(!navSocReady){ try{ html=localStorage.getItem('ls_nav_soc2'); }catch(e){} }
  if(html===null){
    var brs=(getSettings().branches||[]);
    var pick=function(f){for(var i=0;i<brs.length;i++){if(brs[i]&&brs[i][f])return brs[i][f];}return '';};
    html=[['instagram','ig','Instagram'],['facebook','fb','Facebook'],['tiktok','tk','TikTok']].map(function(a){var u=pick(a[0]);
      return u?'<a class="icon-btn '+a[1]+'" href="'+esc(u)+'" target="_blank" rel="noopener" aria-label="'+a[2]+'"><svg class="ic"><use href="#ic-'+a[0]+'"/></svg></a>':'';}).join('');
    if(navSocReady){ try{ localStorage.setItem('ls_nav_soc2',html); }catch(e){} }
  }
  var box=document.getElementById('navSocials');
  if(!html){ if(box)box.parentNode.removeChild(box); drop.classList.remove('has-items','open'); return; }
  drop.classList.add('has-items');
  if(!box){ box=document.createElement('div'); box.className='socials'; box.id='navSocials'; drop.appendChild(box); }
  box.innerHTML=html;
}
/* 데이터 로드(Supabase 또는 localStorage) 후 초기 렌더 */
(window.LS ? LS.init() : Promise.resolve()).then(function(){
  applyActiveStates();
  renderClasses();
  renderLocation();
  renderMap();
  renderFooterSocial();
  renderSiteInfo();
  renderHero();
  renderConcept();
  renderSocialCards();
  renderSpaceFolderChips();
  initSpaceCarousel();
  renderSpaceGrid();
  renderFolderChips();
  renderGallery();
  renderPartners();
  renderMctaPrice();
  renderPageDesc();
  navSocReady=!(window.LS&&LS.hadLoadError&&LS.hadLoadError());   // 로드 실패 시엔 저장된 SNS 유지
  renderNavSocials();
});
/* close triggers */
/* 바깥(오버레이) 클릭으로는 닫히지 않음 — X 버튼/ESC 로만 닫힘 */
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal();});

/* ===== 원페이지 효과: 스크롤 등장 · 스크롤스파이 · 라이트박스 · 패럴랙스 ===== */
function initEffects(){
  // 1) 스크롤 등장(fade-in-up)
  var targets=document.querySelectorAll('.sec-head,.concept-grid,.gallery-grid,.class-grid,.proc-grid,.connect-grid,.cta-band,.space-strip,.loc-grid,.page-head,.mani-grid,.quote-card,.space-grid');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
    targets.forEach(function(t){t.classList.add('reveal');io.observe(t);});
  } else { targets.forEach(function(t){t.classList.add('in');}); }
  // 2) 현재 페이지 네비 강조(멀티페이지)
  var curPg=(location.pathname.split('/').pop()||'index.html');
  document.querySelectorAll('#navLinks a').forEach(function(a){var h=a.getAttribute('href')||'';if(h&&h!=='#'&&h===curPg)a.classList.add('active');});
  // 3) 라이트박스(갤러리·공간 사진 확대 + 이전/다음)
  var lb=document.getElementById('lightbox');
  if(lb){
    var lbImg=lb.querySelector('img'), lbCap=lb.querySelector('.lb-cap');
    var lbList=[], lbIdx=0;
    function lbVidEl(){ var v=lb.querySelector('video.lb-vid');
      if(!v){ v=document.createElement('video'); v.className='lb-vid'; v.controls=true; v.playsInline=true; v.style.display='none'; lbImg.parentNode.insertBefore(v,lbImg.nextSibling); }
      return v; }
    function lbShow(i){ if(!lbList.length)return; lbIdx=(i+lbList.length)%lbList.length; var it=lbList[lbIdx];
      var v=lbVidEl();
      if(isVideoUrl(it.src)){ lbImg.style.display='none'; lbImg.removeAttribute('src'); v.style.display=''; v.src=it.src; v.muted=false; try{v.play();}catch(e){} }   // 라이트박스: 소리 켜기 가능
      else { v.pause&&v.pause(); v.removeAttribute('src'); v.style.display='none'; lbImg.style.display=''; lbImg.setAttribute('data-orig',it.src); lbImg.onerror=function(){imgFallback(lbImg);}; lbImg.src=imgUrl(it.src,1600); }
      lbCap.textContent=it.cap||''; }
    function lbClose(){lb.classList.remove('open');document.body.style.overflow='';lbImg.removeAttribute('src');var v=lb.querySelector('video.lb-vid');if(v){v.pause();v.removeAttribute('src');v.style.display='none';}lbList=[];}
    function mediaSrc(el){return el?(el.getAttribute('data-orig')||el.currentSrc||el.src||el.getAttribute('src')||''):'';}
    function buildList(hit){
      var grid=hit.closest('#galleryGrid')||hit.closest('#spaceGrid');
      if(grid){ var ns=[].slice.call(grid.querySelectorAll('.gitem'));
        var list=ns.map(function(n){var im=n.querySelector('img,video');var t=n.querySelector('.gcap-t');return {src:mediaSrc(im),cap:n.dataset.cap||(t?t.textContent:'')};});
        return {list:list, idx:Math.max(0,ns.indexOf(hit.closest('.gitem')))}; }
      var mq=hit.closest('#spaceMarquee');
      if(mq){ var cards=[].slice.call(mq.querySelectorAll('.mcard')); var seen={}, list=[]; var csrc=mediaSrc(hit.querySelector('img,video'));
        cards.forEach(function(c){var im=c.querySelector('img,video');if(!im)return;var src=mediaSrc(im);if(seen[src])return;seen[src]=1;var t=c.querySelector('.mc-t')||c.querySelector('.mc-d');list.push({src:src,cap:t?t.textContent:''});});
        var idx=0; for(var k=0;k<list.length;k++){if(list[k].src===csrc){idx=k;break;}}
        return {list:list, idx:idx}; }
      var cf=hit.closest('.concept-figure');   // 컨셉: 저장된 미디어 목록 전체를 이전/다음으로
      if(cf){ var cl=(((getSettings().site||{}).conceptList)||[]).filter(Boolean);
        if(cl.length>1){ var cur=mediaSrc(hit.querySelector('.on')||hit.querySelector('img,video')); var ix=0;
          for(var z=0;z<cl.length;z++){ if(cur&&(cur===cl[z]||cur.indexOf(cl[z])>=0||cl[z].indexOf(cur)>=0)){ix=z;break;} }
          return {list:cl.map(function(u){return {src:u,cap:''};}), idx:ix}; } }
      var im2=hit.querySelector('img,video'); return {list:[{src:mediaSrc(im2),cap:''}], idx:0};
    }
    document.addEventListener('click',function(e){
      var hit=e.target.closest('#galleryGrid .gitem, #spaceGrid .gitem, .mcard .mc-img, .concept-figure'); if(!hit)return;
      if(hit.tagName==='A') return;                 // 링크가 걸린 항목은 링크 우선
      var media=hit.querySelector('img,video'); if(!media)return;
      e.preventDefault(); var r=buildList(hit); lbList=r.list; lbShow(r.idx); lb.classList.add('open'); document.body.style.overflow='hidden';
    });
    lb.addEventListener('click',function(e){
      if(e.target.classList.contains('lb-prev')){lbShow(lbIdx-1);return;}
      if(e.target.classList.contains('lb-next')){lbShow(lbIdx+1);return;}
      if(e.target===lb||e.target.classList.contains('lb-close'))lbClose();
    });
    document.addEventListener('keydown',function(e){
      if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')lbClose();
      else if(e.key==='ArrowLeft')lbShow(lbIdx-1);
      else if(e.key==='ArrowRight')lbShow(lbIdx+1);
    });
  }
  // 3-1) 영상 호버 동작 (라이트박스 영상은 제외)
  //   PLAY_ON_HOVER: 카드(갤러리·공간·마퀴) + 컨셉 단일영상(자동재생 off) → 호버 시 재생 / 벗어나면 정지
  //   PAUSE_ON_HOVER: 컨셉 자동재생/순차영상 → 호버 시 정지 / 벗어나면 재생
  var PLAY_ON_HOVER='#galleryGrid video, #spaceGrid video, #spaceMarquee video, .concept-figure video[data-hover="play"]';
  var PAUSE_ON_HOVER='.concept-figure video[data-hover="pause"]';
  document.addEventListener('mouseover',function(e){
    var p=e.target.closest&&e.target.closest(PLAY_ON_HOVER); if(p){p.muted=true;try{p.play();}catch(_){}}
    var q=e.target.closest&&e.target.closest(PAUSE_ON_HOVER); if(q){try{q.pause();}catch(_){}}
  });
  document.addEventListener('mouseout',function(e){
    var p=e.target.closest&&e.target.closest(PLAY_ON_HOVER); if(p){try{p.pause();}catch(_){}}
    var q=e.target.closest&&e.target.closest(PAUSE_ON_HOVER); if(q){try{q.play();}catch(_){}}
  });
  // 4) 스크롤: 420px 이후 모바일 하단 CTA · 맨 위로 노출 / 협력업체 띠는 0→260px 동안 opacity 1→0, translateY 0→16px
  var mcta=document.getElementById('mcta'), fab=document.getElementById('topFab'), partners=document.getElementById('partners');
  var onScroll=function(){
    var y=window.scrollY||window.pageYOffset||0, v=y>420;
    if(mcta)mcta.classList.toggle('show',v);
    if(fab)fab.classList.toggle('show',v);
    if(partners){ var f=Math.round(Math.max(0,1-y/260)*20)/20; partners.style.opacity=f; partners.style.transform='translateY('+((1-f)*16)+'px)'; }
  };
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
}
initEffects();
/* 로고 오른쪽에 버전 배지 표시 */
(function(){var b=document.querySelector('header .brand'); var v=window.LS_VERSION||''; if(!b||!v)return;
  var s=document.createElement('span'); s.className='ver-badge'; s.textContent=v; b.appendChild(s);})();
(function(){ var s=''; try{ s=localStorage.getItem('ls_lang')||''; }catch(e){}
  setLang(I18N[s]?s:'vi'); })();   // 저장된 언어, 없으면 기본 베트남어 (모든 정의 이후 호출 — TDZ 회피)

