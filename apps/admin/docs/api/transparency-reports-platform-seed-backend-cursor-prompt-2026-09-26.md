# Cursor prompt — 연차·회계감사 보고서 Platform SSOT DB 시드

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. 값·경로는 **이 문서만** 사용하라.  
질문이 필요하면 스키마·기존 Spec이 `createdAt` 갱신을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/transparency-reports-platform-seed-backend-cursor-prompt-2026-09-26.md`

운영원칙·수입지출·국세청 URL 시드는 별도 문서다. 이번 작업에서 그 테이블을 건드리지 마라.

`apps/admin/docs/api/transparency-platform-seed-backend-cursor-prompt-2026-09-26.md` §3-A 의 제목·파일명과 이 문서는 같다.  
**게시일(`createdAt`) SSOT 는 이 문서다.**

---

## SSOT

값의 기준은 Platform 보고서 목록이다.

| 화면 | URL |
|------|-----|
| 연차보고서 | `/about/transparency/annual-reports` |
| 회계감사 보고서 | `/about/transparency/audit-reports` |

Platform FE는 이미 remote only 다. mock fallback 없음.

| 화면 | Method | Path | FE가 보내는 쿼리 |
|------|--------|------|------------------|
| 연차 목록 | GET | `/api/public/ja-korea/transparency/reports/ANNUAL` | `q`(있으면), `page`(0-base), `size=8` |
| 회계감사 목록 | GET | `/api/public/ja-korea/transparency/reports/AUDIT` | `q`(있으면), `page`(0-base), `size=9` |
| 다운로드 | GET | `/api/public/ja-korea/transparency/reports/{id}/download` | — |
| Admin 목록 | GET | `/api/admin/ja-korea/transparency/reports/{type}` | `title` `attachmentFileName` `createdFrom` `createdTo` `page` `size` |

공개·Admin path는 **이미 있다.** 테이블·엔드포인트·OpenAPI를 새로 만들거나 바꾸지 마라.  
**OpenAPI fetch / Orval generate 하지 마라.**

화면이 응답에서 읽는 필드:

| 화면 | 응답 필드 |
|------|-----------|
| 카드 제목 | `title` |
| 다운로드 파일명 | `attachmentFileName` |
| 다운로드 | `downloadUrl` |
| 커버 이미지 | `thumbnailUrl` (있으면 이미지, 없으면 FE placeholder) |
| 회계감사 카드 하단 날짜 | `createdAt` → FE가 **Asia/Seoul 달력**으로 `YYYY년 MM월 DD일` |

FE가 DB에 없는 값으로 그리는 것 (시드 금지):

- 연차 커버 라벨 `{y}\nAnnual Report`, 기본 배경 `#00A0AF`
- 회계감사 커버 라벨 `{y}년\n외부 회계감사`, 그라디언트 3종
- 히어로 문구, 탭 라벨, 페이지 크기 8 / 9

연차 카드는 `createdAt` 을 **표시하지 않는다.** 회계감사 카드만 표시한다.

---

## 배경 (2026-09-26 로컬 확인)

무토큰 공개 GET은 이미 **ANNUAL 18 + AUDIT 18** 이고, 아래 제목·`attachmentFileName` 과 일치한다.  
`q=2024`(ANNUAL), `q=2012`(AUDIT) 도 각 1건이다.

갭은 **AUDIT `createdAt`** 이다.  
지금 값은 `2026-07-26T09:15:00Z` … `2026-09-15T09:15:00Z` 라서 카드가 `2026년 09월 15일` 처럼 나온다.  
Platform SSOT 는 보고 연도 `y` 에 대해 **`{y+1}년 05월 08일`** 이다.  
예: 2025년 보고서 → `2026년 05월 08일`.

Admin 수정 API(`ReportUpdateRequest`)에는 `createdAt` 이 없다.  
게시일은 **SQL로 컬럼을 직접 UPDATE** 하라. Admin PUT으로 맞추려 하지 마라.

---

## Goal

로컬/dev Homepage DB의 공개 보고서가 Platform 목록과 같다.

완료 조건:

