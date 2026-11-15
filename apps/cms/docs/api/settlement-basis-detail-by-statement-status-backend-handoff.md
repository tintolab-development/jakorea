# [BE 작업 요청] 지급조서 처리 상태별 「산정 기준 상세」 근거 응답 보강

> 작성일: 2026-11-15 · 대상 저장소: `JABACK` · 관련 문서: `settlement-calculation-statement-be-request-20261112.md`의 B4

## 1. 배경

CMS 일반 프로그램 > 참여 강사 상세 > 정산 현황 > [지급조서 보기]에서 산출 내역 행의 「상세 보기」를 누르면, 일부 행에서 아래 알림이 뜹니다.

> 이 지급 항목의 산정 기준 상세 레이아웃이 없습니다. 항목 유형과 API basisDetail.layout을 확인해 주세요.

프론트는 행마다 BE가 내려 준 산정 근거로 모달을 엽니다. 원격 데이터에서는 강사비를 뺀 항목의 근거를 직접 만들지 않습니다(금액 재계산 금지 원칙). 그래서 BE가 근거를 주지 않으면 알림이 뜹니다.

### 로컬 재현 (2026-11-15)

- 화면: `http://localhost:3000/programs/general?lnb=progress&programId=186565&tab=progress_instructors&instructorId=1695103&instructorTab=settlement`
- 강사: `member_id=190115`, 참여자 `program_participant.id=1695103`

| 지급조서 행 | 처리 현황 | 조회 API | 강사비 | 활동비 | 식사비 | 원천징수 |
|---|---|---|---|---|---|---|
| 11.09 / 483,500원 | 계좌 지급 완료 | 정산 상세(`settlementId`) | 정상 | – | – | 정상 |
| 11.08 / 536,500원 | 확인 대기 중 | `GET /api/admin/settlement-applications/23/application-document` | 정상(FE 보정) | **알림** | **알림** | **알림** |

## 2. 처리 상태별 조회 경로와 현재 문제

프론트는 처리 상태에 따라 다른 API로 산출 내역을 그립니다
(`apps/cms/src/features/program/general/ui/detail-modal/program-status/participating-instructor-payment-statement-view-container.tsx`).

| 구분 | 처리 현황(FE 표시) | BE 상태 값 | 산출 내역 출처 | 현재 근거 제공 |
|---|---|---|---|---|
| A. 확정 전 신청서 | 확인 대기 중 / 지급조서 재신청 | `settlement_application.status` = `SUBMITTED`, `RESUBMITTED` | `application-document`의 `lines[]` | **없음.** `Line`에 근거 필드가 없음 |
| B. 정정 요청·반려된 신청서 | 지급 정정 요청 / 신청 반려 | `CORRECTION_REQUESTED`, `REJECTED` | `application-document` (revision 지정 가능) | **없음** (A와 같음) |
| C. 확정 정산, 지급조서 확인 대기 | 확인 대기 중 | `payment_statement.statement_status` = `WAITING_CONFIRM` (+`DRAFT`) | 정산 상세 `items[].calculationDetail` | `settlement_calculation_detail` 기준. ACTIVITY·MEAL·LODGING·일부 TRANSPORTATION 누락 |
| D. 지급조서 확인 완료, 지급 대기 | 지급조서 확인 완료 | `CONFIRMED` + `account_payment.payment_status` = `WAITING_PAYMENT` | 정산 상세 + 지급조서 스냅샷 | C와 같음. 로컬 12건 중 7건 누락 |
| E. 계좌 지급 완료 | 계좌 지급 완료 | `CONFIRMED` + `PAID` | 정산 상세 + 지급조서 스냅샷 | 로컬 9건은 누락 없음(강사비·원천징수만 있는 건) |
| F. 지급조서 반려 | 신청 반려 | `REJECTED` (지급조서) | 정산 상세 | 로컬 1건 누락 |
| 참고: 확정 정산의 [지급조서 발급] 화면 | – | 연결된 `settlementApplicationId`가 있으면 | `application-document` | A와 같은 문제 |

로컬 DB 집계 (대체되지 않은 `settlement` 기준):

| statement_status | payment_status | 정산 수 | 근거 누락(ACTIVITY·MEAL·LODGING·TRANSPORTATION) | payment_statement_calculation_snapshot 있음 |
|---|---|---|---|---|
| CONFIRMED | PAID | 9 | 0 | 6 |
| CONFIRMED | WAITING_PAYMENT | 12 | 7 | 12 |
| DRAFT | – | 1 | 1 | 0 |
| REJECTED | – | 1 | 1 | 1 |
| WAITING_CONFIRM | – | 14 | 0 | 1 |

신청서 쪽 (`settlement_application`):

