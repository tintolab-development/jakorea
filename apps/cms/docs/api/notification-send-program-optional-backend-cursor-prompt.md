# Cursor prompt — 알림 발송 「대상 프로그램 미선택」·`programId` optional

> 작성: 2026-09-09 · 갱신: 미선택 라벨·발송 변수 추가 규칙 반영  
> 대상: JA Korea CMS Java Backend (`NotificationSendBatch*` / CreateRequest / recipient-candidates)  
> FE: `apps/cms` 알림 **메일·문자·알림톡 발송** (템플릿 **등록**은 변경 없음)  
> 관련: [`notification-template-variables-enabled-backend-cursor-prompt.md`](./notification-template-variables-enabled-backend-cursor-prompt.md) (`enabled` SSOT·fail-closed — 유지)  
> 관련 OpenAPI handoff: [`CMS_FE_BE_HANDOFF_TEMPLATE_VARIABLES_OPENAPI_2026-09-09.md`](./CMS_FE_BE_HANDOFF_TEMPLATE_VARIABLES_OPENAPI_2026-09-09.md)

아래 **「프롬프트 (복사용)」** 코드펜스 안 전체를 백엔드 Cursor/담당자에게 그대로 전달하면 된다.

---

## FE 제품 UX (SSOT) — BE 계약에 영향

### 대상 프로그램 (메일·문자·알림톡 발송 공통)

| UI 상태 | 진입/조작 | 필드 표시 | FE → BE `programId` | 템플릿 선택 | 변수 패널 | 수신자 |
|---------|-----------|-----------|---------------------|-------------|-----------|--------|
| **미선택** | **발송 진입 기본값** | placeholder / 값 없음 (`''`) | 미전송 | **비활성** | (프로그램·템플릿 전) | 불가 — 「대상 프로그램을 선택하세요」 |
| **미선택** | 모달 **「프로그램 지정 해제」** | 라벨 **「미선택」** (내부 sentinel `all`) | create 시 **생략** | 활성 | **제한 없음** (`programId` 없이 catalog) | **DIRECT(직접 입력)만** — 후보 API는 program 필수라 FE 차단 |
| **지정** | 행 클릭 | 프로그램명 | int64 | 활성 | `enabled=true`만 삽입 가능 · `false`는 회색 | 프로그램 참여 회원 후보 (기존) |

> 지정 해제 시 UI 문구는 **「전체」가 아니라 「미선택」**.  
> HTTP에는 `"all"`을 보내지 않는다 — **필드를 생략**한다.

### 템플릿 등록 vs 발송 변수

| 화면 | 변수 |
|------|------|
| **템플릿 등록/수정** | 현행 유지 — **변수 전체 선택·삽입 가능** (맥락 `enabled` 미적용 또는 전체 허용) |
| **발송** | 대상 프로그램(및 유형) 맥락의 `GET …/template-variables` 응답 `enabled` SSOT. **`enabled=true`(사용 가능) 변수는 발송 화면에서 본문/제목에 추가(삽입) 가능**. `enabled=false`만 삽입 차단. |
| **발송 · 템플릿 피커** | 프로그램 **지정** 시: 본문에 `enabled=false` 키가 포함된 템플릿은 「사용하기」 비활성. 지정 해제(미선택 라벨) 시: 변수 제한 없이 「사용하기」 가능. |

create body는 계속 `templateId`(+ recipients…) 중심. enrich·치환·fail-closed는 BE 템플릿 본문 + 수신자/프로그램 맥락.

### FE create body (지정 해제 = 미선택 라벨 / programId 생략)

```json
{
  "batchName": "...",
  "templateId": 123,
  "recipients": [{ "actorType": "DIRECT", "recipientContact": "...", "recipientName": "..." }],
  "senderKey": "...",
  "senderProfileId": 1
}
```

→ **`programId` 없음**.  
현재 BE `CreateRequest` `@NotNull @Positive Long programId` 이면 **400**.

이미 null을 허용하는 BE 경로:

- `requireCreateAccess(null)` → `NOTIFICATION_WRITE`
- `requireProgramIdForTemplateVariables(template, null)` → requiresProgram 키 있을 때만 실패
- `requireProgramBoundRecipient(null, DIRECT)` → DIRECT OK / MEMBER·ADMIN → `NOTIFICATION_PROGRAM_REQUIRED_FOR_RECIPIENTS`

**막힘:** DTO `@NotNull` + OpenAPI required + (선택) recipient-candidates `programId` required.

---

## 프롬프트 (복사용)

```text
당신은 JA Korea CMS Java 백엔드(Notifications / send-batches)를 구현·수정한다.
프론트 레포는 없다. Controllers / DTO / Services / OpenAPI 를 찾아 맞춰라.
질문은 계약이 코드·노션과 충돌할 때만 하라.
invent-ban: path·필드명을 임의로 만들지 마라. 기존 필드를 optional로 풀거나 description을 보강한다.

════════════════════════════════════════════════════════════════
A. 배경 / 제품 규칙 (FE 2026-09-09 · 미선택 라벨 반영)
════════════════════════════════════════════════════════════════
CMS 알림 발송(메일·문자·알림톡) 「대상 프로그램」:

1) 메일·문자(및 알림톡) 발송 화면 진입 시 기본값 = **미선택**
   - FE: programId 상태 '' → 템플릿 선택 비활성, 수신자 설정 불가
2) 「프로그램 지정 해제」
   - UI 표시 문구 = **「미선택」** (「전체」/ all 문자열 노출 금지)
   - FE create 시 programId **필드 생략** (body에 "all" 보내지 않음)
   - template-variables 는 programId 없이 조회 → 변수 사용 제한 없음(enabled 맥락)
   - 수신자: DIRECT(직접 입력)만. MEMBER 후보는 program 없으면 FE가 막고 DIRECT만
3) 특정 프로그램 지정
   - programId int64 전달
   - 참여자 후보·enabled 맥락 기존과 동일
   - 해당 프로그램에서 enabled=false 변수가 본문에 있는 템플릿은 FE 「사용하기」 비활성

템플릿 등록/수정:
- 변수 전체 선택·삽입 가능 — catalog `enabled` 무시 (FE `respectCatalogEnabled=false`). 발송 맥락 제한 없음.

발송 화면 변수:
- 프로그램(및 유형) 맥락에서 enabled=true 인 변수는 **발송 화면에서 추가(삽입) 가능**
- enabled=false 만 회색·삽입 차단
- 발송 시 치환·원천 데이터 부재는 기존 fail-closed 유지

관련 기존 계약 유지:
- GET …/template-variables 의 enabled SSOT
- NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}[,{키2}] fail-closed
- 빈 #{…} provider 전송 금지

════════════════════════════════════════════════════════════════
B. Goal (필수)
════════════════════════════════════════════════════════════════
1) POST /api/admin/notification-send-batches (CreateRequest)
   - programId 를 **optional** 로 변경
   - null/미전달 허용. @NotNull / @Positive 제거(또는 null일 때 @Positive 스킵)
   - programId 가 있으면 기존처럼 >0 + 프로그램 활성·권한 검사
   - programId 가 없으면:
     a) requireCreateAccess(null) 경로 (NOTIFICATION_WRITE)
     b) batch.program_id = NULL 저장 허용
     c) requireProgramIdForTemplateVariables: 본문에 requiresProgram 키가 있으면
        NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES:{키}
     d) 수신자:
        - DIRECT: 허용
        - MEMBER / ADMIN: NOTIFICATION_PROGRAM_REQUIRED_FOR_RECIPIENTS
           ※ MEMBER 전체 후보 API는 이번 필수 아님

2) OpenAPI
   - CreateRequest.programId: required 에서 제거, optional description
   - description 예:
     "대상 프로그램. 미전달(발송 UI 미선택/지정 해제)이면 program 스코프 enrich 불가.
      requiresProgram 변수 포함 템플릿은 거부.
      MEMBER/ADMIN 수신자는 불가(DIRECT만). FE는 문자열 all을 보내지 않음."
   - /v3/api-docs 와 openapi/backend.openapi.json 동기화

3) 회귀
   - programId 있는 기존 발송·참여자 후보·enrich·fail-closed 불변
   - programId 없는 DIRECT 전용 배치 생성 성공 (requiresProgram 키 없는 템플릿)

════════════════════════════════════════════════════════════════
C. Goal (권장 / 후속)
════════════════════════════════════════════════════════════════
GET …/recipient-candidates

옵션 1 (최소): programId 미전달 시 400 + 문서화. FE는 DIRECT만 유지.
옵션 2: programId 미전달 시 관리자 스코프 활성 회원 후보(memberType/keyword).
  → FE가 미선택(지정 해제)에서도 「수신자 설정」 가능.

════════════════════════════════════════════════════════════════
D. Out of scope / 금지
════════════════════════════════════════════════════════════════
- FE가 programId=0 / 음수 / "all" 문자열을 보내게 하지 마라. 미전달 = 미선택(지정 해제).
- recipient-candidates 신규 path invent 금지.
- enabled 재계산을 FE에 떠넘기지 마라.
- 빈 #{…} 성공 발송 금지.

════════════════════════════════════════════════════════════════
E. 구현 체크리스트
════════════════════════════════════════════════════════════════
- dto CreateRequest — programId @NotNull 제거
- CommandService#create — null programId 분기
- Controller @Schema description (미선택/지정 해제 = 미전달)
- openapi + springdoc
- 테스트:
  [ ] create without programId + DIRECT + requiresProgram 키 없음 → 성공
  [ ] create without programId + MEMBER → 400 …RECIPIENTS
  [ ] create without programId + requiresProgram 키 템플릿 → 400 …TEMPLATE_VARIABLES
  [ ] create with programId → 기존과 동일
  [ ] OpenAPI CreateRequest.programId not required

════════════════════════════════════════════════════════════════
F. FE 연동 메모 (BE는 FE 수정하지 않음)
════════════════════════════════════════════════════════════════
- 발송 진입 기본: programId ''
- 지정 해제: UI 「미선택」, HTTP programId 생략
- 발송 화면: enabled=true 변수 삽입 허용
- Orval: programId optional 후 generate:api:notifications
- QA 지정 모드 픽스처: programId=164003 / actorId=1799401

════════════════════════════════════════════════════════════════
G. Done 기준
════════════════════════════════════════════════════════════════
- [ ] CreateRequest.programId optional (DTO + OpenAPI + 런타임)
- [ ] 미선택(programId 생략)+DIRECT 발송이 400 없이 통과
- [ ] 지정 프로그램 발송 회귀
- [ ] (선택) recipient-candidates 옵션1/2 명시
- [ ] handoff: 「programId 생략 = UI 미선택(지정 해제), DIRECT만 / MEMBER는 program 필수」

완료 후 FE에:
1) optional 반영 OpenAPI 또는 /v3/api-docs
2) Done 체크 결과
3) recipient-candidates 옵션1/2 선택
```

---

## FE Residual (BE 완료 후)

```bash
pnpm --filter cms fetch:openapi
pnpm --filter cms generate:api:notifications
pnpm --filter cms typecheck
```

- Orval `CreateRequest.programId` optional  
- (옵션 2) 지정 해제(미선택)에서도 수신자 설정 모달 개방  

---

## 관련 FE 코드

| 영역 | 경로 |
|------|------|
| 기본 미선택·지정 해제 라벨「미선택」 | `model/send-program-id.ts`, `ui/mail-send/program-select-field.tsx` |
| 템플릿 「사용하기」 가드 | `model/shared/template-usable-for-program.ts` |
| 프로그램 모달 「지정 해제」 | `ui/mail-send/program-select-modal.tsx` |
| create 시 programId 생략 | `api/mail-send-service.ts`, `model/sms-send/payload.ts`, `api/adapters/alimtalk-send-batch-adapters.ts` |
| 발송 변수 `enabled` 삽입 | `ui/mail-send/fullpage-modal.tsx`, `ui/sms-send/fullpage-modal.tsx` |

**Last updated:** 2026-09-09
