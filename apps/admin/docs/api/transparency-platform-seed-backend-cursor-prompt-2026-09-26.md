# Cursor prompt — Admin 투명경영 하위 전체 Platform SSOT DB 시드 (백엔드 전달)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. 값·경로는 **이 문서만** 사용하라.  
질문이 필요하면 스키마·기존 Spec이 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/transparency-platform-seed-backend-cursor-prompt-2026-09-26.md`

---

## 범위 — Admin 투명경영 하위 카테고리 전부

Admin GNB `투명경영` 그룹의 **3개 하위 메뉴 전부**를 시드 대상으로 한다. 하나만 맞추고 끝내지 마라.

| # | Admin 메뉴 | 라우트 | 화면 탭 / 버킷 | Admin API |
|---|------------|--------|----------------|-----------|
| 1 | 소개 및 운영원칙 관리 | `/ja-korea/principles` | intro + 원칙 5행 | `GET/PUT /api/admin/ja-korea/transparency/principles` |
| 2 | 수입&지출 관리 | `/ja-korea/income-expense` | 수입·지출 × 그래프·테이블 **4버킷** | `GET/PUT/POST/DELETE .../finance/{section}/{view}` |
| 3 | 보고서 및 공시 관리 | `/ja-korea/reports-disclosure` | 연차 / 회계감사 / 국세청 공시 | `.../reports/{type}` + `.../disclosure` |

수입&지출 Admin UI 쿼리 ↔ API path:

| Admin UI (`?section=&view=`) | API `{section}/{view}` |
|------------------------------|-------------------------|
| (default) 수입총계 · 그래프 | `INCOME/CHART` |
| `?view=table` | `INCOME/TABLE` |
| `?section=expense` | `EXPENSE/CHART` |
| `?section=expense&view=table` | `EXPENSE/TABLE` |

보고서 Admin UI 탭:

| `?tab=` | API |
|---------|-----|
| (default) 연차보고서 | `GET .../reports/ANNUAL` |
| `tab=audit` | `GET .../reports/AUDIT` |
| `tab=nts` | `GET/PUT .../disclosure` |

**SSOT:** Platform `/about/transparency` (+ 연차·감사 보고서 목록) 화면 데이터.  
Admin 예전 mock(짧은 운영원칙, 지출 표 8행·진로취업 8.5% 등)은 SSOT가 아니다.  
Admin·Platform FE는 Remote API만 쓴다(mock 없음). 시드 값을 프론트 상수로 복제하지 마라.

공개·Admin path는 **이미 있다.** 로컬/dev DB 문구·금액·색·보고서 제목만 Platform과 같게 맞춘다.  
새 테이블·path·OpenAPI 변경 금지. **OpenAPI fetch / Orval generate 하지 마라.**

---

## 공통 계약

| enum | 허용 값 |
|------|---------|
| `section` | `INCOME` \| `EXPENSE` |
| `view` | **`CHART`** \| `TABLE` (`GRAPH` 금지) |
| `type` | `ANNUAL` \| `AUDIT` |
| `expenseCategory` (TABLE만) | `DIRECT_PROGRAM` \| `OTHER` |

차트 색은 응답 `colorHex`. TABLE 행 `colorHex` 는 `null` 가능.  
`subText` / `introMainText` 는 DB에 **실제 개행** 저장. HTML `<br>` 금지.  
비율 `0.20` → JSON `0.2` 허용. 비교는 숫자.

공개 GET (Platform 검증용, 무토큰):

| Method | Path |
|--------|------|
| GET | `/api/public/ja-korea/transparency` |
| GET | `/api/public/ja-korea/transparency/reports/{type}?q&page&size` |
| GET | `/api/public/ja-korea/transparency/reports/{id}/download` |

아이콘·커버 그라디언트·그룹 라벨(`직접사업비` 등)·페이지 배경은 **프론트 고정**. DB에 넣지 마라.

---

## Goal

로컬/dev DB가 Admin 투명경영 **하위 3메뉴 전부**와 Platform 공개 화면에서 동일 문구·금액·색·제목을 보여 준다.

완료 조건:

1. **운영원칙:** Admin JWT `GET .../principles` 와 공개 GET의 intro·5 principles가 아래와 문자 단위 동일.
2. **수입&지출:** 4버킷 모두 아래 행 수·금액·비율·색. Admin JWT로 `INCOME/CHART`·`INCOME/TABLE`·`EXPENSE/CHART`·`EXPENSE/TABLE` 각각 확인. 응답 `view` 는 **`CHART`**(그래프 버킷).
3. **보고서:** ANNUAL 18 + AUDIT 18. 제목·attachmentFileName 규칙 준수. 최신 연도 먼저.
4. **국세청:** Admin JWT `GET .../disclosure` 의 URL이 아래 `disclosureUrl` 과 동일.
5. 공개 `q=2024`(ANNUAL) → `2024 Annual Report JA Korea` 1건.
6. 시드 **idempotent**. TRUNCATE 금지. 불필요 published 보고서는 `published=false`(DELETE 금지).
7. **local/dev 전용.** prod Flyway·기동 자동 실행 금지.
8. 프론트 수정 금지.

```bash
# 공개 (Platform)
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency'
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL?page=0&size=20'
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/AUDIT?page=0&size=20'
curl -sS --get 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL' \
  --data-urlencode 'q=2024' --data-urlencode 'page=0' --data-urlencode 'size=10'

