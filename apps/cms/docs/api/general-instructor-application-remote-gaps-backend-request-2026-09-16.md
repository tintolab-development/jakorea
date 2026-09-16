# 일반 프로그램 강사 신청 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16  
**우선순위:** P1  
**대상:** 일반 프로그램 상세 → 강사 신청 목록 · 강사 신청 상세  
**범위:** 일반 프로그램 기관·개인 참여 모드의 **강사 신청** (Gemini 강사 신청 API와 별도)  
**관련:** [programs-api-integration.md](./programs-api-integration.md) · [general-participant-application-screening-remote-gaps-backend-request-2026-09-16.md](./general-participant-application-screening-remote-gaps-backend-request-2026-09-16.md)

FE에서 즉시 연동한 항목(목록 조회 · 단건/일괄 승인·반려 · 상세 승인/반려 호출 · unmask용 `instructorMemberId` 매핑)과 별도로, **서버 계약·응답 보완이 필요한 항목**을 LNB 기준으로 정리한다.

---

## LNB 기준 remote 보완 요약

### 강사 신청 목록

- 목록 페이지네이션·서버 필터 보완 필요 (현재 FE `page=0, size=50` 고정 · OpenAPI query는 `status`/`page`/`size`만 · FE는 `status`도 미전달·클라이언트 필터)
- 목록 응답 필드 부족 (자택 주소지 · JA 강의 경력 · **JA 평가 등급** · 연락처·이메일 등 테이블용. ※ `instructorFeeGradeSnapshot`(강사비 등급)은 이미 존재·매핑됨 — JA 평가 등급과 별개)
- 승인/반려 알림 발송 시점 request 미지원 (단건·일괄 공통)

### 강사 신청 목록 > 강사 신청 상세

- 상세 조회 API 부재 (`GET …/instructor-applications/{applicationId}`)
- 승인 취소 API 부재 (`POST …/cancel-approval`)
- 반려 취소 API 부재 (`POST …/cancel-rejection`)
- 신청 건별 관리자 코멘트 저장 API 부재
- 승인 시 강사비·강의 배정 payload 미지원 (FE 모달 수집값 → BE 미수용)
- 승인/반려 알림 옵션 request 미지원
- unmask 응답 → 상세 필드 매핑 계약 필요
- 상세 본문 enrich 필요 (이력서·학력·경력·자격 · 한줄소개 등 — 목록 DTO만으로는 공란)
- (추가) 강의 배정 모달용 희망 기관/희망 일정 필드 부재 (`preferredSchools` / `preferredScheduleSlots`)

---

## 1) 목록 — 페이지네이션·필터·표시 필드

### 현황 (FE)

| 기능 | API | 연동 |
|------|-----|------|
| 목록 조회 | `GET /api/admin/programs/{programId}/instructor-applications` | remote 실제 프로그램 연동 (FE seed는 mock). 항상 `page=0, size=50` |
| 일괄 승인 | `POST /api/admin/instructor-applications/bulk-approve` | 연동 (선택 ≥2 · 숫자 ID) |
| 일괄 반려 | `POST /api/admin/instructor-applications/bulk-reject` | 연동 |

### OpenAPI 목록 DTO에 **이미 있는** 필드 (FE 매핑됨)

- `id` · `programId` · `instructorMemberId` · `instructorName` · `applicationStatus`
- `instructorFeeGradeSnapshot` → UI `instructorFeeGradeLabel` (**강사비 등급**, JA 평가와 다름)
- `submittedAt` · `rejectReason` · `distanceKm` · `longDistance`
- `availableScheduleMemo` — OpenAPI에 있으나 **FE 미사용**

### 서버 보완 요청

1. **페이지네이션**  
   `totalElements` / `totalPages`를 안정적으로 반환하고, FE 테이블 페이지와 연동 가능하도록. 현재 FE가 1페이지(50건)만 가져와 초과 건 누락 위험.

2. **서버 필터**  
   - OpenAPI `status`는 있으나 FE는 미사용(클라이언트 필터). 서버 `status` 필터를 FE가 쓰도록 맞추거나 문서화.  
   - UI 필터와 대응되는 query 추가 권장: 이름 검색 · (가능 시) JA 강의 경력 · JA 평가 등급 · 지역/주소.

3. **목록 응답 필드 (테이블 컬럼용 — 현재 공란/미제공)**  
   - 자택 주소지(또는 마스킹 주소) → `address`
   - JA 강의 경력(년수) → `lectureExperienceYears`
   - **JA 평가 등급** → `evaluationGrade` (※ `instructorFeeGradeSnapshot`과 혼동 금지)
   - 연락처·이메일(목록은 마스킹 허용)
   - `instructorMemberId` **항상** 포함 (unmask·코멘트 전제)

