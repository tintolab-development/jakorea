# 05 — 프론트엔드 아키텍처 상세 설계 · Cursor 교차검증 기준

> 대상: `apps/<name>` 신규 CMS/Admin 프론트엔드  
> 기준 단계: L0 스캐폴드 → P1 첫 CRUD 수직 슬라이스 → 반복 납품 시 P2 패키지 승격  
> 기준일: 2026-08-06

이 문서는 신규 CMS 솔루션의 프론트엔드 구조를 **구현 가능한 수준으로 고정**하고, 개발자와 Cursor 에이전트가 동일한 기준으로 설계·구현·리뷰를 교차검증하기 위한 실행 규약이다.

관련 문서:

- [README — Admin Platform Kit](./README.md)
- [01 — 신규 프로젝트 필수 vs JA 전용 도메인 맵](./01-domain-mapping.md)
- [02 — Admin Starter L0 체크리스트](./02-l0-starter-checklist.md)
- [03 — 첫 목록 CRUD 수직 슬라이스 기준](./03-first-vertical-slice.md)
- [04 — 패키지 승격 범위](./04-package-promotion-scope.md)
- [06 — JaKorea 모노레포 적용 가이드](./06-jakorea-monorepo-adoption.md) (앱별 갭·플레이북)

---

## 0. 문서 사용법

### 0.1 개발자

1. 기능 착수 전에 §2의 범위 분류표를 작성한다.
2. §4 디렉터리와 §5 import 방향을 기준으로 파일 위치를 결정한다.
3. §10의 수직 슬라이스 순서로 구현한다.
4. §17 명령을 실행한다.
5. §19 완료 보고서를 PR에 첨부한다.

### 0.2 Cursor 에이전트

1. 코드 변경 전 §1의 SSOT를 읽는다.
2. 변경 대상이 Kit인지 앱 도메인인지 먼저 판정한다.
3. 예상 파일 목록과 import 방향을 출력한다.
4. 변경 후 §17의 정적 검증을 실행한다.
5. §19 형식으로 근거와 예외를 보고한다.

### 0.3 이 문서가 답하지 않는 것

다음은 프로젝트별 별도 문서가 소유한다.

- 실제 업무 도메인과 상태 전이
- 백엔드 API의 최종 request/response 계약
- 조직별 역할·권한 정책 본문
- JA 프로그램·정산·동의 정책
- 배포 인프라와 운영 승인 절차

---

# 1. SSOT와 충돌 해결 순서

코드, Cursor rule, 기존 앱 구현이 서로 다를 수 있다. 다음 우선순위를 따른다.

| 우선순위 | SSOT | 판정 범위 |
|---:|---|---|
| 1 | 승인된 신규 프로젝트 요구사항·API 계약 | 제품 동작·필드·권한 |
| 2 | `.cursor/rules/cms-admin-ui/*` | UI 수치·필터·목록·테이블 규격 |
| 3 | 이 문서와 `01~04` 문서 | 아키텍처·경계·단계·DoD |
| 4 | `apps/admin` | L0 셸·공통 UI 구현 of record |
| 5 | `apps/cms/src/shared/*` | admin에 없는 공통 패턴의 파일 단위 참고 |
| 6 | `apps/cms/src/features/*` | 도메인 참고만, 복사 근거로 사용 금지 |

### 충돌 판정

```text
요구사항과 UI rule 충돌       → 요구사항을 우선하되 rule 예외를 문서화
rule과 apps/admin 구현 충돌    → rule 우선, 구현을 수정
문서와 기존 CMS feature 충돌  → 문서 우선, feature 복사 금지
신규 앱과 CMS 타입 충돌        → 신규 앱 계약을 새로 정의
```

### Cursor 필수 보고

충돌을 발견하면 임의로 한쪽을 선택하지 말고 다음을 남긴다.

```text
[SSOT 충돌]
- 대상:
- 상위 기준:
- 하위 구현:
- 선택:
- 수정 파일:
- 예외 만료 조건:
```

---

# 2. 솔루션 경계

## 2.1 한 줄 아키텍처

**제품 독립 Admin Platform Kit 위에 프로젝트별 도메인 수직 슬라이스를 조합한다.**

```text
┌─────────────────────────────────────────────────────────┐
│ App Composition                                         │
│ Router · Menu · Branding · Role · Permission Policy     │
├─────────────────────────────────────────────────────────┤
│ Project Domain                                          │
│ pages · features · entities                             │
├─────────────────────────────────────────────────────────┤
│ Admin Platform Kit                                      │
│ providers · layout · shared/ui · shared/lib · HTTP/RQ   │
├─────────────────────────────────────────────────────────┤
│ Optional Capabilities                                   │
│ form-* · rich-text · location · identity · social-auth  │
└─────────────────────────────────────────────────────────┘
```

## 2.2 범위 분류

모든 요구사항은 구현 전에 다음 중 하나로 분류한다.

| 분류 | 의미 | 구현 위치 |
|---|---|---|
| Kit 필수 | 제품과 무관하게 반복되는 셸·primitive | `app`, `widgets/layout`, `shared` |
| Kit 선택 | 특정 요구가 있을 때만 추가 | workspace package 또는 선택 feature |
| JA 전용 | 기존 CMS 정책에 결합 | 기본 이식 금지 |
| 신규 구현 | 새 제품의 업무 기능 | `entities`, `features`, `pages` |

### 착수 워크시트

| 요구 기능 | 분류 | 소유 레이어 | 참고 소스 | 복사 여부 | 결정 근거 |
|---|---|---|---|---|---|
| 로그인·세션 | Kit 필수 | `features/auth` + app guard | CMS auth 골격 | 파일 선별 | 엔드포인트·카피 교체 |
| 메뉴·역할 | Kit primitive + 앱 정책 | `shared/config` | admin 형태 | 형태만 | 앱 enum 소유 |
| 목록 CRUD | 신규 구현 | entity/feature/page | hero/list 패턴 | 패턴만 | 신규 API 계약 |
| 동적 양식 | Kit 선택 | package adapter | `form-*` | opt-in | 요구 시만 |
| 정산 | JA 전용 또는 신규 | 앱 domain | CMS settlement | 복사 금지 | 상태머신 재설계 |

