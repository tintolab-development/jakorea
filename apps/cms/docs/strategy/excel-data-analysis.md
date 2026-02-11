# 엑셀 파일 데이터 분석 결과

## 엑셀 파일 구조 개요

엑셀 파일의 첫 번째 시트는 교육실적 데이터로, 3개의 주요 데이터 영역으로 구성되어 있습니다:

1. **기본 교육실적 정보** (12개 컬럼)
2. **프로그램 설정 정보** (10개 컬럼)
3. **참가자 통계 정보** (11개 컬럼)

---

## 1. 기본 교육실적 정보

### 엑셀 컬럼 (12개)
1. **교육 월** (Education Month) - 숫자 (1-12)
2. **사업분야** (Business Area) - 텍스트 (예: "경제금융")
3. **후원사명(영문)** (Sponsor Name (English))
4. **프로그램명(영문)** (Program Name (English))
5. **후원사명(국문)** (Sponsor Name (Korean))
6. **대표 프로그램명(국문)** (Representative Program Name (Korean))
7. **세부 프로그램명 (국문)** (Detailed Program Name (Korean))
8. **교재명(국문)** (Textbook Name (Korean))
9. **교재명(영문)** (Textbook Name (English))
10. **학교명 (기관)** (School Name (Institution))
11. **시군구** (City/County/District) - 예: "경기 의정부시"
12. **대상 구분** (Target Group Classification) - "초" | "중" | "고"

### 현재 시스템과 비교

#### ✅ 기존 필드 (유지)
- **후원사명(국문)**: `Sponsor.name` ✅
- **프로그램명(국문)**: `Program.title` ✅
- **학교명**: `School.name` ✅
- **시군구**: `School.region` ✅ (형식 차이 있음: 현재는 "경기"만, 엑셀은 "경기 의정부시")

#### ❌ 누락된 필드 (추가 필요)

1. **교육 월** (교육 진행 월) - `Program` 또는 `Schedule`에 추가
   - 타입: `number` (1-12)
   - 용도: 교육이 진행된 월 추적

2. **사업분야** - `Program`에 추가
   - 타입: `string`
   - 예: "경제금융", "기업가정신" 등
   - 카테고리 분류용

3. **후원사명(영문)** - `Sponsor`에 추가
   - 타입: `string`
   - 국문과 영문명 분리 관리

4. **프로그램명(영문)** - `Program`에 추가
   - 타입: `string`
   - 국문과 영문명 분리 관리

5. **대표 프로그램명(국문)** - `Program`에 추가
   - 타입: `string`
   - 프로그램 계층 구조: 대표 프로그램명 > 세부 프로그램명

6. **세부 프로그램명(국문)** - `Program`에 추가
   - 타입: `string`
   - 현재 `Program.title`이 어느 레벨인지 명확하지 않음
   - 제안: `Program.title`을 세부 프로그램명으로 사용하고, `Program.mainTitle` 추가

7. **교재명(국문)** - `Program`에 추가
   - 타입: `string`
   - 프로그램별 사용 교재 정보

8. **교재명(영문)** - `Program`에 추가
   - 타입: `string`

9. **대상 구분** - `Program` 또는 `Application`에 추가
   - 타입: `'elementary' | 'middle' | 'high'` (초/중/고)
   - 현재 시스템에는 학생 연령대/학년 정보가 없음

---

## 2. 프로그램 설정 정보

### 엑셀 컬럼 (10개)
1. **IP Owned** - "JA" (고정값으로 보임)
2. **Course Delivered By** - "JA" | "Jointly"
3. **Partner Involvement** - "Yes" | "No"
4. **기관 구분** - "학교 안" | "학교 밖"
5. **IPS** - "Prepare" | "Succeed" | "Inspire"
6. **프로그램 종류** (IPS 구분이 Succeed 일 경우만 입력)
7. **프로그램 채널 및 형식** (IPS 구분이 Inspire 일 경우만 입력)
8. **교육 형태** - "오프라인" | "온라인" | "하이브리드"
9. **교육시간** - 숫자 (시간)
10. **학급수** - 숫자

