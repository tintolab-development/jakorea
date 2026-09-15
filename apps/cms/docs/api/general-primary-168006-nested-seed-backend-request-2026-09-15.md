# 일반 Primary Case6 (`168006`) — 전 카테고리 하위 시드 요청 (FE → BE)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-15 |
| **대상** | Admin CMS 일반 프로그램 Primary Case6 |
| **programId** | `168006` |
| **title (고정)** | `[개인] 커리큘럼형 복수회차 테스트 프로그램` |
| **BE 구현** | `LocalDemoGeneralPrimaryCaseSeedContributor` (+ nested child seed) |
| **회원 SSOT** | `member-management-v1-2026-08` · [`member-management-seed-catalog.ts`](../../src/data/mock/member-management-seed-catalog.ts) · [`member-management-seed-v1.spec.json`](./members/member-management-seed-v1.spec.json) |
| **FE mock SSOT** | `general-programs.ts` (CASE-04 축) · `general-individual-applications-mock.ts` · `applicant-instructors.ts` · `general-volunteer-applicants-mock.ts` · `participating-*.ts` · interview slots · `program-posts` · `program-managers` · survey mocks |
| **관련** | [개인 심사 API](./general-individual-application-screening-api-backend-request-2026-09-15.md) · [Primary FE 어댑터](./general-primary-case-fe-adapter-2026-09-15.md) · [하위 시드 일반론](./be-handoff-program-dummy-seeds/05-nested-child-data-dummy-seed.md) · [API 전환 상태](./programs-detail-api-conversion-status.md) |

**목적:** 프로그램 헤더만 있으면 목록은 열리지만 LNB·탭이 비어 CMS QA가 불가합니다. FE mock 상태 매트릭스 + **기존 회원 시드(171/172)** 로 `168006` 하위 행을 채워 주세요.

**금지**

- FE mock 문자열 id(`individual-program-instructor-approved`, `general-individual-applicant-N`)를 BE PK로 사용
- 이름만으로 카탈로그 밖 회원 생성 (범위 `[171001,171400]` / `[172101,172140]` / admin `[171601,171650]`·`[172201,172235]` 안만)
- Case5(`168005`)처럼 참여자-only로 Case6을 유지한 채 강사·봉사 LNB를 기대하지 말 것 → **§1 축 보정 필수**

---

## 1. 프로그램 헤더 / 축 보정 (Case5 대비)

| | Case5 `168005` (현행 FE 테스트) | **Case6 `168006` (본 요청)** |
|--|--------------------------------|------------------------------|
| audience | individual | individual |
| structure / session | curriculum / **single** | curriculum / **multi** |
| `generalParticipantTypes` | `['individual']` only | **`['individual','teacher_instructor','volunteer']`** |
| 참여자·봉사 면접 | (해당 없음 / OFF) | **ON** |
| `generalSurveyMenuKeys` | `[]` | **`['survey','satisfaction','lecture_evaluation']`** |
| lifecycle / status | (Primary 기존) | **ACTIVE** (또는 진행 탭·출석 검증 가능 동등 상태) |
| LNB | 참여자 신청만 | info · 참여자 신청(면접 2depth) · 강사 · 봉사(면접 2depth) · 진행(참여자/강사/봉사/출석/과제/게시글) · 설문 · 담당자 |

`serviceDetailJson` (또는 동등 hydrate) 최소 키:

```json
{
  "schemaVersion": 1,
  "generalProgramAudience": "individual",
  "generalProgramEducationStructure": "curriculum",
  "generalProgramSessionRound": "multi",
  "generalParticipantTypes": ["individual", "teacher_instructor", "volunteer"],
  "generalParticipantInterviewEnabled": true,
  "generalVolunteerInterviewEnabled": true,
  "generalSurveyMenuKeys": ["survey", "satisfaction", "lecture_evaluation"],
  "generalCommonInfo": {
    "participantRecruitmentInfo": { "announcementPublished": true },
    "instructorRecruitmentInfo": { "announcementPublished": true },
    "volunteerRecruitmentInfo": { "announcementPublished": true }
  }
}
```

