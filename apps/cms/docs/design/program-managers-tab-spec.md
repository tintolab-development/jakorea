# 프로그램 상세 담당자 정보 탭 명세 (디자이너/기획/PM → 개발 위임)

**대상**: 프로그램 상세 페이지 > **담당자 정보** 탭  
**참조 시안**: 스크린샷 (프로그램 상세 > 담당자 정보 — 검색/필터, 담당자 목록 테이블, 삭제·등록·권한 수정)  
**기존 참고 UI**: [ProgramProgressTab](../../../src/features/program/general/ui/detail-modal/program-status/program-progress-tab.tsx) — 필터·조회 버튼·테이블 상단 N건·액션 버튼(삭제/추가) 패턴 재사용

---

## 1. 개요 (PM/기획)

- **목적**: 해당 **프로그램에 배정된 담당자(관리자)** 목록을 조회·검색하고, 담당자 등록·삭제·권한 수정을 할 수 있게 한다.
- **사용자**: 관리자(ADMIN). 프로그램 단위 권한(담당자/파트너/보조) 관리.
- **범위**: 1차는 **검색/필터 + 담당자 목록 테이블 + 삭제/등록/권한 수정** UI·동작 구현. API 연동은 mock 기반으로 후속 전환 가능.

---

## 2. 레이아웃 및 공통 사양 (디자이너 → 개발)

### 2.1 탭 컨테이너

- 프로그램 상세 페이지의 메인 탭 중 **「담당자 정보」** 탭 선택 시 본 콘텐츠 표시.
- **URL**: 기존 `?tab=managers` 유지 (`use-program-detail-tab.ts` 연동).
- 본 탭 내부는 **필터 영역(한 줄)** + **구분선** + **테이블 헤더(제목 + 액션 버튼)** + **테이블**으로 구성. (서브 탭 없음.)

### 2.2 전체 래퍼 (기존 진행 현황 탭과 동일 패턴)

| 항목               | 값                                                 | 비고                                          |
| ------------------ | -------------------------------------------------- | --------------------------------------------- |
| **래퍼**           | `Card` (border false, 배경 `var(--color-bg-base)`) | `program-progress-tab__card` 스타일 참고      |
| **내부 패딩**      | 상 16px, 좌우 24px, 하 24px                        | 기존 탭과 동일                                |
| **상단 블록**      | 필터 한 줄 (담당자명, 권한, 조회 버튼)             | 우측 끝에 조회 버튼                           |
| **구분선**         | 테이블 영역과 구분용 Divider                       | `program-progress-tab__divider` 참고          |
| **테이블 위 헤더** | "담당자 목록 N건" + **삭제** 버튼 + **등록** 버튼  | 삭제 좌측, 등록 우측 또는 동일한 헤더 행 양끝 |

### 2.3 스타일 토큰 (디자이너)

- **색상·간격·타이포**: [styling-tokens.md](../../../.cursor/rules/design/styling-tokens.md) 준수. `var(--color-*)`, `var(--spacing-*)`, `var(--font-size-*)` 등만 사용.
- **버튼**: [AppButton](../../../src/shared/ui/app-button.tsx) 재사용.
  - **조회**: `variant="primary"`, `size="large"`.
  - **삭제**: `variant="danger"`, `size="large"`, `dangerFillOnHover` (기존 진행 현황 탭 삭제 버튼과 동일).
  - **등록**: `variant="primary"`, `size="large"` (청록 채움).
- **필터 레이블/인풋**: 진행 현황 탭의 `program-progress-tab__filter-field`, `program-progress-tab__filter-label` 또는 [LabeledSearchInput](../../../src/shared/ui/labeled-search-input.tsx) 패턴 사용. 담당자명은 검색 인풋(placeholder "전체"), 권한은 Select(placeholder "전체").

---

## 3. 검색/필터 영역

- **한 줄 배치**: 담당자명(텍스트 입력) + 권한(Select) + **조회** 버튼. (진행 현황 탭 필터 행과 동일 레이아웃.)
- **동작**: **조회** 버튼 클릭 시에만 필터 값이 적용되어 테이블 데이터가 갱신된다. (기존 `appliedFilters` 패턴.)

| 필터 라벨    | 타입         | 옵션/플레이스홀더              | 비고                                                   |
| ------------ | ------------ | ------------------------------ | ------------------------------------------------------ |
| **담당자명** | Input (검색) | placeholder "전체"             | 텍스트 부분 일치 검색용                                |
| **권한**     | Select       | 전체, PM(담당자), 파트너, 보조 | 프로그램 역할(ProgramRole) 기준. 아래 3.1 권한 값 참고 |
| **(우측)**   | **버튼**     | **조회**                       | primary, 클릭 시 필터 적용                             |

### 3.1 권한 값 (표시 라벨)

