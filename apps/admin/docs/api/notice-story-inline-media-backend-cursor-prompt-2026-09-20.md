# Cursor prompt — 공지·임팩트 스토리 본문 인라인 이미지·YouTube

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 맞춰라.  
질문이 필요하면 sanitize host allow-list·purpose enum이 기존 스키마와 충돌할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/notice-story-inline-media-backend-cursor-prompt-2026-09-20.md`

관련(구 갭, 2026-08-13): `apps/admin/docs/api/notice-inline-media-backend-gap.md`

---

## Goal

Admin 에디터 「삽입 → 이미지 (파일)」은 이미 **에셋 업로드 후 `publicUrl`을 `<img src>`에 넣는다.**  
data URL은 더 이상 보내지 않는다. 그래도 저장하면 이미지가 사라지거나 본문이 비는 이유는 **BE HTML sanitize가 `img`/`iframe`을 제거**하기 때문이다.

완료 조건:

1. 공지·임팩트 스토리 create/update `body`에 `https`(및 로컬이면 공개 에셋 `http`) `<img src>` 가 있으면 **200**. GET detail `body`에 그 `<img` 가 **그대로** 있다.
2. YouTube embed(`youtube-nocookie.com` / `youtube.com`) `<iframe>` 이 create/update 후 GET detail에 **남는다.**
3. `src="data:` 이미지는 **거부** (4xx + 필드 메시지). `body` `@Size(max = 100000)` 은 유지.
4. 인라인 이미지 에셋은 **하단 첨부 `attachmentAssetId`를 덮어쓰지 않는다.**
5. `GET /api/admin/assets/{id}` 의 `publicUrl` 은 브라우저가 여는 주소다. **`localhost:9000` MinIO 직접 주소를 본문 `img src`로 쓰지 마라.**
6. 공개 GET 본문도 동일하게 `<img` / YouTube iframe 을 유지한다.
7. 기존 XSS 테스트의 “sanitize 결과에 img/iframe 없음” assert 를 **host allow-list 테스트로 교체**한다.
8. 작업 후 **프론트용 Cursor 프롬프트**를 이 문서 템플릿으로 회신한다. (신규 purpose / publicUrl 스킴이 바뀌면 반드시 적는다.)

---

## Out of scope / 금지

- Admin / Platform FE 수정 (프론트 작업 아님)
- `body` maxLength를 data URL 허용하려고 올리는 것
- `script` / `style` / `on*` / `javascript:` 허용
- CMS 공지 API 변경
- 하단 첨부 1건 계약을 **인라인 이미지 때문에** 1건으로 줄이거나, 인라인 업로드가 첨부를 교체하는 것
- prod Flyway에 운영 바이너리 INSERT

---

## 현재 FE 계약 (이미 배포됨, 맞출 것)

Admin JWT. 화면: `/ja-korea/notices` · `/impact/stories` 등록·수정.

| 동작 | FE | 요청 `body` |
|------|----|-------------|
| 이미지 (파일) | `POST /api/admin/assets/upload-requests` → PUT 바이너리 → confirm → `GET /api/admin/assets/{id}` | `<img src="{publicUrl}" alt="{filename}">` |
| 이미지 (URL) | 사용자 입력 URL | `<img src="https://…">` |
| YouTube | Tiptap YouTube | 보통 `<iframe src="https://www.youtube-nocookie.com/embed/{id}">` width/height |
| 하단 첨부 | `attachmentAssetId` | 본문과 **별개**. 인라인 업로드 asset id 를 여기에 넣지 **않는다** |

지금 FE가 쓰는 purpose (OpenAPI enum에 INLINE이 없어서 재사용):

- 공지 인라인: `JA_NOTICE_ATTACHMENT`
- 스토리 인라인: `IMPACT_STORY_ATTACHMENT`

로컬에서 확인된 실제 `publicUrl` (문제):

```text
http://localhost:9000/homepage-public/homepage/assets/2026/09/20/impact_story_attachment/{uuid}.png
```

PUT 업로드는 200이지만, 이 호스트를 sanitize가 막거나 공개 페이지가 못 열면 **저장 후 이미지가 없다.**

예시 create/update body:

```json
{
  "published": true,
  "pinned": false,
  "publishAt": "2026-01-15T12:00:00.000Z",
  "title": "…",
  "body": "<h2>제목</h2><p>본문</p><img src=\"https://cdn.example/homepage/assets/…/photo.png\" alt=\"photo.png\">",
  "attachmentAssetId": 10,
  "version": 0
}
```

스토리는 위와 같고 `categoryId` 가 추가된다.

Admin:

- `POST /api/admin/ja-korea/notices`
- `PUT /api/admin/ja-korea/notices/{id}`
- `POST /api/admin/impact-story/stories`
- `PUT /api/admin/impact-story/stories/{id}`

공개 (인증 없음):

- 공지 상세 (기존 public notice path)
- `GET /api/public/impact-story/stories/{id}` 의 `body`

---

## 1. Sanitize allow-list (필수)

파일:

- `JaNoticeContentPolicy`
- `ImpactStoryContentPolicy`

기존 허용 유지: `p`, `br`, `strong`/`b`, `em`/`i`, `u`, `s`/`strike`, `ul`/`ol`/`li`, `blockquote`, `h2`–`h4`, `a`

추가 허용:

| 요소 | 속성 | src 규칙 |
|------|------|----------|
| `img` | `src`, `alt`, `title`, `width`, `height` | 아래 host allow-list. **`data:` 금지** |
| `iframe` | `src`, `width`, `height`, `title`, `allow`, `allowfullscreen`, `frameborder` | host: `www.youtube.com`, `www.youtube-nocookie.com` 의 `/embed/` 만 |

XSS 유지:

- `script`, `style`, `on*`, `javascript:` 금지
- `class` / `id` / `data-*` / wrapper `div` 는 제거해도 된다. **그 안의 `img`/`iframe`은 남겨라.**
- TipTap이 `class="rich-text-content__image"` 를 붙인다. class를 깎아도 `src`/`alt` 는 남겨라.

`img src` host allow-list (설정값으로 두고 하드코딩 금지 권장):

1. 운영 공개 에셋 호스트 (CloudFront / 공개 API 게이트웨이 — **히어로·첨부 `publicUrl`과 동일 스킴**)
2. 외부 https 이미지 (이미지 URL 삽입 메뉴). 필요하면 https만.
3. **로컬/dev** 에서 `getAsset.publicUrl` 이 실제로 내리는 호스트. 지금은 `:9000` 이면 **그걸 허용하거나, 더 좋게는 publicUrl 자체를 `:9000`이 아니게 바꿔라.**

금지:

- `src="data:…"`
- 임의 http(s) iframe (YouTube embed 외)

sanitize 후 본문이 비면 기존처럼 4xx. 메시지는 `Notice body is required after HTML sanitization.` 같은 **도메인 메시지**를 유지하되, img만 넣었는데 비면 allow-list가 잘못된 것이다.

---

## 2. `publicUrl` (필수)

`confirmUpload` / `GET /api/admin/assets/{id}` / 공개 본문에 박히는 `img src` 는 **같은 브라우저 가능 URL**이어야 한다.

| 하면 안 됨 | 해야 함 |
|------------|---------|
| `http://localhost:9000/homepage-public/…` 를 본문·공개 응답에 넣기 | 히어로 PNG가 **프론트(3001/5173)에서 200** 나는 그 publicUrl 규칙을 재사용 |
| 시그니드 만료 URL을 `body`에 영속 | 만료되지 않는 공개 객체 URL 또는 공개 프록시 |

로컬에서 MinIO PUT은 시그니드로 유지해도 된다. **영속 `publicUrl`만** 게이트웨이/공개 버킷 URL로 내려라.

`img src` 를 curl 하면 HTTP 200 + `image/*`.

---

## 3. 에셋 purpose

**최소 (지금 FE가 동작하려면):**

- `JA_NOTICE_ATTACHMENT` / `IMPACT_STORY_ATTACHMENT` 로 **첨부 슬롯과 무관한** 추가 에셋을 여러 건 prepare/confirm 할 수 있다.
- 공지 첨부 1건 한도는 **`attachmentAssetId`에 연결된 것**에만 적용. 인라인용 추가 에셋은 그 1건을 차지하지 않는다.
- 스토리 기존 첨부가 있어도 인라인 prepare가 409/덮어쓰기가 나면 안 된다.

**권장 (회신에 명시):**

```
JA_NOTICE_INLINE_IMAGE
IMPACT_STORY_INLINE_IMAGE
```

추가하면 OpenAPI purpose enum에 넣고 프론트 프롬프트에 적어라. FE가 갈아탄다.  
추가 못 하면 기존 purpose 재사용을 **허용한다고 회신**하라.

허용 MIME: `image/jpeg`, `image/png`, `image/gif`, `image/webp`. 파일 상한은 기존 첨부와 맞추거나 10MB.

---

## 4. 검증 메시지

`@Valid` 실패를 `"Request validation failed."` 만 주지 마라.

| 상황 | 기대 |
|------|------|
| `body` 길이 > 100000 | field `body`, size 메시지 |
| `data:` img | 4xx, `data:` 이미지 불가 / 에셋 URL 사용 |
| sanitize 후 빈 본문 | 기존 sanitization 메시지 |
| YouTube 아닌 iframe | 제거 또는 4xx (정책 하나를 고르고 테스트) |

---

## 5. 테스트

교체:

- `JaNoticeContentPolicyTest` / `ImpactStoryContentPolicyTest` 의 “결과에 `<img` 없음 / `<iframe` 없음”

추가:

1. `https` 에셋 `<img>` → sanitize 후 `src` 유지
2. `data:image/png;base64,…` → 제거 또는 요청 거부
3. YouTube nocookie embed iframe → 유지
4. `<script>` / `javascript:` → 제거
5. create 공지 + create 스토리 각 1건: img+iframe body → 200 → GET admin detail + GET public detail 에 미디어 유지
6. 첨부가 있는 공지/스토리에 인라인 에셋 추가 → `attachmentAssetId` 불변

---

## 완료 후 프론트에 회신할 것

1. sanitize 허용 태그·속성·host 목록
2. `data:` 거부 방식 (sanitize strip vs 4xx code)
3. purpose: 기존 재사용 vs `*_INLINE_IMAGE` (enum 값)
4. `publicUrl` 예시 1개 (로컬 + 기대 운영 스킴). `:9000` 이면 안 됨
5. OpenAPI 변경 여부
6. 로컬에서 통과한 curl (create → GET detail `body` 일부)

---

**Last updated:** 2026-09-20