복수 회차: 프로그램 스케줄/회차 **≥2** (출석·과제 탭·면접 슬롯 기간과 맞춤).

---

## 2. 회원 매핑 (171 / 172) — 고정

`seedLabel`: `member-management-v1-2026-08`  
directory ↔ permission id 혼용 금지(같은 사람라도 용도별 id를 표대로).

### 2.1 카탈로그 showcase (필수 존재)

| memberId / adminId | caseId | 표시명 | roles | 본 시드 용도 |
|--------------------|--------|--------|-------|--------------|
| **171001** | MD-INDIVIDUAL | 김개인 | INDIVIDUAL | 개인 최종 PASS → `participants` INDIVIDUAL |
| **171003** | MD-INSTRUCTOR | 정멘토 | INSTRUCTOR | 강사 신청 **approved** → `participants` INSTRUCTOR |
| **171004** | MD-INSTRUCTOR-DUAL | 최강사 | SCHOOL_TEACHER+INSTRUCTOR | 강사 신청 **rejected** (반려 사유) |
| **172101** | IR-PENDING-PORTAL-FULL | 최지원 | instructorMember (permission) | 강사 신청 **pending** |
| **172102** | IR-APPROVED-RESEND | (IR approved 회원) | instructorMember | 봉사 신청 **approved** → `participants` VOLUNTEER |
| **172104** | IR-BULK-PENDING-A | (bulk) | instructorMember | 봉사 신청 서류 **pending** |
| **172105** | IR-BULK-PENDING-B | (bulk) | instructorMember | 봉사 서류 **FAIL** 또는 최종 FAIL |
| **171601** | MD-ADMIN | (MASTER) | ADMIN | 프로그램 **PM** |
| **172207** | AA-DIST-172207 | (ACTIVE PARTNER) | admin approval ACTIVE · PARTNER | 프로그램 **파트너** |

### 2.2 Case6 전용 thin INDIVIDUAL (범위 내 확장)

카탈로그 showcase만으로는 참여자 서류·면접 매트릭스 인원이 부족합니다.  
`memberId` 범위 `[171001,171400]` 안에서 **아래 thin INDIVIDUAL을 LocalDemo에 추가**(또는 이미 있으면 재사용)해 주세요. 이름만 카탈로그 밖 신규 금지 — **id는 범위 내 고정**.

| memberId | 표시명 (FE mock 대응) | 신청 단계 |
|----------|----------------------|-----------|
| **171011** | 서류대기박틴토 | doc1 WAITING / pending |
| **171012** | 서류불합격민준 | doc1 FAIL |
| **171013** | 서류합격서연 | doc1 PASS · 면접 미배정(waiting) |
| **171014** | 배정대기고종욱 | doc PASS · interview waiting |
| **171015** | 배정완료준호 | doc PASS · interview **ASSIGNED** |
| **171016** | 활동포기태준 | doc PASS · interview **withdrawn** / give-up |
| **171017** | 최종합격개인 | final **PASS** → progress INDIVIDUAL #2 (171001과 별도) |
| **171018** | 최종불합격개인 | final **FAIL** |
| **171019** | 최종예비개인 | final **RESERVE** + `rank=2` |

---

## 3. 카테고리별 시드 레시피

규칙: **승인(최종 PASS / 강사·봉사 approved)된 신청만** `GET …/participants`로 승격.  
모든 하위 행에 `programId=168006` 필수.

### 3.1 프로그램 정보 (`lnb=info`)

| tab | 시드 |
|-----|------|
| `info` / `recruitment` / `application` | §1 JSON + 모집 기간·면접 기간·복수 회차 메타. FE: Primary adapter / CASE-04 |

검증: 상세 모달 LNB에 참여자·강사·봉사·진행·설문·담당자 노출.

### 3.2 참여자 신청 (`lnb=institution_applications` — 개인 audience 라벨「참여자 신청 목록」)