## 2.3 하드 경계

다음 경로 또는 신호가 있으면 Kit 이식 대상이 아니다.

```text
features/program/**
features/settlement*/**
features/template/**
features/user/** 중 약관·동의 정책
JA 전용 menu-config 본문
CMS permissions 정책 테이블 본문
data/mock 전역 계층
VITE_REAL_API_MODULES 기반 전역 이중 경로
```

---

# 3. 기술 스택과 의존성 원칙

## 3.1 L0 기준 스택

| 영역 | 기준 |
|---|---|
| Runtime | React `^19.2` |
| Build | Vite `^7` |
| Language | TypeScript `~5.9` |
| UI | antd `^5.28`, icons, cssinjs |
| Router | react-router-dom `^7` |
| Server state | `@tanstack/react-query` `^5` |
| HTTP | axios `^1.7` |
| Form | React Hook Form + zod + resolvers |
| Date | dayjs |
| Workspace | `@jakorea/utils` 최소 |
| Styling | Pretendard + Admin theme/token CSS |

## 3.2 의존성 추가 게이트

새 의존성은 다음 세 질문을 모두 통과해야 한다.

```text
[ ] 현재 수직 슬라이스에 실제 사용되는가?
[ ] shared primitive로 해결할 수 없는가?
[ ] 제거 비용과 번들 비용이 문서화되었는가?
```

L0에서 요구가 없으면 추가하지 않는다.

- `@dnd-kit/*`
- `recharts`
- `fortune-sheet`
- 리치텍스트
- 동적 폼 런타임
- 전역 상태관리 라이브러리

## 3.3 상태 관리 선택 기준

| 상태 종류 | 도구 | 예시 |
|---|---|---|
| 서버 상태 | TanStack Query | 목록, 상세, 권한 조회 |
| URL 상태 | Router search params | 필터, 페이지, 정렬 |
| 폼 상태 | RHF | 등록·수정 입력 |
| 짧은 UI 상태 | `useState`/`useReducer` | 모달, 선택 row |
| 세션 상태 | auth store/provider | 로그인 사용자, 토큰 |
| 전역 업무 상태 | 원칙적으로 금지 | 필요한 경우 ADR 작성 |

서버 응답을 Zustand/Context에 중복 저장하지 않는다.

---

# 4. 목표 디렉터리

```text
apps/<name>/
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ index.html
├─ .env.example
├─ README.md
├─ public/
└─ src/
   ├─ main.tsx
   ├─ index.css
   ├─ vite-env.d.ts
   │
   ├─ app/
   │  ├─ providers/
   │  │  ├─ app-providers.tsx
   │  │  ├─ theme-provider.tsx
   │  │  ├─ theme-provider.css
   │  │  ├─ query-provider.tsx
   │  │  ├─ error-boundary.tsx
   │  │  ├─ ant-modal-motion-disable.css
   │  │  └─ auth-provider.tsx              # auth 사용 시
   │  ├─ router/
   │  │  ├─ index.tsx
   │  │  ├─ route-paths.ts
   │  │  └─ route-error-page.tsx
   │  └─ components/
   │     ├─ protected-route.tsx
   │     └─ permission-route.tsx            # 필요 시
   │
   ├─ widgets/
   │  └─ layout/
   │     ├─ index.ts
   │     ├─ layout.tsx
   │     ├─ layout.css
   │     ├─ sidebar.tsx
   │     ├─ sidebar.css
   │     ├─ main-header.tsx
   │     ├─ main-header.css
   │     └─ notification-dropdown.*         # 앱 기능이면 별도 feature 권장
   │
   ├─ pages/
   │  ├─ home/
   │  │  └─ page.tsx
   │  ├─ login/
   │  │  └─ page.tsx                        # auth 사용 시
   │  ├─ placeholder/
   │  │  └─ page.tsx
   │  └─ <area>/
   │     └─ <resource-list>/
   │        ├─ page.tsx
   │        ├─ page.css
   │        └─ columns.tsx                  # 컬럼이 클 때만
   │
   ├─ features/
   │  ├─ auth/
   │  │  ├─ api/
   │  │  ├─ model/
   │  │  └─ ui/
   │  └─ <resource>/
   │     ├─ api/
   │     │  ├─ capabilities.ts
   │     │  ├─ query-keys.ts
   │     │  ├─ service.ts
   │     │  └─ hooks.ts
   │     ├─ model/
   │     │  ├─ schema.ts
   │     │  └─ mapper.ts                    # API↔form 변환 필요 시
   │     └─ ui/
   │        ├─ form-modal.tsx
   │        └─ delete-confirm.tsx           # 조합이 복잡할 때만
   │
   ├─ entities/
   │  ├─ session/
   │  │  └─ model/types.ts
   │  └─ <resource>/
   │     ├─ model/types.ts
   │     └─ lib/formatters.ts               # 순수 도메인 표현만
   │
   └─ shared/
      ├─ config/
      │  ├─ environment.ts
      │  ├─ menu-config.tsx
      │  ├─ permissions.ts
      │  └─ query-defaults.ts
      ├─ constants/
      │  ├─ colors.ts
      │  ├─ filter-field-width.ts
      │  ├─ modal-z-index.ts
      │  └─ table.ts
      ├─ instance/
      │  └─ axios-instance.ts
      ├─ lib/
      │  ├─ query-client.ts
      │  ├─ use-list-filter-url.ts
      │  ├─ use-table-search.ts
      │  ├─ url-date-range-pending-sync.ts
      │  ├─ api-error.ts
      │  └─ invariant.ts
      └─ ui/
         ├─ index.ts
         ├─ cms-button.*
         ├─ cms-input.*
         ├─ cms-select.*
         ├─ cms-textarea.*
         ├─ cms-datepicker.*
         ├─ cms-period-datepicker.*
         ├─ cms-radio.*
         ├─ cms-text-tabs.*
         ├─ cms-data-table.css
         ├─ admin-filter-area.css
         ├─ list-table-layout.css
         ├─ alert-modal.*
         ├─ confirm-modal.*
         ├─ content-modal.*
         ├─ teal-header-modal.*
         └─ file-select-field.*             # 필요 시만
```

## 4.1 디렉터리 책임

