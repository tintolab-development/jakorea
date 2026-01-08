# 홈 화면 구현 가이드

**작성 일자**: 2025-01-XX  
**목적**: IA 구조에 맞춘 홈 화면 구현  
**대상**: 관리자(ADMIN) 권한

---

## 📋 기존 기능 활용 가능 여부

### ✅ 활용 가능한 기능

#### 1. 검색 기능 (GlobalSearch)
- **위치**: `apps/cms/src/features/dashboard/ui/global-search.tsx`
- **현재 상태**: 강사/봉사자용으로 구현됨 (`instructorId` 필요)
- **활용 방법**:
  - 관리자용으로 확장 필요
  - `instructorId` 없이도 동작하도록 수정
  - 관리자는 모든 프로그램, 일정, 회원 등을 검색할 수 있도록 확장
- **필요한 수정**:
  - [ ] `search-service.ts`에 관리자용 검색 API 추가
  - [ ] `GlobalSearch` 컴포넌트에 관리자 권한 체크 로직 추가
  - [ ] 관리자용 검색 결과 타입 확장 (프로그램, 일정, 회원, 강사 등)

#### 2. 알림 리스트 (NotificationList)
- **위치**: `apps/cms/src/features/dashboard/ui/notification-list.tsx`
- **현재 상태**: 강사/봉사자용으로 구현됨 (`userId` 필요)
- **활용 방법**:
  - 관리자용으로도 동일하게 사용 가능
  - `userId` 기반으로 알림 조회하므로 관리자도 동일하게 동작
- **필요한 수정**:
  - [ ] 관리자용 알림 타입 추가 (시스템 알림, 승인 요청 등)
  - [ ] 알림 서비스에 관리자용 알림 조회 로직 추가 (선택사항)

#### 3. 전체 강의 진행 현황 (MyActivitySummary 참고)
- **위치**: `apps/cms/src/features/dashboard/ui/my-activity-summary.tsx`
- **현재 상태**: 강사/봉사자 본인 활동 요약용
- **활용 방법**:
  - 컴포넌트 구조와 UI를 참고하여 관리자용 "전체 강의 진행 현황" 컴포넌트 생성
  - 상태별 통계 로직은 `instructor-activity-service.ts` 참고
- **필요한 수정**:
  - [ ] 관리자용 전체 강의 진행 현황 API 생성
  - [ ] 상태별 통계 컴포넌트 생성 (신청 완료, 진행 예정, 진행 중, 진행 완료)
  - [ ] `MyActivitySummary`를 참고하여 `OverallProgramProgressCard` 컴포넌트 생성

---

## 🆕 새로 구현해야 할 기능

### 1. 배너 관리 기능
- **현재 상태**: 없음 (신규 구현 필요)
- **필요한 작업**:
  - [ ] 배너 엔티티 타입 정의 (`Banner` interface)
  - [ ] 배너 API 서비스 생성 (`banner-service.ts`)
  - [ ] 배너 관리 페이지 생성 (`/templates/banners` 또는 별도 경로)
  - [ ] 배너 CRUD 기능 구현
  - [ ] 홈 화면에 배너 표시 컴포넌트 생성 (`BannerCarousel` 또는 `BannerList`)
  - [ ] 배너 표시 설정 (활성화/비활성화, 순서, 기간 등)

---

## 📝 구현 계획

### Phase 1: 기존 기능 확장

#### 1.1 검색 기능 확장
```typescript
// apps/cms/src/features/dashboard/api/search-service.ts
// 관리자용 검색 API 추가
export async function searchAdminContent(query: string): Promise<SearchResult[]>
```

**검색 대상**:
- 프로그램
- 일정
- 회원 (사용자)
- 강사
- 학교
- 신청

#### 1.2 알림 리스트 확장
- 관리자용 알림 타입 추가
- 시스템 알림, 승인 요청 알림 등

#### 1.3 전체 강의 진행 현황 컴포넌트 생성
```typescript
// apps/cms/src/features/dashboard/ui/overall-program-progress-card.tsx
// 관리자용 전체 강의 진행 현황 카드
```

**표시할 통계**:
- 신청 완료: `applicationCompleted` (Application status가 'approved'인 프로그램)
- 진행 예정: `scheduled` (시작일이 미래인 프로그램)
- 진행 중: `inProgress` (현재 진행 중인 프로그램)
- 진행 완료: `completed` (종료된 프로그램)

### Phase 2: 배너 관리 기능 구현

#### 2.1 배너 엔티티 및 타입 정의
```typescript
// apps/cms/src/types/domain.ts
export interface Banner {
  id: UUID
  title: string
  imageUrl: string
  linkUrl?: string
  isActive: boolean
  displayOrder: number
  startDate?: DateValue
  endDate?: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}
```

#### 2.2 배너 API 서비스
```typescript
// apps/cms/src/entities/banner/api/banner-service.ts
export const bannerService = {
  getBanners: () => Promise<Banner[]>
  createBanner: (data: CreateBannerDto) => Promise<Banner>
  updateBanner: (id: UUID, data: UpdateBannerDto) => Promise<Banner>
  deleteBanner: (id: UUID) => Promise<void>
}
```

#### 2.3 배너 관리 페이지
- 템플릿 관리 하위에 배너 관리 추가
- 또는 별도 경로 `/banners`

