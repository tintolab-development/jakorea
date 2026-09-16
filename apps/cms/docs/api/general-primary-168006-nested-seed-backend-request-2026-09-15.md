# 일반 Primary Case6 (`168006`) — 전 카테고리 하위 시드 (FE ↔ BE)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-15 |
| **대상** | Admin CMS 일반 프로그램 Primary Case6 |
| **programId** | `168006` |
| **title (고정)** | `[개인] 커리큘럼형 복수회차 테스트 프로그램` |
| **BE 구현** | `LocalDemoGeneralPrimaryCaseSeedContributor` + `GeneralPrimaryCase6NestedSeedWriter` |
| **BE handoff** | `JABACK/docs/frontend/general-primary-168006-nested-seed-handoff-2026-09.md` |
| **관련** | [개인 면접 가능 일정](./general-primary-168006-individual-interview-availability-backend-request-2026-09-16.md) · [개인 신청 표시 필드](./general-individual-application-display-fields-backend-request-2026-09-16.md) · [개인 알림 재발송](./general-individual-application-notification-resend-backend-request-2026-09-16.md) · [강사 신청 API 계약](./general-primary-168006-instructor-applications-backend-contract-2026-09-16.md) · [Primary FE 어댑터](./general-primary-case-fe-adapter-2026-09-15.md) · [하위 시드 일반론](./be-handoff-program-dummy-seeds/05-nested-child-data-dummy-seed.md) |

**목적:** `168006` 하위 LNB·탭이 비지 않도록 nested 시드를 두고 CMS QA한다.

---

## Member policy (BE 확정 · 중요)

초기 FE 요청의 `171xxx` / `172xxx` 카탈로그 ID는 **soft-retire**.  
Case6 하위 시드는 **QaMemberRoster `190xxx`** (+ 담당자 `16500x`)만 사용한다.

| FE 요청 alias (레거시) | **BE memberId (SSOT)** | 표시명 | 용도 |
|---|---|---|---|
| 171001 | **190001** | 이건희 | 개인 최종 PASS → participant #1 |
| 171011 | **190012** | 서류대기박틴토 | doc WAITING |
| 171012 | **190013** | 서류불합격민준 | doc FAIL |
| 171013 | **190014** | 서류합격서연 | doc PASS |
| 171014 | **190015** | 배정대기고종욱 | interview WAITING |
| 171015 | **190016** | 배정완료준호 | interview ASSIGNED (+slot enrich) |
| 171016 | **190017** | 활동포기태준 | GIVE_UP |
| 171017 | **190018** | 최종합격개인 | 최종 PASS → participant #2 |
| 171018 | **190019** | 최종불합격개인 | 최종 FAIL |
| 171019 | **190020** | 최종예비개인 | RESERVE rank=2 |
| 171003 | **190005** | 김성재 | 강사 approved → participant |
| 172101 | **190006** | 최지원 | 강사 pending |
| 171004 | **190007** | 황범진 | 강사 rejected |
| 172104 | **190008** | 이가원 | 봉사 서류 pending |
| 172105 | **190009** | 백진혁 | 봉사 서류 FAIL |
| 172102 | **190010** | 우지원 | 봉사 최종 PASS → participant |
| 171601 PM | **165001** | 테스트 PM | program PM |
| 172207 파트너 | **165002** | 테스트 파트너 | program PARTNER |

비밀번호(포털): `member1234!` · Admin: `test1234!`

**금지**

- FE mock 문자열 id(`individual-program-instructor-approved` 등)를 BE PK로 사용
- Case6 QA에서 `171xxx`/`172xxx` memberId로 행·상세를 기대하지 말 것
- Case5(`168005`)처럼 참여자-only로 Case6 LNB를 기대하지 말 것

---

## 1. 프로그램 헤더 / 축 (충족)

| | Case5 `168005` | **Case6 `168006`** |
|--|---|---|
| audience | individual | individual |
| structure / session | curriculum / **single** | curriculum / **multi**(스케줄 3) |
| `generalParticipantTypes` | `['individual']` only | **individual, teacher_instructor, volunteer** |
| 참여자·봉사 면접 | OFF | **ON** |
| `generalSurveyMenuKeys` | `[]` | **survey, satisfaction, lecture_evaluation** |
| lifecycle | — | **ACTIVE** / period **IN_PROGRESS** |

---

## 2. Nested 최소 건수 (BE)

- individual-applications ≥9 (서류/면접/최종 매트릭스)
- instructor-applications = 3 (pending/approved/rejected)
- volunteer-applications = 3 (pending/fail/pass+ASSIGNED)
- interview-slots ≥2 · individual assignment 1 · volunteer assignment 1
- participants: INDIVIDUAL≥2, INSTRUCTOR≥1, VOLUNTEER≥1
- posts ≥2 · attendance 샘플 · managers PM+PARTNER