| 레이어 | 책임 | 금지 |
|---|---|---|
| `app` | 앱 조립, 전역 provider, router | 도메인 API 호출 |
| `pages` | 라우트 단위 화면 조합 | 재사용 primitive 구현 |
| `widgets` | 큰 화면 블록, 레이아웃 | 특정 페이지 API 소유 |
| `features` | 사용자 행동/use case | 타 feature 내부 직접 참조 |
| `entities` | 도메인 타입·순수 표현 | API mutation, page 상태 |
| `shared` | 제품 독립 공통 코드 | 도메인 이름·업무 정책 |

## 4.2 파일 배치 판정 질문

```text
Q1. 특정 업무 리소스 이름이 들어가는가?
  Yes → shared 금지

Q2. 사용자 행동(create/update/delete/approve)인가?
  Yes → features

Q3. URL 하나에 대응하는 조합 화면인가?
  Yes → pages

Q4. 라우터와 무관한 큰 레이아웃 블록인가?
  Yes → widgets

Q5. 여러 feature가 공유하는 도메인 타입인가?
  Yes → entities

Q6. 어떤 제품에서도 그대로 쓸 수 있는가?
  Yes → shared 후보
```

---

# 5. FSD import 규칙

## 5.1 허용 방향

```text
app      → pages, widgets, features, entities, shared
pages    → widgets, features, entities, shared
widgets  → features, entities, shared
features → entities, shared
entities → shared
shared   → shared only
```

## 5.2 금지 예시

```ts
// 금지: shared가 도메인 feature를 참조
import { useCreateItem } from '@/features/item/api/hooks';

// 금지: entity가 page를 참조
import ItemListPage from '@/pages/item-list/page';

// 금지: 신규 앱에서 CMS 내부를 직접 참조
import { CmsButton } from '../../../cms/src/shared/ui';

// 금지: feature 간 내부 파일 결합
import { internalMapper } from '@/features/member/model/internal-mapper';
```

feature 간 협력이 필요하면 다음 순서로 해결한다.

1. 공통 타입을 `entities`로 내린다.
2. 페이지에서 두 feature를 조합한다.
3. 정말 하나의 use case라면 feature 경계를 재설계한다.

## 5.3 public API

L0에서는 과도한 barrel을 만들지 않는다.

- `shared/ui/index.ts`: 안정된 공통 UI만 export
- feature 내부: 명시적 경로 import 허용
- entities: `model/types.ts` 직접 import 허용
- 순환 참조를 숨기는 `index.ts` 남용 금지

---

# 6. 앱 부트스트랩과 Provider

## 6.1 권장 조합 순서

```text
main.tsx
└─ ErrorBoundary
   └─ ThemeProvider
      └─ QueryProvider
         └─ antd App
            └─ AlertModalProvider
               └─ AuthProvider            # auth 사용 시
                  └─ RouterProvider
```

## 6.2 Provider 책임

| Provider | 책임 | 알면 안 되는 것 |
|---|---|---|
| Theme | 토큰·폰트·antd theme | 업무 리소스 |
| Query | QueryClient 기본값 | 특정 query key |
| Alert | 전역 alert API | mutation 세부 정책 |
| Auth | session bootstrap·logout | 페이지 레이아웃 |
| Router | route composition | axios 토큰 저장 방식 |

## 6.3 Query 기본값 권장

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

프로젝트 요구에 따라 수치는 조정할 수 있으나 전역 기본값 변경은 ADR 또는 PR 근거를 남긴다.

## 6.4 ErrorBoundary 범위

- 앱 초기 렌더 실패를 처리한다.
- API 4xx/5xx를 모두 ErrorBoundary로 던지지 않는다.
- 목록 로딩·에러·empty는 페이지에서 구분한다.
- 예기치 않은 렌더 예외에는 재시도 또는 홈 이동 수단을 제공한다.

---

# 7. 라우팅·메뉴 조합

## 7.1 라우트 경로 SSOT

문자열 중복을 줄이기 위해 앱 경로를 한 파일에서 소유한다.

```ts
export const ROUTE_PATHS = {
  home: '/',
  login: '/login',
  items: '/management/items',
  itemDetail: (id: string) => `/management/items/${id}`,
} as const;
```

## 7.2 메뉴 타입

```ts
export type AppMenuItem = {
  key: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: AppMenuItem[];
  allowedRoles?: AdminRole[];
  requiredPermission?: PermissionCode;
};
```

## 7.3 라우터와 메뉴 동기 규칙

```text
[ ] 모든 leaf menu path는 router에 존재
[ ] 숨겨진 detail route는 menu에 없어도 됨
[ ] route 삭제 시 menu도 같은 PR에서 삭제
[ ] 권한 없는 메뉴는 숨김
[ ] URL 직접 접근은 route guard가 다시 차단
[ ] 404와 권한 없음 화면을 구분
```

## 7.4 lazy loading

페이지 단위 lazy를 기본으로 한다.

```tsx
const ItemListPage = lazy(() => import('@/pages/management/items/page'));
```

작은 공통 UI까지 과도하게 lazy-load하지 않는다.

## 7.5 페이지 title·breadcrumb

프로젝트에서 필요하면 route metadata를 앱이 소유한다.

```ts
{
  path: ROUTE_PATHS.items,
  element: <ItemListPage />,
  handle: {
    title: '항목 관리',
    breadcrumb: ['운영 관리', '항목 관리'],
  },
}
```

메뉴 label을 직접 파싱해 breadcrumb를 만들지 않는다. 메뉴와 URL 구조가 항상 같다는 보장이 없기 때문이다.

---

# 8. 인증·세션·권한

## 8.1 역할 분리

```text
Auth primitive
- 토큰 적용
- 세션 조회
- 로그인/로그아웃
- 미로그인 redirect

App policy
- 역할 enum
- permission code
- 메뉴 노출
- route 접근
- 버튼·행동 허용
```

## 8.2 세션 모델

```ts
export type AdminRole = 'MASTER' | 'ADMIN' | 'OPERATOR';

export type PermissionCode =
  | 'item:read'
  | 'item:create'
  | 'item:update'
  | 'item:delete';

export type AdminSession = {
  id: string;
  name: string;
  email?: string;
  roles: AdminRole[];
  permissions: PermissionCode[];
};
```

