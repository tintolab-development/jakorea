# 로딩 UI/UX 디자인 가이드

## 📋 개요

화면 이동 및 데이터 로딩 시 사용자 경험을 개선하기 위한 로딩 UI 설계 문서입니다.
현재 "로딩 중..." 텍스트를 M3 디자인 언어에 맞는 스켈레톤 UI와 스피너로 대체합니다.

---

## 🎨 디자인 원칙

1. **M3 디자인 언어 준수**: Material Design 3의 시각적 언어와 일관성 유지
2. **UI Shifting 최소화**: 실제 콘텐츠와 유사한 레이아웃으로 레이아웃 시프트 방지
3. **의미 있는 피드백**: 사용자에게 명확한 로딩 상태 제공
4. **성능 고려**: 가벼운 애니메이션과 최적화된 렌더링

---

## 📱 화면 타입별 로딩 UI 설계

### 1. **List 페이지 (목록 페이지)**

**현재 상태**: ✅ `TableSkeleton` 사용 중 (일부만)

**대상 페이지**:
- InstructorsList ✅
- ProgramsList ✅
- ApplicationsList ✅
- MatchingsList ✅
- SettlementsList ✅
- SponsorsList (Card Grid) ❌
- SchoolsList (Card List) ❌

**설계 방안**:
- **테이블 레이아웃**: 기존 `TableSkeleton` 유지
- **카드 그리드 레이아웃**: `CardGridSkeleton` 신규 생성
  - 카드 개수: 6-8개
  - 카드 내부: 제목(긴 텍스트), 설명(2줄), 하단 버튼 영역 스켈레톤
- **리스트 레이아웃**: `ListSkeleton` 신규 생성
  - 리스트 아이템 8개
  - 각 아이템: 아이콘/이미지 영역, 제목, 설명, 메타 정보 영역

---

### 2. **Detail 페이지 (상세 페이지)**

**현재 상태**: ❌ "로딩 중..." 텍스트만 표시

**대상 페이지**:
- InstructorDetail
- ProgramDetail
- ScheduleDetail
- MatchingDetail
- SettlementDetail
- SponsorDetail
- SchoolDetail
- ApplicationDetail

**설계 방안**: `DetailPageSkeleton` 컴포넌트 생성

**공통 구조**:
```
┌─────────────────────────────────┐
│ [← 목록] 버튼 스켈레톤          │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 제목 스켈레톤 (긴 텍스트)    │ │
│ │ 상태 칩 스켈레톤             │ │
│ │                             │ │
│ │ [수정] [삭제] 버튼 스켈레톤 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 섹션 제목 스켈레톤           │ │
│ │                             │ │
│ │ ┌─────────┐ ┌─────────┐    │ │
│ │ │라벨 텍스트│ │값 텍스트 │    │ │
│ │ └─────────┘ └─────────┘    │ │
│ │ (반복 4-6개)                │ │
│ └─────────────────────────────┘ │
│                                 │
│ (추가 섹션 카드들...)           │
└─────────────────────────────────┘
```

**컴포넌트 Props**:
- `sections`: 섹션 개수 (기본값: 2-3개)
- `fieldsPerSection`: 섹션당 필드 개수 (기본값: 4-6개)

---

### 3. **Form 페이지 (폼 페이지)**

**현재 상태**: 버튼에만 "저장 중..." 텍스트, 폼 필드는 그대로

**대상 페이지**:
- InstructorForm
- ProgramForm
- ScheduleForm
- MatchingForm
- SettlementSubmissionForm
- SponsorForm
- SchoolForm

**설계 방안**: 
- **초기 로딩 (Edit 모드)**: `FormSkeleton` 컴포넌트
  - 폼 전체를 스켈레톤으로 표시
  - 실제 폼 레이아웃과 동일한 구조
- **제출 중**: 버튼 비활성화 + 스피너 표시
  - 기존 텍스트 유지하되, 버튼 내부에 작은 스피너 추가

**Form Skeleton 구조**:
```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ 섹션 제목 스켈레톤           │ │
│ │                             │ │
│ │ [라벨 스켈레톤]              │ │
│ │ [입력 필드 스켈레톤]         │ │
│ │                             │ │
│ │ (필드 반복 4-6개)           │ │
│ └─────────────────────────────┘ │
│                                 │
│ (추가 섹션들...)                │
│                                 │
│ [취소] [저장] 버튼 스켈레톤    │
└─────────────────────────────────┘
```

---

### 4. **Calendar 페이지 (캘린더 페이지)**

**현재 상태**: ❌ "로딩 중..." 텍스트

**대상 페이지**:
- SchedulesCalendar

**설계 방안**: `CalendarSkeleton` 컴포넌트

