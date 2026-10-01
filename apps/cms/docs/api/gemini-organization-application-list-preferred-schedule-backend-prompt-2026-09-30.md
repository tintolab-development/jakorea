# Cursor prompt — Gemini 기관 신청 목록 「강의 진행 희망 교육 날짜 및 시간」비움 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** (프론트 `jakorea` 에서 이 버그를 mock/하드코딩으로 고치지 마라) |
| 작업 위치 | 백엔드 프로젝트에서 이 프롬프트를 열어 구현·테스트·커밋한다 |
| 주 API | `GET /api/admin/gemini/trainings/recruitments/{programId}/organization-applications` |
| 스키마 | `GeminiOrganizationApplicationItem` |
| 대상 화면 | CMS → 제미나이 → 찾아가는 연수 → 모집 공고 상세 → LNB **「기관 신청 목록」** → 컬럼 **「강의 진행 희망 교육 날짜 및 시간」** |
| 프로그램 유형 | `GEMINI_TRAINING` 만 |
| 우선순위 | **P0** |
| 작성일 | 2026-09-30 |
| 선행 문서 | `apps/cms/docs/api/gemini-organization-application-list-fields-backend-prompt-2026-09-30.md` (P0 필드 스키마·소재지·교사명) |
| 상태 | **BE 완료 · FE 확인 (2026-09-30).** `programId=185004` 기관 신청 6건 모두 `1지망 :` 표시. FE 매퍼는 text 우선 기존 계약 유지 |

BE handoff: `JABACK/docs/frontend/gemini-organization-application-list-preferred-schedule-frontend-handoff-2026-09-30.md`  
FE는 필드명 변경 없음. `preferredLectureScheduleText` 우선 매핑이 응답을 그대로 표시한다.

---

## 한줄

목록 GET의 `regionSido` · `regionSigungu` · `teacherName` 은 채워져 CMS에 보이는데,  
같은 item의 **`preferredScheduleBlocks` / `preferredLectureScheduleText` 가 null·빈값·불완전**해서  
「강의 진행 희망 교육 날짜 및 시간」만 전 행 `-` 이다.  
신청 시 저장된 희망 일정을 목록 item에 **완전하게 투영**하라.

---

## 증상 (CMS · 2026-09-30 재확인)

모집 공고 예: 「제미나이 찾아가는 연수 모집 종료」→ 「기관 신청 목록」총 6건.

| 컬럼 | 화면 | 판정 |
|---|---|---|
| 신청 기관명 | 값 있음 | OK |
| 기관 소재지 | 값 있음 (예: 광주 서구, 대전 유성구) | OK — `regionSido`/`regionSigungu` 투영됨 |
| 승인 현황 | 배지 OK | OK |
| **강의 진행 희망 교육 날짜 및 시간** | **6건 전부 `-`** | **FAIL** |
| 수강 인원 | 값 있음 | OK |
| 담당 교사명 | 값 있음 | OK — `teacherName` 투영됨 |

선행 P0 문서의 **소재지·교사명은 동작 중**. 희망 일정만 잔여 버그.

---

## FE가 이미 하는 일 (고치지 마라)

경로:

- 어댑터: `apps/cms/src/features/program/gemini/api/visiting-training/adapters.ts` → `mapGeminiOrganizationApplicationToRow`
- 변환: `…/preferred-lecture-schedule.ts` → `resolveGeminiPreferredLectureSchedule`
- 셀: `…/gemini-institution-preferred-lecture-schedule-cell.tsx`

규칙:

1. `preferredLectureScheduleText` trim 값이 있으면 **그대로** 사용.
2. 없으면 `preferredScheduleBlocks` → 아래 포맷 문자열로 변환.
3. 둘 다 비거나 변환 결과가 빈 문자열이면 셀이 `-` 렌더.

기대 포맷 (멀티라인 `\n`):

```text
1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)
2지망 : 2026. 01. 16(금) | 15:30~16:40(2차시)
```

blocks → text 변환이 **성공하려면** 각 block에 최소:

| 필드 | 필수 | 비고 |
|---|---|---|
| `preferenceRank` | **필수** (≥ 1) | 없거나 0이면 FE가 해당 줄 **폐기** |
| `date` | **필수** | `YYYY-MM-DD` 권장 |
| `sessionTimes[].startTime` + `endTime` | **권장 필수** | 또는 `timeRange` |
| `sessionCount` | 권장 | 없으면 times 길이로 대체 |
| `dayOfWeek` | 선택 | 없으면 FE가 date로 요일 계산 |

단위 테스트로 FE는 text/blocks 둘 다 매핑 가능함을 이미 검증함.  
**응답에 유효 값이 오면 UI는 채워진다.** 매퍼만 고쳐서는 해결 불가.

---

## 의심 원인 (BE에서 확인할 것)

우선순위대로 점검:

1. **목록 투영 누락**  
   - `regionSido`/`teacherName`만 organization·teacher join 하고  
   - `preferred_schedule_blocks_jsonb`(또는 동등 컬럼) / answers의 희망 일정은 **select·map에서 빠짐** → 항상 `null`.

2. **신청 저장 누락**  
   - Platform 제출은 `preferredScheduleBlocks`를 body/answers에 넣음 (`apps/platform/.../preferred-schedule-blocks.ts`).  
   - Gemini 기관 신청 create가 그 값을 persist하지 않음 → 목록도 null.

