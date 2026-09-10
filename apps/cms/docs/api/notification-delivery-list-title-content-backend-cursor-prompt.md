# Cursor prompt — 발송조회 목록에 제목·본문 요약 필드 (ALIMTALK / EMAIL / SMS)

> 작성: 2026-09-10 · FE(CMS) 실측  
> 대상: JA Korea CMS Java Backend (`NotificationDelivery*` list DTO / OpenAPI)  
> FE: `apps/cms` 알림톡·메일·문자 **발송 조회 목록**  
> 관련: 상세 preview(`GET …/notification-deliveries/{id}`)는 이미 `renderedTitle`/`renderedContent`/`titleTemplate`/`contentTemplate` 제공

아래 **「프롬프트 (복사용)」** 코드펜스 안 전체를 백엔드 Cursor/담당자에게 그대로 전달하면 된다.

---

## FE 실측 요약 (목록이 비는 이유)

공통: `GET /api/admin/notification-deliveries` → `NotificationDeliveryResponse`  
목록 SQL은 이미 `d.rendered_preview_json` 을 SELECT 하지만, **DTO/매퍼가 제목·본문 요약을 노출하지 않음**.  
상세만 `preview` 맵으로 제목/본문을 줌.

| 채널 | 목록 UI 컬럼 | FE가 기대하는 소스 | 목록 실측 | 상세 |
|------|-------------|-------------------|-----------|------|
| **EMAIL** | **메일 제목** | `renderedTitle` \|\| `titleTemplate` | **항상 `-`** (preview 없음) | 제목·본문 OK |
| **SMS** | **문자 내용** | `renderedContent` \|\| `contentTemplate` (없으면 subject) | **비거나 템플릿명 fallback만** | 제목·본문 OK |
| **SMS** | (상세용 subject / messageType) | preview | 목록에서 subject·smsMessageType 부재 | OK |
| **ALIMTALK** | **템플릿명** | `templateDisplayName` | **목록 OK** (이름만 필요) | 본문·메타는 preview |

FE 계약 (변경하지 말 것):
- EMAIL 목록 제목에 `templateDisplayName` **위장 금지** (템플릿명 ≠ 메일 제목)
- 목록 N+1로 delivery detail를 돌리지 않음
- invent-ban: path invent 금지. **기존 list DTO에 optional 필드 추가** 또는 preview에서 쓰는 키와 동일 이름 사용

---

## 프롬프트 (복사용)

