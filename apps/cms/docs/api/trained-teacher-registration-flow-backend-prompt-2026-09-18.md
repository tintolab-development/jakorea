# BE 전달 프롬프트 — 교육받은 교사 프로그램 **신규 등록 플로우** FE↔BE 계약 정렬

**작성일:** 2026-09-18  
**상태:** ✅ BE 수용 · FE 반영 완료 (remote E2E 수동 검증 잔여)  
**우선순위:** P0 (create form-bindings · 참여자 유형 · 교육 연수/교육일지) · P1 (모집 필드·후원사 Multi)  
**대상 화면:** CMS `/programs/trained-teachers?new=1` 신규 등록 풀페이지  
**범위:** `programType=TRAINED_TEACHER` only (일반·1사1교·UJAT·Gemini 기본 동작 변경 금지)  
**FE 반영 (2026-09-18):**
- 모집 `trainedTeachers`: 배정 가능 최대 강사 수 **미렌더** · create 시 `maxAssignableInstructors: 0`
- `TRAINED_TEACHER_TRAINING_SCHEDULE_NAME` / 상세 헤딩 → **`교육 연수`**
- create: `applicationTargetMode=ORGANIZATION` + `autoApplyDefaultFormBindings: true` · TT FE draft attach 없음
- create 스냅샷에 `teacherTrainingEnabled` / `educationJournalEnabled` 항상 명시
**관련 문서:**
- [programs-trained-teachers-api-backend-handoff.md](./programs-trained-teachers-api-backend-handoff.md)
- [programs-trained-teachers-api-conversion-status.md](./programs-trained-teachers-api-conversion-status.md)
- [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md)
- [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md)
- [trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md](./trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md)

---

## 한줄 요약

교육받은 교사 **신규 등록**을 일반 프로그램과 동일한 공통 registration architecture(공통 → 모집 → 신청)로 맞췄습니다.  
create 시 **등록·모집·신청 3종 기본 양식 바인딩**, 참여자 유형 `school_institution` 고정, **교육 연수 / 교육일지**(과제와 분리) 필드가 BE create·detail과 일치해야 합니다.

---

## FE가 이미 맞춘 것 (참고 · 깨지지 않게 유지)

| 항목 | FE 조치 |
|------|---------|
| 등록 플로우 | 공통 registration flow 재사용. TT 전용으로 모집 단계를 강제 제외하지 않음 |
| step 노출 | 참여자 유형 플래그 기반 → 학교/기관만 → `recruit-participant-school` + `application-participant-school` |
| 템플릿 매핑 | `registration-trained-teachers` / `recruitment-trained-teachers` / `application-trained-teachers` |
| 참여자 유형 | UI·state·payload 모두 `school_institution`만 (개인·강사·봉사자 불가) |
| 교육 연수 | 일반「사전 교육」prepend가 아님. **첫 차시/일정을 치환** (`replaceFirst`). ON 시 차시 수 +1 금지 |
| 교육일지 | 있음/없음만. 과제(assignment) UI·데이터와 분리 |
| 희망 교육 형태 | 등록 교육 형태가 `participant_selection`일 때만 신청 폼 노출 |
| 희망 일정 | 동적 N지망 · 교시 비연속 허용 (연강 강제 없음) |
| create 호출 | `POST /api/admin/programs` + `programType=TRAINED_TEACHER` + `autoApplyDefaultFormBindings: true` |

---

## 백엔드 전달용 프롬프트 (복사용)

아래를 BE 이슈/PR 본문에 그대로 붙여 주세요.

````markdown
## 요청 요약

CMS 교육받은 교사 프로그램 **신규 등록** FE를 일반 프로그램과 동일한 등록 위저드 구조로 정렬했습니다.

- 플로우: **공통 정보 → 참여 기관 모집 정보 → 참여 기관 신청 정보 → 등록 완료**
- `programType`: `TRAINED_TEACHER`
- create: `POST /api/admin/programs` + `autoApplyDefaultFormBindings: true`

BE는 아래 계약을 확인해 주세요.  
일반·1사1교·UJAT·Gemini 기본 동작은 변경하지 마세요.

FE는 mock 없이 remote(opt-in) 기준으로 재검증합니다.

---

### P0-1 — create 시 기본 form-bindings (3종)

create body에 `autoApplyDefaultFormBindings: true`를 보냅니다.

BE가 `TRAINED_TEACHER` 생성 시 **아래 3개 템플릿을 모두** 기본 바인딩해야 합니다.

