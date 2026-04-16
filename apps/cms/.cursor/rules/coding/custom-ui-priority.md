---
priority: critical
always_include: true
category: coding
---

# 신규 화면 커스텀 UI 우선 규칙

## 목적

CMS 신규 화면/신규 섹션 추가 시 UI 일관성, 테마 토큰 호환성, 유지보수성을 위해 **공유 커스텀 UI를 무조건 최우선**으로 사용한다. 동등한 커스텀 컴포넌트가 있으면 Ant Design 원본을 화면에 직접 쓰지 않는다.

## 강제 규칙 (필수)

1. **기본 원칙**: `apps/cms/src/shared/ui/**`에 **동일 역할**이 있는 컨트롤이면 Ant Design 원본을 **무조건** 그 커스텀으로 치환한다. “빠른 구현”으로 `Button`·`Input` 등을 화면에 직접 두지 않는다.
2. 신규·수정 구간에서 아래 Ant 원본 **폼·액션** 컴포넌트를 직접 import·렌더링하지 않는다: `Input`, `Select`, `Radio`, `DatePicker`, `Checkbox`, `Switch`, `Button`.
3. **`apps/cms` 전용 — 아래 `Cms*`를 반드시 사용**한다 (회원 상세·목록·모달·동의 섹션 등 **모든 CMS feature** 포함). 동일 역할에 `AppButton` / `AppInput` 등을 새로 넣지 않는다.
   - 입력: `CmsInput` (`AppInput`은 기존 레거시 파일 유지용으로만 존재; **신규·수정 diff에는 쓰지 않음**)
   - 선택: `CmsSelect`
   - 라디오: `CmsRadio` / `CmsRadioGroup`
   - 체크박스: `CmsCheckbox`
   - 토글: `CmsToggle`
   - 날짜: `CmsDatePicker` / `CmsDateRangePicker`
   - **버튼: `CmsButton`만** (`variant`: `primary` | `secondary` | `default` | `delete`). 아웃라인형 보조 액션(예: 동의서 보기)은 `secondary`, 비활성·중립은 `default` + `disabled`.
4. **`AppButton` 금지 범위**: `apps/cms/src/**`에서 **신규 코드·수정 구간**에 `AppButton`을 추가·치환하여 사용하지 않는다. 이미 `AppButton`만 쓰는 레거시 파일을 건드릴 때는 가능한 한 `CmsButton`으로 같이 치환한다.
5. **신규 컴포넌트 스타일링 원칙**: 신규 컴포넌트에서 다른 feature 전용 CSS(`features/*/*.css`)를 import해서 재사용하지 않는다.
6. **className 의존 최소화**: 신규 화면/모달/폼은 기존 feature className 복붙으로 맞추지 말고, 공통 UI(`Cms*`, `shared/ui`)의 기본 스타일을 우선 사용한다.
7. 커스텀 UI 조합만으로 해결 가능한 경우, Ant 원본 컴포넌트와 feature 전용 className을 섞어 쓰지 않는다.
8. **상태·배지 표시**: 목록·테이블 셀에서 `Tag`로만 상태를 표현하지 말고, 가능하면 `StatusBadge` / `StatusDisplay` / 디자인 토큰 + `span` 등 공통 패턴을 사용한다. `Typography.Text`로 보조 문구만 넣는 것도 남발하지 않는다.
9. 코드 리뷰 시 위 위반은 **기능과 무관하게 반드시** 수정 대상이다.
10. 회원/강사 계열의 신규 등록·수정 폼에서 상세 정보 섹션은 `DetailInfoForm` 공통 레이아웃(`Row`, `Field`, `NameBlock`)을 우선 사용한다.
11. `apps/cms/src/features/user/shared/ui/add-user-individual.tsx`는 기본 정보·동의 섹션을 `DetailInfoForm` 패턴으로 유지한다.

## 예외 규칙 (매우 제한적)

- 커스텀 UI로 동일 기능 구현이 불가능하거나, 기존 공통 컴포넌트가 Ant 원본 API에 강하게 결합된 경우만 예외를 허용한다.
- 예외 사용 시 코드 근처에 반드시 아래 주석을 남긴다.

```tsx
// TODO(custom-ui): 커스텀 UI 부재로 Ant 원본 사용. 공통 컴포넌트 확장 후 치환 필요.
```

## 적용 범위

- `apps/cms/src/**` 내 신규 화면, 신규 모달, 신규 폼, 신규 필터 영역
- 기존 화면 수정 시에도 신규로 추가하는 입력 컨트롤에는 동일 규칙 적용

