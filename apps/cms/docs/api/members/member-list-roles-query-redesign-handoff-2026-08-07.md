# 회원 목록 조회 재설계 — roles exact set · 학교/회원 API 분기 (BE handoff)

**Date:** 2026-08-07  
**From:** CMS FE  
**To:** Backend  
**Status:** 계획 확정 · BE 계약(토큰·쿼리 파라미터명) 확정 요청  
**Related CMS screens:** `/users/list?kind=all|institutions|instructors|admins` · 학교 상세 소속 교사  

**사람용 요약(비에이전트):** [member-list-roles-query-redesign-overview-2026-08-07.md](./member-list-roles-query-redesign-overview-2026-08-07.md) — 슬랙·미팅 공유용. 본 문서는 계약·체크리스트용.

---

## 1. 요약

회원 목록 조회를 아래처럼 나눕니다.

| 구분 | API | 대상 |
|------|-----|------|
| **학교 조회** | **신규** 학교/기관 목록 API | 학교(조직)만 — **회원이 아님** |
| **회원 조회** | 기존 회원 목록 API 개편 (`roles` exact set + 서버 필터) | 사람 회원 전부 |

목록 탭별 노출·필터는 **FE 후처리하지 않고** 쿼리로 서버에 넘긴 뒤 응답을 그대로 그립니다.  
탭 진입 시마다 **네트워크 재호출**합니다 (목록 캐시 의존 없음).

**관리자 회원 목록**은 기존과 같이 **`/api/admin/admin-accounts`** 를 유지합니다 (회원 조회로 통합하지 않음).

---

## 2. 화면별 노출 정책

| CMS 목록 (`kind`) | 표면 UI | 데이터 소스 | 노출 대상 |
|-------------------|---------|-------------|-----------|
| 전체 회원 (`all`) | 사람 목록 | **회원 조회** | 학교 제외. 일반·교사·강사·교사겸강사·강사(권한박탈)·관리자 등 **모든 사람 유형** |
| 학교(교사) 회원 (`institutions`) | **학교 목록처럼** 보임 | **학교 조회 (신규)** | 학교만. 교사/교사겸강사는 목록에 직접 안 나오고, **학교 상세 → 소속 교사 목록**에서 확인 |
| 강사 회원 (`instructors`) | 사람 목록 | **회원 조회** | 강사 + 교사겸강사. **강사(권한박탈) 제외** |
| 관리자 회원 (`admins`) | 관리자 목록 | **`admin-accounts` (현행 유지)** | 관리자만 |

---

## 3. roles 모델

### 3.1 원칙

- 회원 유형은 응답·요청 모두 **`roles: string[]`** 로 표현합니다.
- 목록 필터는 **exact set 매칭**입니다.
  - 요청으로 허용할 set 목록을 넘기면, 회원의 `roles`가 **그중 하나의 set과 집합으로 동일**할 때만 포함합니다.
  - 배열 **순서는 무시**합니다 (`['general','instructor']` == `['instructor','general']`).
- 토큰 **표기(canonical casing·이름)** 는 **서버에서 확정**하고 FE가 따릅니다.  
  아래는 의미용 placeholder입니다. (예: `general` / `school_teacher` / `instructor` / `instructor_revoked` / `admin`)

### 3.2 `instructor_revoked`

- **roles 원소로 추가**합니다.
- `instructor` 와 `instructor_revoked` 는 **상호배타**입니다.
  - 박탈: `instructor` 제거 + `instructor_revoked` 추가
  - 재승인: 반대
- 별도 status 필드와 **이중 표현하지 않는 것**을 권장합니다 (목록 필터 단순화).

### 3.3 발생 가능한 exact set (사람 회원)

#### A) 사용자 자가가입

