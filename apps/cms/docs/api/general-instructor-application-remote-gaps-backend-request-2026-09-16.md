# 일반 프로그램 강사 신청 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16  
**우선순위:** P1  
**대상:** 일반 프로그램 상세 → 강사 신청 목록 · 강사 신청 상세  
**관련:** [programs-api-integration.md](./programs-api-integration.md) · [general-participant-application-screening-remote-gaps-backend-request-2026-09-16.md](./general-participant-application-screening-remote-gaps-backend-request-2026-09-16.md)

FE에서 즉시 연동한 항목(목록 조회 · 단건/일괄 승인·반려 · 상세 승인/반려 호출 · unmask용 `instructorMemberId` 매핑)과 별도로, **서버 계약·응답 보완이 필요한 항목**을 LNB 기준으로 정리한다.

---

## LNB 기준 remote 보완 요약

### 강사 신청 목록

- 목록 페이지네이션·서버 필터 보완 필요 (현재 FE `page=0, size=50` 고정 · OpenAPI는 `status`/`page`/`size`만)
- 목록 응답 필드 부족 (자택 주소지 · JA 강의 경력 · JA 평가 등급 · 연락처·이메일 등 테이블·필터용)
- 승인/반려 알림 발송 시점(즉시·예약) request 미지원

### 강사 신청 목록 > 강사 신청 상세

- 상세 조회 API 부재 (`GET …/instructor-applications/{applicationId}`)
- 승인 취소 API 부재 (`POST …/cancel-approval`)
- 반려 취소 API 부재 (`POST …/cancel-rejection`)
- 신청 건별 관리자 코멘트 저장 API 부재
- 승인 시 강사비·강의 배정 payload 미지원 (FE 모달 수집값 → BE 미수용)
- 승인/반려 알림 옵션(`notifyTiming`, `scheduledAt`) request 미지원
- unmask 응답을 상세 필드에 반영할 데이터 계약 필요 (연락처·이메일·주소·계좌 등)
- 상세 본문 enrich 필요 (이력서·학력·경력·자격 · 한줄소개 등 — 목록 DTO만으로는 공란)

---

## 1) 목록 — 페이지네이션·필터·표시 필드

### 현황 (FE)

| 기능 | API | 연동 |
|------|-----|------|
| 목록 조회 | `GET /api/admin/programs/{programId}/instructor-applications` | remote 실제 프로그램 연동 (FE seed는 mock) |
| 일괄 승인 | `POST /api/admin/instructor-applications/bulk-approve` | 연동 (선택 ≥2 · 숫자 ID) |
| 일괄 반려 | `POST /api/admin/instructor-applications/bulk-reject` | 연동 |

### 서버 보완 요청

1. **페이지네이션**  
   `totalElements` / `totalPages`와 FE 테이블 페이지 연동 가능하도록 안정적 페이징. 50건 초과 시 누락 방지.

2. **서버 필터**  
   이름 검색 · 승인 상태 · (가능 시) JA 강의 경력·평가 등급 등 UI 필터와 대응되는 query 파라미터.

3. **목록 응답 필드**  
   테이블 컬럼에 쓰는 값 제공:
   - 자택 주소지(또는 마스킹 주소)
   - JA 강의 경력(년수 또는 구간 라벨)
   - JA 평가 등급
   - `instructorMemberId` **항상** 포함 (unmask·코멘트 전제)

---

## 2) 상세 조회

### 현황 (FE)

상세 전용 GET 없음. 목록 row를 URL `applicantId`로 매칭해 표시. remote 목록 DTO가 얇아 연락처·주소·이력서 등 공란.

### 서버 보완 요청

1. **상세 GET**  
   예: `GET /api/admin/instructor-applications/{applicationId}`  
   상세 화면 필드 · `instructorMemberId` · 승인 상태 · 반려 사유 · 강사비 스냅샷 · 이력서(학력·경력·자격) · 기본 프로필 포함.

2. **목록 enrich (대안)**  
   상세 GET 전에도 목록 항목에 상세 필수 최소 필드를 채우면 FE 공란을 줄일 수 있음. 장기적으로는 상세 GET 권장.

---

## 3) 승인 · 반려 · 취소

### 현황 (FE)

| 기능 | API | 연동 |
|------|-----|------|
| 단건 승인 | `POST …/instructor-applications/{id}/approve` | 목록·**상세** 연동 (상세는 강의배정→강사비 모달 후 호출) |
| 단건 반려 | `POST …/instructor-applications/{id}/reject` (`reason`) | 목록·**상세** 연동 |
| 일괄 승인/반려 | `bulk-approve` / `bulk-reject` | 목록 연동 |
| 승인 취소 | — | UI·mock만 |
| 반려 취소 | — | UI·mock만 |

