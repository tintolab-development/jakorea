# 02 — Admin Starter L0 체크리스트 · 빈 앱 트리

**복사 of record: [`apps/admin`](../../apps/admin)** (셸·`shared/ui`·hooks).  
홈페이지 도메인(`features/hero-banner`, `pages/main/*`, `pages/ja-korea/*` 등)은 **복사하지 않는다**.

admin에 없고 list 훅/UI가 더 필요할 때만 CMS **`shared/`** 에서 파일 단위 이식한다.  
`apps/cms` 경로를 신규 앱에서 import 금지 (admin 규칙과 동일).

---

## 1. Bootstrap 스택

| 항목 | 버전/선택 (admin 기준) |
|------|------------------------|
| React | ^19.2 |
| Vite | ^7 |
| TypeScript | ~5.9 |
| antd | ^5.28 + icons + cssinjs |
| react-router-dom | ^7 |
| @tanstack/react-query | ^5 |
| axios | ^1.7 |
| RHF + zod + resolvers | 목록/상세 폼 시 |
| dayjs | 날짜 |
| workspace | `@jakorea/utils` 최소; form 필요 시 `form-template-runtime` |
| 폰트/토큰 | Pretendard + `theme-provider` 미러 |

모노레포: `apps/<name>` + root `package.json` script + turbo.  
모노레포 밖: 동일 스택의 독립 repo (이 문서 트리를 시드로 사용).

---

## 2. 빈 앱 디렉터리 트리 (목표)

도메인 feature **0개**, 빌드·로그인 셸(또는 mock GNB)·빈 home + placeholder 1개.

```text
apps/<name>/
  package.json
  vite.config.ts
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  index.html
  .env.example
  .gitignore
  README.md
  public/
  src/
    main.tsx
    index.css
    vite-env.d.ts
    app/
      providers/
        theme-provider.tsx
        theme-provider.css
        query-provider.tsx
        error-boundary.tsx
        ant-modal-motion-disable.css   # admin 관례
        # (옵션) auth-provider.tsx
      router/
        index.tsx                      # Layout + Home + Placeholder only
      components/
        protected-route.tsx            # auth 사용 시
    widgets/
      layout/
        index.ts
        layout.tsx
        layout.css
        sidebar.tsx                    # LNB (admin 참고)
        main-header.tsx
        main-header.css
        header.tsx / header.css        # 필요 시
        notification-dropdown.*        # mock 허용
    pages/
      home/
        page.tsx
      placeholder/
        page.tsx
      # design-system/ — 선택
    features/
      .gitkeep
      # auth/ — 로그인 필요 시 최소 골격만
    entities/
      .gitkeep
    shared/
      config/
        menu-config.tsx                # 신규 메뉴 2~3항목만
      constants/
        colors.ts
        filter-field-width.ts
        modal-z-index.ts
        table.ts
      instance/
        axios-instance.ts
      lib/
        api-remote-env.ts
        query-client.ts
        use-list-filter-url.ts
        use-table-search.ts
        use-invalidate-on-window-event.ts
        url-date-range-pending-sync.ts # dateRange 쓸 때
      ui/
        index.ts
        cms-button.tsx / .css
        cms-input.tsx / .css
        cms-select.tsx / .css
        cms-textarea.tsx / .css
        cms-datepicker.tsx / .css
        cms-period-datepicker.tsx / .css
        cms-radio.tsx
        cms-text-tabs.tsx / .css
        cms-control-size.ts
        cms-data-table.css
        cms-alert-modal-provider.tsx
        cms-alert-modal-api.ts
        alert-modal.tsx / .css
        confirm-modal.tsx / .css
        content-modal.tsx / .css
        content-modal-description.tsx
        teal-header-modal.tsx / .css
        file-select-field.tsx / .css   # 업로드 필요 시
        filter-controls-common.css
        admin-filter-area.css
        list-table-layout.css
        table-header-label.css
        table-th.css
        app-datepicker.*               # 의존 시
        icons/                         # 메뉴 아이콘
```

### 복사 스크립트 가이드 (수동)

