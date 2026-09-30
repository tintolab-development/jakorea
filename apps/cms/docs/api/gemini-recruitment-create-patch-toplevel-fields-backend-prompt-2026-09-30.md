# Cursor prompt — Gemini 모집 공고 create/PATCH·목록 top-level 필드 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | JABACK |
| 주 API | `POST /api/admin/gemini/trainings/recruitments` · `PATCH …/recruitments/{programId}` · 목록 `GET …/recruitments` |
| 대상 화면 | CMS → 제미나이 → 찾아가는 연수 → 모집 공고 등록/정보 수정 · 모집 공고 목록 |
| 프로그램 유형 | `GEMINI_TRAINING` 만. GENERAL / UJAT / 1사1교 / TRAINED_TEACHER 계약은 바꾸지 마라 |
| 우선순위 | P1 (상세 GET 왕복은 완료. create wire·목록 기간 분리 후속) |
| 작성일 | 2026-09-30 |
| 상태 | **BE 완료 · FE 반영 (2026-09-30).** Orval + create/PATCH top-level + 목록 기간 분리 |
| 관련 FE handoff | `JABACK/docs/frontend/gemini-recruitment-create-patch-toplevel-fields-frontend-handoff-2026-09-30.md` |

~~프론트 레포를 이 작업으로 고치지 마라. **백엔드만** 고친다.~~ → BE 배포 후 FE Orval·매퍼 반영 완료.

---

## 한줄

상세 GET은 top-level로 문의처·교육형태·연수 요청 기간·지원 방법을 돌려준다.  
**create/PATCH body에도 같은 이름 top-level을 받아 저장**하고, 목록 아이템에도 **기관 모집 기간과 연수 요청 기간을 분리**해 줘라.  
지금은 일부 값이 `serviceDetailJson.geminiRecruitment` fallback에만 의존하거나, `applicationMethod` alias가 잘못되어 FE가 top-level로 보낼 수 없다.

---

## 현재 FE 상태 (참고 — BE가 고칠 것)

| 필드 | create/PATCH top-level | FE 조치 |
|---|---|---|
| `targetLevels` / `targetLevel` | **전송함** | 완료. 빈 `[]`도 보냄. PATCH 시 `targetLevel` clearFields |
| `educationForm` | **못 보냄** | `ProgramCreateRequest`/`Update`에 필드 없음 → `serviceDetailJson`만 |
| `trainingRequestStartDate` / `EndDate` | **못 보냄** | create DTO에 없음 → 스냅샷 JSON만 |
| `applicationMethod` (지원 방법 문구) | **보내면 안 됨** | `@JsonAlias`가 `applicationPathId`에 묶여 있음 |
| 목록 기간 분리 | N/A | `GeminiRecruitmentItem`이 `businessStart/End`만 있어 목록에서 두 기간을 합쳐 표시 |

상세 GET projection·`serviceDetailJson` fallback은 이미 동작한다.  
이번 요청은 **요청 계약·목록 DTO를 GET과 대칭**으로 만드는 것이다.

---

## 수정 1 — create/PATCH top-level 필드 추가

`ProgramCreateRequest` / `ProgramUpdateRequest`(또는 Gemini 모집 전용 body가 있으면 그쪽)에 아래를 **정식 프로퍼티**로 추가한다. null이면 생략 가능. PATCH는 `clearFields`로 null 초기화 가능해야 한다.

| 필드 | 타입 | 의미 | FE 소스 |
|---|---|---|---|
| `educationForm` | `online` \| `offline` \| `hybrid` \| null | 교육 형태 | `educationForm` |
| `trainingRequestStartDate` | `date` \| null | 연수 요청 가능기간 시작 | `trainingRequestPeriodStart` |
| `trainingRequestEndDate` | `date` \| null | 연수 요청 가능기간 종료 | `trainingRequestPeriodEnd` |
| `applicationMethod` | `string` \| null | **지원 방법 자유 텍스트** (모집 안내와 별개) | `applicationMethod` |

저장 규칙:

1. top-level이 있으면 **그 값을 우선 저장**하고 상세 GET과 같은 컬럼/JSON projection에 반영한다.
2. top-level이 없고 `serviceDetailJson.geminiRecruitment.*`만 있으면 **기존 fallback 유지** (하위 호환).
3. `applicationStartDate`/`applicationEndDate` = 기관 모집 기간 (이미 FE가 보냄).
4. `trainingRequest*` 는 기관 모집 기간과 **합치지 마라.** `businessStart/End`에 덮어쓰지 마라.
5. Gemini만 이 필드를 써도 된다. 다른 `programType` create에 필드를 넣어도 **무시하거나 no-op**. GENERAL 동작을 바꾸지 마라.

---

## 수정 2 — `applicationMethod` JsonAlias 충돌 제거 (필수)

현재 Java:

```java
@JsonAlias({"application_path_id", "applicationMethod", "application_method"})
String applicationPathId,
```

문제:

- CMS Gemini UI의 「지원 방법」은 **자유 텍스트**다.
- FE가 top-level `applicationMethod: "온라인 신청"` 을 보내면 **경로 ID 필드로 들어가** 깨지거나 검증 실패한다.
- 상세 GET의 `applicationMethod`와 의미가 다르다.

해야 할 일:

