#!/usr/bin/env python3
"""리미널 스페이스 Supabase DB 전체 테이블을 JSON 파일로 백업.

키: 환경변수 SUPABASE_SERVICE_KEY 또는 ~/.liminal_backup_key 파일(service_role/secret 키 한 줄).
결과: <프로젝트>/backups/<YYYYMMDD-HHMM>/<테이블>.json  (backups/ 는 .gitignore 처리됨)
"""
import json, os, sys, shutil, time, urllib.request, urllib.error
from datetime import datetime
from pathlib import Path

URL = "https://euhuiktqoslmndozqpsr.supabase.co/rest/v1"
ROOT = Path(__file__).resolve().parent.parent / "backups"
KEEP_DAYS = 15  # 이보다 오래된 자동 백업 폴더는 삭제
PAGE = 1000     # PostgREST 기본 최대 행 수

key = os.environ.get("SUPABASE_SERVICE_KEY") or (Path.home() / ".liminal_backup_key").read_text().strip()
H = {"apikey": key, "Authorization": f"Bearer {key}"}


def get(path, extra=None):
    req = urllib.request.Request(URL + path, headers={**H, **(extra or {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


# ponytail: 고정 목록 — 새 테이블을 만들면 여기에 추가해야 백업됨
tables = ["applications", "branches", "site_info", "classes", "class_details", "default_slots",
          "schedule_slots", "schedule_days", "admin_accounts", "zalo_token", "zalo_log"]

out = ROOT / datetime.now().strftime("%Y%m%d-%H%M")
out.mkdir(parents=True, exist_ok=True)
summary = {}
for t in tables:
    rows = []
    while True:
        page = get(f"/{t}?select=*", {"Range": f"{len(rows)}-{len(rows) + PAGE - 1}"})
        rows += page
        if len(page) < PAGE:
            break
    (out / f"{t}.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
    summary[t] = len(rows)

if not summary.get("applications"):
    sys.exit(f"경고: applications 0건 — 키 권한 확인 필요 ({out})")

# 오래된 자동 백업 정리 (YYYYMMDD-HHMM 형식 폴더만; 수동 백업 폴더는 건드리지 않음)
cutoff = time.time() - KEEP_DAYS * 86400
for d in ROOT.glob("20??????-????"):
    if d != out and d.stat().st_mtime < cutoff:
        shutil.rmtree(d)

print(datetime.now().isoformat(timespec="seconds"), out.name, summary)
