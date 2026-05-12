---
name: ''
overview: ''
todos: []
isProject: false
---

# 회원 목록 → UserDetailFullPageModal 단일 연결 + 새로고침 시 모달·LNB 유지

## 1. 목표

- [user-list-page.tsx](apps/cms/src/pages/users/user-list-page.tsx)에서 **SchoolDetailModal 경로 전부 제거**, 행 클릭·`id` 복원은 **항상** [UserDetailFullPageModal](apps/cms/src/features/user/ui/user-detail-fullpage-modal.tsx)만 사용.
- **새로고침(F5)** 후에도 `UserDetailFullPageModal`이 **열린 상태**이고, **내부 사이드바(탭·프로그램 이력 하위 메뉴) 선택**이 URL과 일치해 **유지**되도록 함.

## 2. 역할·쿼리 정합성 (기존 유지)

- LNB 구성은 `displayUser.role` 기준(모달 내부 `userSidebarItems`).
- [user-list-page.tsx](apps/cms/src/pages/users/user-list-page.tsx)의 `basicInfoEntrySource`: `**modalDetailUser`가 있으면 `userRoleToBasicInfoEntrySource(role)` — 전체 회원 목록에서 행별 역할과 본문 분기 일치.

## 3. user-list-page 변경 (SchoolDetailModal 제거)

- `SchoolDetailModal` import·상태·`handleSchoolDetailClose`·JSX·`institutions` 전용 URL 분기·`userDetailModalOpen`에서 institutions 제외 조건 **삭제**.
- `handleView`: 모든 `listKind`에서 `openDrawer` + `setParams({ id, lnb: 'detail-info' })` 통일.
- `userDetailModalOpen`: `drawerOpen || Boolean(params.id && modalDetailUser)` 로 복원.
- **닫기 시** `id`·`lnb` 제거와 함께, 아래에서 도입하는 **프로그램 이력 하위 쿼리 키**도 제거(섹션 4에서 이름 확정).

## 4. 새로고침 시 모달·사이드바 유지 — 원인과 대응

### 원인 (현재 코드)

1. **모달 열림**: `?id=` + 목록 페이지의 복원 effect로 대체로 유지 가능. (School 분기 제거 후 풀페이지만 열리면 됨.)
2. **상단 LNB**: `lnb` 쿼리를 읽는 effect는 있으나, 아래 effect가 **충돌**함.

```171:176:apps/cms/src/features/user/ui/user-detail-fullpage-modal.tsx
  useEffect(() => {
    if (open && displayUser) {
      setActiveLnb('detail-info')
      setActiveProgramsChild('enrollment')
    }
  }, [open, displayUser?.id])
```

- `open`이 true가 될 때마다(새로고침 직후 포함) **무조건** `detail-info` / `enrollment`로 덮어써 URL 복원과 경쟁할 수 있음.

1. **프로그램 참여 이력 하위 탭** (`enrollment` / `lecture` / `volunteer`): `handleSidebarSelectChild`가 `**lnb=history`만** URL에 쓰고 **하위 키는 미기록 → 새로고침 시 항상 기본값으로 돌아감.

### 대응 ([user-detail-fullpage-modal.tsx](apps/cms/src/features/user/ui/user-detail-fullpage-modal.tsx))

1. **쿼리 파라미터 추가** (목록과 동일 `useSearchParams` 컨텍스트):

- 예: `programsChild` = `enrollment` | `lecture` | `volunteer`
- 의미: `lnb=history` 이고 해당 역할에 하위 메뉴가 있을 때만 사용. 그 외 역할·`lnb` 조합에서는 무시하거나 정리.

1. **초기화 effect 수정** (위 171–176 블록):

- `open`만으로는 전체 초기화하지 않음.
- `**displayUser?.id`가 바뀔 때**에만 기본값으로 리셋하거나, 리셋 대신 **항상 URL에서 `lnb` + `programsChild`를 읽어 상태 시드하는 단일 경로로 통합.
- 권장: 사용자 전환 시에만 `detail-info`/`enrollment`로 리셋하고, **같은 사용자로 모달이 다시 열리는 경우(새로고침)** 는 URL이 우선.

1. `**lnb` 동기화 effect 확장 (기존 178–199 근처):

- `rawLnb`로 `activeLnb` 결정(기존 + 강사만 `payment-status` 허용) 유지.
- `programsChild` 파싱: 역할에 유효한 값만 반영 (예: INDIVIDUAL은 `lecture` 불가 → `enrollment` 등으로 클램프).
- URL에 잘못된 조합이 있으면 `replace: true`로 정규화.

1. **핸들러**:

- `handleSidebarSelectChild`: `setSearchParams`에 `programsChild` 반영.
- `handleSidebarSelectTop`에서 `history` 진입 시 기본 하위 탭이면 `programsChild=enrollment` 등 URL에 명시.

1. **목록 페이지 닫기**: [user-list-page.tsx](apps/cms/src/pages/users/user-list-page.tsx) `handleDrawerClose`의 `setParams`에서 `programsChild`(또는 확정한 키 이름) 삭제.
2. **타입**: [user-list-page.tsx](apps/cms/src/pages/users/user-list-page.tsx) `UserListQueryParams`에 선택 필드 추가해 쿼리 키 문서화(선택).

## 5. 검증 시나리오

- `kind=institutions`·`all` 등 목록에서 행 클릭 → 풀페이지만 열림 (학교 모달 없음).
- 전체 회원에서 역할 다른 행 연속 클릭 → LNB·본문이 역할에 맞게 변함.
- 풀페이지에서 `프로그램 참여 이력` → `봉사`/`강의` 등 하위 탭 선택 후 **새로고침** → 모달 열림 + **동일 하위 탭** 유지.
- `정산 현황` / `payment-status` 북마크 후 새로고침 → 강사만 유지, 비강사는 기존처럼 정규화.
- 모달 닫기 → `id`·`lnb`·`programsChild` 정리.

## 6. 범위 밖

- [school-list-page.tsx](apps/cms/src/pages/schools/school-list-page.tsx)의 `SchoolDetailModal` 유지.
- API/목 데이터 변경 없음(쿼리·상태만).