위 enum과 code는 예시다. 실제 값은 앱이 소유한다.

## 8.3 인증 bootstrap

```text
App 진입
  → 저장된 인증정보 확인
  → GET /me
  → 성공: session ready
  → 401: 인증정보 제거 + login
  → 네트워크 실패: 재시도/오류 화면
```

`isLoading`, `isAuthenticated`, `session`을 구분한다. 로딩 중 미로그인으로 판정해 login 화면이 깜박이지 않게 한다.

## 8.4 401 처리

axios interceptor가 수행할 수 있는 범위:

- Authorization 헤더 적용
- 401 공통 감지
- 인증정보 제거 이벤트 호출

interceptor에서 금지:

- React hook 호출
- 화면별 Alert 문구 결정
- 무한 refresh 재시도
- 모든 오류를 같은 메시지로 변환

Refresh Token 정책은 백엔드 계약에 맞춰 별도로 정의한다.

## 8.5 권한 검증 3중화

```text
1. Menu guard     — 발견 가능성 제어
2. Route guard    — URL 직접 접근 제어
3. Backend guard  — 최종 보안 경계
```

프론트 권한 제어는 UX이며 보안의 최종 근거가 아니다.

## 8.6 PermissionButton

```tsx
<PermissionButton permission="item:create">
  등록
</PermissionButton>
```

권한 없음 처리 방식은 앱에서 하나로 고정한다.

- 기본: 버튼 숨김
- 업무상 상태 설명이 필요: disabled + tooltip

같은 화면에서 두 방식을 임의로 혼용하지 않는다.

---

# 9. HTTP·API·오류 규약

## 9.1 환경 변수

```env
VITE_APP_NAME=CMS Solution
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
```

규칙:

- 비밀키를 `VITE_*`에 저장하지 않는다.
- API base URL 접근은 `shared/config/environment.ts`로 모은다.
- feature가 `import.meta.env`를 직접 읽지 않는다.

## 9.2 axios instance

책임:

```text
- baseURL
- timeout
- 공통 header
- auth token 주입 슬롯
- 공통 response unwrap 여부
- 401 이벤트
```

비책임:

```text
- query invalidate
- 성공 Alert
- form error mapping의 화면 문구
- 도메인별 retry
```

## 9.3 DTO와 entity 타입

백엔드 DTO와 화면 모델이 다르면 명시적으로 나눈다.

```ts
export type ItemListResponseDto = {
  content: ItemResponseDto[];
  totalElements: number;
  page: number;
  size: number;
};

export type Item = {
  id: string;
  name: string;
  status: ItemStatus;
  createdAt: string;
};
```

변환이 단순한 동일 구조라면 중복 타입을 만들지 않는다. 날짜 변환, nullable 정규화, enum 변환이 있으면 mapper를 둔다.

## 9.4 공통 API 오류

```ts
export type ApiError = {
  status?: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string>;
  cause?: unknown;
};
```

오류 처리 우선순위:

1. field error → 폼 필드에 표시
2. 명시적 business error → Alert 또는 inline 메시지
3. network/unknown → 공통 fallback
4. 목록 fetch 오류 → 목록 영역 오류 상태

silent fail은 금지한다.

## 9.5 OpenAPI/Orval

백엔드 OpenAPI가 안정적으로 제공될 때 opt-in 한다.

- 생성 코드는 앱 API 계약에 종속되므로 Admin Kit에 포함하지 않는다.
- generated client를 `shared` 전체 primitive로 취급하지 않는다.
- query key와 UI mutation 정책은 앱 feature에서 소유한다.

---

# 10. 첫 CRUD 수직 슬라이스

## 10.1 목표

리소스 하나로 다음 전체 경로를 검증한다.

```text
Menu
→ Route
→ Page
→ URL Filter
→ Query Key
→ Service
→ API/Fixture
→ Table
→ Create/Edit Modal
→ Delete Confirm
→ Invalidate
→ Permission
→ Error handling
```

## 10.2 권장 파일

```text
src/entities/item/model/types.ts
src/features/item/api/capabilities.ts
src/features/item/api/query-keys.ts
src/features/item/api/service.ts
src/features/item/api/hooks.ts
src/features/item/model/schema.ts
src/features/item/model/mapper.ts
src/features/item/ui/form-modal.tsx
src/pages/management/items/page.tsx
src/pages/management/items/page.css
```

## 10.3 구현 순서

### Step 1. 계약

먼저 정의:

- list filter 타입
- list item 타입
- create/update input
- pagination response
- permission code

### Step 2. Service

```ts
export const itemService = {
  list: (filters: ItemListFilters) =>
    api.get<ItemListResponse>('/admin/items', { params: filters }),

  create: (input: CreateItemInput) =>
    api.post<Item>('/admin/items', input),

  update: (id: string, input: UpdateItemInput) =>
    api.put<Item>(`/admin/items/${id}`, input),

  remove: (id: string) =>
    api.delete<void>(`/admin/items/${id}`),
};
```

Service는 React, modal, alert, query client를 모른다.

### Step 3. Query keys

```ts
export const itemQueryKeys = {
  all: ['items'] as const,
  lists: () => [...itemQueryKeys.all, 'list'] as const,
  list: (filters: ItemListFilters) =>
    [...itemQueryKeys.lists(), filters] as const,
  details: () => [...itemQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemQueryKeys.details(), id] as const,
};
```

규칙:

- query key에 **적용된 필터**를 넣는다.
- 객체 key 순서가 흔들리지 않도록 filter normalizer를 사용할 수 있다.
- key 문자열을 page에서 직접 작성하지 않는다.

### Step 4. Hooks

```ts
export function useItemList(filters: ItemListFilters) {
  return useQuery({
    queryKey: itemQueryKeys.list(filters),
    queryFn: () => itemService.list(filters),
  });
}
```

Mutation 성공 후:

```ts
queryClient.invalidateQueries({ queryKey: itemQueryKeys.lists() });
```

L0에서는 optimistic update를 필수로 하지 않는다.

### Step 5. Page

페이지 책임:

- pending filter 입력
- 조회 버튼으로 URL apply
- URL에서 applied filter 파생
- list hook 호출
- 모달 대상 선택
- column 조합
- 로딩·오류·empty·success 렌더