- **데이터**: `ProgramRole` = `OWNER` | `PARTNER` | `ASSISTANT` ([permissions.ts](../../../src/shared/config/permissions.ts), [user.ts](../../../src/types/user.ts)).
- **UI 표시**: 시안 기준 **PM** / **파트너** / **뷰어**.
  - `OWNER` → **"PM"** 또는 **"담당자"** (요구사항 문서는 "담당자", 시안은 "PM" — 개발 시 기획 확인 또는 둘 다 지원하도록 라벨 맵 상수화).
  - `PARTNER` → **파트너**
  - `ASSISTANT` → **뷰어**
- Select 옵션: `전체` + PM(담당자) + 파트너 + 보조.

---

## 4. 테이블: 담당자 목록

### 4.1 테이블 헤더 행 (테이블 위)

- **좌측**: "담당자 목록 **N건**" (N = 조회 적용 후 행 개수). 기존 `program-progress-tab__table-heading` / `program-progress-tab__table-title` / `program-progress-tab__table-description` 패턴.
- **우측**: **삭제** 버튼 + **등록** 버튼. 간격 8px. (진행 현황 탭의 "강사 삭제" / "강사 추가"와 동일한 배치.)

### 4.2 테이블 컬럼 (스크린샷 기준)

| 컬럼명   | 데이터 타입 | 표시 형식            | 비고                                                               |
| -------- | ----------- | -------------------- | ------------------------------------------------------------------ |
| (선택)   | -           | 체크박스             | 행 선택용, Ant Design Table rowSelection                           |
| No.      | number      | 1부터 순번           | 중앙 정렬, width 72px 수준                                         |
| 담당자명 | string      | 텍스트               |                                                                    |
| 권한     | ProgramRole | **텍스트 또는 뱃지** | PM / 파트너 / 보조 (위 3.1)                                        |
| 연락처   | string      | 텍스트               | 예: 010-1234-5678                                                  |
| 이메일   | string      | 텍스트               |                                                                    |
| 등록일시 | datetime    | "YYYY.MM.DD HH:mm"   | 예: 2026.02.10 09:15                                               |

- **권한 변경**: 권한 열 `StatusDropdownCell` 인라인 배지만 사용 (별도 관리 컬럼 없음).

