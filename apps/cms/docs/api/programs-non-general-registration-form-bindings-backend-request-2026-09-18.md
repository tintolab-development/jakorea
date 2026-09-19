# BE 수정 요청 (2026-09-18) — 단독 문서

**작성일:** 2026-09-18  
**문서 성격:** **이 파일만** 보고 구현·검수 가능 (선행 문서 열람 불필요)

### 적용 범위 — 전 프로그램 유형 공통 (필수)

| | |
|---|---|
| **적용** | **모든** 프로그램 유형에 **동일 계약**으로 적용한다. 유형별 예외·완화 없음. |
| **포함 유형** | `GENERAL`(일반) · `COMPANY_SCHOOL`(1사1교) · `UJAT` · `TRAINED_TEACHER`(교육받은 교사) · (동일 등록 위저드·form-bindings를 쓰는 **후속 유형도 동일**) |
| **유형별로 다른 것** | A1의 **시드 templateCode 목록만** 다름 (시작 카탈로그). **B·C(수정본 매핑·과정 중/이후 수정 가능)는 전 유형 공통.** |
| **금지** | “일반만 attach / 나머지는 `autoApplyDefaultFormBindings` 시드 고정”처럼 **유형별 계약 분기**. FE 구현 완성도와 무관하게 **BE 계약은 전 유형 동일**이어야 함. |

**관련 templateCode (공용 시드 — 읽기 전용 원본):**  
[writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md) · 일반 시드 포함

---

## 핵심 요구 (한 줄)

**모든 프로그램 유형**에서, 등록 **과정 중**·**등록 이후** 모두 공통·모집·신청 양식을 수정할 수 있어야 하고(단락 추가·문구·구조 등), create/binding 결과는 **기본(시드) 양식 그대로**가 아니라 **수정된 양식**이 해당 프로그램의 공통·모집·신청에 매핑되어야 한다.

---

## 포함 이슈

| # | 우선순위 | 대상 API | 한 줄 |
|---|----------|----------|-------|
| **A** | **P0** | Programs create · `form-bindings` | **전 유형** — 유형별 **공통·모집·신청** 시드 세트가 올바른 templateCode로 시작 |
| **B** | **P0** | Forms-Surveys · form-templates / form-bindings | **전 유형 공통** — 등록 중 **수정한** 공통·모집·신청 → 프로그램 전용 copy·바인딩 (시드 원본 그대로 최종 binding 금지) |
| **C** | **P0** | form-template-versions · form-bindings | **전 유형 공통** — 등록 과정 중 + 등록 이후 수정 가능(단락 추가 등). 공통·모집·신청 동등 |

---

# A. 유형별 create 기본 form-bindings (시드 “시작점”)

**요청 대상:** `POST /api/admin/programs` (`autoApplyDefaultFormBindings: true`)

FE는 create body에 `autoApplyDefaultFormBindings: true`를 보냅니다.  
BE는 **해당 프로그램 유형**에 맞는 시드 세트만 binding 시작점으로 쓰고, **다른 유형 세트와 섞이면 안 됩니다**.  
(시드 code만 유형별 · **수정본 매핑·편집 가능 계약(B·C)은 전 유형 동일.**)

> **중요:** A는 “어떤 카탈로그 code에서 시작하는지”만 정의한다.  
> create 최종 binding은 **B**에 따라 **등록 중 수정본**이어야 하며, `autoApplyDefaultFormBindings`만으로 **미수정 시드 published를 최종본처럼 고정**하면 안 된다.  
> 이 규칙은 **GENERAL 포함 전 유형**에 적용한다.

## A1. 기대 binding 세트 (시드 code)

### 일반 (`GENERAL`)

| 역할 | formType | templateCode (공용 시드) | 비고 |
|------|----------|--------------------------|------|
| 공통(등록) | (등록/공통) | `registration-general` | **수정본 매핑 (B·C) — 전 유형 공통** |
| 참여 기관 모집 | `RECRUITMENT` | `recruitment-participant-school` | 참여자 유형에 따라 노출 |
| 참여자 모집 | `RECRUITMENT` | `recruitment-participant-individual` | |
| 강사 모집 | `RECRUITMENT` | `recruitment-instructor` | |
| 봉사자 모집 | `RECRUITMENT` | `recruitment-volunteer` | |
| 참여 기관 신청 | `APPLICATION` | `application-participant-school` | |
| 참여자 신청 | `APPLICATION` | `application-participant-individual` | |
| 강사 신청 | `APPLICATION` | `application-instructor` | |
| 봉사자 신청 | `APPLICATION` | `application-volunteer` | |

