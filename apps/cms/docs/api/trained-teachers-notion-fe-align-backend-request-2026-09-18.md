# BE 확인·구현 요청 — 교육받은 교사 FE 노션 정합 후속 (실적·모집·연수·일지)

**작성일:** 2026-09-18  
**상태:** ✅ BE 회신 반영 · FE 재검증·UI 정리 완료 (2026-09-18)  
**우선순위:** P0 실적 집계 배타성 · P1 모집 `maxAssignableInstructors` · P1 교육 연수 필드 SSOT · P2 신청 자동입력  
**대상:** `programType=TRAINED_TEACHER` only  
**비대상:** 일반 / 1사1교 / UJAT / Gemini / 강사·봉사자 기본 계약 변경  
**BE 핸드오프:** `JABACK/docs/frontend/trained-teacher-notion-fe-align-backend-handoff-2026-09-18.md`  
**관련 문서:**
- [programs-trained-teachers-api-backend-handoff.md](./programs-trained-teachers-api-backend-handoff.md)
- [programs-trained-teachers-api-conversion-status.md](./programs-trained-teachers-api-conversion-status.md)
- [trained-teachers-detail-unconfirmed-api-backend-request-2026-09-16.md](./trained-teachers-detail-unconfirmed-api-backend-request-2026-09-16.md)

---

## FE acceptance (BE 회신 기준 · 2026-09-18)

| 항목 | 상태 |
|------|------|
| OpenAPI codegen 재생성 | **완료** — `fetch:openapi` + `generate:api` |
| performance-summary strip 표시만 · 0 강제 없음 | **확인** — adapter 표시만 유지 |
| TT 모집 `maxAssignableInstructors` UI 숨김 · bridge 0 | **완료** |
| `teacherTrainingScheduleName` =「교육 연수」 | **완료** |
| `educationJournalRequired: false` + `journalSubmissionLimitType: UNLIMITED` | **완료** |
| `educationScheduleRange` → bridge → 신청 `disabledDate` (business fallback) | **완료** |
| `PREFERRED_SCHEDULE_*` 에러 코드 매핑 | **완료** — `get-general-program-api-error.ts` |
| 연수/사전안내/`preEducation*` 혼용 없음 | **확인** — TT bridge `preEducationNoticeRequired=false` |
| P2 신청 자동입력 | **CMS 샘플 제거 유지** · Platform affiliation은 BE 서버 기록 |

Seed QA curl (local-demo `186001–186008`):

```bash
curl -s "$BASE/api/admin/programs/186001/trained-teacher/performance-summary"
curl -s "$BASE/api/admin/programs/186001/trained-teacher/detail"
```

---

## 한줄 요약

CMS FE는 교육받은 교사 등록·모집·신청 UI를 최신 노션에 맞춰 고쳤다.  
**실적 숫자·배타 집계·교육 연수 필드·일지 제약·모집 최대 강사 수**는 FE가 임의로 API를 바꾸거나 0으로 덮지 않는다.  
아래 계약을 BE가 확정해 주시면 FE는 표시만 재검증한다. *(→ 2026-09-18 BE 회신·FE acceptance 완료)*

---

## FE가 이미 한 것 (깨지지 않게 유지)

| 영역 | FE 조치 |
|------|---------|
| 참여자 유형 | 학교/기관만 고정 (`organization=true`, 개인·강사·봉사 비활성) |
| IPS | 기본정보 footer 제거 · 유형 설정에서만 관리 |
| 교육 연수 ON | **첫 차시/일정 치환** (prepend 금지) · IPS Prepare 고정 |
| 교육일지 UI | 있음/없음만 · 제출 기한·개수·필수·과제 UI 없음 |
| 등록 플로우 | 참여 **기관 모집** 단계 복원 (강사/봉사자 모집 단계 없음) |
| 신청 한도 | `maxClassCount` / `maxScheduleCount` / `maxSessionsPerDay` → bridge → 신청 UI |
| 교육 가능 기간 | 등록 일정 설정 → `educationScheduleRange` bridge → 신청 캘린더 `disabledDate` |
| 희망 교육 형태 | 등록 교육형태=`참여자 선택`일 때만 신청 노출 |
| 신청 샘플 | 진일초·홍길동 등 **하드코딩 샘플 제거** (빈값+placeholder) |
| 실적 strip | `GET …/performance-summary` **표시만** · FE에서 generalTeachers/instructors/volunteers=0 강제 없음 |
| 모집 최대 강사 수 | TT UI **비노출** · bridge/default `0` (BE ignore) |