- **행 스타일**: 기존 테이블과 동일(헤더 배경 #fafafa, 셀 구분선, 세로 중앙 정렬). [table-management.md](../../../.cursor/rules/tables/table-management.md) 참고.

### 4.3 액션 동작 (기획)

- **삭제**: 선택된 행이 없으면 "삭제할 담당자를 선택해 주세요." 메시지. 선택 시 확인 모달("선택한 N명의 담당자를 삭제하시겠습니까?") → 확인 시 목록에서 제거(1차 mock 기준). 진행 현황 탭의 `handleInstructorDelete` 패턴.
- **등록**: 클릭 시 **담당자 등록 모달** 오픈. 모달 내에서 담당자(회원) 선택 + 권한(PM/파트너/보조) 선택 후 등록 → 목록에 추가(1차 mock). (모달 UI 상세는 아래 5. 담당자 등록 모달.)
- **권한 수정**: 해당 행의 권한만 변경. 인라인 Select 또는 작은 모달에서 권한 선택 후 저장. 1차는 **모달(권한 수정)** 권장 — "권한 수정" 클릭 시 모달 오픈, 권한 선택 후 저장 시 테이블 해당 행만 갱신.

---

## 5. 담당자 등록 모달 (기획/디자이너)

- **트리거**: 테이블 위 **등록** 버튼 클릭.
- **사양** (최소):
  - **제목**: "담당자 등록".
  - **내용**: 담당자 선택(회원 검색/선택 또는 이메일 입력) + **권한** Select(PM / 파트너 / 보조).
  - **푸터**: 취소 + 등록(primary). 등록 시 목록에 한 행 추가하고 모달 닫기.
- **컴포넌트**: 기존 [TealHeaderModal](../../../src/shared/ui/teal-header-modal.tsx) 재사용 권장. size는 medium 또는 large(필드 수에 따라).

---

## 6. 권한 수정 모달 (기획)

- **트리거**: 테이블 **관리** 컬럼의 "권한 수정" 버튼 클릭.
- **사양** (최소):
  - **제목**: "권한 수정".
  - **내용**: 해당 담당자명 표시 + **권한** Select(PM / 파트너 / 보조). 기본값 현재 행의 권한.
  - **푸터**: 취소 + 저장(primary). 저장 시 해당 행만 권한 값 갱신하고 모달 닫기.

---

## 7. 데이터·타입 (개발 참고)

- **담당자 한 건 타입** (가칭 `ProgramManagerRow`):
  - `id`: string (rowKey)
  - `no`: number (표시용 순번)
  - `name`: string (담당자명)
  - `role`: ProgramRole (`OWNER` | `PARTNER` | `ASSISTANT`)
  - `phone`: string (연락처)
  - `email`: string (이메일)
  - `registeredAt`: string (등록일시, ISO 또는 "YYYY.MM.DD HH:mm")
- **1차**: mock 배열로 테이블 렌더링. 예: 3건(강제이-뷰어, 박제이-파트너, 김제이-PM) 등 스크린샷과 유사한 mock 데이터.

---

## 8. 구현 위임 사항 (개발자 체크리스트)

### 8.1 구조·라우팅

- [ ] `program-detail-page.tsx`의 `managers` 탭 `children`에 **ProgramManagersTab**(가칭) 컴포넌트 연결. `programId`(또는 `id`) props 전달.
- [ ] 담당자 정보 탭 전용 **쿼리 파라미터 훅** (가칭 `use-program-managers-params`) 추가: 필터 키 `managerName`, `role` 및 **조회 시에만 적용되는 appliedFilters** 패턴 적용 (진행 현황 탭과 동일).

### 8.2 UI 컴포넌트 재사용

- [ ] **Card, 필터 행, 조회 버튼, 테이블 상단 "담당자 목록 N건" + 삭제/등록**: `ProgramProgressTab` 및 `program-progress-tab.css` 스타일 참고. 필요 시 `program-managers-tab.css` 신규 생성.
- [ ] **필터**: 담당자명 — `LabeledSearchInput` 또는 동일 스타일 Input(placeholder "전체"). 권한 — Select(전체 + PM + 파트너 + 보조).
- [ ] **테이블**: Ant Design Table, rowSelection, columns 위 4.2 기준. **권한** 컬럼은 텍스트 또는 기존 뱃지 패턴 적용(필요 시 ProgramRole 전용 작은 뱃지).
- [ ] **버튼**: AppButton — 조회(primary), 삭제(danger, dangerFillOnHover), 등록(primary), 권한 수정(viewDetails).

### 8.3 모달

- [ ] **담당자 등록 모달**: TealHeaderModal, 필드(담당자 선택 + 권한), 취소/등록. 1차는 담당자 선택을 이메일 Input + 이름 Input 등으로 대체 가능(mock).
- [ ] **권한 수정 모달**: TealHeaderModal, 담당자명 표시 + 권한 Select, 취소/저장.

### 8.4 데이터·필터

- [ ] 담당자 목록: **mock 데이터** (위 7. ProgramManagerRow 형식). 3건 이상 예시 데이터.
- [ ] 필터 로직: **조회** 클릭 시에만 `appliedFilters` 반영하여 목록 필터링 (담당자명 부분 일치, 권한 일치).
- [ ] 삭제: 선택 행 제거(mock 상태 갱신). 확인 모달 필수.
- [ ] 등록: 모달에서 입력 후 목록 앞에 한 행 추가(mock).
- [ ] 권한 수정: 모달에서 저장 시 해당 행의 role만 갱신(mock).

### 8.5 접근성·일관성

- [ ] 테이블: [table-management.md](../../../.cursor/rules/tables/table-management.md) 참고. 필요 시 @tanstack/react-table + Ant Design Table 조합 또는 Ant Design Table만 사용.
- [ ] 스타일: [styling-tokens.md](../../../.cursor/rules/design/styling-tokens.md) 준수. 반응형(wrap, min-width) 고려.

### 8.6 향후 확장 (명세만, 구현 별도)

- [ ] API 연동: 담당자 목록 조회/등록/삭제/권한 수정 API 확정 후 mock 교체.
- [ ] 담당자 선택: 회원 검색/자동완성 API 연동 시 등록 모달 내 선택 UI 교체.
- [ ] 페이지네이션: 데이터 증가 시 pagination 옵션 검토.

---

## 9. 참조 문서·코드

- [persona.md](../../../.cursor/rules/process/persona.md) — 역할별 요청 해석 (디자이너/기획/PM → 개발 위임 표현)
- [program-progress-tab.tsx](../../../src/features/program/general/ui/detail-modal/program-status/program-progress-tab.tsx) — 필터·조회·테이블 헤더·삭제/추가 버튼 패턴
- [use-program-progress-params.ts](../../../src/features/program/general/hooks/use-program-progress-params.ts) — 필터·URL 동기화
- [program-detail-applicants-tab-spec.md](./program-detail-applicants-tab-spec.md) — 동일 명세 양식
- [table-management.md](../../../.cursor/rules/tables/table-management.md) — 테이블 구현 규칙
- [styling-tokens.md](../../../.cursor/rules/design/styling-tokens.md) — 디자인 토큰
- [permissions.ts](../../../src/shared/config/permissions.ts) — PROGRAM_ROLE_PERMISSIONS (OWNER/PARTNER/ASSISTANT 라벨)

---

**문서 버전**: 1.0  
**마지막 업데이트**: 2026-02-11