- 실제 binding 대상은 create 시점 **참여자 유형 플래그**에 보이는 탭만 (미체크 유형은 생략 가능).  
- FE 참고: 일반은 `attachRegistrationFormDraftsToProgram`가 있으나, **BE 계약은 타 유형과 동일**해야 함 (시드 고정 허용 아님).

### 1사1교 (`COMPANY_SCHOOL`)

| 역할 | formType | templateCode (공용 시드) | 비고 |
|------|----------|--------------------------|------|
| 공통(등록) | (등록/공통) | `registration-economy` | **수정본 매핑 (B·C)** |
| 참여 기관 모집 | `RECRUITMENT` | `recruitment-economy` | **수정본 매핑 (B·C)** |
| 강사 모집 | `RECRUITMENT` | `recruitment-instructor` | 참여자 유형에 강사 포함 |
| 참여 기관 신청 | `APPLICATION` | `application-economy` | **수정본 매핑 (B·C)** |
| 강사 신청 | `APPLICATION` | `application-instructor` | **수정본 매핑 (B·C)** |

- 봉사자·개인 참여자 양식은 **기본 binding에 포함하지 않음**.

### 교육받은 교사 (`TRAINED_TEACHER`)

| 역할 | formType | templateCode | 비고 |
|------|----------|--------------|------|
| 공통(등록) | (등록/공통) | `registration-trained-teachers` | **수정본 매핑 (B·C)** |
| 참여 기관 모집 | `RECRUITMENT` | `recruitment-trained-teachers` | 누락 금지 |
| 참여 기관 신청 | `APPLICATION` | `application-trained-teachers` | **수정본 매핑 (B·C)** |

- 참여자 유형은 학교/기관만. 강사·봉사자 기본 binding 없음.  
- 상세: [trained-teacher-registration-flow-backend-prompt-2026-09-18.md](./trained-teacher-registration-flow-backend-prompt-2026-09-18.md)

### UJAT

| 역할 | formType | templateCode | 비고 |
|------|----------|--------------|------|
| 공통(등록) | (등록/공통) | `registration-ujat` | **수정본 매핑 (B·C)** |
| 참여 기관 모집 | `RECRUITMENT` | `recruitment-ujat-school` | |
| 봉사자 모집 | `RECRUITMENT` | `recruitment-ujat-volunteer` | |
| 참여 기관 신청 | `APPLICATION` | `application-ujat-school` | **수정본 매핑 (B·C)** |
| 봉사자 신청 | `APPLICATION` | `application-ujat-volunteer` | **수정본 매핑 (B·C)** |

## A2. 수락 기준 (QA)

1. create 후 `GET …/programs/{id}/form-bindings`에 위 표의 역할이 **모두** 존재 (유형별).  
2. 다른 유형의 templateCode가 섞이지 않음.  
3. create 실패 시 binding·고아 template 롤백 정책이 문서화되어 있음.  
4. (B와 교차) 등록 중 수정을 한 경우, binding의 version payload가 **시드와 동일하면 실패**로 본다.

---

# B. 수정된 양식 → 프로그램(공통·모집·신청) 매핑

**요청 대상:** Forms-Surveys copy/publish · Programs `form-bindings`  
**일반 참고 계약:** [programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md](./programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md) (A절)

## B0. 제품 의도 (오해 금지)

| ❌ 하면 안 됨 | ✅ 해야 함 |
|--------------|-----------|
| create 시 공용 시드 published를 **그대로** form-bindings에 고정 | 등록 과정에서 고친 **수정본**(단락 추가·삭제·문구·필수·표 등)을 프로그램에 매핑 |
| 모집/신청만 copy하고 **공통(등록) 양식은 시드 고정** | **공통·모집·신청 모두** 동일하게 수정본 매핑 |
| “기본 양식 저장 = 완료” | “**수정된 양식**이 해당 프로그램의 공통/모집/신청 SSOT” |