```text
당신은 JA Korea CMS Java 백엔드(Notifications / deliveries)를 구현·수정한다.
프론트 레포는 없다. Controllers / DTO / Services / OpenAPI / JDBC 매퍼를 찾아 맞춰라.
질문은 계약이 코드·노션과 충돌할 때만 하라.
invent-ban: path·필드명을 임의로 만들지 마라. 기존 NotificationDeliveryResponse에 optional 필드를 추가하거나,
상세 preview에 이미 쓰는 키 이름(renderedTitle, renderedContent, titleTemplate, contentTemplate, smsMessageType)을 재사용한다.

════════════════════════════════════════════════════════════════
A. 배경 / 증상 (FE 2026-09-10 실측)
════════════════════════════════════════════════════════════════
CMS Admin 발송조회 목록:

1) EMAIL「메일 발송 조회」
   - 컬럼「메일 제목」이 성공/실패 모두 `-`
   - 상세 모달에서는 preview로 제목이 보임
   - 원인: list DTO에 제목 필드 없음. FE는 templateDisplayName을 제목으로 쓰지 않음(위장 금지)

2) SMS「문자 발송 조회」
   - 컬럼「문자 내용」이 비거나 템플릿명만 짧게 나옴
   - 상세에서는 preview.renderedContent / contentTemplate 로 본문 표시
   - 목록에서 LMS 제목·SMS/LMS/MMS 구분도 preview 의존 → 목록만으로는 부정확

3) ALIMTALK「알림톡 발송 조회」
   - 목록 컬럼은「템플릿명」= templateDisplayName → 현재 OK
   - 본문 전문은 상세 phone preview만 필요 (목록에 본문 컬럼 없음)
   - 다만 list에 rendered_preview_json을 이미 읽으면 요약 필드 일관성 차원에서 optional 노출은 허용

목록 SQL(참고): listNotificationDeliveries 는 이미
  d.rendered_preview_json
을 SELECT 한다. 매퍼/DTO가 파싱·노출하지 않을 뿐이다.

════════════════════════════════════════════════════════════════
B. 목표
════════════════════════════════════════════════════════════════
GET /api/admin/notification-deliveries (및 동일 DTO를 쓰는 채널 필터 목록) 응답
NotificationDeliveryResponse 에 **목록용 요약 필드**를 optional로 추가해
FE가 N+1 없이 메일 제목·문자 내용·(필요 시) LMS 제목·메시지 유형을 표시하게 한다.

【In scope】
1) NotificationDeliveryResponse (+ OpenAPI) optional 필드 추가
2) list 매퍼에서 rendered_preview_json / title·content 스냅샷으로 채움
3) EMAIL·SMS·ALIMTALK 동일 DTO — 채널별 null 허용
4) 상세 GET …/{deliveryId} preview 계약은 유지(깨지 말 것)
5) OpenAPI 갱신 후 FE Orval 가능하도록 스키마 반영

【Out of scope】
- 신규 path invent
- 목록에서 전체 HTML 본문 대량 전송(요약/짧은 plain 권장)
- FE가 templateDisplayName을 EMAIL 제목으로 쓰게 강제
- 알림톡 목록에 본문 컬럼 신설(제품 요구 없음) — 필드 optional이면 OK

════════════════════════════════════════════════════════════════
C. 제안 필드 (상세 preview 키와 정렬 — invent 최소화)
════════════════════════════════════════════════════════════════
NotificationDeliveryResponse 에 추가 (모두 optional / nullable):

1) renderedTitle?: string
   - 의미: 치환된 제목(또는 발송 시점 제목 스냅샷)
   - EMAIL 목록「메일 제목」SSOT
   - SMS LMS/MMS 제목(있으면)
   - 우선순위(상세와 동일): preview.renderedTitle → titleTemplate → (없으면 null)
   - templateDisplayName 과 다를 수 있음 (이름 ≠ 제목)

2) renderedContentPreview?: string
   - 의미: 목록용 본문 요약 (plain, 권장 80~200자 truncate, 공백 정규화)
   - SMS 목록「문자 내용」SSOT
   - 우선순위: renderedContent → contentTemplate → null
   - HTML 메일은 태그 제거한 plain 요약 권장 (또는 원문 앞부분)
   - ALIMTALK는 null 허용(목록 미사용)

3) titleTemplate?: string  (optional)
   - 치환 전 제목 스냅샷이 있으면 노출. FE fallback: renderedTitle || titleTemplate

4) contentTemplate?: string  (optional, 목록에서는 비권장 대용량)
   - 가능하면 renderedContentPreview 만으로 충분. 전문은 상세 preview 유지.

5) smsMessageType?: string  (optional)
   - SMS|LMS|MMS. SMS 목록 메시지 유형 표시·필터용
   - providerChannelType 만으로 불충분할 때 preview/스냅샷에서

채움 규칙:
- rendered_preview_json 파싱 결과가 있으면 그 값을 1순위로 사용 (발송 시점 스냅샷·치환본)
- 없으면 template.title_template / content_template 폴백 (등록본 — 스냅샷 없을 때)
- fail-closed로 치환 전 실패해도 titleTemplate/contentTemplate 원문이 있으면 목록에 표시
  (상세와 동일: preview에 #{키} 잔존 가능)

════════════════════════════════════════════════════════════════
D. 필터 (가능하면 같은 PR)
════════════════════════════════════════════════════════════════
FE 필터 필드:
- EMAIL: 메일 제목 (subject)
- SMS: 문자 내용 (content)
- ALIMTALK: 템플릿명 (templateName) — 기존 templateDisplayName/keyword 축이면 유지

list query params에 다음을 지원하거나, 기존 keyword 확장:
- title / subject / renderedTitle 검색 (EMAIL)
- content / renderedContentPreview 검색 (SMS)
구현: rendered_preview_json JSON path 또는 스냅샷 컬럼 ILIKE.
없으면 FE 필터는 서버 미지원으로 남음 — OpenAPI description에 명시.

════════════════════════════════════════════════════════════════
E. OpenAPI / FE 연동
════════════════════════════════════════════════════════════════
- components.schemas.NotificationDeliveryResponse 에 위 optional 필드 + description
- required 배열에 넣지 말 것
- springdoc 반영 후 FE:
  pnpm --filter cms fetch:openapi
  pnpm --filter cms generate:api:notifications

════════════════════════════════════════════════════════════════
F. 수락 기준 (QA)
════════════════════════════════════════════════════════════════
[ ] EMAIL 목록: 발송 성공 건의「메일 제목」이 상세 제목과 동일(또는 titleTemplate)
[ ] EMAIL 목록: 변수 누락 실패 건도 titleTemplate/원문 제목이 `-`가 아님
[ ] EMAIL: templateDisplayName(템플릿명)과 renderedTitle(메일 제목)이 다를 수 있음 — 둘 다 노출
[ ] SMS 목록:「문자 내용」이 발송 본문 요약(변수 치환본 또는 원문)으로 표시
[ ] SMS LMS: renderedTitle 있으면 상세 제목과 정합
[ ] SMS: smsMessageType 이 list에 있으면 FE가 SMS/LMS/MMS 구분 가능
[ ] ALIMTALK 목록: templateDisplayName 기존 동작 회귀 없음
[ ] 상세 GET preview 계약 회귀 없음
[ ] list 응답 크기: 본문 전문 dump 없이 preview truncate
[ ] OpenAPI에 필드 description 포함

════════════════════════════════════════════════════════════════
G. Do / Don't
════════════════════════════════════════════════════════════════
DO: list SQL에 이미 있는 rendered_preview_json 을 파싱해 DTO에 올려라.
DO: 상세 preview 키 이름과 정렬 (renderedTitle, contentTemplate…).
DO: EMAIL 제목 ≠ templateDisplayName 구분 유지.

DON'T: 신규 delivery path invent.
DON'T: FE N+1 detail 호출을 전제로 한 설계.
DON'T: 목록에서 templateDisplayName만 주고 EMAIL 제목으로 쓰라고 하기.
DON'T: 알림톡 본문 override / titleTemplate create override 와 혼동 (별건).

════════════════════════════════════════════════════════════════
H. 구현 힌트 (BE 코드 위치)
════════════════════════════════════════════════════════════════
- list: NotificationService.listNotificationDeliveries (SELECT … d.rendered_preview_json …)
- map: mapDelivery / mapDeliveryDetail → NotificationAdminResponses.NotificationDeliveryResponse
- detail preview enrich: enrichEmailDeliveryPreview / rendered_preview_json 파싱부
- OpenAPI: NotificationDeliveryResponse schema
```