페이지가 하면 안 되는 것:

- axios 직접 호출
- endpoint 문자열 소유
- 전역 CSS 수치 재정의
- zod schema 인라인 대형 선언

---

# 11. 목록·필터·페이지네이션

## 11.1 상태 모델

```text
pending filters  = 현재 입력 UI 상태
applied filters  = URL searchParams에서 파생
query filters    = applied filters를 API 형식으로 정규화
```

입력할 때마다 서버 요청하지 않는다. 조회 버튼으로 적용한다.

## 11.2 URL 예

```text
/management/items?keyword=test&status=ACTIVE&page=1&size=20
```

규칙:

- 기본값은 URL에서 생략 가능
- 잘못된 숫자는 안전한 기본값으로 normalize
- 빈 문자열은 query에서 제거
- 조회 조건 변경 시 page를 1로 초기화
- 새로고침 후 UI와 결과가 일치
- 뒤로가기 시 이전 필터가 복원

## 11.3 필터 적용 흐름

```text
Input 변경
  → pending state
조회 클릭
  → sanitize
  → searchParams 갱신
  → appliedFilters 변경
  → query key 변경
  → fetch
```

## 11.4 테이블 규칙

필수:

```text
[ ] className="cms-data-table"
[ ] 안정적인 rowKey
[ ] 모든 column에 width 검토
[ ] loading/empty/error 구분
[ ] 제목·건수·액션이 list card shell 안에 위치
[ ] row action 권한 검증
```

금지:

```css
/* page.css에서 금지 */
.cms-data-table th,
.cms-data-table td {
  height: 48px;
  padding: 4px;
}
```

테이블 높이·padding·header 규격은 공통 SSOT가 소유한다.

## 11.5 페이지네이션

- API가 0-base인지 1-base인지 adapter에서 명시한다.
- URL은 사용자가 이해하기 쉬운 1-base를 권장한다.
- page/size는 query key에 포함한다.
- 삭제 후 현재 페이지가 비면 이전 페이지 이동 여부를 명시한다.
- total count는 응답 SSOT를 사용한다.

## 11.6 정렬

일반 column 정렬과 DnD 순서를 구분한다.

- column sort: URL `sort=createdAt,desc`
- DnD order: 별도 reorder mutation
- DnD는 배너·노출 순서 등 요구가 있을 때만 추가

---

# 12. Form·Modal·Mutation UX

## 12.1 Form schema

```ts
export const itemFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요.'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
```

폼 타입은 schema에서 추론한다.

```ts
export type ItemFormValues = z.infer<typeof itemFormSchema>;
```

## 12.2 Create/Edit 통합

필드와 UX가 같으면 하나의 `FormModal`을 사용한다.

```ts
mode: 'create' | 'edit'
initialValues?: ItemFormValues
itemId?: string
```

차이가 커지면 억지로 조건문을 누적하지 말고 feature UI를 분리한다.

## 12.3 Modal 생명주기

```text
Open create
  → defaultValues reset

Open edit
  → row/detail hydrate

Close
  → form reset
  → mutation error reset
  → selected item clear
```

이전 편집 값이 다음 등록 모달에 남지 않도록 한다.

## 12.4 제출 흐름

```text
Submit
  → schema validate
  → mutation pending
  → 중복 제출 차단
  → 성공: invalidate → alert → close
  → 실패: field/global error → modal 유지
```

서버 실패 시 모달을 먼저 닫지 않는다.

## 12.5 삭제 흐름

```text
삭제 클릭
  → 대상 확인
  → ConfirmModal
  → mutation
  → 성공 invalidate
  → 성공 alert
  → 선택 상태 정리
```

일괄 삭제가 있으면:

- 부분 성공 처리 정의
- 삭제 가능 권한과 선택 가능 row를 일치
- 처리 후 선택 목록 초기화

## 12.6 즉시 토글

Switch mutation을 사용할 때:

- pending 동안 해당 row 제어
- 실패 시 refetch 또는 이전 값 복원
- 성공 후 목록 SSOT와 동기화
- 중복 클릭 방지

---

# 13. UI·CSS·디자인 토큰

## 13.1 UI SSOT

다음 수치와 시각 규칙은 `.cursor/rules/cms-admin-ui/*`를 따른다.

- 필터 영역 치수
- control 높이와 폭
- table row/header 규격
- list card padding
- action gap
- modal header와 z-index
- color/token

## 13.2 CSS 소유권

| CSS 위치 | 허용 |
|---|---|
| `shared/ui` | primitive의 구조·상태·수치 |
| `widgets/layout` | LNB/GNB/content layout |
| `page.css` | 페이지 배치, grid, 섹션 간격 |
| feature CSS | 해당 feature 고유 표현 |

페이지 CSS에서 공유 컴포넌트 내부 selector를 침범하지 않는다.

## 13.3 스타일 금지 패턴

```text
- 페이지마다 antd token 직접 재정의
- 숫자 color를 반복 하드코딩
- !important로 공통 규격 덮기
- 전역 태그 selector로 table/input 수정
- modal z-index 임의 증가
- 디자인 rule과 다른 높이·padding 재선언
```

## 13.4 디자인 시스템 페이지

선택 기능이다. 포함한다면 다음 용도로 제한한다.

- 공통 UI 시각 QA
- 상태별 렌더 확인
- CSS regression 확인

실제 제품 메뉴에 노출할지는 앱이 결정한다.

---

# 14. Fixture·Mock 원칙

## 14.1 허용

API가 준비되지 않았을 때 feature 단위 fixture를 사용할 수 있다.

```text
features/item/api/fixture.ts
features/item/api/service.ts
```

조건:

```text
[ ] 실제 service 계약과 같은 타입
[ ] 지연·오류 시나리오 최소 지원
[ ] 제거 조건과 TODO 명시
[ ] 다른 feature의 fixture를 전역 registry로 결합하지 않음
```

## 14.2 금지

```text
data/mock/** 전역 제품 시드 복사
VITE_REAL_API_MODULES 모듈 매트릭스
JA 사용자·프로그램 데이터를 신규 앱 기본 fixture로 사용
UI 컴포넌트에서 import.meta.env로 mock 분기
```

