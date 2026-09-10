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
(FE 레포에서 `CMS_FE_PROMPT_NOTIFICATION_TEMPLATE_VARIABLES_ENABLED_2026-09-09.md` 로 복사해도 동일 내용.)

---

## 복붙용 프롬프트 (FE 에이전트용)

아래 블록을 **통째로** FE에 전달한다.

```text
당신은 JA CMS Admin FE(apps/cms) 「알림」메일·문자 발송·템플릿 변수 패널·발송 실패 UX 담당이다.
BE(JABACK) 2026-09-09 계약: template-variables `enabled` SSOT + enrich 갭 해소 +
NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING fail-closed(복수 키) 를 **그대로** 구현·검증한다.

프론트 레포만 수정한다. BE path/필드를 invent 하지 마라.
질문은 이 문서·OpenAPI·기존 FE 코드가 충돌할 때만 하라.

════════════════════════════════════════════════════════════════
A. 목표 / 범위
════════════════════════════════════════════════════════════════
【In scope】
1) GET …/template-variables 쿼리 빌드
   - 프로그램 선택됨 → programId + (유형 필터/단일 수신 유형이 있으면) participantType
   - 프로그램 미선택(전체) → memberType(있으면)
   - keyword / category 기존 유지
2) 변수 패널: 응답 `enabled` 만 믿는다 (로컬 재계산 금지)
   - enabled !== true → 회색 + 클릭/드래그 삽입 차단 + 안내 toast
   - requiresProgram && !programId → 동일 비활성(이중 가드 OK, SSOT는 여전히 BE enabled)
3) 메일·문자 템플릿 편집/발송 화면에서 변수 삽입 UX 통일
4) 발송 실패 표시:
   - toast / 배치 수신자 failureCode / 발송조회 failedReason
   - NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키 →
     「템플릿 필수 변수가 없습니다: {키}」
   - 복수 키 `키1,키2` → 그대로 표시(쉼표 구분)
5) enabled=true 인데 원천 데이터 없어 발송 실패하는 케이스는
   FE가 사전 차단하지 않음 — BE fail-closed + 키 표시가 정상 UX

【Out of scope】
- 알림톡 템플릿 본문 CMS 편집/PATCH (NHN Console만)
- FE에서 enabled 규칙 하드코딩 표
- 빈 #{…} 를 성공으로 보내기 / `-` 로 억지 치환
- 신규 path 발명
- OpenAPI에 없는 query/response 필드 invent

════════════════════════════════════════════════════════════════
B. OpenAPI / Orval
════════════════════════════════════════════════════════════════
1) BE에서 openapi/backend.frontend-handoff.json (또는 backend.openapi.json) 최신을 받는다.
2) 현재(2026-09-09) 해당 path OpenAPI는 stub 가능성이 크다.
   → CatalogVariableItem / query params가 스키마에 없으면:
     a) BE에 OpenAPI 보강 요청(이 문서 「OpenAPI / Orval」표)
     b) Orval 재생성
     c) 스키마 오기 전엔 이 문서 타입을 임시 SSOT로 쓰고 any invent 금지
3) Orval 재생성 후 확인:
   - TemplateVariables query: programId, participantType, memberType, keyword, category
   - CatalogVariableItem.enabled / requiresProgram / participantTypes / memberTypes …
4) path (신규 없음):
   GET  /api/admin/notification-send-batches/template-variables
   GET  /api/admin/notification-send-batches/recipient-candidates
   POST /api/admin/notification-send-batches
   GET  /api/admin/notification-send-batches/{batchId}
   GET  /api/admin/notification-deliveries/{deliveryId}   // 발송조회 상세(채널 공통)

════════════════════════════════════════════════════════════════
C. 채널별 역할 (반드시 이해)
════════════════════════════════════════════════════════════════
┌──────────────┬────────────────────────────┬──────────────────────────────┐
│ 채널         │ 템플릿 작성                 │ 변수 처리                     │
├──────────────┼────────────────────────────┼──────────────────────────────┤
│ ALIMTALK     │ NHN Console 작성·승인       │ CMS 본문 편집 없음.           │
│              │ CMS는 sync/미러만           │ 발송 시 BE resolve+fail-closed│
│              │                            │ → NHN templateParameters       │
├──────────────┼────────────────────────────┼──────────────────────────────┤
│ EMAIL / SMS  │ CMS 제목·본문에 #{키}       │ 변수 패널 enabled 가드 +      │
│ (LMS/MMS 포함)│                            │ BE enrich·치환·fail-closed    │
└──────────────┴────────────────────────────┴──────────────────────────────┘

동일점:
- NotificationTemplateParameterResolver.resolve 는 ALIMTALK/EMAIL/SMS 공통
- 누락 시 provider(NHN) 호출 전 실패
- 코드: NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}[,{키2}…]

차이점:
- 메일·문자: FE가 #{…} 를 넣으므로 enabled 패널이 핵심
- 알림톡: NHN placeholder 키 ≈ CMS catalog key 여야 templateParameters 매칭
  (CMS에서 알림톡 본문 수정 API 없음)

════════════════════════════════════════════════════════════════
D. enabled 의미 (혼동 금지)
════════════════════════════════════════════════════════════════
enabled = 「이 발송 맥락에서 변수 **삽입/사용이 허용되는지**」
enabled ≠ 「지금 수신자·프로그램에 **값이 있다**」

따라서:
- enabled=false → FE가 삽입 차단 (유형 미스매치 예방)
- enabled=true  + 원천 데이터 없음 → 발송 실패(BE). FE 사전 차단 의무 없음
- enabled=true  + enrich 구현됨 + 데이터 있음 → 치환 후 발송 성공

BE enabled 계산 요약(참고만 — FE 재구현 금지):
- requiresProgram && programId 없음 → false
- program 유형 그룹 / 모집 유형 불일치 → false
- participantType·memberType **둘 다 없음** →
  participantTypes 또는 memberTypes 가 있는 **유형 특화 키는 false**
  (프로그램 공통 키만 true — 예: 프로그램명, 교육 진행 수업 시간)
- participantType 있음 → 해당 participantTypes 매칭
- memberType 있음 → 해당 memberTypes 매칭

════════════════════════════════════════════════════════════════
E. 쿼리 빌드 규칙 (수신자 후보와 동일 철학)
════════════════════════════════════════════════════════════════
함수 예: buildNotificationTemplateVariablesQuery

IF programId 선택됨:
  query.programId = programId
  IF 수신자 유형 필터 또는 단일 유형만 선택된 경우:
    query.participantType = PARTICIPANT | INSTRUCTOR | VOLUNTEER
  // memberType은 프로그램 선택 시 선택적으로 병행 가능(BE는 AND)
ELSE:  // 대상 프로그램=전체
  IF memberType 필터 있음:
    query.memberType = …
  // requiresProgram 항목은 BE enabled=false

프로그램 변경 / 참여유형 변경 / 회원유형 변경 시 template-variables **재조회**.
캐시 키에 programId+participantType+memberType 포함.

════════════════════════════════════════════════════════════════
F. 변수 패널 UX
════════════════════════════════════════════════════════════════
- 목록에서 enabled=false 항목을 **숨기지 마라** (디스에이블 UX)
- isNotificationCatalogVariableDisabled(item, programId):
    return item.enabled !== true
    // 또는: !item.enabled || (item.requiresProgram && !programId)
- aria-disabled, 회색, 커서 not-allowed
- 클릭 시 toast 예:
  「현재 프로그램/참여 유형에서는 사용할 수 없는 변수입니다.」
- 삽입 시 token 필드(#{…}) 그대로 본문에 넣기. key만 넣지 말 것.
- 미리보기: BE가 치환한 결과가 있으면 그걸 쓰고, 없으면 원문 표시

════════════════════════════════════════════════════════════════
G. 발송 실패 UX (변수값 데이터 부재 포함)
════════════════════════════════════════════════════════════════
코드 프리픽스:
  NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING

형식:
  NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}
  NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키1},{키2}

FE 표시 (formatNotificationFailedReason):
  「템플릿 필수 변수가 없습니다: {키}」
  복수: 「템플릿 필수 변수가 없습니다: {키1}, {키2}」
  ★ 키를 절대 버리지 말 것. 코드만 보여 주지 말 것.

노출 위치:
1) 배치 생성 직후 동기 에러 toast (에러 body message)
2) 문자/메일 「발송 조회 상세」:
   - deliveries detail: delivery.failedReason
   - sendStatus=SEND_FAILED, sentAt/deliveredAt 없으면 "-"
   - preview에 #{…} 원문이 보이면 = 치환 전 실패(정상)
3) 배치 상세 GET …/notification-send-batches/{batchId}:
   - recipients[].failureCode  ← outbox last_error_code
   - outboxStatus=FAILED_PERMANENT 등
   - failureCode에 위 문자열 그대로 올 수 있음

provider(NHN) 호출 전 실패이므로 발송일시·수신일시는 보통 "-".

════════════════════════════════════════════════════════════════
H. 로컬 QA 픽스처 (BE 시드 가정)
════════════════════════════════════════════════════════════════
programId: 164003
프로그램명: [수정 가능] 일반 프로그램 더미
수신자 MEMBER actorId: 1799401 (이건희 / 010-5764-9470 / 2kunhee94@tinto.co.kr)
역할: GENERAL+INSTRUCTOR
participant: PARTICIPANT+INSTRUCTOR+VOLUNTEER
기관신청: 경기고등학교 (학급2·학생30)
스케줄: 2026-10-15 10:00~12:00 → 교육 진행 수업 시간 ≈ "10:00 ~ 12:00"
배정 기관명: 경기고등학교 (INSTRUCTOR/VOLUNTEER enabled 맥락)

검증:
1) template-variables?programId=164003&participantType=PARTICIPANT
   → 배정 기관명·활동비·강사 인증서 등 enabled=false
   → 교육 진행 수업 시간 enabled=true
2) participantType=INSTRUCTOR
   → 배정 기관명·활동비 enabled=true
3) programId만 (유형 없음)
   → 유형 특화 키 enabled=false, 프로그램 공통 키 true
4) 본문에 #{교육 진행 수업 시간} 넣고 MEMBER 1799401 발송
   → 일정 있으면 성공·치환 / 일정 삭제 시 실패+키
5) #{배정 기관명} 을 PARTICIPANT 전용 발송에 FE가 넣지 못함(enabled=false)
6) 과거 scheduledAt 넣지 말 것 → INVALID_VALUE (별건)
7) Idempotency-Key 필수

════════════════════════════════════════════════════════════════
I. API 스니펫
════════════════════════════════════════════════════════════════
// 변수 카탈로그
GET /api/admin/notification-send-batches/template-variables
  ?programId=164003
  &participantType=PARTICIPANT

// 수신자 후보
GET /api/admin/notification-send-batches/recipient-candidates
  ?programId=164003
  &channelType=SMS
  &keyword=이건희
// ★ 참여 유형 컬럼은 typeLabel만. memberType으로 덮어쓰지 말 것.

// 즉시 발송
POST /api/admin/notification-send-batches
Idempotency-Key: <uuid>
{
  "batchName": "변수 QA",
  "programId": 164003,
  "templateId": <활성 SMS|EMAIL 템플릿>,
  "senderProfileId": <채널 프로필>,
  "recipients": [
    { "actorType": "MEMBER", "actorId": 1799401 }
  ]
}
// scheduledAt 생략(즉시). 예약이면 미래 ISO-8601만.

════════════════════════════════════════════════════════════════
J. BE 이미 반영된 점 (FE가 기대해도 되는 동작)
════════════════════════════════════════════════════════════════
- enabled: 유형 미지정 시 유형 특화 false
- enrich: 교육 진행 수업 시간(스케줄 HH:mm~HH:mm), 배정 기관명(활성 기관신청명)
- fail-closed: 누락 키 전부 나열(쉼표)
- 메일·문자·알림톡 발송 resolve 경로 동일
- 빈/whitespace 값은 부재로 간주. `-`/`N/A`/원문 #{…} 를 값으로 치지 않음

════════════════════════════════════════════════════════════════
K. Test plan (FE QA / PR)
════════════════════════════════════════════════════════════════
[ ] Orval(또는 타입)에 CatalogVariableItem.enabled 반영. stub이면 문서 타입 사용·invent 금지
[ ] programId+participantType 변경 시 template-variables 재조회
[ ] PARTICIPANT 맥락에서 강사 전용 변수 회색·삽입 불가
[ ] INSTRUCTOR 맥락에서 배정 기관명·활동비 활성
[ ] 유형 없이 프로그램만 선택 → 유형 특화 비활성
[ ] requiresProgram && 프로그램 전체 → 비활성
[ ] 교육 진행 수업 시간 삽입 후 164003 발송 성공(시드 있을 때)
[ ] 데이터 없는 프로그램에서 동일 변수 → 실패 toast에 키 표시
[ ] 발송 조회 상세: SEND_FAILED + failedReason 키 + 일시 "-"
[ ] 배치 상세 recipients[].failureCode 동일 코드 표시
[ ] 알림톡 본문 편집 UI를 열지 않음(기존 정책 유지)
[ ] SMS sync toast 「문자 카테고리」 오표기 금지(별도 sync 문서)
[ ] 빈 #{…} 가 성공 발송으로 나가지 않음(네트워크에 NHN body 없음)

════════════════════════════════════════════════════════════════
L. Done 기준
════════════════════════════════════════════════════════════════
- FE는 enabled를 재계산하지 않고 패널·삽입만 가드한다
- 데이터 부재 발송 실패는 키를 포함한 사용자 문구로 보인다
- OpenAPI stub이면 BE handoff 갱신 요청을 PR/이슈에 남긴다
- 메일·문자 UX가 동일하고, 알림톡은 편집 없이 실패 표시만 동일 계약을 따른다
```