1. `GET .../reports/ANNUAL?page=0&size=20` · `AUDIT` 각 **18건**. 제목·파일명이 아래 표와 **문자 단위 동일**. 정렬은 **최신 연도 먼저**.
2. AUDIT 각 행의 `createdAt` 을 Asia/Seoul 로 보면 달력 날짜가 **`{y+1}-05-08`**. 카드 문구는 `{y+1}년 05월 08일`.
3. ANNUAL `createdAt` 은 카드에 안 나온다. 목록 순서가 2025→2008 이면 **연차 createdAt 은 바꾸지 마라.**
4. `q=2024` (ANNUAL) → `2024 Annual Report JA Korea` **1건**. `q=2012` (AUDIT) → `2012년 외부 회계감사 보고서` **1건**.
5. 시드는 **idempotent**. 두 번 실행해도 행이 늘지 않는다. TRUNCATE 금지. 이 36건이 아닌 다른 published 보고서는 `published=false`. DELETE 하지 마라.
6. 기존 썸네일·PDF·`downloadUrl`·`downloadCount` 는 유지. 새 파일을 MinIO에 올리지 마라.
7. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL을 자동 실행하지 않는다.
8. Admin/Platform 프론트 파일은 수정하지 않는다.

```bash
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL?page=0&size=8'
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL?page=1&size=8'
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL?page=2&size=8'
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/AUDIT?page=0&size=9'
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/AUDIT?page=1&size=9'
curl -sS --get 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL' \
  --data-urlencode 'q=2024' --data-urlencode 'page=0' --data-urlencode 'size=10'
curl -sS --get 'http://localhost:8081/api/public/ja-korea/transparency/reports/AUDIT' \
  --data-urlencode 'q=2012' --data-urlencode 'page=0' --data-urlencode 'size=10'
```

AUDIT 날짜 검증 (서울 달력):

```bash
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/AUDIT?page=0&size=20' \
| python3 -c '
import json,sys
from datetime import datetime
from zoneinfo import ZoneInfo
data=json.load(sys.stdin)
items=data["items"]
assert data["totalCount"]==18, data["totalCount"]
seo=ZoneInfo("Asia/Seoul")
for it in items:
    y=int(it["title"][:4])
    seoul=datetime.fromisoformat(it["createdAt"].replace("Z","+00:00")).astimezone(seo).date()
    expect=__import__("datetime").date(y+1,5,8)
    assert seoul==expect, (it["title"], it["createdAt"], seoul, expect)
    assert it["attachmentFileName"]==f"{y}_external_audit_report_ja_korea.pdf"
print("AUDIT createdAt OK", len(items))
'
```

---

## Out of scope / 금지

- path·DTO 필드명·OpenAPI operation 변경.
- 공개 `q` 이름 변경, Admin 필터 쿼리명 변경.
- Admin PUT/POST 바디에 `createdAt` 추가.
- 연차 `createdAt` 을 감사와 같은 5월 8일로 덮어쓰기 (카드에 안 쓰이고, 순서가 이미 맞으면 유지).
- 썸네일 URL을 비우기. 커버 그라디언트·라벨을 DB 컬럼으로 추가.
- TRUNCATE / 보고서 DELETE / prod 마이그레이션.
- 운영원칙·수입지출·`disclosureUrl` 수정.
- 프론트 수정.

---

## 1. 매칭 키

스크립트 권장명: `scripts/seed_ja_transparency_reports_platform_local.sql`

행 식별: `report_type` + `attachment_file_name`.  
같은 파일명이 있으면 **UPDATE** (`title`, AUDIT이면 `created_at`). INSERT 는 그 파일명이 없을 때만.

`created_at` 컬럼 타입이 `timestamp` / `timestamptz` 어느 쪽이든, 공개 JSON을 Asia/Seoul 로 해석한 **달력 날짜**가 아래와 같으면 된다.

저장 권장값 (오프셋 유지 가능하면):

`{y+1}-05-08T00:00:00+09:00`

직렬화가 항상 `Z` 이면 같은 순간 `{y+1}-05-07T15:00:00Z` 도 된다.  
검증은 raw 문자열이 아니라 **서울 달력 날짜**로 하라.