| 단계 | roles (의미) |
|------|----------------|
| 일반으로 가입 | `['general']` |
| 교사로 가입 | `['school_teacher']` |
| 일반 → 강사 권한 승인 | `['general', 'instructor']` |
| 교사 → 강사 권한 승인 | `['school_teacher', 'instructor']` |
| 위 강사 권한 박탈 | `['general', 'instructor_revoked']` / `['school_teacher', 'instructor_revoked']` |

#### B) 어드민 사전등록

| 등록 UI | roles (등록 직후) |
|---------|-------------------|
| 일반 회원 등록 | `['general']` |
| 강사 등록 + 회원 유형 **일반 회원** | `['general', 'instructor']` |
| 강사 등록 + 회원 유형 **교사 회원** | `['school_teacher', 'instructor']` |

- 강사 사전등록 시 CMS UI는 「일반 회원 / 교사 회원」을 선택합니다 (베이스 유형 + 강사).
- **`['instructor']` 단독 set은 사용하지 않습니다.**
- 교사 **단독** 사전등록은 하지 않습니다 (교사는 본인 가입). 강사 모달의 「교사 회원」은 **교사 겸 강사** 등록입니다.
- 일반 사전등록 후 포털에서 강사 권한 신청·승인 → `['general', 'instructor']` (박탈 시 `instructor_revoked`).

#### C) 관리자

- 관리자 계정은 **회원 `roles` 목록 API가 아니라 `admin-accounts`** 로 조회합니다.
- (참고) 전체 회원 목록에 관리자 행이 포함될 경우의 roles 표현은 서버 정책에 맡깁니다. 관리자 **전용 탭**은 admin-accounts 유지.

---

## 4. 목록별 roles allowlist (회원 조회)

### 4.1 전체 회원

- **roles 제한 없음** (쿼리에 roles allowlist 미전송).
- 학교(조직)는 **회원 조회 API 응답에 포함하지 않음** (학교 조회 API로 분리).

### 4.2 강사 회원

허용 exact sets (**활성 강사만**):

1. `['general', 'instructor']`
2. `['school_teacher', 'instructor']`

**제외:** `instructor_revoked` 가 들어간 모든 set.

### 4.3 학교 상세 → 소속 교사 목록

학교(조직)에 소속된 교사만, 아래 exact sets (**권한박탈 교사겸강사 포함**):

1. `['school_teacher']`
2. `['school_teacher', 'instructor']`
3. `['school_teacher', 'instructor_revoked']`

스코프: path/query의 학교 `memberId` / `organizationId` (기존 affiliated-teachers 연동 방식과 맞추면 됨).

### 4.4 학교(교사) 회원 목록 화면

- **회원 조회 roles 해당 없음.**
- **학교/기관 목록 API (신규)** 만 사용.

### 4.5 관리자 회원 목록

- **`GET /api/admin/admin-accounts`** (현행).
- 회원 조회 `roles=['admin']` 통일 **하지 않음**.

---

## 5. API 분기 요청

### 5.1 학교/기관 목록 API (신규)

- **목적:** CMS 「학교(교사) 회원 목록」— 표면상 학교 목록.
- **포함:** 학교(조직)만.
- **포함하지 않음:** 교사·강사 등 사람 회원 row.
- 교사는 학교 상세의 소속 교사 API로만 노출.

제안 path (서버 확정):

- 예) `GET /api/admin/organizations/schools` 또는 `GET /api/admin/schools`
- OpenAPI·실제 path는 BE 확정 후 FE 반영.

### 5.2 회원 목록 API (개편)

- 기존 `GET /api/admin/users` (`listMembers`) 확장 또는 동등 계약.
- **학교를 응답에 넣지 않음.**
- `roles` exact set allowlist + 화면 필터 쿼리 지원.
- FE는 탭 진입마다 재호출합니다 (`staleTime: 0` + refetch). 서버 캐시 정책과 무관하게 **항상 최신 목록**을 기대합니다.

### 5.3 소속 교사 목록

