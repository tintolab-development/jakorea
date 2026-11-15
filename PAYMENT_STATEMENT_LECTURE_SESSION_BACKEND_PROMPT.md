# [BE] 지급조서 PDF · 산출 내역서 — 교육 진행 일자 `날짜 │ 회차/차시` 형식 맞춤

## 목표
지급조서 다운로드(PDF)의 「교육 진행 일자」 칸을 CMS 산출 내역서 시안과 같게 만든다.

- 시안: Figma `U6QntWGwBOxMszahPxjmGX` node `8248:147086` (Popup / Table / w1400 / 산출 내역서)
- 교육 진행 일자 칸: `2026.12.08(월)` │ `2회차` (구분선 1×13, 문구 14px Medium #3D3D3D)
- 날짜는 `YYYY.MM.DD(요일)`, 뒤 조각은 회차·차시·일정명 **한 가지만** 나온다. 날짜·시간을 다시 쓰지 않는다.

## 현재 문제 (로컬 재현)
- 정산 `1694926` (프로그램 `186325`, 강사 `190001`)
- `GET /api/admin/settlements/1694926` 응답: `lectureSessionDisplay: "2026-09-01"`, `sessionOrdinal: 1`
- 지급조서 PDF 교육 진행 일자 칸이 `2026.09.01(화) │ 2026-09-01`로 나온다. 같은 날짜가 원문 형식으로 한 번 더 찍힌다.

### 원인
1. `SettlementLectureSessionDisplay.format(...)`는 `YYYY-MM-DD[ HH:mm~HH:mm][ · 뒤 조각]`을 만든다. 날짜·시간이 항상 앞에 붙는다.
2. `PaymentStatementServerPdfRenderer.StatementView.sessionDisplay()`는 이 원문을 그대로 쓴다. 그래서 `drawDateCell`이 `lectureDateDisplay()`(이미 `YYYY.MM.DD(요일)`) 옆에 날짜를 한 번 더 그린다.
3. 이 정산은 뒤 조각(`structureSuffix`)이 null이라 날짜만 남는다. `session_no`가 1인데도 `N회차`가 붙지 않았다.

## 요청 사항

### 1. PDF 교육 진행 일자 칸 뒤 조각 정리 (필수)
- 파일: `src/main/java/com/jakorea/cms/settlement/service/PaymentStatementServerPdfRenderer.java`
- `sessionDisplay()`에서 `lectureSessionDisplay` 앞의 `YYYY-MM-DD`와 선택적인 ` HH:mm~HH:mm`을 떼고 ` · ` 뒤 조각만 쓴다.
- 뒤 조각이 없으면 `drawDateCell` / `dateCellLines`에서 **구분선과 뒤 조각을 그리지 않고** 날짜만 가운데 정렬한다. 지금은 `-`를 그린다.
- 패턴이 맞지 않는 값(예: `사전교육`, 일정명만 있는 값)은 원문 그대로 둔다.
- 회차↔차시 단위 변환, `sessionNo`로 문구를 다시 만드는 것은 하지 않는다(기존 정책).
- 프론트 기준 동작(이미 반영됨, 같은 규칙으로 맞춰 주세요): `apps/cms/src/features/settlement/ui/payment-record/payment-order-calculation-basis-detail.ts`의 `resolveLectureSessionSegmentDisplay`

| 입력 `lectureSessionDisplay` | 뒤 조각 |
|---|---|
| `2026-09-01` | (없음 → 날짜만) |
| `2026-09-01 · 2회차` | `2회차` |
| `2026-09-01 10:00~12:00 · 3차시` | `3차시` |
| `2026-09-01 10:00~12:00` | (없음 → 날짜만) |
| `사전교육` | `사전교육` |

### 2. 뒤 조각이 비는 원인 확인 (확인 후 보고)
- 정산 `1694926`은 `session_no = 1`인데 `structureSuffix`가 null이다.
- 해당 프로그램의 `education_structure` / `session_round` / `schedule_name` / 커리큘럼 차시 값이 무엇인지 확인한다.
- 그 결과가 정책상 맞는지(데이터 누락인지, 해당 구조에서는 원래 표시하지 않는지) 보고한다.
- 정책 판단이 필요하면 임의로 fallback(`N회차` 등)을 추가하지 말고 질문으로 남긴다.

### 3. (선택) API 계약 정리 제안
- 프론트·PDF가 모두 앞 날짜를 떼서 쓰고 있다. 뒤 조각만 담은 필드(예: `lectureSessionSegmentDisplay`)를 따로 둘지 의견을 달라.
- 기존 `lectureSessionDisplay` 형식은 바꾸지 않는다. 강의보고서 등 다른 소비처가 있다.

## 완료 기준
- 위 표의 입력별 PDF 결과가 단위 테스트로 고정된다.
  - `PaymentStatementServerPdfRendererTest`
  - 필요하면 `SettlementLectureSessionDisplayTest`
- 로컬에서 정산 `1694926` 지급조서를 내려받으면 교육 진행 일자 칸에 날짜가 한 번만(`2026.09.01(화)`) 나온다.
- 변경 범위 밖 파일과 API 응답 형식은 바꾸지 않는다.
- 전체 테스트가 아니라 관련 테스트만 실행하고, 실행 목록을 보고한다.