---

## 3. 카테고리별 시드 · CMS 검증

규칙: **최종 PASS / 강사·봉사 approved**만 `GET …/participants`로 승격.  
모든 하위 행 `programId=168006`.

### 3.1 참여자 신청 (`lnb=institution_applications`)

| tab | memberId | 상태 |
|-----|----------|------|
| `part_doc1` | 190012 / 190013 / 190014 | WAITING · FAIL · PASS |
| `part_doc_passed` | 190015 / 190016 / 190017 | waiting · **ASSIGNED** · GIVE_UP |
| `part_interview2` | 190001 또는 190018 / 190019 / 190020 | PASS · FAIL · RESERVE(rank=2) |

면접 배정:

```http
POST /api/admin/interview-assignments
{ "individualApplicationId": <appPk>, "interviewSlotId": <slotPk> }
```

(legacy `/applications/individuals/...` 금지)

### 3.2 강사 신청 (`lnb=instructor_applications`)

| 상태 | memberId | 진행 승격 |
|------|----------|-----------|
| pending | **190006** | 없음 |
| approved | **190005** | → participants INSTRUCTOR |
| rejected | **190007** | 없음 |

### 3.3 봉사자 신청 (`lnb=volunteer_applications`)

| 단계 | memberId | 상태 |
|------|----------|------|
| 서류 | 190008 / 190009 | pending · FAIL |
| 면접·최종 | **190010** | ASSIGNED → final PASS → participants VOLUNTEER |

### 3.4 진행 / 설문 / 담당자

| tab | 최소 | memberId |
|-----|------|----------|
| `progress_participants` | ≥2 | 190001, 190018 |
| `progress_instructors` | ≥1 | 190005 |
| `progress_volunteers` | ≥1 | 190010 |
| `progress_attendance` | 샘플 | — |
| `progress_posts` | ≥2 | — |
| `progress_assignments` | — | **P2 API 미구현 — FE mock 유지** |
| survey / satisfaction / lecture_evaluation | count > 0 | — |
| managers | PM · 파트너 | **165001** · **165002** |

---

## 4. 재시드 · API 스모크

```bash
./gradlew bootRun   # qa-member-roster + general-primary-cases 기본 ON
```

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

---

## 5. CMS 딥링크 체크리스트

기준: `http://localhost:3000/programs/general?programId=168006`  
(CMS: `VITE_API_SERVER` → local BE · 관리자 JWT)

- [ ] `…&lnb=info&tab=recruitment` — 강사·봉사 모집 블록
- [ ] `…&lnb=institution_applications&tab=part_doc1` — 190012/013/014
- [ ] `…&lnb=institution_applications&tab=part_doc_passed` — 190015/016/017 + 일시 enrich
- [ ] `…&lnb=institution_applications&tab=part_interview2` — PASS / FAIL / RESERVE
- [ ] `…&lnb=instructor_applications&tab=main` — 190006/005/007 · **memberId**로 회원 상세
- [ ] `…&lnb=volunteer_applications&tab=vol_doc1` (및 doc_passed / interview2)
- [ ] `…&lnb=progress&tab=progress_participants` — ≥2 (190001, 190018)
- [ ] `…&lnb=progress&tab=progress_instructors` — ≥1 · `instructorId`=participant PK
- [ ] `…&lnb=progress&tab=progress_volunteers` — ≥1 (190010)
- [ ] `…&lnb=progress&tab=progress_attendance` / `progress_posts`
- [ ] `…&lnb=survey&tab=survey` — 응답 count > 0
- [ ] `…&lnb=managers&tab=main` — 165001 · 165002
- [ ] 전체 회원 목록에서 Case6 관련 회원은 **190xxx / 16500x** (171/172 시드 기대 금지)

### 잘못된 딥링크

| 잘못된 예 | 올바른 예 |
|-----------|-----------|
| `applicantId=individual-program-instructor-approved` | numeric applicationId / `instructorId={participantPk}` |

---

## 6. 수락 기준

1. `168006` 축이 FULL LNB와 일치하고 Case5(`168005`)와 구분된다.
2. 신청·진행·설문·담당자 목록이 비어 있지 않다.
3. 모든 신청/참여자 행이 **190xxx / 16500x**를 참조한다.
4. 면접 배정은 `POST /api/admin/interview-assignments` + `individualApplicationId` (legacy 금지).
5. RESERVE는 `rank=2`.
6. `progress_assignments`는 API 없이 FE mock 유지 가능.

---

## 7. 비범위

- 기관 신청 · 1사1교 / UJAT / Gemini / TT Primary
- 과제 admin API (P2)
- member-management `171xxx` directory showcase 자체 폐기 (별도 soft-retire 트랙)

---

**Last updated:** 2026-09-15 (BE handoff 190xxx 반영)