---

## BE 참고 (FE 구현 불필요 · OpenAPI 담당용)

이미 코드에 반영된 것:

| 영역 | 클래스 / 동작 |
|------|----------------|
| enabled SSOT | `NotificationTemplateVariableCatalogService.isEnabled` |
| enrich | `NotificationProgramCatalogVariableEnricher` — `교육 진행 수업 시간`, `배정 기관명` |
| fail-closed | `NotificationTemplateParameterResolver` — 복수 키 `String.join(",", missing)` |
| 발송 파이프라인 | `NotificationExternalDispatchOutboxService` — resolve 실패 시 provider 전 `FAILED_PERMANENT` |

**OpenAPI 후속(BE):**  
`/api/admin/notification-send-batches/template-variables` 에 query + `CatalogResponse` / `CatalogVariableItem` 스키마를 채우고 `openapi/backend.frontend-handoff.json` 재생성해 FE Orval이 따라가게 할 것. 실패 코드 example도 components/examples에 넣는 것을 권장.

---

## FE 쪽 한 줄 요약

- **삽입 가드** = BE `enabled` (프로그램·유형 맥락)  
- **발송 실패** = 값이 없을 때 BE fail-closed + `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키`  
- **OpenAPI** = stub이면 **갱신 필요**(이 문서가 임시 SSOT) → Orval 재생성  
- **알림톡** = NHN 작성, CMS 본문 편집 없음 / resolve·실패 계약은 메일·문자와 동일