---

## 2. ANNUAL 18건

연도 `y` = 2025 … 2008. 정렬은 최신 연도 먼저.  
`createdAt` 은 표시 필드가 아니다. 순서가 2025→2008 이면 그대로 둔다.

| y | title | attachmentFileName |
|--:|-------|--------------------|
| 2025 | `2025 Annual Report JA Korea` | `2025_annual_report_ja_korea.pdf` |
| 2024 | `2024 Annual Report JA Korea` | `2024_annual_report_ja_korea.pdf` |
| 2023 | `2023 Annual Report` | `2023_annual_report_ja_korea.pdf` |
| 2022 | `2022 Annual Report Junior Achievemnt Korea` | `2022_annual_report_ja_korea.pdf` |
| 2021 | `2021 Annual Report Junior Achievemnt Korea` | `2021_annual_report_ja_korea.pdf` |
| 2020 | `2020 Annual Report JA Korea` | `2020_annual_report_ja_korea.pdf` |
| 2019 | `2019 Annual Report EMPOWERING YOUTH` | `2019_annual_report_ja_korea.pdf` |
| 2018 | `2018 Annual Report JA Korea` | `2018_annual_report_ja_korea.pdf` |
| 2017 | `2017 Annual Report JA Korea` | `2017_annual_report_ja_korea.pdf` |
| 2016 | `2016 Annual Report JA Korea` | `2016_annual_report_ja_korea.pdf` |
| 2015 | `2015 Annual Report JA Korea` | `2015_annual_report_ja_korea.pdf` |
| 2014 | `2014 Annual Report JA Korea` | `2014_annual_report_ja_korea.pdf` |
| 2013 | `2013 Annual Report JA Korea` | `2013_annual_report_ja_korea.pdf` |
| 2012 | `2012 Annual Report JA Korea` | `2012_annual_report_ja_korea.pdf` |
| 2011 | `2011 Annual Report JA Korea` | `2011_annual_report_ja_korea.pdf` |
| 2010 | `2010 Annual Report JA Korea` | `2010_annual_report_ja_korea.pdf` |
| 2009 | `2009 Annual Report JA Korea` | `2009_annual_report_ja_korea.pdf` |
| 2008 | `2008 Annual Report JA Korea` | `2008_annual_report_ja_korea.pdf` |

`Junior Achievemnt` 철자는 원문 그대로다 (Achievement 로 고치지 마라).  
2023 제목에는 `JA Korea` 가 없다.

페이지: `size=8` 이면 `totalCount=18`, `totalPages=3`.  
1페이지 8건(2025…2018), 2페이지 8건(2017…2010), 3페이지 2건(2009, 2008).

---

## 3. AUDIT 18건

제목·파일명에 더해 **`createdAt` 을 반드시 UPDATE**.

