# CMS auto-send·알림 QA 이관 SSOT

이관일: 2026-10-10
원본 수: 5

원본 경로 목록:

- `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md`
- `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md`
- `apps/cms/docs/api/CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md`
- `apps/cms/docs/api/notification-send-selectable-not-success-qa-2026-09-11.md`
- `apps/cms/docs/api/notification-sms-nhn-catalog-crud-qa-2026-09-11.md`

---

### Source: `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md`

# FE 수신 — 자동발송 케이스 우선순위 2026-09-10

> 원본 BE/Ops handoff: `JABACK/docs/frontend/CMS_FE_BE_HANDOFF_AUTO_SEND_CASE_PRIORITY_2026-09-10.md`  
> 시트 SSOT: `[tinto lab] JA Korea_알림발송 채널 별 문구 체크리스트_260831`  
> 갱신: 2026-09-10 — BE Wave **1–4 완료** 반영 (V108–V110)

## FE 영향 요약

| 항목 | FE 조치 |
|------|---------|
| Wave 1–4 자동발송 | **코드 변경 없음** — BE producer / catalog / Flyway bind |
| CMS **수동** 알림톡 발송 피커 | Option A 유지 — SYSTEM·비enrich 키 `enabled=false` → 「템플릿 사용」비활성 |
| Orval / OpenAPI | 자동발송 path invent 없음 → **필수 재생성 없음** |
| 잔여 BE | 휴면 **전환 예정** EMAIL only · 다수 A는 WEB(APPROVED 템플릿 harvest 후 bind) · 탈퇴 완료 외부채널 후속 |

축 분리:

- **자동발송**: `notification_event` → catalog channel ON + `notification_event_channel_template` → outbox → NHN  
- **CMS 수동 발송**: Admin UI · SYSTEM 변수 `template-variables` `enabled=false`

## Wave 상태 (BE · 참고)

| Wave | 상태 | 요약 |
|------|------|------|
| **1** | 완료 | 로그인 실패·잠금·MFA (`로그인_실패_안내`, `관리자_2단계_인증_실패_안내`) |
| **2** | 완료 | `MEMBER_SIGNUP_COMPLETED` → `회원가입완료안내` (V108). 기타 A는 APPROVED 없으면 WEB |
| **3** | 완료 | `MEMBER_CONSENT_WITHDRAWN` → `동의_철회_안내`, `DORMANT_ACCOUNT_TRANSITIONED` → `계정_휴면_전환_처리_안내` (V109). 휴면 전환 **예정** EMAIL만 |
| **4** | 완료 | 공통 잔여 B (V110) — 아래 |

### Wave 1 MFA 실패 알림 (BE SSOT 최종 · 2026-09-10 재검증)

- `MFA_MAX_FAILED_ATTEMPTS = 5` — 실패 1~4 `MFA_VERIFICATION_FAILED`(계속 입력), 5회째 `ACCOUNT_LOCKED`(HTTP 423 · 30분)
- `ADMIN_MFA_FAILURE_NOTICE` / 템플릿 `관리자_2단계_인증_실패_안내`: **정확히 5회째(잠금과 동시)** WEB 1건 + 알림톡 1건
- 실패 1~4회에는 MFA 실패 알림 없음 (「4회째 경고」구계약 폐기)
- 구계약(6회 잠금·5회 알림 / 4회 경고·5회 무알림) 모두 폐기 — 따르지 말 것
- 비밀번호 로그인 잠금 `ADMIN_LOGIN_LOCK_NOTICE`: WEB만 (알림톡 없음)
- CMS 수동 피커: `관리자_2단계_인증_실패_안내` SYSTEM 변수 `enabled=false` → 프로그램 지정 시 사용 불가(Option A)

### Wave 4 (V110)

| event_type | 시트 | 채널(현재) |
|------------|------|------------|
| `MEMBER_CONSENT_EXPIRING` | 필수 동의 항목 만료 예정 | WEB + EMAIL (`필수_동의_항목_만료_예정_안내`) · ALIMTALK 승인 후 |
| `MEMBER_IDENTITY_VERIFIED` | 본인인증 완료 | WEB |
| `DORMANT_ACCOUNT_WITHDRAWAL_PRE_NOTICE` | 장기 휴면 회원 탈퇴 처리 안내 | WEB · ALIMTALK 승인 후 |
| `MEMBER_WITHDRAWAL_COMPLETED` | 홈페이지 탈퇴 완료 안내 | WEB (익명화 전) · 외부채널 후속 |