### 현재 시스템과 비교

#### ✅ 기존 필드 (매핑 가능)
- **교육 형태**: `Program.type` ✅ ("offline" | "online" | "hybrid")
- **교육시간**: `Schedule`의 시간 차이 계산 가능 ✅

#### ❌ 누락된 필드 (추가 필요)

1. **IP Owned** - `Program`에 추가
   - 타입: `string` (기본값: "JA")
   - 지식재산권 소유 정보

2. **Course Delivered By** - `Program`에 추가
   - 타입: `'JA' | 'Jointly'`
   - 강의 제공 주체

3. **Partner Involvement** - `Program`에 추가
   - 타입: `boolean`
   - 파트너 참여 여부

4. **기관 구분** - `Program` 또는 `Application`에 추가
   - 타입: `'inside_school' | 'outside_school'`
   - 현재 시스템에는 학교 내/외 구분이 없음

5. **IPS** - `Program`에 추가
   - 타입: `'Prepare' | 'Succeed' | 'Inspire'`
   - IPS 프로그램 분류 체계

6. **프로그램 종류** - `Program`에 추가
   - 타입: `string | null`
   - IPS가 "Succeed"일 때만 입력

7. **프로그램 채널 및 형식** - `Program`에 추가
   - 타입: `string | null`
   - IPS가 "Inspire"일 때만 입력
   - 현재 `Program.format`은 다른 용도 ("workshop" | "seminar" 등)

8. **학급수** - `ProgramRound` 또는 `Schedule`에 추가
   - 타입: `number`
   - 프로그램/일정별 학급 수
   - 현재 `ProgramRound.capacity`는 정원(인원)만 있음

---

## 3. 참가자 통계 정보

### 엑셀 컬럼 (11개)
1. **남** (Male) - 숫자
2. **여** (Female) - 숫자
3. **총 참가자** (Total Participants) - 숫자 (남 + 여 합계)
4. **일반 자원봉사자** (General Volunteers) - 숫자
5. **임직원 자원봉사자** (Staff Volunteers) - 숫자
6. **재참여 자원봉사자** (Returning Volunteers) - 숫자
7. **(빈 컬럼)** - 용도 불명
8. **일반담당교사** (General Teacher in Charge) - 숫자
9. **교육받은교사** (Educated Teacher) - 숫자
10. **강사** (Instructor) - 숫자
11. **담당자명** (Person in Charge Name) - 텍스트

### 현재 시스템과 비교

#### ❌ 완전히 누락된 영역

현재 시스템에는 **참가자 통계 데이터를 저장할 엔티티가 없습니다**.

1. **참가자 통계 엔티티 필요** (새로 생성)
   - `ProgramParticipation` 또는 `ProgramStatistics` 엔티티
   - `programId`, `roundId`, `scheduleId` 참조

2. **필수 필드:**
   - **남성 참가자 수**: `number`
   - **여성 참가자 수**: `number`
   - **총 참가자 수**: `number` (계산 필드 가능)
   - **일반 자원봉사자 수**: `number`
   - **임직원 자원봉사자 수**: `number`
   - **재참여 자원봉사자 수**: `number`
   - **일반담당교사 수**: `number`
   - **교육받은교사 수**: `number`
   - **강사 수**: `number`
   - **담당자명**: `string` (학교 담당자 또는 프로그램 담당자)

3. **현재 시스템의 관련 데이터:**
   - `Instructor`: 강사 정보는 있으나 통계 수치 없음
   - `VolunteerActivity`: 봉사 활동 정보는 있으나 통계 수치 없음
   - `Application`: 신청 정보는 있으나 참가자 성별/통계 없음
   - `School.contactPerson`: 담당자명은 있으나 통계와 별개

---

## 요약: 변경/추가 필요한 항목

