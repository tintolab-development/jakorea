# 다음 Phase 진행 전 확인 사항

**작성 일자**: 2024-12-19  
**목적**: V3 Phase 7 진행 전 확인해야 할 사항 정리

---

## ✅ 현재 완료된 작업

### 최근 완료 사항
- ✅ 대시보드 고도화 (Phase 1-3 완료)
  - 즉시 처리 필요 작업 Alert Bar
  - 월별 정산 현황 카드
  - 월별 신청 현황 카드
  - 진행 중 프로그램 카드
  - 통합 활동 피드
  - 데이터 중앙화 (`useDashboardData` 훅)
- ✅ UI 일관성 개선
  - 프로그램 목록 Tag 크기 통일
  - 학교 목록 Tag 크기 통일
  - 스폰서 목록 Tag 크기 통일
- ✅ 캘린더 배경색 기준 확인
  - `#d8f0ee` 색상 적용 기준 문서화 (오늘 날짜, 선택된 날짜, 호버된 날짜)

### 이전 Phase 완료 사항
- ✅ Phase 0-3: 기반 구조 및 핵심 도메인 모델
- ✅ Phase 4: 정산 관리 기본 UI + 고도화
- ✅ Phase 5: 대시보드 최근 활동
- ✅ V2 Phase 5: 핵심 화면 개선 (5.1, 5.3-5.11)
- ✅ V3 Phase 4: 정산 관리 고도화

---

## 🎯 다음 단계: V3 Phase 7 - 신청 경로 관리

### Phase 7 개요

**목적**: 프로그램별 신청 경로 설정 및 관리

**주요 기능**:
1. 프로그램별 신청 경로 설정 (구글폼 / 자동화 프로그램)
2. 구글폼 링크 관리
3. 신청 경로별 안내 문구 설정

**현재 상황**:
- 구글 forms 링크 발송
- 신청 자체는 업무 자동화 프로그램에서 처리
- 학교 프로그램과 개인 프로그램이 다른데 양방향 신청이 불가능

---

## ⚠️ Phase 7 진행 전 확인 사항

### 1. 기존 신청 관리 기능 확인 ⚠️ 필수

**확인 필요**:
- [ ] 현재 신청 관리 화면에서 신청 경로 정보가 어떻게 표시되는지 확인
- [ ] `Application` 타입에 신청 경로 관련 필드가 있는지 확인
- [ ] 프로그램 상세 화면에서 신청 경로 정보가 표시되는지 확인

**파일 확인**:
- `apps/cms/src/types/domain.ts` - Application 타입 정의
- `apps/cms/src/features/application/` - 신청 관리 기능
- `apps/cms/src/features/program/ui/program-detail-drawer.tsx` - 프로그램 상세

**예상 작업**:
- Application 타입에 `applicationPath` 또는 `applicationType` 필드 추가 필요할 수 있음
- 프로그램 상세 화면에 신청 경로 정보 표시 추가 필요할 수 있음

---

### 2. 프로그램 타입 구분 확인 ⚠️ 필수

**확인 필요**:
- [ ] 학교 프로그램 vs 개인 프로그램 구분이 현재 코드에 어떻게 구현되어 있는지 확인
- [ ] Program 타입에 프로그램 유형 필드가 있는지 확인
- [ ] 프로그램 목록/상세에서 프로그램 유형이 표시되는지 확인

**파일 확인**:
- `apps/cms/src/types/domain.ts` - Program 타입 정의
- `apps/cms/src/features/program/` - 프로그램 관리 기능

**예상 작업**:
- Program 타입에 `programType: 'school' | 'individual'` 필드 추가 필요할 수 있음
- 프로그램 목록/상세에 프로그램 유형 표시 추가 필요할 수 있음

---

### 3. 신청 경로 데이터 구조 설계 ⚠️ 필수

**확인 필요**:
- [ ] 신청 경로 정보를 어디에 저장할지 결정 (Program에 포함 vs 별도 엔티티)
- [ ] 구글폼 링크 관리 방식 결정 (프로그램별 vs 전역)
- [ ] 신청 경로별 안내 문구 관리 방식 결정

**설계 고려사항**:
- 신청 경로는 프로그램별로 다를 수 있음
- 구글폼 링크는 재사용 가능할 수 있음
- 안내 문구는 카테고리별로 다를 수 있음

**예상 작업**:
- `ApplicationPath` 타입 정의 필요
- `application-path-service.ts` 생성 필요
- Mock 데이터 생성 필요

---

### 4. UI/UX 설계 확인 ⚠️ 권장

**확인 필요**:
- [ ] 프로그램 상세 화면에서 신청 경로 설정 UI 위치 결정
- [ ] 구글폼 링크 관리 화면 구조 설계
- [ ] 신청 경로별 안내 문구 설정 화면 구조 설계

