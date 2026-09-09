# 알림 template-variables — OpenAPI/Orval · QA 잔여 작업

> 작성: 2026-09-09 · 갱신: BE handoff OpenAPI 반영 후  
> 대상: CMS Admin 메일·문자 변수 패널 / 발송 실패 UX  
> SSOT: [`CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md`](./CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md)  
> BE handoff: [`CMS_FE_BE_HANDOFF_TEMPLATE_VARIABLES_OPENAPI_2026-09-09.md`](./CMS_FE_BE_HANDOFF_TEMPLATE_VARIABLES_OPENAPI_2026-09-09.md)

---

## 1. 상태 요약

| 항목 | 상태 | FE에서 할 일 |
|------|------|----------------|
| UX: `enabled` 가드·실패 키 문구 | ✅ 코드 반영 | 회귀만 |
| UX: 발송 진입 **대상 프로그램 기본=미선택** | ✅ | 메일·문자·알림톡 |
| UX: 지정 해제 라벨 **「미선택」** (HTTP는 programId 생략) | ✅ | BE optional 대기 |
| UX: 발송에서 `enabled=true` 변수 **추가(삽입) 가능** | ✅ | 발송만 `enabled` 가드 |
| UX: 템플릿 등록/수정 시 변수 **전부** 풀림 (`enabled` 무시) | ✅ | `respectCatalogEnabled={false}` |
| OpenAPI path/스키마 (BE) | ✅ `NotificationTemplateVariableCatalogResponse` 등 | merge 스크립트로 FE `backend.openapi.json` 병합 |
| Orval 재생성 | ✅ `listNotificationTemplateVariables` | typecheck 통과 유지 |
| Envelope | ✅ catalog **직접** 반환 | `unwrapApiBody` passthrough · curl은 `.categories` |
| CreateRequest `programId` optional | ⏳ BE | [`notification-send-program-optional-backend-cursor-prompt.md`](./notification-send-program-optional-backend-cursor-prompt.md) |
| QA 픽스처 수동 검증 | ⏳ 로컬 BE+시드 | 본 문서 §3 체크리스트 |
| 배치 상세 `recipients[].failureCode` UI | ⏳ 전용 화면 없음 | 발송조회 `failedReason`이 동일 문자열·포맷 사용 |

### 제품 규칙 요약 (발송)

1. **메일·문자 발송 진입** → 대상 프로그램 **미선택** (템플릿 선택 비활성).
2. **프로그램 지정 해제** → 필드 문구 **「미선택」**, create 시 `programId` 생략.
3. **템플릿 등록/수정** → 변수 **전부** 선택·삽입 가능 (`enabled` 무시).
4. **발송** → 해당 프로그램(맥락)에서 **사용 가능(`enabled=true`) 변수는 본문/제목에 추가 가능**. `enabled=false`만 차단.
5. **프로그램 지정** 시 → 사용 불가 변수 포함 템플릿은 「사용하기」 비활성.

---

## 2. OpenAPI → Orval (FE 절차)

### 2.1 전제

- invent-ban: **path·필드명 추가 금지**. description / enum / example 만.
- BE 스키마명 (2026-09-09):
  - Response: `NotificationTemplateVariableCatalogResponse`
  - Item: `NotificationCatalogVariableItem` (`enabled` = 삽입 SSOT)
  - Category: `NotificationCatalogCategory`
  - `operationId`: `listNotificationTemplateVariables`
- **전체** `backend.openapi.json` 을 BE 소용량 파일로 덮어쓰지 말 것. template-variables path·스키마만 merge.

### 2.2 명령

```bash
# 1) (선택) 로컬 BE springdoc — 전체 스펙 갱신
pnpm --filter cms fetch:openapi

# 2) (권장) JABACK handoff 스펙에서 template-variables만 병합
#    default: ../../../../backend/JABACK/openapi/backend.openapi.json
#    또는 BE_OPENAPI=/path/to/backend.openapi.json
pnpm --filter cms generate:api:notifications

# 3) 타입 확인
pnpm --filter cms typecheck
```

`generate:api:notifications` 내부:

1. `merge:openapi:notification-template-variables` — BE path+Notification* 스키마 병합 (없으면 skip)
2. `patch:openapi:notification-template-variables` — description/enum 보강(이미 BE와 같으면 no-op에 가깝게)
3. `filter:openapi:notifications`
4. `orval --project notifications`

### 2.3 Orval 심볼 (FE 코드)

| 용도 | 타입 / 메서드 |
|------|----------------|
| query params | `ListNotificationTemplateVariablesParams` |
| response | `NotificationTemplateVariableCatalogResponse` |
| item | `NotificationCatalogVariableItem` |
| client | `listNotificationTemplateVariables` (`fetchTemplateVariablesRemote`) |

### 2.4 실패 코드

