# Cursor prompt — 1사1교 진행 현황 · 참여 강사 남은 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/company-school-program-progress-instructor-remaining-backend-request-2026-10-02.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** (A 강사 등록 · B 강사 신청 운영정보 PATCH · C 대표→일반 · D INSTRUCTOR 목록 채움 · E COMPANY_SCHOOL 허용) |
| 화면 | CMS **1사1교** 프로그램 상세 → LNB **프로그램 진행 현황** → **참여 강사** 목록·상세 (신청 정보 / 교육 배정 현황 / 강의보고서 관리 / 정산 현황) |
| 대상 프로그램 | `programType=COMPANY_SCHOOL` 만. 일반·UJAT·Gemini·교육받은 교사 전용 path 아님 |

**전용 path를 만들지 마라.** 1사1교 참여 강사는 이미 공유

`GET /api/admin/programs/{programId}/participants?participantType=INSTRUCTOR`  
`GET/PATCH /api/admin/instructor-applications/{id}`  
`POST …/participants/{participantId}/give-up`  
instructor-assignments list/create/cancel/representative  
lecture-reports · settlements

를 쓴다. `company-school-instructors` 같은 새 리소스를 열지 마라.

강사 등록·신청 운영정보 PATCH·대표 강등·INSTRUCTOR 목록 채움 계약은 일반 진행 현황 문서와 **같은 티켓에서 한 번만** 열어라. 이 문서는 1사1교 화면에 다시 적는다. 구현은 아래를 따른다.

- `apps/cms/docs/api/general-program-progress-remaining-backend-request-2026-10-02.md` **§F · §G · §H · §I**

이미 다른 문서로 전달한 것은 **이 파일에서 다시 만들지 마라.**

- 1사1교 기관·강사 **신청** 잔여 (강사 PATCH 포함): `company-school-application-remaining-backend-request-2026-10-02.md`
- 1사1교 진행 현황 · 참여 기관 잔여: `company-school-program-progress-institution-remaining-backend-request-2026-10-02.md`
- 일반 진행 현황 잔여 전체: `general-program-progress-remaining-backend-request-2026-10-02.md`

클라 엑셀 다운로드는 FE 로컬이다. **엑셀 export API를 만들지 마라.**  
합반은 일반 기관만이다. **COMPANY_SCHOOL 에 organization-merge-groups 를 열지 마라.**  
진행 현황에 **승인 취소** 를 신설하지 마라. SSOT는 **활동 포기**.  
목록 **강사 삭제** 버튼은 이 화면에 없다. 삭제 path를 만들지 마라.

---

## 1. 한 줄 요약

1사1교 참여 강사의 목록·신청 GET·unmask·코멘트·포기·배정·대표 지정·강의보고서·정산 조회는 공유 path 로 이미 열려 있다.  
남은 서버 일은 **(A) 강사 등록 mutation**, **(B) 강사 신청 운영정보 PATCH**, **(C) 대표 강사 강등**, **(D) INSTRUCTOR 목록 채움**, **(E) COMPANY_SCHOOL 을 403 하지 말 것** 이다.

---

## 2. FE가 이미 붙인 것 — 시그니처를 깨지 마라

1사1교 진행 현황 LNB **참여 강사** 목록·상세 탭은 일반 기관형과 같다. 개인 프로그램용 회차 배정 UI는 쓰지 않는다.

