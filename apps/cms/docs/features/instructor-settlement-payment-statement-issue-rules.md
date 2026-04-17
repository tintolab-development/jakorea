# 강사 상세 · 정산 현황 — 지급조서 발급 규칙 (CMS)

## 발급 가능 조건

- **정산 현황**이 아래 중 하나일 때만 **지급조서 발급** 버튼으로 발급 플로우 진행(현재는 성공 토스트·추후 API 연동).
  - **지급조서 확인 완료** (`payment_statement_verified`)
  - **계좌 지급 완료** (`account_paid`)

코드 상수: `INSTRUCTOR_SETTLEMENT_STATUSES_ELIGIBLE_FOR_PAYMENT_STATEMENT_ISSUE`, `isInstructorSettlementEligibleForPaymentStatementIssue()`  
(`apps/cms/src/data/mock/instructor-member-settlements.ts`)

## 발급 불가 시 UI

- 위 조건을 만족하지 않는 행이 선택에 포함된 채로 **지급조서 발급** 클릭 시 **지급조서 발급 불가 안내** 모달.
- **선택 1건**이고 그 1건이 부적격이면: 해당 항목 기준 2문단 안내.
- **선택 2건 이상**(부적격이 하나라도 포함): `선택한 N개의 항목 중 …` 형식(N = 선택한 총 건수).

## 참고 구현

- 모달: `InstructorPaymentStatementBlockedModal`  
- 호출: `InstructorPaymentTab` → `handleBulkDownload`
