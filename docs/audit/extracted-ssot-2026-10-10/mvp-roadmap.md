# MVP·roadmap 이관 SSOT (progress.md는 원본 유지)

이관일: 2026-10-10
원본 수: 8

원본 경로 목록:

- `apps/cms/docs/requirements-specification/MVP/README.md`
- `apps/cms/docs/requirements-specification/MVP/phases-frontend-mock.md`
- `apps/cms/docs/requirements-specification/MVP/v0.1-foundation.md`
- `apps/cms/docs/requirements-specification/MVP/v0.2-front-core.md`
- `apps/cms/docs/requirements-specification/MVP/v0.3-admin-ops.md`
- `apps/cms/docs/requirements-specification/MVP/v0.4-settlement-report.md`
- `apps/cms/docs/requirements-specification/MVP/v0.5-security-compliance.md`
- `apps/cms/docs/roadmap/MVP_ROADMAP_V4_DETAILED.md`

---

### Source: `apps/cms/docs/requirements-specification/MVP/README.md`

# MVP 버전 로드맵 (Frontend + Mock)

> 본 문서는 `requirements.md`를 **정확히** 반영한 프론트엔드 MVP 로드맵입니다.
> 모든 기능 ID, 상태값, 역할 체계, 산식은 요구사항 원문과 일치합니다.
> **최종 업데이트**: 2026-01-22

---

## 📊 전체 진행 상황 요약

| MVP 버전 | 진행률 | 상태 | 주요 완료 항목 |
|---------|-------|------|--------------|
| v0.1 Foundation | 100% | ✅ 완료 | 역할 체계, 회원가입, 상태값 정의 |
| v0.2 Front Core | 50% | ⚠️ 부분 완료 | 프로그램 탐색, 신청서 UI, 강사 마이페이지 UI |
| v0.3 Admin Ops | 50% | ⚠️ 부분 완료 | 신청 목록, 매칭 UI, 회원 조회 UI |
| v0.4 Settlement | 50% | ⚠️ 부분 완료 | 정산 산출 로직, 지급조서 다운로드 |
| v0.5 Security | 0% | ❌ 미구현 | 보안 요구사항 전반 미구현 |

**전체 진행률**: 약 30%

---

## 기준 원칙

1. **역할 체계**: 요구사항 그대로 적용
   - 프론트 사용자: `개인(참여자)` / `학교` / `강사`
   - 관리자: `마스터 관리자` / `관리자` / `일반`
   - 관리자 프로그램 역할: `담당자` / `파트너` / `보조`

2. **상태값**: 요구사항 §3.3 그대로 적용
   ```
   신청(접수) → 매칭 진행중 → 매칭 완료 → 교재 배송 준비중 →
   교재 발송 완료 → 교육 실시 → 만족도 조사 제출 → 강의보고서 제출
   ```

3. **기능 우선순위**: P0 > P1 > P2 > P3

4. **Hook 분리 원칙**: 모든 비즈니스 로직은 Custom Hook으로 분리

---

## 버전 목록

| 버전 | 제목 | 주요 요구사항 | 진행률 | 상태 |
|------|------|--------------|--------|------|
| v0.1 | 인증/역할/기본 구조 | FR-B01, FR-B02, §2 역할 정의 | 100% | ✅ 완료 |
| v0.2 | 프론트 사용자 핵심 흐름 | FR-C01~C04, FR-D01, FR-E01~E03 | 50% | ⚠️ 부분 완료 |
| v0.3 | 관리자 운영 기능 | FR-F00~F03, §백오피스 권한 | 50% | ⚠️ 부분 완료 |
| v0.4 | 정산/지급/실적 | FR-G01, FR-G03, 별첨2 산식 | 50% | ⚠️ 부분 완료 |
| v0.5 | 보안/컴플라이언스 | NFR-SEC-*, NFR-DATA-*, NFR-PRIV-* | 0% | ❌ 미구현 |

---

## 파일 목록