이 티켓에서 아래 계약을 바꾸지 마라. 새 도메인·새 리소스를 만들지 마라.

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 참여 강사 목록 | `GET /api/admin/programs/{programId}/participants?participantType=INSTRUCTOR` | `id=participantId`, `sourceApplicationId` → `instructorApplicationId`, `memberId` |
| 배정 기관명 조인 | instructor-assignments list + calendar | 목록 「배정 기관」 컬럼. 1사1교 opt-in |
| 신청 정보 보강 | `GET /api/admin/instructor-applications/{id}` + form hydrate | 1사1교 applications opt-in |
| 개인정보 원문 | `POST /api/admin/instructor-applications/{id}/privacy/unmask` | 신청 ID 없으면 회원 강사 unmask fallback |
| 코멘트 | `PATCH /api/admin/instructor-applications/{id}` | **지금 body는 `managerComment`만** |
| 활동 포기 | `POST /api/admin/programs/{programId}/participants/{participantId}/give-up` | `reason` + optional `stopScheduleId` |
| 활동인증서 | serial + download-logs + 클라 PDF | 새 발급 path를 만들지 마라 |
| 선택 배정 | `create` instructor-assignment | `instructorMemberId` + `organizationApplicationId` + `scheduleId`/`requestedScheduleId` |
| 배정 취소 | `cancel` instructor-assignment | |
| 대표 강사 지정 | `putRepresentative` | **강등(일반)은 없음** |
| 강의보고서 목록/보기/일괄 | lecture-reports GET + file download | 1사1교 progress opt-in |
| 정산 목록·지급조서 | settlements `programId` + `instructorMemberId` | 상태 변경 버튼은 현재 화면에 없음 |
| 강사 등록 후보 | members 강사 목록 | 등록 **mutation은 없음**. 확인 후 FE는 호출하지 않는다 |

쓰지 마라.

- 1사1교 전용 participants / instructor-assignments path.
- `organization-applications/{id}/give-up` — 활동 포기는 **participantId**.
- 진행 현황 **승인 취소**.
- 엑셀 export admin API.
- 정산 상태 변경 mutation. 화면 버튼이 없다.
- 참여 강사 삭제 mutation. 화면 버튼이 없다.

---

## 3. 지금

### A. 참여 강사 등록 — P1

목록 **강사 등록** → 회원 선택 → 동의 확인. 확인 후 FE는 **호출하지 않는다.** `program-api-unavailable`.

`GET …/participants` 는 조회만 있다. 강사 회원을 이 프로그램 INSTRUCTOR participant 로 넣는 mutation 이 없다.

일반 문서 **§F** 와 같다. 같은 mutation 을 `programType=COMPANY_SCHOOL` 에서도 200 으로 열어라. 승인 플로우(`POST …/instructor-applications/{id}/approve`)를 이 버튼에 재사용하지 마라.

권장:

```http
POST /api/admin/programs/{programId}/participants
```

```json
{ "participantType": "INSTRUCTOR", "memberId": 190022 }
```

동의서 작성은 FE 모달이다. 이 mutation 에 동의서 PDF를 요구하지 마라.

### B. 참여 강사 신청 정보 저장 — P1

상세 **정보 수정** 저장은 미연동. OpenAPI `PATCH …/instructor-applications/{id}` summary 가 「관리자 코멘트 수정」이고 body `Update` 는 `managerComment` 만이다.

화면 편집 필드: 강의료 기준·금액, 강의료 등급, 사업소득자 여부.

일반 문서 **§G**, 1사1교 신청 잔여 **§D** 와 **같은 스키마 확장**이다. 새 path 를 만들지 마라. COMPANY_SCHOOL 에서 403 나지 마라.

### C. 대표 강사 → 일반 강사 — P1

`putRepresentative` 로 대표 지정만 된다. 대표를 일반으로 내리는 path 가 없다. FE는 미연동 안내.

일반 문서 **§H**, 1사1교 참여 기관 잔여 **§F** 와 같다. 기존 representative 리소스를 확장하거나 형제 path 를 열어라. 새 도메인을 만들지 마라. COMPANY_SCHOOL 에서 403 나지 마라.

다른 강사를 자동 대표로 올리지 마라. `putRepresentative` 시그니처를 깨지 마라.

### D. INSTRUCTOR participant 목록 채움 — P1

FE가 버리는 필드가 없다. 서버가 비우면 화면이 비거나 액션이 막힌다.

일반 문서 **§I** 와 같다. COMPANY_SCHOOL 목록에도 채워라. FE가 강사마다 신청 상세를 N+1 해서 목록을 채우지 않는다.

