# Cursor prompt — 공통정보 후원사 교체 저장 + 담당자 「미선택」기본 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | JABACK |
| 주 API | `PATCH /api/admin/programs/{programId}` · `GET …/sponsors` · `GET …/programs/{id}` |
| 대상 화면 | CMS 프로그램 상세 → 공통정보 → 후원사 / 후원사 담당자 |
| 프로그램 유형 | GENERAL · COMPANY_SCHOOL · UJAT · TRAINED_TEACHER **전부** |
| 우선순위 | P0 |
| 작성일 | 2026-09-29 |
| 상태 | **아직 미수정.** 로컬에서 A→B 교체·담당자 미선택이 계속 실패한다. 구현하라. |
| FE | 수정하지 마라. OpenAPI 재생성 불필요(계약 의미만 맞춤) |
| 선행 실측 | 동일 날짜 `program-sponsors-patch-replace-semantics` 실측과 동일 증상 |

프론트 레포를 고치지 마라. 아래는 **백엔드만** 고치는 지시다.

---

## 증상 (CMS / 기획 기대)

1. **후원사 수정이 안 된다**  
   공통정보에서 후원사를 A → B로 바꾸고 저장해도, 새로고침·재조회 시 **구 후원사 A가 남거나** B가 추가만 되어 **복수 배정**처럼 보인다.
2. **담당자 미선택이 기본이어야 한다**  
   후원사만 고르고 담당자를 고르지 않았는데(또는 UI에서 「미선택」), 저장/조회 시 **대표 담당자(로컬 시드에서 흔히 `백진혁` / `is_primary` contact)** 가 자동으로 들어간다.  
   **기대:** 담당자 없음(null) · 화면 「미선택」.

HTTP 200만 나고 GET이 구값이면 FE 문제가 아니다.

---

## 원인 (현행 코드 — 여기서 고쳐라)

### A. `sponsors[]` PATCH가 **merge(append)** 라서 교체가 안 됨

`ProgramCommandService` PATCH:

- `request.sponsors() != null` → `ProgramSponsorAssignmentCommandService.mergeSponsors(...)`
- `mergeSponsors` 주석/구현:

```text
요청에 없는 기존 후원사 배정을 그대로 merged에 다시 넣음
→ A→B 요청인데 A가 잔존
```

CMS 공통정보는 **한 번의 `sponsors[]` = 그 프로그램의 전체 배정 집합**이다.  
부분 머지가 필요하면 별도 API로 두라. **공통정보 PATCH는 full replace.**

### B. contact 생략 = 「기존 유지」라서 미선택이 안 됨

같은 서비스:

```text
named sponsor + contact id 없음
→ existingContacts를 다시 붙임
→ 담당자 해제 불가
```

레거시 `sponsorId`만 올 때:

```text
resolveLegacySponsorContactId
→ 같은 후원사면 기존 contact 유지
→ 없으면 sponsor_contact.is_primary(또는 id 순) 자동 배정
```

이게 「후원사만 선택했는데 백진혁(대표 담당자)이 기본」으로 보이는 서버 쪽 원인이다.  
**CMS는 자동 primary 배정을 원하지 않는다.** contact를 안 보냈으면 **null**.

관련 클래스:

- `com.jakorea.cms.program.service.ProgramSponsorAssignmentCommandService`
  - `mergeSponsors`
  - `replaceLegacySponsor` / `resolveLegacySponsorContactId`
  - `replaceSponsors`
- `com.jakorea.cms.program.service.ProgramCommandService` (PATCH sponsors 분기)

시드의 이름 `백진혁` 자체를 지우라는 뜻이 아니다. **요청에 contact가 없을 때 primary를 꽂지 마라.**

---

## FE wire (그대로 받아라)

공통정보 저장 시 CMS는 대략 다음을 보낸다.

### 후원사 + 담당자 선택

```json
{
  "sponsorId": "163302",
  "sponsors": [
    { "sponsorId": "163302", "sponsorContactId": "163323" }
  ]
}
```

### 후원사만 · 담당자 「미선택」

```json
{
  "sponsorId": "1627251",
  "sponsors": [
    { "sponsorId": "1627251" }
  ]
}
```

- `sponsorContactId` 키 없음 / `null` / 빈 문자열 → **모두 담당자 해제**로 해석.
- FE 내부 sentinel `__sponsor_contact_unselected__` 는 **절대 API로 보내지 않는다.** 서버가 이 문자열을 contact PK로 파싱하려 하지 마라.

### 후원사 교체 A→B (한 방)

```json
{
  "sponsorId": "163302",
  "sponsors": [
    { "sponsorId": "163302", "sponsorContactId": "163323" }
  ]
}
```

요청에 없는 구 후원사(`1627251` 등)는 **삭제**.

### 전체 해제

```json
{ "sponsors": [] }
```

(이미 동작하는 경우가 많다. non-empty에도 같은 “배열 = 전체 집합” 의미를 적용.)

복수 후원사·복수 담당자는 기존 계약 유지:

```json
"sponsors": [
  { "sponsorId": "163302", "sponsorContactId": "111" },
  { "sponsorId": "163302", "sponsorContactId": "222" },
  { "sponsorId": "1627251", "sponsorContactId": "1627253" }
]
```

같은 `sponsorId` 여러 행 = 담당자 여러 명. 후원사당 1명으로 접지 마라.  
(`sponsorContactIds: [...]` 배열을 받는 경로가 있으면 동일 의미로 저장.)

---

## 요구 수정

