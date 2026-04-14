---
priority: critical
always_include: true
category: coding
---

# 신규 화면 커스텀 UI 우선 규칙

## 목적

CMS 신규 화면/신규 섹션 추가 시 UI 일관성, 테마 토큰 호환성, 유지보수성을 위해 **커스텀 UI 컴포넌트 우선 사용을 강제**합니다.

## 강제 규칙 (필수)

1. 신규 구현에서 Ant Design 원본 폼 컴포넌트(`Input`, `Select`, `Radio`, `DatePicker`, `Checkbox`, `Switch`, `Button`)를 직접 사용하지 않는다.
2. 아래 커스텀 UI를 우선 사용한다.
   - 입력: `CmsInput`
   - 선택: `CmsSelect`
   - 라디오: `CmsRadio` / `CmsRadioGroup`
   - 체크박스: `CmsCheckbox`
   - 토글: `CmsToggle`
   - 날짜: `CmsDatePicker` / `CmsDateRangePicker`
   - 버튼: `CmsButton` (또는 화면 맥락상 `AppButton`)
3. 신규 화면의 코드 리뷰 시, 원본 Ant 컴포넌트 직접 사용이 발견되면 기능 동작과 무관하게 수정 대상으로 본다.

## 예외 규칙 (매우 제한적)

- 커스텀 UI로 동일 기능 구현이 불가능하거나, 기존 공통 컴포넌트가 Ant 원본 API에 강하게 결합된 경우만 예외를 허용한다.
- 예외 사용 시 코드 근처에 반드시 아래 주석을 남긴다.

```tsx
// TODO(custom-ui): 커스텀 UI 부재로 Ant 원본 사용. 공통 컴포넌트 확장 후 치환 필요.
```

## 적용 범위

- `apps/cms/src/**` 내 신규 화면, 신규 모달, 신규 폼, 신규 필터 영역
- 기존 화면 수정 시에도 신규로 추가하는 입력 컨트롤에는 동일 규칙 적용

