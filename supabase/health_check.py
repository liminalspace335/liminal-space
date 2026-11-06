#!/usr/bin/env python3
"""리미널 스페이스 서버 운영 상태 점검 → 카카오톡 '나에게 보내기'용 메시지(보통 1통) 출력.

지난 오류 기록이 아니라 "지금 정상 운영 중인가"를 본다. 신청 등록·알림 발송 등 운영에 영향을 주는 동작은 하지 않음.

키: 환경변수 SUPABASE_SERVICE_KEY 또는 ~/.liminal_backup_key
출력: 보통 1통. 아주 길어질 때만 '-----' 줄로 나눠 여러 통.
  python3 supabase/health_check.py          실제 점검
  python3 supabase/health_check.py --demo   가짜 데이터로 자기검사 + 카톡 양식 샘플 출력

점검 항목 (날짜 기준: 베트남 시간)
  [접속]   1 예약 사이트·관리자 페이지 열림     2 고객 화면 데이터 조회(DB 응답)
  [신청]   3 앞으로 7일 예약 가능 자리          4 신청 접수 중(마지막 신청 시각)
           5 처리 대기 신청(24시간 이상)        6 다가오는 예약 초과 인원
           7 다가오는 예약 데이터 이상(빈 값·시간표 중복)
  [알림]   8 잘로 알림 서버·최근 발송 결과      9 잘로 토큰 상태      10 잘로 재알림 매일 작동
           11 메일 알림 서버·최근 확정메일 결과
  [DB]     12 매일 백업 정상
"""
import json, os, re, sys, time, urllib.error, urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

SUPA = "https://euhuiktqoslmndozqpsr.supabase.co/rest/v1"
FUNC = "https://euhuiktqoslmndozqpsr.functions.supabase.co"
SITE = "https://liminalspace335.github.io/liminal-space/"
ANON = "sb_publishable_FrEHlpTzQpDmBh8Z8_2o_w_CKQomC2A"  # config.js 의 공개 키 — 고객 브라우저와 같은 조건으로 조회
GH = "https://api.github.com/repos/liminalspace335/liminal-space/actions/workflows/db-backup.yml/runs?per_page=5"
VN = ZoneInfo("Asia/Ho_Chi_Minh")
INACTIVE = {"cancel", "refund", "refunddep"}  # 자리를 차지하지 않는 상태
# 카톡 나에게 보내기: 도구 설명은 200자지만 266자 한 통이 끝까지 정상 수신됨(2026-11-06 확인) → 한 통 기준을 넉넉히
LIMIT, SEP, TITLE = 1000, "-----", "[리미널 스페이스 주간 서버 점검]"
RED, YEL = "🔴", "🟡"


def probe(url, headers=None):
    """→ (상태코드, 걸린 초, 본문). 접속 자체가 안 되면 상태코드 0."""
    t = time.monotonic()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=20) as r:
            return r.status, time.monotonic() - t, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, time.monotonic() - t, ""
    except Exception as e:
        return 0, time.monotonic() - t, type(e).__name__


