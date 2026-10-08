# 회원 포탈 동의 원장 재저장 — 백엔드 수정 요청

**작성일:** 2026-10-06  
**우선순위:** P1  
**요청 대상:** 회원 동의 원장 저장 공통. 재현은 `PUT /api/portal/me/marketing-consent`  
**화면:** Platform 마이페이지 → 약관 및 정책 동의 관리  
**인증:** 회원 Bearer. 본인만.

원 계약: [member-portal-consents-settings-backend-request-2026-10-06.md](./member-portal-consents-settings-backend-request-2026-10-06.md) §3·§5.  
재현은 마케팅 재동의다. 수정은 **마케팅 핸들러만이 아니라**, 같은 원장에 행을 넣는 모든 저장이다. 확인 요청이 아니다.

---

## 1. 증상

마케팅을 철회한 뒤 다시 동의하면 200이 아니라 제약 위반이 난다.

| 순서 | 요청 | 결과 |
|------|------|------|
| 1 | `PUT /api/portal/me/marketing-consent` `{ "agreed": false }` | 200. 철회됨 |
| 2 | 같은 path `{ "agreed": true }` | **실패** (아래 본문) |

실패 본문:

```json
{
  "success": false,
  "data": null,
  "message": "이미 등록된 정보이거나 다른 데이터에서 사용 중입니다.",
  "error": {
    "code": "CONSTRAINT_VIOLATION",
    "message": "이미 등록된 정보이거나 다른 데이터에서 사용 중입니다.",
    "field": null,
    "traceId": "43f72b2d3925440ebc60db8529f5733b",
    "details": null
  }
}
```

프론트는 `version`·`reason` 없이 `{ "agreed": true }`만 보낸다. 계약상 `version`은 선택이고, 없으면 현재 게시 버전으로 저장한다.

---

## 2. 기대 (계약 §3 그대로)

재동의는 **200** `PortalMarketingConsentResponse`.

```json
{
  "consentType": "MARKETING",
  "agreed": true,
  "agreedAt": "2026-10-06T02:05:00",
  "withdrawnAt": null,
  "updatedAt": "2026-10-06T02:05:00",
  "version": "2026-05-18"
}
```

- 기존 `MARKETING` 원장 행을 **갱신**한다. `agreed=true`, `agreedAt`=이번 시각, `withdrawnAt=null`.
- 직후 `GET /api/portal/me/consents`의 `MARKETING` 행과 값이 같다.
- 이미 `agreed=true`인데 또 `true`일 때만 **409** `CONFLICT` ("이미 동의된 상태입니다.").
- 이미 `agreed=false`인데 또 `false`일 때만 **409** `CONFLICT` ("이미 철회된 상태입니다.").

`CONSTRAINT_VIOLATION`은 이 흐름의 정상 응답이 아니다.

---

## 3. 원인 (수정 방향)

`traceId` `43f72b2d3925440ebc60db8529f5733b`의 제약 이름을 확인한다.

철회는 기존 행 갱신으로 성공하고, 재동의만 유니크 제약으로 죽는다. 재동의 분기가 미동의로 보고 **새 행을 INSERT**하고, 그 키가 철회 후에도 남은 행과 겹친다. 흔한 키는 `(회원, MARKETING, version)` 또는 `(회원, 약관 문서)`다.

같은 상태 반복이면 비즈니스 409가 먼저 나야 한다. `CONSTRAINT_VIOLATION`이 나온 것은 그 검사 전에 INSERT가 깨진 것이다.

수정은 마케팅 PUT 한 메서드에 국한하지 않는다. 회원 동의 원장에 쓰는 **공통 저장**이 다음을 보장한다.