### 1. Sponsor 엔티티 수정
```typescript
interface Sponsor {
  // 기존 필드...
  nameEn?: string; // 후원사명(영문) 추가
}
```

### 2. Program 엔티티 대폭 수정
```typescript
interface Program {
  // 기존 필드...
  
  // 기본 정보
  educationMonth?: number; // 교육 월 (1-12)
  businessArea?: string; // 사업분야
  titleEn?: string; // 프로그램명(영문)
  mainTitle?: string; // 대표 프로그램명(국문)
  // title은 세부 프로그램명으로 사용
  textbookName?: string; // 교재명(국문)
  textbookNameEn?: string; // 교재명(영문)
  targetLevel?: 'elementary' | 'middle' | 'high'; // 대상 구분 (초/중/고)
  
  // 프로그램 설정
  ipOwned?: string; // IP Owned (기본값: "JA")
  courseDeliveredBy?: 'JA' | 'Jointly'; // Course Delivered By
  partnerInvolvement?: boolean; // Partner Involvement
  institutionType?: 'inside_school' | 'outside_school'; // 기관 구분
  ips?: 'Prepare' | 'Succeed' | 'Inspire'; // IPS 분류
  programCategory?: string | null; // 프로그램 종류 (IPS가 Succeed일 때)
  programChannel?: string | null; // 프로그램 채널 및 형식 (IPS가 Inspire일 때)
}
```

### 3. ProgramRound 엔티티 수정
```typescript
interface ProgramRound {
  // 기존 필드...
  classCount?: number; // 학급수 추가
}
```

### 4. School 엔티티 수정 (선택사항)
```typescript
interface School {
  // 기존 필드...
  district?: string; // 시군구 세부 정보 (현재 region은 "경기"만, district는 "경기 의정부시" 전체)
}
```

### 5. 새 엔티티: ProgramStatistics (참가자 통계)
```typescript
interface ProgramStatistics {
  id: UUID;
  programId: UUID;
  roundId?: UUID;
  scheduleId?: UUID;
  
  // 참가자 통계
  maleParticipants: number; // 남성 참가자
  femaleParticipants: number; // 여성 참가자
  totalParticipants: number; // 총 참가자 (계산 가능)
  
  // 자원봉사자 통계
  generalVolunteers: number; // 일반 자원봉사자
  staffVolunteers: number; // 임직원 자원봉사자
  returningVolunteers: number; // 재참여 자원봉사자
  
  // 교사/강사 통계
  generalTeachers: number; // 일반담당교사
  educatedTeachers: number; // 교육받은교사
  instructors: number; // 강사 수
  
  // 담당자
  managerName?: string; // 담당자명
  
  createdAt: DateValue;
  updatedAt: DateValue;
}
```

---

## 우선순위 권장사항

### 높은 우선순위 (핵심 데이터)
1. ✅ **ProgramStatistics 엔티티 생성** - 참가자 통계는 완전히 새로 만들어야 함
2. ✅ **Program에 사업분야, 대상 구분 추가** - 프로그램 분류에 필수
3. ✅ **Program에 IPS 분류 추가** - IPS는 프로그램 분류 체계의 핵심
4. ✅ **Program에 기관 구분 추가** - 학교 안/밖 구분 필요

### 중간 우선순위 (데이터 보완)
5. ✅ **Program에 영문명 필드 추가** - 다국어 지원
6. ✅ **Program에 교재명 추가** - 프로그램별 교재 추적
7. ✅ **ProgramRound에 학급수 추가** - 통계/보고서에 필요
8. ✅ **Program에 Course Delivered By, Partner Involvement 추가** - 프로그램 속성 정보

### 낮은 우선순위 (선택사항)
9. ✅ **Program에 교육 월 추가** - 월별 집계 가능
10. ✅ **Program에 IP Owned 추가** - 메타 정보
11. ✅ **Program에 대표 프로그램명/세부 프로그램명 구조 정리** - 계층 구조 명확화



