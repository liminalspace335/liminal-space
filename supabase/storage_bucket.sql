-- ============================================================
-- 이미지/영상 업로드용 Storage 버킷 생성 — "새 Supabase 프로젝트" SQL Editor에서 1회 실행
-- ("Bucket not found" 오류 해결용. 스키마 SQL은 테이블만 만들고 버킷은 따로 만들어야 함.)
-- ============================================================

-- 1) 공개 버킷 'images' 생성(이미 있으면 public=true로 갱신)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- 2) 접근 정책: 누구나 읽기 + anon 업로드/수정/삭제 (간단 비밀번호 모드와 동일한 공개 정책)
drop policy if exists "images public read"  on storage.objects;
drop policy if exists "images anon insert"  on storage.objects;
drop policy if exists "images anon update"  on storage.objects;
drop policy if exists "images anon delete"  on storage.objects;

create policy "images public read" on storage.objects
  for select using ( bucket_id = 'images' );

create policy "images anon insert" on storage.objects
  for insert with check ( bucket_id = 'images' );

create policy "images anon update" on storage.objects
  for update using ( bucket_id = 'images' ) with check ( bucket_id = 'images' );

create policy "images anon delete" on storage.objects
  for delete using ( bucket_id = 'images' );
