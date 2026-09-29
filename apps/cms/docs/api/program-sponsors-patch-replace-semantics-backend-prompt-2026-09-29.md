# Cursor prompt — `PATCH programs/{id}` `sponsors[]` 교체·담당자 해제 계약 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | JABACK |
| 주 API | `PATCH /api/admin/programs/{programId}` · `GET /api/admin/programs/{programId}/sponsors` |
| 대상 화면 | CMS 프로그램 상세 → 공통정보 → 후원사/담당자 수정 |
| 우선순위 | P0 — 저장 200인데 구 후원사·담당자가 남는 문제 |
| 작성일 | 2026-09-29 |
| 재현 환경 | 로컬 `http://localhost:8080` · 관리자 로그인 + MFA |

아래 지시는 **백엔드 레포 JABACK에서 실행**하라. 프론트 레포를 수정하지 마라.

---

## 1. FE 기대 계약 (현재 CMS wire)

CMS는 공통정보 저장 시 폼에 선택된 후원사·담당자만 `sponsors[]`로 보낸다.

```json
{
  "sponsorId": "163302",
  "sponsors": [
    { "sponsorId": "163302", "sponsorContactId": "163323" }
  ]
}
```

- 후원사 A → B로 바꾸면 **B만** 보낸다. A는 요청에 없다 → **프로그램 배정 집합이 B로 교체**되어야 한다.
- 담당자 「미선택」이면 `{ "sponsorId": "1627251" }`만 보낸다(또는 `sponsorContactId` 생략) → **해당 후원사 행의 담당자는 null**이어야 한다.
- 후원사를 전부 지우면 FE는 이상적으로 `sponsors: []`를 보낸다 → **배정 0건**.

`GET /api/admin/programs/{id}/sponsors`가 canonical이다. top-level `sponsorId` / `managerName`은 배정과 일치해야 한다.

---

## 2. 로컬 실측 (2026-09-29)

관리자 토큰으로 확인. 시드 복원까지 수행함.

### 2.1 동일 후원사 · 담당자만 변경 — OK

`186005` (TRAINED_TEACHER)

```http
PATCH /api/admin/programs/186005
{ "sponsors": [{ "sponsorId": "163301", "sponsorContactId": "163322" }] }
```

(사전: 163301 / 163321 김제이)

→ GET `/sponsors` = `163301` / `163322` 박제이. **정상.**

### 2.2 후원사 A → B — APPEND (버그)

`186005` 기준 (사전: 1627251 / 1627253만):

```http
PATCH /api/admin/programs/186005
{
  "sponsors": [{ "sponsorId": "163302", "sponsorContactId": "163323" }],
  "sponsorId": "163302"
}
```

→ HTTP 200  
→ GET `/sponsors` = **2건** (163302 문디지털 + **구** 1627251 백진혁 유지)

동일 패턴:

| 프로그램 | 유형 | 결과 |
|---|---|---|
| `186005` | TRAINED_TEACHER | A→B 시 구 후원사 잔존 |
| `170001` | COMPANY_SCHOOL | A→B 시 구 후원사 잔존 (sponsors-only PATCH는 200) |
| `186017` | GENERAL_INDIVIDUAL | 신규 후원사 **추가**만 됨 (기존 배정 유지 → count 증가) |

`sponsors: []`는 전체 삭제에 성공한다. **clear → set** 2회 PATCH로만 교체가 가능하다. CMS는 교체 의미를 한 번의 `sponsors[]`로 보낸다.

### 2.3 담당자 미선택 — 담당자 유지 (버그)

```http
PATCH /api/admin/programs/186005
{ "sponsors": [{ "sponsorId": "1627251" }] }
```

→ HTTP 200 · `managerName` 여전히 백진혁  
→ GET `/sponsors` `sponsorContactId` = `1627253` **유지**

`sponsorContactId: null`도 담당자를 지우지 않았다.

### 2.4 편집 기간 종료 — 별도

`186008`에 sponsors PATCH → `409 PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED`  
(“사업 운영 기간이 종료되어…”) — append 버그와 별개. 종료 시드는 이 재현에 쓰지 마라.

---

## 3. 요구 수정

### 3.1 `sponsors[]` present = 프로그램 배정 집합 교체

요청에 `sponsors` 키가 있으면:

1. 요청 배열을 **그 프로그램의 전체 후원 배정**으로 본다.
2. 요청에 없는 `(sponsorId[, sponsorContactId])` 배정은 **삭제**한다.
3. 요청에 있는 행은 upsert한다.
4. `sponsors: []` → 전체 삭제(이미 동작). 이 의미를 non-empty에도 일관 적용한다.

부분 머지(다른 후원사 유지)가 필요하면 **별도 API** 또는 명시적 쿼리/플래그로 분리하라. CMS 공통정보 PATCH는 교체다.

### 3.2 동일 `sponsorId` + contact 생략 = 담당자 해제

요청 행이 `{ "sponsorId": "S" }`이고 `sponsorContactId`가 없거나 null이면:

- 해당 후원사 배정의 `sponsorContactId` / 담당자명을 **null**로 저장한다.
- GET `/sponsors`와 top-level `managerName`이 구 담당자를 되살리지 않는다.

“임의로 지우지 말 것”은 **요청에 해당 후원사 행 자체가 없을 때**의 얘기가 아니다.  
요청에 후원사 행이 있고 contact가 비어 있으면 **의도적 해제**다.

### 3.3 top-level 정합

- `sponsorId` = 배정 1순위(또는 요청 `sponsorId`)
- `managerName` = 1순위 배정의 담당자명(없으면 null)
- HTTP 200은 commit 후에만. 응답/직후 GET이 요청과 일치해야 한다.

---

## 4. 검수 체크리스트

대상: `186005` (운영 기간 내 TRAINED_TEACHER). 끝나면 시드를 로컬나눔은행(`1627251`/`1627253`)으로 되돌릴 것.

1. **교체**  
   PATCH `sponsors:[{163302,163323}]` → GET `/sponsors` **정확히 1건** 163302/163323. 1627251 없음.

2. **담당자 변경**  
   PATCH `sponsors:[{163301,163322}]` (사전 163301/163321) → contactId `163322`.

3. **미선택**  
   PATCH `sponsors:[{1627251}]` → GET contactId **null**, managerName null/빈값.

4. **전체 삭제**  
   PATCH `sponsors:[]` → GET count 0.

5. **Company School**  
   `170001`에 동일 교체 검수. `COMPANY_SCHOOL_EDUCATION_STRUCTURE_FIXED`로 sponsors를 거절하지 말 것(현재 로컬은 sponsors-only 200).

6. **기간 종료**  
   `186008`류는 409 유지 가능. 교체 로직 검수 시드로 쓰지 말 것.

---

## 5. 완료 조건

- [ ] A→B 한 번 PATCH 후 GET `/sponsors`에 A가 없다.
- [ ] contact 생략 PATCH 후 담당자가 null이다.
- [ ] `sponsors:[]` 전체 삭제 유지.
- [ ] TT / COMPANY_SCHOOL / GENERAL 동일 계약.
- [ ] FE handoff 한 줄: “`sponsors[]` present = full replace; omit contactId = clear contact on that sponsor row.”
