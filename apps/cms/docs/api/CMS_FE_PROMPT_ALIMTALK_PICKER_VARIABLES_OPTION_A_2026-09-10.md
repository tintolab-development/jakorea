# FE 수신 — 알림톡 발송 피커 · 변수 SSOT Option A 2026-09-10

> 원본 BE handoff: `JABACK/docs/frontend/CMS_FE_BE_HANDOFF_ALIMTALK_PICKER_VARIABLES_OPTION_A_2026-09-10.md`  
> FE→BE 요청: [`notification-alimtalk-send-template-picker-variables-backend-cursor-prompt.md`](./notification-alimtalk-send-template-picker-variables-backend-cursor-prompt.md)

## SSOT

프로그램 **지정** 시:

```text
usable = approved
  && #{키} ⊆ catalog
  && every key enabled=true
```

프로그램 **미선택**: 변수 제한 없음 (현행).

## FE 반영 (2026-09-10)

- [x] Orval — `fetch:openapi` + `generate:api:notifications` (Option A / SYSTEM description)
- [x] `canUseNotificationSendTemplateForProgram` — 미등재 키 → `false` (프로그램 지정 시)
- [x] 단위 테스트 (미등재 / SYSTEM `enabled=false`)
- [x] failedReason — `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING` 정규화 유지 (「변수처리실패」기대 안 함)

## QA

- [ ] 프로그램 지정 + `로그인_실패_안내` → 「템플릿 사용」비활성
- [ ] 프로그램 지정 + 카탈로그 `enabled=true`만 쓰는 템플릿 → 사용 가능
- [ ] 프로그램 미선택 → 변수로 피커 비활성하지 않음 (승인만)
- [ ] 발송 실패 시 MISSING 코드 문구 (원문「변수처리실패」의존 없음)
