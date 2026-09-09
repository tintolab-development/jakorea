# BE → FE handoff — template-variables OpenAPI (FE residual §2.4) 2026-09-09

> FE 잔여 문서 **「알림 template-variables — OpenAPI/Orval · QA 잔여 작업」§2.4** 에 대한 BE 응답입니다.  
> SSOT UX 프롬프트: [`CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md`](./CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md)

---

## §2.4 요청 → BE 상태

| FE 요청 | BE 상태 | 위치 |
|---------|---------|------|
| `/v3/api-docs` 에 description·enum 반영 | ✅ | `NotificationSendBatchController#templateVariables` `@Parameter` / `@Operation` + `CatalogVariableItem` `@Schema` |
| error example `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING` | ✅ (committed OpenAPI 400 example + POST create description) | `openapi/backend.openapi.json` |
| handoff JSON 전달 | ✅ | `openapi/backend.openapi.json` (전체). 라우트 inventory는 `openapi/backend.frontend-handoff.json` (path만, 스키마 없음) |

**FE 조치**

```bash
# 로컬 BE bootRun 재시작 후
pnpm --filter cms fetch:openapi          # /v3/api-docs 또는 backend.openapi.json 복사본
pnpm --filter cms generate:api:notifications
pnpm --filter cms typecheck
```

패치 스크립트(`patch:openapi:notification-template-variables`)는 invent 없이 description/enum만 보강하므로, fetch가 BE 보강본을 가져오면 **diff 축소 또는 no-op**이 정상입니다.

---

## OpenAPI에 들어간 계약 (invent 없음)

### GET `/api/admin/notification-send-batches/template-variables`

- `operationId`: `listNotificationTemplateVariables`
- Query enum: `participantType` / `memberType` / `category` (FE §2.3과 동일)
- Response schema:
  - `NotificationTemplateVariableCatalogResponse`
  - `NotificationCatalogCategory`
  - `NotificationCatalogVariableItem` (`enabled` description = 삽입 허용 SSOT)
- 200 example: PARTICIPANT 맥락에서 `교육 진행 수업 시간` enabled=true, `배정 기관명` enabled=false

### 실패 코드

- `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}`
- 복수: `…:{키1},{키2}`
- OpenAPI 400 example(참고) + 배치 POST description에 명시
- 런타임: outbox `last_error_*` → 배치 `recipients[].failureCode` / delivery `failedReason`

### 응답 envelope

Controller는 **`CatalogResponse`를 직접 반환**합니다 (`ApiResponse` 래퍼 없음).  
FE curl의 `.data.categories` 는 환경에 따라 맞지 않을 수 있음 → `.categories` 또는 실제 envelope에 맞게 조정.

---

## QA 픽스처 (변경 없음)

| 키 | 값 |
|----|-----|
| programId | 164003 |
| actorId | 1799401 |
| 교육 진행 수업 시간 | ≈ `10:00 ~ 12:00` (스케줄 있을 때) |
| 배정 기관명 | 경기고등학교 (INSTRUCTOR/VOLUNTEER) |

bootRun **재시작** 후에야 enrich·OpenAPI annotation이 런타임에 반영됩니다.

---

## Done (BE)

- [x] springdoc annotations
- [x] `openapi/backend.openapi.json` path·components 보강
- [x] 실패 코드 description/example
- [ ] FE: fetch → Orval → §3 UI 체크리스트 (시드 BE)