| 역할 | templateCode | 비고 |
|------|--------------|------|
| 프로그램 등록 | `registration-trained-teachers` | 공통정보 단계 |
| 참여 기관 모집 | `recruitment-trained-teachers` | 모집 단계 (누락되면 안 됨) |
| 참여 기관 신청 | `application-trained-teachers` | 신청 단계 |

**수용 기준**
1. create 후 GET form-bindings(또는 동등 API)에 위 3개 code가 존재
2. 일반(`GENERAL`) create의 default set과 **섞이지 않음**
3. 과거 handoff에 registration+application만 적혀 있었다면 **recruitment를 추가**해 문서·시드·런타임 일치

관련 FE 시드: `apps/cms/docs/api/form-template-seeds/{registration,recruitment,application}-trained-teachers.json`

---

### P0-2 — 참여자 유형 고정

교육받은 교사는 **학교/기관만** 존재합니다.

| 항목 | FE 기대 |
|------|---------|
| create/update | `generalParticipantTypes` = `["school_institution"]` 만 |
| audience | organization |
| 금지 | `individual` / `teacher_instructor` / `volunteer` 를 기본 참여자로 추가 |

담당 교사가 학생 본교육을 진행해도 이를 **강사(`teacher_instructor`) 참여자 유형으로 취급하면 안 됩니다.**

**수용 기준**
1. create 시 위 배열로 저장·재조회
2. BE가 임의로 강사/봉사자 타입을 붙이지 않음
3. 잘못된 타입 포함 시 명확한 4xx (가능하면)

---

### P0-3 — 교육 진행 구조·회차 (강제 curriculum 금지)

등록 UI에서 일반과 동일하게 선택합니다.

- 교육 진행 구조: `curriculum` | `schedule`
- 수업 회차 유형: `single` | `multi`
- 교육 형태: `online` | `offline` | `hybrid` | `participant_selection`
- IPS: 일정 공통 / 일정 별 상이 + Prepare/Inspire/Succeed

**요청**
- create/update 시 FE가 보낸 `educationStructure` / `sessionRound`(또는 동등 필드)를 **덮어써서 curriculum·single로 강제하지 말 것**
- 재조회 GET에서 동일 값 echo

(상세 공통정보 PATCH `…/trained-teacher/detail` 와도 값이 어긋나면 안 됩니다.)

---

### P0-4 — 교육 연수 (일반「사전 교육」과 다름)

| | 일반 프로그램 | 교육받은 교사 |
|--|---------------|---------------|
| UI | 사전 교육 | **교육 연수** |
| ON 동작 | 첫 항목 **앞에 블록 추가**(개수 +1) | **첫 항목을 교육 연수로 치환**(개수 유지) |
| IPS | (사전교육 정책) | Prepare **고정·수정 불가** |
| OFF | 사전교육 제거 | 연수 설정만 제거 · 본교육 데이터 유지 |

**FE ↔ BE wire (상세/info-detail 기준, 이미 사용 중)**

| 필드 | 의미 |
|------|------|
| `teacherTrainingEnabled` | boolean, 기본 `false` |
| `teacherTrainingScheduleName` | ON일 때 첫 일정/차시 표시명 |

**라벨 정렬 요청**
- 제품 카피 SSOT는 **「교육 연수」**
- 현재 FE 상수/일부 테스트에 `교사 연수` 잔존 가능 → BE는 `교육 연수`를 저장·echo 하거나, `교사 연수`/`교육 연수`를 **동일 의미 alias**로 문서화

**수용 기준**
1. create 직후 또는 첫 공통정보 저장에서 `teacherTrainingEnabled` round-trip
2. ON 시 서버가 차시/일정을 **하나 더 삽입하지 않음** (치환 모델)
3. ON 시 첫 항목 IPS = Prepare

---

### P0-5 — 교육일지 ≠ 과제

| | 교육받은 교사 | 일반 |
|--|---------------|------|
| 교육일지 | 있음/없음 (`educationJournalEnabled`) | (해당 시 별도) |
| 과제 | **사용 안 함** | assignment 설정 가능 |

**요청**
- `educationJournalEnabled` boolean round-trip (create 또는 `…/trained-teacher/detail`)
- assignment/과제 필드를 TT에 강제 default 하지 말 것
- 교육일지 API(`…/trained-teacher/education-journals`)와 과제 제출 API를 동일 리소스로 취급하지 말 것

---

### P0-6 — 모집·신청 설정값 저장

등록 위저드에서 작성한 참여 기관 모집/신청 설정이 create(또는 후속 form draft attach) 후 상세에서 읽혀야 합니다.