시드는 **신규 등록 시작 시 초기값**일 뿐이다. 최종 binding SSOT는 프로그램 전용 version이다.

## B1. 현재(문제) — 유형별 FE 편차 (BE 계약은 통일해야 함)

| 구분 | 일반 (`GENERAL`) | 1사1교 · UJAT · 교육받은 교사 |
|------|------------------|-------------------------------|
| create 기본 binding | `autoApplyDefaultFormBindings` | 동일 플래그 |
| 등록 위저드 수정본 서버 반영 | FE `attachRegistrationFormDraftsToProgram` 있음 | **미연동** — 시드 binding만 기대되기 쉬움 |
| **요구되는 BE 계약** | **아래 B2·C와 동일 (전 유형 공통)** | **동일** |

> FE가 일반만 attach를 호출 중이어도, BE는 “일반만 수정본 / 나머지는 시드”로 분기하면 **안 된다**.  
> 전 유형이 수정본 매핑·과정 중 편집을 **같은 API 계약**으로 지원해야 한다.

## B2. 기대 동작

1. **공용 카탈로그 보호**  
   - `registration-*` / `recruitment-*` / `application-*` 공용 published에 등록 위저드·상세 편집 PUT 금지.  
   - `by-code`는 **초기값 로드 전용**(읽기).

2. **프로그램 전용 copy + 수정본 저장**  
   - 공통·모집·신청 각각:  
     copy → 전용 DRAFT에 **수정된** `schemaJson` / `extensionJson`(overlay·editorState) 저장 → publish → 해당 프로그램 `form-bindings`에 **전용** `templateId` / `templateVersionId` 연결.  
   - **공통(등록) 양식도 모집·신청과 동일 계약** — “공통만 시드 고정” 금지.

3. **매핑 대상에 포함되는 수정 범위 (예시, FE가 보내는 draft 기준)**  
   - 단락 **추가·삭제·순서 변경**  
   - 단락 제목·본문·필수(`answerRequired` / `requiredMark`)  
   - 표·선택지·고정 문구·overlay 입력값(유형별)  
   - 구조 잠금 정책이 있는 시드 단락은 FE 규칙을 따르되, **허용된 편집분은 반드시 서버 version에 반영**

4. **구현 옵션** (BE·FE 합의 — 문서화 필수)

   | 옵션 | 설명 |
   |------|------|
   | **1 (권장)** | create가 “전용 version id 목록”(공통·모집·신청)을 받아 **그 수정본**으로 binding |
   | **2** | create 직후 FE가 유형별 attach로 시드 binding을 **수정본 version으로 교체** — 원자성·부분 실패 정책 문서화 |

5. **조회 SSOT**  
   - CMS 상세·Platform 제출은 해당 프로그램 binding의 `templateVersionId` payload만 사용.  
   - 공용 `by-code`로 상세 공통/모집/신청을 그리면 안 됨.

## B3. 수락 기준 (QA)

1. 등록 중 신청 양식에 **단락 추가** → create 후 A 상세 신청에 **해당 단락 존재**. 공용 `application-*` 시드 **불변**.  
2. 등록 중 공통(등록) 양식 문구/구조 수정 → A binding 공통 version = **수정본** (시드와 diff 존재).  
3. 모집 양식 수정도 A에만 반영.  
4. 프로그램 B 신규 등록 초기값 = 공용 시드(A 수정 영향 없음).  
5. “수정 없이 완료”한 경우에만 시드 내용과 동일한 전용 copy여도 허용(전용 template/version id는 시드와 **달라야** 함 — 공용 id 직접 binding 금지 권장).  
6. 1사1교·UJAT·교육받은 교사·**일반** 각각 A1 templateCode(노출 탭)로 검증.  
7. **유형 간 계약 동일성:** 일반에서 통과한 B·C 시나리오가 타 유형에서도 동일 기준으로 통과.

## B4. FE 현황 (참고 — 계약과 구현 상태 구분)

- 현재 FE: 일반만 `attachRegistrationFormDraftsToProgram` 호출. 1사1교·UJAT·교육받은 교사는 create만.  
- **이 문서의 BE 요구는 전 유형 공통**이다. FE 미연동 유형은 BE 계약 확정 후 FE를 맞춘다.  
- “FE가 아직 안 보내니까 BE는 시드만”은 **수락 불가**.