- 기존 `GET /api/admin/users/{memberId}/affiliated-teachers` 를 유지하되,  
  내부/쿼리에서 §4.3 exact set 과 동일 정책으로 필터하거나,  
  동등한 회원 조회 + 학교 스코프로 대체 가능 (BE 선택).
- **권한박탈 교사겸강사 포함.**

### 5.4 관리자

- 현행 `admin-accounts` 유지. 본 문서 범위에서 변경 요청 없음.

---

## 6. roles 쿼리 계약 (BE 확정 요청)

exact set이 **여러 개**이므로, 단일 `role=INSTRUCTOR` contains 로는 부족합니다.

**요청:** 아래 중 하나로 쿼리 스펙을 OpenAPI에 명시해 주세요.

| 방식 | 예시 (개념) |
|------|-------------|
| A. allowlist 직렬화 | `rolesExactAnyOf=general+instructor,school_teacher+instructor` |
| B. 반복 파라미터 | `rolesExact=general,instructor` & `rolesExact=school_teacher,instructor` (OR) |
| C. 프리셋 | `memberListPreset=instructors` (서버가 §4.2 allowlist 내장) |

FE 선호: **A 또는 B** (프리셋만 있으면 화면 커스텀 필터 확장이 어려움).  
토큰 구분자·인코딩 규칙은 BE 확정.

---

## 7. 페이지별 필터 목록 (현재 CMS UI SSOT)

> 소스: `apps/cms/src/pages/users/user-list-filter-fields.ts`  
> FE는 아래 필터를 **쿼리로 전송**하고, 응답을 **추가 필터 없이** 표시합니다.  
> **파라미터 이름·옵션 value canonical** 은 BE가 OpenAPI로 확정해 주세요. (표의 FE 키는 힌트)

### 7.0 한눈에 보기

| 페이지 | API | 필터 UI (라벨) | 고정 조건 |
|--------|-----|----------------|-----------|
| 전체 회원 | 회원 조회 | 회원명 · 회원 유형 · 가입 시기 | 학교(조직) 미포함 |
| 학교(교사) 회원 | **학교 조회 (신규)** | 기관명 · 기관 소재지(시/도·시/군/구) · 등록 시기 | 학교만 |
| 강사 회원 | 회원 조회 | 강사명 · JA 평가 등급 · 정산 현황 · 가입 시기 | §4.2 roles allowlist (박탈 제외) |
| 관리자 회원 | **admin-accounts** | 관리자명 · 권한 유형 · 가입 시기 | 관리자 계정만 |
| 학교 상세 → 소속 교사 | affiliated-teachers / 회원 조회 | *(목록 상단 필터 없음)* | §4.3 roles + 학교 스코프 |

공통 페이징: `page`, `size` (0-based page 권장 — 현행 `listMembers`와 동일하면 유지)

---

### 7.1 전체 회원 (`/users/list?kind=all`) — 회원 조회

| # | UI 라벨 | 컨트롤 | FE 키 (힌트) | 옵션 / 값 | 서버 처리 |
|---|---------|--------|--------------|-----------|-----------|
| 1 | 회원명 | search | `keyword` (현 `search`) | 자유 텍스트 · placeholder: `회원명을 입력하세요` | 이름 등 검색 |
| 2 | 회원 유형 | select | `role` → **roles 체계로 재정의** | 현행: 전체 / 개인 / 학교(교사) / 강사 / 관리자 | **학교(교사)=조직 옵션 제거**. 사람 유형만 (예: 전체 / 일반 / 교사 / 강사 / 교사겸강사 / 강사(권한박탈) / 관리자). 선택 시 해당 exact set(들)로 필터 |
| 3 | 가입 시기 | dateRange | `createdAtFrom`, `createdAtTo` | `YYYY-MM-DD` ~ `YYYY-MM-DD` | inclusive 권장 |

고정 쿼리: roles allowlist **없음** (전체 사람 회원). 학교(조직) row **미포함**.

---