- `v0.1-foundation.md` : 인증/역할/기본 데이터 모델
- `v0.2-front-core.md` : 사용자(개인/학교/강사) 핵심 신청 흐름
- `v0.3-admin-ops.md` : 관리자 승인/매칭/상태 운영
- `v0.4-settlement-report.md` : 정산/지급조서/실적 데이터
- `v0.5-security-compliance.md` : 보안/개인정보/다운로드 통제


---

### Source: `apps/cms/docs/requirements-specification/MVP/phases-frontend-mock.md`

# MVP Phase 총괄 체크리스트 (Frontend + Mock)

> 본 문서는 `requirements.md`를 기준으로 모든 Phase를 정리한 체크리스트입니다.
> Cursor AI와 Claude Code 협업 시 진행 상황 추적에 사용합니다.

---

## 진행 상황 요약

| MVP | 진행률 | 상태 | 업데이트 |
|-----|-------|------|---------|
| v0.1 Foundation | 100% | ✅ 완료 | 2025-01-20 |
| v0.2 Front Core | 50% | ⚠️ 부분 완료 | 2026-01-22 |
| v0.3 Admin Ops | 50% | ⚠️ 부분 완료 | 2026-01-22 |
| v0.4 Settlement | 50% | ⚠️ 부분 완료 | 2026-01-22 |
| v0.5 Security | 0% | ❌ 미구현 | - |

**전체 진행률**: 약 30%

---

## MVP v0.1 - Foundation (인증/역할/기본 구조)

**상태**: ✅ 완료 (100%)

### Phase 0.1.1 - 역할/권한 체계 재정의
- [x] `src/types/user.ts` 수정
  - [x] UserRole: `INDIVIDUAL` | `SCHOOL` | `INSTRUCTOR` | `ADMIN`
  - [x] AdminLevel: `MASTER` | `ADMIN` | `GENERAL`
  - [x] ProgramRole: `OWNER` | `PARTNER` | `ASSISTANT`
- [x] `src/shared/config/permissions.ts` 생성
  - [x] ADMIN_PERMISSIONS 정의
  - [x] PROGRAM_ROLE_PERMISSIONS 정의
- [x] `usePermissions()` Hook (부분)
- [x] `useProgramRole(programId)` Hook (부분)

### Phase 0.1.2 - 회원가입 흐름 (FR-B01, FR-B02)
- [x] `/auth/register` 페이지
  - [x] Step 1: 역할 선택 (개인/학교/강사)
  - [x] Step 2: 약관 동의 (필수/선택)
  - [x] Step 3: 정보 입력 (역할별 분기)
- [x] `useRegister()` Hook
- [x] `useConsent()` Hook

### Phase 0.1.3 - 로그인 흐름
- [x] 로그인 페이지 개선 (역할 자동 판별)
- [x] 역할별 리다이렉트
- [x] `useAuth()` Hook 개선
- [x] `useLogin()` Hook

### Phase 0.1.4 - 상태값/기본 모델 정의
- [x] `src/shared/constants/status.ts`
  - [x] APPLICATION_STATUS (8단계)
  - [x] SCHOOL_APPLICATION_STATUS
  - [x] INTERVIEW_STATUS
- [x] `src/types/program.ts` 업데이트
- [x] `src/types/application.ts` 업데이트
- [x] `useStatusLabel(status)` Hook
- [x] `useStatusTimeline(applicationId)` Hook (부분)


#### Marker lines (excerpt)
```
- [x] `useApplicationForm(programId)` Hook (부분)
- [ ] `useDownloadPermission(programId)` Hook (미구현)
- [x] `useInstructorApplications(programId)` Hook (부분)
- [x] `usePerformanceStats(programId)` Hook
- [ ] 미완료
```

---

### Source: `apps/cms/docs/requirements-specification/MVP/v0.1-foundation.md`

# MVP v0.1 - Foundation (인증/역할/기본 구조)

> 요구사항 참조: §1 시스템 구성, §2 역할 및 권한, FR-B01, FR-B02  
> **최종 업데이트**: 2026-01-22  
> **전체 진행률**: 100% (완료)

---