def fetch(now):
    key = os.environ.get("SUPABASE_SERVICE_KEY") or (Path.home() / ".liminal_backup_key").read_text().strip()
    h = {"apikey": key, "Authorization": f"Bearer {key}"}
    T = now.date().isoformat()
    T7 = (now + timedelta(days=7)).date().isoformat()
    W = (now - timedelta(days=7)).astimezone(ZoneInfo("UTC")).strftime("%Y-%m-%dT%H:%M:%SZ")

    def get(path):
        with urllib.request.urlopen(urllib.request.Request(f"{SUPA}/{path}", headers=h), timeout=60) as r:
            return json.load(r)

    d = {
        # 접속: 사이트·관리자·설정파일 / 고객 화면이 읽는 테이블(공개 키)
        "site": [probe(SITE), probe(SITE + "admin/"), probe(SITE + "config.js")],
        "anon": [probe(f"{SUPA}/{t}?select=*&limit=1", {"apikey": ANON, "Authorization": f"Bearer {ANON}"})
                 for t in ("branches", "classes", "schedule_slots", "applications_public")],
        # 알림 서버: 비밀값 없이 빈 요청 → 403/400 이면 살아 있음(아무것도 발송 안 됨).
        # zalo-remind 는 빈 요청에도 재알림을 보낼 수 있어 일부러 호출하지 않음.
        "func": {f: probe(f"{FUNC}/{f}") for f in ("zalo-notify", "confirm-mail", "app-notify")},
        "upcoming": get(f"applications?select=id,created_at,branch_id,class_id,want_date,want_time,people,name,phone,"
                        f"email,status,confirm_mail&want_date=gte.{T}&order=id"),
        # 최근 7일 신청 + 잘로 로그 → "보냈어야 했는데 안 보내진" 건 찾기
        "recent": get(f"applications?select=id,created_at,class_id,size,people,name,phone,msg,status,email,confirm_mail,"
                      f"zalo_send,zalo_send_err"
                      f"&created_at=gte.{W}&order=id"),
        "zlog": get(f"zalo_log?select=app_id,ok,detail&created_at=gte.{W}&order=id"),
        "last_app": get("applications?select=created_at&order=created_at.desc&limit=1"),
        "slots": get(f"schedule_slots?select=branch_id,sched_date,class_id,time,cap&sched_date=gte.{T}&order=id"),
        "classes": get("classes?select=id,inquiry_only,name_ko"),
        "conf": (get("site_info?id=eq.main&select=zalo_on,confirm_mail_on,zalo_remind_on,zalo_remind_last_sent_date")
                 or [{}])[0],
        "token": get("zalo_token?select=updated_at&refresh_token=not.is.null"),  # 토큰 값 자체는 받지 않음
        "T7": T7,
    }
    # 재알림 로그의 신청(예약일 기준이라 7일보다 오래된 신청일 수 있음) 전화번호
    ids = sorted({l["app_id"] for l in d["zlog"] if l.get("app_id")} - {a["id"] for a in d["recent"]})
    d["logapps"] = get(f"applications?select=id,phone&id=in.({','.join(map(str, ids))})") if ids else []
    try:
        with urllib.request.urlopen(GH, timeout=20) as r:
            d["backups"] = json.load(r)["workflow_runs"]
    except Exception:
        d["backups"] = None
    return d


INQUIRY_MSG = re.compile(r"^\s*\[(문의\s*내용|Inquiry|Liên hệ)\]")  # zalo-notify looksLikeInquiry 와 같은 규칙
CUSTOMER_SIDE = re.compile(r'"error":\s*-(118|108)\b')  # 잘로 미가입(-118)·번호 오류(-108) = 고객 쪽 사유, 서버 문제 아님
EMAIL_OK = re.compile(r"^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$")  # 고객이 "a", "." 같이 넣은 건 발송 대상 아님


def vn_phone(raw):
    """베트남 번호인가. 해외 번호는 잘로 발송이 제한되므로 '보냈어야 할 대상'에서 뺀다."""
    raw = (raw or "").strip()
    d = re.sub(r"\D", "", raw)
    if raw.startswith("+") or raw.startswith("00"):           # 국가번호 표기
        return (d[2:] if raw.startswith("00") else d).startswith("84")
    if d.startswith("84"):
        return len(d) in (11, 12)                              # 84 + 9자리 (또는 840 + 9자리)
    if d.startswith("0"):
        return len(d) == 10                                    # 베트남 국내 표기 0 + 9자리 (한국 010은 11자리)
    return len(d) == 9


