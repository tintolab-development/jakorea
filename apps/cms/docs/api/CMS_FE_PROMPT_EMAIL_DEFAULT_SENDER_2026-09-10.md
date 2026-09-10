# FE 수신 — EMAIL 기본 발신 `jakorea@jakorea.org` · harvest 2026-09-10

> 원본 BE SSOT: `JABACK/docs/frontend/CMS_FE_PROMPT_EMAIL_DEFAULT_SENDER_2026-09-10.md`  
> FE→BE 원요청: [`notification-email-default-sender-backend-cursor-prompt.md`](./notification-email-default-sender-backend-cursor-prompt.md)

## FE 반영 (2026-09-10)

- [x] Orval fetch — `providerSenderEmailAddress` description (create default / harvest)
- [x] `MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL = jakorea@jakorea.org`
- [x] 등록: harvest에 기본 From 있으면 Select 초기 선택(소문자 매칭)
- [x] harvest 0건 / 기본 From 없음 → Select 비움 + 동기화 안내
- [x] Select 라벨 = 메일 주소만 (`displayName` 미결합)
- [x] `EMAIL_SENDER_PROFILE_NOT_HARVESTED` / `MISMATCH` 메시지
- [x] create orphan 기본값 금지 (미harvest 시 Select에 가짜 옵션 추가 안 함)

## QA

- [ ] GET sender-profiles EMAIL 에 `jakorea@jakorea.org`
- [ ] 등록 진입 시 발신 메일 기본 선택 = `jakorea@jakorea.org` (harvest 있을 때)
- [ ] POST templates + 해당 From → 성공
- [ ] 미harvest 메일 선택 불가 또는 400 NOT_HARVESTED
- [ ] 발송 시 템플릿 From과 senderKey 불일치 → MISMATCH