---

# C. 수정 가능 시점 · 범위 (등록 과정 중 + 등록 이후)

**한 줄:** 공통·모집·신청은 **등록 위저드 작성 중**과 **프로그램 생성 이후 상세** 모두에서 수정·저장 가능해야 한다. 신청만 예외로 읽기 전용이면 안 된다.

## C1. 시점

| 시점 | 가능해야 하는 것 |
|------|------------------|
| **등록 과정 중** (위저드: 공통 → 모집 → 신청 탭) | 양식 편집(단락 추가·삭제·순서·문구·필수 등) + 임시저장/탭 이동 후에도 수정분 유지 + create 시 **그 수정분**이 프로그램에 매핑 (B) |
| **등록 이후** (프로그램 상세 · 양식 편집) | 동일 범위로 재수정·저장 → 해당 프로그램 binding version에만 반영 |

## C2. 현재(문제·리스크)

- `autoApplyDefaultFormBindings`만으로 공용 published를 걸면:  
  - 등록 **중** 수정분이 서버에 안 실리거나,  
  - 등록 **후** 편집이 공용 PUT / “수정 불가”로 막히거나,  
  - 저장돼도 **다른 프로그램·다음 등록 시드 오염**.  
- “create = 기본 양식 저장”으로 구현하면 제품 요구(수정본 매핑)와 충돌.

## C3. 기대 계약

1. binding은 항상 **프로그램 전용** `templateId` / `templateVersionId` (B).  
2. 저장 API: 전용 version에만 PUT (또는 DRAFT → publish + binding PATCH). **공용 catalog version PUT 거부.**  
3. **공통 / 모집(`RECRUITMENT`) / 신청(`APPLICATION`)** 에 “수정 가능 여부” 차등 정책 **금지**.  
4. 등록 과정 중 편집 API가 막혀 있으면(예: programId 없음):  
   - 등록 시작 시 copy해 받은 전용 DRAFT `versionId`에 PUT 하거나,  
   - program-scoped draft API 후 create 시 binding — **어느 쪽이든 과정 중 수정·단락 추가가 가능**해야 함.  
5. Platform 제출은 binding된 확정(published 등) version 사용. DRAFT/publish 정책은 OpenAPI에 명시.

## C4. 수락 기준 (QA)

1. **등록 과정 중** 신청(또는 공통/모집)에 단락 추가 → 임시저장/탭 이동 → create → 상세에 단락 유지.  
2. **등록 이후** 상세에서 신청 문구·단락 추가 수정 → 저장·재조회 반영.  
3. 공용 시드 payload 불변. 프로그램 B 불변.  
4. 공통·모집·신청이 동일 API 권한·에러 코드로 수정 가능.  
5. (선택) binding이 공용 version을 가리키면 PUT 시 **4xx + 명확한 메시지**.

---

## 수락 기준 요약 (전체)

| # | 항목 |
|---|------|
| 0 | **전 프로그램 유형 공통 적용** (`GENERAL` · `COMPANY_SCHOOL` · `UJAT` · `TRAINED_TEACHER` …). 유형별 B·C 예외 없음 |
| 1 | 유형별 create 시드 역할 = A1 표 (유형 간 세트 미혼합) |
| 2 | **기본 시드 그대로 최종 저장 금지** — 등록 중 수정분이 공통·모집·신청에 매핑 (B) |
| 3 | **등록 과정 중 + 등록 이후** 모두 수정 가능(단락 추가 등) (C) |
| 4 | 공통·모집·신청 수정 정책 동등 (신청만 잠금 금지) |
| 5 | 공용 카탈로그 시드 불변 |
| 6 | CMS 상세·Platform = program binding version SSOT |

---

## FE 후속 (이 문서 범위 밖 · BE 계약 확정 후)

- 미연동 유형(1사1교·UJAT·교육받은 교사)에 일반과 동등한 draft attach 또는 create version-id 목록 연동.  
- `operational-form-bindings`에 전 유형 templateCode 스펙 정렬.  
- 등록 위저드·상세 편집 UI가 binding(또는 사전 copy) `templateVersionId`만 저장하도록 전 유형 통일.
