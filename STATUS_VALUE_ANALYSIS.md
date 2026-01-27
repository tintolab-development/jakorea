# 상태값 존재 여부 분석 결과

## 요청된 상태값 확인

사용자가 요청한 상태값들:

1. **모집 예정**
2. **수강 대기 신청**
3. **강의 대기 신청**
4. **교재 준비 중**
5. **정산 대기**

## 분석 결과

### ✅ 존재하는 상태값

#### 1. "모집 예정"

- **타입**: `ProgramLifecycleStatus`
- **값**: `'planned'`
- **위치**: `apps/cms/src/shared/constants/status.ts` (line 145)
- **라벨**: `'모집 예정'`
- **설명**: 프로그램 라이프사이클의 첫 번째 단계

### ❌ 존재하지 않는 상태값

#### 2. "수강 대기 신청"

- **유사한 상태값**:
  - `'recruiting_students'` (수강자 모집) - `ProgramLifecycleStatus`
  - `'waiting'` (대기) - `ApplicationStatus`
- **차이점**: "수강 대기 신청"이라는 정확한 상태값은 없음

#### 3. "강의 대기 신청"

- **유사한 상태값**:
  - `'recruiting_instructors'` (강사 모집) - `ProgramLifecycleStatus`
  - `'MATCHING_IN_PROGRESS'` (매칭 진행중) - `ApplicationProgressStatus`
- **차이점**: "강의 대기 신청"이라는 정확한 상태값은 없음

#### 4. "교재 준비 중"

- **유사한 상태값**:
  - `'MATERIAL_PREPARING'` (교재 배송 준비중) - `ApplicationProgressStatus`
  - 위치: `apps/cms/src/shared/constants/application-status.ts` (line 19)
- **차이점**: 라벨이 "교재 배송 준비중"으로 다름

#### 5. "정산 대기"

- **유사한 상태값**:
  - `'pending'` (대기) - `SettlementStatus`
  - 위치: `apps/cms/src/shared/constants/status.ts` (line 66)
  - 라벨: `'대기'`
- **차이점**: 라벨이 "대기"로 다름 (정산 대기와 동일한 의미이지만 라벨이 다름)

## 현재 정의된 상태값 체계

### ProgramLifecycleStatus (프로그램 진행 상태)

```typescript
'planned' // 모집 예정
'recruiting_students' // 수강자 모집
'recruiting_instructors' // 강사 모집
'matching_completed' // 매칭 완료
'education_before_textbook' // 교육 진행 중 (교재 발송 전)
'education_after_textbook' // 교육 진행 중 (교재 발송 후)
'education_completed' // 교육 진행 완료
'document_processing_completed' // 서류 처리 완료
```

### ApplicationProgressStatus (신청 진행 상태)

```typescript
'RECEIVED' // 접수 완료
'MATCHING_IN_PROGRESS' // 매칭 진행중
'MATCHING_COMPLETED' // 매칭 완료
'MATERIAL_PREPARING' // 교재 배송 준비중
'MATERIAL_SHIPPED' // 교재 발송 완료
'IN_PROGRESS' // 교육 실시
'SURVEY_SUBMITTED' // 만족도 조사 제출
'REPORT_SUBMITTED' // 강의보고서 제출
```

### SettlementStatus (정산 상태)

```typescript
'pending' // 대기
'calculated' // 산출 완료
'review' // 검토
'approved' // 승인
'paid' // 지급 완료
'cancelled' // 취소
```

## 권장 사항

요청된 상태값들을 구현하려면:

1. **"수강 대기 신청"**: 새로운 상태값 추가 필요 또는 기존 `'waiting'` 상태 활용
2. **"강의 대기 신청"**: 새로운 상태값 추가 필요 또는 기존 `'MATCHING_IN_PROGRESS'` 활용
3. **"교재 준비 중"**: `'MATERIAL_PREPARING'`의 라벨을 "교재 준비 중"으로 변경 또는 별도 상태값 추가
4. **"정산 대기"**: `'pending'`의 라벨을 "정산 대기"로 변경
