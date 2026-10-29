-- ============================================================
-- 기존 신청(applications)의 국적 자유입력값 → 코드로 일괄 정리
-- Supabase SQL Editor 에서 실행. 여러 번 실행해도 안전(이미 코드면 변화 없음).
-- 신규 신청은 드롭다운으로 이미 코드(VN 등) 저장됨.
-- ============================================================

-- (실행 전) 현재 값 분포 확인
select nationality, count(*) from public.applications group by 1 order by 2 desc;

-- 변형 라벨 → 코드 매핑으로 일괄 업데이트 (대소문자 무시)
update public.applications a
set nationality = m.code
from (values
  ('VN', array['vietnam','việt nam','việt nam (vietnam)','베트남','베트남 (vietnam)']),
  ('KR', array['korea','south korea','hàn quốc','대한민국','대한민국 (korea)']),
  ('JP', array['japan','nhật bản','일본','일본 (japan)']),
  ('CN', array['china','trung quốc','중국','중국 (china)']),
  ('TW', array['taiwan','đài loan','대만','대만 (taiwan)']),
  ('HK', array['hong kong','hồng kông','홍콩','홍콩 (hong kong)']),
  ('SG', array['singapore','싱가포르','싱가포르 (singapore)']),
  ('MY', array['malaysia','말레이시아','말레이시아 (malaysia)']),
  ('TH', array['thailand','thái lan','태국','태국 (thailand)']),
  ('ID', array['indonesia','인도네시아','인도네시아 (indonesia)']),
  ('PH', array['philippines','필리핀','필리핀 (philippines)']),
  ('IN', array['india','ấn độ','인도','인도 (india)']),
  ('US', array['usa','united states','미국','미국 (usa)']),
  ('CA', array['canada','캐나다','캐나다 (canada)']),
  ('GB', array['uk','united kingdom','anh','영국','영국 (uk)']),
  ('FR', array['france','pháp','프랑스','프랑스 (france)']),
  ('DE', array['germany','đức','독일','독일 (germany)']),
  ('IT', array['italy','ý','이탈리아','이탈리아 (italy)']),
  ('ES', array['spain','tây ban nha','스페인','스페인 (spain)']),
  ('NL', array['netherlands','hà lan','네덜란드','네덜란드 (netherlands)']),
  ('CH', array['switzerland','thụy sĩ','스위스','스위스 (switzerland)']),
  ('SE', array['sweden','thụy điển','스웨덴','스웨덴 (sweden)']),
  ('RU', array['russia','nga','러시아','러시아 (russia)']),
  ('AU', array['australia','úc','호주','호주 (australia)']),
  ('NZ', array['new zealand','뉴질랜드','뉴질랜드 (new zealand)']),
  ('BR', array['brazil','브라질','브라질 (brazil)']),
  ('MX', array['mexico','멕시코','멕시코 (mexico)']),
  ('AE', array['uae','아랍에미리트','아랍에미리트 (uae)']),
  ('SA', array['saudi arabia','사우디아라비아','사우디아라비아 (saudi arabia)']),
  ('TR', array['türkiye','turkey','튀르키예','튀르키예 (türkiye)']),
  ('OTHER', array['other','기타','기타 (other)'])
) as m(code, variants)
where lower(trim(a.nationality)) = any(m.variants);

-- (실행 후) 결과 확인
select nationality, count(*) from public.applications group by 1 order by 2 desc;