1. 해당 회원의 그 `consentType` 현재 행이 있으면 **UPDATE**. 없을 때만 INSERT.
2. 철회된 행이 남아 있어도, 같은 `(회원, consentType, version)`(또는 실제 유니크 키)으로 다시 INSERT하지 않는다.
3. 이력을 남기면 현재 행 키와 이력 키를 분리한다. 이력 INSERT가 현재 행 유니크에 걸리지 않는다.
4. 이미 같은 상태면 비즈니스 **409** `CONFLICT`. DB 예외를 `CONSTRAINT_VIOLATION`으로 흘리지 않는다.

프론트에서 `version`을 붙여도 같은 버전이면 같은 제약에 걸린다. 프론트 변경으로 우회하지 않는다.

---

## 4. 같은 원장을 쓰는 다른 유형

마케팅만 고치면, 철회 후 다시 동의·작성하는 다른 유형이 같은 제약에 걸린다. 아래 저장도 같은 규칙을 탄다.

| 유형 | 다시 동의·작성하는 경로 | 기대 |
|------|-------------------------|------|
| `MARKETING` | `PUT /api/portal/me/marketing-consent` `{ "agreed": true }` | 이번 재현. §2 |
| `PORTRAIT_RIGHTS` | 유형 철회 또는 `POST .../documents/{documentId}/withdraw` 이후, 동의서 작성·완료(전자서명 완료) | 200. 기존 행 UPDATE. `agreed=true`, `consentStatus=PARTIAL`. `CONSTRAINT_VIOLATION` 아님 |
| `CHILD_PRIVACY_COLLECTION` | `POST .../consents/CHILD_PRIVACY_COLLECTION/withdraw` 이후 다시 동의·작성 | 200. 기존 행 UPDATE. `CONSTRAINT_VIOLATION` 아님 |
| 문서 4종 (`PAYMENT_STATEMENT_CONSENT`, `FACILITATOR_PLEDGE`, `ADMINISTRATIVE_INFO_CONSENT`, `CRIMINAL_HISTORY_CHECK_CONSENT`) | 작성·완료가 원장에 행을 넣을 때, 이미 그 유형 행이 있는 경우 | INSERT 대신 UPDATE. 작성 API 자체는 원 계약 범위 밖이어도 **저장 공통**은 같이 고친다 |
| 필수 4종 (`SERVICE_TERMS`, `PRIVACY_COLLECTION`, `TEACHER_INFO_COLLECTION`, `GUARDIAN_CONSENT`) | 철회 API 없음. 가입·등록 때 원장 INSERT | 이미 행이 있으면 INSERT로 제약 위반을 내지 않는다 |

철회 API(`PUT agreed:false`, `POST .../withdraw`, `POST .../documents/{id}/withdraw`)는 행을 지우지 않고 상태만 바꾼다. 그 다음 동의·완료가 새 행을 넣으면 이번과 같은 에러가 난다.

---

## 5. 수용 기준

- [ ] 동의 → `{ "agreed": false }` → 200, `withdrawnAt` 있음, 목록 `agreed=false`
- [ ] 이어서 `{ "agreed": true }` → **200**, `agreedAt` 있음, `withdrawnAt=null`, 목록 `agreed=true`
- [ ] 같은 `{ "agreed": true }` 한 번 더 → **409** `CONFLICT` (제약 위반 아님)
- [ ] `{ "agreed": false }`를 이미 철회된 상태에서 다시 → **409** `CONFLICT`
- [ ] 원장에 `MARKETING` 행이 없는 계정은 생성 후 200 (계약 §3.3)
- [ ] `PORTRAIT_RIGHTS` 철회 후 동의서 완료 → 200, 제약 위반 아님, `consentStatus=PARTIAL`
- [ ] `CHILD_PRIVACY_COLLECTION` 철회 후 다시 동의·작성 → 200, 제약 위반 아님
- [ ] 문서 4종·필수 약관도, 이미 행이 있는 회원에게 같은 키 INSERT로 `CONSTRAINT_VIOLATION`이 나지 않음
- [ ] `traceId` `43f72b2d3925440ebc60db8529f5733b`와 같은 재현이 더 이상 `CONSTRAINT_VIOLATION`이 아님

---

**Last updated:** 2026-10-06