# Admin (하위 3메뉴 — JWT 필수)
TOKEN='<admin-jwt>'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/principles'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/finance/INCOME/CHART'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/finance/INCOME/TABLE'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/finance/EXPENSE/CHART'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/finance/EXPENSE/TABLE'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/reports/ANNUAL?page=0&size=20'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/reports/AUDIT?page=0&size=20'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/disclosure'
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/ja-korea/transparency/reports/ANNUAL?title=2024&page=0&size=20'
```

Admin UI 수동 확인 (로그인 후):

- `/ja-korea/principles`
- `/ja-korea/income-expense` · `?view=table` · `?section=expense` · `?section=expense&view=table`
- `/ja-korea/reports-disclosure` · `?tab=audit` · `?tab=nts`

---

## Out of scope / 금지

- path·DTO·OpenAPI 변경.
- `view=GRAPH` 저장·응답.
- Admin 보고서 필터 쿼리명 변경 (`title` / `attachmentFileName` / `createdFrom` / `createdTo`).
- 공개 `q` 제거·이름 변경.
- 새 테이블 / TRUNCATE / 보고서 DELETE / prod 마이그레이션.
- 하위 3메뉴 중 일부만 시드하고 나머지를 예전 mock 값으로 방치.
- 시드 값을 프론트에 하드코딩하라고 요청.
- 썸네일/PDF 신규 MinIO 업로드 **필수 아님** — 제목·`attachmentFileName`만 필수. 파일 없으면 placeholder URL 유지.

---

## 1. 소개 및 운영원칙 관리

스크립트 권장명: `scripts/seed_ja_transparency_platform_local.sql`  
기존 짧은 문장 시드로 실행하지 마라.

### intro

| 필드 | 값 |
|------|-----|
| `introSubText` | `투명한 운영으로 신뢰를 이어갑니다.` |
| `introMainText` | `JA Korea는 청소년의 미래를 지원하는 글로벌 교육 NGO로서\n신뢰를 바탕으로 투명하고 정직하게 운영합니다.` |

`\n` = 실제 개행 1개.

### principles (`displayOrder` 1…5, 모두 enabled)

| order | title | subText (개행 포함) |
|------:|-------|---------------------|
| 1 | 엄격한 회계 투명성과 독립적 외부 감사 | `JA Korea는 JA 회원국으로서 대한민국의 법률과 규정, 그리고 JA Worldwide 회원국 규정을 준수합니다.\n매년 신뢰성과 독립성을 갖춘 공인회계법인을 통해 회계 감사를 정기적으로 진행하고, 그 결과를 명확하게 공개합니다.` |
| 2 | 건전한 거버넌스와 책임 있는 이사회 운영 | `JA Korea는 기관의 발전을 도모하고 공정한 의사결정을 내릴 수 있도록 연 2회 이상의 정기 이사회를 개최합니다.\n검증된 기준에 따라 의장과 5인 이상의 이사진으로 구성된 이사회를 운영하며, 모든 회의 내용을 철저히 기록하고 보관함으로써 대내외적 책임 경영을 실천합니다.` |
| 3 | 잠재적 이해상충 방지 및 개인정보 보호 | `JA Korea의 모든 임직원과 이사진은 개인이나 특정 집단의 이해관계가 조직의 독립적인 판단과 공익성에 영향을 미치지 않도록 하고 있습니다.\n또한 「개인정보보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」을 준수하며 학생과 자원봉사자, 후원자의 개인정보를 철저하게 관리 및 보호합니다.` |
| 4 | 후원 목적의 철저한 준수 및 자산의 보호 | `JA Korea는 후원자와 파트너가 맡겨주신 소중한 후원금을 지정된 목적과 협약 내용에 맞게 충실히 집행합니다.\n기관의 모든 유형 및 무형 자산은 청소년 교육이라는 공익적 목적을 위해서만 정직하게 사용하고 보고합니다.` |
| 5 | 파트너십을 통한 사회적 영향력 확산 | `JA Korea는 파트너십과 협업을 통해 사회적 영향력을 건강하게 키워 나갑니다. 모든 협력 과정과 성과를 투명하게 소통하며,\n대내외 이해관계자 모두에게 정직하고 일관성 있는 메시지를 전달함으로써 우리 사회 전반에 지속가능한 교육적 가치를 확산합니다.` |

`item_code` / `icon_code` (`PRINCIPLE_1`…`5` 등) 유지. title·subText·order·enabled만 맞춤.

---

## 2. 수입&지출 관리 (4버킷)

버킷: `INCOME/CHART`, `INCOME/TABLE`, `EXPENSE/CHART`, `EXPENSE/TABLE`.  
요약 컬럼을 서버가 합산하면 항목만 맞추면 된다. 별도 저장이면 합계도 UPDATE.

### INCOME / CHART · TABLE (동일 3행, TABLE은 color 없어도 됨)

| order | itemName | ratio | amount | colorHex (CHART) |
|------:|----------|------:|-------:|------------------|
| 1 | 기업기부금 | 98.86 | 6609656834 | `#bbd153` |
| 2 | 사업외수익 | 0.95 | 63834713 | `#006b5e` |
| 3 | 개인기부금 | 0.18 | 12258719 | `#46b17b` |

