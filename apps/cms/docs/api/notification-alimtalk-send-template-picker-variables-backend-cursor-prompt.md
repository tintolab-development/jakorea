# Cursor prompt — 알림톡 발송 템플릿 피커 · 변수 치환 가능 여부 SSOT

> 작성: 2026-09-10  
> 대상: JA Korea CMS Java Backend (`NotificationSendBatch*` / template-variables / ALIMTALK delivery failReason)  
> FE: `apps/cms` 알림톡 **발송** (`ui/alimtalk-send`) — 템플릿 **등록·카카오 승인** 플로우는 변경 없음  
> 선행: [`notification-template-variables-enabled-backend-cursor-prompt.md`](./notification-template-variables-enabled-backend-cursor-prompt.md) (`enabled` SSOT · fail-closed)  
> 관련: [`notification-send-program-optional-backend-cursor-prompt.md`](./notification-send-program-optional-backend-cursor-prompt.md) (프로그램 미선택)

아래 **「프롬프트 (복사용)」** 코드펜스 안 전체를 백엔드 Cursor/담당자에게 그대로 전달하면 된다.

---

## FE 관측 (2026-09-10) — 왜 이 요청인가

### 증상

1. 알림톡 **발송** → 「템플릿 선택」모달에서 **승인된 템플릿 전부가 「템플릿 사용」활성**으로 보임.
2. 예: `로그인_실패_안내` (본문에 `#{로그인 실패 횟수}`, `#{마지막 로그인 실패일시}`) 선택·발송.
3. 실제 발송은 실패. 이력/사유에 **「변수처리실패」** (프로바이더 원문 추정) 확인.
4. FE는 피커에서 막지 않았고, BE/NHN 단계에서 실패.

### FE가 이미 하는 일 / 안 하는 일

| 단계 | FE | 비고 |
|------|-----|------|
| 카카오 승인 | 미승인 → 「템플릿 사용」비활성 | `isAlimtalkTemplateApproved` — **승인제와 변수 필터는 별개** |
| 프로그램 미선택(지정 해제) | 변수 제한 없이 사용 가능 | `programNumericId` 없음 → `canUse…` = true |
| 프로그램 **지정** | 본문 키가 카탈로그에 있고 `enabled=false`일 때만 비활성 | `canUseNotificationSendTemplateForProgram` |
| 카탈로그에 **없는** `#{키}` | **막지 않음** (의도적 fail-open) | 주석: BE fail-closed 위임 |
| 발송 실패 문구 | `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키` 만 한국어 정규화 | 그 외 `failedReason` 원문 표시 → 「변수처리실패」 그대로 노출 |

### 제품 질문 (BE 답변·계약 필요)

**알림톡은 카카오 승인제라 피커 필터링이 불가능한가?**  
→ FE 판단: **아니오. 승인과 변수 가능 여부는 독립.**  
승인 필터는 이미 동작. 부족한 것은 **「이 발송 맥락에서 치환 가능한 템플릿인가」** SSOT이다.

요청: BE가 아래 계약을 확정(또는 구현)해 FE가 피커를 fail-closed로 맞출 수 있게 할 것.

---

## 프롬프트 (복사용)

