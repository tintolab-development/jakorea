# 문자(SMS) NHN 카탈로그 CRUD 미러 QA (2026-09-11)

> FE: `apps/cms` 문자 템플릿  
> SSOT: `JA_NOTIFICATION_MODE=NHN_NOTIFICATION_HUB` → 카테고리·템플릿 CRUD가 NHN push+pull  
> 관련: `model/sms-template/sender-phone.ts`, `api/sms-template-service.ts`, `get-notifications-api-error.ts`

## 규칙

| DO | DON'T |
|----|-------|
| CRUD 성공 시 `data.tree`로 교체 (카테고리·이동·삭제) | Console-only로 CMS 등록을 정상 미반영으로 처리 |
| sync 시 `channelType=SMS` | ALIMTALK 본문 PATCH 금지를 SMS에 적용 |
| 발신번호 = sender-profiles harvest Select | invent preview/usable API |

> 템플릿 create/update OpenAPI `NotificationTemplateMutationResponse`에 `tree` 없음 → 캐시 invalidate(EMAIL과 동일). BE·Orval에 tree가 오면 category와 같이 `setQueryData`로 전환.

## 체크리스트

- [ ] 문자 카테고리 추가 → NHN 폴더 + CMS tree (`data.tree`)
- [ ] 문자 템플릿 등록(발신번호 필수) → `providerTemplateCode` 채워짐
- [ ] 수정/이동/삭제 → NHN 반영 + tree
- [ ] `POST …/sync?channelType=SMS` (+ sender-profiles sync)
- [ ] 409 `SMS_TEMPLATE_DELETE_REJECTED_BY_NHN` 토스트
- [ ] 400 `NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN` → 동기화 유도
- [ ] 발신번호 미선택 / harvest 미일치 → FE 안내