총액: **6685750266**

### EXPENSE / CHART (6행) — Admin `?section=expense` 그래프

| order | itemName | ratio | amount | colorHex |
|------:|----------|------:|-------:|----------|
| 1 | 프로그램 운영비 | 94.46 | 5679666252 | `#2b6173` |
| 2 | 사무비 | 4.27 | 256937982 | `#01a1af` |
| 3 | 사업외비용 | 0.79 | 47338878 | `#4cd9e5` |
| 4 | 기획/홍보비 | 0.20 | 12239870 | `#95e8f0` |
| 5 | 기부모집및관리비 | 0.20 | 12049384 | `#e3e24f` |
| 6 | 이사회운영비 | 0.07 | 4492280 | `#e8574a` |

총액: **6012724646**  
6번: **`이사회운영비`** (공백 없음).

### EXPENSE / TABLE (10행) — Admin `?section=expense&view=table`

| order | expenseCategory | itemName | ratio | amount |
|------:|-----------------|----------|------:|-------:|
| 1 | DIRECT_PROGRAM | 프로그램 운영비 : 경제금융 | 6.02 | 361771007 |
| 2 | DIRECT_PROGRAM | 프로그램 운영비 : 진로취업 | 7.26 | 436479987 |
| 3 | DIRECT_PROGRAM | 프로그램 운영비 : 기업가정신 | 3.24 | 194772198 |
| 4 | DIRECT_PROGRAM | 프로그램 운영비 : 디지털리터러시 | 67.37 | 4050715525 |
| 5 | DIRECT_PROGRAM | 프로그램 운영비 : 인력 | 10.58 | 635927535 |
| 6 | DIRECT_PROGRAM | 이사회 운영비 | 0.07 | 4492280 |
| 7 | DIRECT_PROGRAM | 기부모집및관리비 | 0.20 | 12049384 |
| 8 | DIRECT_PROGRAM | 기획/홍보비 | 0.20 | 12239870 |
| 9 | OTHER | 사무비 | 4.27 | 256937982 |
| 10 | OTHER | 사업외비용 | 0.79 | 47338878 |

