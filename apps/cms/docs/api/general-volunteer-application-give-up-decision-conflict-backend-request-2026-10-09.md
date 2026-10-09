# Cursor prompt — 봉사자 신청 `give-up` · `APPLICATION_DECISION_CONFLICT` (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-volunteer-application-give-up-decision-conflict-backend-request-2026-10-09.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-09 |
| 상태 | **BE 완료** — FE 코드 변경 없음. QA만. 핸드오프: `JABACK/docs/frontend/general-volunteer-application-give-up-decision-conflict-frontend-handoff-2026-10-09.md` |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P0** (심사 화면 「활동 포기」 실패) |
| 화면 | CMS 일반 프로그램 상세 → LNB **봉사자 신청 목록** → **서류 합격자(면접일 배정)** / **2차 면접 대상자** → 활동 포기 |
| 재현 (구) | `1691347` — 현재 `REJECTED`. QA는 **`1691348`** (`DOCUMENT_PASSED`, program `186050`) |
| 대상 path | `volunteer-applications/{id}/give-up`. 진행현황 `participants/{id}/give-up` 과 **혼동하지 마라** |

관련:

- **BE → FE 핸드오프 (완료):** `JABACK/docs/frontend/general-volunteer-application-give-up-decision-conflict-frontend-handoff-2026-10-09.md`
- 봉사자 신청 decision·알림(이미 열린 계약): [general-organization-application-decision-notify-timing-backend-request-2026-10-02.md](./general-organization-application-decision-notify-timing-backend-request-2026-10-02.md) — §0 「봉사자 활동 포기」
- 진행현황 활동 포기(participantId): [general-program-progress-remaining-backend-request-2026-10-02.md](./general-program-progress-remaining-backend-request-2026-10-02.md) — `volunteer-applications/{id}/give-up` 을 진행 포기로 쓰지 말 것
- 기관 신청 vs 참여 give-up FE 수용: [general-org-application-vs-participant-give-up-fe-acceptance-2026-09-16.md](./general-org-application-vs-participant-give-up-fe-acceptance-2026-09-16.md)

---

## 1. 한 줄 요약

CMS 심사 화면이 `POST …/volunteer-applications/{id}/give-up` 을 호출하면  
`APPLICATION_DECISION_CONFLICT` (`현재 신청 상태에서는 승인·반려·취소 처리를 수행할 수 없습니다.`) 로 거절된다.  
FE는 path·body를 이미 맞게 보낸다. **심사 단계 활동 포기 허용 status 게이트를 give-up 전용으로 열어라.**  
승인·반려·취소와 같은 decision 가드를 그대로 재사용해 give-up까지 막지 마라.

---

## 2. FE 관측 (2026-10-09)

### 2.1 요청

```http
POST /api/admin/volunteer-applications/1691347/give-up
Content-Type: application/json
Authorization: Bearer <관리자>
```

```json
{ "reason": "1회차" }
```

- `reason` 은 심사 모달에서 고른 **회차 라벨**을 그대로 넣는다 (`stopScheduleLabel`). minLength 2 충족.
- 심사 단계에서는 `stopScheduleId` 를 **보내지 않는다** (OpenAPI optional). 진행현황 포기와 계약을 섞지 마라.

### 2.2 응답 (실패)

```json
{
  "success": false,
  "data": null,
  "message": "현재 신청 상태에서는 승인·반려·취소 처리를 수행할 수 없습니다.",
  "error": {
    "code": "APPLICATION_DECISION_CONFLICT",
    "message": "현재 신청 상태에서는 승인·반려·취소 처리를 수행할 수 없습니다.",
    "field": "status",
    "traceId": "48944c463fd646da80fd3144623a3970",
    "details": null
  }
}
```

- `field: "status"` → **상태 전이 거부**. body `reason` 검증 실패가 아니다.
- 메시지가 「승인·반려·취소」라서, give-up 이 **approve/reject/cancel 과 동일 status 가드**를 타는 것으로 보인다.

### 2.3 FE 호출 경로 (변경 불필요)

| 역할 | 경로 |
|------|------|
| client | `apps/cms/src/features/program/general/api/applications-api-client.ts` → `giveUpVolunteerApplicationRemote` |
| service | `giveUpGeneralVolunteerApplication(applicationId, reason)` → `{ reason }` only |
| hook | `use-general-volunteer-applications-remote.ts` → `applyRemoteGiveUp` |
| UI | `use-doc-passed.ts` / `use-interview2.ts` — 모달 `stopScheduleLabel` → reason |