면접 ON → tabs: `part_doc1` · `part_doc_passed` · `part_interview2`.

| tab | 최소 | memberId | 상태 |
|-----|------|----------|------|
| `part_doc1` | ≥3 | 171011 / 171012 / 171013 | WAITING · document FAIL · document PASS(demo) |
| `part_doc_passed` | ≥3 | 171014 / 171015 / 171016 | interview waiting · **ASSIGNED**(+slot) · withdrawn |
| `part_interview2` | ≥3 | 171001 또는 171017 / 171018 / 171019 | final PASS · FAIL · RESERVE(rank=2) |

API:

- `GET /api/admin/programs/168006/individual-applications` (+ `assignedInterview*` enrich)
- `POST …/individual-applications/{id}/document-result`
- `POST /api/admin/interview-assignments` body `{ individualApplicationId, interviewSlotId }` (**옵션 B only**)
- `POST …/individual-applications/{id}/final-result` (`PASS`/`FAIL`/`RESERVE`+rank)

면접 슬롯: `POST/GET …/programs/168006/interview-slots` **≥2**.  
171015 배정에 `assignedInterviewSlotId` · `assignedInterviewStartAt` · `assignedInterviewEndAt` 목록 enrich.

### 3.3 강사 신청 (`lnb=instructor_applications`, `tab=main`)

FE 개인 데모 3건 패턴 (`applicant-instructors.ts`).

| 상태 | memberId | 표시 참고 | 진행 승격 |
|------|----------|-----------|-----------|
| pending | **172101** 최지원 | FE pending 데모 | 없음 |
| approved | **171003** 정멘토 | FE approved + 강의 배정 | → `participants` INSTRUCTOR |
| rejected | **171004** 최강사 | 사유: 인원 초과 등 | 없음 |

API: `GET …/programs/168006/instructor-applications` · approve/reject.

### 3.4 봉사자 신청 (`lnb=volunteer_applications`)

면접 ON → `vol_doc1` · `vol_doc_passed` · `vol_interview2`.

| 단계 | 최소 | memberId | 상태 |
|------|------|----------|------|
| 서류 | ≥2 | 172104 / 172105 | pending · FAIL |
| 서류합격·면접 | ≥1 | 172102 | ASSIGNED (슬롯 1 — individual과 **별 슬롯 또는 동일 슬롯 정책은 BE 기존 규칙**) |
| 최종 | ≥1 | 172102 | final PASS → `participants` VOLUNTEER |

API: volunteer applications + `POST /api/admin/interview-assignments` `{ volunteerApplicationId, interviewSlotId }` (individual과 상호 배타).

### 3.5 진행 (`lnb=progress`)

| tab | 최소 | 연결 | 비고 |
|-----|------|------|------|
| `progress_participants` | ≥2 | 171001, 171017 | `GET …/participants?participantType=INDIVIDUAL` |
| `progress_instructors` | ≥1 | 171003 | `…=INSTRUCTOR` · 정산 상태 1종 · 가능하면 강의 배정 1 |
| `progress_volunteers` | ≥1 | 172102 | `…=VOLUNTEER` |
| `progress_attendance` | schedule별 ≥1 샘플 | 개인 출석 | 복수 회차 스케줄과 조인 |
| `progress_assignments` | **메타/placeholder만** | — | **P2 admin API 미구현 — FE mock 유지**. 시드 필수는 아님 |
| `progress_posts` | ≥2 | program posts | ACTIVE 게시글 |

중첩 상세 쿼리(읽기):

- 강사: `instructorId` = participant PK · `instructorTab=application|lectureReports|settlement` …
- 참여자: `participantId` · `participantTab=application|attendance|assignments`

### 3.6 설문 (`lnb=survey`)

| tab | 시드 |
|-----|------|
| `survey` / `satisfaction` / `lecture_evaluation` | 각 응답 **count > 0** (summary API) |

### 3.7 담당자 (`lnb=managers`)

