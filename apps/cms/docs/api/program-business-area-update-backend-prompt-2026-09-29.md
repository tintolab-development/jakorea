# Cursor prompt — 프로그램 사업 분야 수정 저장 정합성 개선 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 | JABACK `PATCH /api/admin/programs/{programId}` |
| 프로그램 유형 | 일반·1사1교·UJAT·교육받은 교사 |
| 우선순위 | 사업 분야 수정 후 같은 ID GET에서 구값이 반환되는 문제 확인 및 수정 |
| 작성일 | 2026-09-29 |
| 상태 | BE 반영 및 로컬 PATCH→GET 재검증 완료 |
| FE 계약 | 공식 요청 필드 `businessArea`만 전송. OpenAPI 재생성 불필요 |
| 후속 | 전체 공통정보 필드는 `program-common-info-update-persistence-backend-prompt-2026-09-29.md` 기준으로 계속 검증 |

아래 지시는 **CMS 백엔드 레포(JABACK, 로컬 `localhost:8080`)에서 실행**하라.
프론트 레포를 수정하지 말고, 관리자 프로그램 PATCH 저장과 GET projection만 점검하라.

---

## 증상

CMS 프로그램 상세 공통정보에서 「사업 분야」를 변경하고 저장해도 일부 또는 모든 프로그램 유형에서 이전 값이 다시 표시된다.

BE 수정 전 진단 당시 FE는 사업 분야를 백엔드 마스터명으로 정규화하여 아래 두 필드를 함께 보냈다.

```json
{
  "businessArea": "디지털리터러시",
  "businessField": "디지털리터러시"
}
```

- OpenAPI `ProgramUpdateRequest`의 공식 필드는 `businessArea`다.
- `businessField`는 일부 상세 응답·레거시 경로와의 호환 alias다.
- BE 반영 후 FE 신규 요청은 공식 `businessArea`만 전송한다.
- FE 허용 마스터명은 `경제금융`, `진로취업`, `기업가정신`, `디지털리터러시`다.
- 기존 1사1교 레거시 값 등 마스터에 존재하는 추가 명칭은 임의로 삭제하거나 다른 값으로 치환하지 마라.

PATCH가 2xx여도 직후 `GET /api/admin/programs/{programId}` 또는 유형별 상세 GET에서 구값이 반환되면 백엔드 저장 또는 조회 projection 문제다.

---

## 해야 할 일

### 1. PATCH 요청 매핑 확인

`ProgramUpdateRequest.businessArea`가 누락 없이 프로그램 수정 command/service/entity까지 전달되는지 확인하라.

- partial PATCH에서 `businessArea`가 존재할 때만 사업 분야를 갱신한다.
- 요청에 필드가 없으면 기존 값을 유지한다.
- 빈 문자열을 기존 값 삭제로 해석하지 마라. 삭제를 허용해야 한다면 별도 명시 계약과 검증을 추가하라.
- `businessField`도 `businessArea`의 JSON alias로 받을 수 있게 하되, 두 필드가 모두 있으면 `businessArea`를 우선하라.
- 프로그램 유형별 분기에서 사업 분야 갱신이 누락되지 않게 한다.

대상 유형:

- `GENERAL`, `GENERAL_ORGANIZATION`, `GENERAL_INDIVIDUAL`
- `COMPANY_SCHOOL`
- `UJAT`
- `TRAINED_TEACHER`

### 2. DB 저장 확인

사업 분야가 문자열 컬럼인지 마스터 FK/관계인지 실제 모델을 확인하고, PATCH 값이 영속화되도록 수정하라.

- 마스터 관계라면 이름을 trim한 뒤 정확 일치로 조회한다.
- 존재하지 않는 사업 분야는 2xx로 무시하지 말고 명확한 4xx 코드와 메시지를 반환한다.
- 같은 값 재저장은 idempotent해야 한다.
- 다른 공통정보 필드, 모집 정보, 일정, 커리큘럼, KPI를 덮어쓰지 마라.

### 3. 모든 상세 응답 projection 통일

저장된 최신 사업 분야를 다음 응답에 동일하게 투영하라.