OpenAPI `ApplicationGiveUpRequest`:

- `reason` (필수, 2~500)
- `stopScheduleId` (optional)
- `faultParty` (optional)

FE는 심사 포기에서 `reason` 만 보낸다. **이 티켓에서 FE body를 바꾸라고 요구하지 마라.**

---

## 3. path 경계 (필수)

| 단계 | API | 용도 |
|------|-----|------|
| **심사** (서류합격·면접배정·2차면접) | `POST /api/admin/volunteer-applications/{applicationId}/give-up` | 신청 단계 활동 포기 → 면접/심사에서 제외 |
| **진행** (참여 봉사자) | `POST /api/admin/programs/{programId}/participants/{participantId}/give-up` | 확정 참여 후 회차부터 포기 (`stopScheduleId`) |

이 티켓은 **심사 path만** 고친다.  
진행 path를 심사 포기 대용으로 FE에 넘기거나, 심사 path를 죽여서 participant로만 유도하지 마라.  
`organization-applications/{id}/give-up` 은 만들지 마라 (기존 계약).

---

## 4. 해야 할 일

### 4.1 give-up 허용 status (필수)

`POST …/volunteer-applications/{id}/give-up` 은 아래 **신청 status** 에서 **200** 이어야 한다.

권장 허용 (대소문자 무시, thin alias 포함 시 canonical 로 정규화):

| 허용 | 비고 |
|------|------|
| `DOCUMENT_PASSED` | 서류 합격 · 면접일 배정 대기/가능 |
| `INTERVIEW_ASSIGNED` | 면접 배정됨 · 2차 면접 대상 |
| (해당 시) `WAITING_INTERVIEW` / 면접 관련 thin alias | OpenAPI·코드의 실제 canonical 에 맞춰 문서화 |

**거부(409)가 맞는 경우**만 conflict:

| 거부 | 이유 |
|------|------|
| 이미 `GIVE_UP` / 활동 포기 플래그 | 중복 포기 |
| `FINAL_SELECTED` / `APPROVED`(참여 확정) 이고 참여 행이 생김 | 진행현황 **participant give-up** 사용. 메시지로 구분 |
| `DOCUMENT_FAILED` / `INTERVIEW_FAILED` / `REJECTED` / `CANCELLED` 등 종결 | 재포기·재decision 불가 |
| `WAITING_REVIEW` (서류 심사 전) | 아직 「활동 포기」 대상이 아님 — 기획이 다르면 OpenAPI·핸드오프에 명시 |

`1691347` 로 재현한 뒤 **실제 `applicationStatus` 를 로그/응답 details에 넣어** FE·QA가 원인을 보게 하라.

### 4.2 가드 분리 (필수)

승인·반려·취소(`approve` / `reject` / `cancel-approval` / `cancel-rejection` / document-result / final-result)의 status 화이트리스트를  
**give-up에 그대로 재사용하지 마라.**

- give-up 은 「심사 중 이탈」이다. 「합격 확정 decision」과 허용 집합이 다르다.
- conflict 메시지에 「승인·반려·취소」만 쓰지 마라. give-up 전용 문구 예:

```text
현재 신청 상태에서는 활동 포기를 처리할 수 없습니다.
```

권장 error shape:

```json
{
  "success": false,
  "data": null,
  "message": "현재 신청 상태에서는 활동 포기를 처리할 수 없습니다.",
  "error": {
    "code": "APPLICATION_DECISION_CONFLICT",
    "message": "현재 신청 상태에서는 활동 포기를 처리할 수 없습니다.",
    "field": "status",
    "traceId": "<uuid>",
    "details": {
      "action": "GIVE_UP",
      "applicationStatus": "<실제 status>",
      "reason": "STATUS_NOT_ALLOW_GIVE_UP"
    }
  }
}
```

`details` 가 null 이면 QA가 status를 못 본다. **가능하면 `applicationStatus` 를 넣어라.**

### 4.3 성공 시 계약 (필수)

성공 시:

1. 신청을 **활동 포기**로 표시할 수 있게 한다.  
   - status canonical: `GIVE_UP` **또는** 기존처럼 status는 유지하고 `giveUpAt` / `giveUpYn` / 면접 `interviewAssignmentStatus` 상당 필드로 포기 표기 — **OpenAPI·목록 GET과 일치하는 쪽을 SSOT로 고정**하고 FE 핸드오프에 적어라.
2. 목록/상세 GET 재조회 시 CMS가 「활동 포기」로 보이게 한다.  
   - 서류합격·면접배정 목록: `interviewAssignmentStatus` / display 가 withdrawn 상당.
   - 2차 면접: 심사 현황 「활동 포기」.
