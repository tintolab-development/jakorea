# 04 — 패키지 승격 범위 (P2 · 반복 납품 시)

L0 스캐폴드 복제가 **2개 이상 앱**에서 반복되거나, 동일 버그를 admin/cms/신규에 각각 고치는 비용이 보이면 L1 패키지 승격을 검토한다.  
이 문서는 **승격 범위·비범위·게이트·순서**를 고정한다.

---

## 1. 언제 승격하나 (게이트)

다음 중 **2개 이상**이면 P2 착수:

| 신호 | 설명 |
|------|------|
| 앱 ≥ 2 | cms + admin (+ 신규)이 동일 Cms\* 패치 필요 |
| 중복 diff | `cms-button` / `cms-data-table.css` 동기 커밋이 반복 |
| 외부 납품 로드맵 | 6개월 내 어드민 2호 이상 |
| 셸 회귀 | 토큰·필터 치수 불일치 이슈 ≥ 1회/분기 |

**아직 1앱·단기 프로젝트면 L0 유지.** 성급한 monorepo 패키지 big-bang 금지.

---

## 2. 승격 패키지 (권장 쪼개기)

| 패키지 (가칭) | 포함 | 1차 of record 소스 | peerDependencies (예시) |
|---------------|------|--------------------|-------------------------|
| `@jakorea/admin-ui` | CmsButton/Input/Select/Textarea/DatePicker/Radio/TextTabs, Confirm/Content/Teal/Alert modal, file-select, **css + tokens contract** | `apps/admin/src/shared/ui/*` (CMS와 시각 정렬 후) | react, antd, dayjs |
| `@jakorea/admin-list` | `useListFilterUrl`, `useTableSearch`, filter-field constants, list-table-layout CSS, admin-filter-area, data-table CSS 클래스 규약 | `apps/admin/src/shared/lib/*` + 관련 css | react-router-dom, react, admin-ui |
| `@jakorea/admin-shell` | Layout/Sidebar/MainHeader **컴포지션 API**, ProtectedRoute 골격, provider 조합 헬퍼 | admin widgets + CMS ProtectedRoute | react-router-dom, antd, admin-ui |

### 기존 패키지 (유지만, “admin shell” 아님)

| 패키지 | 역할 |
|--------|------|
| `@jakorea/form-schema` / `form-template-runtime` | 동적 양식 |
| `@jakorea/rich-text` | Tiptap |
| `@jakorea/utils` | 순수 유틸 |
| `@jakorea/location` / `identity-verification` / `social-auth` | 인프라 클라이언트 |
| `@jakorea/ui` | **승격 대상 아님** (현 Button 수준 최소 키트; admin-ui와 혼동 금지) |
| `@jakorea/domain` | JA 교육 도메인 enum — **admin-ui에 넣지 않음** |

---

## 3. 패키지에 넣지 않는 것 (하드 제외)

| 제외 | 이유 |
|------|------|
| `features/program|settlement*|template|user` | 제품 도메인 |
| menu 본문·permissions 정책 테이블 | 앱 주입 |
| `data/mock` · real-api module matrix | 부채 |
| CMS OpenAPI generated clients | 백엔드 계약별 |
| Playwright e2e · CMS process rules | 제품 QA |
| GNB 알림 도메인 API · 계정 설정 화면 전체 | 앱 기능 |
| 한글 카피 기본값 “JA Korea …” | 브랜딩 독립 |

### admin-shell 공개 API 방향

```ts
// 개념 — 구현 시 이 형태를 목표로 한다
createAdminRouter({
  menu: AppMenuConfig,           // 앱 소유
  layout: { brandTitle, logo },
  routes: RouteObject[],
})

// Permission 정책은 앱이 제공
<PermissionProvider value={appPermissionTable}>
```

CMS의 1500줄 `menu-config`를 패키지 default export로 올리지 않는다.

---

## 4. 추출 순서 (strangler)

```text
1. admin-ui
   - 시각 컴포넌트·CSS 변수 계약
   - admin → package 교체
   - cms shared/ui 점진 re-export 또는 교체 (화면 회귀 테스트)

2. admin-list
   - 훅 + 필터/테이블 CSS
   - admin list 페이지 이관 확인
   - CMS useTablePage 와의 관계:
     · 단기: 의도 공유 문서만 (cms-admin-ui)
     · 중기: CMS가 admin-list 훅을 쓰거나, 어댑터 레이어로 통일

3. admin-shell
   - layout/providers 최소 API
   - 메뉴·auth는 DI
```

한 패키지에 UI+list+shell을 몰아넣지 않는다 (changelog·피어 deps 폭발).

---

## 5. 규칙·import 정책 변경

| 현재 | P2 이후 |
|------|---------|
| Admin: CMS path import 금지 · shared 복제 | Admin: **Kit 패키지만** import, CMS path 계속 금지 |
| CMS: 자체 shared/ui | CMS: `@jakorea/admin-ui` 소비 점진화 |
| cms-admin-ui rules = 스펙 SSOT | 유지. 패키지 README는 “구현 of record”, 숫자 스펙은 rules |

`.cursor/rules/cms-admin-ui/README.md` 와 앱 `reuse-shared-ui` 룰을 “패키지 소비” 문구로 갱신한다 (추출 PR과 동일 스코프).

---

## 6. 승격 제외 — L2 도메인 애드온

교육 B2B 2호 고객 등 **동일 산업**일 때만 별도 검토:

| 후보 | 전제 |
|------|------|
| 회원 목록·상세 fullpage 모달 skeleton | 동의 정책 테이블은 앱 |
| form-template 연동 consent surface | `@jakorea/form-*` 위 얇은 feature |
| 프로그램 유형 엔진 | **기본 제외** — JA vertical 별도 레포/package |

L2는 `@jakorea/admin-*` 와 **버전·릴리즈를 분리**한다. Admin Kit 소비자가 교육 도메인을 강제 설치하지 않게 한다.

---

## 7. 완료 정의 (P2 DoD)

- [ ] `@jakorea/admin-ui` 빌드·types export, admin가 소비
- [ ] 동일 버그 수정 PR이 패키지 1곳 (+ consumer bump)로 끝남
- [ ] cms-admin-ui 룰 숫자와 패키지 CSS 불일치 0
- [ ] 도메인 feature가 패키지 public export에 없음 (eslint/path 또는 review 체크리스트)
- [ ] 신규 앱 L0 문서가 “복사 소스: package” 로 개정 가능

---

## 8. 의사결정 요약

| 질문 | 답 |
|------|----|
| 지금 당장 패키지 만드나? | **아니오** — L0 문서·admin of record 유지 |
| 첫 승격 대상? | `@jakorea/admin-ui` |
| CMS 전면 리라이트? | **아니오** — strangler |
| domain 패키지 동시 승격? | **아니오** |

**Last updated:** 2026-08-06