- `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}`
- 복수: `…:{키1},{키2}`
- 배치 `recipients[].failureCode` / 발송조회 `failedReason` 동일 문자열 → `formatNotificationFailedReason`

### 2.5 PR에 포함할 파일

- `scripts/merge-openapi-notification-template-variables-from-be.mjs`
- `scripts/patch-openapi-notification-template-variables.mjs`
- `openapi/backend.openapi.json` (merge·patch diff)
- `openapi/notifications.openapi.json`
- `src/shared/api/generated/notifications/**`
- client/adapters 타입 rename

---

## 3. QA 픽스처 수동 검증

### 3.1 시드 (BE local)

| 키 | 값 |
|----|-----|
| `programId` | `164003` |
| `actorId` (MEMBER) | `1799401` |
| 이름 | 이건희 |
| 스케줄 | `2026-10-15 10:00~12:00` → `교육 진행 수업 시간` ≈ `10:00 ~ 12:00` |
| 배정 기관 | 경기고등학교 (INSTRUCTOR/VOLUNTEER 맥락) |

FE 상수: `notification-template-variables-qa-fixture.ts`

### 3.2 사전 조건

- [ ] CMS `.env`: `VITE_API_SERVER` → 로컬 BE
- [ ] 관리자 JWT · 시드 `164003` / `1799401`
- [ ] 활성 SMS/EMAIL 템플릿 + senderProfile
- [ ] 예약은 **미래** `scheduledAt` · `Idempotency-Key` 필수

### 3.3 API 스모크 (선택)

> Controller는 catalog를 **직접** 반환. `.data.categories` 가 아니라 `.categories`.

```bash
curl -sS -H "Authorization: Bearer $TOKEN" \
  "$API/api/admin/notification-send-batches/template-variables?programId=164003&participantType=PARTICIPANT" \
  | jq '.categories[]?.variables[]? | select(.key=="배정 기관명" or .key=="교육 진행 수업 시간") | {key,enabled}'

# 기대: 배정 기관명 enabled=false, 교육 진행 수업 시간 enabled=true

curl -sS -H "Authorization: Bearer $TOKEN" \
  "$API/api/admin/notification-send-batches/template-variables?programId=164003&participantType=INSTRUCTOR" \
  | jq '.categories[]?.variables[]? | select(.key=="배정 기관명") | {key,enabled}'

# 기대: enabled=true
```

공통 `ApiResponse` 래퍼가 있는 환경이면 `.data.categories` 로 조정.

### 3.4 CMS UI 체크리스트

#### A. 변수 패널 `enabled` · 대상 프로그램

- [ ] 메일/문자 발송 **진입 시** 대상 프로그램 **미선택** · 템플릿 선택 **비활성**
- [ ] 「프로그램 지정 해제」 후 필드 문구 **「미선택」** (「전체」 아님)
- [ ] 프로그램 `164003` + 참여유형 참여자  
  → `배정 기관명`·강사 전용 변수 **회색·삽입 불가**  
  → toast: `현재 프로그램/참여 유형에서는 사용할 수 없는 변수입니다.`
- [ ] 동일 화면에서 `교육 진행 수업 시간` **활성·삽입(추가) 가능**
- [ ] 템플릿 선택 후에도 `enabled=true` 변수는 **추가 삽입 가능**
- [ ] 참여유형 강사로 바꾸면 `배정 기관명` 활성 (재조회)
- [ ] 문자 발송 화면에서도 동일
- [ ] `enabled=false` 항목이 목록에서 **사라지지 않음**
- [ ] 템플릿 **등록** 화면에서는 변수 전체 선택 가능 (현행)
#### B. 발송 성공 / 실패

- [ ] `#{교육 진행 수업 시간}` + MEMBER `1799401` → 성공
- [ ] 원천 데이터 제거 후 → `템플릿 필수 변수가 없습니다: 교육 진행 수업 시간`
- [ ] 복수 키 · 발송조회 `failedReason` 포맷
- [ ] Network: NHN body에 빈 `#{…}` 없음

#### C. 알림톡 · 회귀

- [ ] 알림톡 실패 동일 코드 표시
- [ ] 변수 토큰 atomic 삭제 · 수신자 `typeLabel` 유지

### 3.5 결과 기록

| 일자 | 환경 | 결과 | 메모 |
|------|------|------|------|
| | local / staging | pass / fail | |

---

## 4. Done 기준

- [x] BE OpenAPI merge + Orval (`NotificationTemplateVariableCatalogResponse` / `listNotificationTemplateVariables`)
- [x] FE client·adapters 타입 rename · bare catalog unwrap
- [x] QA curl `.categories` 경로 문서화
- [x] FE 패치·merge 스크립트 + `generate:api:notifications`
- [ ] §3 UI 체크리스트 통과 (시드 있는 BE 필요)
- [ ] (선택) 배치 상세 recipients `failureCode` 전용 UI — 현재는 발송조회로 충족