| y | title | attachmentFileName | 서울 달력 (`createdAt`) | 카드 문구 |
|--:|-------|--------------------|-------------------------|-----------|
| 2025 | `2025년 외부 회계감사 보고서` | `2025_external_audit_report_ja_korea.pdf` | 2026-05-08 | `2026년 05월 08일` |
| 2024 | `2024년 외부 회계감사 보고서` | `2024_external_audit_report_ja_korea.pdf` | 2025-05-08 | `2025년 05월 08일` |
| 2023 | `2023년 외부 회계감사 보고서` | `2023_external_audit_report_ja_korea.pdf` | 2024-05-08 | `2024년 05월 08일` |
| 2022 | `2022년 외부 회계감사 보고서` | `2022_external_audit_report_ja_korea.pdf` | 2023-05-08 | `2023년 05월 08일` |
| 2021 | `2021년 외부 회계감사 보고서` | `2021_external_audit_report_ja_korea.pdf` | 2022-05-08 | `2022년 05월 08일` |
| 2020 | `2020년 외부 회계감사 보고서` | `2020_external_audit_report_ja_korea.pdf` | 2021-05-08 | `2021년 05월 08일` |
| 2019 | `2019년 외부 회계감사 보고서` | `2019_external_audit_report_ja_korea.pdf` | 2020-05-08 | `2020년 05월 08일` |
| 2018 | `2018년 외부 회계감사 보고서` | `2018_external_audit_report_ja_korea.pdf` | 2019-05-08 | `2019년 05월 08일` |
| 2017 | `2017년 외부 회계감사 보고서` | `2017_external_audit_report_ja_korea.pdf` | 2018-05-08 | `2018년 05월 08일` |
| 2016 | `2016년 외부 회계감사 보고서` | `2016_external_audit_report_ja_korea.pdf` | 2017-05-08 | `2017년 05월 08일` |
| 2015 | `2015년 외부 회계감사 보고서` | `2015_external_audit_report_ja_korea.pdf` | 2016-05-08 | `2016년 05월 08일` |
| 2014 | `2014년 외부 회계감사 보고서` | `2014_external_audit_report_ja_korea.pdf` | 2015-05-08 | `2015년 05월 08일` |
| 2013 | `2013년 외부 회계감사 보고서` | `2013_external_audit_report_ja_korea.pdf` | 2014-05-08 | `2014년 05월 08일` |
| 2012 | `2012년 외부 회계감사 보고서` | `2012_external_audit_report_ja_korea.pdf` | 2013-05-08 | `2013년 05월 08일` |
| 2011 | `2011년 외부 회계감사 보고서` | `2011_external_audit_report_ja_korea.pdf` | 2012-05-08 | `2012년 05월 08일` |
| 2010 | `2010년 외부 회계감사 보고서` | `2010_external_audit_report_ja_korea.pdf` | 2011-05-08 | `2011년 05월 08일` |
| 2009 | `2009년 외부 회계감사 보고서` | `2009_external_audit_report_ja_korea.pdf` | 2010-05-08 | `2010년 05월 08일` |
| 2008 | `2008년 외부 회계감사 보고서` | `2008_external_audit_report_ja_korea.pdf` | 2009-05-08 | `2009년 05월 08일` |

규칙: 보고 연도 `y` → 게시일 연도는 **`y+1`**, 월·일은 **05월 08일**.  
「년」이 빠진 옛 제목(`2025 외부 회계감사 보고서`)은 「년」 포함으로 UPDATE.

이 시각은 연도 내림차순이므로 `created_at DESC` 정렬이어도 2025→2008 이 유지된다.  
지금처럼 전 행이 2026-08~09 이면 **실패**다.

페이지: `size=9` 이면 `totalCount=18`, `totalPages=2`.  
1페이지 9건(2025…2017), 2페이지 9건(2016…2008).

---

## 4. Admin 회귀 (변경 없음 · 확인만)

시드 후 Admin JWT로:

```bash
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/reports/AUDIT?title=2024&page=0&size=20'
```

- 200. 제목에 `2024년` 포함 1건 이상.
- path·쿼리명(`title`, `attachmentFileName`, `createdFrom`, `createdTo`)은 그대로.
- Admin 목록의 등록일도 같은 `createdAt` 을 본다. AUDIT 2024 행은 서울 기준 **2025-05-08** 이어야 한다.

---

## 회신 템플릿

```text
## 시드
- 스크립트:
- ANNUAL 18 제목·파일명 (createdAt 유지 여부):
- AUDIT 18 제목·파일명·서울 달력 2026-05-08 … 2009-05-08:
- 기존 썸네일/PDF 유지:

## 검증 curl
- ANNUAL size=8 totalCount 18 / totalPages 3:
- AUDIT size=9 totalCount 18 / totalPages 2:
- AUDIT createdAt 서울 날짜 assert:
- q=2024 ANNUAL / q=2012 AUDIT:
- admin AUDIT title=2024 (JWT):

## 하지 않은 일
- path·OpenAPI 변경 없음
- Admin PUT에 createdAt 추가 없음
- TRUNCATE/DELETE 없음
- prod 마이그레이션 없음
- 운영원칙·재정·국세청 URL 수정 없음
- 프론트 수정 없음
```

**Last updated:** 2026-09-26
