# 메일 관리 FE 연동 완료 — 백엔드 확인/보완 요청

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-08 |
| 대상 | Notifications · EMAIL 채널 (메일 템플릿 / 발송 / 발송조회) |
| 목적 | FE 메일 관리 연동 마무리에 맞춰, BE 계약·시드·allowlist 확인 |
| 우선순위 | **P0** — 아래 체크리스트가 깨지면 FE 실연동이 막힘 |
| FE 코드 | `apps/cms/src/features/notifications/` (mail-template · mail-send · mail-send-history) |

---

## 한 줄 요약

메일 관리는 **알림톡과 동일 Notification API**를 쓰며 `channelType=EMAIL`로 분기합니다.  
FE 연동은 완료했으니, 아래 **계약 확인·시드·응답 필드**를 맞춰 주세요.

---

## 복사해서 BE Cursor에 붙여넣을 프롬프트

```text
[역할]
너는 JA Korea Backend(JABACK) 담당이다. CMS 메일 관리 FE 연동이 끝났으니, EMAIL 채널 Notification API 계약을 확인하고 부족한 부분을 보완한다.

[범위 — 반드시]
- channelType=EMAIL 만. 알림톡(ALIMTALK) 기본 동작을 깨지 말 것.
- 금지/hold: GET /api/admin/logs/mail-sends, /email-* path, 대시보드 메일 위젯.
- 생산(production) 발송 스위치 ON을 가정한 구현/문서 금지. 스테이징·샌드박스 기준.

[FE가 이미 쓰는 API]
1) 템플릿 트리/CRUD
   - GET/POST/PUT/DELETE notification templates (channelType=EMAIL)
   - upsert: emailTemplateLanguage=PLAIN_TEXT
   - senderProfileDisplayName, providerSenderEmailAddress
2) 템플릿 첨부
   - Admin Files: upload-requests → S3 PUT → confirm → CLEAN/AVAILABLE
   - ownerDomain=NOTIFICATION, ownerType=EMAIL_TEMPLATE, ownerId={templateId}, privacyLevel=NORMAL
   - bind/unbind: POST/DELETE …/templates/{id}/attachments  (CMS /files/attachments 미사용)
3) 발신 프로필
   - GET sender-profiles?channelType=EMAIL&useYn=true
   - FE 매칭: senderKey === 발신 메일주소(소문자 비교)
4) 수신자 후보
   - GET recipient-candidates?channelType=EMAIL&programId&keyword&participantType&page&size
5) 발송
   - POST /api/admin/notification-send-batches
   - body: templateId, recipients, senderProfileId, senderKey(메일), scheduledAt(예약 시)
   - Hub scheduledDateTime 금지 → scheduledAt만
6) 발송조회
   - GET deliveries?channelType=EMAIL + 기간 필터
   - FE 기본 기간: 요청일(requestedAt)만. sent/delivered/scheduled는 사용자가 지정할 때만 AND
   - GET delivery detail + preview

[BE 확인/보완 체크리스트 — P0]
A. Files allowlist
   - ownerDomain=NOTIFICATION + ownerType=EMAIL_TEMPLATE 업로드 허용 여부
   - 미허용이면 FE가 템플릿 첨부 업로드에서 400/403 → allowlist에 추가하거나 허용 enum 문서화

B. EMAIL sender profiles
   - channelType=EMAIL 프로필 시드/조회
   - senderKey = 실제 From 메일주소 (예: noreply@…)
   - displayName = 발신자 표시명
   - useYn=true 필터 동작

C. Delivery detail preview (메일 4-2)
   - preview.renderedTitle / preview.renderedContent 우선 (없으면 titleTemplate/contentTemplate)
   - preview.senderDisplay (가능하면 "이름 <email>")
   - preview.attachments[] 각 항목:
     { fileName, fileObjectId, downloadHint, byteSize? }
   - downloadHint 예: /api/admin/files/{fileObjectId}/download
   - FE는 fileObjectId 또는 downloadHint에서 id 파싱 후 GET files/{id}/download resolve → 실다운로드

D. Delivery 타임스탬프 의미 (메일·알림톡 공통)
   - sentAt = 실제 발송 시각 (requestedAt으로 대체하지 말 것)
   - deliveredAt = 수신/배달 시각 (openedAt으로 대체하지 말 것)
   - openedAt = 읽음 여부용만
   - FE 목록/상세: 발송일시=sentAt, 수신일시=deliveredAt, 읽음=openedAt 유무

E. sendStatus / receiptStatus
   - EMAIL도 알림톡과 동일 enum 사용 권장
   - SEND_FAILED / WAITED / UNKNOWN 등 누락 없이 문서화
   - failedReason 문자열 제공 (발송 실패 시)

F. 발송조회 필터
   - requestedFrom/To 기본 동작
   - sentFrom/To, deliveredFrom/To, scheduledFrom/To는 선택 파라미터 (미전달 시 AND 강제 금지)
   - Notion 문구 “4개 기간 디폴트”와 충돌: FE/BE는 **요청일만 디폴트**로 유지. 기획 문구 정리 권장.

G. 배치 발송 EMAIL
   - senderProfileId 없으면 senderKey(메일)로 매칭 가능한지, 아니면 400 코드 명확화
   - Idempotency-Key 지원
   - 예약: scheduledAt(ISO)만 수용

[산출물]
1. 위 A~G 항목별 OK / 수정필요 / 시드필요
2. 수정이 필요하면 OpenAPI diff + 마이그레이션/시드 요약
3. 스테이징에서 FE 스모크 가능한 EMAIL 템플릿 1개 + sender profile 1개 + 첨부 1개 시드 여부

[참고 — FE가 의도적으로 하지 않는 것]
- /api/admin/logs/mail-sends 미사용
- /email-* 전용 path 미사용
- deliveries를 ALIMTALK로 조회해 메일 화면에 넣지 않음 (항상 channelType=EMAIL)
```

---

## FE 구현 요약 (참고)

| 화면 | 상태 |
|------|------|
| 메일 템플릿 2-1~2-3 | remote tree/CRUD + PLAIN_TEXT upsert + Files→attachments bind |
| 메일 발송 3 | send-batches + recipient-candidates + EMAIL senderProfileId 해석 |
| 메일 발송조회 4-1 | deliveries `channelType=EMAIL`, 요청일만 기본 기간, 시안 컬럼 순서 |
| 메일 발송조회 4-2 | detail preview + 첨부 `fileObjectId`/`downloadHint` 실다운로드 |

알림톡 발송조회 4-2도 동일 deliveries 계약을 쓰며, `sentAt`/`deliveredAt`만 시점 컬럼에 매핑한다.