4. **강의 배정 모달용 (목록 또는 상세)**  
   - 기관 프로그램: `preferredSchools` (희망 기관·일정)  
   - 개인 프로그램: `preferredScheduleSlots`  
   - 또는 `availableScheduleMemo`를 구조화해 FE가 파싱 가능하도록 계약

---

## 2) 상세 조회

### 현황 (FE)

상세 전용 GET 없음. 목록 row를 URL `applicantId`로 매칭해 표시. remote 목록 DTO가 얇아 연락처·주소·이력서 등 공란.

### 서버 보완 요청

1. **상세 GET**  
   예: `GET /api/admin/instructor-applications/{applicationId}`  
   상세 화면 필드 · `instructorMemberId` · 승인 상태 · 반려 사유 · 강사비 스냅샷 · 이력서(학력·경력·자격) · 기본 프로필 · 희망 배정 정보 포함.

2. **목록 enrich (대안)**  
   상세 GET 전에도 목록 항목에 상세 필수 최소 필드를 채우면 FE 공란을 줄일 수 있음. 장기적으로는 상세 GET 권장.

---

## 3) 승인 · 반려 · 취소

### 현황 (FE)

| 기능 | API | 연동 |
|------|-----|------|
| 단건 승인 | `POST …/instructor-applications/{id}/approve` | 목록·**상세** 연동 (상세는 강의배정→강사비 모달 후 **body 없이** 호출) |
| 단건 반려 | `POST …/{id}/reject` (`reason`만) | 목록·**상세** 연동 |
| 일괄 승인/반려 | `bulk-approve` / `bulk-reject` | 목록 연동 (알림·강사비·배정 없음) |
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
   승인·반려·취소(및 가능하면 bulk) request에 FE 모달 값 수용.  
   FE 현재 enum:
   - `notifyTiming`: `immediate` | `on_announcement` | `manual`
   - `manualNotifyAt`: `manual`일 때 예약 시각  
   BE가 `IMMEDIATE`/`SCHEDULED`만 쓸 경우 매핑표를 OpenAPI에 명시.

4. **승인 부가 정보**  
   FE 승인 플로우(상세): 강의 배정 모달 → 강사비 모달(기준·금액·등급) 후 approve 호출.  
   현재 OpenAPI approve는 bare POST라 해당 값이 서버에 저장되지 않음.  
   approve body(또는 승인 직후 PATCH)에 배정·강사비 payload 계약 추가 필요.  
   - 기관형: 선택 기관·회차 배정  
   - 개인형: 선택 일정 슬롯 배정  
   - 강사비: 기준·금액·등급 스냅샷

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
   연락처·이메일·주소·정산 계좌·(가능 시) 학력/경력 원문 키를 문서화.  
   (현재 FE는 열람 성공 시 마스킹 해제 플래그만 올리고, 응답 필드로 row를 재채우지는 않음 — 계약 확정 후 반영)

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
- [x] 상세 승인·반려 모달 → `approve` / `reject` + query invalidate
- [x] 목록 adapter에 `instructorMemberId` · `programId` · `instructorFeeGradeSnapshot` 매핑
- [x] 개인정보 상세보기 → `instructorMemberId` 있을 때 instructor unmask 호출

서버 대기 (FE mock 유지):

- 상세 GET / 본문 enrich · 희망 배정 필드
- 승인 취소 · 반려 취소
- 신청 건별 코멘트 저장
- 승인·반려·취소·bulk 알림 옵션 계약
- 승인 시 강사비·강의 배정 영속화
- 목록 페이지네이션·서버 필터 · 주소/JA경력/JA평가등급 등 표시 필드

---

## 수락 기준 (종합)

- [ ] 강사 신청 목록 50건 초과·이름/상태 필터가 서버와 일치 (`totalElements` 반영)
- [ ] 목록에 주소·JA 강의 경력·**JA 평가 등급**·`instructorMemberId` 표시/전달 (강사비 등급과 구분)
- [ ] 상세 GET(또는 enrich)로 기본정보·이력서·희망 배정 공란 해소
- [ ] 승인 취소·반려 취소 API + FE 연동 가능
- [ ] approve/reject(+취소·가능 시 bulk)에 알림 옵션 수용 (`immediate`/`on_announcement`/`manual` + `manualNotifyAt`)
- [ ] approve에 강사비·강의 배정 payload 영속화
- [ ] 신청 건별 코멘트 저장·재조회
- [ ] unmask 후 상세 PII 필드 계약으로 FE 반영 가능

**Last updated:** 2026-09-16 (서버 전달 전 최종 검토)
