# Cursor prompt — 공개 analytics 카탈로그에 상세·다운로드 metric 추가

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. metric 코드·group·menuCode는 이 문서만 사용하라.

질문이 필요하면 기존 metric 정의 테이블·카탈로그 로더가 이 4개 코드를 넣을 수 없을 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/public-analytics-metric-catalog-backend-cursor-prompt-2026-09-26.md`

시드 수치는 별도 문서다. 이 문서에서 `homepage_metric_daily` 행을 넣지 마라.

`apps/admin/docs/api/statistics-platform-seed-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 Platform FE 기준)

Platform은 이미 아래를 호출한다. 인증 없음. 쿠키는 `withCredentials`.

| Method | Path | 용도 |
|--------|------|------|
| POST | `/api/public/analytics/sessions` | 방문자 세션. 쿠키 `ja_homepage_session` |
| POST | `/api/public/analytics/events` | body `{ "metricCode": "..." }` |
| GET | `/api/public/analytics/catalog` | 허용 metric 목록 |
| GET | `/api/admin/statistics/visitors` | Admin 방문자 통계 |
| GET | `/api/admin/statistics/menus` | Admin 메뉴별 조회 |

세션·목록 조회·이미 카탈로그에 있는 페이지 metric은 **동작한다.** 바꾸지 마라.

로컬에서 확인한 사실:

- `POST /sessions` → **200** `{"counted":true,"ttlSeconds":1800}`
- `Set-Cookie: ja_homepage_session=...; Path=/; Max-Age=1800; HttpOnly; SameSite=Lax`  
  **Domain 속성 없음.** Vite(5173) → 8081 프록시에서 쿠키가 유지된다. `Domain=localhost:8081` 로 고정하면 브라우저가 쿠키를 버린다.
- 카탈로그에 있는 코드 `POST /events` → **204**
- 카탈로그에 없는 코드 → **400** `{"code":"VALIDATION_ERROR","message":"metricCode is not client-trackable."}`

Platform이 이미 보내는 코드 중 **4개가 카탈로그에 없다.** 그래서 공지 상세, 임팩트 상세, 연차·회계 다운로드는 DB에 안 쌓이고 Admin 해당 칸이 0이다.

Admin 메뉴 통계 매퍼가 기대하는 코드와 같다. 이름·group enum을 새로 짓지 마라. OpenAPI group은 이미 `VISITOR | PAGE | POST | OUTBOUND_CLICK | FILE_DOWNLOAD` 이다.

---

## Goal

아래 4개를 **client-trackable** metric으로 등록한다. `GET /catalog`에 나오고, `POST /events`가 **204**이며, 집계가 `GET /api/admin/statistics/menus`의 해당 메뉴 `metrics[].eventCount`에 포함된다.

| metricCode | group | topMenu | menuCode | Platform이 보내는 시점 |
|------------|-------|---------|----------|------------------------|
| `JA_KOREA_NOTICE_DETAIL_VIEW` | `POST` | `JA_KOREA` | `JA_NOTICE` | `/notices/:noticeId` 진입 |
| `IMPACT_STORY_DETAIL_VIEW` | `POST` | `IMPACT_STORY` | `IMPACT_STORY` | `/impact/:storyId` 진입 |
| `JA_TRANSPARENCY_ANNUAL_REPORT_DOWNLOAD` | `FILE_DOWNLOAD` | `JA_KOREA` | `JA_TRANSPARENCY` | 연차보고서 다운로드 클릭 |
| `JA_TRANSPARENCY_AUDIT_REPORT_DOWNLOAD` | `FILE_DOWNLOAD` | `JA_KOREA` | `JA_TRANSPARENCY` | 회계감사 보고서 다운로드 클릭 |

같은 메뉴의 기존 코드와 menuCode를 맞춘다.

- 공지 목록 `JA_KOREA_NOTICE_LIST_VIEW` 가 `JA_NOTICE` 이면 상세도 `JA_NOTICE`
- 임팩트 목록 `IMPACT_STORY_LIST_VIEW` 가 `IMPACT_STORY` 이면 상세도 `IMPACT_STORY`
- 연차 목록 `JA_TRANSPARENCY_ANNUAL_REPORT_LIST_VIEW` 가 `JA_TRANSPARENCY` 이면 다운로드도 `JA_TRANSPARENCY`