## 14.3 MSW

여러 화면의 네트워크 시뮬레이션이 필요하면 프로젝트 단위로 검토할 수 있으나 L0 필수는 아니다. 도입 시 handler도 도메인별로 분리한다.

---

# 15. 테스트 전략

## 15.1 L0 필수

| 테스트 | 기준 |
|---|---|
| TypeScript | `typecheck` 통과 |
| ESLint | lint 통과 |
| Build | production build 통과 |
| Manual smoke | shell, menu, route, modal, table |
| CRUD smoke | list/create/edit/delete 실패·성공 |

## 15.2 권장 자동 테스트

### Unit

- filter normalize
- API↔form mapper
- permission predicate
- query key 안정성
- schema validation

### Component

- FormModal 초기화
- submit pending/실패
- PermissionButton
- list empty/error state

### Integration

- URL filter apply
- back/forward 복원
- mutation 후 invalidate
- 401 session 종료

### E2E

P1 이후 핵심 업무 흐름만 선택한다.

```text
로그인 → 목록 조회 → 등록 → 수정 → 삭제
```

Admin Kit 패키지 승격 전에는 CMS 전체 Playwright suite를 신규 앱에 복사하지 않는다.

## 15.3 테스트 우선순위

```text
순수 변환·정책 > URL 상태 > mutation 흐름 > 시각 세부
```

antd 내부 구현을 과도하게 snapshot하지 않는다.

---

# 16. 접근성·성능·운영성

## 16.1 접근성

```text
[ ] 버튼에 명확한 accessible name
[ ] icon-only action에 aria-label
[ ] modal title 연결
[ ] keyboard focus trap 확인
[ ] form error와 field 연결
[ ] 색상만으로 상태를 표현하지 않음
```

## 16.2 성능

L0에서 우선할 것:

- 페이지 lazy loading
- 안정적인 query key
- 불필요한 전역 상태 제거
- 큰 table column renderer 메모화는 측정 후 적용
- 목록 API pagination

우선하지 않을 것:

- 근거 없는 `useMemo`/`useCallback` 대량 적용
- 모든 query의 prefetch
- virtual table 조기 도입

## 16.3 운영성

- 사용자에게 보이는 오류와 개발 로그를 구분한다.
- 민감정보·token을 console에 출력하지 않는다.
- Sentry 등 오류 수집 도구는 앱 요구에 따라 provider로 추가한다.
- audit log는 백엔드가 최종 소유하되, 프론트 action context가 필요하면 correlation id를 전달한다.

---

# 17. Cursor 교차검증 프로토콜

이 절은 Cursor가 변경 전후에 반드시 수행할 검증 절차다.

## 17.1 변경 전 입력 문서

Cursor 프롬프트에 최소 다음 경로를 명시한다.

```text
docs/admin-platform-kit/README.md
docs/admin-platform-kit/01-domain-mapping.md
docs/admin-platform-kit/02-l0-starter-checklist.md
docs/admin-platform-kit/03-first-vertical-slice.md
docs/admin-platform-kit/04-package-promotion-scope.md
docs/admin-platform-kit/05-frontend-architecture-cursor-crosscheck.md
.cursor/rules/cms-admin-ui/**
apps/<name>/README.md
```

현재 작업과 관련된 실제 API 계약도 같이 제공한다.

## 17.2 변경 전 Cursor 출력 형식

```text
[작업 분류]
- Kit 필수 / Kit 선택 / 신규 도메인 / JA 전용:

[SSOT]
- 적용 문서:
- 적용 Cursor rule:
- 참고 구현:

[파일 계획]
- 생성:
- 수정:
- 삭제:

[레이어 검증]
- page:
- feature:
- entity:
- shared:

[위험]
- 도메인 누출:
- import 역전:
- UI rule 충돌:
- API 미확정:
```

분류가 없으면 코드 작성을 시작하지 않는다.

## 17.3 정적 검색 명령

앱 이름을 변수로 지정한다.

```bash
APP=apps/<name>
```

### CMS 직접 import 금지

```bash
rg -n "apps/cms|/cms/src|@/\.\./.*cms" "$APP/src"
```

예상 결과: 0건.

### 금지 도메인 복사 신호

```bash
find "$APP/src" -type d \
  \( -name program -o -name settlement -o -name template -o -name user-consent \)
```

예상 결과: 신규 요구로 승인된 경로가 아니라면 0건.

### 전역 mock/real 스위치 금지

```bash
rg -n "VITE_REAL_API_MODULES|data/mock" "$APP"
```

예상 결과: 0건.

### shared의 상위 레이어 import 금지

```bash
rg -n "@/(features|entities|pages|widgets|app)/" "$APP/src/shared"
```

예상 결과: 0건.

### entities의 상위 레이어 import 금지

```bash
rg -n "@/(features|pages|widgets|app)/" "$APP/src/entities"
```

예상 결과: 0건.

### features의 page/widget/app import 금지

```bash
rg -n "@/(pages|widgets|app)/" "$APP/src/features"
```

예상 결과: 0건.

### 페이지 CSS의 table 규격 침범 탐지

```bash
rg -n "(th|td).*\{|height\s*:|padding\s*:|!important" \
  "$APP/src/pages" -g "*.css"
```

예상 결과: 검토 대상만 출력. `cms-data-table` 내부 수치 override는 0건.

### endpoint의 page 직접 사용 탐지

```bash
rg -n "axios\.|api\.(get|post|put|patch|delete)|/api/" \
  "$APP/src/pages" "$APP/src/widgets"
```

예상 결과: 0건. endpoint는 feature service가 소유한다.

### feature의 환경변수 직접 접근 탐지

```bash
rg -n "import\.meta\.env" "$APP/src/features" "$APP/src/pages"
```

예상 결과: 0건.

### query key 문자열 분산 탐지

```bash
rg -n "queryKey\s*:\s*\[" "$APP/src/pages" "$APP/src/features" \
  -g "!**/query-keys.ts"
```

예상 결과: 예외 검토. feature query key factory 사용이 원칙.

### silent catch 탐지

```bash
rg -n "catch\s*\([^)]*\)\s*\{\s*\}" "$APP/src"
```

예상 결과: 0건.

## 17.4 빌드 게이트

