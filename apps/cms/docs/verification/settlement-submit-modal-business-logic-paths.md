# 정산 제출 모달 폼 비즈니스 로직 경로

**일자**: 2025-01-19  
**Phase**: 0.4.1 - 강사 정산 신청

---

## 📁 비즈니스 로직 파일 경로

### 1. 메인 모달 컴포넌트 (UI + 폼 로직)

**경로**: `apps/cms/src/features/settlement/ui/settlement-submit-modal.tsx`

**역할**:
- 정산 제출 모달 UI
- 폼 상태 관리
- 자동 산출/수동 입력 모드 전환
- 제출 처리 로직
- 모달 초기화 로직

**주요 함수**:
- `handleSubmit`: 제출 처리
- `handleCancel`: 취소 처리
- `handleProgramChange`: 프로그램 선택 처리
- `handlePeriodChange`: 기간 변경 처리

---

### 2. 정산 계산 핵심 로직 (비즈니스 규칙)

**경로**: `apps/cms/src/entities/settlement/lib/settlement-calculation.ts`

**역할**:
- 정산 자동 산출 핵심 비즈니스 로직
- 강사료 계산 (차시별, 장거리 가산)
- 교통비 계산 (60km 초과 시)
- 숙박비 계산 (80,000원 고정)
- 원천징수 계산 (사업소득자 3.3%, 비사업소득자 8.8%)

**주요 함수**:
- `calculateSettlement(params)`: 정산 자동 산출 메인 함수
- `isValidSessionCount(sessions)`: 차시 수 유효성 검증
- `isTransportFeeApplicable(distance)`: 교통비 지급 대상 여부
- `isLongDistance(distance)`: 장거리 여부 확인

---

### 3. 정산 계산 훅 (상태 관리)

**경로**: `apps/cms/src/features/settlement/hooks/use-settlement-calculation.ts`

**역할**:
- 정산 계산 결과 상태 관리
- 계산 실행 및 초기화
- 유효성 검증

**주요 함수**:
- `calculate(params)`: 계산 실행
- `reset()`: 계산 결과 초기화
- `isValid`: 계산 결과 유효성 확인

---

### 4. 정산 제출 서비스 (API/데이터 처리)

**경로**: `apps/cms/src/entities/settlement/api/instructor-settlement-submit-service.ts`

**역할**:
- 정산 제출 API 호출
- 제출 가능한 정산 목록 조회
- Mock 데이터 처리

**주요 함수**:
- `submitSettlement(instructorId, formData)`: 정산 제출
- `getAvailableSettlements(instructorId)`: 제출 가능한 정산 목록 조회

---

### 5. 정산 규칙 상수 (비즈니스 규칙 정의)

**경로**: `apps/cms/src/shared/constants/settlement-rules.ts`

**역할**:
- 정산 계산에 사용되는 모든 상수 정의
- 강사료 테이블 (1~6차시, 기본/장거리)
- 교통비 정책
- 숙박비 금액
- 원천징수율

**주요 상수**:
- `INSTRUCTOR_FEE_TABLE`: 강사료 테이블
- `LONG_DISTANCE_THRESHOLD_KM`: 장거리 기준 (100km)
- `TRANSPORT_FEE_POLICY`: 교통비 정책 (60km 초과 시 지급)
- `ACCOMMODATION_FEE`: 숙박비 (80,000원)
- `TAX_RATES`: 원천징수율 (사업소득자 3.3%, 비사업소득자 8.8%)

---

### 6. 정산 계산 요약 컴포넌트 (UI)

**경로**: `apps/cms/src/features/settlement/ui/settlement-calculation-summary.tsx`

**역할**:
- 산출 결과 표시 UI
- 강사료, 교통비, 숙박비, 총액, 원천징수, 실지급액 표시

---

### 7. 정산 타입 정의

**경로**: `apps/cms/src/types/domain.ts`

**역할**:
- `Settlement`: 정산 타입 정의
- `SettlementItem`: 정산 항목 타입 정의
- `SettlementStatus`: 정산 상태 타입 정의

