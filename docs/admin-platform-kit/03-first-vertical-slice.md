# 03 — 첫 목록 CRUD 수직 슬라이스 기준

Kit이 “동작하는 재사용 단위”인지 검증하는 **단 하나의 end-to-end 슬라이스**다.  
도메인 이름(회원/게시물/배너)은 프로젝트마다 달라도, **구조·합격 기준은 동일**하다.

**참조 구현 (패턴 of record):**  
- 목록 셸·필터 URL: admin `shared/lib/use-list-filter-url.ts` + cms-admin-ui 룰  
- 단순 CRUD 페이지 구성: admin `pages/main/hero-banners` + `features/hero-banner` (DnD·정렬은 **선택**, CRUD 필수 아님)  
- 페이지네이션·필터 중심 목록: CMS `list-page-table-stack` / `list-page-composition` 패턴 (훅은 admin `useListFilterUrl` 우선)

---

## 1. 슬라이스 정의

| 항목 | 기준 |
|------|------|
| 범위 | **리소스 1개** (예: Item, Member draft, Post) |
| 화면 | 목록 1 + 생성/수정 모달 1 + 삭제 확인 1 |
| API | list · create · update · delete (실 API 또는 **모듈 단위** fixture; 전역 mock 스위치 금지) |
| 레이어 | FSD: `entities/<res>` · `features/<res>` · `pages/...` |

권장 파일 골격:

```text
src/entities/<res>/model/types.ts
src/features/<res>/
  api/
    capabilities.ts      # 옵션: 권한 플래그
    query-keys.ts
    service.ts           # axios 호출 or fixture
    hooks.ts             # useQuery / useMutation
    store.ts             # 로컬 이벤트/창 동기화 필요 시만
  ui/
    form-modal.tsx
    # list 테이블은 page에 두거나 sortable-table 분리
src/pages/<area>/<res-list>/
  page.tsx
  page.css               # 레이아웃만, table th/td 패딩 override 금지
```

---

## 2. 기능 합격 기준 (Must)

### 목록

- [ ] 페이지 진입 시 list query 로딩 · 에러 · empty 상태 구분
- [ ] `className="cms-data-table"` + `rowKey` + column `width`
- [ ] 목록 카드 셸: 제목/건수 + 액션(등록) + 테이블 ([list-table-shell](../../.cursor/rules/cms-admin-ui/list-table-shell.mdc))
- [ ] 필터 1개 이상 (검색 Input 또는 Select)
- [ ] **조회 버튼**으로 apply — live filter 금지 ([list-filter-url-sync](../../.cursor/rules/cms-admin-ui/list-filter-url-sync.mdc))
- [ ] 적용 필터가 `searchParams` 단일 소스 (`useListFilterUrl` 또는 동등)
- [ ] 새로고침·딥링크 시 필터 UI·목록 일치
- [ ] (해당 시) 페이지네이션 URL 또는 query key에 page 반영

### CRUD

- [ ] **Create:** 등록 버튼 → form modal → submit → list invalidate → 성공 alert/닫기
- [ ] **Read/Edit:** 행 클릭 또는 수정 → modal hydrate → update mutation
- [ ] **Delete:** 선택 삭제 또는 행 삭제 → `ConfirmModal` → mutation → invalidate
- [ ] 실패 시 alert, 목록 refetch 또는 에러 표시 (silent fail 금지)
- [ ] 폼 검증: RHF + zod (또는 antd Form + 동등 스키마)

### 권한 (auth 켠 앱)

- [ ] 목록 조회 가능 역할만 라우트·메뉴 노출
- [ ] 등록/삭제 버튼 `PermissionButton` 또는 capabilities 플래그

### 품질

- [ ] FSD import 방향 준수
- [ ] feature CSS가 공유 table/filter 치수를 override하지 않음
- [ ] `pnpm --filter <app> typecheck` 통과
- [ ] 수동: 데스크톱 폭에서 필터·테이블·모달 스크롤 확인

---

## 3. 선택 (Should / Nice)

| 항목 | 비고 |
|------|------|
| rowSelection + 일괄 삭제 | admin hero 패턴 |
| 활성 토글 Switch | 즉시 mutation + 실패 시 refetch |
| DnD 순서 | `@dnd-kit` — 배너류만 |
| 파일 업로드 필드 | `FileSelectField` |
| window event + invalidate | multi-tab mock store 패턴 (실 API에선 query invalidate만으로 충분) |

---

## 4. 비기능 합격 (확장성 게이트)

슬라이스 완료 직후, **동형 feature 하나 더**를 추가한다고 가정한다.

| 지표 | 합격선 |
|------|--------|
| 복사·개명 범위 | entity types + feature api/ui + page + menu/router 등록 |
| 예상 공수 | **≤ 1영업일** (API 계약 고정 시) |
| Kit 수정 | 신규 리소스 때문에 `shared/ui`·layout 변경 **불필요** |

1영업일을 넘기면 원인 분류:

1. Kit 부족 (list 훅·모달 부족) → shared 보강 또는 CMS shared 이식  
2. 도메인 복잡도 (필드 50+) → 슬라이스 스펙 과다, 필드를 줄여 재검증  
3. FSD/라우트 관례 미문서화 → 이 문서·앱 rules 보강

---

## 5. API·캐시 규약 (슬라이스 내부)

```text
queryKeys.<res>.all / lists / list(filters) / details / detail(id)
use<Res>List(appliedFilters)
useCreate<Res> / useUpdate / useDelete  → onSuccess: invalidate lists
service: thin axios wrapper, UI 모름
```

- 목록 query key에 **applied** 필터 객체 포함  
- Optimistic update는 L0 필수가 아님  
- 전역 `VITE_REAL_API_MODULES` 이중 경로 도입 금지; feature `service` 안에서 fixture 분기 정도는 허용하되 임시로 표시

TanStack Query 백엔드 캐시 상세: `.cursor/skills/tanstack-query-backend-cache/`.

---

## 6. UI 스펙 체크 (공유 SSOT)

작업 중 열린 상태로 확인할 것:

- [filter-area-dimensions](../../.cursor/rules/cms-admin-ui/filter-area-dimensions.mdc) — 240 / 12 / 160×44  
- [cms-data-table](../../.cursor/rules/cms-admin-ui/cms-data-table.mdc) — 54px 행, 패딩  
- [list-table-shell](../../.cursor/rules/cms-admin-ui/list-table-shell.mdc) — padding 20, 액션 gap 8  
- [styling-tokens](../../.cursor/rules/cms-admin-ui/styling-tokens.mdc)

페이지 CSS에 th/td height·padding 하드코딩이 있으면 **불합격**.

---

## 7. 완료 선언 템플릿

```text
수직 슬라이스: <리소스명>
앱: apps/<name>
PR/브랜치: …
Must 체크: ☐ 전부 / 예외: …
확장 게이트(1일): 통과 / 실패 사유
비고:
```

**Last updated:** 2026-08-06