```bash
pnpm --filter <name> typecheck
pnpm --filter <name> lint
pnpm --filter <name> build
```

앱 스크립트가 `validate`를 제공하면:

```bash
pnpm --filter <name> validate
```

## 17.5 수직 슬라이스 수동 게이트

```text
[ ] 목록 최초 로딩 표시
[ ] API 실패 표시
[ ] empty 표시
[ ] 필터 입력만으로 요청되지 않음
[ ] 조회 클릭 시 URL 변경
[ ] 새로고침 후 필터 복원
[ ] 뒤로가기 후 필터 복원
[ ] 등록 성공 후 목록 갱신
[ ] 등록 실패 시 modal 유지
[ ] 수정 초기값 정확
[ ] 삭제 confirm 동작
[ ] 삭제 성공 후 목록 갱신
[ ] 권한 없는 메뉴 숨김
[ ] URL 직접 접근 차단
[ ] 데스크톱에서 table/modal 스크롤 확인
```

## 17.6 교차검증 판정표

| 검증 항목 | 개발자 판정 | Cursor 판정 | 증적 | 최종 |
|---|---|---|---|---|
| Kit/도메인 경계 |  |  | 경로·diff |  |
| FSD import |  |  | rg 결과 |  |
| UI rule |  |  | rule 링크·스크린샷 |  |
| URL filter |  |  | URL·수동 결과 |  |
| Query invalidate |  |  | hook 코드·devtools |  |
| Auth/RBAC |  |  | menu/route/action |  |
| typecheck/lint/build |  |  | 명령 로그 |  |

판정이 다르면 최종 승인 전에 SSOT 우선순위로 재검토한다.

---

# 18. Cursor용 표준 프롬프트

## 18.1 기능 구현 프롬프트

```text
다음 문서를 먼저 읽고 작업해라.
- docs/admin-platform-kit/01-domain-mapping.md
- docs/admin-platform-kit/02-l0-starter-checklist.md
- docs/admin-platform-kit/03-first-vertical-slice.md
- docs/admin-platform-kit/05-frontend-architecture-cursor-crosscheck.md
- .cursor/rules/cms-admin-ui/**

대상 앱: apps/<name>
작업: <기능 설명>
API 계약: <경로 또는 명세>

코드를 수정하기 전에 아래를 먼저 출력해라.
1. 작업 분류: Kit 필수/선택, 신규 도메인, JA 전용 중 하나
2. 적용 SSOT와 Cursor rule
3. 생성·수정·삭제할 파일
4. FSD import 방향 검증
5. 도메인 누출과 UI rule 충돌 위험

구현 후에는 다음을 실행하고 결과를 요약해라.
- pnpm --filter <name> typecheck
- pnpm --filter <name> lint
- pnpm --filter <name> build
- 문서 §17의 금지 패턴 검색

부분 코드가 아니라 현재 레포 규칙에 맞는 완결된 파일 단위로 수정해라.
```

## 18.2 리뷰 프롬프트

```text
이 diff를 CMS/Admin Platform Kit 기준으로 리뷰해라.

우선순위:
P0: 보안·권한·데이터 손실·빌드 실패
P1: FSD 역전·query key 오류·URL 상태 불일치·mutation 후 stale data
P2: UI rule 위반·공통화 누락·테스트 누락

반드시 확인:
- apps/cms 직접 import 여부
- JA 도메인 복사 여부
- shared의 domain import 여부
- page의 axios 직접 호출 여부
- URL applied filter가 query key에 포함되는지
- create/update/delete 후 list invalidate 여부
- 권한이 menu/route/action에 모두 적용되는지
- page CSS가 table/filter 수치를 덮는지

각 지적은 파일:라인, 위반한 SSOT, 수정 방향을 포함해라.
문제가 없으면 검증한 항목과 실행한 명령을 명시해라.
```

## 18.3 교차검증 프롬프트

```text
구현 결과를 문서와 교차검증해라. 새 코드는 작성하지 말고 검증만 수행해라.

입력:
- 대상 브랜치 또는 diff
- docs/admin-platform-kit/05-frontend-architecture-cursor-crosscheck.md
- .cursor/rules/cms-admin-ui/**

출력:
1. Pass/Fail 요약
2. SSOT별 준수표
3. 금지 패턴 검색 결과
4. typecheck/lint/build 결과
5. 수동 확인이 필요한 항목
6. 승인 차단 이슈(P0/P1)
7. 비차단 개선(P2)
```

---

# 19. PR 완료 보고서

```markdown
## 수직 슬라이스
- 리소스:
- 앱:
- PR/브랜치:

## 범위 분류
- [ ] Kit 필수
- [ ] Kit 선택
- [ ] 신규 도메인
- [ ] JA 전용 재구현
- 근거:

## 변경 파일
- app:
- pages:
- widgets:
- features:
- entities:
- shared:

## 동작
- 목록:
- 필터 URL:
- 등록:
- 수정:
- 삭제:
- 권한:
- 오류 처리:

## 교차검증
| 항목 | 결과 | 증적 |
|---|---|---|
| CMS 직접 import | Pass/Fail | rg 출력 |
| FSD import | Pass/Fail | rg 출력 |
| UI rule | Pass/Fail | rule/화면 |
| Query key | Pass/Fail | 코드 |
| invalidate | Pass/Fail | 코드/동작 |
| auth/RBAC | Pass/Fail/N/A | 코드/동작 |
| typecheck | Pass/Fail | 로그 |
| lint | Pass/Fail | 로그 |
| build | Pass/Fail | 로그 |

## 예외
- N/A 또는 예외 사유:
- 만료 조건:

## 확장성 게이트
- 동일 구조 feature 추가 예상: ≤ 1일 / > 1일
- Kit 수정 필요 여부:
- 실패 시 원인: Kit 부족 / 도메인 복잡도 / 규약 부족
```

---

# 20. 단계별 완료 정의

## 20.1 P0 — 범위 확정

```text
[ ] 요구 기능 분류 완료
[ ] JA 전용 이식 금지 확인
[ ] 역할·권한 앱 소유 확인
[ ] API 계약 또는 fixture 범위 확인
[ ] 선택 패키지 필요 여부 확인
```

## 20.2 L0 — 빈 앱