**설계 고려사항**:
- 프로그램 상세 화면에 신청 경로 설정 섹션 추가
- 별도 신청 경로 관리 페이지 생성 (현재 `/application-paths` 라우트 존재)
- 안내 문구는 텍스트 에디터 또는 간단한 Input 사용

**예상 작업**:
- 프로그램 상세 Drawer에 신청 경로 설정 탭 추가
- 신청 경로 목록 페이지 구현 (이미 라우트 존재)
- 안내 문구 설정 모달 또는 페이지 구현

---

### 5. 기존 코드와의 통합 확인 ⚠️ 필수

**확인 필요**:
- [ ] 현재 신청 등록 폼에서 신청 경로 정보를 어떻게 처리하는지 확인
- [ ] 신청 목록에서 신청 경로별 필터링이 필요한지 확인
- [ ] 신청 상세 화면에서 신청 경로 정보를 표시해야 하는지 확인

**파일 확인**:
- `apps/cms/src/features/application/ui/application-form.tsx` - 신청 등록 폼
- `apps/cms/src/features/application/ui/application-list.tsx` - 신청 목록
- `apps/cms/src/features/application/ui/application-detail-drawer.tsx` - 신청 상세

**예상 작업**:
- 신청 등록 폼에 신청 경로 선택 필드 추가 (조건부)
- 신청 목록에 신청 경로 필터 추가 (선택사항)
- 신청 상세에 신청 경로 정보 표시 추가

---

### 6. Mock 데이터 준비 ⚠️ 필수

**확인 필요**:
- [ ] 신청 경로 Mock 데이터 생성
- [ ] 프로그램 Mock 데이터에 신청 경로 정보 추가
- [ ] 신청 Mock 데이터에 신청 경로 정보 추가

**예상 작업**:
- `apps/cms/src/data/mock/application-paths.ts` 생성 (이미 존재하는지 확인)
- `apps/cms/src/data/mock/programs.ts` 업데이트
- `apps/cms/src/data/mock/applications.ts` 업데이트

---

## 📋 Phase 7 구현 체크리스트

### 1단계: 데이터 구조 설계 및 Mock 데이터 준비
- [ ] `ApplicationPath` 타입 정의
- [ ] `Program` 타입에 `applicationPathId` 필드 추가
- [ ] `Application` 타입에 `applicationPathId` 필드 추가
- [ ] 신청 경로 Mock 데이터 생성
- [ ] 프로그램 Mock 데이터 업데이트
- [ ] 신청 Mock 데이터 업데이트

### 2단계: 서비스 및 스토어 구현
- [ ] `entities/application-path/api/application-path-service.ts` 생성
- [ ] `features/application-path/model/application-path-store.ts` 생성
- [ ] `features/application-path/model/schema.ts` 생성

### 3단계: UI 컴포넌트 구현
- [ ] 신청 경로 목록 페이지 (`/application-paths`) 구현
- [ ] 신청 경로 등록/수정 폼 구현
- [ ] 프로그램 상세에 신청 경로 설정 섹션 추가
- [ ] 신청 경로별 안내 문구 설정 UI 구현

### 4단계: 통합 및 테스트
- [ ] 신청 등록 폼에 신청 경로 정보 연동
- [ ] 신청 상세에 신청 경로 정보 표시
- [ ] 프로그램 상세에 신청 경로 정보 표시
- [ ] 라우팅 확인 및 메뉴 연결

---

## 🔍 Phase 7 이후 예상 단계

### Phase 8: 일정 협의 관리
- 학교별 일정 협의 프로세스 관리
- 학사일정 고려한 일정 제안
- 여러 학교 동시 진행 관리

### Phase 9: 예산 및 실적 관리
- 프로그램별 예산 설정/관리
- 지역별 구분 관리
- 실적 집계 (월별, 지역별, 프로그램별)

---

## 💡 권장 진행 순서

### 즉시 진행 가능
1. **기존 코드 확인** (1-2시간)
   - Application 타입 확인
   - Program 타입 확인
   - 신청 관리 기능 확인
   - 프로그램 상세 화면 확인

2. **데이터 구조 설계** (2-3시간)
   - ApplicationPath 타입 정의
   - 관련 타입 업데이트
   - Mock 데이터 구조 설계

3. **Mock 데이터 생성** (1-2시간)
   - 신청 경로 Mock 데이터 생성
   - 프로그램/신청 Mock 데이터 업데이트

### 이후 진행
4. **서비스 및 스토어 구현** (3-4시간)
5. **UI 컴포넌트 구현** (5-6시간)
6. **통합 및 테스트** (2-3시간)

**예상 총 소요 시간**: 14-20시간 (2-3일)

---

## 📝 참고 문서

- `MVP_ROADMAP_V3.md` - Phase 7 상세 요구사항
- `PROGRESS.md` - 전체 진행 상황
- `V2_PHASE5_PRIORITY.md` - 이전 Phase 우선순위 결정

---

**마지막 업데이트**: 2024-12-19