---

## 백엔드 전달용 프롬프트 (복사용)

아래를 BE 이슈/PR 본문에 그대로 붙여 주세요.

````markdown
## 요청 요약

교육받은 교사 프로그램(`programType=TRAINED_TEACHER`) FE가 최신 노션 기획에 맞춰 등록·모집·신청 UI를 정합했습니다.

FE는 **API contract를 임의 변경하지 않으며**, 실적 숫자를 FE adapter에서 0으로 덮어쓰지 않습니다.  
아래는 **BE 집계·저장·검증 계약 확인/구현**이 필요한 항목입니다.

범위: `TRAINED_TEACHER` only.  
비범위: 일반 / 1사1교 / UJAT / Gemini / 강사·봉사자 기본 동작 변경.

관련 FE 문서: `apps/cms/docs/api/trained-teachers-notion-fe-align-backend-request-2026-09-18.md`

---

### P0 — 실적 집계 배타성 (`GET …/trained-teacher/performance-summary`)

#### 제품 규칙 (노션 확정)

교육받은 교사 프로그램에서는 학생 교육을 진행한 교사를 **「교육받은 교사」에만** 반영한다.  
아래를 **동시에** 올리면 안 된다.

- 일반 담당교사
- 강사
- 일반 자원봉사자 / 임직원 자원봉사자

시점 분리:

| 시점 | 총 참가자(연수) | 교육받은 교사 | 일반 담당교사 | 강사 | 봉사자 |
|------|-----------------|---------------|---------------|------|--------|
| **교육 연수 일정** | 연수 참가 교사 ↑ | **0** | **0** | **0** | **0** |
| **학생 본교육 일정** | (학생 등 정책대로) | 수업 진행 교사 ↑ | **0** | **0** | **0** |

예시:

1. 교사 A가 교육 연수 참석  
   → 연수 실적: 참여자(+1) · 교육받은 교사(0)
2. 교사 A가 이후 학생 교육 진행  
   → 해당 본교육: 교육받은 교사(+1) · 일반 담당교사(0) · 강사(0)

#### FE가 소비하는 응답 필드 (현 OpenAPI)

`GET /api/admin/programs/{programId}/trained-teacher/performance-summary`

```ts
{
  programId?: number
  teacherTrainingEnabled?: boolean
  educationJournalEnabled?: boolean
  organizationApplicationCount?: number
  teacherTrainingParticipantCount?: number  // 교육 연수 참여자
  trainedTeacherCount?: number              // 교육받은 교사 (본교육)
  studentCount?: number
  classCount?: number
  journalSubmittedCount?: number
  journalNotSubmittedCount?: number
  availableActions?: string[]
}
```

FE UI strip 매핑:

- `trainedTeacherCount` → 「교육받은 교사」
- `teacherTrainingParticipantCount` → 「교사연수 참여」
- 두 필드를 **서로 대체·합산하지 않음**

#### 요청

1. 위 배타 규칙이 **서버 집계 쿼리/서비스**에 반영되는지 확인해 주세요.
2. 공통 실적 로직의 「신청 교사 = 일반 담당교사」가 TT에 **그대로 적용되면 안 됩니다.**
3. programs 상세/KPI의 `generalTeachers` / `instructors` / (봉사 관련 카운트)가 TT에서 올라오더라도,  
   **performance-summary 및 TT 실적 SSOT는 위 배타 규칙을 따릅니다.**  
   (FE는 summary 필드를 신뢰하고 표시합니다.)
4. OpenAPI/핸드오프에 집계 규칙을 한 줄이라도 문서화해 주세요.

#### 기획 확인 필요 (임의 구현 금지)

**교육 연수 OFF + 교재 배송만** 하는 경우:

- 학생 수업을 진행한 교사를 `trainedTeacherCount`에 넣을지
- 산정 트리거(승인 / 교재 배송 / 수업 완료 / distinct 교사)