| 역할 | id |
|------|-----|
| PM | **171601** |
| 파트너 | **172207** |

---

## 4. API 검증 스모크 (BE 재시드 후)

```text
GET /api/admin/programs/168006
GET /api/admin/programs/168006/individual-applications
GET /api/admin/programs/168006/instructor-applications
GET /api/admin/programs/168006/volunteer-applications
GET /api/admin/programs/168006/interview-slots
GET /api/admin/programs/168006/participants?participantType=INDIVIDUAL
GET /api/admin/programs/168006/participants?participantType=INSTRUCTOR
GET /api/admin/programs/168006/participants?participantType=VOLUNTEER
```

(경로 prefix는 기존 Admin OpenAPI와 동일하게 맞출 것. 목록이 비면 §3 미충족.)

---

## 5. CMS 딥링크 검증 체크리스트

기준: `http://localhost:3000/programs/general?programId=168006`  
(CMS: `VITE_API_SERVER` → local BE · 관리자 JWT)

- [ ] `…&lnb=info&tab=recruitment` — 강사·봉사 모집 블록 노출 (Case5와 다름)
- [ ] `…&lnb=institution_applications&tab=part_doc1` — 서류 대기/불합격/합격 ≥1
- [ ] `…&lnb=institution_applications&tab=part_doc_passed` — 배정대기/배정완료/포기 · 일시 enrich
- [ ] `…&lnb=institution_applications&tab=part_interview2` — PASS / FAIL / RESERVE
- [ ] `…&lnb=instructor_applications&tab=main` — pending·approved·rejected · **memberId**로 회원 상세 연결
- [ ] `…&lnb=volunteer_applications&tab=vol_doc1` (및 doc_passed / interview2)
- [ ] `…&lnb=progress&tab=progress_participants` — ≥2
- [ ] `…&lnb=progress&tab=progress_instructors` — ≥1 · 행 클릭 시 `instructorId`=(participant PK)
- [ ] `…&lnb=progress&tab=progress_volunteers` — ≥1
- [ ] `…&lnb=progress&tab=progress_attendance`
- [ ] `…&lnb=progress&tab=progress_posts` — ≥2
- [ ] `…&lnb=survey&tab=survey` — 응답 count > 0
- [ ] `…&lnb=managers&tab=main` — PM·파트너

### 잘못된 딥링크 (교정)

| 잘못된 예 | 이유 | 올바른 예 |
|-----------|------|-----------|
| `lnb=progress&tab=progress_instructors&applicantId=individual-program-instructor-approved` | `applicantId`는 신청 LNB용 · FE mock 문자열은 BE PK 아님 | `lnb=instructor_applications&tab=main` 후 목록의 **numeric applicationId** / 또는 `lnb=progress&tab=progress_instructors&instructorId={participantPk}` |

---

## 6. 수락 기준 (요약)

1. `168006` title·축이 §1 FULL LNB와 일치하고 Case5(`168005`)와 구분된다.
2. 신청·진행·설문·담당자 목록이 비어 있지 않다 (§3 최소 건수).
3. 모든 신청/참여자 행이 §2 **memberId**를 참조한다 (orphan 이름 행 금지).
4. 개인 면접 배정은 `POST /api/admin/interview-assignments` + `individualApplicationId` (legacy path 금지).
5. 최종 RESERVE는 `rank=2`로 목록에 반영.
6. `progress_assignments`는 API 없이 FE mock 유지 가능 — 시드 누락으로 수락 실패하지 않음.
7. 개인 심사 핸드오프 시드 체크: 「[개인] 커리큘럼형 복수회차 테스트 프로그램」= 본 문서.

---

## 7. 비범위

- 기관(`ORGANIZATION`) 신청 · 참여 학교 · 학생 명단
- 1사1교 / UJAT / Gemini / TT Primary
- 과제 admin API (P2) · FE mock id를 BE PK로 맞추기
- JABACK 외 FE 코드 변경 (본 문서는 요청서)

---

**Last updated:** 2026-09-15
