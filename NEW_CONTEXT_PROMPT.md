# 기획 항목 구현 프롬프트 (새 컨텍스트용)

> **복사하여 새로운 컨텍스트에 붙여넣기 가능**  
> **작성 일자**: 2026-01-26  
> **현재 진행률**: 약 40% (완료 7개, 부분 완료 11개, 미구현 15+개)

---

## 📋 프로젝트 개요

JAKorea CMS 프로젝트의 기획 항목(요구사항 기반 기능) 구현 작업입니다.

**원칙**: 요구사항 명세가 모든 개발 작업의 최우선 기준입니다.

**현재 상태**:
- ✅ Phase 1 (Foundation): 100% 완료
- ⚠️ Phase 2 (Frontend Core): 50% 진행률
- ⚠️ Phase 3 (Admin Operations): 50% 진행률
- ⚠️ Phase 4 (Settlement): 50% 진행률
- ❌ Phase 5 (Security): 0% 진행률

**전체 진행률**: 약 40%

---

## 🔴 Phase 2: Frontend Core (v0.2) - 우선순위 1

### Task 2.4: 신청 프로세스 실제 구현 (부분 완료 → 완료)

**현재 상태**: UI/Mock만 존재, 실제 프로세스 미구현

#### 작업 2.4.1: FR-C03 - 템플릿 기반 동적 신청서 폼 생성

**요구사항**: 관리자가 업로드한 신청서 양식 작성 및 제출, 학교의 경우 참여학생 리스트(엑셀) 업로드

**현재 구현 상태**:
- ✅ 신청서 작성 폼 존재 (`src/pages/programs/program-application-page.tsx`)
- ✅ 역할별 신청서 폼 분기 (개인/학교/강사)
- ✅ 학교 신청서 폼 존재 (`src/features/application/ui/school-application-form.tsx`)
- ❌ 템플릿 기반 동적 폼 생성 미구현
- ❌ 엑셀 업로드 기능 미구현

**구현해야 할 작업**:
1. 템플릿 기반 동적 폼 생성 로직 구현
   - 템플릿에서 필드 정의를 읽어 동적으로 폼 생성
   - 필드 타입별 렌더링 (텍스트, 선택, 날짜, 파일 등)
   - 필드별 validation 규칙 적용
   - 파일 위치: `src/features/application/ui/dynamic-application-form.tsx` (신규 생성)

2. 엑셀 업로드 기능 구현 (학교 신청서)
   - 엑셀 파일 업로드 UI
   - 엑셀 파싱 로직 (ExcelJS 활용)
   - 학생 리스트 데이터 검증
   - 파일 위치: `src/features/application/ui/school-application-form.tsx` 수정

**참고 파일**:
- `src/pages/programs/program-application-page.tsx`
- `src/features/application/ui/school-application-form.tsx`
- `src/features/application/ui/individual-application-form.tsx`
- `src/data/mock/templates.ts` (템플릿 Mock 데이터)

**예상 시간**: 2-3일

---

#### 작업 2.4.2: FR-C04 - 실제 문자/이메일 발송 기능

**요구사항**: 신청 완료 화면, 관리자 확정 결과 확인, 확정 후 안내 문자/이메일 발송

**현재 구현 상태**:
- ✅ 신청 완료 화면 구현
- ✅ 신청 결과 화면 개선 완료
- ✅ 신청 상태별 화면 (승인 대기, 반려, 승인 완료)
- ✅ 알림 발송 버튼 UI 존재
- ❌ 실제 문자/이메일 발송 기능 미구현 (Mock만 존재)
- ❌ 카카오 알림 연동 미구현

**구현해야 할 작업**:
1. 문자 발송 API 연동
   - SMS 발송 서비스 구현 (Mock → 실제 API 연동 준비)
   - 발송 결과 처리 및 에러 핸들링
   - 파일 위치: `src/entities/application/api/application-notification-service.ts` 수정

2. 이메일 발송 API 연동
   - 이메일 발송 서비스 구현 (Mock → 실제 API 연동 준비)
   - 템플릿 기반 이메일 발송
   - 파일 위치: `src/entities/application/api/application-notification-service.ts` 수정

3. 카카오 알림 연동
   - 카카오 알림톡/푸시 발송 구현
   - 파일 위치: `src/entities/application/api/application-notification-service.ts` 수정

**참고 파일**:
- `src/pages/programs/program-application-complete-page.tsx`
- `src/features/application/ui/notification-button.tsx`
- `src/entities/application/api/application-notification-service.ts`
- `src/shared/constants/application-notification.ts`

**예상 시간**: 2-3일

---

## 🔴 Phase 3: Admin Operations (v0.3) - 우선순위 2

### Task 3.2: 신청 승인/반려 로직 완성 (부분 완료 → 완료)

**현재 상태**: 승인/반려·문자/이메일 Mock 완료, 신청서 수정 미구현