```text
당신은 JA Korea CMS Java 백엔드(Notifications / ALIMTALK send-batches)를 구현·수정한다.
프론트 레포는 없다. Controllers / DTO / Services / Enricher / OpenAPI / delivery failedReason 을 찾아 맞춰라.
질문은 계약이 코드·선행 문서와 충돌할 때만 하라.
invent-ban: path·필드·에러 code를 임의로 만들지 마라. 기존 template-variables / MISSING 계약을 확장·명확화한다.

선행 SSOT (유지):
- docs FE handoff: template-variables `enabled` + NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING fail-closed
- programId optional (미선택 발송) — 해당 문서 유지

════════════════════════════════════════════════════════════════
A. 배경 (FE 2026-09-10 실측)
════════════════════════════════════════════════════════════════
CMS 알림톡 발송:

1) 템플릿 피커: 카카오 승인 완료 템플릿은 대부분 「템플릿 사용」활성.
2) 승인 ≠ 변수 치환 가능.
   - FE는 프로그램 지정 시에만 카탈로그 `enabled=false` 키 포함 템플릿을 비활성.
   - 카탈로그에 없는 #{키} 는 FE가 막지 않음 → 발송 후 실패.
3) 실측 실패 예:
   - 템플릿: 로그인_실패_안내
   - 본문 키: #{로그인 실패 횟수}, #{마지막 로그인 실패일시}
   - failedReason/표시: 「변수처리실패」(NHN/카카오 원문 추정)
4) 제품 확인: 승인제 때문에 피커 필터가 불가능한가?
   → FE: 불가능하지 않음. BE 카탈로그/치환 가능 SSOT만 있으면 피커에서 막을 수 있음.

════════════════════════════════════════════════════════════════
B. Goal (BE)
════════════════════════════════════════════════════════════════
【In scope】
1) 「발송 맥락에서 템플릿 본문 #{…} 가 CMS enrich로 치환 가능한지」를
   template-variables 카탈로그(또는 동등 SSOT)로 FE가 판정할 수 있게 한다.

2) 정책 확정 (아래 C 중 하나를 SSOT로 고르고 OpenAPI description + 계약 테스트에 명시):

   Option A (권장 · FE 피커 fail-closed 정렬):
   - 프로그램 **지정** 발송: 템플릿에 등장하는 모든 #{키} 가
     GET …/template-variables 응답에 **존재**하고 해당 맥락 `enabled=true` 여야 「사용 가능」.
   - 카탈로그에 **없는** 키 → 사용 불가 (FE 피커 비활성).
   - CMS enrich로 값을 만들 수 없는 키(시스템 전용·외부 전용)는
     카탈로그에 넣되 `enabled=false` + description으로 「CMS 수동 발송 불가」를 표시.
   - 예: 로그인 실패 횟수 / 마지막 로그인 실패일시 → 카탈로그 등재 + enabled=false
     (또는 아예 CMS Admin 수동 발송 대상이 아니면 동일).

   Option B (현행 유지 · 피커는 느슨):
   - 카탈로그 미등재 키는 FE 통과, BE가 발송 시 fail-closed.
   - 단, failedReason 을 「변수처리실패」원문으로 두지 말고
     NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키} 로 정규화 (NHN 호출 전).
   - FE는 toast/이력만 개선. 피커는 계속 대부분 활성(제품이 허용할 때만).

3) ALIMTALK도 EMAIL/SMS와 동일하게:
   - enrich 전/중 값이 비면 **provider 호출 전** fail-closed.
   - delivery.failedReason / API message =
     NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}[,{키2}…]
   - 빈 #{…} 또는 프로바이더「변수처리실패」로 떨어지기 전에 CMS에서 확정.

4) OpenAPI:
   - CatalogVariableItem.enabled / requiresProgram description에
     「알림톡 발송 피커: 프로그램 지정 시 본문 키 ⊆ catalog && enabled=true」
     (Option A 채택 시) 명시.
   - failedReason example에 MISSING 코드 유지. 원문「변수처리실패」를 SSOT로 쓰지 말 것.

【Out of scope】
- 카카오 템플릿 승인 API / 검수 플로우 변경
- FE UI invent (피커 UX는 BE 계약 확정 후 FE 별도 PR)
- path invent (template-variables·send-batches 기존 유지)
- 「승인 여부」를 변수 카탈로그와 섞지 말 것 (별개 축)

════════════════════════════════════════════════════════════════
C. 계약 요약 (SSOT 후보)
════════════════════════════════════════════════════════════════
【축 분리】
- 카카오 승인(approved): NHN/카카오 템플릿 상태 — 발송 전제
- CMS 변수 가능(enabled + catalog membership): Admin 수동 발송 맥락에서 enrich 가능 여부
두 축을 OR/AND로 섞어 설명하지 마라. FE는 AND (승인 && 변수가능).

【GET …/template-variables】 (기존)
Query: programId?, participantType?, memberType?, …
Item: key, token, enabled, requiresProgram, …

Option A 채택 시 FE 피커 규칙(문서화):
  usable =
    approved
    && (programId 없음 → 변수 제한 없음 | programId 있음 →
        extract(#{키} from template fields) ⊆ catalog
        && every key has enabled=true)

【발송 fail-closed】 (채널 ALIMTALK 포함 · 유지·강화)
code: NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING
message/failedReason: NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}[,{키2}]
- NHN/카카오 호출 전 확정
- provider 「변수처리실패」만 남는 경로를 줄일 것 (가능하면 제거)

【로그인_실패_안내 류】
본문 커스텀 키가 CMS enrich 대상이 아니면:
  - 카탈로그에 key 등재 + enabled=false + description
  - 또는 Admin 수동 발송 비대상임을 OpenAPI/내부 문서에 명시
FE가 「전부 사용 가능」으로 오해하지 않게 할 것.

════════════════════════════════════════════════════════════════
D. QA
════════════════════════════════════════════════════════════════
[ ] Option A/B 중 SSOT 확정 + OpenAPI description 반영
[ ] programId=특정 + 본문에 enabled=false 키 → (FE 피커 비활성 가능하도록) catalog에 키 존재
[ ] programId=특정 + 본문에 미등재 키(로그인 실패 횟수 등)
    → Option A: 카탈로그 등재(false) 또는 등재 후 FE 비활성 가능
    → Option B: 발송 시 MISSING:{키} (「변수처리실패」원문 금지)
[ ] ALIMTALK batch: 값 없는 #{키} → provider 호출 없이 MISSING fail-closed
[ ] EMAIL/SMS MISSING·enabled 회귀 없음
[ ] 카카오 미승인 템플릿 발송 거절 회귀 없음

════════════════════════════════════════════════════════════════
E. Do / Don't
════════════════════════════════════════════════════════════════
DO: 승인 축과 변수 축을 분리해 문서화. ALIMTALK도 MISSING 코드로 정규화.
DO: CMS 수동 발송으로 채울 수 없는 키는 catalog enabled=false 로 드러낼 것 (Option A).
DON'T: 「알림톡은 승인제라 필터 불가」로 계약을 닫지 말 것.
DON'T: failedReason SSOT를 프로바이더 원문「변수처리실패」에 의존.
DON'T: path/필드 invent.
```

