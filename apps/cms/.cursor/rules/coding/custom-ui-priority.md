---
priority: critical
always_include: true
category: coding
---

# 신규 화면 커스텀 UI 우선 규칙

## 목적

CMS 신규 화면/신규 섹션 추가 시 UI 일관성, 테마 토큰 호환성, 유지보수성을 위해 **공유 커스텀 UI를 무조건 최우선**으로 사용한다. 동등한 커스텀 컴포넌트가 있으면 Ant Design 원본을 화면에 직접 쓰지 않는다.

## 강제 규칙 (필수)

1. **기본 원칙**: `apps/cms/src/shared/ui/**` 및 프로젝트에서 약속한 `App*` 컨트롤과 **동일 역할**을 하는 Ant Design 원본을 **무조건** 커스텀으로 치환한다. “빠른 구현” 등 사유로 원본을 먼저 넣는 것을 허용하지 않는다.
2. 신규·수정 구간에서 아래 Ant 원본 **폼·액션** 컴포넌트를 직접 import·렌더링하지 않는다: `Input`, `Select`, `Radio`, `DatePicker`, `Checkbox`, `Switch`, `Button`.
3. 아래 커스텀 UI를 **반드시** 사용한다 (동일 파일·동일 패턴으로 통일).
   - 입력: `CmsInput` (`AppInput`은 레거시/특수 맥락에서만)
   - 선택: `CmsSelect`
   - 라디오: `CmsRadio` / `CmsRadioGroup`
   - 체크박스: `CmsCheckbox`
   - 토글: `CmsToggle`
   - 날짜: `CmsDatePicker` / `CmsDateRangePicker`
   - 버튼: `CmsButton` (또는 화면 맥락상 `AppButton`)
4. **상태·배지 표시**: 목록·테이블 셀에서 `Tag`로만 상태를 표현하지 말고, 가능하면 `StatusBadge` / `StatusDisplay` / 디자인 토큰 + `span` 등 공통 패턴을 사용한다. `Typography.Text`로 보조 문구만 넣는 것도 남발하지 않는다.
5. 코드 리뷰 시 위 위반은 **기능과 무관하게 반드시** 수정 대상이다.

## 예외 규칙 (매우 제한적)

- 커스텀 UI로 동일 기능 구현이 불가능하거나, 기존 공통 컴포넌트가 Ant 원본 API에 강하게 결합된 경우만 예외를 허용한다.
- 예외 사용 시 코드 근처에 반드시 아래 주석을 남긴다.

```tsx
// TODO(custom-ui): 커스텀 UI 부재로 Ant 원본 사용. 공통 컴포넌트 확장 후 치환 필요.
```

## 적용 범위

- `apps/cms/src/**` 내 신규 화면, 신규 모달, 신규 폼, 신규 필터 영역
- 기존 화면 수정 시에도 신규로 추가하는 입력 컨트롤에는 동일 규칙 적용

