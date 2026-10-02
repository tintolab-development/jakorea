# Cursor prompt — 일반 개인 참여자 신청 승인 취소 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-individual-application-cancel-approval-backend-request-2026-10-02.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** |
| 화면 | CMS 일반 프로그램 상세 → LNB **참여자 신청 목록** → 신청 상세 **승인 취소** |
| 대상 | 일반 **개인 참여자** (`individual-applications`). 기관·강사·봉사자·UJAT·1사1교·Gemini 아님 |

이미 있는 형제 path와 **같은 패턴**으로 맞춰라. 새 도메인·새 리소스를 만들지 마라.

---

## 1. 한 줄 요약

개인 참여자 신청은 `approve` / `reject` / `cancel-rejection` 이 있다.  
**`cancel-approval` 만 없다.** CMS는 승인된 참여자의 승인 취소를 호출할 path가 없어 연동하지 못한다.

---

## 2. 지금

OpenAPI에 있는 개인 신청 결정 API:

```http
POST /api/admin/individual-applications/{applicationId}/approve
POST /api/admin/individual-applications/{applicationId}/reject
POST /api/admin/individual-applications/{applicationId}/cancel-rejection
```

없는 것:

```http
POST /api/admin/individual-applications/{applicationId}/cancel-approval
```

이미 있는 형제(참고만, 시그니처를 깨지 마라):

```http
POST /api/admin/organization-applications/{applicationId}/cancel-approval
POST /api/admin/instructor-applications/{applicationId}/cancel-approval
```

- 권한: `APPLICATION_WRITE`, 담당 프로그램 범위
- body: `ApplicationDecisionCancelRequest` (`reason` 2~500)
- 응답: `ApplicationDecisionResponse`

CMS FE:

- 모달: `ParticipantCancelApprovalModal` — 사유 필수, 알림 시점 선택
- 로컬 patch: `APPROVED` → **`REJECTED`** (`patchGeneralIndividualApplicantForCancelApproval`)
- 카피: 승인 취소 시 참여자는 **반려 처리**. 취소 사유가 반려 사유로 전달되고 알림이 간다. 미발송 승인 알림은 발송 취소.
- remote ON 이면 FE는 이 API가 생길 때까지 **호출하지 않는다.** 로컬 성공 처리로 위장하지 않는다.

---

## 3. 해야 할 일

### 3.1 path (필수)

```http
POST /api/admin/individual-applications/{applicationId}/cancel-approval
Authorization: Bearer <관리자>
Content-Type: application/json
```

```json
{
  "reason": "일정 중복으로 승인 취소"
}
```

규칙:

1. `applicationId` 가 개인 참여자 신청이 아니면 404.
2. 현재 상태가 `APPROVED` 가 아니면 409. `reject` / `cancel-rejection` 과 같은 상태 전이 충돌 처리.
3. 성공 시 `APPROVED` → **`REJECTED`**. `WAITING_REVIEW` / `SUBMITTED` 로 되돌리지 마라. CMS 카피가 반려 처리다.
4. `reason` 은 상태 이력·반려 사유·알림 본문에 그대로 쓴다. `ApplicationDecisionCancelRequest` 를 재사용하라.
5. 권한·감사로그는 `cancel-rejection` 과 동일 (`APPLICATION_WRITE`, 담당 프로그램, 감사 필수).
6. 알림:
   - 승인 알림이 아직 안 갔으면 그 발송을 취소한다.
   - 이미 갔으면 승인 취소(반려) 알림을 새로 보낸다.
7. `availableActions` 를 다시 계산해 `ApplicationDecisionResponse` 로 내려라. 이후 화면은 `반려 취소` 가 보여야 한다.
8. `openapi/backend.openapi.json` 에 path + `operationId` (`cancelIndividualApproval` 권장) 를 올려라. `cancel-rejection` 과 같은 태그(`신청/프로그램 워크플로우`).

응답 예:

```json
{
  "applicationId": 1690625,
  "applicationType": "INDIVIDUAL",
  "fromStatus": "APPROVED",
  "toStatus": "REJECTED",
  "participantId": 1001,
  "notificationEventId": 8801,
  "availableActions": ["CANCEL_REJECTION", "RESEND_NOTIFICATION"]
}
```

필드명은 기존 `ApplicationDecisionResponse` 를 그대로 써라. 새 response 타입을 만들지 마라.

### 3.2 쓰지 말 것

- `POST …/reject` 로 승인 취소를 대체하라고 FE에 시키지 마라. 승인 취소와 최초 반려는 이력·알림이 다르다.
- 기관/강사 `cancel-approval` path 에 개인 신청 id 를 넣게 하지 마라.
- 봉사자 document cancel-approval 과 path를 합치지 마라.
- `approve` / `reject` / `cancel-rejection` 시그니처를 이 티켓에서 바꾸지 마라.

---

## 4. 하지 말 것

- 개인 신청을 `WAITING_REVIEW` 로 되돌리기 (FE는 반려)
- 사유 없는 승인 취소 허용 (`reason` 필수, 2~500)
- UJAT / 1사1교 / Gemini 전용 path 로 일반화
- FE mock 시드를 BE가 넣으라고 하기

---

## 5. Done when

1. 승인된 개인 참여자 신청에  
   `POST /api/admin/individual-applications/{applicationId}/cancel-approval` 이 200 을 준다.
2. 이후 `GET …/individual-applications/{applicationId}` 상태가 `REJECTED` 이고, `reason` 이 반려 사유로 남아 있다.
3. `APPROVED` 가 아닌 신청에 치면 409.
4. 기관/강사 `cancel-approval` 과 개인 `cancel-rejection` 은 그대로다.
5. OpenAPI에 새 path가 있다.

**Last updated:** 2026-10-02
