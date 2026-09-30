# Cursor prompt — Gemini 모집 PATCH `INVALID_VALUE` (date-only `*At` vs Instant 검증)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** (프론트 `jakorea` 에서 이 버그를 고치지 마라) |
| 작업 위치 | 백엔드 프로젝트에서 이 프롬프트를 열어 구현·테스트·커밋한다 |
| 주 API | `PATCH /api/admin/gemini/trainings/recruitments/{programId}` |
| 재현 ID | `185002` (LocalDemo Gemini Primary Case GEM-02) |
| traceId 예 | `f2045c7273554e3282f8dbbadedee17f` |
| 프로그램 유형 | `GEMINI_TRAINING` 만. GENERAL / UJAT Instant 검증 회귀 금지 |
| 우선순위 | **P0** (모집 공고 정보 저장 불가) |
| 작성일 | 2026-09-30 |
| 상태 | **BE 완료 (2026-09-30).** FE 코드 변경 없음. QA만 |
| FE handoff (완료 후) | `JABACK/docs/frontend/gemini-recruitment-patch-invalid-value-instant-frontend-handoff-2026-09-30.md` |

**이 문서는 백엔드 Cursor/에이전트용이다. FE 레포에서 SchemaValidator·Normalizer를 직접 고치지 마라.**

---

## 한줄

Gemini PATCH가 `serviceDetailJson`에 **날짜만**(`YYYY-MM-DD`) 올린 `trainingRequestStartAt` / `trainingRequestEndAt` 을 넣은 뒤,  
`ProgramServiceDetailSchemaValidator` 가 `Instant.parse` 로만 검증해서  
`serviceDetailJson.trainingRequestStartAt must be an ISO-8601 instant.` → `GENERIC_MUST_PATTERN` → CMS에는 `INVALID_VALUE` / `입력값 또는 요청 조건을 확인해 주세요.` / `field: null` 로만 보인다.

---

## 재현

1. CMS에서 Gemini 모집 공고 `185002` 정보 수정 → 저장.
2. 요청 body 요지 (FE가 실제로 보냄 — FE를 바꾸지 마라):

```json
{
  "title": "제미나이 찾아가는 연수 모집 예정",
  "applicationStartDate": "2026-10-07",
  "applicationEndDate": "2026-10-28",
  "businessStartDate": "2026-10-07",
  "businessEndDate": "2026-10-28",
  "trainingRequestStartDate": "2026-10-30",
  "trainingRequestEndDate": "2026-12-29",
  "educationForm": "online",
  "educationStructure": "SCHEDULE",
  "applicationMethod": "모집 기간 내 온라인 신청 후 담당자 확인을 거칩니다.",
  "targetLevels": ["adult"],
  "contactPhone": "02-1234-5678",
  "serviceDetailJson": "{\"geminiRecruitment\":{\"trainingRequestPeriodStart\":\"2026-10-30\",\"trainingRequestPeriodEnd\":\"2026-12-29\", ...}}"
}
```

3. 응답:

```json
{
  "success": false,
  "message": "입력값 또는 요청 조건을 확인해 주세요.",
  "error": {
    "code": "INVALID_VALUE",
    "field": null,
    "traceId": "..."
  }
}
```

전화(`02-1234-5678`)·`educationStructure=SCHEDULE`·기간 순서(business end ≥ start, training end ≥ start)는 정상이다. Bean Validation이 아니라 **IllegalArgumentException + `must` 마스킹**이다.

---

## 원인 체인

1. `ProgramServiceDetailRequestNormalizer`
   - `liftGeminiRecruitmentAliases`: `geminiRecruitment.trainingRequestPeriodStart` → root `trainingRequestStartAt` (**date-only** 문자열 그대로)
   - (create/PATCH top-level 작업 후) `putGeminiTopLevelRecruitmentFields` → `putDateTimeAsBusinessDate(..., "trainingRequestStartAt", ...)` 역시 **date-only** (`ProgramDateNormalizer.dateString`)
