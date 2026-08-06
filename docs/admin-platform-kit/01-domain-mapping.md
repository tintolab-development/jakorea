# 01 — 신규 프로젝트 필수 vs JA 전용 도메인 맵

신규 어드민을 만들 때 **Kit에 넣을 것**과 **넣지 않을 것**을 구분한다.  
이식 전 게이트: *이 파일/모듈에 JA 프로그램·정산·동의 정책이 있는가?* → 있으면 코드 이식 금지, 패턴만 재구현.

---

## 1. Kit 필수 (제품 독립)

모든 신규 관리자 앱이 공통으로 가져가는 **플랫폼 셸**.

| 영역 | 포함 내용 | 현 레포 참고 |
|------|-----------|--------------|
| 부트스트랩 | Vite 7 · React 19 · TS · path alias `@/` | `apps/admin` package/vite/tsconfig |
| Providers | Theme · Query · ErrorBoundary · antd `App` · Alert modal | `apps/admin/src/main.tsx`, `app/providers/` |
| 레이아웃 | LNB + GNB + content outlet | `apps/admin/src/widgets/layout/` |
| 라우팅 | `createBrowserRouter`, lazy 페이지 슬롯 | `apps/admin/src/app/router/` |
| 메뉴 프레임 | 트리 구조·`allowedRoles` 슬롯 (내용은 앱 소유) | `shared/config/menu-config.tsx` **형태만** |
| 공통 컨트롤 | `CmsButton`, Input, Select, DatePicker, Textarea, Radio | `apps/admin/src/shared/ui/` |
| 모달 | Content / Confirm / Teal-header / Alert | 동일 |
| 목록 스택 | 필터 영역 · `cms-data-table` · 카드 셸 · URL 동기 의도 | `shared/ui/*` + `useListFilterUrl` · cms-admin-ui 룰 |
| HTTP | axios instance · base URL env · Bearer 훅 슬롯 | `shared/instance/axios-instance.ts` |
| Query | QueryClient 기본값 · feature `query-keys` 규약 | `shared/lib/query-client.ts` |
| FSD 슬롯 | 빈 `features/`, `entities/`, `pages/` | admin 구조 |

### Auth / RBAC (Kit **primitive**, 정책 테이블은 앱 소유)

| primitive | 역할 | 참고 |
|-----------|------|------|
| Auth store / session | 토큰 저장·로그아웃·me | CMS `features/auth` **골격** (엔드포인트·카피 교체) |
| `ProtectedRoute` | 미로그인 리다이렉트 | CMS `app/components` |
| `useCanAccess` / `PermissionButton` | 역할·권한 게이트 | CMS `shared/hooks`, `PermissionButton` |
| menu `allowedRoles` | 메뉴 필터 | 앱의 역할 enum |

**Admin 현재 상태:** GNB mock 유저·실 auth 없음. 로그인 필요 시 CMS auth 골격을 **파일 단위** 이식하고 JA 전용 MFA/소셜 카피는 제거한다.

---

## 2. Kit 선택 (opt-in packages / 기능)

요구가 있을 때만 붙인다. Kit 기본 트리에 넣지 않는다.

| 기능 | 패키지/소스 | 조건 |
|------|-------------|------|
| 작성폼·DetailInfoForm | `@jakorea/form-schema`, `form-template-runtime` | 동적 양식·A4 문서 |
| 리치텍스트 | `@jakorea/rich-text` | 게시·안내 본문 |
| 주소·지역 | `@jakorea/location` | Juso/시도·NEIS 등 KR |
| 본인인증 | `@jakorea/identity-verification` | 회원 가입 연동 |
| 소셜 로그인 | `@jakorea/social-auth` | OAuth |
| 정렬 DnD 테이블 | `@dnd-kit/*` (admin hero 패턴) | 배너/노출 순서 UI |
| Orval 생성 클라이언트 | CMS `orval` 패턴 | BE OpenAPI 있을 때 |
| 디자인 쇼케이스 페이지 | admin `/design-system` | 내부 QA·문서화용 |

---

## 3. JA 전용 (기본 이식 금지)

CMS 제품 도메인. **솔루션 Kit에 포함하지 않는다.**  
동일 교육 B2B 라인 2호 제품일 때만 L2 애드온으로 별도 검토 ([04](./04-package-promotion-scope.md)).

| 영역 | 대표 경로 / 신호 | 이유 |
|------|------------------|------|
| 프로그램 유형 분할 | `features/program/{general,ujat,gemini,1c-1s,trained-teachers}` | 스펙·mock·LNB 갈림, 유형 회귀 |
| 정산·지급 | `features/settlement*`, payment order | 상태머신·세금·KR payroll |
| 양식 템플릿 제품 | `features/template` (~500 files) | 이수증·동의·모집 템플릿 제품 |
| 회원·강사·동의 정책 | `features/user`, terms/consent 룰 | JA 약관 테이블 고정 |
| 스폰서·학교·교재 등 | 해당 features | 조직 도메인 |
| 거대 메뉴 기본값 | CMS `menu-config.tsx` (~1500줄) | JA 화면/권한 라벨 |
| 권한 정책 테이블 본문 | CMS `permissions.ts` MASTER/ADMIN + program roles | 앱마다 역할 재정의 |
| 전역 mock/real | `data/mock/*`, `VITE_REAL_API_MODULES` | 제품 부채 이식 |
| 프로그램 격리 룰 | `program-type-isolation.mdc` | Kit이 아닌 CMS 제품 룰 |
| 알림톡/지역 캠페인 등 | 제품 연동 | 인프라 결합 |

### 이식 게이트 (복사 전 체크리스트)

```text
[ ] shared/ui · layout · providers · list hooks 인가? → OK (Kit)
[ ] feature 이름만 같고 테이블 컬럼·API가 새 제품인가? → 새로 구현 (코드 복사 금지)
[ ] program / settlement / template / user-consent 경로인가? → 거부
[ ] 한글 카피가 JA 조직·프로그램 용어뿐인가? → 거부 또는 전면 재작성
[ ] mock 시드가 JA 시나리오인가? → 거부 (fixture는 신규)
```

---

## 4. 신규 프로젝트 맵핑 워크시트 (복사해 채움)

프로젝트: _______________  
날짜: _______________

| 요구 기능 | 분류 (Kit필수 / Kit선택 / JA전용 / 신규구현) | 결정 |
|-----------|-----------------------------------------------|------|
| 로그인·세션 | Kit필수 (auth primitive) | |
| 역할·메뉴 권한 | Kit필수 + 앱 정책 테이블 | |
| 목록 A (필터+페이지) | Kit필수 셸 + 신규 feature | |
| 상세/등록 모달 | Kit필수 모달 + 신규 form | |
| 동적 양식 | Kit선택 form-template | |
| 교육 프로그램 유형 | JA전용 또는 신규구현 | |
| 정산 | JA전용 또는 신규구현 | |
| … | | |

**합격 기준:** “Kit필수”가 제품 도메인 폴더를 가리키지 않는다. JA전용 항목이 Kit 체크리스트에 섞이지 않는다.

---

## 5. CMS vs Admin vs 신규 앱 역할

| 앱 | 역할 | Kit 관점 |
|-----|------|----------|
| `apps/cms` | JA 교육 운영 백오피스 (최대 도메인) | Kit 제공자가 될 후보 코드 + **도메인 제거 대상** |
| `apps/admin` | 홈페이지 콘텐츠 어드민, 얇은 셸 of record | L0 복제 템플릿 |
| 신규 `apps/<x>` | 고객/제품 백오피스 | Kit 소비 + own features |

**Last updated:** 2026-08-06
