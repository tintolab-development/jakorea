# Cursor prompt — 통계 시드 (Platform이 기록하는 metric)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. 날짜·metricCode·건수는 이 문서만 사용하라.

질문이 필요하면 `homepage_metric_daily` 컬럼명·유니크 키가 이 문서의 upsert와 다를 때만 하라. 컬럼을 새로 만들지 말고 기존 컬럼에 매핑하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/statistics-platform-seed-backend-cursor-prompt-2026-09-26.md`

카탈로그에 없는 4개 코드는 **먼저** 아래 문서를 적용한 뒤에 시드하라. 정의가 없으면 INSERT가 깨지거나 집계에서 빠진다.

`apps/admin/docs/api/public-analytics-metric-catalog-backend-cursor-prompt-2026-09-26.md`

값의 기준은 Platform이 실제로 `POST /api/public/analytics/events` 로 보내는 코드다.

- 페이지 진입: `apps/platform/src/features/analytics/lib/route-metrics.ts`
- 클릭: `apps/platform/src/features/analytics/lib/click-metrics.ts`

Admin mock은 SSOT가 아니다.

- `apps/admin/src/features/visitor-stats/api/store.ts` 의 `MONTHLY_TOTALS`(2022~2026-07, 월 수백만)를 넣지 마라.
- `apps/admin/src/features/menu-view-stats/api/store.ts` 의 9·15·요약 `20/0/0/9/15` 를 넣지 마라.
- `apps/admin/docs/api/statistics-dummy-seed-backend-request.md` 와 `scripts/seed_statistics_local.sql` 의 2026-07-01 앵커를 **다시 실행하지 마라.**

테이블은 기존 `homepage.homepage_metric_daily` 이다. 엔드포인트를 새로 만들지 마라.

---

## 배경

| 화면 | Method | Path |
|------|--------|------|
| Admin 방문자 | GET | `/api/admin/statistics/visitors?unit=DAY&from=&to=` |
| Admin 메뉴별 조회 | GET | `/api/admin/statistics/menus?from=&to=` |
| 방문자 적재 | — | `metric_code = VISITOR_SESSION_START` |
| 메뉴 적재 | — | 아래 metric 코드. 일 건수 |

Admin은 `from`~`to`에 포함된 날짜만 합산한다. 이 시드의 메뉴 앵커는 **2026-09-26** 하루다. QA는 기간을 그 날짜로 잡는다. 2026-07-01을 포함하면 예전 mock 스케일이 같이 보인다.

로컬에서 오늘 실제 클릭으로 이미 올라간 건수가 있을 수 있다. 이 시드는 그 날짜·코드의 건수를 **아래 표의 절대값으로 덮어쓴다.** 다른 날짜·다른 코드는 건드리지 마라.

---

## Goal

1. `2026-09-26` 에 아래 메뉴 metric 건수가 표와 같다.
2. `2026-09-01` ~ `2026-09-26` 의 `VISITOR_SESSION_START` 일 건수가 표와 같다. 9월 합은 **351**.
3. 시드는 **idempotent**. 두 번 실행해도 같은 날짜·같은 코드의 행이 늘지 않고 건수만 표와 같다. TRUNCATE 금지. 다른 날짜 DELETE 금지.
4. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 시드를 자동 실행하지 않는다.
5. Platform이 보내지 않는 카탈로그 코드는 이 앵커 날짜에 **넣지 마라.**  
   `JA_KOREA_HOME_VIEW`, `JA_DIRECTIONS_VIEW`, `IMPACT_STORY_HOME_VIEW`, `EDUCATION_HOME_VIEW`, `PARTICIPATION_HOME_VIEW`, `PARTICIPATION_RESULT_VIEW`, `SPONSORSHIP_HOME_VIEW`

### 메뉴 metric — 날짜 `2026-09-26` 하루

건수는 Admin 칸을 눈으로 구분하려고 붙인 QA 값이다. Platform 화면의 문장·인원 수가 아니다.

| metricCode | 건수 | Platform |
|------------|------|----------|
| `JA_ORGANIZATION_VIEW` | 11 | `/about/introduction` |
| `JA_TRANSPARENCY_VIEW` | 12 | `/about/transparency` |
| `JA_TRANSPARENCY_ANNUAL_REPORT_LIST_VIEW` | 13 | `/about/transparency/annual-reports` |
| `JA_TRANSPARENCY_ANNUAL_REPORT_DOWNLOAD` | 14 | 연차 다운로드 클릭 |
| `JA_TRANSPARENCY_AUDIT_REPORT_LIST_VIEW` | 15 | `/about/transparency/audit-reports` |
| `JA_TRANSPARENCY_AUDIT_REPORT_DOWNLOAD` | 16 | 회계감사 다운로드 클릭 |
| `JA_TRANSPARENCY_DISCLOSURE_OUTBOUND_CLICK` | 17 | 국세청 공시 클릭 |
| `JA_KOREA_NOTICE_LIST_VIEW` | 18 | `/notices` |
| `JA_KOREA_NOTICE_DETAIL_VIEW` | 19 | `/notices/:id` |
| `JA_PEOPLE_VIEW` | 21 | `/about/people` |
| `JA_HISTORY_VIEW` | 22 | `/about/history` |
| `JA_RECRUIT_VIEW` | 23 | `/about/careers` |
| `JA_RECRUIT_POST_VIEW` | 24 | `/about/careers/:id` |
| `IMPACT_STORY_LIST_VIEW` | 31 | `/impact` |
| `IMPACT_STORY_DETAIL_VIEW` | 32 | `/impact/:id` |
| `EDU_CAREER_VIEW` | 41 | `/education/career` |
| `EDU_ECONOMY_VIEW` | 42 | `/education/finance` |
| `EDU_ENTREPRENEURSHIP_VIEW` | 43 | `/education/entrepreneurship` |
| `EDU_DIGITAL_LITERACY_VIEW` | 44 | `/education/digital-literacy` |
| `EDU_MATERIAL_LIST_VIEW` | 45 | `/education/textbooks` |
| `PARTICIPATION_APPLY_VIEW` | 51 | `/programs` |
| `PARTICIPATION_ONLINE_CLICK` | 52 | GNB 온라인 학습 |
| `PARTICIPATION_ALUMNI_CLICK` | 53 | GNB Alumni |
| `DONATION_PERSONAL_VIEW` | 61 | `/support/individual` |
| `DONATION_OUTBOUND_CLICK` | 62 | 개인후원 외부 링크 |
| `DONATION_CORPORATE_VIEW` | 63 | `/support/corporate` |
| `SPONSOR_TALENT_VIEW` | 64 | `/support/talent` |

개인후원 Admin 칸은 `DONATION_PERSONAL_VIEW` + `DONATION_OUTBOUND_CLICK` 합이다. 시드 후 진입 수는 **123** 이어야 한다.

임팩트 진입은 `IMPACT_STORY_LIST_VIEW` 만 시드한다. `IMPACT_STORY_HOME_VIEW` 는 0이다. Admin 진입 수는 **31**, 게시글 수는 **32**.

### 방문자 — `VISITOR_SESSION_START`

| 날짜 | 건수 |
|------|------|
| `2026-09-01` | 1 |
| `2026-09-02` | 2 |
| … | 날짜의 일(day)과 같은 정수 |
| `2026-09-26` | 26 |

9월 합 `1+2+…+26 = 351`.  
`unit=MONTH&from=2026-09-01&to=2026-09-30` 의 9월 방문자 수는 **351**.  
`unit=DAY&from=2026-09-26&to=2026-09-26` 은 **26**.

이 구간 밖의 `VISITOR_SESSION_START` 는 수정하지 마라.

---

## Admin에서 보여야 하는 값

`GET /api/admin/statistics/menus?from=2026-09-26&to=2026-09-26`  
(그 날 다른 metric 행이 없다고 가정. 위 27개만 그 날짜에 있다.)

| Admin 칸 | 합산 코드 | 기대 수 |
|----------|-----------|---------|
| 기관 소개 진입 | `JA_ORGANIZATION_VIEW` | 11 |
| 투명경영 진입 | `JA_TRANSPARENCY_VIEW` | 12 |
| 연차보고서 조회 / 다운로드 | LIST 13 / DOWNLOAD 14 | 13 / 14 |
| 회계감사 조회 / 다운로드 | LIST 15 / DOWNLOAD 16 | 15 / 16 |
| 국세청 공시 이동 | `JA_TRANSPARENCY_DISCLOSURE_OUTBOUND_CLICK` | 17 |
| 공지 진입 / 게시글 | LIST 18 / DETAIL 19 | 18 / 19 |
| 함께하는 사람들 | `JA_PEOPLE_VIEW` | 21 |
| JA History | `JA_HISTORY_VIEW` | 22 |
| 채용 진입 / 게시글 | VIEW 23 / POST 24 | 23 / 24 |
| 임팩트 진입 / 게시글 | LIST 31 / DETAIL 32 | 31 / 32 |
| 진로취업 | `EDU_CAREER_VIEW` | 41 |
| 경제금융 | `EDU_ECONOMY_VIEW` | 42 |
| 기업가 정신 | `EDU_ENTREPRENEURSHIP_VIEW` | 43 |
| 디지털 리터러시 | `EDU_DIGITAL_LITERACY_VIEW` | 44 |
| 교재 소개 | `EDU_MATERIAL_LIST_VIEW` | 45 |
| 프로그램 신청 | `PARTICIPATION_APPLY_VIEW` | 51 |
| 온라인 학습 | `PARTICIPATION_ONLINE_CLICK` | 52 |
| Alumni | `PARTICIPATION_ALUMNI_CLICK` | 53 |
| 개인후원 진입 | PERSONAL 61 + OUTBOUND 62 | 123 |
| 기업후원 | `DONATION_CORPORATE_VIEW` | 63 |
| 재능기부 | `SPONSOR_TALENT_VIEW` | 64 |
| 결과 확인 | (없음, 비활성) | 0 |

상단 5메뉴 합은 그 날 해당 `topMenu` 아래 metric 합이다. `IMPACT_STORY_HOME_VIEW` 를 넣지 않았으므로 임팩트 합은 **63** (31+32).

JA Korea 합: `11+12+13+14+15+16+17+18+19+21+22+23+24 = 225`  
교육 합: `41+42+43+44+45 = 215`  
참여 합: `51+52+53 = 156`  
후원 합: `61+62+63+64 = 250`

---

## Out of scope / 금지

- 카탈로그에 metric 정의를 추가하는 작업. 앞 문서가 한다. 정의 없이 다운로드·상세 코드를 INSERT 하지 마라.
- `seed_statistics_local.sql` 재실행. 2022-01-01~2026-07-31 대량 방문자, 2026-07-01 메뉴 mock.
- Admin `store.ts` 수치 복제.
- 오시는 길·결과 확인·홈·마이페이지·인증 경로용 코드 시드.
- TRUNCATE, 전기간 DELETE, prod 자동 시드.
- Admin/Platform 프론트 수정.

---

## 검증

관리자 토큰으로:

```bash
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/statistics/visitors?unit=MONTH&from=2026-09-01&to=2026-09-30'

curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/statistics/visitors?unit=DAY&from=2026-09-26&to=2026-09-26'

curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/statistics/menus?from=2026-09-26&to=2026-09-26'
```

- [ ] 9월 방문자 합 351, 2026-09-26 일별 26
- [ ] 메뉴 응답에서 위 27개 `metricCode`의 `eventCount`가 표와 같다
- [ ] 같은 시드를 두 번 실행해도 건수가 2배가 되지 않는다
- [ ] `2026-07-01` 기존 행은 그대로다 (삭제하지 않음)
- [ ] `JA_DIRECTIONS_VIEW` · `PARTICIPATION_RESULT_VIEW` · `IMPACT_STORY_HOME_VIEW` 는 2026-09-26 건수가 0이거나 행이 없다

**Last updated:** 2026-09-26