### 1. PATCH `sponsors` 키 존재 = **full replace**

| 요청 | 동작 |
|---|---|
| `sponsors: [ … ]` (1건 이상) | 배열이 **최종 배정 전체**. 없는 후원사 행 삭제. |
| `sponsors: []` | 배정 0건. |
| `sponsors` 키 없음 | 후원 배정 건드리지 않음(다른 필드만 PATCH). |
| `sponsors` 없고 `sponsorId`만 | 레거시. **한 후원사로 replace.** contact 없으면 **null** (primary 자동 배정 금지). |

구현 힌트: PATCH 경로에서 `mergeSponsors`를 쓰지 말고 `replaceSponsors`를 쓰거나, `mergeSponsors`가 “요청에 없는 기존 유지”를 하지 않게 고친다.  
**CREATE** 경로의 `replaceSponsors`와 의미를 맞춰라.

### 2. contact 생략 = **담당자 null** (미선택)

요청 행 `{ "sponsorId": "S" }` 이고 contact id가 없거나 null/blank이면:

- `program_sponsor.sponsor_contact_id = null`
- `sponsor_contact_name_snapshot = null`
- multi-contact 자식 테이블이 있으면 해당 후원사 배정의 contact 링크 **전부 제거**
- GET `/sponsors`의 `sponsorContactId` / `sponsorContactName` / `sponsorContacts` = 비움
- top-level `managerName`(및 동등 contact 표시 필드) = null

**금지:**

- `is_primary` contact 자동 INSERT/UPDATE
- “기존 contact 유지” (미선택 해제와 충돌)
- create/update 시 후원사만 넣고 contact를 서버가 고름

### 3. GET / 상세 projection 정합

저장 직후:

- `GET /api/admin/programs/{id}/sponsors` = 요청 집합과 동일
- `GET /api/admin/programs/{id}` 의 `sponsorId` = 대표(요청 `sponsorId` 또는 배정 1순위)
- nested `serviceDetailJson` / `generalCommonInfo.sponsorManagementIds` / `sponsorManagerContactIds` 를 쓰는 유형은 **canonical `program_sponsor`와 모순되지 않게**.  
  구 nested가 신 canonical을 덮어 “화면만 옛 후원사”가 되면 안 된다.
- `managerName`에 시드 기본 이름(백진혁 등)을 contact 없이 넣지 마라.

### 4. 유형 격리

GENERAL / COMPANY_SCHOOL / UJAT / TRAINED_TEACHER 모두 같은 `sponsors[]` 계약.  
1사1교 `COMPANY_SCHOOL_EDUCATION_STRUCTURE_FIXED` 등으로 **sponsors PATCH만** 거절하지 마라.  
사업 기간 종료(`PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED`) 409는 유지 가능 — 검수 시드로는 운영 기간 내 프로그램을 써라.

---

## 검수 (로컬 `localhost:8080`)

운영 기간 내 시드. 예: TT `186005`, 1사1교 `170001`, GENERAL 하나.  
끝나면 시드 후원 배정을 원래대로 되돌려도 된다.

1. **교체**  
   사전: `1627251`(+ contact).  
   PATCH `sponsors:[{ "sponsorId":"163302","sponsorContactId":"163323" }], sponsorId:"163302"`  
   → GET `/sponsors` **정확히 1건** 163302/163323. 1627251 **없음**.

2. **담당자 미선택**  
   PATCH `sponsors:[{ "sponsorId":"1627251" }]`  
   → GET contactId **null**, managerName null/빈값. **백진혁·김후원·is_primary 자동 복원 금지.**

3. **담당자 변경**  
   같은 후원사에서 contact만 바꾸면 GET이 신 contact.

4. **전체 삭제**  
   `sponsors:[]` → count 0.

5. **유형**  
   TT · COMPANY_SCHOOL · GENERAL(또는 UJAT) 각 1회 교체+미선택.

회귀 테스트: `mergeSponsors` append / primary auto-fill 을 고정하는 테스트가 있으면 **기대값을 교체·null 계약에 맞게 고친다.**

---

## 완료 조건

- [ ] 후원사 A→B 한 번 PATCH 후 GET에 A 없음
- [ ] contact 생략 PATCH 후 담당자 null (대표 담당자 자동 배정 없음)
- [ ] `sponsors:[]` 전체 삭제 유지
- [ ] 네 프로그램 유형 동일
- [ ] FE handoff 한 줄:  
  `sponsors[]` present = full replace; omit/`null` contactId = clear contact (default = 미선택, no primary autofill).

---

## 복사용 짧은 프롬프트

```
JABACK만 수정. FE 금지.

CMS 공통정보 후원사가 아직 깨져 있다.
1) PATCH sponsors[] 가 mergeSponsors 때문에 A→B 해도 구 후원사가 남는다 → sponsors 키 있으면 full replace(replaceSponsors와 동일). 요청에 없는 배정 삭제.
2) {sponsorId}만 보내면 기존 contact 유지 + resolveLegacySponsorContactId가 is_primary(백진혁 등)를 자동 배정한다 → contact 생략/null은 담당자 null. primary 자동 배정 금지. 미선택이 기본.
3) GET /sponsors · top-level sponsorId/managerName · nested sponsorManagementIds와 일치.
4) GENERAL/1사1교/UJAT/TT 동일. 기간 종료 409는 유지.

검수: 186005 등에서 교체 1건만 남음 + contact 생략 시 contactId null.
완료 handoff: “sponsors[] present = full replace; omit contactId = clear contact (no primary autofill).”
```
