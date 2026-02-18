# 대시보드 설정 모달 계획 — 모달 컴포넌트 재사용 추가

아래 내용을 기존 계획의 **「4.2 대시보드 설정 모달 UI」** 앞에 **「4.1.5 기존 모달 컴포넌트 재사용」** 섹션으로 추가한다.

---

## 4.1.5 기존 모달 컴포넌트 재사용

- **재사용 대상**: [`apps/cms/src/shared/ui/teal-header-modal.tsx`](apps/cms/src/shared/ui/teal-header-modal.tsx)의 **TealHeaderModal**
- **적합한 이유**:
  - 청록색 헤더(#47A9AD / `--color-modal-header`), 제목 + X 닫기, 푸터 옵션 등 스크린샷과 동일한 톤
  - `width` 기본값 800px → 요구사항 800px과 일치
  - `size="large"` 시 바디만 스크롤되는 구조(전체 최대 높이 840px)를 활용하거나, **최대 높이 720px**이 필요하면 `width={800}` + `className`으로 전용 클래스를 주어 CSS에서 `.ant-modal-content { max-height: 720px }` 적용
- **사용 방식**:
  - `DashboardSettingsModal`에서 Ant Design `Modal`을 직접 쓰지 않고, `TealHeaderModal`을 import하여 `open` / `onCancel` / `title="대시보드 설정"` / `footer={<닫기 버튼>}` / `children={섹션1+섹션2}` 로 감싼다.
  - 720px 제한을 위해 `TealHeaderModal`에 `className="teal-header-modal--dashboard-settings"` 등을 넘기고, `teal-header-modal.css` 또는 대시보드 전용 CSS에서 `.teal-header-modal--dashboard-settings .ant-modal-content { max-height: 720px }` 및 바디 스크롤 유지 규칙을 정의한다.
- **참고**: 동일한 TealHeaderModal은 `ApplicantInstructorDetailModal`, `SchoolDetailModal`, `AddInstructorModal`, `LectureAttendanceModal` 등에서 이미 사용 중이므로, 디자인 시스템과 동일한 헤더/닫기/푸터 스타일을 유지할 수 있다.

---

이 내용을 반영한 뒤, 「4.2 대시보드 설정 모달 UI」의 "Ant Design `Modal`" 표현은 "**TealHeaderModal**(기존 공통 모달)을 사용하여"로 수정한다.