**구조**:
```
┌─────────────────────────────────┐
│ [필터 영역 스켈레톤]            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [이전] [월/년] [다음]       │ │
│ │        스켈레톤              │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 일 월 화 수 목 금 토         │ │
│ │ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐│ │
│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ││ │
│ │ │┌┐│ │┌┐│ │ │ │ │ │ │ │ │ ││ │
│ │ │└┘│ │└┘│ │ │ │ │ │ │ │ │ ││ │
│ │ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘│ │
│ │ (5-6주 반복)                 │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

- 날짜 셀: 작은 사각형 스켈레톤
- 일정 카드: 각 날짜별로 1-2개의 작은 카드 스켈레톤

---

### 5. **Dashboard 페이지 (대시보드)**

**현재 상태**: 로딩 상태 처리 없음

**대상 페이지**:
- Dashboard

**설계 방안**: `DashboardSkeleton` 컴포넌트

**구조**:
```
┌─────────────────────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │숫자  │ │숫자  │ │숫자  │     │
│ │라벨  │ │라벨  │ │라벨  │     │
│ └──────┘ └──────┘ └──────┘     │
│ (통계 카드 4-6개 그리드)        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 섹션 제목 스켈레톤           │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ 리스트 아이템 스켈레톤   │ │ │
│ │ │ (5-6개 반복)            │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
│                                 │
│ (추가 섹션들...)                │
└─────────────────────────────────┘
```

- 통계 카드: 숫자 영역(큰 텍스트) + 라벨(작은 텍스트)
- 리스트: 아이템당 2-3줄 텍스트 스켈레톤

---

### 6. **Button Loading State (버튼 로딩 상태)**

**현재 상태**: "저장 중...", "제출 중..." 텍스트만

**대상**: 모든 Form 페이지의 Submit 버튼

**설계 방안**: `MdButton`에 `loading` prop 추가
- 버튼 내부에 작은 원형 스피너 표시
- 텍스트는 유지하되 스피너와 함께 표시
- 버튼 비활성화 상태 유지

**시각적 표현**:
```
[ 🔄 저장 중... ] (비활성화)
```

---

## 🧩 컴포넌트 구조

### 신규 컴포넌트 목록

1. **`CardGridSkeleton.tsx`**
   - Props: `cards?: number` (기본값: 6)
   - 카드 그리드 레이아웃용

2. **`ListSkeleton.tsx`**
   - Props: `items?: number` (기본값: 8)
   - 리스트 레이아웃용

3. **`DetailPageSkeleton.tsx`**
   - Props: `sections?: number`, `fieldsPerSection?: number`
   - 상세 페이지용

4. **`FormSkeleton.tsx`**
   - Props: `sections?: number`, `fieldsPerSection?: number`
   - 폼 페이지용 (Edit 모드 초기 로딩)

5. **`CalendarSkeleton.tsx`**
   - Props: 없음 (고정 레이아웃)
   - 캘린더 페이지용

6. **`DashboardSkeleton.tsx`**
   - Props: `stats?: number`, `activities?: number`
   - 대시보드 페이지용

7. **`MdSpinner.tsx`** (스피너 컴포넌트)
   - Props: `size?: 'small' | 'medium' | 'large'`
   - 버튼 내부 및 독립적 사용 가능

---

## 🎯 구현 우선순위

### Phase 1: 핵심 컴포넌트 (최우선)
1. ✅ `MdSkeleton` (기존)
2. ✅ `TableSkeleton` (기존)
3. 🆕 `MdSpinner` (버튼 로딩용)
4. 🆕 `DetailPageSkeleton` (가장 많이 사용)

### Phase 2: 리스트 페이지 보완
5. 🆕 `CardGridSkeleton` (SponsorsList, SchoolsList용)
6. 🆕 `ListSkeleton` (SchoolsList용)

### Phase 3: 특수 페이지
7. 🆕 `FormSkeleton` (Edit 모드 초기 로딩)
8. 🆕 `CalendarSkeleton`
9. 🆕 `DashboardSkeleton`

---

## 🎨 시각적 스타일

### 스켈레톤 스타일
- **색상**: `var(--md-sys-color-surface-container-highest, #e6e1e5)`
- **애니메이션**: Shimmer 효과 (좌→우 그라데이션)
- **Border Radius**: 텍스트 4px, 카드/버튼 8px, 원형 50%

### 스피너 스타일
- **색상**: `var(--md-sys-color-primary, #6750a4)`
- **애니메이션**: 회전 애니메이션
- **크기**: small (16px), medium (24px), large (32px)

---

## 📝 적용 가이드

### Detail 페이지 적용 예시
```tsx
if (isLoading) {
  return <DetailPageSkeleton sections={3} fieldsPerSection={4} />
}
```

### Form 페이지 적용 예시
```tsx
// Edit 모드 초기 로딩
if (isLoading && !formData) {
  return <FormSkeleton sections={2} fieldsPerSection={5} />
}

// 제출 중
<MdButton variant="filled" type="submit" loading={isLoading}>
  {isEdit ? '수정' : '등록'}
</MdButton>
```

### List 페이지 적용 예시
```tsx
{isLoading ? (
  <CardGridSkeleton cards={8} />
) : (
  <div className="card-grid">
    {/* 실제 카드들 */}
  </div>
)}
```

---

## ✅ 체크리스트

### 구현 전
- [ ] 각 컴포넌트의 Props 인터페이스 정의
- [ ] M3 디자인 토큰 확인 및 적용
- [ ] 애니메이션 성능 최적화 확인

### 구현 후
- [ ] 모든 페이지에 적용 확인
- [ ] 반응형 레이아웃 확인
- [ ] 접근성 (aria-label 등) 확인
- [ ] 브라우저 호환성 테스트

---

## 📚 참고 자료

- Material Design 3: [Skeleton screens](https://m3.material.io/components/progress-indicators)
- Material Design 3: [Loading states](https://m3.material.io/foundations/interaction/states/loading-states)
- 기존 구현: `apps/lms/src/components/m3/MdSkeleton.tsx`
- 기존 구현: `apps/lms/src/components/m3/TableSkeleton.tsx`

