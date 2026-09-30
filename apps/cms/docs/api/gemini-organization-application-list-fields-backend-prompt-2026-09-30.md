# Cursor prompt — Gemini 기관 신청 목록 응답 필드 보강 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** (프론트 `jakorea` 에서 이 버그를 고치지 마라) |
| 작업 위치 | 백엔드 프로젝트에서 이 프롬프트를 열어 구현·테스트·커밋한다 |
| 주 API | `GET /api/admin/gemini/trainings/recruitments/{programId}/organization-applications` |
| 스키마 | `GeminiOrganizationApplicationItem` · `GeminiOrganizationApplicationListResponse` |
| 대상 화면 | CMS → 제미나이 → 찾아가는 연수 → 모집 공고 상세 → LNB **「기관 신청 목록」** |
| 프로그램 유형 | `GEMINI_TRAINING` 만. GENERAL / UJAT / 1사1교 / TRAINED_TEACHER 계약은 바꾸지 마라 |
| 우선순위 | **P0** (목록 3개 컬럼이 전부 빈칸/`-`) |
| 작성일 | 2026-09-30 |
| 상태 | **부분 완료.** 소재지·교사명 투영은 FE/BE 반영됨. **「강의 진행 희망 교육 날짜 및 시간」은 2026-09-30 재확인 시 전 행 `-` → 후속 문서** |
| FE handoff (완료 후) | `JABACK/docs/frontend/gemini-organization-application-list-fields-frontend-handoff-2026-09-30.md` |
| 후속 (희망 일정만) | [`gemini-organization-application-list-preferred-schedule-backend-prompt-2026-09-30.md`](./gemini-organization-application-list-preferred-schedule-backend-prompt-2026-09-30.md) |

**BE handoff:** 목록 item에 `regionSido` · `regionSigungu` · `teacherName` · `preferredScheduleBlocks` · `preferredLectureScheduleText` 추가.  
FE는 Orval 스키마·`mapGeminiOrganizationApplicationToRow`·list query 필터를 반영함.

~~프론트 레포를 이 작업으로 고치지 마라. **백엔드만** 고친다.~~ → BE 배포 후 FE 반영 완료.

---

## 한줄

기관 신청 목록 GET이 `organizationName` · `applicationStatus` · `requestedStudentCount` 정도만 주고,  
CMS 테이블의 **기관 소재지 · 희망 교육 일정 · 담당 교사명**을 줄 필드가 **OpenAPI·응답에 없다.**  
신청 폼에 이미 받는 값을 목록 item에 **투영**해라.

---

## 증상 (CMS UI · 2026-09-30)

모집 공고 상세 → 「기관 신청 목록」 테이블:

| 컬럼 | 화면 | 원인 |
|---|---|---|
| 신청 기관명 | 값 있음 (예: 광주누리초등학교) | `organizationName` OK |
| **기관 소재지** | **전부 빈칸** | 응답에 시/도·시군구 필드 없음 → FE `''` |
| 승인 현황 | 배지 OK | `applicationStatus` OK |
| **강의 진행 희망 교육 날짜 및 시간** | **전부 `-`** | 응답에 희망 일정 필드 없음 → FE `''` |
| 수강 인원 | 값 있음 (예: 17명) | `requestedStudentCount` OK |
| **담당 교사명** | **전부 `-`** | 응답에 `teacherName` 없음 → FE `'-'` |

FE 어댑터는 계약이 없어 **의도적으로** 빈값을 넣는다 (`mapGeminiOrganizationApplicationToRow`):

```ts
institutionSido: '',
institutionSigungu: '',
preferredLectureSchedule: '',
teacherName: '-',
```

FE 매퍼만 고쳐서는 해결 불가. **응답 스키마 확장 + 저장값 투영**이 필요.

---

## 현재 OpenAPI (얇은 계약)

`GeminiOrganizationApplicationItem` (dashboard OpenAPI · Orval):