---

## 🔄 비즈니스 로직 흐름

### 자동 산출 모드

```
1. 사용자 입력 (차시 수, 거리, 주유비, 통행료, 숙박비, 사업소득자 여부)
   ↓
2. settlement-submit-modal.tsx
   - Form.useWatch로 입력값 감시
   - useEffect에서 자동 산출 트리거
   ↓
3. use-settlement-calculation.ts
   - 유효성 검증
   - calculateSettlement 호출
   ↓
4. settlement-calculation.ts
   - 강사료 계산 (INSTRUCTOR_FEE_TABLE 참조)
   - 교통비 계산 (TRANSPORT_FEE_POLICY 참조)
   - 숙박비 계산 (ACCOMMODATION_FEE 참조)
   - 원천징수 계산 (TAX_RATES 참조)
   - 총액 및 실지급액 계산
   ↓
5. settlement-submit-modal.tsx
   - calculationResult 표시
   - 제출 시 items 배열 생성
   ↓
6. instructor-settlement-submit-service.ts
   - 정산 제출 처리
```

### 수동 입력 모드

```
1. 사용자 직접 입력 (강사비, 교통비, 숙박비 스위치)
   ↓
2. settlement-submit-modal.tsx
   - 입력값 검증
   - 총액 계산
   ↓
3. 제출 시 items 배열 생성
   ↓
4. instructor-settlement-submit-service.ts
   - 정산 제출 처리
```

---

## 📋 주요 비즈니스 규칙 위치

| 규칙 | 파일 경로 |
|------|----------|
| 강사료 테이블 (1~6차시) | `apps/cms/src/shared/constants/settlement-rules.ts` |
| 장거리 기준 (100km) | `apps/cms/src/shared/constants/settlement-rules.ts` |
| 교통비 지급 기준 (60km) | `apps/cms/src/shared/constants/settlement-rules.ts` |
| 숙박비 금액 (80,000원) | `apps/cms/src/shared/constants/settlement-rules.ts` |
| 원천징수율 (3.3%/8.8%) | `apps/cms/src/shared/constants/settlement-rules.ts` |
| 계산 로직 | `apps/cms/src/entities/settlement/lib/settlement-calculation.ts` |
| 폼 검증 | `apps/cms/src/features/settlement/ui/settlement-submit-modal.tsx` |
| 제출 처리 | `apps/cms/src/entities/settlement/api/instructor-settlement-submit-service.ts` |

---

## 🎯 핵심 비즈니스 로직 파일 우선순위

### 최우선 (핵심 비즈니스 규칙)
1. **`apps/cms/src/entities/settlement/lib/settlement-calculation.ts`**
   - 정산 계산 핵심 로직
   - 모든 계산 규칙이 여기에 구현됨

2. **`apps/cms/src/shared/constants/settlement-rules.ts`**
   - 정산 규칙 상수 정의
   - 강사료 테이블, 교통비 정책 등

### 중요 (상태 관리 및 UI 로직)
3. **`apps/cms/src/features/settlement/ui/settlement-submit-modal.tsx`**
   - 모달 UI 및 폼 로직
   - 자동 산출/수동 입력 모드 전환
   - 제출 처리

4. **`apps/cms/src/features/settlement/hooks/use-settlement-calculation.ts`**
   - 계산 결과 상태 관리
   - 계산 실행 및 초기화

### 보조 (데이터 처리)
5. **`apps/cms/src/entities/settlement/api/instructor-settlement-submit-service.ts`**
   - 정산 제출 API
   - 제출 가능한 정산 목록 조회

---

## 📝 참고

- **계산 로직 수정**: `settlement-calculation.ts` 수정
- **규칙 상수 수정**: `settlement-rules.ts` 수정
- **폼 로직 수정**: `settlement-submit-modal.tsx` 수정
- **상태 관리 수정**: `use-settlement-calculation.ts` 수정
