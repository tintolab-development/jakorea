# 공지·임팩트 스토리 본문 — 에디터 인라인 이미지·YouTube BE 수정 요청

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **목적** | Homepage Admin 리치텍스트 **삽입**(이미지·YouTube) 저장이 BE에서 실패·제거되는 갭을 전달 |
| **FE 화면** | `/ja-korea/notices` 등록·수정 · `/impact/stories` 등록·수정 |
| **기획** | [3-2. 공지사항 등록·수정](https://app.notion.com/p/399f3e2a77d0817a97bed7858b4ce382) (내용 에디터 · 삽입 메뉴) |
| **관련 FE** | `apps/admin/src/shared/rich-text/toolbar/rich-text-toolbar.tsx` (`삽입` → 이미지 URL/파일 · YouTube) |
| **관련 BE** | `JaNoticeContentPolicy` · `ImpactStoryContentPolicy` · `NoticeUpdateRequest` / `NoticeCreateRequest` |

---

## 현상

Admin에서 공지 수정 중 본문에 **이미지 삽입** 후 저장 시:

```http
PUT /api/admin/ja-korea/notices/{id}
```

응답:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed."
}
```

(`GlobalExceptionHandler` — Spring `@Valid` 단계. sanitize 전용 메시지 `"Notice body is required after HTML sanitization."` 와는 다름.)

FE는 삽입 메뉴를 스펙대로 다시 노출 중 (`allowInlineMedia: true`). **저장·영속은 BE 정책 변경 없이는 불가.**

---

## 원인 (2단)

### 1) Bean validation (즉시 실패)

| 제약 | 위치 | 영향 |
|------|------|------|
| `body` `@Size(max = 100000)` | `JaNoticeDtos.NoticeCreateRequest` / `NoticeUpdateRequest` (임팩트 스토리도 유사 한도 확인 부탁) | 에디터 **파일 삽입**은 FE가 `data:image/...;base64,...` 를 `<img src>` 에 넣음 → 본문이 쉽게 10만자 초과 → `"Request validation failed."` |

### 2) HTML sanitize (통과해도 미디어 삭제)

`JaNoticeContentPolicy` / `ImpactStoryContentPolicy` allow-list:

- 허용: `p`, `br`, `strong`/`b`, `em`/`i`, `u`, `s`/`strike`, `ul`/`ol`/`li`, `blockquote`, `h2`–`h4`, `a`
- **미허용: `img`, `iframe`** (및 script/style/class/id/event)

주석 의도: *Images/files are handled through the separately validated attachment asset pipeline.*  
→ **하단 첨부 파일**과 **본문 인라인 이미지**가 구분돼 있으나, 기획·FE 에디터는 본문 삽입을 전제로 함.

테스트 근거: `JaNoticeContentPolicyTest` — sanitize 결과에 `<img` / `<iframe` 없음 assert.

---

## FE 현재 동작 (참고)

| 삽입 | FE 구현 | 요청 body 형태 |
|------|---------|----------------|
| 이미지 (URL) | `insertImageFromUrl` → `<img src="https://...">` | HTML |
| 이미지 (파일) | `insertImageFromFile` → **data URL** (`ImageResize allowBase64`) | HTML (대용량) |
| YouTube | `insertYoutubeFromUrl` → Tiptap YouTube → 보통 `<iframe src="https://www.youtube-nocookie.com/embed/...">` | HTML |
| 하단 첨부 | `attachmentAssetId` (공지 1건) / 스토리 첨부 파이프라인 | asset id — **본문과 별개** |

공지 create/update 예:

```json
{
  "published": true,
  "pinned": true,
  "publishAt": "2026-01-15T12:00:00.000Z",
  "title": "…",
  "body": "<h2>…</h2><p>…</p><img src=\"data:image/png;base64,…\">",
  "attachmentAssetId": 10,
  "version": 0
}
```

---

## BE 요청 사항

### A. Sanitize allow-list 확대 (필수)

공지·임팩트 스토리 공통으로 본문에 다음을 **허용·보존**해 주세요.

| 요소 | 허용 속성 | URL / 프로토콜 |
|------|-----------|----------------|
| `img` | `src`, `alt`, `title`, `width`, `height` (필요 시) | `https` (권장). `http` 허용 여부는 보안 정책에 따름 |
| `iframe` (YouTube embed) | `src`, `width`, `height`, `title`, `allow`, `allowfullscreen`, `frameborder` 등 최소 set | **host allow-list**: `www.youtube.com`, `www.youtube-nocookie.com`, `youtu.be` embed URL만 |

XSS 경계는 유지:

- `script`, `style`, `on*` 이벤트, `javascript:` URL 금지
- 임의 `class`/`id`/`data-*` 는 기존과 같이 제거해도 됨 (FE 툴바가 class에 의존하지 않음)

동일 정책 파일:

- `…/jakorea/JaNoticeContentPolicy.java`
- `…/impact/ImpactStoryContentPolicy.java`

### B. 인라인 이미지 저장 방식 (택1, 권장 명시)

**권장: Asset URL만 허용 (data URL 금지)**

1. FE: 삽입 시 `prepareUpload` → 업로드 → confirm → `publicUrl` 을 `<img src>` 에 사용  
2. BE: `img src` 는 `https` + (가능하면) Homepage CDN/asset host만 허용, **`data:` 거부**  
3. purpose: 신규 `JA_NOTICE_INLINE_IMAGE` / `IMPACT_STORY_INLINE_IMAGE` 또는 기존 attachment purpose 재사용 가능 여부 회신  

이 경우 `@Size(max = 100000)` 유지 가능.

**대안: data URL 허용**

- `body` maxLength를 대폭 상향 (또는 TEXT 한도만 DB) + sanitize가 `data:image/(png\|jpeg\|gif\|webp);base64,…` 허용  
- DB/백업·로그 비용·XSS 표면이 커지므로 **비권장**

### C. YouTube

- sanitize 후 embed URL이 남아 public/detail 응답 `body`에 그대로 노출  
- 공개 페이지에서 iframe 렌더 가능해야 함 (CSP가 있으면 YouTube host 허용 확인)

### D. 검증 메시지

가능하면 `@Valid` 실패 시 field별 메시지를 내려 주세요 (예: `body: size must be between 0 and 100000`).  
지금은 공통 `"Request validation failed."` 만 와 FE 원인 파악이 어렵습니다.

---

## 완료 기준

- [ ] 본문에 `https` 이미지 URL 포함 공지 create/update → 200, GET detail `body`에 `<img` 유지  
- [ ] YouTube 삽입 HTML 포함 create/update → 200, GET detail에 youtube(-nocookie) `iframe`/`src` 유지  
- [ ] `data:` 이미지를 **금지**하는 경우: 명확한 4xx 메시지 (또는 OpenAPI 문서화) → FE는 asset 업로드 삽입으로 맞춤  
- [ ] `data:` 를 **허용**하는 경우: 한도·테스트 케이스 문서화  
- [ ] 임팩트 스토리 동일 정책  
- [ ] 기존 XSS 테스트 갱신 (`img`/`iframe` strip assert 제거·host allow-list 테스트 추가)

---

## FE 후속 (BE 확정 후)

1. 삽입(파일)을 **asset upload → publicUrl** 로 전환 (권장안 A+B)  
2. OpenAPI 재생성 후 mapper/가이드 문구 정리  
3. 공개 상세 `RichTextViewer` 에서 img/iframe 렌더 확인  

**Last updated:** 2026-08-13
