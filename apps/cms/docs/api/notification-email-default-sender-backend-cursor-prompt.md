# Cursor prompt — EMAIL 템플릿 기본 발신 메일 `jakorea@jakorea.org` · NHN harvest 계약

> 작성: 2026-09-10 · FE(CMS)  
> 대상: JA Korea CMS Java Backend (`NotificationTemplate*` upsert / `notification_sender_profile` / OpenAPI)  
> FE: `apps/cms` **메일 템플릿 등록·수정** (+ 발송 시 senderKey 매칭)  
> 관련 BE 코드(이미 존재): `NotificationService.requireHarvestedEmailSender`,  
> `ClientErrorMessageResolver` → `EMAIL_SENDER_PROFILE_NOT_HARVESTED`  
> 관련 FE handoff: [`mail-management-fe-integration-backend-handoff-2026-09-08.md`](./mail-management-fe-integration-backend-handoff-2026-09-08.md)  
> 관련 BE doc: `JABACK/docs/frontend/CMS_FE_API_UPDATE_PROMPT_EMAIL_2026-09-07.md` §3 발신 프로필

아래 **「프롬프트 (복사용)」** 코드펜스 안 전체를 백엔드 Cursor/담당자에게 그대로 전달하면 된다.

---

## FE 제품 UX / 이미 반영한 것

| 항목 | FE 동작 (2026-09-10) |
|------|----------------------|
| 메일 템플릿 **등록** 진입 | 발신 메일 기본값 **`jakorea@jakorea.org`** |
| 발신 메일 UI | 자유입력 제거 → `GET …/notification-sender-profiles?channelType=EMAIL&useYn=true` **Select** |
| FE 검증 | 프로필 목록이 있으면 `senderKey` 소문자 일치(BE harvest와 동일). 없으면 `*.jakorea.org` 도메인만 허용(로컬/mock) |
| upsert body | `providerSenderEmailAddress` = 선택 메일, `senderProfileDisplayName` = 발신자명(optional) |
| 발송 | `senderProfileId` 또는 `senderKey`(메일). 템플릿 발신 메일과 불일치 시 BE `EMAIL_SENDER_PROFILE_MISMATCH` |

FE는 invent path를 만들지 않는다. **BE가 할 일 = 계약 문서화·스테이징 시드·OpenAPI 설명 보강·(선택) create 시 생략 기본값**.

---

## 프롬프트 (복사용)

