# CMS FE 검증 프롬프트

**대상:** JaKorea CMS `apps/cms` — 일반(GENERAL) 프로그램

**범위:**

- A. 사업 운영 기간과 모집별 운영 기간 분리
- B. 학생명단 수동 PUT의 `sourceFileObjectId` 처리
- C. 학급 컬럼에서 반 정보만 표시

**환경:**

- CMS remote API
- MFA: `000000`

**실패 시 반드시 기록:**

- 스크린샷
- Network Request/Response
- `programId`
- `organizationApplicationId`

---

## A. 사업 운영 기간 vs 모집별 운영 기간

### A-1. 운영 기간 분리

1. 공통정보에서 사업 운영 기간을 `2026-01-01` ~ `2026-12-31`로 저장한다.
2. 모집별 운영 기간을 다음과 같이 저장한다.
   - 참여자: `2026-03-01` ~ `2026-03-31`
   - 강사: `2026-04-01` ~ `2026-04-30`
   - 봉사자: `2026-05-01` ~ `2026-05-31`
3. 모달을 닫고 다시 열거나 F5로 새로고침한다.

**기대 결과:**

- 사업 운영 기간은 `2026-01-01` ~ `2026-12-31`로 유지된다.
- 참여자·강사·봉사자 탭의 운영 기간이 각각 다르게 유지된다.
- 한 모집 탭의 저장이 다른 모집 탭이나 사업 운영 기간을 변경하지 않는다.

### A-2. 공통정보만 변경

사업 운영 기간만 변경하고 저장한다.

**기대 결과:**

- 모집별 프로그램 운영 기간은 변경되지 않는다.

### A-3. 강사 모집만 변경

강사 모집 운영 기간만 변경하고 저장한다.

**기대 결과:**

- 참여자 운영 기간은 유지된다.
- 봉사자 운영 기간은 유지된다.
- 사업 운영 기간은 유지된다.

### A-4. Network 검증

강사 모집 저장 요청을 확인한다.

**기대 결과:**

- 모집 저장만으로 루트 레벨 `startDate`, `endDate`, `businessStartDate`, `businessEndDate`가 변경되지 않는다.
- INSTRUCTOR의 `operationStartDate`, `operationEndDate` 또는 중첩된 운영 기간 필드가 폼 값과 일치한다.
- 다른 모집 유형의 운영 기간이 덮어써지지 않는다.

### A-5. 등록 위저드

등록 위저드에서 사업 운영 기간과 audience별 운영 기간을 서로 다르게 입력한 뒤 완료한다.

**기대 결과:**

- 상세 화면에서 사업 운영 기간이 유지된다.
- 참여자·강사·봉사자 탭에 입력한 운영 기간이 각각 유지된다.

### A-6. 실패 시 확인할 BE 계약

다음 사항을 Network와 응답으로 확인한다.

- `recruitments` 부분 PATCH 시 다른 모집 유형의 운영 기간이 null로 삭제되지 않는지
- 부분 저장 시 기존 모집 운영 기간이 보존되는지
- 과거 데이터에서 사업 운영 기간과 모집 운영 기간이 동일하게 저장된 경우 백필이 필요한지

---

## B. 학생명단 저장

### B-1. 수동 PUT

학생명단 GET 응답에 `sourceFileObjectId`가 있어도 정보 수정 저장 시 PUT body를 다음 형태로 전송한다.

```json
{
  "expectedRevisionNo": 2,
  "rows": [
    {
      "rosterId": 1691554,
      "studentName": "이서연",
      "birthDate": "2010-11-05",
      "grade": "초5",
      "className": "1반",
      "studentNo": 2,
      "gender": "female"
    }
  ]
}
```

**기대 결과:**

- 수동 PUT body에 `sourceFileObjectId`를 포함하지 않는다.
- `participantId`, `masked*` 필드를 임의로 추가하지 않는다.
- 기존 `rosterId`가 유지된다.
- 저장 후 학생명단 GET에서 기존 행 식별자가 유지된다.

### B-2. revision 충돌

오래된 `expectedRevisionNo`로 저장을 시도한다.

**기대 결과:**

- HTTP 409가 반환된다.
- error code는 `STUDENT_ROSTER_REVISION_CONFLICT`이다.
- 기존 데이터가 덮어써지지 않는다.
- 최신 학생명단을 다시 조회하도록 안내한다.
- 저장 실패 후 자동 refetch가 수행된다.

### B-3. 학생 추가

학생 추가 시에도 다음 형식만 사용한다.

```json
{
  "expectedRevisionNo": 2,
  "rows": [
    "...기존 행...",
    {
      "studentName": "신규학생",
      "birthDate": "2010-03-12",
      "grade": "초5",
      "className": "1반",
      "studentNo": 5,
      "gender": "male"
    }
  ]
}
```

**기대 결과:**

- `sourceFileObjectId`를 전송하지 않는다.
- 기존 행의 `rosterId`가 유지된다.
- 신규 행만 새 `rosterId`를 부여받는다.

### B-4. Excel import

Excel 업로드는 다음 API 흐름만 사용한다.

`POST .../student-roster/import`

```json
{
  "sourceFileObjectId": "<관리자 업로드 파일 ID>"
}
```

**기대 결과:**

- GET 학생명단 응답에 포함된 기존 `sourceFileObjectId`를 재사용하지 않는다.
- import 전용 관리자 업로드 파일 ID만 사용한다.
- 수동 PUT과 Excel import 요청을 혼용하지 않는다.

### B-5. INVALID_VALUE 대응

수동 PUT에 `sourceFileObjectId`를 포함하면 `INVALID_VALUE`가 발생할 수 있다.