```text
[ ] `apps/admin` 셸 기준으로 생성
[ ] 홈페이지 도메인 feature 제거
[ ] Home + Placeholder
[ ] Theme/Query/Error/Alert provider
[ ] LNB/GNB/Outlet
[ ] axios instance
[ ] menu 2~3개 이하
[ ] auth는 요구 시 최소 골격
[ ] typecheck/lint/build
[ ] 제품 feature 0개(auth 예외)
```

## 20.3 P1 — 첫 수직 슬라이스

```text
[ ] entity type
[ ] feature service/query-key/hooks
[ ] form schema/modal
[ ] list page
[ ] URL filter
[ ] pagination
[ ] loading/error/empty
[ ] create/update/delete
[ ] invalidate
[ ] permission
[ ] 수동 desktop QA
[ ] 1일 확장성 게이트
```

## 20.4 P2 — 패키지 승격

다음 신호 중 2개 이상일 때만 시작한다.

```text
[ ] 동일 셸 소비 앱 2개 이상
[ ] 동일 UI diff 반복
[ ] 6개월 내 추가 납품
[ ] UI 회귀 반복
```

승격 순서:

```text
@jakorea/admin-ui
→ @jakorea/admin-list
→ @jakorea/admin-shell
```

menu 본문, permission 정책, generated API, 업무 feature는 승격하지 않는다.

---

# 21. 대표 안티패턴

## 21.1 CMS feature 복사

```text
문제: 기존 program feature를 이름만 바꿔 사용
결과: JA 상태·권한·mock·카피 유입
대안: 화면 패턴만 보고 신규 API 계약으로 수직 슬라이스 재구현
```

## 21.2 shared 비대화

```text
문제: 여러 파일에서 쓴다는 이유만으로 업무 컴포넌트를 shared로 이동
결과: 제품 독립성 상실
대안: entity 또는 feature 내부 public UI로 유지
```

## 21.3 페이지 만능 컴포넌트

```text
문제: page.tsx가 API, schema, column, modal, mapper를 모두 소유
결과: 테스트·재사용·리뷰 어려움
대안: service/hooks/schema/modal로 책임 분리
```

## 21.4 필터 이중 SSOT

```text
문제: local state와 URL이 각각 적용 필터를 소유
결과: 새로고침·뒤로가기 불일치
대안: pending local, applied URL로 역할 분리
```

## 21.5 mutation 후 수동 배열 수정 남발

```text
문제: 여러 query cache를 임의 수정
결과: 필터별 cache 불일치
대안: L0는 lists invalidate를 기본으로 사용
```

## 21.6 권한 UI만 처리

```text
문제: 버튼만 숨기고 route는 접근 가능
결과: URL 접근·API 호출 가능
대안: menu + route + backend 3중 검증
```

## 21.7 조기 패키지화

```text
문제: 첫 앱부터 UI/list/shell을 하나의 package로 추출
결과: 실제 변동성을 모른 채 API가 고정됨
대안: L0와 첫 수직 슬라이스 검증 후 반복 신호에 따라 strangler 승격
```

---

# 22. 아키텍처 의사결정 기록 템플릿

큰 예외는 `docs/adr/`에 기록한다.

```markdown
# ADR-XXX — <제목>

## 상태
Proposed / Accepted / Deprecated

## 배경

## 결정

## 대안

## 영향
- 장점:
- 단점:
- 마이그레이션:

## Admin Platform Kit 예외
- 위반/변경되는 규칙:
- 필요 근거:
- 만료 조건:
```

ADR가 필요한 대표 사례:

- 전역 상태 라이브러리 추가
- 기본 query 정책 변경
- URL 이외의 목록 상태 SSOT
- micro frontend 도입
- Admin Kit 패키지 조기 승격
- 디자인 rule 수치 변경

---

# 23. 최종 승인 체크리스트

## Architecture

```text
[ ] Kit과 제품 도메인이 분리됨
[ ] `apps/cms` 직접 import 없음
[ ] shared에 업무 이름·정책 없음
[ ] FSD import 방향 준수
[ ] router/menu/permission 앱 소유
```

## Data

```text
[ ] axios는 service에서 사용
[ ] query key factory 사용
[ ] applied URL filter가 key에 포함
[ ] mutation 후 적절한 invalidate
[ ] 서버 상태 중복 저장 없음
[ ] 오류가 사용자에게 노출됨
```

## UI

```text
[ ] cms-admin-ui rule 준수
[ ] table/filter 공통 수치 override 없음
[ ] modal 생명주기 reset
[ ] loading/error/empty 구분
[ ] 접근성 기본 항목 확인
```

## Auth/RBAC

```text
[ ] session loading과 unauthenticated 구분
[ ] 401 종료 흐름
[ ] menu guard
[ ] route guard
[ ] action guard
[ ] backend 권한 필요성 확인
```

## Quality

```text
[ ] typecheck
[ ] lint
[ ] build
[ ] 금지 패턴 rg
[ ] 핵심 수동 시나리오
[ ] Cursor 교차검증 보고
[ ] 예외·N/A 근거
```

---

# 24. 결정 요약

| 질문 | 결정 |
|---|---|
| 프론트 기본 구조 | FSD 기반 `app/widgets/pages/features/entities/shared` |
| 현재 재사용 단계 | L0 복제와 문서 규약 |
| 복사 of record | `apps/admin`의 셸·shared |
| CMS 활용 범위 | `shared` 파일 단위 참고, feature 복사 금지 |
| 필터 SSOT | 적용값은 URL search params |
| 서버 상태 | TanStack Query |
| CRUD 갱신 | L0는 list invalidate 기본 |
| 권한 정책 | 앱 소유, menu/route/action 적용 |
| UI 수치 SSOT | `.cursor/rules/cms-admin-ui/*` |
| mock | feature 단위 임시 fixture |
| 패키지 승격 | 반복 신호 2개 이상일 때 |
| 교차검증 | 개발자 + Cursor + 명령 증적 |

**완료 판정:** 새 리소스 하나를 `entity + feature api/ui + page + menu/router` 추가만으로 구현할 수 있고, 신규 리소스 때문에 `shared/ui` 또는 layout을 수정하지 않아도 되어야 한다.
