# [BE 요청] 산출 내역서 누락 항목 (2026-11-12, 프론트 → 백엔드 keonhee)

대상 API: `GET /api/admin/settlements/{settlementId}` (`SettlementFrontendResponse`)
화면: CMS 정산 관리 > 지급조서 확인 > 산출 내역서, 산정 기준 상세 모달

프론트는 이 응답의 문구와 값을 그대로 표시합니다(항목 설명, 교육 진행 일자의 두 번째 칸, 모달의 강의 시간). 회차·차시·시간을 프론트가 다시 만들지 않는 것이 현재 계약이므로, 아래 항목은 백엔드 응답에서 채워 주셔야 합니다.

- 로컬 재현 계정: `admin1@jakorea.org` (MFA `000000`)
- 로컬 재현 URL: `http://localhost:3000/settlement-management/payment-orders?po_exp=instructor&po_inst=김성재&po_from=2026-04-02&po_to=2026-04-02`

---

## B1. Gemini 교육 진행 일자에 시간이 없음

- **현상**: 1694964(김성재, 2026-04-02 10:00~11:30)의 교육 진행 일자가 `2026.04.02(목) | —`로 나옵니다.
- **원인**
  - `lectureSessionDisplay`는 `program_schedule.start_at/end_at`으로만 만듭니다(`SettlementAdminQueryService.java:794-807`).
  - Gemini 정산은 `program_schedule_id`가 NULL이라 날짜·시간 부분이 비어 있습니다.
  - `settlement.lecture_started_at_snapshot`/`lecture_ended_at_snapshot`에는 시각이 있는데(컷오버 SQL과 writer가 저장함), 이 API는 읽지 않습니다.
- **요청**: schedule이 없을 때는 `lecture_started_at_snapshot`/`lecture_ended_at_snapshot`으로 `lectureSessionDisplay`를 채워 주세요.
  - 표기는 일반 정산과 같은 `SettlementLectureSessionDisplay` 규칙을 따릅니다.
  - Gemini 뒷부분(차시)을 `classCount` 기반 `N차시`로 붙일지는 **확인 필요**입니다. 예: `10:00~11:30 · 2차시`

## B2. Gemini 강사비 산정 기준 상세의 강의 시간이 '-'

- **현상**: 강사비 모달이 구분 `Gemini 강사비`, 강의 시간 `-`, 강사비 책정 `170,000원`으로 나옵니다.
- **원인**
  - 저장된 basis는 `{"itemType":"LECTURE_FEE","amount":170000,"source":"GEMINI_TRAINING_REPORT","classCount":2,...}`입니다.
  - `SettlementFrontendResponseMapper.enrichLectureFeeCalculationDetail`(`:245-303`)은 basis에 `sessionOrdinal`/`lectureTimeDisplay`가 없으면 detail을 새로 만듭니다.
  - 이때 `lectureTimeDisplay`는 `lectureSessionDisplay`가 있을 때만 넣고(`:282-301`), `classCount`는 버립니다.
- **요청**: Gemini 합성 basis에 `lectureTimeDisplay`를 넣어 주세요(`classCount` 기반 `"2차시"`). 프론트는 이 값을 그대로 표시합니다.

기대 응답 (`items[0].calculationDetail.basisJson`):
~~~json
{"layout":"lectureFeeGemini","itemType":"LECTURE_FEE","wageItemType":"GEMINI","categoryLabel":"Gemini 강사비","feeAssessmentWon":170000,"amount":170000,"lectureTimeDisplay":"2차시"}
~~~

## B3. Gemini `recognizedSessionCount`가 null

- **현상**: DTO 설명(`SettlementFrontendResponse.java:60-63`)은 "Gemini는 class_count"인데, 실제 값은 null입니다.
- **원인**
  - `snapshotRootNonNegativeInt(rawSnapshot, "recognizedSessionCount")`(`SettlementAdminQueryService.java:814`)가 스냅샷 루트에서 이 키를 찾습니다.
  - Gemini 스냅샷(`GeminiTrainingAccountPaymentWriter.calculationSnapshotJson`)과 컷오버 SQL에는 이 키가 없습니다.
- **요청**: Gemini는 `classCount`로 채우거나, DTO 설명을 실제 동작에 맞춰 주세요.

