# 즉시 진행해야 할 사항

**작성 일자**: 2024-12-19  
**기준**: Phase별 점검 결과 (`PHASE_REVIEW.md`) 기반

---

## 🔴 최우선: Phase 4 정산 관리 기본 UI 구현

### 현재 상태
- ✅ 타입 정의 존재 (`types/domain.ts`)
- ✅ Mock 데이터 존재 (`data/mock/settlements.ts`)
- ❌ UI/서비스/스토어 전부 미구현
- ❌ 라우터에 정산 라우트 없음
- ⚠️ 사이드바에 정산 메뉴는 있으나 라우트가 없어 동작 안 함

### 필요 작업 (우선순위 순)

#### 1. 엔티티 레이어 구현 (1-2시간)
- [ ] `entities/settlement/model/schema.ts` 생성
  - Zod 스키마 정의
  - SettlementFormData 타입 정의
- [ ] `entities/settlement/api/settlement-service.ts` 생성
  - CRUD 서비스 함수 (create, read, update, delete)
  - Mock 데이터 기반 구현

#### 2. Features 레이어 구현 (2-3시간)
- [ ] `features/settlement/model/settlement-store.ts` 생성
  - Zustand 스토어
  - 상태 관리 로직
- [ ] `features/settlement/model/use-settlement-table.ts` 생성
  - @tanstack/react-table 훅
  - 쿼리 파라미터 동기화
- [ ] `features/settlement/ui/settlement-list.tsx` 생성
  - 정산 목록 테이블 컴포넌트
  - 필터, 정렬, 페이지네이션
- [ ] `features/settlement/ui/settlement-detail-drawer.tsx` 생성
  - 정산 상세 Drawer
  - 정산 항목 표시
  - 상태 변경 UI
- [ ] `features/settlement/ui/settlement-form.tsx` 생성
  - 정산 등록/수정 폼
  - 정산 항목 추가/삭제 기능

#### 3. Pages 레이어 구현 (1-2시간)
- [ ] `pages/settlements/settlement-list-page.tsx` 생성
  - 정산 목록 페이지
  - Modal을 통한 등록/수정 (일관성 유지)

#### 4. 라우팅 및 메뉴 (0.5시간)
- [ ] 라우터에 정산 라우트 추가
- [ ] 사이드바 메뉴 동작 확인

#### 5. 기본 산출 로직 (2-3시간)
- [ ] 정산 항목 합계 계산
- [ ] 기본 산출 규칙 적용

**예상 총 소요 시간**: 6-10시간 (1-2일)

---

## 🟡 중간 우선순위: Phase 5 대시보드 최근 활동 목록

### 현재 상태
- ✅ 기본 대시보드 페이지 존재
- ✅ 집계 지표 카드 구현됨 (프로그램, 신청, 매칭, 강사 수)
- ❌ 최근 활동 목록 미구현

### 필요 작업

#### 1. 최근 활동 목록 컴포넌트 (1-2시간)
- [ ] `features/dashboard/ui/recent-activities.tsx` 생성
  - 최근 신청 목록 (최근 5개)
  - 최근 매칭 목록 (최근 5개)
  - 최근 일정 목록 (최근 5개)
  - 각 항목 클릭 시 상세 페이지로 이동

#### 2. 대시보드 페이지 업데이트 (0.5시간)
- [ ] 최근 활동 목록 컴포넌트 추가
- [ ] 레이아웃 조정

**예상 총 소요 시간**: 1.5-2.5시간 (0.5-1일)

---

## 🟢 낮은 우선순위: Phase 5 사용자 화면 기반 UI 개선

### 현재 상태
- ✅ 5.2 신청 결과 화면 완료
- ❌ 나머지 화면 미구현

### 필요 작업 (핵심 화면 선별 후)

- [ ] V2 Phase 5 핵심 화면 선별 (1-2일)
- [ ] 선별된 화면 순차적 구현

**예상 총 소요 시간**: 선별 후 결정

---

## 📋 권장 진행 순서

### Step 1: Phase 4 정산 관리 기본 UI 구현 (최우선)

**목표**: 정산 관리 기본 CRUD 기능 완성

**작업 순서:**
1. 엔티티 레이어 구현 (schema, service)
2. Features 레이어 구현 (store, table hook, UI 컴포넌트)
3. Pages 레이어 구현 (list page)
4. 라우팅 및 메뉴 연결
5. 기본 산출 로직 구현

**완료 기준:**
- 정산 목록 페이지에서 정산 목록 조회 가능
- 정산 등록/수정/삭제 가능
- 정산 상세 정보 확인 가능
- 사이드바 메뉴 클릭 시 정산 목록 페이지로 이동

---

### Step 2: Phase 5 대시보드 최근 활동 목록 (중간)

**목표**: 관리자가 최근 활동을 빠르게 파악

**작업 순서:**
1. 최근 활동 목록 컴포넌트 구현
2. 대시보드 페이지에 추가

**완료 기준:**
- 대시보드에서 최근 신청, 매칭, 일정 목록 확인 가능
- 각 항목 클릭 시 상세 페이지로 이동

---

### Step 3: Phase 5 사용자 화면 기반 UI 개선 (낮음)

**목표**: V2 Phase 5 핵심 화면 선별 및 구현

**작업 순서:**
1. 핵심 화면 선별 (1-2일)
2. 선별된 화면 순차적 구현

---

## 🎯 즉시 시작 가능한 작업

### 오늘 바로 시작 가능

1. **Phase 4: 정산 관리 기본 UI 구현**
   - 엔티티 레이어부터 순차적으로 구현
   - 다른 도메인(강사, 스폰서 등)과 동일한 패턴 적용

2. **Phase 5: 대시보드 최근 활동 목록**
   - 간단한 컴포넌트 구현
   - 대시보드에 추가

---

## 📝 체크리스트

### Phase 4 정산 관리

- [ ] `entities/settlement/model/schema.ts` 생성
- [ ] `entities/settlement/api/settlement-service.ts` 생성
- [ ] `features/settlement/model/settlement-store.ts` 생성
- [ ] `features/settlement/model/use-settlement-table.ts` 생성
- [ ] `features/settlement/ui/settlement-list.tsx` 생성
- [ ] `features/settlement/ui/settlement-detail-drawer.tsx` 생성
- [ ] `features/settlement/ui/settlement-form.tsx` 생성
- [ ] `pages/settlements/settlement-list-page.tsx` 생성
- [ ] 라우터에 정산 라우트 추가
- [ ] 기본 산출 로직 구현

### Phase 5 대시보드

- [ ] `features/dashboard/ui/recent-activities.tsx` 생성
- [ ] 대시보드 페이지에 최근 활동 목록 추가

---

## 🔗 관련 문서

- [Phase별 점검 문서](./PHASE_REVIEW.md)
- [다음 진행 사항](./NEXT_STEPS.md)
- [MVP 로드맵 V2](./MVP_ROADMAP_V2.md)
- [MVP 로드맵 V3](./MVP_ROADMAP_V3.md)

---

**마지막 업데이트**: 2024-12-19