스케줄러(기본 OFF): `ja.member-consent.expiring-notice.enabled`, `ja.privacy.dormant-withdrawal-pre-notice.enabled`.

### Wave 3 변수 키 (수동 피커 Option A)

| key | 용도 |
|-----|------|
| `동의 철회 항목` / `동의 철회 일시` | 동의 철회 |
| `휴면 전환일시` | 휴면 전환 처리 |
| (+ enrich) `사용자 아이디(이메일)` | 공통 |

## FE QA (수동 발송 · 회귀)

- [ ] 프로그램 지정 + 자동발송 전용 템플릿(`로그인_실패_안내`, `동의_철회_안내`, `관리자_2단계_인증_실패_안내` 등) → 「템플릿 사용」비활성

#### Marker lines (excerpt)
```
- [ ] Master `000000` LOCAL_TEST_CODE 성공 경로와 실패 카운트 QA 분리
```

---

### Source: `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md`

# FE 수신 — 자동발송 Wave1–13 진행분 적용 2026-09-10

> 원본 BE SSOT: `JABACK/docs/frontend/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md`  
> 매트릭스: [`CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md`](./CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md)  

## FE 반영 (2026-09-10)

- [x] OpenAPI fetch + `forms-surveys` Orval (`createFeedback` = POST `…/form-responses/{id}/feedback`)
- [x] `generate:api:forms-surveys` 스크립트 추가
- [x] CMS 인박스 `eventType` 한글 라벨 맵 (`notification-event-type-labels.ts`) + adapter 연동
  - BE QA 키 정합: `UJAT_VOLUNTEER_ATTENDANCE_STATUS_CHANGED`, `PROGRAM_PARTICIPANT_COMPLETION_NOT_COMPLETED`, Wave5 cancel 키
  - G2: `PROGRAM_NOTICE_CREATED` ≠ `ADMIN_PROGRAM_NOTICE_CREATED` (관리자 접미사)
- [x] UJAT 교육계획서·교육일지 피드백 → `useCreateFormResponseFeedbackMutation` + `formResponseId` 파이프
- [x] 일반 프로그램 과제 제출 내역 「피드백 작성」CTA (`formResponseId` / `submissionId`)
- [x] Portal GET feedback (`usePortalFormResponseFeedbackQuery`, 모달 open 시에만 enabled)
- [x] 자동발송 ALIMTALK/스케줄러 invent 없음 확인
- [x] 수동 피커 Option A 유지

### TanStack Query / CRUD

- CMS: `formResponseQueryKeys.feedback(responseId)` — create 성공 시 `setQueryData`만, form-templates/UJAT detail 광범위 invalidate 없음
- CMS: 회원 과제 제출 목록은 `member-detail-assignment-submissions` prefix만 invalidate
- Platform: `platformQueryKeys.mypage.formResponseFeedback(id)` — Class D, `enabled: feedbackOpen`

### Orval 참고

- operationId는 BE OpenAPI 기준 **`createFeedback`** (문서의 `createFormResponseFeedback` 별칭과 동일 path)
- body: `{ content: string }` max 4000
- 로컬 `backend.openapi.json` path 수: **714** (문서 x-route-count 873과 다를 수 있음 — BE info 필드 미포함 시)

## QA

- [ ] CMS 인박스: 신규 eventType이 raw 코드로 안 보임
- [ ] UJAT 문서뷰어 + `formResponseId` → 피드백 등록 200 · 상태 반영
- [ ] formResponseId 없는 mock → UI만 반영(로컬)
- [ ] 일반 과제 remote 상세 + formResponseId → 피드백 CTA
- [ ] 포털 피드백 확인 모달 — open 시에만 GET
- [ ] ALIMTALK 잔여 케이스 약속 카피 없음

## Out of scope (유지)

- 자동발송 path invent · 스케줄러 FE 토글 · SYSTEM 변수 usable 처리
- Platform 인박스 eventType 라벨 맵 (인박스 UI 미연동)


---

### Source: `apps/cms/docs/api/CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md`

# FE 전달용 상세 프롬프트 — 알림 template-variables `enabled` SSOT · enrich · 발송 실패 2026-09-09