def ts(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None


def md(date):  # '2026-11-12' → '11/12'
    return date[5:].replace("-", "/") if date else "?"


def ago(now, t):
    s = (now - t).total_seconds()
    return f"{int(s // 3600)}시간 전" if s < 172800 else f"{int(s // 86400)}일 전"


def check(d, now):
    """→ (문제 목록[(등급, 제목, 상세줄들)], 정상 항목 수, 요약 통계 문자열)"""
    T, HM = now.date().isoformat(), now.strftime("%H:%M")
    issues, ok = [], 0

    def add(level, title, details):
        nonlocal ok
        if details:
            issues.append((level, title, details))
        else:
            ok += 1

    def ppl(a):
        p = str(a.get("people") or "").strip()
        return int(p) if p.isdigit() else 1

    # 1 예약 사이트·관리자 페이지
    names = ("예약 사이트", "관리자 페이지", "사이트 설정파일")
    bad = [f"{n} 열리지 않음 (응답 {c or '없음'})" for n, (c, _, _) in zip(names, d["site"]) if c != 200]
    if d["site"][2][0] == 200 and "supabase.co" not in d["site"][2][2]:
        bad.append("설정파일에 DB 주소 없음 — 배포 확인")
    add(RED, "사이트 접속", bad)
    site_s = d["site"][0][1]

    # 2 고객 화면 데이터 조회 — 공개 키로 읽기가 막히면 예약 화면이 비어 보임
    tnames = ("지점", "클래스", "시간표", "예약현황")
    bad = [f"{n} 조회 실패 (응답 {c or '없음'})" for n, (c, _, _) in zip(tnames, d["anon"]) if c != 200]
    db_s = max(s for _, s, _ in d["anon"])
    add(RED, "고객 화면 데이터", bad or ([f"DB 응답 느림 {db_s:.1f}초"] if db_s > 3 else []))

    # 3 앞으로 7일 예약 가능 자리 (app.js 와 같은 기준: 날짜별로 연 시간만, 인원은 시간대 합계)
    inquiry = {c["id"] for c in d["classes"] if c.get("inquiry_only")}
    act = [a for a in d["upcoming"] if a.get("status") not in INACTIVE]
    booked = Counter((a.get("branch_id"), a.get("want_date"), a.get("want_time")) for a in act for _ in range(ppl(a)))
    caps = defaultdict(int)
    for s in d["slots"]:
        k = (s["branch_id"], s["sched_date"], s["time"])
        caps[k] = max(caps[k], s["cap"] or 0)
    week = {k: c for k, c in caps.items() if k[1] < d["T7"] and (k[1] > T or (k[2] or "") > HM)}
    free = sum(max(0, c - booked[k]) for k, c in week.items())
    days = len({k[1] for k, c in week.items() if c - booked[k] > 0})
    add(YEL, "예약 가능 자리 없음", [] if free else ["앞으로 7일 열린 시간 없음 — 시간표 설정 확인"])

    # 4 신청 접수 — 마지막 신청이 7일 넘게 없으면 예약 폼 고장 의심
    last = ts(d["last_app"][0]["created_at"]) if d["last_app"] else None
    add(YEL, "신청 접수", [f"마지막 신청 {ago(now, last) if last else '없음'} — 예약 폼 확인"]
        if not last or now - last > timedelta(days=7) else [])

    # 5 처리 대기 — '신규' 상태로 24시간 넘게 남은 다가오는 예약
    stale = [a for a in act if a.get("status") == "new" and ts(a.get("created_at"))
             and now - ts(a["created_at"]) > timedelta(hours=24)]
    add(YEL, "처리 대기 신청", [f"{md(a['want_date'])} {a.get('want_time') or '?'} {a.get('name') or '?'}" for a in stale])

    # 6 다가오는 예약 초과 인원
    add(RED, "초과예약", [f"{md(k[1])} {k[2]} 정원 {c}명 → {booked[k]}명" for k, c in sorted(caps.items(), key=str)
                       if booked[k] > c and k[1] >= T])

    # 7 다가오는 예약 데이터 이상 — 빈 값, 같은 시간표가 두 줄(저장 오류 흔적)
    bad = []
    for a in act:
        miss = [n for n, v in (("지점", a.get("branch_id")), ("클래스", a.get("class_id")), ("이름", a.get("name")),
                               ("연락처", a.get("phone") or a.get("email"))) if not v]
        if a.get("class_id") not in inquiry and not re.fullmatch(r"\d{2}:\d{2}", a.get("want_time") or ""):
            miss.append("시간")
        if miss:
            bad.append(f"신청 {a['id']} 빈 값: {','.join(miss)}")
    dup = Counter((s["branch_id"], s["sched_date"], s["time"], s["class_id"]) for s in d["slots"])
    bad += [f"시간표 {md(k[1])} {k[2]} {n}줄 중복" for k, n in sorted(dup.items(), key=str) if n > 1]
    add(YEL, "예약 데이터 이상", bad)

    conf = d["conf"]
    alive = lambda f: d["func"][f][0] in (200, 400, 401, 403, 405)
    recent = d["recent"]

    def tally(title, rows):
        """rows: 신청별 (구분, 사유) — 구분 = 정상/실제/고객/해당없음 → 신청 건수 기준 한 줄 요약"""
        c = Counter(k for k, _ in rows)
        why = lambda kind: "·".join(f"{w} {n}" for w, n in Counter(w for k, w in rows if k == kind).items())
        line = f"{title}: 정상 {c['정상']} / 실제 오류 {c['실제']} / 고객 오류 {c['고객']}"
        sub = [x for x in (why("고객"), f"해당없음: {why('해당없음')}" if c["해당없음"] else "") if x]
        return line + (f"\n └ {' / '.join(sub)}" if sub else "")

    # 8 잘로 알림 — 지난 7일 신청을 한 건씩 분류. 실제 오류(보냈어야 했는데 안 감)만 🔴
    #   고객 오류 = 해외번호·잘로 미가입·번호 오류 / 해당없음 = 문의·접수 직후(발송 중)
    zalo_txt = "잘로: 꺼짐"
    if conf.get("zalo_on") or conf.get("zalo_remind_on"):
        bad = [] if alive("zalo-notify") else [f"잘로 알림 서버 응답 없음 ({d['func']['zalo-notify'][0] or '접속 불가'})"]
        logged = {l.get("app_id") for l in d["zlog"]}
        skipped = {l.get("app_id") for l in d["zlog"] if "스킵" in (l.get("detail") or "")}
        rows = []
        if conf.get("zalo_on"):
            for a in recent:
                z, err = a.get("zalo_send"), a.get("zalo_send_err") or ""
                if a.get("class_id") in inquiry or INQUIRY_MSG.match(a.get("msg") or "") or a["id"] in skipped:
                    rows.append(("해당없음", "문의"))
                elif now - ts(a["created_at"]) < timedelta(minutes=10) and z != "sent":
                    rows.append(("해당없음", "발송 중"))
                elif not vn_phone(a.get("phone")):
                    rows.append(("고객", "해외번호"))
                elif z == "failed" and CUSTOMER_SIDE.search(err):
                    rows.append(("고객", "잘로 미가입" if "-118" in err else "번호 오류"))
                elif z == "sent":
                    rows.append(("정상", ""))
                else:
                    why = {"failed": "발송 실패", "pending": "재발송 대기에서 멈춤"}.get(
                        z, "발송 오류(결과 미기록)" if a["id"] in logged else "발송 시도 없음")
                    rows.append(("실제", why))
                    bad.append(f"{a.get('name') or '?'}({a['id']}) {why} {err[:30] if z == 'failed' else ''}".strip())
            zalo_txt = tally("잘로", rows)
        phone_of = {a["id"]: a.get("phone") for a in recent + d["logapps"]}
        rfail = [l for l in d["zlog"] if (l.get("detail") or "").startswith("REMIND:") and l.get("ok") is False
                 and "스킵" not in l["detail"] and not CUSTOMER_SIDE.search(l["detail"])
                 and vn_phone(phone_of.get(l.get("app_id")))]
        if rfail:
            bad.append(f"재알림 실패 {len(rfail)}건: {rfail[-1]['detail'][8:40]}")
        add(RED, "잘로 알림", bad)

        # 9 잘로 토큰 — 갱신 토큰은 약 3개월 유효, 오래 안 쓰면 만료
        if not d["token"]:
            add(RED, "잘로 토큰", ["갱신 토큰 없음 — 재발급 필요"])
        else:
            days_old = (now - ts(d["token"][0]["updated_at"])).days
            add(RED if days_old > 80 else YEL, "잘로 토큰", [f"마지막 갱신 {days_old}일 전 — 재발급 확인"] if days_old > 60 else [])

    # 10 잘로 재알림 — 매일 1회 보내는 예약 작업이 멈췄는지
    if conf.get("zalo_remind_on"):
        last_sent = conf.get("zalo_remind_last_sent_date") or ""
        yday = (now - timedelta(days=1)).date().isoformat()
        add(RED, "잘로 재알림 멈춤", [f"마지막 작동일 {last_sent or '없음'}"] if last_sent < yday else [])

    # 11 메일 알림(확정메일) — 지난 7일 신청을 한 건씩 분류
    #   고객 오류 = 이메일 미입력·잘못 입력 / 해당없음 = 확정 전·취소
    bad = [f"{n} 서버 응답 없음 ({d['func'][f][0] or '접속 불가'})"
           for f, n in (("app-notify", "신청 알림메일"), ("confirm-mail", "확정메일")) if not alive(f)]
    mail_txt = "메일: 꺼짐"
    if conf.get("confirm_mail_on"):
        rows = []
        for a in recent:
            e, cm = (a.get("email") or "").strip(), a.get("confirm_mail")
            if a.get("status") in INACTIVE:
                rows.append(("해당없음", "취소"))
            elif a.get("status") not in ("confirmed", "done"):
                rows.append(("해당없음", "확정 전"))
            elif not e:
                rows.append(("고객", "이메일 미입력"))
            elif not EMAIL_OK.match(e):
                rows.append(("고객", "이메일 잘못 입력"))
            elif cm == "sent":
                rows.append(("정상", ""))
            else:
                why = {"failed": "발송 실패", "pending": "대기에서 멈춤"}.get(cm, "안 감")
                rows.append(("실제", why))
                bad.append(f"{a.get('name') or '?'}({a['id']}) 확정메일 {why}")
        mail_txt = tally("메일", rows)
    add(RED, "메일 알림", bad)

    # 12 매일 백업 — 가장 최근 완료된 백업이 성공했고 하루 안쪽인지
    runs = d["backups"]
    done = [r for r in runs or [] if r.get("status") == "completed"]
    if runs is None:
        add(YEL, "백업 확인 불가", ["GitHub 조회 실패"])
        bk = "확인 불가"
    elif not done:
        add(YEL, "백업", ["백업 기록 없음"])
        bk = "기록 없음"
    else:
        r0, t0 = done[0], ts(done[0]["created_at"])
        okb = r0.get("conclusion") == "success" and now - t0 < timedelta(hours=30)
        add(RED, "백업", [] if okb else [f"마지막 백업 {ago(now, t0)} {'성공' if r0.get('conclusion') == 'success' else '실패'}"])
        bk = f"{ago(now, t0)} {'성공' if r0.get('conclusion') == 'success' else '실패'}"

    st = Counter(a.get("status") for a in recent)
    live = [a for a in recent if a.get("status") not in INACTIVE]
    cname = {c["id"]: c.get("name_ko") or "?" for c in d["classes"]}
    multi = len({a.get("class_id") for a in live if a.get("class_id") not in inquiry}) > 1
    prod = Counter()
    for a in live:   # 상품 = 용량(클래스가 여러 개면 클래스명+용량), 문의는 클래스명
        c = a.get("class_id")
        label = cname.get(c, "?") if c in inquiry or not a.get("size") else \
            (f"{cname.get(c, '?')[:10]} " if multi else "") + a["size"]
        prod[label] += ppl(a)
    key = lambda kv: (int(re.sub(r"\D", "", kv[0]) or 9999), kv[0])
    resv = (f"📋 예약 현황 (지난 7일)\n신청 {len(recent)}건 · 총 {sum(prod.values())}명\n"
            f"확정 {st['confirmed']} · 대기 {st['new']} · 완료 {st['done']} · 취소 {st['cancel'] + st['refund'] + st['refunddep']}\n"
            + " · ".join(f"{k} {n}명" for k, n in sorted(prod.items(), key=key)))
    notif = f"📨 알림 발송 (신청 {len(recent)}건)\n{zalo_txt}\n{mail_txt}\n\n💾 백업 {bk}"
    stats = [resv, notif]
    return issues, ok, stats


def fit(first, blocks, sep="\n\n", cont=None):
    """first 뒤에 blocks 를 200자 안에서 이어 붙이고, 넘치면 새 통으로. 한 블록은 갈라지지 않음."""
    msgs, cur = [], first
    for b in blocks:
        if len(cur) + len(sep) + len(b) > LIMIT:
            msgs.append(cur)
            cur = (cont + sep + b) if cont else b
        else:
            cur += sep + b
    return msgs + [cur]


def render(issues, ok, stats, now):
    head = f"{TITLE}\n{now:%m/%d}({'월화수목금토일'[now.weekday()]}) {now:%H:%M}"
    if not issues:
        return fit(f"{head}\n✅ 정상 운영 중 ({ok}개 항목)", stats)
    issues.sort(key=lambda i: i[0] != RED)
    r = sum(i[0] == RED for i in issues)
    top = f"{head}\n{RED} 오류 {r} · {YEL} 주의 {len(issues) - r} · 🟢 정상 {ok}\n"
    top += "".join(f"\n{lv} {title}" for lv, title, _ in issues)
    # 항목별 최대 4줄(줄당 32자) → 한 블록이 항상 한 통에 들어감
    blocks = ["\n".join([f"{lv} {title}"] + [f"· {x[:32]}" for x in det[:4]] +
                        ([f"· …외 {len(det) - 4}건 (관리자 화면 확인)"] if len(det) > 4 else []))
              for lv, title, det in issues]
    msgs = [top] + fit("🔎 상세", blocks, cont="🔎 상세 (계속)") + fit(stats[0], stats[1:])
    one = "\n\n".join(msgs)
    return [one] if len(one) <= LIMIT else msgs


def main():
    now = datetime.now(VN)
    try:
        msgs = render(*check(fetch(now), now), now)
    except Exception as e:  # 점검 자체가 실패해도 카톡은 가야 함
        msgs = [f"{TITLE}\n{now:%m/%d %H:%M}\n{RED} 점검 실패 — DB 접속 또는 조회 오류\n{type(e).__name__}: {str(e)[:80]}"]
    print(f"\n{SEP}\n".join(msgs))


def demo():
    now = datetime(2026, 11, 9, 8, 0, tzinfo=VN)
    iso = lambda hours: (now - timedelta(hours=hours)).isoformat()
    B, C = "br1", "cl1"
    slot = lambda dt, tm, cap=4: {"branch_id": B, "sched_date": dt, "class_id": C, "time": tm, "cap": cap}
    app = lambda i, dt, tm, ppl="2", status="confirmed", name="Anna", hrs=3, **kw: {
        "id": i, "created_at": iso(hrs), "branch_id": B, "class_id": C, "want_date": dt, "want_time": tm,
        "people": ppl, "name": name, "phone": "0773052174", "email": "a@b.co", "status": status,
        "confirm_mail": "sent", "zalo_send": "sent", "msg": "", "size": "30ml", **kw}
    up = (200, 0.4, 'url: "https://x.supabase.co"')
    # 잘로: 베트남 번호 발송 성공 + 해외번호 실패·문의 스킵은 오류 아님
    recent_ok = [app(11, "2026-11-12", "14:00"),
                 app(12, "2026-11-12", "14:00", phone="+82 10-1234-5678", zalo_send="failed"),   # 해외 → 제외
                 app(13, "2026-11-12", "14:00", phone="010-1234-5678", zalo_send="failed"),      # 한국 국내표기 → 제외
                 app(14, "2026-11-12", "14:00", msg="[Inquiry] 단체 문의", zalo_send=None),        # 문의 → 제외
                 app(15, "2026-11-12", "14:00", zalo_send=None, hrs=0.05),                        # 방금 들어옴 → 대기
                 app(18, "2026-11-12", "14:00", zalo_send="failed",
                     zalo_send_err='{"error":-118,"message":"Zalo account not existed"}')]          # 잘로 미가입 → 제외
    zlog_ok = [{"app_id": 12, "ok": False, "detail": '{"error":-108}'},
               {"app_id": 14, "ok": False, "detail": "문의(예약아님) — ZNS 스킵"},
               {"app_id": 99, "ok": False, "detail": "REMIND: {\"error\":-108}"}]                 # 해외번호 재알림 실패
    base = {"site": [up, up, up], "anon": [(200, 0.3, "")] * 4,
            "func": {f: (403, 0.2, "") for f in ("zalo-notify", "confirm-mail", "app-notify")},
            "slots": [slot("2026-11-12", "14:00"), slot("2026-11-12", "16:00"), slot("2026-11-13", "14:00")],
            "classes": [{"id": C, "inquiry_only": False, "name_ko": "Signature"}], "last_app": [{"created_at": iso(5)}],
            "conf": {"zalo_on": True, "confirm_mail_on": True, "zalo_remind_on": True, "zalo_remind_last_sent_date": "2026-11-08"},
            "token": [{"updated_at": iso(240)}], "recent": recent_ok, "zlog": zlog_ok,
            "logapps": [{"id": 99, "phone": "+1 415 555 0100"}], "T7": "2026-11-16",
            "backups": [{"status": "completed", "conclusion": "success", "created_at": iso(7)}]}

    assert vn_phone("+84 0773052174") and vn_phone("0773052174") and vn_phone("84773052174") and vn_phone("773052174")
    assert not vn_phone("+82 10-1234-5678") and not vn_phone("010-1234-5678") and not vn_phone("+1 415 555 0100")

    clean = {**base, "upcoming": [app(1, "2026-11-12", "14:00"), app(2, "2026-11-12", "16:00", "1", name="Minh"),
                                  app(3, "2026-11-12", "16:00", "1")],
             "recent": recent_ok + [app(20, "2026-11-12", "16:00", email="a", confirm_mail="failed")]}  # 이메일 오류 → 제외
    issues, ok, stats = check(clean, now)
    assert issues == [] and ok == 12, (issues, ok)
    z = "잘로: 정상 2 / 실제 오류 0 / 고객 오류 3\n └ 해외번호 2·잘로 미가입 1 / 해당없음: 문의 1·발송 중 1"
    assert z in stats[1], stats[1]
    assert "메일: 정상 6 / 실제 오류 0 / 고객 오류 1\n └ 이메일 잘못 입력 1" in stats[1], stats[1]
    assert "신청 7건 · 총 14명" in stats[0] and stats[0].endswith("30ml 14명"), stats[0]
    good = render(issues, ok, stats, now)

    bad = {**base,
           "upcoming": [app(1, "2026-11-12", "14:00", "3"), app(2, "2026-11-12", "14:00", "2", name="Minh"),  # 5 > 4
                        app(3, "2026-11-13", "14:00", "1", status="new", name="Hoa", hrs=30),           # 처리 대기
                        app(4, "2026-11-13", "14:00", "1", status="cancel"),                            # 취소는 무시
                        app(5, "2026-11-13", "14:00", "1", name="Lan", confirm_mail=None)],             # 확정메일 안 감
           "recent": recent_ok + [app(16, "2026-11-13", "14:00", name="Minh", zalo_send="failed", zalo_send_err="-124 token"),
                                  app(17, "2026-11-13", "14:00", name="Tuan", zalo_send=None),          # 시도 없음
                                  app(19, "2026-11-13", "14:00", name="Lan", confirm_mail=None)],       # 확정메일 안 감
           "conf": {**base["conf"], "zalo_remind_last_sent_date": "2026-11-01"},
           "backups": [{"status": "completed", "conclusion": "failure", "created_at": iso(7)}]}
    issues, ok, stats = check(bad, now)
    got = {t for _, t, _ in issues}
    assert got == {"초과예약", "처리 대기 신청", "잘로 알림", "잘로 재알림 멈춤", "메일 알림", "백업"}, got
    assert next(i for i in issues if i[1] == "초과예약")[2] == ["11/12 14:00 정원 4명 → 5명"]
    assert next(i for i in issues if i[1] == "잘로 알림")[2] == ["Minh(16) 발송 실패 -124 token", "Tuan(17) 발송 시도 없음"]
    assert "잘로: 정상 2 / 실제 오류 2 / 고객 오류 3" in stats[1] and "메일: 정상 8 / 실제 오류 1" in stats[1], stats[1]
    msgs = render(issues, ok, stats, now)
    assert all(len(m) <= LIMIT for m in good + msgs), [len(m) for m in good + msgs]

    print("=== 샘플 ① 정상 ===\n" + f"\n{SEP}\n".join(good))
    print("\n=== 샘플 ② 문제 있음 ===\n" + f"\n{SEP}\n".join(msgs))
    print("\n자기검사 통과 ✓")


if __name__ == "__main__":
    demo() if "--demo" in sys.argv else main()