| 필드 | 목록 사용 |
|---|---|
| `applicationId` | row id |
| `programId` / `recruitmentId` / `organizationId` | 내부 |
| `organizationName` | 신청 기관명 |
| `applicationStatus` | 승인 현황 |
| `requestedStudentCount` | 수강 인원 |
| `requestedClassCount` | (목록 미사용) |
| `submittedAt` / `approvedAt` / `rejectedAt` | (목록 미사용) |
| `resultNotificationSentAt` / `availableActions` | 알림 재발송 게이트 |

**없는 필드:** 소재지 · 희망 일정 · 담당 교사명.

Query도 `status` · `page` · `size` 만 있다. CMS 필터의 기관명/소재지/교사명은 서버 필터로 아직 못 탄다 (P1, 아래).

---

## 신청 폼에 이미 있는 데이터 (투영 소스)

양식 seed: `application-gemini-visiting-training-school`

| 단락 | seed id | 목록 컬럼 |
|---|---|---|
| 담당 교사 정보 | `gemini-vt-inst-seed-contact` | 담당 교사명 |
| 진행 희망 교육 일정 | `gemini-vt-inst-seed-preferred-schedule` | 강의 진행 희망 교육 날짜 및 시간 |

기관 소재지는 학교/기관 마스터(`organizationId`)의 시·도·시군구, 또는 신청 스냅샷에서 투영.

더미 시드 기대값 참고: `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md`  
(GVT-I-01~03: 시/도·시군구 · 희망 일정 텍스트 · 담당 교사 `홍길동`)

---

## 요구사항 (P0)

### 1. `GeminiOrganizationApplicationItem`에 필드 추가

GENERAL 기관 목록(`OrganizationApplicationListItemResponse`)과 **이름 정렬**을 권장한다.

| 필드 | 타입 | CMS 컬럼 | 비고 |
|---|---|---|---|
| `regionSido` | `string \| null` | 기관 소재지 (앞) | 예: `광주광역시` |
| `regionSigungu` | `string \| null` | 기관 소재지 (뒤) | 예: `광산구` |
| `teacherName` | `string \| null` | 담당 교사명 | 신청서 담당 교사 |
| `preferredScheduleBlocks` | `PreferredScheduleBlock[] \| null` | 희망 일정 (구조) | 기존 공통 스키마 재사용 |

`PreferredScheduleBlock` (이미 OpenAPI에 있음):

```ts
{
  preferenceRank?: number  // 1,2,3 …
  date?: string            // ISO date 권장 YYYY-MM-DD
  dayOfWeek?: string       // 선택
  sessionCount?: number
  sessionTimes?: { startTime?: string; endTime?: string }[]
}
```

#### (권장) 표시용 문자열도 함께

FE 셀은 현재 아래 **멀티라인 텍스트**를 파싱한다:

```text
1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)
2지망 : 2026. 01. 16(금) | 15:30~16:40(2차시)
3지망 : 2026. 01. 23(금) | 15:30~16:40(2차시)
```

규칙:

- 줄바꿈 `\n` 구분
- `순위라벨 : 날짜 | 시간(차시)`
- 콜론·파이프 필수 (없으면 FE는 `-` 표시)

선택 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `preferredLectureScheduleText` | `string \| null` | 위 포맷 표시 문자열. **blocks가 SSOT**, text는 편의 투영 |

**최소 P0:** `regionSido` · `regionSigungu` · `teacherName` · (`preferredScheduleBlocks` **또는** `preferredLectureScheduleText` 중 하나 이상).  
둘 다 주면 FE가 text 우선·blocks 폴백으로 연결하기 쉽다.

### 2. 저장·투영

- Platform/CMS에서 기관이 신청할 때 위 값을 **persist**
- 목록 GET은 DB/스냅샷에서 **읽어 응답에 포함**
- 값이 없으면 `null` (빈 문자열보다 null 권장). FE는 `-` / 빈칸 처리

### 3. OpenAPI

- `GeminiOrganizationApplicationItem` 스키마 갱신
- operation `organizationApplications_2` (또는 동일 path) 응답에 반영
- description에 각 필드 ↔ CMS 컬럼 한 줄 매핑

### 4. 시드

로컬/스테이징 Gemini 기관 신청 더미에 아래를 채워라 (기존 GVT-I-01~03 권장):