## 📊 진행 상황 요약

| Phase | 우선순위 | 상태 | 진행률 | 담당 역할 |
|-------|---------|------|--------|----------|ㅁ
| Phase 0.1.1 - 역할/권한 체계 | P1 | ✅ 완료 | 100% | 개발자 |
| Phase 0.1.2 - 회원가입 흐름 | P1 | ✅ 완료 | 100% | 기획자/개발자 |
| Phase 0.1.3 - 로그인 흐름 | P1 | ⚠️ 부분 완료 | 50% | 개발자 |
| Phase 0.1.4 - 상태값/기본 모델 | P1 | ✅ 완료 | 100% | 개발자 |
| Phase 0.1.5 - 네비게이션/라우팅 | P1 | ⚠️ 부분 완료 | 60% | 디자이너/개발자 |

---

## 목표

- 서비스 전반의 **역할 체계/상태값/핵심 데이터 모델**을 요구사항에 맞게 구현
- 로그인/회원가입 흐름을 요구사항 §2에 맞게 정렬

---

## Phase 0.1.1 - 역할/권한 체계 재정의

**우선순위**: P1  
**상태**: ✅ **완료** (2025-01-20)  
**담당**: 개발자

### 요구사항 매핑

| 요구사항                | 구현                                                    | 상태    |
| ----------------------- | ------------------------------------------------------- | ------- |
| §2.1 프론트 사용자 역할 | `INDIVIDUAL` / `SCHOOL` / `INSTRUCTOR`                  | ✅ 완료 |
| §2.2 관리자 권한 정의   | `MASTER` / `ADMIN` / `GENERAL`                          | ✅ 완료 |
| §백오피스 관리자 역할   | `OWNER(담당자)` / `PARTNER(파트너)` / `ASSISTANT(보조)` | ✅ 완료 |

### 구현 항목

#### ✅ 완료된 작업

#### 1) 타입 정의 (`src/types/user.ts`)

```typescript
// 프론트 사용자 역할 (§2.1)
export type UserRole = 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN'

// 관리자 권한 레벨 (§2.2)
export type AdminLevel = 'MASTER' | 'ADMIN' | 'GENERAL'

// 프로그램 단위 역할 (§백오피스 권한 구조)
export type ProgramRole = 'OWNER' | 'PARTNER' | 'ASSISTANT' | null

// 사용자 인터페이스
export interface User {
  id: string

#### Marker lines (excerpt)
```
- `useProgramRole(programId)` : 특정 프로그램에 대한 역할 체크
### 수용 기준
### 수용 기준
### 수용 기준
  programId: string
