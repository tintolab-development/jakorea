# 사용자 강사 권한 페이지 카테고리 정리 및 뎁스 변경 마이그레이션 가이드

**작성 일자**: 2025-01-XX  
**목적**: IA 구조에 맞춰 사용자 강사 권한 페이지 카테고리 정리 및 뎁스 변경  
**대상**: 사용자 강사(INSTRUCTOR) 권한 메뉴 구조

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
2. 진행 프로그램 (강의)
3. 마이페이지 (My Page)
4. 공지사항 (Notice)

---

## 📊 현재 구조 분석

현재 사용자 강사(INSTRUCTOR) 메뉴는 대부분 비활성화되어 있음:
- 마이페이지(`/mypage`) 비활성화
- 이력 목록(`/histories`) 비활성화
- 정산 관련(`/settlements/my/*`) 비활성화

구현되어 있는 페이지:
- `/programs/my`, `/programs/favorites`
- `/settlements/my`, `/settlements/my/submit`, `/settlements/my/monthly`, `/settlements/my/:id`
- `/histories`, `/histories/:id`
- `/mypage`

---

## 🔄 매핑 관계

| IA 1뎁스 | 현재 메뉴 | 상태 | 비고 |
| --- | --- | --- | --- |
| 홈 | `/` | 매핑 | 대시보드 |
| 진행 프로그램 (강의) | `/programs` | 매핑 | 강사용 필터 필요 |
| 마이페이지 | `/mypage` | 비활성 | 활성화 및 하위 구조 확장 |
| 공지사항 | 없음 | 신규 | FAQ/문의하기 포함 |

### IA 하위 구조
- 홈: 검색, 알림 리스트, 내 강의 현황, 배너
- 진행 프로그램: 검색/필터, 프로그램 목록(개인/단체 탭), 중복 신청 알럿(Case1/Case2)
- 마이페이지:
  - 개인정보 관리 → 개인정보 관리, 강사 이력 관리
  - 프로그램 관리 → 강의 프로그램, 프로그램 상세 이력/현황, 만족도 조사, 관심 프로그램 관리, 프로그램 상세(정산 이력/현황 포함)
- 공지사항: FAQ, 문의하기

---

## 📝 변경 사항 상세

### 1. 홈
- 대시보드 유지, 검색/알림/진행현황/배너 섹션 추가

### 2. 진행 프로그램 (강의)
- `/programs` 이름 변경, 강사용 필터
- 개인/단체 탭 구분
- 중복 신청 알럿
  - Case1: 동일 정보 신청 이력
  - Case2: 학교명 동일 + 학년/날짜/신청자 중 하나 다른 경우  
    예: “아래와 같이 해당 학교명으로 신청된 이력이 있습니다. [OOO학교 / 2학년 대상 / MM.DD.HH 진행 희망] 추가 신청하시겠습니까?”
- 수강자 모집 완료 프로그램만 노출

### 3. 마이페이지
- 개인정보 관리: `/mypage/profile` (추가 구현 필요)
- 강사 이력 관리: `/histories`
- 프로그램 관리: `/programs/my`, `/programs/favorites`
- 정산 이력/현황: `/settlements/my` (탭/필터 통합 페이지)

### 4. 공지사항
- FAQ `/posts/faq`, 문의하기 `/posts/inquiries`

---

## 🗺️ 마이그레이션 계획

### Phase 1: 기본 구조 활성화
- 마이페이지 활성화
- 홈 검색/알림/현황 섹션 추가
- 진행 프로그램 강사용 필터

### Phase 2: 마이페이지 하위
- 개인정보 관리 페이지 스텁
- 강사 이력 관리 `/histories` 연동
- 프로그램 관리 메뉴 구성

### Phase 3: 정산 이력/현황
- 통합 페이지(탭) + 상태별 목록/신청/상세

### Phase 4: 추가 기능 ✅
- 프로그램 상세 이력/현황 (`/programs/my/:id/history`)
- 만족도 조사 (`/programs/satisfaction`)
- 관심 프로그램 관리 (이미 구현됨)
- 공지사항/FAQ/문의하기 페이지 (이미 구현됨)

---

## 🔗 라우팅 경로 변경

| IA 경로 | 새로운 경로 | 비고 |
| --- | --- | --- |
| `/` | `/` | 홈 |
| `/programs` | `/programs` | 진행 프로그램 |
| `/mypage` | `/mypage` | 마이페이지 |
| `/mypage/profile` | `/mypage/profile` | 개인정보 관리 |
| `/mypage/history` | `/histories` | 강사 이력 관리 |
| `/mypage/programs` | `/programs/my` | 강의 프로그램 |
| `/mypage/programs/:id` | `/programs/my/:id` | 강의 프로그램 상세 |
| `/mypage/programs/:id/history` | `/programs/my/:id/history` | 프로그램 상세 이력/현황 |
| `/mypage/programs/satisfaction` | `/programs/satisfaction` | 만족도 조사 |
| `/mypage/programs/favorites` | `/programs/favorites` | 관심 프로그램 |
| `/mypage/programs/:id/settlements` | `/settlements/my` | 정산 이력/현황 |
| `/notices` | `/notices` | 공지사항 |
| `/notices/faq` | `/posts/faq` | FAQ |
| `/notices/inquiry` | `/posts/inquiries` | 문의하기 |

---

## 🔐 권한 설정

- 공지/FAQ/문의하기: INSTRUCTOR/VOLUNTEER/STUDENT
- 마이페이지/프로그램/정산: INSTRUCTOR 위주, 일부 VOLUNTEER/STUDENT 포함
- 관리자 메뉴: `allowedRoles: ['ADMIN']`

---

## 📌 주의사항

1. 기존 경로 리다이렉트 (`/settlements/my/*` 등)
2. 정산 메뉴 깊이 축소(통합 탭) 권고
3. 권한별 접근 분리(관리자 vs 사용자)

---

## ✅ 체크리스트

- [x] 마이페이지 활성화
- [x] 진행 프로그램 강사용 필터/탭/중복 신청 알럿
- [x] 개인정보 관리 페이지 스텁
- [x] 강사 이력 관리 `/histories` 연동
- [x] 정산 이력/현황 탭 페이지
- [x] 공지사항/FAQ/문의하기 페이지 연결
- [x] 프로그램 상세 이력/현황 페이지 (`/programs/my/:id/history`)
- [x] 만족도 조사 페이지 (`/programs/satisfaction`)