2. `ProgramServiceDetailCommandService` → `ProgramServiceDetailSchemaValidator.validateGemini`
3. `requireChronologicalInstantRange(detail, "trainingRequestStartAt", "trainingRequestEndAt")`
4. `parseInstant` → `Instant.parse("2026-10-30")` **실패**
5. `IllegalArgumentException("serviceDetailJson.trainingRequestStartAt must be an ISO-8601 instant.")`
6. `ClientErrorMessageResolver.GENERIC_MUST_PATTERN` → 한글 일반 메시지, `field: null`

시드도 `trainingRequestPeriodStart` 를 `LocalDate.toString()` 으로 넣으므로, **nested snapshot만 보내도** lift 후 동일하게 깨진다.

---

## 수정 요구 (JABACK에서만)

권장: **A**. 여유 있으면 **B** 병행.

### A. 검증기 — date-only 허용 (필수)

**파일:** `src/main/java/com/jakorea/cms/program/service/ProgramServiceDetailSchemaValidator.java`

`parseInstant` 가 아래를 모두 받게 한다.

| 입력 | 결과 |
|---|---|
| `2026-10-30T00:00:00Z` | 기존처럼 `Instant.parse` |
| `2026-10-30` (date-only) | `ProgramDateNormalizer.timestamp` → `Asia/Seoul` 시작 Instant |

구현 스케치 (그대로 붙여도 됨):

```java
private static Instant parseInstant(String value, String field) {
    String trimmed = value.trim();
    try {
        return Instant.parse(trimmed);
    } catch (RuntimeException ignored) {
        try {
            java.sql.Timestamp timestamp = ProgramDateNormalizer.timestamp(trimmed);
            if (timestamp != null) {
                return timestamp.toInstant();
            }
        } catch (RuntimeException ignoredAgain) {
            // fall through
        }
        throw new IllegalArgumentException(
                "serviceDetailJson." + field + " must be an ISO-8601 instant or business date.");
    }
}
```

- UJAT `volunteerRecruitment*At` 등 **기존 Instant 문자열은 그대로 통과**해야 한다.
- date-only 실패 시에만 새 메시지로 거절.

### B. 정규화 정리 (선택)

Gemini 연수 요청 기간은 **date SSOT** 이다.

- `trainingRequestStartDate` / `EndDate` / `PeriodStart` / `PeriodEnd` 만 date-only로 유지
- `requireChronologicalInstantRange(..., "trainingRequestStartAt", "trainingRequestEndAt")` 를 date range 검증으로 바꾸거나
- Gemini lift/put 에서 `*At` 키를 쓰지 않기

A만으로 PATCH는 통과한다.

### 테스트 (JABACK)

`src/test/java/com/jakorea/cms/program/service/ProgramServiceDetailSchemaValidatorTest.java` (package-private 접근) 권장 케이스:

1. `trainingRequestStartAt=2026-10-30`, `EndAt=2026-12-29` → validate 통과
2. Instant 형식(`…T00:00:00Z`) → 통과
3. end &lt; start (date-only) → `IllegalArgumentException`

실행 예:

```bash
./gradlew test --tests com.jakorea.cms.program.service.ProgramServiceDetailSchemaValidatorTest
```

---

## 하지 말 것

- **프론트 레포(`jakorea`)에서 이 이슈를 고치지 마라.** FE body / adapters 변경으로 우회하지 마라.
- FE body에서 `trainingRequest*` 를 빼라고 하지 마라. create/PATCH top-level 계약의 일부다.
- `applicationMethod` 를 다시 `applicationPathId` alias로 묶지 마라.
- GENERAL / UJAT Instant 모집 기간 검증을 깨지 마라.
- 에러를 FE에 raw `must` 영문으로 노출하지 마라. 가능하면 `field: "trainingRequestStartAt"` 또는 전용 코드로 내려라 (선택).