> **이 문서가 FE Cursor/에이전트에 넘길 SSOT입니다.**  
> 아래 **「복붙용 프롬프트」** 코드펜스(` ```text ` … ` ``` `) **안 전체**를 그대로 복사해 FE 채팅에 붙여 넣으세요.
>
> 관련 보조 문서:
> - [`CMS_FE_API_UPDATE_PROMPT_EMAIL_2026-09-07.md`](./CMS_FE_API_UPDATE_PROMPT_EMAIL_2026-09-07.md)
> - [`CMS_FE_API_UPDATE_PROMPT_ALIMTALK_2026-09-04.md`](./CMS_FE_API_UPDATE_PROMPT_ALIMTALK_2026-09-04.md)
> - [`CMS_FE_PROMPT_ALIMTALK_DELIVERY_DETAIL_2026-09-08.md`](./CMS_FE_PROMPT_ALIMTALK_DELIVERY_DETAIL_2026-09-08.md)
> - [`CMS_FE_PROMPT_ALIMTALK_NHN_SYNC_CATEGORY_2026-09-04.md`](./CMS_FE_PROMPT_ALIMTALK_NHN_SYNC_CATEGORY_2026-09-04.md)

| 메타 | 값 |
|------|-----|
| BE 레포 | `JABACK` (`com.jakorea.cms`) |
| 대상 화면 | CMS Admin 알림 **메일·문자** 발송(템플릿 변수 패널) + 발송 실패 toast/이력. 알림톡은 본문 편집 없음·발송 시 동일 fail-closed |
| 로컬 QA 픽스처 | `programId=164003`, `actorId=1799401` (MEMBER 이건희) |
| Notion | [자동입력(변수값) 리스트](https://app.notion.com/p/38af3e2a77d080598856dc19c161b2cf), [사용 가능 항목](https://app.notion.com/p/341f3e2a77d080eb8b8dfd2f857baec7), [알림 발송 케이스](https://app.notion.com/p/37df3e2a77d08056afccf8c3445e24fc) |

---

## OpenAPI / Orval (전달 전 요약) — **BE 보강 완료 (2026-09-09)**

| 항목 | 필요? | 상세 |
|------|-------|------|
| 신규 path | ❌ | `GET /api/admin/notification-send-batches/template-variables` 기존 |
| **OpenAPI 스키마** | ✅ **BE 반영됨** | `openapi/backend.openapi.json` — query enum·`NotificationTemplateVariableCatalogResponse`·`NotificationCatalogVariableItem.enabled`·example |
| `/v3/api-docs` | ✅ **Controller `@Parameter`/`@Schema` 반영** | bootRun 재시작 후 springdoc이 동일 계약 노출. FE `fetch:openapi` 하면 패치 no-op에 가깝게 |
| Orval 재생성 | ✅ **FE** | `pnpm --filter cms fetch:openapi` (선택) → `generate:api:notifications` |
| invent-ban | ✅ | path·필드명 추가 금지. description/enum/example만 |

### 실패 코드 (런타임 · OpenAPI example 포함)

- `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}`
- 복수: `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키1},{키2}`
- 배치 `recipients[].failureCode` / 발송조회 `failedReason` 동일 문자열

### FE residual 문서와의 정합

FE 쪽 잔여 작업 체크리스트(§2 OpenAPI·§3 QA)를 쓰는 경우:

1. BE handoff: 이 레포 `openapi/backend.openapi.json` (path 보강본) + bootRun `/v3/api-docs`
2. FE: `fetch:openapi` → `generate:api:notifications` → typecheck
3. 패치 스크립트가 이미 enum을 넣었다면 fetch 후 **diff가 줄거나 no-op** 이어야 함
4. §3 UI 체크리스트는 로컬 시드 `164003` / `1799401` 로 수동 검증

BE SSOT 프롬프트 파일명: 이 문서.  

---

## 복붙용 프롬프트 (FE 에이전트용)

아래 블록을 **통째로** FE에 전달한다.

```text
당신은 JA CMS Admin FE(apps/cms) 「알림」메일·문자 발송·템플릿 변수 패널·발송 실패 UX 담당이다.
BE(JABACK) 2026-09-09 계약: template-variables `enabled` SSOT + enrich 갭 해소 +
NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING fail-closed(복수 키) 를 **그대로** 구현·검증한다.

프론트 레포만 수정한다. BE path/필드를 invent 하지 마라.
질문은 이 문서·OpenAPI·기존 FE 코드가 충돌할 때만 하라.

#### Marker lines (excerpt)
```
   - 프로그램 선택됨 → programId + (유형 필터/단일 수신 유형이 있으면) participantType
2) 변수 패널: 응답 `enabled` 만 믿는다 (로컬 재계산 금지)
   - requiresProgram && !programId → 동일 비활성(이중 가드 OK, SSOT는 여전히 BE enabled)
     c) 스키마 오기 전엔 이 문서 타입을 임시 SSOT로 쓰고 any invent 금지
   - TemplateVariables query: programId, participantType, memberType, keyword, category
