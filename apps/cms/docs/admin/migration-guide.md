# 관리자 페이지 카테고리 정리 및 뎁스 변경 마이그레이션 가이드

**작성 일자**: 2025-01-XX  
**목적**: IA 구조에 맞춰 관리자 페이지 카테고리 정리 및 뎁스 변경  
**대상**: 관리자(ADMIN) 권한 메뉴 구조

---

## 📋 목차

1. [IA 구조 개요](#ia-구조-개요)
2. [현재 구조 분석](#현재-구조-분석)
3. [매핑 관계](#매핑-관계)
4. [변경 사항 상세](#변경-사항-상세)
5. [마이그레이션 계획](#마이그레이션-계획)
6. [라우팅 경로 변경](#라우팅-경로-변경)
7. [권한 설정](#권한-설정)

---

## 🎯 IA 구조 개요

### IA 1뎁스 카테고리 (10개)

> **참고**: 로그인(Login)은 별도 처리되므로 메뉴 카테고리에서 제외됩니다.

1. **홈 (Home)**
2. **프로그램 관리 (Program Management)**
3. **회원 관리 (Member Management)**
4. **강사단 관리 (Instructor Management)**
5. **봉사단 관리 (Volunteer Management)**
6. **템플릿 관리 (Template Management)** ⚠️ 준비중
7. **게시글 관리 (Post Management)** ⚠️ 준비중
8. **후원사 관리 (Sponsor Management)**
9. **실적 통계 (Performance Statistics)**
10. **로그 관리 (Log Management)** ⚠️ 준비중

> **⚠️ 준비중**: 템플릿 관리, 게시글 관리, 로그 관리 카테고리는 현재 "화면 준비중입니다" 메시지를 표시하는 페이지로 구현되어 있습니다.

---

## 📊 현재 구조 분석

### 현재 관리자(ADMIN) 메뉴 구조

#### 1뎁스 메뉴 (15개)

1. **대시보드** (`/`)
2. **프로그램** (`programs-group`)
   - 프로그램 목록 (`/programs`)
3. **교육실적 관리** (`/education-records`)
4. **교육실적 관리 (v2)** (`/education-records-v2`)
5. **예산 및 실적 관리** (`/performance`)
6. **신청 관리** (`/applications`)
7. **신청 경로 관리** (`/application-paths`)
8. **일정 관리** (`schedules-group`)
   - 일정 캘린더 (`/schedules`)
   - 일정 협의 관리 (`/schedule-negotiations`)
9. **매칭 관리** (`/matchings`)
10. **강사 관리** (`/instructors`)
11. **사용자 관리** (`/users`)
12. **학교 관리** (`/schools`)
13. **스폰서 관리** (`/sponsors`)
14. **정산 관리** (`settlements-group`)
    - 정산 목록 (`/settlements`)
    - 월별 정산 관리 (`/settlements/monthly`)
    - 산출 로직 설정 (`/settlements/calculation-settings`)
15. **면접 관리** (`interviews-group`)
    - 면접 관리 (`/interviews`)
16. **보고서** (`reports-group`)
    - 보고서 관리 (`/reports`)

---

## 🔄 매핑 관계

### IA → 현재 구조 매핑

| IA 1뎁스 | 현재 메뉴 | 상태 | 비고 |
|---------|---------|------|------|
| 1. 홈 | 대시보드 (`/`) | 매핑 | 경로 유지 또는 `/home`으로 변경 |
| 2. 프로그램 관리 | 프로그램 (`programs-group`) | 매핑 | 하위 구조 확장 필요 |
| 3. 회원 관리 | 사용자 관리 (`/users`), 학교 관리 (`/schools`) | 통합 필요 | 두 메뉴 통합 |
| 4. 강사단 관리 | 강사 관리 (`/instructors`), 정산 관리 (`settlements-group`) | 통합 필요 | 강사 관리 + 정산 통합 |
| 5. 봉사단 관리 | 없음 | 신규 필요 | 신규 메뉴 추가 |
| 6. 템플릿 관리 | 없음 | 준비중 페이지 | "화면 준비중입니다" 페이지 구현 완료 |
| 7. 게시글 관리 | 없음 | 준비중 페이지 | "화면 준비중입니다" 페이지 구현 완료 |
| 8. 후원사 관리 | 스폰서 관리 (`/sponsors`) | 매핑 | 이름 변경 또는 유지 |
| 9. 실적 통계 | 교육실적 관리 (`/education-records`), 예산 및 실적 관리 (`/performance`) | 통합 필요 | 두 메뉴 통합 |
| 10. 로그 관리 | 없음 | 준비중 페이지 | "화면 준비중입니다" 페이지 구현 완료 |

### 현재 → IA 구조 매핑

| 현재 메뉴 | IA 1뎁스 | 상태 | 비고 |
|---------|---------|------|------|
| 대시보드 | 홈 | 매핑 | - |
| 프로그램 | 프로그램 관리 | 매핑 | - |
| 교육실적 관리 | 실적 통계 | 통합 | - |
| 교육실적 관리 (v2) | 실적 통계 | 통합 | v2 제거 또는 통합 |
| 예산 및 실적 관리 | 실적 통계 | 통합 | - |
| 신청 관리 | 프로그램 관리 (하위) | 이동 | 프로그램 관리 하위로 이동 |
| 신청 경로 관리 | 프로그램 관리 (하위) | 이동 | 프로그램 관리 하위로 이동 |
| 일정 관리 | 프로그램 관리 (하위) | 이동 | 프로그램 관리 하위로 이동 |
| 매칭 관리 | 프로그램 관리 (하위) | 이동 | 프로그램 관리 하위로 이동 |
| 강사 관리 | 강사단 관리 | 통합 | - |
| 사용자 관리 | 회원 관리 | 통합 | - |
| 학교 관리 | 회원 관리 | 통합 | - |
| 스폰서 관리 | 후원사 관리 | 매핑 | - |
| 정산 관리 | 강사단 관리 (하위) | 이동 | 강사단 관리 하위로 이동 |
| 면접 관리 | 강사단 관리 (하위) 또는 봉사단 관리 (하위) | 이동 | 역할에 따라 분리 |
| 보고서 | 프로그램 관리 (하위) 또는 별도 | 검토 필요 | - |

---

## 📝 변경 사항 상세

### 1. 홈 (Home)

**현재**: 대시보드 (`/`)  
**변경**: 홈 (`/home` 또는 `/` 유지)

**하위 메뉴 (2뎁스)**:
- 검색 (Search)
- 알림 리스트 (Notification List)
- 전체 강의 진행 현황 (Overall Lecture Progress Status)
  - 신청 완료
  - 진행 예정
  - 진행 중
  - 진행 완료
- 배너 (Banner)

**작업 내용**:
- [ ] 대시보드 페이지를 홈으로 리네이밍 또는 경로 변경
- [ ] 검색 기능 추가
- [ ] 알림 리스트 기능 추가
- [ ] 전체 강의 진행 현황 섹션 추가
- [ ] 배너 관리 기능 추가

---

### 2. 프로그램 관리 (Program Management)

**현재**: 프로그램 (`programs-group`)  
**변경**: 프로그램 관리로 명칭 변경, 하위 구조 확장

**하위 메뉴 (2뎁스)**:
- 검색 (Search)
- 카테고리 솔팅 (Category Sorting)
- 진행 기간 (Duration)
- 수강 대상 (Target Audience)
- 교육 유형 (Education Type)
- 진행 상태 (Progress Status)
- 프로그램 목록 (Program List) (3뎁스)
  - 수강자 모집 중 (Recruiting Students)
    - 프로그램 상세 (Program Details) (4뎁스)
  - 강사 모집 중 (Recruiting Instructors)
    - 프로그램 상세 (Program Details) (4뎁스)
  - 모집 완료 및 (Recruitment Completed &)
    - 프로그램 상세 (Program Details) (4뎁스)
  - 매칭 완료 및 진행 대기 중 (Matching Completed & Awaiting Progress)
    - 프로그램 상세 (Program Details) (4뎁스)
  - 오픈채팅 관리 (Open Chat Management) (3뎁스)
  - 진행 중 (In Progress)
    - 프로그램 상세 (Program Details) (4뎁스)
  - 진행 완료 (Completed)
    - 프로그램 상세 (Program Details) (4뎁스)

**통합/이동할 메뉴**:
- 신청 관리 (`/applications`) → 프로그램 관리 하위로 이동
- 신청 경로 관리 (`/application-paths`) → 프로그램 관리 하위로 이동
- 일정 관리 (`schedules-group`) → 프로그램 관리 하위로 이동
- 매칭 관리 (`/matchings`) → 프로그램 관리 하위로 이동

**작업 내용**:
- [ ] 메뉴 명칭 변경: "프로그램" → "프로그램 관리"
- [ ] 검색, 필터링 기능 추가 (카테고리 솔팅, 진행 기간, 수강 대상, 교육 유형, 진행 상태)
- [ ] 프로그램 목록을 상태별로 세분화 (3뎁스 구조)
- [ ] 신청 관리, 신청 경로 관리, 일정 관리, 매칭 관리를 프로그램 관리 하위로 이동
- [ ] 오픈채팅 관리 메뉴 추가

---

### 3. 회원 관리 (Member Management)

**현재**: 사용자 관리 (`/users`), 학교 관리 (`/schools`)  
**변경**: 두 메뉴를 통합하여 회원 관리로 재구성

**하위 메뉴 (2뎁스)**:
- 전체 회원 (All Members)
- 검색 (Search)
- 회원 상세 (Member Details)
- 학교(교사) 회원 (School(Teacher) Members)
- 검색 (Search)
- 학교 상세 (School Details)
- 교사 회원 (Teacher Members)

**작업 내용**:
- [ ] 사용자 관리와 학교 관리를 통합
- [ ] 메뉴 구조 재구성: 전체 회원, 학교(교사) 회원으로 구분
- [ ] 검색 기능 추가
- [ ] 회원 상세, 학교 상세 페이지 구성

---

### 4. 강사단 관리 (Instructor Management)

**현재**: 강사 관리 (`/instructors`), 정산 관리 (`settlements-group`)  
**변경**: 강사 관리와 정산 관리를 통합하여 강사단 관리로 재구성

**하위 메뉴 (2뎁스)**:
- 강사진 (Instructors)
- 검색 (Search)
- 강사 상세 (Instructor Details)
- 정산 (Settlement) (2뎁스)
  - 정산 신청 대기 (Settlement Application Pending) (3뎁스)
  - 정산 (Settlement) (3뎁스)
  - 정산 확인 (Settlement Confirmation) (3뎁스)
    - 정산 지급 완료 (Settlement Payment Completed) (4뎁스)
  - 전체 정산 현황 (Overall Settlement Status) (3뎁스)
  - 강사 별 정산 (Settlement by Instructor) (3뎁스)

**통합/이동할 메뉴**:
- 정산 관리 (`settlements-group`) → 강사단 관리 하위로 이동
- 면접 관리 (`interviews-group`) → 강사단 관리 하위로 이동 (강사 관련)

**작업 내용**:
- [ ] 강사 관리와 정산 관리를 통합
- [ ] 메뉴 명칭 변경: "강사 관리" → "강사단 관리"
- [ ] 정산 메뉴를 강사단 관리 하위로 이동
- [ ] 정산 하위 구조 확장 (3뎁스, 4뎁스)
- [ ] 면접 관리 중 강사 관련 부분을 강사단 관리 하위로 이동

---

### 5. 봉사단 관리 (Volunteer Management)

**현재**: 없음 (신규)  
**변경**: 신규 메뉴 추가

**하위 메뉴 (2뎁스)**:
- 봉사자 (Volunteers)
- 검색 (Search)
- 봉사자 상세 (Volunteer Details)
- 봉사 프로그램 (Volunteer Program) (2뎁스)
  - 프로그램 진행 일정 (Program Schedule) (3뎁스)
  - 프로그램 상세 (Program Details) (3뎁스)
  - 봉사자 랜덤 배치 (Random Volunteer Assignment) (3뎁스)

**통합/이동할 메뉴**:
- 면접 관리 (`interviews-group`) → 봉사단 관리 하위로 이동 (봉사자 관련)

**작업 내용**:
- [ ] 신규 메뉴 추가: 봉사단 관리
- [ ] 봉사자 관리 기능 구현
- [ ] 봉사 프로그램 관리 기능 구현
- [ ] 봉사자 랜덤 배치 기능 구현
- [ ] 면접 관리 중 봉사자 관련 부분을 봉사단 관리 하위로 이동

---

### 6. 템플릿 관리 (Template Management)

**현재**: 없음 (신규)  
**변경**: 준비중 페이지 구현 완료 ✅

**하위 메뉴 (2뎁스)** (향후 구현 예정):
- 파일 양식 관리 (File Form Management)
- 문자 관리 (SMS Management) (2뎁스)
  - 문자 양식 (SMS Form) (3뎁스)
  - 문자 발송 (Send SMS) (3뎁스)
- 메일 관리 (Email Management) (2뎁스)
  - 메일 양식 (Email Form) (3뎁스)
  - 메일 발송 (Send Email) (3뎁스)
- 배너 관리 (Banner Management)

**작업 내용**:
- [x] 신규 메뉴 추가: 템플릿 관리 (준비중 페이지)
- [ ] 파일 양식 관리 기능 구현
- [ ] 문자 관리 기능 구현 (양식, 발송)
- [ ] 메일 관리 기능 구현 (양식, 발송)
- [ ] 배너 관리 기능 구현

---

### 7. 게시글 관리 (Post Management)

**현재**: 없음 (신규)  
**변경**: 준비중 페이지 구현 완료 ✅

**하위 메뉴 (2뎁스)** (향후 구현 예정):
- 카테고리 관리 (Category Management)
- 공지사항 관리 (Notice Management)
- FAQ 관리 (FAQ Management)
- 문의하기 관리 (Inquiry Management)

**작업 내용**:
- [x] 신규 메뉴 추가: 게시글 관리 (준비중 페이지)
- [ ] 카테고리 관리 기능 구현
- [ ] 공지사항 관리 기능 구현
- [ ] FAQ 관리 기능 구현
- [ ] 문의하기 관리 기능 구현

---

### 8. 후원사 관리 (Sponsor Management)

**현재**: 스폰서 관리 (`/sponsors`)  
**변경**: 명칭 변경 또는 유지

**하위 메뉴 (2뎁스)**:
- 검색 (Search)

**작업 내용**:
- [ ] 메뉴 명칭 검토: "스폰서 관리" → "후원사 관리" (또는 유지)
- [ ] 검색 기능 추가

---

### 9. 실적 통계 (Performance Statistics)

**현재**: 교육실적 관리 (`/education-records`), 교육실적 관리 (v2) (`/education-records-v2`), 예산 및 실적 관리 (`/performance`)  
**변경**: 세 메뉴를 통합하여 실적 통계로 재구성

**하위 메뉴 (2뎁스)**:
- 실적 현황 (Performance Status)
- 실적 다운로드 (Download Performance)

**작업 내용**:
- [ ] 교육실적 관리, 교육실적 관리 (v2), 예산 및 실적 관리를 통합
- [ ] 메뉴 명칭 변경: "실적 통계"
- [ ] 실적 현황 기능 구현
- [ ] 실적 다운로드 기능 구현
- [ ] v2 버전 제거 또는 통합

---

### 10. 로그 관리 (Log Management)

**현재**: 없음 (신규)  
**변경**: 준비중 페이지 구현 완료 ✅

**하위 메뉴 (2뎁스)** (향후 구현 예정):
- 데이터 (Data)

**작업 내용**:
- [x] 신규 메뉴 추가: 로그 관리 (준비중 페이지)
- [ ] 로그 데이터 조회 기능 구현

---

## 🗺️ 마이그레이션 계획

### Phase 1: 구조 정리 (우선순위 높음)

1. **홈 메뉴 정리**
   - 대시보드 → 홈으로 변경
   - 하위 기능 추가 (검색, 알림, 진행 현황, 배너)

2. **프로그램 관리 확장**
   - 메뉴 명칭 변경
   - 하위 메뉴 통합 (신청 관리, 신청 경로 관리, 일정 관리, 매칭 관리)
   - 프로그램 목록 상태별 세분화

3. **회원 관리 통합**
   - 사용자 관리 + 학교 관리 통합
   - 메뉴 구조 재구성

4. **강사단 관리 통합**
   - 강사 관리 + 정산 관리 통합
   - 면접 관리 중 강사 관련 부분 통합

### Phase 2: 신규 메뉴 추가 (우선순위 중간)

5. **봉사단 관리 추가**
   - 신규 메뉴 생성
   - 봉사자 관리 기능 구현
   - 면접 관리 중 봉사자 관련 부분 통합

6. **템플릿 관리 추가** ✅ (준비중 페이지 완료)
   - [x] 신규 메뉴 생성 (준비중 페이지)
   - [ ] 파일 양식, 문자, 메일, 배너 관리 기능 구현

7. **게시글 관리 추가** ✅ (준비중 페이지 완료)
   - [x] 신규 메뉴 생성 (준비중 페이지)
   - [ ] 카테고리, 공지사항, FAQ, 문의하기 관리 기능 구현

8. **로그 관리 추가** ✅ (준비중 페이지 완료)
   - [x] 신규 메뉴 생성 (준비중 페이지)
   - [ ] 로그 데이터 조회 기능 구현

### Phase 3: 통합 및 정리 (우선순위 낮음)

9. **실적 통계 통합**
   - 교육실적 관리, 예산 및 실적 관리 통합
   - v2 버전 제거 또는 통합

10. **후원사 관리 정리**
    - 검색 기능 추가
    - 명칭 검토

---

## 🔗 라우팅 경로 변경

### 경로 매핑 테이블

| 현재 경로 | 새로운 경로 | 비고 |
|---------|-----------|------|
| `/` | `/home` 또는 `/` | 홈 |
| `/programs` | `/programs` | 프로그램 관리 (유지) |
| `/applications` | `/programs/applications` | 프로그램 관리 하위로 이동 |
| `/application-paths` | `/programs/application-paths` | 프로그램 관리 하위로 이동 |
| `/schedules` | `/programs/schedules` | 프로그램 관리 하위로 이동 |
| `/schedule-negotiations` | `/programs/schedule-negotiations` | 프로그램 관리 하위로 이동 |
| `/matchings` | `/programs/matchings` | 프로그램 관리 하위로 이동 |
| `/users` | `/members` | 회원 관리로 통합 |
| `/schools` | `/members/schools` | 회원 관리 하위로 이동 |
| `/instructors` | `/instructors` | 강사단 관리 (유지) |
| `/settlements` | `/instructors/settlements` | 강사단 관리 하위로 이동 |
| `/settlements/monthly` | `/instructors/settlements/monthly` | 강사단 관리 하위로 이동 |
| `/settlements/calculation-settings` | `/instructors/settlements/calculation-settings` | 강사단 관리 하위로 이동 |
| `/interviews` | `/instructors/interviews` 또는 `/volunteers/interviews` | 역할에 따라 분리 |
| `/sponsors` | `/sponsors` | 후원사 관리 (유지) |
| `/education-records` | `/performance` | 실적 통계로 통합 |
| `/education-records-v2` | `/performance` | 실적 통계로 통합 (v2 제거) |
| `/performance` | `/performance` | 실적 통계 (유지) |
| `/reports` | `/programs/reports` 또는 `/reports` | 검토 필요 |
| - | `/volunteers` | 봉사단 관리 (신규) |
| - | `/templates` | 템플릿 관리 (준비중 페이지) ✅ |
| - | `/posts` | 게시글 관리 (준비중 페이지) ✅ |
| - | `/logs` | 로그 관리 (준비중 페이지) ✅ |

---

## 🔐 권한 설정

### 관리자(ADMIN) 권한 유지

모든 새로운 메뉴는 관리자(ADMIN) 권한으로만 접근 가능하도록 설정:

```typescript
allowedRoles: ['ADMIN']
```

### 권한별 메뉴 분리

- **강사단 관리**: 관리자만 접근
- **봉사단 관리**: 관리자만 접근
- **템플릿 관리**: 관리자만 접근
- **게시글 관리**: 관리자만 접근
- **로그 관리**: 관리자만 접근

---

## 📌 주의사항

1. **기존 라우팅 경로 호환성**
   - 기존 경로를 사용하는 외부 링크나 북마크가 있을 수 있음
   - 리다이렉트 처리 필요

2. **데이터 마이그레이션**
   - 메뉴 구조 변경에 따른 데이터 구조 변경 필요 여부 확인
   - 기존 데이터와의 호환성 유지

3. **권한 검증**
   - 모든 새로운 경로에 대한 권한 검증 로직 추가
   - 기존 권한 검증 로직 업데이트

4. **테스트**
   - 각 메뉴 이동 시 정상 동작 확인
   - 권한별 접근 제어 테스트
   - 라우팅 경로 변경 테스트

---

## ✅ 체크리스트

### Phase 1: 구조 정리
- [ ] 홈 메뉴 정리 및 기능 추가
- [ ] 프로그램 관리 확장 및 하위 메뉴 통합
- [ ] 회원 관리 통합
- [ ] 강사단 관리 통합

### Phase 2: 신규 메뉴 추가
- [ ] 봉사단 관리 추가
- [x] 템플릿 관리 추가 (준비중 페이지)
- [x] 게시글 관리 추가 (준비중 페이지)
- [x] 로그 관리 추가 (준비중 페이지)

### Phase 3: 통합 및 정리
- [ ] 실적 통계 통합
- [ ] 후원사 관리 정리
- [ ] 라우팅 경로 변경 및 리다이렉트 처리
- [ ] 권한 설정 업데이트
- [ ] 테스트 완료

---

**마지막 업데이트**: 2025-01-XX