### 7.2 학교(교사) 회원 (`/users/list?kind=institutions`) — 학교/기관 조회 API (신규)

| # | UI 라벨 | 컨트롤 | FE 키 (힌트) | 옵션 / 값 | 서버 처리 |
|---|---------|--------|--------------|-----------|-----------|
| 1 | 기관명 | search | `keyword` (현 `search`) | 자유 텍스트 · placeholder: `기관명을 입력하세요` | 학교명 검색 |
| 2 | 기관 소재지 | addressRegion (이중 셀렉트) | `regionSido` / `regionSigungu` (현 `institutionSido` / `institutionSigungu`) | 시/도 → 시/군/구 종속. FE: `INSTITUTION_SIDO_FILTER_OPTIONS` + sigungu map | 소재지 필터 |
| 3 | 등록 시기 | dateRange | `createdAtFrom`, `createdAtTo` | `YYYY-MM-DD` ~ `YYYY-MM-DD` | 학교 등록일 |

고정: **사람 회원(교사 등) row 미포함** — 학교(조직)만.

---

### 7.3 강사 회원 (`/users/list?kind=instructors`) — 회원 조회

| # | UI 라벨 | 컨트롤 | FE 키 (힌트) | 옵션 / 값 | 서버 처리 |
|---|---------|--------|--------------|-----------|-----------|
| 1 | 강사명 | search | `keyword` (현 `search`) | 자유 텍스트 · placeholder: `강사명을 입력하세요` | 이름 검색 |
| 2 | JA 평가 등급 | select | `jaEvaluationGrade` | 전체(빈 값) / `A` / `B` / `C` / `D` (라벨: A등급…) | `listMetrics.jaEvaluationGrade` 등과 정합 |
| 3 | 정산 현황 | select | `settlementStatus` | 아래 §7.3.1 | `listMetrics.settlementStatusLabel` 등과 정합 |
| 4 | 가입 시기 | dateRange | `createdAtFrom`, `createdAtTo` | `YYYY-MM-DD` ~ `YYYY-MM-DD` | |

고정 쿼리 — roles exact allowlist (§4.2):

- `['general', 'instructor']`
- `['school_teacher', 'instructor']`

`instructor_revoked` 포함 set **제외**.

#### 7.3.1 정산 현황 옵션 (현 CMS 라벨)

필터 value는 현재 **한글 라벨 문자열**을 씁니다. BE는 code↔라벨 매핑을 OpenAPI에 명시해 주세요.

| FE value (현행 = 라벨) | 내부 key (참고) |
|------------------------|-----------------|
| 지급조서 재신청 | `payment_statement_reapplication` |
| 확인 대기 중 | `awaiting_confirmation` |
| 확인 진행 중 | `partial_confirmation` |
| 지급조서 확인 완료 | `payment_statement_verified` |
| 계좌 지급 완료 | `account_paid` |
| 해당 없음 | `none` |
| 신청 반려 | `application_rejected` |
| 지급 정정 요청 | `payment_correction_requested` |

---

### 7.4 관리자 회원 (`/users/list?kind=admins`) — `GET /api/admin/admin-accounts`

| # | UI 라벨 | 컨트롤 | FE 키 (힌트) | 옵션 / 값 | 서버 처리 |
|---|---------|--------|--------------|-----------|-----------|
| 1 | 관리자명 | search | `keyword` | 자유 텍스트 · placeholder: `관리자명을 입력하세요` | 현행 admin-accounts 검색과 정합 |
| 2 | 권한 유형 | select | `roleCode` / `adminPermissionVariant` | 전체(빈 값) / `manager`(마스터 관리자) / `partner`(중간 관리자) / `viewer`(뷰어) | 현행 roleCode 필터와 정합 |
| 3 | 가입 시기 | dateRange | `createdAtFrom`, `createdAtTo` | `YYYY-MM-DD` ~ `YYYY-MM-DD` | 미지원 시 OpenAPI에 명시 |