```text
당신은 JA Korea CMS Java 백엔드(Notifications / EMAIL template · sender profile)를 점검·보강한다.
프론트 레포는 없다. Controllers / DTO / Services / OpenAPI / JDBC / seed·동기화를 찾아 맞춰라.
질문은 계약이 코드·노션과 충돌할 때만 하라.
invent-ban: path·필드명을 임의로 만들지 마라. 기존
  POST/PATCH /api/admin/notification-templates
  GET /api/admin/notification-sender-profiles?channelType=EMAIL&useYn=true
  notification_sender_profile / providerSenderEmailAddress
를 재사용한다.

════════════════════════════════════════════════════════════════
A. 배경 / 제품 요구 (FE 2026-09-10)
════════════════════════════════════════════════════════════════
CMS Admin 「메일 템플릿 등록」:
1) 발신 메일 기본값은 항상 jakorea@jakorea.org 이어야 한다 (FE는 이미 기본값 세팅).
2) 발신 메일은 NHN에 등록되고 BE가 harvest(동기화)한 EMAIL sender profile 의 sender_key 만 허용.
3) FE는 발신 메일을 Select 로만 고른다. 임의 gmail 등 입력은 불가에 가깝다.
4) 등록/수정 시 BE가 harvest 목록과 불일치하면 400 EMAIL_SENDER_PROFILE_NOT_HARVESTED
   (메시지: NHN에서 확인된 발신 메일만… / field providerSenderEmailAddress) — 이미 Resolver에 있음.

BE 코드 실측(유지):
- create/updateNotificationTemplate → requireHarvestedEmailSender(channelType, senderEmail)
- NHN catalog 활성 + EMAIL + 프로필 테이블에 use_yn=true 행이 1건 이상이면
  lower(BTRIM(sender_key)) = lower(BTRIM(providerSenderEmailAddress)) 필수
- 프로필 0건이면 harvest 검사 skip (로컬/미동기화)
- 발송 배치: senderProfileId 없으면 senderKey(메일) 매칭, 템플릿 메일과 불일치 시
  EMAIL_SENDER_PROFILE_MISMATCH

════════════════════════════════════════════════════════════════
B. 목표
════════════════════════════════════════════════════════════════
1) 스테이징/로컬 스모크에서 jakorea@jakorea.org 가 EMAIL 발신 프로필로 항상 존재하도록
   시드 또는 동기화 후 검증 경로를 고정한다.
2) OpenAPI / 에러 계약을 FE Orval·문서에 명확히 남긴다.
3) (선택) EMAIL 템플릿 create 시 providerSenderEmailAddress 생략이면
   jakorea@jakorea.org 로 기본 채움 — 단, harvest 목록에 있을 때만.
   없으면 기존처럼 필수 누락 또는 EMAIL_SENDER_PROFILE_NOT_HARVESTED.

【In scope】
1) notification_sender_profile EMAIL 시드/동기화 점검
   - sender_key = jakorea@jakorea.org (대소문자 무시 매칭이므로 저장은 소문자 권장)
   - display_name 예: JA코리아 / JA KOREA (기존 정책 따름)
   - use_yn = true, channel_type = EMAIL
2) OpenAPI NotificationTemplateUpsertRequest.providerSenderEmailAddress description 보강
   - "EMAIL From. NHN harvest된 sender profile senderKey와 일치해야 함.
     미일치 시 400 EMAIL_SENDER_PROFILE_NOT_HARVESTED.
     템플릿 등록 FE 기본값: jakorea@jakorea.org"
3) SenderProfileResponse / list API description에 EMAIL=메일주소, SMS=발신번호 명시
4) 통합/계약 테스트:
   - harvest에 jakorea@jakorea.org 있을 때 create EMAIL template OK
   - harvest에 없는 other@jakorea.org → EMAIL_SENDER_PROFILE_NOT_HARVESTED
   - (선택) providerSenderEmailAddress null create → 기본 jakorea@jakorea.org 적용 후 harvest 검사
5) 기존 requireHarvestedEmailSender / EMAIL_SENDER_PROFILE_MISMATCH 동작 회귀 금지

【Out of scope】
- 신규 path invent
- FE UI 변경 요청(이미 반영됨)
- ALIMTALK/SMS 발신 키 규칙 변경
- NHN 콘솔에 메일 주소를 “대신” 등록하는 자동화(불가 시 문서에 수동 등록 절차만)

════════════════════════════════════════════════════════════════
C. 계약 요약 (SSOT)
════════════════════════════════════════════════════════════════
【템플릿 upsert】
body:
  displayName (필수, NHN 템플릿명 규칙)
  providerSenderEmailAddress (EMAIL 필수 — 또는 선택 default 적용 후 harvest)
  senderProfileDisplayName (optional, 발신자 표시명)
  titleTemplate / contentTemplate / emailTemplateLanguage=PLAIN_TEXT …

검증 순서(권장 유지):
  1) channel EMAIL
  2) senderEmail blank? → 400 (또는 default jakorea@jakorea.org 후 재검사)
  3) harvest profiles > 0 이면 sender_key 소문자 일치
     else skip
  4) NHN create/update email template 에 senderEmail 전달

【발신 프로필 list】
GET /api/admin/notification-sender-profiles?channelType=EMAIL&useYn=true
  senderKey = From 메일
  displayName = 발신자 표시명
FE 매칭: senderKey === 선택 메일 (소문자)

【에러】
EMAIL_SENDER_PROFILE_NOT_HARVESTED
  → field: providerSenderEmailAddress
  → 사용자 메시지 유지: NHN에서 확인된 발신 메일만 사용할 수 있습니다…
EMAIL_SENDER_PROFILE_MISMATCH (발송)
  → 템플릿 발신 메일 ≠ 배치 senderProfile/senderKey
NOTIFICATION_SENDER_PROFILE_NOT_FOUND
  → 발송 시 프로필 없음

【시드 / 스테이징 필수】
최소 1건:
  channel_type=EMAIL, use_yn=true,
  sender_key=jakorea@jakorea.org,
  display_name=<팀 합의 표시명>
sandbox만 쓰는 환경이면 추가로 noreply.sandbox@jakorea.org 유지해도 되나,
FE 등록 기본값은 jakorea@jakorea.org 이므로 이 키가 harvest에 없으면 등록이 전부 실패한다.

NHN 콘솔에 해당 From이 없으면 sync만으로는 안 생김 →
  docs에 “NHN 발신 메일 관리에 jakorea@jakorea.org 등록 후 CMS 동기화” 절차 1줄 추가.

════════════════════════════════════════════════════════════════
D. 완료 기준
════════════════════════════════════════════════════════════════
- [ ] 스테이징: GET sender-profiles EMAIL 에 jakorea@jakorea.org 존재
- [ ] POST notification-templates EMAIL + providerSenderEmailAddress=jakorea@jakorea.org → 201/200
- [ ] 동일 API + 미harvest 메일 → 400 EMAIL_SENDER_PROFILE_NOT_HARVESTED
- [ ] OpenAPI description에 harvest 규칙 + FE 기본값 명시
- [ ] (선택) omit providerSenderEmailAddress → 서버 default jakorea@jakorea.org + harvest
- [ ] 기존 EMAIL 발송 mismatch / 첨부 / 템플릿명 규칙 회귀 없음
- [ ] FE Orval 가능하도록 OpenAPI 커밋/배포

════════════════════════════════════════════════════════════════
E. FE 전달 메모 (구현 후 한 줄)
════════════════════════════════════════════════════════════════
“EMAIL sender harvest에 jakorea@jakorea.org 시드됨 / OpenAPI providerSenderEmailAddress 설명 보강 /
(선택) create default 적용 여부: yes|no”
```

---

## FE 측 참고 (구현 위치)

| 항목 | 경로 |
|------|------|
| 기본값 상수 | `model/mail-template/sender-email.ts` → `MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL` |
| harvest 검증 | 동 파일 `validateMailSenderEmail({ harvestedSenderKeys })` |
| 등록 폼 Select | `ui/mail-template/form-modal.tsx` + `useMailSenderProfilesQuery` |
| upsert 매핑 | `api/mail-template-service.ts` → `providerSenderEmailAddress` |
| 에러 매핑 | `api/get-notifications-api-error.ts` → `EMAIL_SENDER_PROFILE_NOT_HARVESTED` |