노션 문구가 「연수 참여 교사」 기준이라 OFF 케이스가 애매합니다.  
**기획 확정 후** BE 규칙을 알려 주시면 FE는 표시만 맞춥니다.

---

### P1 — 모집 「배정 가능 최대 강사 수」(`maxAssignableInstructors`)

#### 현황

- 제품 정책: TT는 **강사 모집/배정 없음**
- FE 모집 폼(기관): 일반/1사1교 상속 UI에 **「배정 가능 최대 강사 수」가 여전히 노출·저장**됨
- FE는 이번 작업에서 **임의 삭제하지 않음** (기획 충돌 → BE/기획 확정 대기)
- 강사·봉사자 **모집/신청 탭은 생성하지 않음**

#### 확인 요청

| 질문 | 기대 회신 |
|------|-----------|
| TT 모집 payload에 `maxAssignableInstructors`를 계속 받을지 | keep / ignore / reject |
| GET detail/recruitment에 echo 할지 | yes/no |
| 강사 배정·신청 API가 이 값을 쓰는지 | 사용처 path 또는 "미사용" |
| 강사 신청 탭/레코드 생성에 영향 있는지 | 없어야 함 (제품) |
| UI 비노출로 가도 되는지 | 기획 확정 후 FE 반영 |

권장(FE 제안, 확정 아님): TT는 필드 **ignore + OpenAPI deprecated** 또는 항상 `0`/`null` 저장 · UI는 후속 FE 숨김.

---

### P1 — 교육 연수 필드 SSOT (UI「교육 연수」↔ 내부 키)

#### 제품

- UI 라벨: **「교육 연수」** (일반 「사전 교육」과 다름)
- ON: 첫 교육 항목 치환 · IPS = Prepare 고정
- OFF: 연수 일정만 없음 · 본교육 커리큘럼 유지

#### FE wire (현행)

| 의미 | FE/저장에서 쓰는 키 (예시) | 비고 |
|------|---------------------------|------|
| 연수 ON/OFF | `teacherTrainingEnabled` (info-detail) | PATCH 시 FE는 `educationJournalRequired: false` 고정 |
| 연수 일정명 | `teacherTrainingScheduleName` (연수 ON 시) | |
| 등록 overlay | `trainedTeachersTeacherTrainingEnabled` · schedule/curriculum의 preEducation 계열 **재사용** | UI만 「교육 연수」 |
| 사전 안내 | TT는 **비정책** · FE bridge `preEducationNoticeRequired=false` | 연수 토글과 **혼용 금지** (FE에서 분리 완료) |

#### 요청

1. BE SSOT 필드명을 확정해 주세요.  
   - 권장: `teacherTrainingEnabled` / `teacherTrainingSchedule*`  
   - 레거시 `preEducation*` 를 TT에 쓰 중이면 **매핑표**를 문서화해 주세요.
2. TT에서 `preEducationNoticeRequired`(사전 안내)를 연수 여부와 묶지 말아 주세요.
3. 교육 연수 일정의 IPS가 Prepare로 강제되는지(서버 validation) 확인해 주세요.  
   FE UI는 잠그지만, API로 다른 IPS를 넣으면 거절/정규화 여부를 알려 주세요.

---

### P1 — 교육일지 제약 없음

#### 제품

- 설정: **있음 / 없음**만
- 제출 기한 없음
- 제출 개수 제한 없음
- 제출 필수 아님

#### FE

- UI에 기한·개수·필수·과제 없음
- info-detail PATCH: `educationJournalRequired: false` 고정 전송

#### 요청

1. DB/DTO/validation에 `deadline` / `minCount` / `maxCount` / `required=true` 제약이 TT에 걸려 있으면 **제거 또는 TT 분기 비활성**
2. `educationJournalEnabled`만으로 on/off 되도록 OpenAPI 명시
3. 일지 업로드 API가 required/count로 4xx를 내지 않는지 확인

---

### P1 — 등록 → 모집 → 신청 데이터 연결 (이미 FE bridge 있음)

FE 등록/모집 화면에서 아래를 bridge로 넘깁니다. **저장된 프로그램 GET**에서도 동일 echo가 필요합니다.

