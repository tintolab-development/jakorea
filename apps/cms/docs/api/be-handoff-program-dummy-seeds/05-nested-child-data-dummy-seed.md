# 05 — 하위(신청·진행·중첩) 더미 시드 요청 (BE)

프로그램 **헤더만** 있으면 목록은 채워지지만, 상세 LNB·중첩 화면은 비어 있습니다.  
FE mock에 이미 있는 **행 단위 데이터**를 프로그램 id에 **명시 스코프**하여 시드해 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | 일반 · 1사1교 (UJAT/Gemini는 각 유형 문서 참고) |
| **FE SSOT** | `applicant-*.ts` · `general-*-mock.ts` · `participating-*.ts` · `school-detail-mock` 계열 |

> **중요:** 중첩 **저장 mutation** API가 아직 없으면 FE는 계속 mock UI를 탑니다.  
> 그래도 GET 목록·상세 읽기가 가능하도록 시드를 맞춰 두면 API 연동 후 바로 검증됩니다.  
> 갭 목록: coverage 문서 §3.2 N-01~N-09.

---

## 0. 스코프 규칙

1. 모든 하위 행에 `programId`(또는 BE PK)를 **필수**로 넣는다.
2. 일반 ACTIVE/COMPLETED 시드(`166401` 등 / FE type·lnb·calendar)에 우선 연결.
3. 1사1교는 **기관 3 + 강사 3** 상태가 FE·시드 MD에 고정 — 개인/봉사/출석/강의보고 **금지**.
4. 승인된 신청만 진행(participants)으로 승격.

---

## 1. 일반 — 신청 행

### 1.1 기관 신청 — FE `applicant-institutions.ts`

| 상태 | 프로그램당 권장 | 비고 |
|------|-----------------|------|
| pending / WAITING_REVIEW | ≥1 | SCHEDULED·RECRUITING |
| approved | ≥1 | ACTIVE/COMPLETED |
| rejected | ≥1 | 반려 사유 |

필드(FE 확장): 학교명 · 지역 · 학년 · 담당교사 · 교육장소/형태 · 교재 · 합반(일반만) · 성범죄 조회 첨부명 등.

**API:** `GET …/programs/{id}/organization-applications` + approve/reject

### 1.2 강사 신청 — FE `applicant-instructors.ts`

| 상태 | 권장 |
|------|------|
| pending | ≥1 |
| approved | ≥1 → 강사 배정·진행 목록 |
| rejected | ≥1 |

### 1.3 개인 신청 — FE `general-individual-applications-mock.ts`

개인 audience 프로그램(CASE-03/04/07/08/19~21)에만.

| 상태 | 권장 |
|------|------|
| WAITING_REVIEW | ≥1 |
| approved | ≥1 |
| rejected / withdrawn | 각 ≥0~1 |

면접 on CASE에는 면접 단계 상태도.

### 1.4 봉사자 신청 — FE `general-volunteer-applicants-mock.ts`

봉사 LNB가 있는 CASE에만.

| 단계 | 상태 샘플 |
|------|-----------|
| 서류 | 대기 / 합격 / 불합격 |
| 면접 배정 | 슬롯 1~2 + assignment |
| 최종 | 합격 / 불합격 / 포기 |

면접 슬롯: `GET/POST …/interview-slots` (GET OpenAPI 등재 요청 중)

---

## 2. 일반 — 진행 참여자

FE: `participating-schools.ts` · `participating-instructors.ts` · `participating-volunteers.ts` · `participating-individual-participants.ts`

| participantType | 권장 (ACTIVE 프로그램) | API |
|-----------------|------------------------|-----|
| ORGANIZATION | ≥2 (시드 MD: 학생명단 2명 언급과 맞춤) | `GET …/participants?participantType=` |
| INSTRUCTOR | ≥1 (승인 강사와 연결) | 동일 |
| VOLUNTEER | 봉사 CASE만 ≥1 | 동일 |
| INDIVIDUAL | 개인 audience만 | 동일 |

### 중첩에 필요한 추가 시드 (읽기라도)

| 영역 | FE mock | BE에 넣을 것 |
|------|---------|--------------|
| 학교 상세 · 학생명단 | `school-detail-mock` | roster 2명 |
| 학교 · 필요 강사 수 | FE `MOCK_REQUIRED_INSTRUCTORS=4` | 서버 필드 `requiredInstructorCount` 권장 |
| 학교 · 출석 | attendance mock | schedule별 출석 행 |
| 강사 · 기관배정 | assignment mock | school↔instructor link |
| 강사 · 강의보고 | lecture report | SUBMITTED 1건 (COMPLETED) |
| 강사 · 정산 | settlement mock | 상태 1~2종 (1사1교는 장거리) |
| 개인 · 과제 | assignment mock | **과제 API 없으면 메타만이라도** |

---

## 3. 1사1교 — 신청 고정 패턴

프로그램당 (**CS-01~08 전부**):

| 리소스 | 건수 | 상태 |
|--------|------|------|
| 기관 신청 | 3 | 검토대기 1 · 승인 1 · 반려 1 |
| 강사 신청 | 3 | 대기 1 · 승인 1 · 반려 1 |

승인 강사 → participants + assignment.  
**CS-06:** 승인 강사 `distanceKm=125.5`, `longDistance=true` (장거리 정산 검증).

제외: 개인 · 봉사 · 출석 · 강의보고 · 과제.

---

## 4. 설문 · 게시글 · 담당자 (공통)

| 리소스 | FE | BE |
|--------|-----|-----|
| 설문 응답 건수 | `general-survey-poll-responses-mock` · UJAT mock count | surveys responses/summary에 count>0 |
| 게시글 | `program-posts` | ACTIVE에 2건 (시드 MD) |
| 담당자 | `program-managers` | PM 1 + 파트너 1 (시드 MD 공통) |
| 폼 바인딩 | 기본 템플릿 | create 시 autoApply 또는 form-bindings |

---

## 5. 상태별 시드 차이 (프로그램유형.md 정렬)

### ACTIVE / COMPLETED

- 승인된 기관·개인·강사·봉사 신청
- participants · 학생명단 · 강사 배정 · 강의보고 · 출석 · 게시글 2

### COMPLETED 추가

- 참여자/수료 `COMPLETED` · 수료증 `COMPLETION_ISSUED`
- 강의보고 `SUBMITTED` · 완료 일자

### SCHEDULED / RECRUITING

- 신청만 (WAITING/PENDING/SUBMITTED) — 참여자·배정·출석·게시글 **없음**

---

## 6. 검증 체크리스트

- [ ] `166401`(또는 FE type-org-curriculum-single) 상세: 기관/강사/봉사 신청 목록 비지 않음
- [ ] 동일 프로그램 진행 탭: 학교·강사 목록 ≥1
- [ ] `167001~008` 각 기관3+강사3
- [ ] `167006` 장거리 플래그
- [ ] COMPLETED 시드에 수료·강의보고 SUBMITTED
- [ ] RECRUITING 시드에 참여자 0

**Last updated:** 2026-07-30