#### 작업 3.2.1: FR-F01 - 신청서 수정 기능 구현

**요구사항**: 신청서 오기재 사항 수정 (학교/개인)

**현재 구현 상태**:
- ✅ 신청 목록 페이지 존재
- ✅ 신청 승인/반려 UI 존재
- ✅ 실제 승인/반려 로직 (Mock)
- ✅ 문자/이메일/카카오 발송 (Mock)
- ❌ 신청서 수정 기능 미구현

**구현해야 할 작업**:
1. 학교 신청서 수정 기능
   - 신청서 수정 모달/페이지 구현
   - 수정 가능 상태 체크 (최종 상태가 아닐 때만)
   - 수정 이력 기록
   - 파일 위치: `src/pages/applications/application-list-page.tsx` 수정

2. 개인 신청서 수정 기능
   - 개인 신청서 수정 모달/페이지 구현
   - 수정 가능 상태 체크
   - 수정 이력 기록
   - 파일 위치: `src/features/application/ui/individual-application-form.tsx` 수정

**참고 파일**:
- `src/pages/applications/application-list-page.tsx`
- `src/features/application/ui/application-form.tsx`
- `src/features/application/ui/individual-application-form.tsx`
- `src/features/application/ui/school-application-form.tsx`

**예상 시간**: 2-3일

---

### Task 3.3: 강의 신청 승인/매칭 로직 완성 (부분 완료 → 완료)

**현재 상태**: 승인/마감 로직 완료, 매칭 로직 미완성

#### 작업 3.3.1: FR-F02 - 매칭 로직 완성

**요구사항**: 학교별 강사 매칭, 모집 기간 종료 후 추가 배정

**현재 구현 상태**:
- ✅ 강의 신청 목록 페이지 존재
- ✅ 승인/마감 UI 존재
- ✅ 매칭 기능 UI 존재
- ✅ 수동 배정 모달 존재
- ✅ 실제 승인/마감 로직 (Mock)
- ❌ 매칭 로직 미완성

**구현해야 할 작업**:
1. 자동 매칭 알고리즘 구현
   - 학교 요구사항과 강사 정보 매칭
   - 지역, 필라, 일정 등 고려
   - 매칭 우선순위 로직
   - 파일 위치: `src/entities/matching/lib/matching-algorithm.ts` (신규 생성)

2. 수동 배정 로직 개선
   - 수동 배정 시 검증 로직
   - 중복 배정 방지
   - 파일 위치: `src/features/instructor-application/ui/manual-assignment-modal.tsx` 수정

**참고 파일**:
- `src/pages/instructor-applications/instructor-application-list-page.tsx`
- `src/features/instructor-application/ui/manual-assignment-modal.tsx`
- `src/entities/instructor-application/api/instructor-application-service.ts`

**예상 시간**: 2-3일

---

#### 작업 3.3.2: FR-F03 - 실제 매칭 데이터 연동

**요구사항**: 일자별 학교 교육 일자에 신청된 강의신청 내역 확인, 캘린더/목록보기 2가지 형태, 엑셀 다운로드

**현재 구현 상태**:
- ✅ 매칭 목록 페이지 존재
- ✅ 캘린더 뷰 존재
- ✅ 목록 뷰 존재
- ✅ 뷰 전환 기능 존재
- ✅ 엑셀 다운로드 기능
- ❌ 실제 매칭 데이터 연동 미구현

**구현해야 할 작업**:
1. 매칭 데이터 실제 연동
   - 매칭 데이터 조회 로직 구현
   - 캘린더/목록 뷰 데이터 동기화
   - 파일 위치: `src/pages/matchings/matching-list-page.tsx` 수정

**참고 파일**:
- `src/pages/matchings/matching-list-page.tsx`
- `src/features/matching/ui/matching-calendar-view.tsx`
- `src/features/matching/ui/matching-status-list.tsx`
- `src/entities/matching/api/matching-status-service.ts`

**예상 시간**: 1-2일

---

## 🔴 Phase 4: Settlement (v0.4) - 우선순위 3

### Task 4.1: 정산 산출 로직 완성 및 검증 (부분 완료 → 완료)

**현재 상태**: 기본 UI 완료, 산출 로직 부분 구현

#### 작업 4.1.1: FR-G01 - 거리 계산 로직 및 통행료 증빙 검토

**요구사항**: 산출 로직은 정책표 기반(지역/정액/실비 등), 강사비 지급 시 사업소득자 여부 확인(3.3% / 8.8%)