6번: **`이사회 운영비`** (공백 있음 — CHART 6번과 다름).

직접사업비: ratio **94.94**, amount **5708447786**  
이외: ratio **5.06**, amount **304276860**  
총액: **6012724646**

기존 8행 시드는 **이 10행으로 전부 교체**. 공개·Admin 응답에 옛 행이 남지 않게 upsert.

---

## 3. 보고서 및 공시 관리

### 3-A. 연차보고서 (ANNUAL) · 회계감사 보고서 (AUDIT)

연도 `y` = 2025 … 2008 (각 18건). 정렬 **최신 연도 먼저**.

#### ANNUAL

| y | title | attachmentFileName |
|--:|-------|--------------------|
| 2025 | `2025 Annual Report JA Korea` | `2025_annual_report_ja_korea.pdf` |
| 2024 | `2024 Annual Report JA Korea` | `2024_annual_report_ja_korea.pdf` |
| 2023 | `2023 Annual Report` | `2023_annual_report_ja_korea.pdf` |
| 2022 | `2022 Annual Report Junior Achievemnt Korea` | `2022_annual_report_ja_korea.pdf` |
| 2021 | `2021 Annual Report Junior Achievemnt Korea` | `2021_annual_report_ja_korea.pdf` |
| 2020 | `2020 Annual Report JA Korea` | `2020_annual_report_ja_korea.pdf` |
| 2019 | `2019 Annual Report EMPOWERING YOUTH` | `2019_annual_report_ja_korea.pdf` |
| 2018…2008 | `{y} Annual Report JA Korea` | `{y}_annual_report_ja_korea.pdf` |

`Junior Achievemnt` 철자 유지(Achievem**e**nt 아님).

#### AUDIT

| y | title | attachmentFileName |
|--:|-------|--------------------|
| 모든 y | `{y}년 외부 회계감사 보고서` | `{y}_external_audit_report_ja_korea.pdf` |

「년」 없는 옛 제목은 UPDATE. 썸네일·PDF 바이너리는 기존 local seed 재사용 가능.  
공개 download 계약 유지: `/api/public/ja-korea/transparency/reports/{id}/download`.

회계감사 카드 게시일은 이 표에 없다. `createdAt` 의 Asia/Seoul 달력 날짜가 `{y+1}년 05월 08일` 이어야 한다.  
제목만 맞추고 `createdAt` 을 2026-09 근처로 두면 화면 날짜가 틀린다.  
SSOT·검증 curl: `transparency-reports-platform-seed-backend-cursor-prompt-2026-09-26.md`.

### 3-B. 국세청 공시

`disclosureUrl`:

```
https://teht.hometax.go.kr/websquare/websquare.wq?w2xPath=/ui/sf/a/c/UTESFACJ01.xml&tmIdx=0&tm2lIdx=&tm3lIdx=
```

Admin `tab=nts` · Platform 투명경영 국세청 링크와 동일해야 한다.

---

## 회신 템플릿

```text
## 시드
- 스크립트:

## 1. 소개 및 운영원칙 (/ja-korea/principles)
- intro / principles 5:
- Admin GET principles:

## 2. 수입&지출 (/ja-korea/income-expense) 4버킷
- INCOME/CHART 3 · INCOME/TABLE 3:
- EXPENSE/CHART 6 · EXPENSE/TABLE 10:
- view 응답 CHART 여부:

## 3. 보고서 및 공시 (/ja-korea/reports-disclosure)
- ANNUAL 18 / AUDIT 18 제목·파일명:
- disclosureUrl:
- Admin title=2024 / 공개 q=2024:

## 하지 않은 일
- path·OpenAPI 변경 없음
- GRAPH 사용 없음
- TRUNCATE/DELETE 없음
- prod 마이그레이션 없음
- 프론트 수정 없음
- 하위 메뉴 누락 없음
```

**Last updated:** 2026-09-26
