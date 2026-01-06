# 강사 정산 Mock 데이터 확인

## 📋 데이터 구조

### 1. 강사 계정 정보
- **이메일**: `instructor1@example.com`
- **비밀번호**: `instructor123!`
- **이름**: 최강사
- **강사 ID**: `instructor-1-fixed-id-for-testing` (고정값)

### 2. 정산 데이터 생성 정보

#### 생성 위치
- 파일: `apps/cms/src/data/mock/settlements.ts`
- 함수: `createInstructor1Settlements()`
- 생성 개수: **10개**

#### 데이터 특성
- **ID 패턴**: `settle-instructor1-001` ~ `settle-instructor1-010`
- **instructorId**: 모두 `instructor-1-fixed-id-for-testing`로 설정
- **상태 분배**: 
  - pending (대기)
  - calculated (산출 완료)
  - approved (승인)
  - paid (지급 완료)
  - cancelled (취소)
- **기간 분포**: 최근 3개월에 걸쳐 분산
- **금액**: 강사비 + 교통비(60% 확률) + 숙박비(30% 확률)

### 3. 데이터 흐름

```
mockSettlements 배열
├── createInstructor1Settlements() 결과 (10개) ← instructor1용
└── 기타 정산 데이터 (35개)
```

### 4. API 필터링

`getMySettlements(instructorId)` 함수:
- `mockSettlements`에서 `instructorId === 'instructor-1-fixed-id-for-testing'`인 항목만 필터링
- 예상 결과: **10개**

## ✅ 확인 사항

### 코드 레벨 확인

1. ✅ **settlements.ts**
   - `INSTRUCTOR1_ID` 상수 정의됨
   - `createInstructor1Settlements()` 함수 존재
   - `mockSettlements` 배열에 포함됨

2. ✅ **users.ts**
   - `instructor1@example.com` 계정 존재
   - `instructorId`가 `INSTRUCTOR1_ID`로 설정됨

3. ✅ **instructors.ts**
   - `instructor1Data` 객체 생성됨
   - `mockInstructors` 배열 첫 번째 요소로 추가됨

4. ✅ **instructor-settlement-service.ts**
   - `getMySettlements()` 함수가 `instructorId`로 필터링
   - 정상적으로 동작함

## 🧪 테스트 방법

### 1. 로그인
```
이메일: instructor1@example.com
비밀번호: instructor123!
```

### 2. 접근 경로
- **본인 정산**: `/settlements/my`
- **월별 정산 관리**: `/settlements/my/monthly`

### 3. 예상 결과
- **본인 정산 페이지**: 10개의 정산 데이터 표시
- **월별 정산 관리**: 
  - 리스트 뷰: 10개 표시
  - 캘린더 뷰: 날짜별로 정산 표시

## 📊 데이터 상세 정보

### 정산 ID 목록 (예상)
1. `settle-instructor1-001`
2. `settle-instructor1-002`
3. `settle-instructor1-003`
4. `settle-instructor1-004`
5. `settle-instructor1-005`
6. `settle-instructor1-006`
7. `settle-instructor1-007`
8. `settle-instructor1-008`
9. `settle-instructor1-009`
10. `settle-instructor1-010`

### 상태 분배 (10개 기준)
- pending: 2개
- calculated: 2개
- approved: 2개
- paid: 2개
- cancelled: 2개

## ⚠️ 주의사항

1. **매칭 데이터 의존성**
   - `createInstructor1Settlements()` 함수는 `mockMatchings[0]`를 사용
   - `mockMatchings`가 비어있으면 빈 배열 반환
   - 현재는 35개의 매칭 데이터가 있으므로 정상 동작

2. **프로그램 데이터 의존성**
   - `baseProgram`을 찾지 못하면 빈 배열 반환
   - 현재는 정상적으로 프로그램 데이터가 있음

3. **날짜 계산**
   - 월 계산 시 연도 변경 로직 포함
   - 현재 월이 1월이나 2월이면 이전 연도로 계산

## 🔍 디버깅

만약 데이터가 보이지 않는다면:

1. **브라우저 콘솔 확인**
   - `getMySettlements` 호출 시 필터링 결과 확인
   - `instructorId` 값이 일치하는지 확인

2. **mockSettlements 확인**
   ```javascript
   // 브라우저 콘솔에서
   import { mockSettlements } from '@/data/mock'
   const instructor1Settlements = mockSettlements.filter(
     s => s.instructorId === 'instructor-1-fixed-id-for-testing'
   )
   console.log('Instructor1 settlements:', instructor1Settlements.length)
   ```

3. **사용자 정보 확인**
   - 로그인한 사용자의 `instructorId` 확인
   - `useAuthStore`의 `user.instructorId` 값 확인