#### 2.4 홈 화면 배너 표시
```typescript
// apps/cms/src/features/dashboard/ui/banner-carousel.tsx
// 또는
// apps/cms/src/features/dashboard/ui/banner-list.tsx
```

---

## 🔧 구체적인 구현 작업

### 작업 1: 검색 기능 확장

**파일**: `apps/cms/src/features/dashboard/api/search-service.ts`
- [ ] `searchAdminContent` 함수 추가
- [ ] 관리자용 검색 결과 타입 정의

**파일**: `apps/cms/src/features/dashboard/ui/global-search.tsx`
- [ ] 관리자 권한 체크 로직 추가
- [ ] 관리자일 경우 `searchAdminContent` 사용
- [ ] 검색 결과 타입 확장 (회원, 강사, 학교 등)

### 작업 2: 전체 강의 진행 현황 컴포넌트 생성

**파일**: `apps/cms/src/features/dashboard/api/statistics-service.ts`
- [ ] `getOverallProgramProgress` 함수 추가
  ```typescript
  export interface OverallProgramProgress {
    applicationCompleted: number // 신청 완료
    scheduled: number // 진행 예정
    inProgress: number // 진행 중
    completed: number // 진행 완료
  }
  ```

**파일**: `apps/cms/src/features/dashboard/ui/overall-program-progress-card.tsx` (신규)
- [ ] `MyActivitySummary` 참고하여 컴포넌트 생성
- [ ] 4개 상태별 통계 표시 (신청 완료, 진행 예정, 진행 중, 진행 완료)
- [ ] 각 통계 클릭 시 해당 상태의 프로그램 목록으로 이동

### 작업 3: 배너 관리 기능 구현

**파일**: `apps/cms/src/types/domain.ts`
- [ ] `Banner` interface 추가

**파일**: `apps/cms/src/entities/banner/` (신규 디렉토리)
- [ ] `api/banner-service.ts` - 배너 API 서비스
- [ ] `model/banner-store.ts` - 배너 Zustand 스토어 (선택사항)

**파일**: `apps/cms/src/features/banner/` (신규 디렉토리)
- [ ] `ui/banner-list.tsx` - 배너 목록 컴포넌트
- [ ] `ui/banner-form.tsx` - 배너 등록/수정 폼
- [ ] `ui/banner-carousel.tsx` - 홈 화면 배너 캐러셀

**파일**: `apps/cms/src/pages/banners/` 또는 `apps/cms/src/pages/templates/banners/`
- [ ] `banner-list-page.tsx` - 배너 관리 페이지

**라우터**: `apps/cms/src/app/router/index.tsx`
- [ ] 배너 관리 경로 추가

**메뉴**: `apps/cms/src/shared/config/menu-config.tsx`
- [ ] 템플릿 관리 하위에 배너 관리 추가 (또는 별도 메뉴)

### 작업 4: 홈 화면 레이아웃 재구성

**파일**: `apps/cms/src/pages/dashboard.tsx`
- [ ] 검색 및 알림을 관리자에게도 표시
- [ ] 전체 강의 진행 현황 카드 추가
- [ ] 배너 컴포넌트 추가 (상단 또는 적절한 위치)
- [ ] 기존 통계 카드들과 함께 배치

---

## 📊 데이터 구조

### 전체 강의 진행 현황 데이터 구조
```typescript
interface OverallProgramProgress {
  applicationCompleted: number // Application status가 'approved'이고 프로그램이 아직 시작하지 않은 경우
  scheduled: number // lifecycleStatus가 'matching_completed_waiting'이거나 시작일이 미래인 경우
  inProgress: number // lifecycleStatus가 'in_progress'이거나 현재 날짜가 시작일과 종료일 사이인 경우
  completed: number // lifecycleStatus가 'completed'이거나 종료일이 지난 경우
}
```

### 배너 데이터 구조
```typescript
interface Banner {
  id: UUID
  title: string
  imageUrl: string
  linkUrl?: string // 클릭 시 이동할 URL
  isActive: boolean
  displayOrder: number // 표시 순서
  startDate?: DateValue // 표시 시작일
  endDate?: DateValue // 표시 종료일
  createdAt: DateValue
  updatedAt: DateValue
}
```

---

## 🎯 우선순위

### 높음 (즉시 구현)
1. ✅ 검색 기능 확장 (관리자용)
2. ✅ 알림 리스트 (이미 동작함, 타입만 확장)
3. ✅ 전체 강의 진행 현황 컴포넌트 생성

### 중간 (다음 단계)
4. 배너 관리 기능 구현
5. 홈 화면 레이아웃 재구성

---

## 📌 참고사항

1. **검색 기능**: 현재 `GlobalSearch`는 강사/봉사자용이지만, 관리자용으로 확장하면 모든 데이터를 검색할 수 있음
2. **알림 기능**: 현재 `NotificationList`는 `userId` 기반이므로 관리자도 동일하게 사용 가능
3. **전체 강의 진행 현황**: `MyActivitySummary`의 구조를 참고하여 관리자용으로 확장
4. **배너 관리**: 템플릿 관리 하위에 포함되거나 별도 메뉴로 구성 가능

---

**마지막 업데이트**: 2025-01-XX
