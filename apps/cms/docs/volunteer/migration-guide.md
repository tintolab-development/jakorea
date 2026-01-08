# 봉사단 권한 페이지 카테고리 정리 및 뎁스 변경 마이그레이션 가이드

**작성 일자**: 2025-01-XX  
**목적**: IA 구조에 맞춰 봉사단 권한 페이지 카테고리 정리 및 뎁스 변경  
**대상**: 봉사단(VOLUNTEER) 권한 메뉴 구조

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

### IA 1뎁스 카테고리

1. 홈 (Home)
2. 진행 프로그램 (봉사)
3. 봉사단 (Volunteers)
4. 마이페이지 (My Page)
5. 공지사항 (Notice)

---

## 📊 현재 구조 분석

현재 봉사단(VOLUNTEER) 메뉴 상태:
- 봉사단 메뉴는 있지만 children이 없음
- 마이페이지는 INSTRUCTOR와 공유하지만 일부 기능은 INSTRUCTOR 전용
- 봉사 프로그램 관련 페이지는 관리자용으로만 존재

구현되어 있는 페이지:
- `/programs/favorites` (관심 프로그램 관리)
- `/mypage/profile` (개인정보 관리)
- `/notices`, `/posts/faq`, `/posts/inquiries` (공지사항)

---

## 🔄 매핑 관계

| IA 1뎁스 | 현재 메뉴 | 상태 | 비고 |
| --- | --- | --- | --- |
| 홈 | `/` | 매핑 | 대시보드 |
| 진행 프로그램 (봉사) | `/programs` | 매핑 | 봉사자용 필터 필요 |
| 봉사단 | 없음 | 신규 | 봉사 프로그램 목록 등 |
| 마이페이지 | `/mypage` | 부분 활성 | 하위 구조 확장 필요 |
| 공지사항 | `/notices` | 매핑 | FAQ/문의하기 포함 |

### IA 하위 구조
- 홈: 검색, 알림 리스트, 내 봉사 현황, 배너
- 진행 프로그램: 검색/필터, 프로그램 목록(개인/단체 탭), 중복 신청 알럿
- 봉사단:
  - 봉사 프로그램 목록
  - 봉사 프로그램 상세
- 마이페이지:
  - 개인정보 관리 → 개인정보 관리, 봉사 이력 관리
  - 프로그램 관리 → 관심 프로그램 관리
- 공지사항: FAQ, 문의하기

---

## 📝 변경 사항 상세

### 1. 홈
- 대시보드 유지, 검색/알림/봉사현황/배너 섹션 추가

### 2. 진행 프로그램 (봉사)
- `/programs` 이름 변경, 봉사자용 필터
- 개인/단체 탭 구분
- 중복 신청 알럿 (강사와 동일한 로직)
- 수강자 모집 완료 프로그램만 노출

### 3. 봉사단
- 봉사 프로그램 목록: `/volunteers/programs` (또는 `/programs/volunteer`)
- 봉사 프로그램 상세: `/volunteers/programs/:id`

### 4. 마이페이지
- 개인정보 관리: `/mypage/profile` (공유)
- 봉사 이력 관리: `/histories` (또는 `/volunteers/histories`)
- 프로그램 관리: `/programs/favorites` (관심 프로그램 관리)

### 5. 공지사항
- FAQ `/posts/faq`, 문의하기 `/posts/inquiries`

---

## 🗺️ 마이그레이션 계획

### Phase 1: 기본 구조 활성화 ✅
- [x] 봉사단 메뉴 하위 구조 추가
- [ ] 홈 검색/알림/현황 섹션 추가
- [ ] 진행 프로그램 봉사자용 필터

### Phase 2: 봉사단 메뉴 구성 ✅
- [x] 봉사 프로그램 목록 페이지 (`/volunteers/my/programs`)
- [x] 봉사 프로그램 상세 페이지 (ProgramDetailDrawer 활용)
- [x] 봉사 프로그램 관련 라우팅

### Phase 3: 마이페이지 하위 구조 ✅
- [x] 봉사 이력 관리 페이지 (기존 `/histories` 활용, 권한별 카테고리명 표시)
- [x] 관심 프로그램 관리 확인 (`/programs/favorites`)

### Phase 4: 추가 기능
- [ ] 봉사 프로그램 신청 플로우
- [ ] 봉사 이력 관리 기능
- [ ] 대시보드 봉사 현황 위젯

---

## 🔗 라우팅 경로 변경

| IA 경로 | 새로운 경로 | 비고 |
| --- | --- | --- |
| `/` | `/` | 홈 |
| `/programs` | `/programs` | 진행 프로그램 (봉사) |
| `/volunteers/programs` | `/volunteers/programs` | 봉사 프로그램 목록 |
| `/volunteers/programs/:id` | `/volunteers/programs/:id` | 봉사 프로그램 상세 |
| `/mypage` | `/mypage` | 마이페이지 |
| `/mypage/profile` | `/mypage/profile` | 개인정보 관리 |
| `/histories` | `/histories` 또는 `/volunteers/histories` | 봉사 이력 관리 |
| `/programs/favorites` | `/programs/favorites` | 관심 프로그램 관리 |
| `/notices` | `/notices` | 공지사항 |
| `/posts/faq` | `/posts/faq` | FAQ |
| `/posts/inquiries` | `/posts/inquiries` | 문의하기 |

---

## 🔐 권한 설정

### VOLUNTEER 권한만 접근 가능
- `/volunteers/programs` (봉사 프로그램 목록)
- `/volunteers/programs/:id` (봉사 프로그램 상세)
- `/volunteers/histories` (봉사 이력 관리, 별도 구현 시)

### VOLUNTEER, INSTRUCTOR, STUDENT 공유
- `/programs` (진행 프로그램)
- `/programs/favorites` (관심 프로그램 관리)
- `/mypage/profile` (개인정보 관리)
- `/notices`, `/posts/faq`, `/posts/inquiries` (공지사항)

### VOLUNTEER 접근 불가
- `/programs/my` (강의 프로그램 - INSTRUCTOR 전용)
- `/programs/satisfaction` (만족도 조사 - INSTRUCTOR 전용)
- `/settlements/my` (정산 이력/현황 - INSTRUCTOR 전용)

---

## 📌 참고사항

1. **강사(INSTRUCTOR)와의 차이점**:
   - 정산 기능 없음
   - 강의 프로그램 대신 봉사 프로그램
   - 만족도 조사는 프로그램별로 다를 수 있음

2. **공통 기능**:
   - 관심 프로그램 관리
   - 개인정보 관리
   - 공지사항/FAQ/문의하기

3. **향후 확장 가능성**:
   - 봉사 시간 관리
   - 봉사 인증서 발급
   - 봉사 활동 보고서

---

## ✅ 체크리스트

### Phase 1: 기본 구조 활성화
- [ ] 봉사단 메뉴 children 추가
- [ ] 대시보드 봉사 현황 위젯 추가
- [ ] 진행 프로그램 봉사자 필터 적용

### Phase 2: 봉사단 메뉴 구성
- [ ] 봉사 프로그램 목록 페이지 구현
- [ ] 봉사 프로그램 상세 페이지 구현
- [ ] 라우팅 설정

### Phase 3: 마이페이지 하위 구조
- [ ] 봉사 이력 관리 페이지 확인/구현
- [ ] 관심 프로그램 관리 확인

### Phase 4: 추가 기능
- [ ] 봉사 프로그램 신청 플로우
- [ ] 봉사 이력 관리 기능
- [ ] 테스트 및 검증