**현재 구현 상태**:
- ✅ 정산 목록/상세 Drawer 존재
- ✅ 정산 산출 로직 파일 존재
- ✅ 강사비 기준표 정의 (별첨2 산식 반영)
- ✅ 교통비 계산 로직 (60km 초과 시)
- ✅ 숙박비 계산 로직 (일괄 80,000원)
- ✅ 사업소득자 여부 확인 필드 존재
- ✅ 실제 산출 결과 검증
- ✅ 관리자 검토/승인 프로세스
- ✅ 금액 조정 기능
- ⚠️ 일사일교 사업 특수성 반영 (부분 완료)
- ❌ 거리 계산 로직 미완성
- ❌ 통행료 증빙 검토 프로세스 미구현

**구현해야 할 작업**:
1. 거리 계산 로직 구현
   - 지도 API 연동 (네이버/카카오 지도 API)
   - 자택 ↔ 학교 간 거리 계산
   - 파일 위치: `src/entities/settlement/lib/distance-calculation.ts` (신규 생성)

2. 통행료 증빙 검토 프로세스 구현
   - 통행료 증빙자료 업로드 UI
   - 증빙자료 검토 프로세스
   - 파일 위치: `src/features/settlement/ui/settlement-detail-review-drawer.tsx` 수정

3. 일사일교 사업 특수성 완전 반영
   - 특수 규칙 적용 로직 완성
   - 파일 위치: `src/entities/settlement/lib/settlement-calculation.ts` 수정

**참고 파일**:
- `src/entities/settlement/lib/settlement-calculation.ts`
- `src/shared/constants/settlement-rules.ts`
- `src/pages/admin/admin-settlement-review-page.tsx`
- `src/features/settlement/ui/settlement-detail-review-drawer.tsx`

**예상 시간**: 2-3일

---

## 📝 작업 진행 가이드

### 각 작업 진행 시 체크리스트

1. **요구사항 확인**
   - `apps/cms/docs/requirements-specification/requirements.md` 확인
   - 해당 기능의 상세 명세 확인
   - `apps/cms/docs/requirements-specification/progress.md`에서 현재 상태 확인

2. **현재 상태 파악**
   - 기존 구현된 UI/Mock 코드 확인
   - 필요한 API 서비스 정의 확인

3. **구현 계획 수립**
   - 필요한 타입 정의
   - 필요한 Hook 정의
   - 필요한 서비스 함수 정의

4. **구현 진행**
   - FSD 아키텍처 준수 (`shared/`, `entities/`, `features/`, `pages/`)
   - 기존 패턴 재사용
   - 리팩토링 패턴 적용 (새로 구현하는 기능에)

5. **테스트 및 검증**
   - Mock 데이터로 동작 확인
   - 타입 안정성 확인
   - 에러 처리 확인

6. **문서 업데이트**
   - `apps/cms/docs/requirements-specification/progress.md` 업데이트
   - 구현 완료 상태 기록

---

## 🎯 우선순위별 작업 순서

### 🔴 최우선 (P1, 미구현)

1. **Phase 2 - Task 2.4.1**: FR-C03 - 템플릿 기반 동적 신청서 폼 생성 (2-3일)
2. **Phase 2 - Task 2.4.2**: FR-C04 - 실제 문자/이메일 발송 기능 (2-3일)
3. **Phase 3 - Task 3.2.1**: FR-F01 - 신청서 수정 기능 구현 (2-3일)
4. **Phase 3 - Task 3.3.1**: FR-F02 - 매칭 로직 완성 (2-3일)
5. **Phase 3 - Task 3.3.2**: FR-F03 - 실제 매칭 데이터 연동 (1-2일)
6. **Phase 4 - Task 4.1.1**: FR-G01 - 거리 계산 로직 및 통행료 증빙 검토 (2-3일)

**총 예상 시간**: 11-17일

---

## 📚 참고 문서

- **요구사항 명세**: `apps/cms/docs/requirements-specification/requirements.md`
- **진행 상황**: `apps/cms/docs/requirements-specification/progress.md`
- **MVP 로드맵**: `apps/cms/docs/requirements-specification/MVP/README.md`
- **v0.2 상세**: `apps/cms/docs/requirements-specification/MVP/v0.2-front-core.md`
- **v0.3 상세**: `apps/cms/docs/requirements-specification/MVP/v0.3-admin-ops.md`
- **v0.4 상세**: `apps/cms/docs/requirements-specification/MVP/v0.4-settlement-report.md`

---

## 💡 중요 사항

1. **요구사항 명세가 최우선**: 모든 작업은 `requirements.md`를 기준으로 진행
2. **FSD 아키텍처 준수**: `shared/`, `entities/`, `features/`, `pages/` 구조 준수
3. **기존 패턴 재사용**: 이미 구현된 패턴과 컴포넌트 재사용
4. **Mock 데이터 활용**: 실제 API 연동 전까지 Mock 데이터로 구현
5. **타입 안정성**: TypeScript 타입 정의 철저히
6. **에러 처리**: 모든 API 호출에 에러 처리 구현

---

**마지막 업데이트**: 2026-01-26