| CASE | regionSido | regionSigungu | teacherName | 희망 일정 |
|---|---|---|---|---|
| I-01 | 서울특별시 | 강서구 | 홍길동 | 1~3지망 샘플 |
| I-02 | 경기도 | 성남시 분당구 | 홍길동 | 동일 패턴 |
| I-03 | 인천광역시 | 연수구 | 홍길동 | 동일 패턴 |

---

## 요구사항 (P1 · 필터, 동일 PR 가능하면 함께)

CMS 필터 UI는 이미 있다. 서버 query는 아직 `status`만.

| query | 설명 |
|---|---|
| `organizationName` / `keyword` | 신청 기관명 부분일치 |
| `regionSido` | 시/도 |
| `regionSigungu` | 시군구 |
| `teacherName` | 담당 교사명 부분일치 |
| `status` | 기존 유지 |

P0 필드 투영만 먼저 해도 UI 빈칸은 해소된다. 필터는 후속 가능.

---

## 기대 응답 예시

`GET …/recruitments/{programId}/organization-applications?page=0&size=20`

```json
{
  "content": [
    {
      "applicationId": 9001,
      "programId": 185002,
      "recruitmentId": 185002,
      "organizationId": 501,
      "organizationName": "광주누리초등학교",
      "applicationStatus": "PENDING",
      "requestedStudentCount": 17,
      "regionSido": "광주광역시",
      "regionSigungu": "광산구",
      "teacherName": "김교사",
      "preferredScheduleBlocks": [
        {
          "preferenceRank": 1,
          "date": "2026-01-09",
          "dayOfWeek": "금",
          "sessionCount": 2,
          "sessionTimes": [{ "startTime": "15:30", "endTime": "16:40" }]
        }
      ],
      "preferredLectureScheduleText": "1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)",
      "resultNotificationSentAt": null,
      "availableActions": ["VIEW"]
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 6
}
```

---

## 하지 말 것

- GENERAL / UJAT / TT `organization-applications` 응답 스키마를 Gemini 때문에 깨뜨리기
- 목록에서 개인정보 원문(전화·이메일·상세주소)을 불필요하게 추가 노출
- FE에 mock으로만 채우고 OpenAPI는 그대로 두기
- 필드명을 문서마다 다르게 (`institutionSido` vs `regionSido` 혼용). **목록은 `regionSido`/`regionSigungu`로 통일** (GENERAL 정렬). 승인 연수 목록의 `institutionSido`와 이름이 달라도 됨 — Gemini 승인 연수 계약은 이번 범위 밖

---

## 완료 기준

- [x] OpenAPI `GeminiOrganizationApplicationItem`에 P0 필드 문서화
- [x] 실제 GET 응답에 필드 non-null 샘플 (시드 또는 실신청)
- [x] CMS 새로고침 후 소재지·희망일정·교사명 컬럼에 값 표시 (FE Orval·매퍼 반영 후)
- [x] handoff 문서에 확정 필드명·포맷·시드 id 기록
- [x] GENERAL 기관 목록 회귀 없음

---

## FE 후속 (BE 완료 후 · 반영 완료 2026-09-30)

1. ~~OpenAPI merge + Orval 재생성~~ — `dashboard.openapi.json` + generated `GeminiOrganizationApplicationItem` 갱신
2. ~~`mapGeminiOrganizationApplicationToRow`에서 하드코딩 제거 후 매핑~~
3. ~~`preferredLectureScheduleText` 없으면 `preferredScheduleBlocks` → 표시 문자열 변환~~
4. ~~(P1) list client에 필터 query 전달~~

---

## 관련

- FE 어댑터: `apps/cms/src/features/program/gemini/api/visiting-training/adapters.ts` (`mapGeminiOrganizationApplicationToRow`)
- FE 셀 파서: `…/gemini/ui/detail/gemini-institution-preferred-lecture-schedule-cell.tsx`
- 더미 시드: `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md`
- GENERAL 정렬 참고: `OrganizationApplicationListItemResponse` (`regionSido` · `regionSigungu` · `teacherName`)
- 양식 seed: `apps/cms/docs/api/form-template-seeds/application-gemini-visiting-training-school.json`