1. `applicationPathId`의 `@JsonAlias`에서 **`applicationMethod` / `application_method`를 제거**한다.
2. create/PATCH에 **별도 필드** `applicationMethod`(string, nullable)를 추가한다.
3. OpenAPI에서 `applicationPathId`와 `applicationMethod`를 **서로 다른 프로퍼티**로 문서화한다.
4. 기존 클라이언트가 alias로 path id를 보냈다면 → `applicationPathId` / `application_path_id`만 허용. Gemini 지원 방법 문구는 새 `applicationMethod`만.

검수: Gemini create body에

```json
{ "applicationMethod": "홈페이지에서 기관 신청서를 작성해 제출해 주세요.", "applicationPathId": null }
```

→ path id에 문자열이 들어가지 않고, GET `applicationMethod`에 동일 문구가 돌아온다.

---

## 수정 3 — 목록 `GeminiRecruitmentItem` 기간 분리 (권장)

현재 목록 스키마(대략):

- `businessStartDate` / `businessEndDate`만 있음
- FE `mapGeminiRecruitmentItemToRow`가 두 기간에 **같은 값**을 넣음

추가:

| 필드 | 의미 |
|---|---|
| `applicationStartDate` / `applicationEndDate` | 기관 모집 기간 |
| `trainingRequestStartDate` / `trainingRequestEndDate` | 연수 요청 가능기간 |

기존 `business*`는 유지해도 된다.  
목록 응답에서 두 기간이 다르면 **다른 날짜**가 나와야 한다 (상세 GET과 동일 소스).

---

## OpenAPI

`components.schemas` 갱신:

- `ProgramCreateRequest` / `ProgramUpdateRequest`: `educationForm`, `trainingRequestStartDate`, `trainingRequestEndDate`, `applicationMethod`(자유 텍스트)
- `applicationPathId` description에 「지원 방법 문구가 아님. Gemini `applicationMethod`와 혼동 금지」
- `GeminiRecruitmentItem`: 기간 4필드 추가
- create OpenAPI에 이미 Java에 있는 `contactName` / `otherMatters` / `recruitmentTargetDetail` / `recruitmentGuide` 등이 빠져 있으면 **스키마를 코드와 맞춘다** (FE가 cast로 우회 중)

---

## 기대 create body 예시 (개념)

```json
{
  "programType": "GEMINI_TRAINING",
  "title": "제미나이 찾아가는 연수 모집 예정",
  "description": "…",
  "educationStructure": "SCHEDULE",
  "applicationStartDate": "2026-10-25",
  "applicationEndDate": "2027-01-18",
  "trainingRequestStartDate": "2026-10-25",
  "trainingRequestEndDate": "2027-01-18",
  "totalParticipants": 15,
  "targetLevels": ["adult"],
  "targetLevel": "adult",
  "educationForm": "offline",
  "contactName": "JA Korea 연수팀",
  "contactPhone": "02-1234-5678",
  "contactEmail": "gemini@jakorea.org",
  "recruitmentTargetDetail": "성인 학습자",
  "recruitmentGuide": "…",
  "applicationMethod": "온라인 신청",
  "learningSupportContent": "…",
  "additionalContentHtml": "…",
  "otherMatters": null,
  "attachmentFileNames": [],
  "serviceDetailJson": "{\"geminiRecruitment\":{…}}"
}
```

`serviceDetailJson`은 당분간 병행해도 된다. **저장·GET의 정본은 top-level.**

---

## 검수

1. create에 `educationForm=online`, `trainingRequest*` ≠ `application*`, `applicationMethod` 문구, `targetLevels` 를 top-level로 보낸다.
2. 직후 GET detail → 동일 값. Network에 `serviceDetailJson` 없이도 필드가 채워진다.
3. create body에 `applicationMethod`만 넣고 `applicationPathId` 없음 → DB/응답의 path id가 오염되지 않는다.
4. PATCH `educationForm`만 변경 → 연수 요청 기간·문의처 유지.
5. PATCH `clearFields: ["applicationMethod"]` 또는 null 정책 → GET `applicationMethod` null/`-`.
6. 목록 GET: 기관 모집 기간과 연수 요청 기간이 다른 seed에서 **컬럼 값이 갈라진다.**
7. GENERAL / TT / 1사1교 / UJAT create·상세 회귀 없음.

---

## 하지 말 것

- FE가 `serviceDetailJson`만 파싱하게 미루지 마라. create/PATCH **요청 DTO**를 넓혀라.
- `applicationMethod`를 다시 `applicationPathId` alias로 넣지 마라.
- `educationForm`을 항상 `offline`으로 강제하지 마라.
- 기관 모집 기간과 연수 요청 기간을 한 필드로 합치지 마라.
- 다른 `programType`의 create 필수 검증을 Gemini 필드 때문에 깨지 마라.

---

## FE 후속 (참고 — BE 범위 밖)

BE OpenAPI 반영 후:

1. Orval 재생성
2. `mapGeminiRecruitmentSnapshotToCreateRequest` / `mapGeminiRecruitmentDetailToUpdateRequest`에 `educationForm` · `trainingRequest*` · `applicationMethod` top-level 매핑
3. create의 `contactName`/`otherMatters` cast 제거(스키마에 생기면)
4. `mapGeminiRecruitmentItemToRow` 기간 분리

이 문서는 **BE create/PATCH·목록 계약**만 지시한다.