- `PATCH /api/admin/programs/{programId}` 응답 `ProgramResponse.businessArea`
- `GET /api/admin/programs/{programId}` 응답 `ProgramResponse.businessArea`
- 프로그램 상세 응답에서 사용하는 `businessField`
- 목록 응답에 사업 분야가 있다면 해당 필드

`businessArea`와 `businessField`를 서로 다른 DB 값이나 stale JSON에서 읽지 마라. 둘 다 동일한 canonical 저장값을 사용하라.

`serviceDetailJson`, registration overlay, config JSON은 사업 분야의 canonical 저장소로 사용하지 말고 레거시 fallback으로만 사용하라. DB canonical 값이 있으면 JSON 구값이 덮지 못하게 한다.

### 4. 트랜잭션·캐시 확인

- PATCH transaction commit 직후 같은 ID GET에서 최신 값이 보여야 한다.
- 서버 캐시나 projection 캐시가 있다면 PATCH 성공 후 해당 프로그램 상세·목록 캐시를 무효화한다.
- PATCH 응답을 요청값으로만 꾸미지 말고 실제 저장 후 canonical 값을 반환한다.

---

## 재현 절차

개인정보가 없는 로컬 테스트 프로그램을 유형별로 하나씩 사용하라.

1. `GET /api/admin/programs/{id}`로 기존 `businessArea`를 기록한다.
2. 기존 값과 다른 유효 마스터명으로 partial PATCH한다.

```http
PATCH /api/admin/programs/{id}
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "businessArea": "디지털리터러시",
  "businessField": "디지털리터러시"
}
```

3. PATCH 응답의 `businessArea`를 확인한다.
4. 즉시 같은 ID를 GET하여 `businessArea`와 `businessField`를 확인한다.
5. DB canonical 컬럼 또는 관계도 같은 값인지 확인한다.
6. 다시 다른 값(`진로취업`)으로 변경하여 특정 값에만 동작하는 문제가 없는지 확인한다.
7. `businessField`만 보낸 레거시 요청도 alias 정책대로 반영되는지 확인한다.

---

## 필수 테스트

### 단위/통합 테스트

각 프로그램 유형에 대해 아래를 검증하라.

1. `businessArea` 단독 PATCH → DB 갱신
2. `businessField` 단독 PATCH → 같은 canonical 값으로 갱신
3. 두 필드가 같은 값 → 정상 갱신
4. 두 필드가 다른 값 → `businessArea` 우선
5. 필드 미포함 partial PATCH → 기존 사업 분야 유지
6. 유효하지 않은 마스터명 → 명확한 4xx
7. PATCH 응답 → 즉시 GET → DB 값이 모두 동일
8. 사업 분야만 수정할 때 다른 공통정보·테이블 필드 불변

### 회귀 테스트

- 일반 기관형·개인형
- 1사1교
- UJAT
- 교육받은 교사 커리큘럼형·일정형

---

## 수용 조건

1. 모든 대상 프로그램 유형에서 사업 분야 개별 수정이 저장된다.
2. 다른 공통정보와 함께 일괄 수정해도 사업 분야가 저장된다.
3. PATCH 응답과 직후 같은 ID GET이 요청한 최신 값을 반환한다.
4. `businessArea`와 `businessField`가 서로 다른 값을 반환하지 않는다.
5. stale `serviceDetailJson`·overlay·config가 canonical 사업 분야를 덮지 않는다.
6. 사업 분야만 수정했을 때 모집 기간·일정·커리큘럼·KPI 등 다른 필드가 변하지 않는다.
7. 기존 프로그램 데이터에 대한 일괄 초기화나 임의 마이그레이션은 수행하지 않는다.

---

## 완료 보고에 포함할 내용

- 원인: 요청 매핑 / 영속화 / projection / 캐시 중 실제 결함 위치
- 수정한 클래스·메서드
- canonical DB 컬럼 또는 관계
- 유형별 PATCH→GET 테스트 결과
- alias 우선순위(`businessArea` 우선) 적용 여부
- 마이그레이션 필요 여부