### 수용 기준
### 수용 기준
```

---

### Source: `apps/cms/docs/requirements-specification/MVP/v0.2-front-core.md`

# MVP v0.2 - Front Core (프론트 사용자 핵심 흐름)

> 요구사항 참조: §3 핵심 프로세스, FR-C01~C04, FR-D01, FR-E01~E03  
> **최종 업데이트**: 2026-01-22  
> **전체 진행률**: 약 100% (완료)

---

## 📊 진행 상황 요약

| Phase                             | 우선순위 | 상태    | 진행률 | 담당 역할              |
| --------------------------------- | -------- | ------- | ------ | ---------------------- |
| Phase 0.2.1 - 프로그램 탐색/상세  | P1       | ✅ 완료 | 100%   | 기획자/디자이너/개발자 |
| Phase 0.2.2 - 신청서 작성         | P1       | ✅ 완료 | 100%   | 기획자/개발자          |
| Phase 0.2.3 - 신청 완료/결과 안내 | P1       | ✅ 완료 | 100%   | 기획자/디자이너        |
| Phase 0.2.4 - 진행상황 조회       | P2       | ✅ 완료 | 100%   | 디자이너/개발자        |
| Phase 0.2.5 - 강사 마이페이지     | P1       | ✅ 완료 | 100%   | 디자이너/개발자        |
| Phase 0.2.6 - 강사 캘린더/일정    | P1       | ✅ 완료 | 100%   | 디자이너/개발자        |
| Phase 0.2.7 - 강의보고서 제출     | P1       | ✅ 완료 | 100%   | 개발자                 |

---

## 목표

- 사용자(개인/학교/강사)가 **프로그램 탐색 → 신청 → 진행상태 조회**까지 완료
- 강사의 **마이페이지/일정/보고서** 기본 흐름 제공

---

## Phase 0.2.1 - 프로그램 탐색/상세 (FR-C01, FR-C02)

**우선순위**: P1  
**상태**: ✅ **완료** (100%)  
**담당**: 기획자/디자이너/개발자

### 요구사항 매핑

| ID     | 요구사항                                     | 우선순위 | 상태                 |
| ------ | -------------------------------------------- | -------- | -------------------- |
| FR-C01 | "신청 참여" 페이지: 리스트 + 상세 + 신청 CTA | P1       | ✅ 완료 (2026-01-22) |
| FR-C02 | 프로그램 상세 정보 구성                      | P2       | ✅ 완료 (2026-01-22) |

### ✅ 완료된 작업

- ✅ 프로그램 목록 페이지 존재
- ✅ 프로그램 상세 Drawer 존재
- ✅ 신청 CTA 제공
- ✅ 프로그램 상세 정보 표시 (2025-01-19 개선 완료)
- ✅ 포스터/키비주얼 이미지 노출 (2026-01-22)

### ✅ 완료된 작업 (추가, 2026-01-22)

- ✅ 비로그인 사용자 로그인/회원가입 유도 안내 추가
- ✅ 프로그램 목록에서 비로그인 사용자 클릭 시 로그인 페이지로 리다이렉트
- ✅ 로그인 후 프로그램 상세 자동 열기 (redirect 파라미터 활용)

### ⚠️ 프론트엔드 범위 외 (백엔드 필요)

- ⚠️ 실제 신청 프로세스 (Mock 데이터 기반, 백엔드 API 연동 필요)


#### Marker lines (excerpt)
```
    navigate(`/auth/login?redirect=/programs/${programId}/apply`)
  navigate(`/programs/${programId}/apply`)
### 수용 기준
- `useApplicationForm(programId)` : 신청서 폼 관리
### 수용 기준
### 수용 기준
### 수용 기준
### 수용 기준
### 수용 기준
### 수용 기준
- ✅ `src/pages/reports/report-form-page.tsx` - 작성 폼 (scheduleId/activityId/programId 연동)
```

---

### Source: `apps/cms/docs/requirements-specification/MVP/v0.3-admin-ops.md`

# MVP v0.3 - Admin Ops (관리자 운영 기능)

> 요구사항 참조: §F 백오피스 승인/매칭, §백오피스 권한 구조, FR-F00~F03  
> **최종 업데이트**: 2026-01-22  
> **전체 진행률**: 약 100% (완료)

---

## 📊 진행 상황 요약

| Phase                             | 우선순위 | 상태    | 진행률 | 담당 역할       |
| --------------------------------- | -------- | ------- | ------ | --------------- |
| Phase 0.3.1 - 회원 조회/관리      | P1       | ✅ 완료 | 100%   | 개발자          |
| Phase 0.3.2 - 교육 신청 승인/반려 | P1       | ✅ 완료 | 100%   | 기획자/개발자   |
| Phase 0.3.3 - 강의 신청 관리      | P1       | ✅ 완료 | 100%   | 개발자          |
| Phase 0.3.4 - 매칭 관리           | P1       | ✅ 완료 | 100%   | 개발자          |
| Phase 0.3.5 - 관리자 홈 대시보드  | P2       | ✅ 완료 | 100%   | 디자이너/개발자 |
| Phase 0.3.6 - 상태 운영 관리      | P1       | ✅ 완료 | 100%   | 개발자          |

---

## 목표

- 관리자가 **신청 승인/반려 → 강사 매칭 → 상태 관리**의 운영 흐름 수행
- 프로그램 단위 권한(담당자/파트너/보조) 기반 기능 제한

---

## Phase 0.3.1 - 회원 조회/관리 (FR-F00)

**우선순위**: P1  
**상태**: ✅ **완료** (100%)  
**담당**: 개발자

### 요구사항 매핑

| ID     | 요구사항                          | 우선순위 | 상태                 |
| ------ | --------------------------------- | -------- | -------------------- |
| FR-F00 | 참여자 조회/다운로드 (프로그램별) | P1       | ✅ 완료 (2026-01-22) |
| FR-F00 | 강사 조회/다운로드 (필라별)       | P1       | ✅ 완료 (2026-01-22) |
| FR-F00 | 권한별 다운로드 범위 설정         | P1       | ✅ 완료 (2026-01-22) |
| FR-F00 | 조회/다운로드 이력 기록           | P1       | ✅ 완료 (2026-01-22) |

### ✅ 완료된 작업

- ✅ 참여자 목록 페이지 존재
- ✅ 강사 목록 페이지 존재
- ✅ 다운로드 로그 타입 정의 존재

### ✅ 완료된 작업 (2026-01-22)

- ✅ 실제 다운로드 기능 구현 (ExcelJS, 2026-01-22)
- ✅ 권한별 다운로드 범위 제한 구현 (`canDownloadParticipants`, `canDownloadInstructors`, 2026-01-22)
- ✅ 다운로드 이력 기록 구현 (`logDownload`, 2026-01-22)

### ✅ 완료된 작업 (최종, 2026-01-22)

- ✅ 모든 요구사항 구현 완료 (참여자/강사 조회, 다운로드, 권한 체크, 이력 기록)

### 구현 항목

#### Marker lines (excerpt)
```
  programId?: string // 프로그램 필터