3. `ApplicationDecisionResponse`(또는 기존 give-up 응답)를 200으로 반환. 시그니처를 깨지 마라.
4. `reason` 은 상태 이력에 저장. `"1회차"` 같은 회차 라벨도 허용 (2~500).
5. 권한·감사: 기존 volunteer decision write (`APPLICATION_WRITE` 등)와 동일.
6. 이미 배정된 면접 슬롯이 있으면 해제·이력 규칙을 문서화 (슬롯 인원 복구 여부).

### 4.4 `1691347` 재현 픽스 (필수)

1. `GET /api/admin/volunteer-applications/1691347` 로 현재 status 확인.
2. 허용 목록(§4.1)에 들어가는데 give-up 이 409면 → **가드 버그**로 수정.
3. 허용 목록 밖인데 심사 UI에 포기 버튼이 보이면 →  
   - status가 잘못 시드됐거나  
   - 목록이 잘못된 bucket에 노출 중이거나  
   - 참여 확정 건을 심사 path로 포기하려는 경우  
   → status/시드 수정 **또는** 409 details에 `applicationStatus` + 「participant give-up 사용」 안내.  
   **FE가 invent 하지 않도록** BE가 원인을 밝혀라.
4. local 시드에 **서류합격·면접배정 상태 봉사자 1건 이상**을 give-up 성공 QA용으로 보장하라.

### 4.5 하지 말 것

- FE에 `participants/{id}/give-up` 으로 심사 포기를 대체하라고 요구하지 마라.
- FE에 `stopScheduleId` 필수를 새로 요구하지 마라 (심사 단계).
- FE에 status를 클라이언트에서 바꿔 재시도하라고 요구하지 마라.
- `APPLICATION_DECISION_CONFLICT` 를 자격(초상권/1365) conflict 와 메시지·details 없이 섞지 마라. 자격 미충족은 기존 eligibility details (`missingRequirements` 등)를 유지.
- UJAT·1사1교·Gemini·기관·강사 path를 이 티켓에서 재설계하지 마라. 봉사 `volunteer-applications` give-up 만.

---

## 5. 수용 기준

BE 핸드오프 기준 (FE 코드 변경 없음 · QA만):

- [ ] 서류합격·2차면접 「활동 포기」 → Network **200** (로컬 QA id: **`1691348`**, program `186050`)
- [ ] 목록 refetch 「활동 포기」 (`applicationStatus=GIVE_UP`, `giveUpYn=true` — FE adapter가 `withdrawn` 매핑)
- [ ] 재포기 → **409**, 메시지에 「활동 포기」, `details.reason` = `ALREADY_GIVEN_UP` 등
- [ ] body에 `stopScheduleId` 추가하지 않음
- [x] FE 핸드오프 수신: `JABACK/docs/frontend/general-volunteer-application-give-up-decision-conflict-frontend-handoff-2026-10-09.md`

---

## 6. FE 참고 (읽기 전용)

| 역할 | 경로 |
|------|------|
| give-up client | `apps/cms/src/features/program/general/api/applications-api-client.ts` |
| service | `apps/cms/src/features/program/general/api/admin-applications-service.ts` → `giveUpGeneralVolunteerApplication` |
| remote hook | `apps/cms/src/features/program/general/hooks/use-general-volunteer-applications-remote.ts` |
| 서류합격 포기 | `…/volunteer-screening/use-doc-passed.ts` |
| 2차면접 포기 | `…/volunteer-screening/use-interview2.ts` |
| request type | `ApplicationGiveUpRequest` (`reason`, optional `stopScheduleId`) |
| 참여 포기(비교) | `…/program-progress-api-client.ts` → `participants/{id}/give-up` |

---

## 7. QA

1. JABACK 재기동 후 admin 로그인 (`admin1@jakorea.org` / `test1234!`).
2. 로컬: program `186050` · 신청 **`1691348`** (`DOCUMENT_PASSED`) — `1691347` 은 `REJECTED`라 쓰지 말 것.
3. CMS 서류 합격자(또는 2차 면접) 「활동 포기」 → Network `POST …/volunteer-applications/1691348/give-up` **200**.
4. 목록 refetch → 「활동 포기」 / withdrawn (`giveUpYn` / `GIVE_UP` adapter).
5. 같은 id 재포기 → 409 `ALREADY_GIVEN_UP`.
6. 회귀: 서류 합격/면접 배정/최종 결과 게이트 · `participants/…/give-up` 유지.
