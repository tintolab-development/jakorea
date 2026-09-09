# FE 전달용 상세 프롬프트 — 알림 template-variables `enabled` SSOT · enrich · 발송 실패 2026-09-09

> **이 문서가 FE Cursor/에이전트에 넘길 SSOT입니다.**  
> BE(JABACK) 2026-09-09 handoff. FE 구현·검증 기준.
>
> 관련 보조 문서:
> - BE용: [`notification-template-variables-enabled-backend-cursor-prompt.md`](./notification-template-variables-enabled-backend-cursor-prompt.md)
> - OpenAPI/QA 잔여: [`notification-template-variables-openapi-qa-remaining.md`](./notification-template-variables-openapi-qa-remaining.md)

| 메타 | 값 |
|------|-----|
| BE 레포 | `JABACK` (`com.jakorea.cms`) |
| 대상 화면 | CMS Admin 알림 **메일·문자** 발송(템플릿 변수 패널) + 발송 실패 toast/이력. 알림톡은 본문 편집 없음·발송 시 동일 fail-closed |
| 로컬 QA 픽스처 | `programId=164003`, `actorId=1799401` (MEMBER 이건희) |
| Notion | [자동입력(변수값) 리스트](https://app.notion.com/p/38af3e2a77d080598856dc19c161b2cf), [사용 가능 항목](https://app.notion.com/p/341f3e2a77d080eb8b8dfd2f857baec7), [알림 발송 케이스](https://app.notion.com/p/37df3e2a77d08056afccf8c3445e24fc) |

---

## OpenAPI / Orval (전달 전 요약) — **갱신 필요**

| 항목 | 필요? | 상세 |
|------|-------|------|
| 신규 path | ❌ | `GET /api/admin/notification-send-batches/template-variables` 기존 |
| **OpenAPI 스키마 보강** | ✅ **BE handoff 후 필수에 가깝음** | query/response schema 보강 후 Orval 재생성 권장 |
| Orval 재생성 | ✅ **권장** | CatalogVariableItem·CatalogResponse·query params |
| FE 필수 작업 | ✅ | `enabled` 재계산 금지·패널 비활성·실패 문구 키 표시 |
| invent-ban | ✅ | path·필드·enum 발명 금지 |

### 계약 요약

`GET /api/admin/notification-send-batches/template-variables`

**Query:** `programId?`, `participantType?` (PARTICIPANT|INSTRUCTOR|VOLUNTEER), `memberType?` (GENERAL|SCHOOL_TEACHER|INSTRUCTOR|TEACHER_AND_INSTRUCTOR|ADMIN), `keyword?`, `category?`

**CatalogVariableItem:** `key`, `token`, `description`, `requiresProgram`, **`enabled`** (SSOT), `programGroups`, `recruitmentTypes`, `participantTypes`, `memberTypes`

**발송 실패:** `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}` / 복수 `{키1},{키2}`

---

## FE 구현 매핑 (apps/cms)

| 요구 | 구현 |
|------|------|
| 쿼리 빌드 | `model/shared/template-variables-query.ts` → `buildNotificationTemplateVariablesQuery` |
| enabled 가드 | `model/shared/catalog-variable-disabled.ts` + `VariablesPanel` |
| 실패 문구 | `model/shared/format-notification-failed-reason.ts` + delivery adapters + `get-notifications-api-error` |
| 메일/문자 발송 | `ui/mail-send/fullpage-modal.tsx`, `ui/sms-send/fullpage-modal.tsx` |
| 변수 원자 편집 | `ui/sms-template/variable-text-field.tsx` + mail TipTap `MailVariable` atom |

### Done 기준 체크

- [x] FE는 enabled를 재계산하지 않고 패널·삽입만 가드
- [x] 데이터 부재 발송 실패는 키 포함 사용자 문구 (복수 키 `, ` 구분)
- [x] 메일·문자 UX 동일 enabled 가드
- [x] 발송 진입 대상 프로그램 **기본=미선택** · 지정 해제 라벨 **「미선택」**
- [x] 발송 화면에서 `enabled=true` 변수 **추가(삽입) 가능** (등록=전체 허용 유지)
- [x] OpenAPI description/enum 패치 + Orval 절차 문서화 (`notification-template-variables-openapi-qa-remaining.md`)
- [ ] 로컬 QA 픽스처 `164003` / `1799401` 수동 검증 (체크리스트 §3)
- [ ] BE `CreateRequest.programId` optional (`notification-send-program-optional-backend-cursor-prompt.md`)

### 대상 프로그램 · 변수 (발송)

| 규칙 | 내용 |
|------|------|
| 진입 기본 | 메일·문자·알림톡 발송 → 대상 프로그램 **미선택** · 템플릿 선택 비활성 |
| 지정 해제 | 필드 **「미선택」** · create 시 `programId` 생략 |
| 템플릿 등록 | 변수 **전부** 선택·삽입 가능 (`enabled` 무시) |
| 발송 변수 | 프로그램 맥락 `enabled=true` → **추가 가능** / `false` → 차단 |

---

## 복붙용 원문 (BE 전달본)

원본 전문은 BE handoff 채팅/문서에 있다. 핵심 계약은 위 표와 구현 매핑을 따른다.

### 채널별

- **EMAIL/SMS:** CMS `#{키}` 삽입 + enabled 패널 + BE enrich/fail-closed
- **ALIMTALK:** CMS 본문 편집 없음. 발송 시 동일 fail-closed·실패 문구

### enabled 의미

`enabled` = 삽입/사용 허용 여부. **값 존재 여부와 무관.**  
`enabled=true` + 원천 데이터 없음 → BE 발송 실패 (FE 사전 차단 의무 없음).

### 변수 패널

- `enabled=false` 항목 **숨기지 않음** (회색·삽입 차단)
- toast: `현재 프로그램/참여 유형에서는 사용할 수 없는 변수입니다.`
- 삽입 시 `token`(`#{…}`) 사용

### 실패 UX

`NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키1,키2`  
→ `템플릿 필수 변수가 없습니다: 키1, 키2`