**기대 결과:**

- FE는 수동 PUT에서 `sourceFileObjectId`를 항상 제외한다.
- `sourceFileObjectId`는 Excel import 요청에서만 사용한다.
- 실패 시 요청 body와 응답의 traceId를 기록한다.

---

## C. 학급 표시

### C-1. 출석 관리 및 Excel

다음 값이 API 또는 내부 데이터로 들어와도 화면에는 반 정보만 표시한다.

| 원본(예) | 표시 |
|----------|------|
| `초5 1반` | `1반` |
| `초5 2반` | `2반` |
| `4학년 3반` | `3반` |

### C-2. 학생명단 테이블 및 필터

- 학생명단 테이블 **학급** 컬럼에는 **반만** 표시한다 (예: `1반`).
- 반 필터 드롭다운 라벨도 `1반`, `2반` 등 반 정보만 표시한다 (내부 필터 값은 기존 `gradeClass` 문자열 유지).
- 학년 문자열을 학급 컬럼에 중복 표시하지 않는다.
- 저장·scope·API용 `grade` / `className` 분리 구조는 유지한다.

**참고:** 정보 수정 모드의 학급 Select는 등록 학급 구분을 위해 학년 포함 옵션 라벨을 쓸 수 있다 (표시·필터·엑셀과 구분).

---

## 자동 테스트

다음 테스트를 실행한다.

```bash
cd apps/cms

pnpm exec vitest run \
  src/shared/ui/cms-select.test.ts \
  src/features/program/general/lib/registration-payload-smoke.test.ts \
  src/features/program/general/lib/registration-institution-bridge-sync.test.ts \
  src/features/template/ui/form-set/registration-form/shared/use-registration-catalog-ready.test.ts \
  src/features/template/ui/form-set/registration-form/shared/registration-catalog-prefetch.test.ts \
  src/features/program/general/lib/general-program-recruitment-operation-period.test.ts \
  src/features/program/general/lib/general-program-recruitment-edit-seed.test.ts \
  src/features/program/shared/model/program-detail-edit-schema.test.ts \
  src/features/program/general/lib/detail-operational-save-merge.test.ts \
  src/features/program/general/hooks/use-program-detail-info-save.volunteer.test.ts \
  src/features/program/general/lib/student-roster-commit-safety.test.ts \
  src/features/program/general/api/adapters/student-roster-adapters.test.ts \
  src/features/program/general/hooks/use-organization-student-roster-remote.integration.test.ts \
  src/features/program/general/lib/school-detail-attendance-display.test.ts \
  src/features/program/general/lib/student-list-filter-fields.test.ts
```

**기대 결과:**

- 모든 테스트 PASS
- 실패 시 테스트명, 에러 메시지, 관련 코드 위치 기록
- 기존 테스트를 삭제하거나 기대값을 임의로 완화하지 않는다

---

## 완료 체크리스트

- [ ] A-1 운영 기간 분리 확인
- [ ] A-2 공통정보 변경 영향 확인
- [ ] A-3 강사 모집 변경 영향 확인
- [ ] A-4 Network payload 및 응답 확인
- [ ] A-5 등록 위저드 확인
- [ ] B-1 수동 PUT에서 `sourceFileObjectId` 미전송 확인
- [ ] B-2 revision 충돌 처리 확인
- [ ] B-3 학생 추가 payload 확인
- [ ] B-4 Excel import 전용 파일 ID 확인
- [ ] B-5 INVALID_VALUE 방지 확인
- [ ] C-1 출석·Excel 반 표시 확인
- [ ] C-2 학생명단·필터 반 표시 확인
- [ ] 전체 Vitest PASS
- [ ] 등록 위저드 카탈로그·셀렉트 (후원사/세부프로그램/담당자 `onOpenChange`, overlay prefetch) — 아래 inventory 매트릭스

---

## 등록 위저드 (릴리스 수동 QA)

**인벤토리·필드 키:** [`docs/audit/registration-wizard-input-performance-inventory.md`](../audit/registration-wizard-input-performance-inventory.md)

| Variant | program | recruit 기관 | application 기관 |
|---------|---------|--------------|------------------|
| general | 제목, 후원사 multi, 담당자 multi, 세부프로그램, 사업·모집 운영기간(A-5), 임금 지급항목 | 모집 기간·교육대상·한도 | 희망교육형태·학급수(bridge) |
| economy | 1c-1s basic + wage | economy layout | 1c-1s application |
| trainedTeachers | TT basic + 일정 | TT recruit | TT application |
| UJAT | ujat basic + sponsor | UJAT recruit | UJAT institution application |

각 셀: 입력 지연 없음 · 셀렉트 첫 오픈 시 목록 로드 · 임시저장 후 재개 · 다음 단계 미리보기.

Optional audit: `pnpm --filter cms audit:registration-wizard-fields` → `docs/audit/registration-wizard-field-audit.json`

---

## 백엔드 확인 범위

**상세 BE 검증 프롬프트:** [`general-program-operation-period-and-student-roster-be-verification.md`](./general-program-operation-period-and-student-roster-be-verification.md)

- 모집별 운영 기간 부분 PATCH 시 데이터 보존 여부
- 학생명단 Excel import의 관리자 업로드 파일 검증
- `STUDENT_ROSTER_REVISION_CONFLICT` 계약
- OpenAPI v9 기준 신규 필드 추가 없이 FE 정합성 확인

---

## 수정 시 원칙

수정이 필요한 경우 먼저 원인과 영향 범위를 정리한 뒤 최소 범위로 수정하고, 수정 후 위 자동 테스트를 다시 실행한다.

**Document version:** 2026-10-14