※ 강사는 참여자 `document-result` 단계가 없음. UI 「서류 승인/반려」= 신청 `approve`/`reject`.

### 서버 보완 요청

1. **승인 취소**  
   `POST /api/admin/instructor-applications/{applicationId}/cancel-approval`  
   (기관 신청 `organization-applications/.../cancel-approval`과 동일 패턴)  
   body: 취소 사유 · (가능 시) 알림 옵션.

2. **반려 취소**  
   `POST /api/admin/instructor-applications/{applicationId}/cancel-rejection`  
   (기관·참여자 cancel-rejection과 동일 패턴).

3. **알림 옵션**  
   승인·반려·취소 request에 `notifyTiming` (`IMMEDIATE` | `SCHEDULED`) · `scheduledAt` 수용.  
   현재 FE 모달은 수집하나 API body에 실을 필드 없음. approve는 body 없음, reject는 `reason`만.

4. **승인 부가 정보 (선택·제품 확정 후)**  
   FE 승인 플로우는 강의 배정·강사비(기준·금액·등급)를 모달에서 수집.  
   OpenAPI approve가 bare POST이면 해당 값은 서버에 저장되지 않음.  
   필요 시 approve(또는 후속 PATCH)에 배정·강사비 payload 계약 추가.

---

## 4) 개인정보 상세보기 (unmask)

### 현황 (FE)

| 기능 | API | 연동 |
|------|-----|------|
| 강사 회원 unmask | `POST /api/admin/users/{memberId}/instructor/privacy/unmask` | `instructorMemberId` 있을 때 호출 |

### 서버 보완 요청

1. **목록·상세에 `instructorMemberId` 필수**  
   없으면 FE는 로컬 마스킹 토글만 하고 unmask를 호출하지 못함.

2. **unmask 응답 ↔ 상세 필드 매핑 계약**  
   연락처·이메일·주소·정산 계좌 등 상세에 채울 원문 키를 문서화.  
   (현재 FE는 열람 성공 시 마스킹 해제 플래그만 올리고, 응답 필드로 row를 재채우지는 않음 — 계약 확정 후 반영 가능)

---

## 5) 관리자 코멘트

### 현황 (FE)

신청 건별 `managerComment` UI는 mock 저장(`patchApplicantInstructorDetail`).  
회원 `GET/POST /api/admin/users/{memberId}/comments`는 **회원 상세용**이며, 신청 건별 코멘트와 저장 경로가 분리되어 있음.

### 서버 보완 요청

1. **신청 건별 코멘트 API**  
   예: `GET/PATCH /api/admin/instructor-applications/{applicationId}/admin-comment`  
   또는 상세 GET/PATCH에 `adminComment`/`managerComment` 필드 포함.  
   회원 comments API로 대체하지 말 것(회원 단위 이력과 신청 건 코멘트 혼선).

---

## FE 즉시 연동 (서버 대기와 병행)

서버 갭과 무관하게 FE에서 진행한 항목:

- [x] 목록 조회 remote
- [x] 목록 선택/일괄 승인·반려 → 단건 또는 bulk API
- [x] 상세 서류 승인·반려 모달 → `approve` / `reject` + query invalidate
- [x] 목록 adapter에 `instructorMemberId` · `programId` 매핑
- [x] 개인정보 상세보기 → `instructorMemberId` 있을 때 instructor unmask 호출

서버 대기 (FE mock 유지):

- 상세 GET / 본문 enrich
- 승인 취소 · 반려 취소
- 신청 건별 코멘트 저장
- 승인·반려·취소 알림 옵션 계약
- 승인 시 강사비·강의 배정 영속화
- 목록 페이지네이션·서버 필터·표시 필드 보강

---

## 수락 기준 (종합)

- [ ] 강사 신청 목록 50건 초과·이름 필터가 서버와 일치
- [ ] 목록에 주소·강의 경력·평가 등급·`instructorMemberId` 표시/전달
- [ ] 상세 GET(또는 enrich)로 기본정보·이력서 공란 해소
- [ ] 승인 취소·반려 취소 API + FE 연동 가능
- [ ] approve/reject(+취소)에 알림 옵션 수용
- [ ] 신청 건별 코멘트 저장·재조회
- [ ] unmask 후 상세 PII 필드 계약으로 FE 반영 가능

**Last updated:** 2026-09-16