1. `apps/admin` → `apps/<name>` 디렉터리 복사 후 **이름·port·package name** 변경  
2. **삭제:** `src/features/*` (전 홈페이지 feature), `src/entities/*` (전 홈페이지 entity),  
   `src/pages/main/**`, `src/pages/ja-korea/**`, (선택) design-system  
3. **유지·축소:** `widgets/layout`, `shared/ui`, `shared/lib`, `app/providers`, router를 Home+Placeholder만  
4. `menu-config.tsx`를 신규 메뉴 2–3개로 재작성  
5. `.env.example` API 변수 이름 정리  
6. `pnpm --filter <name> validate` (typecheck+lint+build)

---

## 3. 체크리스트 (DoD)

### 환경

- [ ] `pnpm --filter <name> dev` 기동, root script 연결 (선택)
- [ ] `.env.example`에 `VITE_*` API base / proxy 문서화
- [ ] vite proxy 또는 `api-remote-env`로 `/api` 정렬

### 셸

- [ ] ThemeProvider 토큰 로드 (`theme-provider.css` + `index.css`)
- [ ] Layout: LNB 펼침 + GNB + `Outlet` 콘텐츠
- [ ] 메뉴 항목 → 라우트 연결 (placeholder 허용)
- [ ] 홈 페이지 + 빈/플레이스홀더 페이지 1+

### 공통 UI

- [ ] `CmsButton` / Input / Select 렌더 가능
- [ ] Confirm · Alert modal provider 동작
- [ ] `cms-data-table` CSS 전역 import 체인 연결

### 데이터 계층

- [ ] axios instance + 401 처리 훅 슬롯(스텁 OK)
- [ ] QueryProvider + default options
- [ ] feature 추가 시 `query-keys` / `api/hooks` / `api/service` FSD 관례 문서에 링크 ([03](./03-first-vertical-slice.md))

### 규약

- [ ] `.cursor/rules/cms-admin-ui/*` 를 팀·에이전트가 따르는 링크를 앱 README 또는 `apps/<name>/.cursor/rules`에 명시
- [ ] FSD: `shared` → `features` import 금지
- [ ] CMS 앱 경로 import 금지
- [ ] 전역 mock/real 스위치 **미도입**

### Auth (로그인 필요 시만)

- [ ] `features/auth` 최소 (login page, store, session)
- [ ] `ProtectedRoute` 로 Layout 감쌈
- [ ] 역할 enum은 **앱 소유**, CMS `permissions` 전체 복사 금지

### 하지 않음 (L0)

- [ ] program / settlement / template / user 대량 복사 없음을 확인
- [ ] `data/mock` 전역 계층 없음
- [ ] dnd-kit·recharts·fortune-sheet 등 미사용 의존성 없음

---

## 4. 라우터·메뉴 최소 예

```tsx
// router: Layout children
//  /              → Home
//  /placeholder   → Placeholder
//  /login         → Login (옵션)
```

```ts
// menu-config: 앱 전용 2~3 leaf
// { key, label, path, icon?, children?, allowedRoles? }
```

---

## 5. 성공 지표 (P0)

| 지표 | 기준 |
|------|------|
| 빌드 | `typecheck` · `lint` · `build` 통과 |
| 도메인 | `features/` 에 제품 feature 0 (auth만 예외 허용) |
| 확장성 | [03](./03-first-vertical-slice.md) 수직 슬라이스를 **1영업일 이내** 추가 가능한 상태 |
| 문서 | 이 체크리스트 전부 체크 또는 “N/A + 이유” |

---

## 6. P1 (템플릿 고정)

L0이 한 번 검증되면:

1. `docs/admin-platform-kit/templates/empty-admin/` 또는 monorepo scaffold 스크립트에 트리 고정  
2. 또는 별도 `create-admin-app` 템플릿 레포 (CMS git history 없이)  
3. CI: scaffolding 앱 smoke build job

**현재 레포 상태:** 템플릿 폴더/생성기는 아직 없음. of record는 `apps/admin` 셸 + 이 문서.

**Last updated:** 2026-08-06