---

## FE 후속 (BE 계약 확정 후 · 이 문서 범위 밖)

| BE 선택 | FE |
|---------|-----|
| **Option A** | `canUseNotificationSendTemplateForProgram`: 카탈로그 **미등재 키 → false** (프로그램 지정 시). 피커 비활성 + 안내. |
| **Option B** | 피커 현행 유지. `formatNotificationFailedReason` / 이력에 MISSING만 기대. 「변수처리실패」원문 매핑은 보조. |

알림톡 발송 화면의 「템플릿 자동입력 변수」안내 위젯은 FE에서 제거함(2026-09-10). 피커 필터·failReason 정규화가 UX SSOT.

> **BE handoff (Option A 확정):** [`CMS_FE_PROMPT_ALIMTALK_PICKER_VARIABLES_OPTION_A_2026-09-10.md`](./CMS_FE_PROMPT_ALIMTALK_PICKER_VARIABLES_OPTION_A_2026-09-10.md) — FE Orval + 미등재 키 → false 반영 완료.

---

## Done 체크 (BE)

- [ ] Option A 또는 B SSOT 확정
- [ ] ALIMTALK fail-closed → `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING` (provider 원문 의존 축소)
- [ ] (A) CMS 비치환 키 카탈로그 등재 + `enabled=false`
- [ ] OpenAPI description / 계약 테스트
- [ ] FE handoff 한 줄 메모 (Option + 예시 템플릿 키)