const canDownload = (user: User, programId: string) => {
  const programRole = user.programRoles?.[programId]
- `useDownloadPermission(programId)` : 다운로드 권한 체크
### 수용 기준
### 수용 기준
  programId: string
- `useInstructorApplications(programId)` : 강사 신청 목록
### 수용 기준
### 수용 기준
  link?: string // 클릭 시 이동 경로
### 수용 기준
### 수용 기준
```

---

### Source: `apps/cms/docs/requirements-specification/MVP/v0.4-settlement-report.md`

# MVP v0.4 - Settlement & Report (정산/지급/실적)

> 요구사항 참조: §G 정산/지급, §별첨2 강사료 산식, FR-G01, FR-G03  
> **최종 업데이트**: 2026-01-22  
> **전체 진행률**: 약 100% (완료)

---

## 📊 진행 상황 요약

| Phase                             | 우선순위 | 상태    | 진행률 | 담당 역할 |
| --------------------------------- | -------- | ------- | ------ | --------- |
| Phase 0.4.1 - 강사 정산 신청      | P1       | ✅ 완료 | 100%   | 개발자    |
| Phase 0.4.2 - 관리자 정산 검토    | P1       | ✅ 완료 | 100%   | 개발자    |
| Phase 0.4.3 - 지급조서/이체리스트 | P1       | ✅ 완료 | 100%   | 개발자    |
| Phase 0.4.4 - 실적/통계           | P2       | ✅ 완료 | 100%   | 개발자    |

---

## 목표

- 강사비/교통비 **요구사항 산식 그대로** 자동 산출
- 지급조서/이체리스트 출력 및 다운로드

---

## 정산 산식 정의 (§별첨2 기준)

### 강사비 지급기준

```typescript
// §별첨2: 강사비 지급기준
// 기준: 편도 100km = 파주시청 ↔ 용인시청

export const INSTRUCTOR_FEE_TABLE = {
  // 차시별 기본/장거리 강사료
  1: { base: 120000, longDistance: 140000 },
  2: { base: 170000, longDistance: 190000 },
  3: { base: 220000, longDistance: 240000 },
  4: { base: 270000, longDistance: 290000 },
  5: { base: 320000, longDistance: 340000 },
  6: { base: 370000, longDistance: 390000 },
} as const

// 장거리 기준: 편도 100km 이상
export const LONG_DISTANCE_THRESHOLD_KM = 100
```

### 교통비 지급기준

```typescript
// §별첨2: 교통비 지급 기준
export const TRANSPORT_FEE_POLICY = {
  // 1) 자택 ↔ 학교 간 주유비, 통행비 산출
  // 2) 통행료는 강사가 직접 숫자 기입 + 증빙자료 업로드
  // 3) 자택과 학교 간 거리 60km 이하인 경우 교통비 미지급

  minimumDistanceForTransport: 60, // km (이하 미지급)
  requiresReceipt: true, // 증빙자료 필수
}

#### Marker lines (excerpt)
```
### 수용 기준
### 수용 기준
  programId: string
const canDownloadPaymentStatement = (user: User, programId: string): boolean => {
  return user.programRoles?.[programId] === 'OWNER'
### 수용 기준
  programId: string
- `usePerformanceStats(programId)` : 실적 통계 조회
### 수용 기준
```

---

### Source: `apps/cms/docs/requirements-specification/MVP/v0.5-security-compliance.md`

# MVP v0.5 - Security & Compliance (보안/개인정보)

> 요구사항 참조: §7 비기능 요구사항(NFR), §별첨1 보안/개인정보/준법 요구사항  
> **최종 업데이트**: 2026-01-22  
> **전체 진행률**: 약 98% (부분 완료)

---

## 📊 진행 상황 요약

| Phase                           | 우선순위 | 상태    | 진행률 | 담당 역할     |
| ------------------------------- | -------- | ------- | ------ | ------------- |
| Phase 0.5.1 - MFA/OTP UX        | P1       | ✅ 완료 | 100%   | 개발자        |
| Phase 0.5.2 - 권한 요청 UX      | P1       | ✅ 완료 | 100%   | 기획자/개발자 |
| Phase 0.5.3 - 다운로드 보호 UX  | P1       | ✅ 완료 | 100%   | 개발자        |
| Phase 0.5.4 - 감사 로그 UI      | P1       | ✅ 완료 | 100%   | 개발자        |
| Phase 0.5.5 - 세션/접근 통제 UX | P1       | ✅ 완료 | 100%   | 개발자        |

---

## 목표

- ISMS-P 수준의 보안 통제를 **프론트엔드 범위**에서 구현
- 백오피스 MFA, 권한 체크, 다운로드 보호 UX 제공

> **Note**: 실제 보안 구현은 백엔드 연동이 필수이나, 프론트엔드에서는 UX 흐름과 Mock 구현을 제공합니다.

---

## Phase 0.5.1 - MFA/OTP UX (NFR-SEC-AUT-01)

**우선순위**: P1  
**상태**: ✅ **완료** (100%)  
**담당**: 개발자

### 요구사항 매핑

| ID             | 요구사항                                | 우선순위 | 상태                 |
| -------------- | --------------------------------------- | -------- | -------------------- |
| NFR-SEC-AUT-01 | 백오피스 MFA 필수 (SMS OTP 기본)        | P1       | ✅ 완료 (2026-01-22) |
| NFR-SEC-AUT-01 | OTP 유효시간/재전송 제한/실패 횟수 제한 | P1       | ✅ 완료 (2026-01-22) |
| NFR-SEC-AUT-01 | MFA 미완료 시 세션 발급 불가            | P1       | ✅ 완료 (2026-01-22) |

### ✅ 완료된 작업 (2026-01-22)

- ✅ MFA 인증 시스템 구현 (OTP 발송/검증)
- ✅ OTP 입력 화면 (`/auth/mfa`, `MfaVerificationModal`)
- ✅ OTP 정책 적용 (유효시간 3분, 재전송 쿨다운 60초, 일일 발송 제한 5회, 실패 5회 시 30분 잠금)
- ✅ MFA 미완료 시 세션 발급 차단 (auth-store에서 token: null, isAuthenticated: false)
- ✅ 일일 발송 제한 로직 구현

### 구현 항목

#### 1) OTP 입력 화면 (`/auth/mfa`)

```typescript
// NFR-SEC-AUT-01: OTP 입력 UI
const MfaVerification = () => {
  const [otpCode, setOtpCode] = useState('')
  const [countdown, setCountdown] = useState(180) // 3분

#### Marker lines (excerpt)
```
- ✅ `src/features/auth/model/auth-store.ts` — MFA 미완료 시 세션 발급 차단
### 수용 기준
- [x] MFA 미완료 시 대시보드 접근 차단 (2026-01-22)
| NFR-SEC-ACC-01        | 프로그램 단위 ACL 범위 외 접근 금지      | P1       | ✅ 완료 (2026-01-22) |
const PermissionRequestButton = ({ programId, action }: Props) => {
  programId: string
  programId: string
- `useCanAccess(programId, action)` : 접근 권한 체크
### 수용 기준
  programId: string
### 수용 기준
- ✅ `src/app/router/index.tsx` — 라우터에 `/admin/logs/audit` 경로 추가
### 수용 기준
### 수용 기준
```

---

### Source: `apps/cms/docs/roadmap/MVP_ROADMAP_V4_DETAILED.md`

# JAKorea CMS MVP 개발 로드맵 V4 - 상세 Phase

> **참고**: 이 문서는 `MVP_ROADMAP_V4.md`의 Phase 4-7에 대한 상세 작업 계획입니다.  
> **작성 일자**: 2024-12-19  
> **작성자**: 시니어 PM + 기획자 협업
>
> **현행 UI 기준 (2026-07-15)**: Legacy UI 삭제가 완료되었습니다. 버튼은 `CmsButton`/`LoadingButton`, 상태는 Current domain badges, 강사 정산은 `InstructorPaymentStatusBadge`, 권한 승인·반려는 `PermissionModal`, 편집 상태 셀은 `StatusDropdownCell` generic style/default를 사용합니다.

## 📋 문서 구조

각 Phase별로 다음 구조로 상세 작업 계획을 작성합니다:

- **기획 요구사항**: 비즈니스 로직 및 기능 명세
- **디자인 요구사항**: UI/UX 설계 요구사항
- **개발 작업**: 구체적인 구현 작업 항목
- **산출물**: 완료 후 생성되는 결과물
- **일정**: 예상 소요 기간

---

## 🆕 Phase 4: 권한 관리 시스템 구축 (신규 추가)

### 4.1 인증 및 권한 관리 인프라 🆕

**예상 기간**: 2-3주  
**우선순위**: 🔴 최우선

---

#### 4.1.1 사용자 인증 시스템

**기획 요구사항:**

- 로그인/로그아웃 기능
  - 이메일/비밀번호 기반 인증
  - Mock 데이터 기반 검증 (현재 단계)
  - 로그인 상태 유지 (세션 관리)
- JWT 기반 토큰 관리 (Mock 단계)
  - 토큰 생성 및 저장
  - 토큰 만료 처리
  - 토큰 갱신 로직 (향후)
- 세션 관리
  - 자동 로그아웃 (일정 시간 미사용 시)
  - 세션 만료 알림
  - 로그아웃 시 토큰 삭제
- 비밀번호 재설정 기능 (향후)
  - 비밀번호 재설정 요청
  - 이메일 인증 (향후)
  - 비밀번호 변경

**디자인 요구사항:**

- 로그인 페이지 디자인
  - Ant Design Form 컴포넌트 활용
  - 이메일/비밀번호 입력 필드
  - 로그인 버튼
  - 에러 메시지 표시 영역
  - 로딩 상태 표시
- 세션 만료 알림 모달
  - 세션 만료 경고 메시지

#### Marker lines (excerpt)
```
- 권한별 네비게이션 경로 제한
  - 권한 없는 경로 숨김
  - 취소/변경 가능 시점, 담당자 연락/요청 경로를 명확히 노출
  - 미완료한 만족도 조사 목록
  - 완료/미완료 필터
  - 완료/미완료 필터
  - 정산 관련 정보 노출 금지
  - 보고서 관련 정보 노출 금지
```

---
