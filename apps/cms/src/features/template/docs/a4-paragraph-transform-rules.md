# A4 단락 변환 룰

## 목적
- 작성양식(동의양식)과 발급양식에서 A4 미리보기의 단락 렌더링을 일관되게 유지한다.
- 단락 `variant`가 A4(`contentOnly`)에서 어떤 UI로 변환되는지 명시한다.

## A4 적용 범위
- 작성양식 탭
  - 적용: `agreement-personal`, `agreement-third-party`, `agreement-notice`, `agreement-expense`, `agreement-portrait`
  - 제외: `agreement-crime` (전용 상세 모달 경로)
- 발급양식 탭
  - 적용: 인증서/수료증 제외 템플릿
  - 제외: `휴가 인증서`, `수료증`, `강사 활동 인증서`, `봉사 활동 인증서`

## 공통 변환 파이프라인
1. 템플릿별 세션 옵션 결정 (`previewLayout`, `a4RenderMode`, `hidden ids`, `gap`).
2. `TemplatePreviewModal`에서 A4 레이아웃 진입.
3. `useA4ParagraphPages`로 단락 높이 측정 후 페이지 분할.
4. `FormDocumentPreviewBody` -> `FormDocumentPreviewParagraph`에서 단락 `variant`별 렌더.

## variant별 A4 변환 규칙
- `survey_title_with_period`
  - A4 본문에는 설명/기간만 노출한다.
  - 문서 타이틀은 A4 상단 타이틀 레이어를 사용한다.
- `horizontal_table`
  - 기본은 `HorizontalTableParagraphBody`를 읽기 전용으로 렌더한다.
  - A4 `contentOnly` 모드에서는 지급조서(발급용) 기준과 동일하게 `document` 모드로 렌더한다.
  - 작성양식 탭 동의양식과 발급양식(인증서/수료증 제외)에 동일 규칙을 적용한다.
- `short_essay`
  - `contentOnly`에서 항목이 2개 이상이면 표 형태(`DocumentShortEssayTableReadonly`)로 변환한다.
  - 그 외는 텍스트 본문 블록으로 렌더한다.
- `session_plan_short_essay`, `subjective`
  - 텍스트 본문 블록으로 렌더한다.
- `multiple_choice`
  - 체크/라디오 마크(`☑/☐`, `●/○`) 기반 읽기 전용 행으로 렌더한다.
- `closing`
  - A4에서는 헤더 없이 본문 우측 정렬 스타일을 사용한다.
  - 서명 단락 id는 서명용 폰트 크기를 별도로 적용한다.
- `system`
  - 잠금 시스템 단락만 렌더한다.
  - A4에서는 헤더를 숨기고 본문만 노출한다.

## 템플릿별 오버라이드
- 지급조서(발급용)
  - hidden: 타이틀 단락
  - gap: 시드 단락 32, 그 외 16
  - body options: 지급조서 기본정보/강의비 산출/산출내역 샘플값
- 지급조서 사전 동의서
  - hidden/gap/body options를 사전동의 전용 설정으로 적용
- 정산 신청서
  - hidden/gap/body options를 정산신청 전용 설정으로 적용
- 행정정보 공동이용 사전 동의서
  - hidden: 타이틀 단락
  - gap: 시드 단락 32, 그 외 16
- 초상권 수집·이용 동의서
  - hidden: 타이틀 단락
  - gap: 시드 단락 32, 그 외 16
  - 구조 잠금 시드 단락(제목/안내문/3개 동의 섹션/확인 문구/날짜/서명) 고정
  - `horizontal_table` 3개 섹션은 표 하단 동의 라디오(`showBottomConsent`)를 포함한 상태로 렌더

## 신규 템플릿 추가 체크리스트
- 템플릿이 A4 적용 대상인지 분류한다.
- 필요 시 템플릿 전용 `hidden ids`, `gap resolver`, `paragraph body options`를 정의한다.
- `horizontal_table`이 포함된 경우, A4 `contentOnly`에서 `document` 모드로 렌더되는지 확인한다.
- `userPreview` URL 재진입 시에도 동일 A4 옵션이 적용되는지 확인한다.
- 미리보기/페이지분할/PDF 경로의 단락 순서와 스타일이 동일한지 확인한다.