| status | 확정 정산 연결 | 신청 수 | 항목 유형 | 원천징수 상세(`settlement_application_calculation_detail`) |
|---|---|---|---|---|
| SUBMITTED | 없음 | 4 | ACTIVITY, LECTURE_FEE, MEAL, TRANSPORTATION | 4 |
| RESUBMITTED | 없음 | 8 | LECTURE_FEE | 8 |
| CONFIRMED | 있음 | 9 | ACTIVITY, LECTURE_FEE, MEAL | 9 |
| CONFIRMED | 없음 | 4 | ACTIVITY, LODGING, MEAL | 0 |

## 3. 원인 (코드 기준)

1. **신청서 문서(A·B)**
   - `SettlementApplicationDocumentDtos.Line`에는 `institutionName, educationDate, sessionLabel, direction, category, description, amount`만 있습니다.
   - `SettlementApplicationDocumentService.linesFromInstructorSnapshot`이 `calculation_snapshot_jsonb.items[]` 또는 `settlement_application_item`에서 금액만 읽습니다.
   - 원천징수 근거는 `settlement_application_calculation_detail.basis_jsonb`에 저장되어 있지만 응답에 실리지 않습니다.
   - 예: 신청 #23은 `basis_jsonb`에 `taxIncomeType=BUSINESS_INCOME, rate=0.033, grossAmount=553000, taxableAmount=500000, smallTaxExemptionThreshold=1000`이 있습니다.
2. **확정 정산(C~F)**
   - `SettlementFrontendResponseMapper.frontendCalculationDetail(type, settlement.calculationDetails())`는 같은 유형의 `settlement_calculation_detail`이 없으면 null을 보냅니다.
   - 신청서 제출로 확정된 건은 LECTURE_FEE·WITHHOLDING_TAX 상세만 저장됩니다(B4와 같은 원인).

## 4. 요청 사항

### 4-1. application-document `Line`에 `calculationDetail` 추가 (A·B, [지급조서 발급] 화면)

- `Line`에 nullable 필드 `calculationDetail`을 추가해 주세요.
  - 형식은 정산 상세 응답의 `SettlementFrontendCalculationDetailResponse`와 **같은 스키마**로 맞춰 주세요(`calculationType`, `formulaText`, `basisJson`, `resultAmount` 등).
  - 그래야 프론트가 기존 매퍼를 그대로 재사용합니다.
- 유형별로 채울 값:
  - **원천징수(DEDUCTION)**: 해당 revision의 `settlement_application_calculation_detail`(WITHHOLDING_TAX) 행을 그대로 매핑해 주세요.
    - `basisJson`에 `taxIncomeType`, `rate`, `taxableAmount`, `withholdingTaxAmount`(또는 `resultAmount`)가 반드시 있어야 합니다.
    - 프론트 `withholdingRate` 모달의 필수 키입니다.
  - **식사비·활동비·숙박비**: 제출 스냅샷 기준 typed basis를 넣어 주세요.
    - 식사비: `{"layout":"meal","categoryLabel","mealFee":{"amountWon", "receiptFileName?", "receiptFileObjectId?"},"totalWon"}`
    - 활동비: `{"layout":"activity","categoryLabel","activityFee":{"amountWon",...},"totalWon"}`
    - 숙박비: `{"layout":"lodgingGeneral"|"lodging1s1g","categoryLabel","nightsDisplay","lodgingFee":{"amountWon",...},"totalWon"}`
    - 영수증은 `settlement_application_attachment`에서 항목과 연결할 수 있을 때만 넣고, 연결 근거가 없으면 생략해 주세요(추측해서 연결 금지).
  - **교통비**: `calcInfo`에 이미 있는 `oneWayDistanceKm`, `fuelCostWon`, `tollFeeWon`, `calculatedTransportAmount`를 교통비 행의 `basisJson`에도 넣어 주세요.
    - 편도 30km 미만 미지급으로 null인 경우는 null 그대로 둡니다.
  - **강사비**: 현재 프론트가 `calcInfo`로 보정하고 있습니다. 가능하면 `{"layout":"lectureFeeTier"|"lectureFeeSpecial"|"lectureFeeGemini", "categoryLabel", "feeAssessmentWon", "lectureTimeDisplay", "totalWon"}`도 함께 내려 주세요.
- 값은 **제출 스냅샷(해당 revision)** 기준으로만 채우고, 현재 정책·현재 일정으로 다시 계산하지 마세요.

### 4-2. 처리 상태별 고려 사항

