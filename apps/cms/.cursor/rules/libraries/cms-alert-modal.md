---
priority: medium
always_include: false
category: libraries
---

# CMS 공통 Alert 모달 (`AlertModal` / `useCmsAlert` / `cmsAlertModal`)

단일 **확인** 버튼으로 닫는 **안내·경고**용 모달. `ContentModal` 기반 레이아웃·타이포를 따릅니다.

## 배치

- 컴포넌트: `apps/cms/src/shared/ui/alert-modal.tsx`
- Provider·훅: `apps/cms/src/shared/ui/cms-alert-modal-provider.tsx`
- 비 React(인터셉터 등) API: `apps/cms/src/shared/ui/cms-alert-modal-api.ts`
- 루트: `main.tsx`에서 `<App>` 안에 **`CmsAlertModalProvider`**가 이미 감싸져 있음. 동일 트리 안의 페이지·훅에서 `useCmsAlert` 사용 가능.

## 언제 쓸지

- **적합**: 세션 만료 안내, 삭제/권한 등 **주의가 필요한 문구**, 버튼 비활성 대신 **설명이 긴 안내**, CRUD **실패 사유**를 모달로 고정해 읽게 할 때.
- **성공 토스트**: CMS에서는 사용하지 않음 ([no-antd-message.mdc](./no-antd-message.mdc)).

## React 컴포넌트 / 훅 안

`AlertModal`을 페이지마다 직접 마운트하지 말고 **`useCmsAlert`**만 사용합니다.

```tsx
import { useCmsAlert } from '@/shared/ui'

function Example() {
  const { showAlert, closeAlert } = useCmsAlert()

  const onNoSelection = () => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
      // width — px, 생략 시 600
      // confirmLabel — 기본 '확인'
      // zIndex — 다른 모달 위에 겹칠 때만 지정
    })
  }

  // 필요 시 프로그래밍으로 닫기
  // closeAlert()
}
```

- **`useCmsAlert`는 `CmsAlertModalProvider` 하위에서만** 호출 가능. 위반 시 런타임 에러.
- **`content`는 문자열**이며 `\n`은 줄바꿈으로 렌더됨(`white-space: pre-wrap`).

## React 밖 (HTTP 클라이언트·유틸·인터셉터)

Provider가 마운트된 뒤에만 동작합니다. **`cmsAlertModal`**만 import합니다.

```ts
import { cmsAlertModal, isCmsAlertModalReady } from '@/shared/ui'

if (isCmsAlertModalReady()) {
  cmsAlertModal.show({
    title: '세션 만료',
    content: '로그인이 만료되었습니다.\n다시 로그인해 주세요.',
  })
}

cmsAlertModal.close()
```

- Provider **마운트 전**에 `show`를 호출하면 **개발 모드에서 `console.warn` 후 무시**됨. 인터셉터는 가능하면 앱 기동 이후 경로에서만 호출되도록 두거나, `isCmsAlertModalReady()`로 가드.
- **`setCmsAlertModalListener`는 배럴에 노출하지 않음** — Provider 전용 구현 디테일.

## API 요약

| API | 용도 |
|-----|------|
| `useCmsAlert().showAlert(options)` | 컴포넌트·커스텀 훅 내부 |
| `useCmsAlert().closeAlert()` | 동일 |
| `cmsAlertModal.show(options)` | 인터셉터·비 React |
| `cmsAlertModal.close()` | 동일 |
| `isCmsAlertModalReady()` | 등록 여부 확인 |

`CmsAlertModalShowOptions`: `title`, `content`, 선택 `width`, `confirmLabel`, `zIndex`.

## `AlertModal` 직접 사용

동일 화면에 **여러 개**를 동시에 제어하거나 Provider 밖 스토리 등 **예외**에서만 `AlertModal` + 로컬 `open` state 사용. 일반 화면·전역 안내는 **훅 또는 `cmsAlertModal`**로 통일.

## 관련

- [Ant Design usage](./ant-design-usage.md) — `App`, `message` / `modal`  
- [Modal viewport centering](../design/modal-viewport-centering.md)  
- [API routes & apiClient](../data/api-routes-and-client.md) — 인터셉터 위치 참고  

**Last updated:** 2026-05-15