| 필드 | 없으면 |
|------|--------|
| `participantId` | give-up path 실패 |
| `memberId` | 배정 create · 정산 조회 · 회원 unmask fallback 실패 |
| `sourceApplicationId` | 신청 GET · 코멘트 PATCH · **신청 unmask** 실패 |
| `sessions[].scheduleId` | 활동 포기 회차 `stopScheduleId` 없음. give-up 은 id 없이라도 보낸다 |
| `memberName` / 연락처 / 자택 / JA 등급·경력 / `settlementStatus` / `giveUpAt` | 목록·필터·배지가 비어 보임 |

일정 미확정만 빈 `sessions`. 확정된 교육일이 있는데 `scheduleId` 를 빼지 마라.

### E. COMPANY_SCHOOL 허용 — P1

위 공유 path는 `programType=GENERAL` 만이 아니라 **`COMPANY_SCHOOL` 에서도 200** 이어야 한다.

다음이 COMPANY_SCHOOL 이면 **403 / 404 / “일반 프로그램만”** 으로 거절하지 마라.

| path |
|------|
| `GET …/participants?participantType=INSTRUCTOR` |
| `POST …/participants` (강사 등록, §A 가 열리면) |
| `POST …/participants/{id}/give-up` |
| `GET/PATCH …/instructor-applications/{id}` |
| `POST …/instructor-applications/{id}/privacy/unmask` |
| instructor-assignments list/create/cancel/representative · calendar |
| lecture-reports GET + file download |
| settlements `programId` + `instructorMemberId` |

규칙:

1. 담당 프로그램 범위·권한은 지금과 같다. 유형만 막지 마라.
2. `availableActions` 에 `GIVE_UP` 을 빼지 마라. CMS는 이걸로 활동 포기 버튼을 켠다.
3. 합반(`organization-merge-groups`) 은 COMPANY_SCHOOL 에 **열지 마라.**

---

## 4. 요청하지 않는 것

- 진행 현황 승인 취소
- 1사1교 합반
- 목록 소재지/학년/경력 서버 필터 신규 쿼리
- 캘린더 전용 API
- 엑셀 export API
- 정산 상태 변경
- 참여 강사 삭제
- 활동인증서 새 발급 path
- 1사1교 전용 instructor path
- 참여 기관 LNB 잔여(교재·roster) — 그건 `company-school-program-progress-institution-remaining-backend-request-2026-10-02.md`

---

## 5. 완료 조건

1. 강사 등록 mutation 이 있고 COMPANY_SCHOOL 에서 200. 다음 INSTRUCTOR 목록 GET 에 그 행이 있다.
2. `PATCH …/instructor-applications/{id}` 가 강의료·등급·사업소득자를 받고, GET 상세에 같은 값이 나온다. 기존 `managerComment` 만 보내던 호출은 깨지지 않는다.
3. 대표 → 일반 강등 path 가 있고 COMPANY_SCHOOL 에서 200. 지정(`putRepresentative`)은 그대로 200.
4. INSTRUCTOR 목록에 `participantId`, `memberId`, `sourceApplicationId`, `sessions[].scheduleId` 가 채워진다.
5. §2 표 path 전부 COMPANY_SCHOOL 에서 403 나지 않는다.
6. 1사1교 전용 path는 없다.

---

## 6. 검증

COMPANY_SCHOOL 프로그램 하나와 승인된 강사 참여자 몇 건으로:

1. 목록 GET `participantType=INSTRUCTOR` → 200. `memberId`, `sourceApplicationId`, `sessions[].scheduleId` 가 있다.
2. 상세 GET instructor-application + unmask + 코멘트 PATCH → 200.
3. give-up → 200. `scheduleId` 없는 건 FE가 `stopScheduleId` 없이 보낸다.
4. 배정 create/cancel/대표 지정 → 200. 강등 path 가 있으면 그것도 200.
5. 강의보고서 GET · 정산 list → 200.
6. (A 구현 후) 강사 회원 `memberId` 로 participants POST → 200. 같은 회원 재등록은 409.
7. 같은 프로그램이 COMPANY_SCHOOL 인데 INSTRUCTOR participants GET 이 403 이면 **실패**.