| 상태 | 요구 동작 |
|---|---|
| `SUBMITTED` (확인 대기 중) | 최신 revision 스냅샷의 근거를 반환합니다. |
| `RESUBMITTED` (지급조서 재신청) | `revisionNo`를 지정하지 않으면 최신 재신청본, 지정하면 그 revision의 근거를 반환합니다. 원본(`original_application_id`)의 근거와 섞지 마세요. |
| `CORRECTION_REQUESTED` (지급 정정 요청) | 정정 요청을 받은 그 revision의 근거를 그대로 반환합니다(정정 사유와 무관하게 제출 당시 값). |
| `REJECTED` (신청 반려) | 반려된 revision의 근거를 반환합니다. 조회 가능 상태(`INSTRUCTOR_VIEWABLE`)에 포함되어 있으므로 근거도 같이 내려야 합니다. |
| `CONFIRMED` + 확정 정산 연결 (지급조서 확인 대기 ~ 계좌 지급 완료) | [지급조서 발급] 화면이 application-document를 쓰므로 4-1과 같이 반환합니다. |
| 확정 정산의 정산 상세(`settlementId`) | 4-3을 따릅니다. |

### 4-3. 확정 정산 상세 `items[].calculationDetail` 누락 보정 (C~F)

- 신청서 제출로 확정될 때 ACTIVITY·MEAL·LODGING·TRANSPORTATION도 `settlement_calculation_detail`을 저장해 주세요.
  - 신청서의 근거를 `source_calculation_detail_id` 관계에 맞춰 복사합니다.
- 이미 확정된 건은 아래 둘 중 하나로 처리해 주세요.
  - (a) 보정 마이그레이션
  - (b) 응답 시점에 연결된 `settlement_application`의 근거로 대체
- 지급조서 확인(`statement_status=CONFIRMED`) 이후에는 `payment_statement_calculation_snapshot`이 정본이면 그 값을 우선해 주세요. 확인 후 정산 원본이 바뀌어도 모달 값이 바뀌지 않아야 합니다.
  - 현재 어느 쪽을 응답에 쓰는지 **확인 필요**합니다.
- `DRAFT`·`WAITING_CONFIRM`은 정산 원본(`settlement_calculation_detail`) 기준으로 반환합니다.
- 지급조서 `REJECTED` 건도 반려 당시 근거를 그대로 볼 수 있어야 합니다.

## 5. 하지 말아야 할 것

- 근거가 없는 항목을 현재 정책 단가·세율로 다시 계산해 채우지 않습니다.
- 현재 회원 정보·현재 일정으로 스냅샷 값을 바꾸지 않습니다.
- 기존 `Line` 필드와 금액·합계 계산을 바꾸지 않습니다(필드 추가만).
- 영수증 첨부를 항목과 추측으로 연결하지 않습니다.

## 6. 완료 기준

- 신청 #23(SUBMITTED)의 application-document `lines[]` 4행 모두에 `calculationDetail`이 있습니다.
  - 원천징수 행: `taxableAmount=500000`, `rate=0.033`, `withholdingTaxAmount=16500`
  - 활동비 23,000원, 식사비 30,000원 행에 각각 typed basis가 있습니다.
- RESUBMITTED·CORRECTION_REQUESTED·REJECTED revision을 `revisionNo`로 조회하면 각 revision의 근거가 나옵니다.
- 확정 정산 중 ACTIVITY·MEAL·LODGING·TRANSPORTATION이 있는 건(로컬 예: 1694979, 1694980, 1694926)은 정산 상세 `items[].calculationDetail`이 null이 아닙니다.
- `openapi/backend.openapi.json`과 `contracts/*`(openapi_frontend_handoff 등)에 `Line.calculationDetail`을 반영합니다.
- 테스트:
  - `SettlementApplicationDocumentServiceTest`, `SettlementApplicationDocumentHttpTest`에 상태별(SUBMITTED, RESUBMITTED, CORRECTION_REQUESTED, REJECTED, CONFIRMED) 근거 포함 케이스를 추가합니다.
  - 변경과 관련된 테스트만 실행해 주세요(`./gradlew test --tests '*SettlementApplicationDocument*'` 등). 전체 테스트는 실행하지 마세요.

## 7. 프론트 후속 작업 (BE 반영 후)

- `map-settlement-application-document-to-payment-statement-preview-options.ts`의 `buildCalculationLines`에서 `line.calculationDetail`을 행의 `basisDetail`로 연결합니다.
  - `payment-order-calculation-basis-detail.ts`의 기존 매퍼(`mapWithholdingRateCalculationDetailToBasisDetail`, `mapTransportationCalculationDetailToBasisDetail`, `mapLectureFeeCalculationDetailToBasisDetail` 등)를 재사용합니다.
- 생성 타입(`shared/api/generated/settlement`)을 다시 생성합니다.
