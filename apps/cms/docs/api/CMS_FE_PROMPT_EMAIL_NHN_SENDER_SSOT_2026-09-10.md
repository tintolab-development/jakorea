# FE 수신 — EMAIL NHN 발신 SSOT 보강 2026-09-10

> 원본 BE SSOT: `JABACK/docs/frontend/CMS_FE_PROMPT_EMAIL_NHN_SENDER_SSOT_2026-09-10.md`  
> 선행: [`CMS_FE_PROMPT_EMAIL_DEFAULT_SENDER_2026-09-10.md`](./CMS_FE_PROMPT_EMAIL_DEFAULT_SENDER_2026-09-10.md)

## FE 반영 (2026-09-10)

- [x] Orval fetch — notifications OpenAPI
- [x] `EMAIL_SENDER_PROFILES_EMPTY` → `MAIL_SENDER_PROFILES_EMPTY_MESSAGE` 매핑
- [x] `isCategoryNeedsSyncError`에 EMPTY 포함 → 저장 실패 시 「동기화」CTA
- [x] Hub(remote): 발신자명 읽기 전용 + Select From의 harvest `displayName` SSOT 반영
- [x] harvest 0건: Select 비활성 + 「발신 프로필 동기화」CTA (`syncSenderProfiles` EMAIL)
- [x] `providerStatsKeyId` invent UI — EMAIL에 없음(확인만)

## QA

- [ ] Hub harvest 0건 → PROFILES_EMPTY + sync 안내
- [ ] harvest 후 From 선택 → 성공, 저장 displayName=list 값
- [ ] FE가 임의 표시명/statsKey 보내도 Hub 응답/재조회에 invent 없음
- [ ] NOT_HARVESTED / MISMATCH 회귀 없음
- [ ] Orval/typecheck green