회원 조회 `roles` 미사용.

---

### 7.5 학교 상세 → 소속 교사 목록

목록 **상단 FilterTableLayout 필터는 없음** (테이블만).  
조회 시 서버 조건:

| # | 조건 | 설명 |
|---|------|------|
| 1 | 학교 스코프 | path/query `memberId` 또는 `organizationId` |
| 2 | roles exact allowlist (§4.3) | `['school_teacher']` · `['school_teacher','instructor']` · `['school_teacher','instructor_revoked']` |
| 3 | (테이블 컬럼) 재직 현황 | 행 단위 표시·변경용 — **목록 조회 필터 쿼리 아님** (별도 PATCH API) |

---

### 7.6 페이지 × 쿼리 키 체크리스트 (BE)

| 쿼리 키 (힌트) | 전체 회원 | 학교 목록 | 강사 회원 | 관리자 | 소속 교사 |
|----------------|:---------:|:---------:|:---------:|:------:|:---------:|
| `page`, `size` | ✅ | ✅ | ✅ | ✅ | ✅ (해당 시) |
| `keyword` | ✅ | ✅ | ✅ | ✅ | — |
| 회원 유형 / roles allowlist | ✅ (선택 필터) | — | ✅ (고정 §4.2) | — | ✅ (고정 §4.3) |
| `createdAtFrom` / `createdAtTo` | ✅ | ✅ | ✅ | ✅ | — |
| `regionSido` / `regionSigungu` | — | ✅ | — | — | — |
| `jaEvaluationGrade` | — | — | ✅ | — | — |
| `settlementStatus` | — | — | ✅ | — | — |
| `roleCode` (권한 유형) | — | — | — | ✅ | — |
| 학교 스코프 id | — | — | — | — | ✅ |

---


## 8. FE 기대 동작 (참고)

- 목록 탭 진입 / `kind` 변경 시 **항상 목록 API 재호출** (`staleTime: 0`, refetch on mount).
- JA 등급·정산·가입일·순수강사 FE 후처리 **제거 예정** — 서버가 필터·페이징·total 책임.
- roles 토큰·쿼리 키가 OpenAPI에 반영되면 FE mapper/query 갱신.

---

## 9. BE 체크리스트

- [ ] roles canonical 토큰 확정 (`general` / `school_teacher` / `instructor` / `instructor_revoked` / …)
- [ ] `instructor` ↔ `instructor_revoked` 상호배타 · 박탈/재승인 시 roles 교체 규칙
- [ ] exact set 매칭 + 순서 무시 + **다중 set OR** 쿼리 스펙 (OpenAPI)
- [ ] **학교/기관 목록 API 신규** (사람 회원 미포함)
- [ ] **회원 목록 API에서 학교(조직) 제외**
- [ ] 강사 목록 allowlist §4.2 (박탈 제외)
- [ ] 소속 교사 allowlist §4.3 (박탈 교사겸강사 포함)
- [ ] **§7 페이지별 필터 목록** 전수 지원 (전체/학교/강사/관리자/소속교사 · 옵션 value 포함)
- [ ] 관리자 탭은 **admin-accounts 유지** (변경 없음)
- [ ] OpenAPI (`members` / backend) 갱신 후 FE에 공유

---

## 10. 참고 (현행 FE)

| 항목 | 위치 |
|------|------|
| 목록 kind | `apps/cms/src/shared/config/member-list-kinds.ts` |
| 필터 UI | `apps/cms/src/pages/users/user-list-filter-fields.ts` |
| 목록 조회 | `getUsersPage` → `GET /api/admin/users` / admins → `admin-accounts` |
| 강사 FE 후처리(제거 예정) | `instructorListPureOnly` in `user-service.ts` |
| 소속 교사 | `GET /api/admin/users/{memberId}/affiliated-teachers` |

---

**Last updated:** 2026-08-07