`GET /menus`는 metricCode별 `eventCount`를 주면 된다. Admin은 코드 문자열로 합산한다. 응답 필드명을 바꾸지 마라.

완료 조건:

```bash
curl -sS 'http://localhost:8081/api/public/analytics/catalog' \
  | python3 -c 'import json,sys; codes={i["metricCode"] for i in json.load(sys.stdin)}; need={"JA_KOREA_NOTICE_DETAIL_VIEW","IMPACT_STORY_DETAIL_VIEW","JA_TRANSPARENCY_ANNUAL_REPORT_DOWNLOAD","JA_TRANSPARENCY_AUDIT_REPORT_DOWNLOAD"}; missing=need-codes; print("missing", sorted(missing) or "none")'

for code in JA_KOREA_NOTICE_DETAIL_VIEW IMPACT_STORY_DETAIL_VIEW JA_TRANSPARENCY_ANNUAL_REPORT_DOWNLOAD JA_TRANSPARENCY_AUDIT_REPORT_DOWNLOAD; do
  curl -sS -o /dev/null -w "$code %{http_code}\n" \
    -X POST 'http://localhost:8081/api/public/analytics/events' \
    -H 'Content-Type: application/json' \
    -d "{\"metricCode\":\"$code\"}"
done
```

- catalog에 4개 모두 존재. group·topMenu·menuCode는 위 표와 같다.
- 각 `POST /events` 는 **204**.
- 그 날짜 범위로 `GET /api/admin/statistics/menus?from=오늘&to=오늘` 을 하면 해당 `metricCode`의 `eventCount`가 1 이상이다. (방금 POST 1회분. 시드 수치와 섞지 말고, 시드는 다음 문서.)
- 알 수 없는 코드는 지금처럼 **400** `VALIDATION_ERROR` / `metricCode is not client-trackable.` 이다. 500으로 바꾸지 마라.

---

## 유지 (회귀 금지)

이미 되는 계약을 고치지 마라.

1. `POST /sessions` 200, body `counted`(boolean), `ttlSeconds`(초).
2. `Set-Cookie` 이름 `ja_homepage_session`. `Path=/`, `HttpOnly`, `SameSite=Lax`. **Domain을 8081 포트에 고정하지 마라.**
3. 같은 쿠키로 TTL 안에 다시 `POST /sessions` 하면 `counted`는 false여도 된다. 쿠키를 지우지 마라.
4. 카탈로그에 이미 있는 30개 코드는 삭제·rename 하지 마라. Platform이 지금은 안 보내는 코드도 남겨라.
   - 예: `JA_DIRECTIONS_VIEW`, `JA_KOREA_HOME_VIEW`, `IMPACT_STORY_HOME_VIEW`, `EDUCATION_HOME_VIEW`, `PARTICIPATION_HOME_VIEW`, `PARTICIPATION_RESULT_VIEW`, `SPONSORSHIP_HOME_VIEW`
   - 오시는 길·홈·결과 확인은 Admin 메뉴 통계 템플릿에 행이 없거나 비활성이다. 백엔드가 코드를 지워서 맞추지 마라.
5. `GET /api/admin/statistics/visitors` · `menus` 의 query(`unit`, `from`, `to`)와 응답 필드명을 바꾸지 마라.
6. path를 새로 만들지 마라. `/visits`, `/page-views` 같은 별도 수집 API는 없다.

---

## Out of scope / 금지

- `homepage_metric_daily` 에 QA용 고정 건수를 넣는 작업. 시드 문서가 한다.
- Admin·Platform 프론트 수정.
- prod Flyway가 앱 기동마다 이 정의를 중복 insert 하지 않게. 정의 추가는 idempotent (코드당 1행).
- metricCode 철자 변경. Admin 매퍼와 Platform 전송 문자열이 이 문서와 같아야 한다.

---

## 검증

- [ ] catalog 4코드, group·topMenu·menuCode 일치
- [ ] 4코드 `POST /events` → 204
- [ ] 없는 코드 `NOT_A_REAL_METRIC` → 400, body `code=VALIDATION_ERROR`
- [ ] `POST /sessions` Set-Cookie에 `Domain=` 없음, `Path=/`, `SameSite=Lax`
- [ ] 기존 `JA_ORGANIZATION_VIEW` POST는 계속 204

**Last updated:** 2026-09-26