모집(기관)에서 FE가 다루는 대표 필드:
- 공고 게시 여부
- 학생 명단 제출 여부
- 신청 가능 최대 학급 수 / 최대 일정 수 / 1일 최대 차시 수
- 모집·운영 기간
- (UI 잔존) 배정 가능 최대 강사 수 — **아래 P1 확인**

신청 연동:
- 등록 교육 형태가 `participant_selection`일 때만 신청 「희망 교육 형태」 노출 → BE/신청 schema도 동일 조건 권장
- 희망 일정: 동적 복수 지망 · **교시 비연속 허용** (1교시+4교시). 연속(연강) only validation이면 TT 예외 필요

관리자가 등록하는 것: 총 차시/커리큘럼/교육 내용/교육 가능 기간  
교사가 신청 시 정하는 것: 실제 진행 날짜·교시

→ 등록 시 저장한 교육 진행·모집 한도가 신청 검증에 쓰이는지 문서화해 주세요.

---

### P1 — 확인 요청 (FE가 임의 결정하지 않음)

#### 1) 「배정 가능 최대 강사 수」

TT는 강사 참여자 유형이 없습니다.  
모집 폼 UI에 필드가 남아 있습니다.

BE/기획 중 택1 회신 부탁:
- A. 필드 유지 (의미가 있으면 설명)
- B. TT에서는 무시/미노출 (FE 숨김)
- C. 다른 라벨/필드로 대체

#### 2) 후원사 · 담당자 Multi

FE 등록 폼: 후원사 **Multi Select** 적용.  
담당자는 등록 공통 컴포넌트가 아직 단일 Select, 상세 공통정보는 Multi.

create/update wire:
- legacy `sponsorId` + `sponsors: [{ sponsorId, sponsorContactId }]` (상세와 동일 방향)

**요청:** Multi 후원사 create round-trip · 담당자 Multi를 create에도 쓸지 SSOT 확정

#### 3) 등록 완료 시 form draft attach

일반 프로그램은 create 후 FE가 draft attach를 시도하는 경로가 있습니다.  
TT는 `autoApplyDefaultFormBindings`에 의존합니다.

**요청:** TT도 create 트랜잭션에서 3종 바인딩이 충분한지, 아니면 일반처럼 FE attach가 필요한지 명시

---

### 비범위

- 강사/봉사자 모집·신청 탭
- UJAT / Gemini / 1사1교 registration 변경
- Platform 신청 화면 로그인 교사 autofill (별도)

---

### 수용 체크리스트 (BE)

- [ ] `TRAINED_TEACHER` create → bindings에 registration + **recruitment** + application
- [ ] `generalParticipantTypes=["school_institution"]` only echo
- [ ] `educationStructure` / `sessionRound` 강제 덮어쓰기 없음
- [ ] `teacherTrainingEnabled` + 치환 모델(개수 +1 금지) + 표시명「교육 연수」정책
- [ ] `educationJournalEnabled` round-trip · 과제와 분리
- [ ] 모집 한도·기간이 신청 검증에 연결되는지 문서화
- [ ] P1 강사 수 / 후원사 Multi / draft attach SSOT 회신

### 참고 API

| Method | Path |
|--------|------|
| `POST` | `/api/admin/programs` (`programType=TRAINED_TEACHER`, `autoApplyDefaultFormBindings=true`) |
| `GET`/`PATCH` | `/api/admin/programs/{id}` |
| `GET`/`PATCH` | `/api/admin/programs/{id}/trained-teacher/detail` |
| form bindings | (OpenAPI 현행 programs form-bindings path) |

### FE gate

```env
VITE_REAL_API_MODULES=adminAuth,formsSurveys,programs,trainedTeacherPrograms
```
````

---

## FE 측 follow-up (BE 회신 후)

| 회신 | FE 작업 |
|------|---------|
| P1 강사 수 = B 숨김 | 모집 `layoutVariant=trainedTeachers`에서 해당 필드 미렌더 |
| 표시명「교육 연수」확정 | `TRAINED_TEACHER_TRAINING_SCHEDULE_NAME`·상세 UI `교사 연수` → `교육 연수`로 통일 |
| 담당자 Multi create SSOT | 등록 sponsor fields를 상세와 동일 Multi로 확장 |
| recruitment binding 누락 | BE 수정 대기 · FE 임시 attach 여부 협의 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-18 | 초안 — 등록 플로우 FE 정렬 후 BE 계약·복사용 프롬프트 |