| 필드 | 용도 |
|------|------|
| `educationScheduleMode` (`date` \| `period`) | 신청 일정 UI 모드 |
| `educationScheduleLines` | 날짜 지정 예정일 |
| `educationScheduleRange` `{ start, end }` ISO | 기간 지정 시 신청 캘린더 범위 밖 비활성 |
| `maxClassCount` | 신청 학급 수 Select 상한 |
| `maxScheduleCount` | N지망 상한 |
| `maxSessionsPerDay` | 1일 최대 차시 |
| `showPreferredEducationForm` / 교육형태=`participant_selection` | 희망 교육 형태 노출 |

요청:

1. `GET programs/{id}` · `GET …/trained-teacher/detail` · 모집 nested에 위 값이 **저장 후 재조회**되는지 확인
2. `educationScheduleRange`가 top-level/ nested 중 어디에 있는지 OpenAPI에 명시  
   (없으면 기간 줄을 lines에서 파싱하는 FE fallback은 임시입니다)
3. 신청 API 저장 시 희망 일정이 프로그램 기간·max* 를 벗어나면 **BE validation** 여부 문서화

---

### P2 — 신청 기본정보 자동입력 (로그인 교사·소속 학교)

FE CMS 템플릿/등록 위저드 미리보기에서는 **가짜 샘플(진일초·홍길동)을 제거**했습니다.

Platform(또는 CMS가 대신 작성하는 경우) 신청 작성 시:

| 필드 | 기대 소스 |
|------|-----------|
| 신청 기관명 | 로그인 교사 소속 학교 · 수정 불가 |
| 기관 소재지 | 학교 등록 주소 · 수정 불가 |
| 담당 교사명 | 로그인 회원명 · 수정 불가(기획 따름) |
| Tel / M / E-mail | 회원 연락처 · 수정 허용 여부는 기획 |

요청:

1. 신청 작성 컨텍스트에서 쓸 **회원·학교 조회 API** path/필드를 지정해 주세요.  
   (이미 있으면 OpenAPI 링크만)
2. organization-application POST/PATCH body에 서버가 덮어쓰는 필드(학교 id 등)를 명시해 주세요.
3. CMS admin이 대리 작성할 때 memberId/schoolId를 어떻게 넘기는지 계약이 있으면 알려 주세요.

---

### 수락 조건 (BE)

- [ ] P0: 연수 일정 vs 본교육 일정 실적 배타 집계 + performance-summary 필드 의미 문서화
- [ ] P0: TT에서 일반 담당교사/강사/봉사 중복 집계 없음 (또는 0)
- [ ] P1: `maxAssignableInstructors` TT 정책(keep/ignore/hide) 회신
- [ ] P1: `teacherTraining*` vs `preEducation*` 매핑표
- [ ] P1: 교육일지 기한/개수/필수 제약 TT 없음
- [ ] P1: 교육 가능 기간·모집 한도 GET echo
- [ ] P2: 신청 자동입력 API 안내 (해당 시)

### FE 재검증 (BE 반영 후)

- [ ] performance-summary strip 숫자가 노션 표와 일치
- [ ] 모집 강사 수 필드 유지/숨김 FE 반영
- [ ] 연수 ON/OFF 저장 round-trip
- [ ] 신청 기간 밖 날짜 서버 거절(있다면) 메시지

````

---

## FE 참고 코드 위치

| 주제 | 경로 |
|------|------|
| 실적 표시 | `apps/cms/src/features/program/trained-teachers/api/performance-summary-adapters.ts` |
| 실적 strip | `…/ui/progress/performance-summary-strip.tsx` |
| info-detail 연수·일지 | `…/api/info-detail-adapters.ts` (`educationJournalRequired: false`) |
| 신청 bridge | `apps/cms/src/features/program/general/lib/institution-application-program-bridge.ts` |
| 모집 강사 수 UI | `…/recruit-form/institution/paragraphs/applicant-recruit-participant-info-paragraph.tsx` (`layoutVariant=trainedTeachers`) |
| 등록 모집 단계 | `…/program/general/hooks/use-registration-flow.ts` |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-18 | FE 노션 정합 후 BE 확인 요청 초안 |