---

## 완료 기준

1. 위 body로 `PATCH …/recruitments/185002` → **200**, 상세 GET에 연수 요청 기간·교육형태·지원 방법 유지.
2. unit: date-only `trainingRequest*At` Gemini detail 이 schema validate 통과.
3. Instant 형식도 계속 통과.
4. end &lt; start 이면 기존처럼 거절.
5. (선택) FE handoff 한 줄: “PATCH INVALID_VALUE date-only At 수정 완료. FE 재저장 확인만.”

---

## 필드 왕복 감사 (2026-09-30 FE 재검증)

FE 수정 저장은 아래를 **top-level**로 보낸다. GET `GeminiRecruitmentDetailResponse`가 **같은 값**을 돌려줘야 화면에 남는다. `serviceDetailJson`만 있고 top-level이 비면 CMS는 `-` / 빈 셀렉트 / 빈 첨부로 보인다.

| CMS 필드 | PATCH top-level | GET 필드 | 비고 |
|---|---|---|---|
| 공고명 | `title` | `nameKo` | |
| 교육 대상 | `targetLevels` **전체 배열** + `targetLevel` = `[0]` | `targetLevels` | **`stampTargetLevels(List.of(첫 값))` 금지.** 요청 `targetLevels` 전체를 root·`geminiRecruitment.educationTargetLevels`에 저장. 코드는 `adult`\|`university`\|… |
| 교육 대상 상세 | `recruitmentTargetDetail` | `recruitmentTargetDetail` | |
| 기관 모집 기간 | `applicationStartDate` / `EndDate` | 동일 | |
| 연수 요청 기간 | `trainingRequestStartDate` / `EndDate` | 동일 | date-only. 위 Instant 버그 |
| 사업 기간 | `businessStartDate` / `EndDate` (= 기관 모집) | 동일 | |
| 최소 인원 | `totalParticipants` | `minimumParticipantCount` | |
| 교육 형태 | `educationForm` `online`\|`offline` | `educationForm` | |
| 문의처 | `contactName` / `contactPhone` / `contactEmail` | 동일 | |
| 비고 | `otherMatters` (해당없음이면 clear) | `otherMatters` null | |
| 썸네일 | `keyVisualImage` = 파일명. 삭제 시 `clearFields: keyVisualImage` | `thumbnailFileName` | JSON `geminiRecruitment.thumbnailFileName`도 유지 |
| 프로그램 설명 | `description` | `description` | |
| 모집 안내 | `recruitmentGuide` | 동일 | |
| 지원 방법 | `applicationMethod` | 동일 | `applicationPathId` 아님 |
| 학습 지원 | `learningSupportContent` | 동일 | |
| 추가 내용 | `additionalContentHtml` | 동일 | |
| 첨부 | `attachmentFileNames` (빈 배열이면 삭제) | `attachmentFileNames` | 파일명 배열. 빈 root 배열이 nested 목록을 가리면 안 됨 |

`ProgramCommandService`가 `stampTargetLevels(..., List.of(canonicalTargetLevel))` 로 **배열을 첫 원소 하나로 덮어쓰면** 복수 교육 대상이 저장 후 사라진다. 요청의 `targetLevels` 전체를 써라.

---

## FE 측 참고 (수정하지 말 것)

- FE 매퍼: `apps/cms/src/features/program/gemini/api/visiting-training/adapters.ts`  
  `mapGeminiRecruitmentDetailToUpdateRequest`
- 선행 create/PATCH top-level: `gemini-recruitment-create-patch-toplevel-fields-backend-prompt-2026-09-30.md`
- 이 문서 경로 (FE 보관용): `apps/cms/docs/api/gemini-recruitment-patch-invalid-value-instant-backend-prompt-2026-09-30.md`  
  → **실제 구현은 JABACK 워크스페이스에서 진행**
