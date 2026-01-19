# 현재 구현 vs 요구사항 비교

기준 문서: `requirements.md`

## 1) 현재 구현 개요(코드 기준)
- 역할: `ADMIN / INSTRUCTOR / STUDENT / VOLUNTEER` (요구사항의 **학교/개인 분리**, **관리자 계층** 미반영)
  - 근거: `src/types/user.ts`
- 로그인: 역할 선택 + mock 로그인 (회원가입/동의 플로우 없음)
  - 근거: `src/pages/auth/login-page.tsx`, `src/entities/user/api/auth-service.ts`
- 관리자 메뉴/화면 다수 존재하나 대부분 **Mock 기반 UI**
  - 프로그램/신청/매칭/정산/템플릿/게시판/후원사 등
- 관리자 홈 위젯: 알림 리스트, 전체 프로그램 진행 현황 등 일부 구현
  - 근거: `src/features/dashboard/ui/*`, `src/shared/config/dashboard-config.ts`
- 설문/로그 관리: 메뉴/라우팅은 있으나 **준비중 페이지**
  - 근거: `src/pages/surveys/survey-list-page.tsx`, `src/pages/logs/log-list-page.tsx`

## 2) 요구사항 대비 갭 요약
- **P1 기능 대부분은 미구현 또는 UI 수준**이며, 실제 승인/권한/다운로드/정산/보안은 미구현
- 핵심 불일치:
  - 사용자 유형: **학교/개인 분리 없음**, 봉사자 역할 존재(요구사항은 삭제)
  - 관리자 권한: **마스터/관리자/일반 + 담당자/파트너/보조** 체계 미구현
  - MFA/보안/다운로드 통제/감사로그 등 NFR P1 미구현

## 3) 기능 요구사항(FR) 비교
### B. 가입/로그인
- FR-B01 (P1) 가입 유형 선택: **미구현** (로그인만 존재)
- FR-B02 (P1) 약관/개인정보/마케팅 동의: **미구현**

### C. 프로그램(탐색/상세/신청)
- FR-C01 (P1) 신청 참여 페이지: **부분 구현(UI/Mock)**
  - 근거: `src/pages/programs/program-list-page.tsx`, `src/features/program/*`
- FR-C02 (P2) 상세 정보 구성: **부분 구현(UI/Mock)**
- FR-C03 (P1) 신청서 템플릿+커스터마이징: **부분 구현(UI/Mock)**
  - 근거: `src/features/application/*`, `src/pages/applications/application-form-page.tsx`
- FR-C04 (P1) 신청 결과/상태 안내: **부분 구현(UI/Mock)**

### D. 학교 진행조회
- FR-D01 (P2) 진행상황 타임라인: **미구현**

### E. 강사 마이페이지/일정/보고서/정산
- FR-E01 (P1) 강사 마이페이지 메뉴: **부분 구현(UI/Mock)**
- FR-E02 (P1) 캘린더 UX(목록/캘린더): **부분 구현(UI/Mock)**
- FR-E03 (P1) 강의보고서 제출: **부분 구현(UI/Mock)**

### F. 관리자 승인/매칭
- FR-F00 (P1) 회원 조회/다운로드: **부분 구현(UI/Mock)**
  - 근거: `src/pages/users/user-list-page.tsx`
- FR-F01/FR-F01-1 (P1) 신청 승인/반려: **부분 구현(UI/Mock)**
  - 근거: `src/pages/applications/*`, `src/features/application/*`
- FR-F02 (P1) 강의 신청 승인/마감/추가배정: **부분 구현(UI/Mock)**
- FR-F03 (P1) 매칭 현황/캘린더/엑셀: **부분 구현(UI/Mock)**
  - 근거: `src/pages/matchings/matching-list-page.tsx`

### G. 정산/지급
- FR-G01 (P1) 자동 산출: **부분 구현(UI/Mock)**
  - 근거: `src/pages/settlements/*`, `src/features/settlement/*`
- FR-G03 (P1) 지급조서/이체리스트: **부분 구현(UI/Mock)**

### H. 템플릿 관리
- FR-H01 (P1) 템플릿 복사/저장: **부분 구현(UI/Mock)**
  - 근거: `src/pages/templates/*`, `src/data/mock/templates.ts`

### I. 이슈
- FR-I01 (P0) 관리자 홈 템플릿 파일 404: **미확인(추가 검증 필요)**

## 4) 비기능 요구사항(NFR) 비교
### 인증/보안(P1)
- MFA, 레이트리밋, 세션 보호: **미구현**
- 서버 사이드 권한 검증: **미구현(프론트 가드만 존재)**
  - 근거: `src/shared/components/protected-route.tsx`

### 접근통제/다운로드 통제(P1)
- RBAC+ACL, 권한요청/승인 워크플로우: **미구현**
- 다운로드 마스킹/대량 통제: **미구현**

### 로그/감사/암호화(P1)
- 감사 로그/무결성/암호화/키관리: **미구현**

## 5) 역할/권한 불일치 정리
- 요구사항: 개인/학교/강사 + 관리자(마스터/관리자/일반)
- 현재: ADMIN/INSTRUCTOR/STUDENT/VOLUNTEER
- 학교 계정 모델/플로우 부재, 봉사자 역할 제거 요구 미반영

## 6) 정리
- 현재 구현은 **UI 중심 + Mock 데이터 기반**이며, 요구사항의 **핵심 운영 기능과 보안/권한 체계는 대부분 미구현**입니다.
- MVP 범위를 `MVP/` 문서로 세분화했으니, 단계별로 갭을 줄이는 방식이 현실적입니다.