## B4. 식사비·참여자 활동비·교통비(신청서 제출) 행에 산출 근거가 없음

- **현상**: 산정 기준 '상세 보기'를 누르면 "이 지급 항목의 산정 기준 상세 레이아웃이 없습니다" 알림이 뜹니다.
  - 교통비는 프론트가 금액만 넣은 "거리 스냅샷 미연결" 화면으로 대체합니다.
- **원인**
  - `frontendCalculationDetail(type, settlement.calculationDetails())`가 해당 유형의 `settlement_calculation_detail`을 찾지 못하면 null을 보냅니다(`SettlementFrontendResponseMapper.java:69-70`).
  - 신청서 제출 건은 LECTURE_FEE·WITHHOLDING_TAX 상세만 저장됩니다.
- **로컬 재현 데이터** (`settlement_item`은 있고, 같은 유형의 `settlement_calculation_detail`은 없음)

  | settlementId | 항목 | 금액 |
  |---|---|---|
  | 1694979 | ACTIVITY | 23,000 |
  | 1694979 | MEAL | 30,000 |
  | 1694980 | MEAL | 30,000 |
  | 1694926 | TRANSPORTATION | 199,052 |

- **요청**: 이 유형들도 시안의 모달 필드를 채울 수 있는 `calculationDetail`을 내려 주세요. 프론트가 바로 쓸 수 있는 typed basis 키는 아래와 같습니다.
  - 식사비: `{"layout":"meal","categoryLabel","mealFee":{"amountWon","receipt*"},"totalWon"}`
  - 참여자 활동비: `{"layout":"activity","categoryLabel","activityFee":{"amountWon",...},"totalWon"}`
  - 숙박비: `{"layout":"lodgingGeneral"|"lodging1s1g","categoryLabel","nightsDisplay","lodgingFee":{"amountWon",...},"totalWon"}`
  - 교통비: 거리 스냅샷 키 `oneWayDistanceKm`, `roundTripDistanceKm`, `fuelType`, `fuelCostWon`, `tollAmount`, `calculatedTransportAmount`, `provider`, `snapshotAt`
  - typed가 어렵다면 remote 형식(`title`, `formulaText`, `lineLabels`, `formulaLines`, `resultAmount`)도 표시할 수 있습니다.
  - 정확한 필드 구성은 시안 기준으로 **확인 필요**입니다.

## B5. 강사비 외 항목의 항목 설명이 비어 '—'로 나옴

- **현상**: 항목 설명 칸이 `—`로 나옵니다.
- **원인**: 응답의 `items[].description`은 `settlement_item.description`을 쓰고, 비어 있으면 강사비만 `instructorFeeDescription`으로 채웁니다(`SettlementFrontendResponseMapper.java:64-68`). 다른 유형은 null로 나갑니다.
- **로컬 재현 데이터** (description이 빈 값)

  | settlementId | 항목 |
  |---|---|
  | 188501, 188503 | TRANSPORTATION, WITHHOLDING |
  | 188504 | WITHHOLDING |
  | 1694926 | TRANSPORTATION |
  | 1694932 | WITHHOLDING |
  | 1694979 | ACTIVITY, MEAL |

  - 참고: 1694980 MEAL은 "1인 1식 기준, 최대 30,000원 이내 실비 지급", 1694979 WITHHOLDING은 "원천징수 3.3% (소득세 3% + 지방소득세 0.3%)"로 채워져 있습니다.
- **요청**: 빈 description을 `SettlementItemDescriptionPolicy` 기준으로 유형별로 채워 주세요(저장 보정 또는 응답 시 대체).

---

## 추가 확인 사항 (프론트 범위, 이번에는 수정하지 않음)

- Gemini 강사비 모달의 제목이 "제미나이 강사비 산정 기준"입니다(`payment-order-calculation-basis-detail-lecture-fee-tier-view.tsx:88`). 시안 문구를 확인한 뒤 맞춥니다.
- `OTHER_LABOR` 임금 항목은 강사비 제목 매핑이 없어 구분이 `-`로 나올 수 있습니다. 서버 `lectureFeeStandardTitle`이 오면 그 값이 우선합니다.
- 빈 값 표기가 지급조서 쪽은 `—`, 계좌 지급 쪽은 `-`로 섞여 있습니다.