3. **answers만 있고 top-level 컬럼 비움**  
   - 단락 id `gemini-vt-inst-seed-preferred-schedule` answers에만 있음.  
   - 목록 DTO는 jsonb 컬럼만 읽어 answers를 안 읽음.

4. **불완전 blocks**  
   - `[{ "date": "2026-01-09" }]` 처럼 rank·sessionTimes 없음 → FE 변환 결과 `''` → `-`.  
   - OpenAPI “필드 있음”만으로는 통과로 치지 마라. **표시 가능한 완전 블록**이어야 함.

5. **시드 미기입**  
   - GVT-I-* 더미에 소재지·교사만 넣고 희망 일정을 안 넣음.  
   - 실신청 행도 비면 1~3이 원인. 시드만 비면 시드+투영 둘 다 고쳐라.

---

## 요구사항

### 1. 목록 GET 응답

각 `content[]` 행에 대해 (값이 있는 신청이면):

| 필드 | 조건 |
|---|---|
| `preferredScheduleBlocks` | 완전 블록 배열 **non-null·length ≥ 1**, 또는 |
| `preferredLectureScheduleText` | 위 포맷 문자열 **non-null·non-blank** |

**권장:** blocks(SSOT) + text(편의 투영) **둘 다**.  
최소: 둘 중 하나만 있어도 FE는 표시한다. **둘 다 null이면 FAIL.**

완전 블록 예시:

```json
{
  "preferenceRank": 1,
  "date": "2026-01-09",
  "dayOfWeek": "금",
  "sessionCount": 2,
  "sessionTimes": [
    { "sessionIndex": 1, "startTime": "15:30", "endTime": "16:40", "timeRange": "15:30~16:40" }
  ]
}
```

### 2. Persist (create/apply)

- Portal/Admin Gemini 기관 신청 접수 시 `preferredScheduleBlocks`를 **DB에 저장**.
- answers 키(단락 `gemini-vt-inst-seed-preferred-schedule`)만 쓰지 말고,  
  목록이 읽는 **동일 SSOT 컬럼**(문서상 `preferred_schedule_blocks_jsonb`)에도 기록.
- 기존에 answers에만 있는 행은 목록 투영 시 answers → blocks로 **폴백 복원**해도 된다 (마이그레이션 또는 read-time).

### 3. 시드

`06-gemini-dummy-seed.md` GVT-I-01~03 (및 스테이징 「모집 종료」공고의 6건)에  
희망 일정 샘플을 **반드시** 넣어라:

```text
1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)
2지망 : 2026. 01. 16(금) | 15:30~16:40(2차시)
3지망 : 2026. 01. 23(금) | 15:30~16:40(2차시)
```

### 4. OpenAPI

스키마 키 이름은 이미 있음 (`preferredScheduleBlocks`, `preferredLectureScheduleText`).  
설명에 「목록 행에 값이 있으면 non-null. CMS 「강의 진행 희망 교육 날짜 및 시간」」을 재확인하고,  
**실응답 예시**를 handoff에 붙여라.

---

## 검증 (필수)

로컬/스테이징에서:

```http
GET /api/admin/gemini/trainings/recruitments/{programId}/organization-applications?page=0&size=20
```

응답 `content` 중 **최소 1건**(가능하면 시드 전 건)에 대해:

```bash
# preferredLectureScheduleText non-blank 이거나
# preferredScheduleBlocks[0].preferenceRank >= 1
# かつ preferredScheduleBlocks[0].date 존재
# 그리고 sessionTimes에 startTime/endTime(또는 timeRange) 존재
```

그 후 CMS 동일 공고 「기관 신청 목록」을 새로고침하면  
「강의 진행 희망 교육 날짜 및 시간」이 `-`가 아니라 `1지망 : …` 형태로 보여야 한다.

스크린샷 기준 6건이 모두 `-`였으므로, **전 행 null이면 배포 완료로 치지 마라.**

---

## 하지 말 것

- FE에 mock 일정 문자열을 심어 “고친 것처럼” 보이게 하기
- GENERAL / UJAT / TT organization-applications 계약을 Gemini 때문에 깨기
- `preferenceRank` 없는 빈 객체만 넣고 완료 처리
- OpenAPI에 필드만 있고 실제 GET은 계속 null인 상태 유지
- 소재지·교사명 투영을 되돌리기

---

## 완료 기준

- [ ] 시드 또는 실신청 목록 GET에서 `preferredLectureScheduleText` 또는 완전 `preferredScheduleBlocks` non-null
- [ ] CMS 「강의 진행 희망 교육 날짜 및 시간」에 1지망 줄이 보임 (전 행 `-` 해소)
- [ ] handoff: 확정 저장 컬럼명 · answers 폴백 여부 · 샘플 JSON 1건
- [ ] 선행 문서의 소재지·교사명 회귀 없음

---

## 관련

- 선행: `apps/cms/docs/api/gemini-organization-application-list-fields-backend-prompt-2026-09-30.md`
- 시드: `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md` (GVT-I-*, 희망 일정 샘플)
- 양식 단락: `gemini-vt-inst-seed-preferred-schedule` (`application-gemini-visiting-training-school`)
- Platform 제출: `apps/platform/src/features/program/lib/preferred-schedule-blocks.ts`
- FE 매퍼/셀: 위 「FE가 이미 하는 일」