D. enabled 의미 (혼동 금지)
BE enabled 계산 요약(참고만 — FE 재구현 금지):
- requiresProgram && programId 없음 → false
IF programId 선택됨:
  query.programId = programId
캐시 키에 programId+participantType+memberType 포함.
- isNotificationCatalogVariableDisabled(item, programId):
    // 또는: !item.enabled || (item.requiresProgram && !programId)
programId: 164003
1) template-variables?programId=164003&participantType=PARTICIPANT
3) programId만 (유형 없음)
  ?programId=164003
  ?programId=164003
  "programId": 164003,
- 메일·문자·알림톡 발송 resolve 경로 동일
[ ] Orval(또는 타입)에 CatalogVariableItem.enabled 반영. stub이면 문서 타입 사용·invent 금지
[ ] programId+participantType 변경 시 template-variables 재조회
[ ] SMS sync toast 「문자 카테고리」 오표기 금지(별도 sync 문서)
| enabled SSOT | `NotificationTemplateVariableCatalogService.isEnabled` |
- **OpenAPI** = stub이면 **갱신 필요**(이 문서가 임시 SSOT) → Orval 재생성  
```

---

### Source: `apps/cms/docs/api/notification-send-selectable-not-success-qa-2026-09-11.md`

# 알림 발송 QA — 「선택 가능 ≠ 발송 성공」(2026-09-11)

> FE: `apps/cms` 메일/문자/알림톡 발송 · 발송 이력  
> 선행 BE: `CMS_FE_PROMPT_NOTIFICATION_SEND_TEMPLATE_PICKER_2026-09-11`  
> 카피 SSOT: `model/shared/send-ux-copy.ts`

## 제품 규칙 (고정)

| 구분 | 의미 |
|------|------|
| 피커 `enabled=true` / 「사용하기」활성 | 스코프(프로그램·참여/회원 유형)에서 키 **허용** |
| 발송 성공 | enrich 값이 DB에 **존재**해야 함 (fail-closed) |
| `enabled=false` → 「사용하기」비활성 | **유지** (메가 템플릿 비활성 = 정상일 수 있음) |
| 빈 `#{…}` → `-` 치환 | **금지** (성공 위장) |
| preview / usable=값존재 API | **invent 금지** |

비활성 경고(키 목록)와 「값 없음으로 인한 발송 실패」안내를 **같은 문장으로 섞지 않음**.

## 스모크 / 기대값 (로컬·검증 DB)

| 시나리오 | programId | 수신자 | 템플릿 | 기대 |
|----------|-----------|--------|--------|------|
| 성공 | `164003` | actorId `1799401` (이건희) | **146** `수정_가능_프로그램_모든_변수_충족` (동일 키 계열 OK) | 발송 **성공** |
| 실패 가능 | `164003` | (동일 또는 문맥 수신자) | **147** `일반_프로그램_변수_충족` | 피커 비활성 **또는** 활성 후 `REQUIRED_VARIABLE_MISSING` (배정·정산·인증서 등) → **버그 아님** |

- QA 「성공」검증은 **146 계열**만.
- **147**은 「실패 키 노출」검증용. 버그 티켓 올리지 않음.
- 이력 실패 배지는 **해당 배치 스냅샷**. 재발송으로 현재 상태 확인.

## FE 체크리스트

- [ ] 프로그램·참여/회원 유형 문맥에서 본문 `#{키}` 중 `enabled=false` → 「사용하기」비활성
- [ ] 템플릿 피커에 「선택 가능 ≠ 발송 성공」안내 문구 노출
- [ ] `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING` 토스트: **키 목록 + 보조 안내**
- [ ] 발송 이력/상세 실패: 「발송 당시 기준」스냅샷 라벨
- [ ] 실패 상세를 연 채 발송 화면에서 다른 템플릿을 골라도, 이력 오류가 현재 상태로 덮이지 않음
- [ ] `164003` + 이건희 + 146 성공 스모크
- [ ] 147 실패 가능 = QA 기대값
- [ ] POST: `programId` 필수, MEMBER+`actorId`, 서버 예약·카탈로그 키 / 마스킹 연락처 `variables` 재전송 없음


---

### Source: `apps/cms/docs/api/notification-sms-nhn-catalog-crud-qa-2026-09-11.md`

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


---
