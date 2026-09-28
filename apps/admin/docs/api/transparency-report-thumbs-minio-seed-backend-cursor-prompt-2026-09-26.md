# Cursor prompt — 투명경영 보고서 썸네일 MinIO 시드 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·금지는 이 문서만 사용하라.  
질문이 필요하면 MinIO·asset purpose·기존 업로드 스크립트가 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/transparency-report-thumbs-minio-seed-backend-cursor-prompt-2026-09-26.md`

제목·`createdAt`·운영원칙·수입지출 시드는 **이미 반영된 상태**로 본다.  
관련 문서:

- `apps/admin/docs/api/transparency-platform-seed-backend-cursor-prompt-2026-09-26.md`
- `apps/admin/docs/api/transparency-reports-platform-seed-backend-cursor-prompt-2026-09-26.md`

이번 작업에서 그 SQL의 제목·금액·날짜를 다시 바꾸지 마라. **MinIO 실파일(및 asset READY)만** 맞춘다.

---

## 배경 (2026-09-26 FE 확인)

공개·Admin API는 보고서 행 36건(ANNUAL 18 + AUDIT 18)을 올바른 제목·파일명으로 돌려준다.  
각 행 `thumbnailUrl` 은 대략:

```text
http://localhost:9000/homepage-public/local/seed/ja-report/annual-{n}-thumb.png
http://localhost:9000/homepage-public/local/seed/ja-report/audit-{n}-thumb.png
```

`n` = `y - 2007` (예: 2025 → `18`, 2008 → `1`).

갭:

로컬 MinIO 버킷 `homepage-public` 의 prefix `local/seed/ja-report/` **객체 수 0**.  
위 URL은 전부 **HTTP 404**.

Platform `/about/transparency/annual-reports` · `audit-reports` 와 Admin `/ja-korea/reports-disclosure` 는 API가 준 `thumbnailUrl` 을 그대로 `<img>` / `background-image` 로 쓴다.  
파일이 없으면 커버가 회색·깨진 이미지로 보인다. FE는 mock으로 대체하지 않는다.

DB asset 행은 `storage_key` · purpose `JA_REPORT_THUMBNAIL_IMAGE` · status `READY` 로 이미 있을 수 있다.  
**객체만 없고 메타만 READY** 인 상태다. 키를 바꾸지 말고 **같은 키로 put** 하라.

PDF `local/seed/ja-report/annual-{n}.pdf` · `audit-{n}.pdf` 도 없으면 다운로드가 깨진다. 없으면 **같은 스크립트에서 PDF placeholder도 put** 하라(최소 유효 PDF 바이트).

---

## Goal

1. MinIO에 `local/seed/ja-report/` 아래 썸네일 PNG **36개**가 있다. (가능하면 PDF 36개도)
2. 공개 `thumbnailUrl` 을 curl 하면 **HTTP 200**, `Content-Type` 에 `image/png`.
3. Platform 연차·감사 목록 카드 커버에 이미지가 보인다 (회색 placeholder 아님).
4. Admin 보고서 목록 썸네일 열도 동일 URL로 이미지가 보인다.
5. path·OpenAPI·보고서 제목·`createdAt` SQL은 건드리지 않는다.
6. **local/dev 전용.** prod Flyway가 자동 실행하지 않는다.
7. 프론트 수정 금지. OpenAPI fetch/generate 금지.

```bash
# 객체 prefix
curl -sS 'http://localhost:9000/homepage-public/?list-type=2&prefix=local/seed/ja-report/&max-keys=100' \
| grep -c '<Key>'

# 샘플 200
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' \
  'http://localhost:9000/homepage-public/local/seed/ja-report/annual-18-thumb.png'
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' \
  'http://localhost:9000/homepage-public/local/seed/ja-report/audit-18-thumb.png'

# API URL이 가리키는 객체
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL?page=0&size=1' \
| python3 -c 'import json,sys,urllib.request;u=json.load(sys.stdin)["items"][0]["thumbnailUrl"];r=urllib.request.urlopen(u);print(r.status,r.headers.get("Content-Type"),u)'
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/AUDIT?page=0&size=1' \
| python3 -c 'import json,sys,urllib.request;u=json.load(sys.stdin)["items"][0]["thumbnailUrl"];r=urllib.request.urlopen(u);print(r.status,r.headers.get("Content-Type"),u)'
```

기대: KeyCount ≥ 36 (PDF까지 올리면 ≥ 72). 샘플·API URL 모두 **200** + `image/png`.

---

## Out of scope / 금지

- path·DTO·OpenAPI 변경.
- 보고서 제목·`attachmentFileName`·`createdAt`·운영원칙·finance·`disclosureUrl` UPDATE.
- `storage_key` 를 다른 prefix로 바꾸기 (공개 URL이 이미 이 키를 가리킴).
- DB에 `http://localhost:9000/...` 절대 URL을 컬럼에 저장. 공개 URL은 조회 시 key로 조립.
- `thumbnailUrl` 을 null로 비우기 (FE가 연차는 `#00A0AF` 라벨, 감사는 그라디언트로 가지만 Admin 목록은 빈 썸네일이 됨). **파일을 올려라.**
- TRUNCATE / 보고서 DELETE / prod 마이그레이션.
- 프론트 수정.
- 1×1 투명 PNG만 올려서 “200만 통과” — **최소 아래 시각 규격을 지켜라.**

---

## Platform 커버 SSOT (시각)

프론트에 연차·감사 표지 PNG 원본은 없다. local 시드용으로 **생성해도 된다.**  
카드에 보이는 규격에 맞춘다.

| 종류 | 배경 | 중앙 라벨 (흰 글씨) | 권장 픽셀 |
|------|------|---------------------|-----------|
| ANNUAL | 단색 `#00A0AF` | `{y}\nAnnual Report` (두 줄) | 가로≥680, 세로≥960 (약 17:24) |
| AUDIT | 그라디언트 순환 (아래 3종 중 `index % 3`) | `{y}년\n외부 회계감사` | 가로≥680, 세로≥400 정도 |

AUDIT 그라디언트 (Platform FE와 동일):

1. `linear-gradient(135deg, #14424e 0%, #1f6f7d 100%)`
2. `linear-gradient(135deg, #1a5d6b 0%, #2f8a8a 100%)`
3. `linear-gradient(135deg, #3f8f6e 0%, #a4c95d 100%)`

`index` 는 목록 최신순 0부터 (2025 → 0 → 그라디언트 1).  
JA Korea 워드마크를 넣을 필요는 없다. 연·라벨만 있으면 Platform 시안과 같은 역할이다.

이미 레포에 실표지 PNG가 있으면 그 바이트를 써도 된다. 없으면 Pillow/ImageMagick 등으로 **위 규격 PNG를 생성**해 put 하라.

PDF는 최소 유효 PDF(한 페이지 “seed” 텍스트)면 된다. 다운로드 200만 되면 된다.

---

## 키 매핑 (바꾸지 마라)

`n = y - 2007`

| y | ANNUAL thumb | ANNUAL pdf | AUDIT thumb | AUDIT pdf |
|--:|--------------|------------|-------------|-----------|
| 2025 | `local/seed/ja-report/annual-18-thumb.png` | `.../annual-18.pdf` | `.../audit-18-thumb.png` | `.../audit-18.pdf` |
| 2024 | `annual-17-thumb.png` | `annual-17.pdf` | `audit-17-thumb.png` | `audit-17.pdf` |
| … | … | … | … | … |
| 2008 | `annual-1-thumb.png` | `annual-1.pdf` | `audit-1-thumb.png` | `audit-1.pdf` |

purpose:

| 객체 | purpose |
|------|---------|
| `*-thumb.png` | `JA_REPORT_THUMBNAIL_IMAGE` |
| `*.pdf` | `JA_REPORT_PDF` |

Content-Type: `image/png` / `application/pdf`.  
original name은 기존 asset 행을 유지하거나 `{title}-thumb.png` / `{attachmentFileName}` 형태.

---

## 시드 규칙

기존 로컬 MinIO 업로드 패턴을 재사용하라.  
예: `scripts/upload_local_seed_minio.py` 가 있으면 `ja-report` 키를 추가.  
없으면 `scripts/upload_ja_transparency_report_seed_minio.py` (local/dev 전용)를 추가하라.

1. PNG(·PDF)를 `scripts/seed-assets/ja-report/` 에 두거나, 스크립트가 실행 시 생성한다.
2. 버킷은 **이미 200인 다른 `local/seed/*` 객체와 같은** public 버킷 (`homepage-public`).
3. 위 표의 `storage_key` 로 put. 덮어쓰기 OK. 키당 객체 1개.
4. DB asset: 같은 `storage_key` 가 있으면 status `READY` · content-type · size UPDATE. 없으면 INSERT. **같은 키로 행을 쌓지 마라.**
5. 보고서 행의 `thumbnail_asset_id` / PDF asset id는 **이미 이 키를 가리키면 id를 유지**한다. 제목·날짜 컬럼은 UPDATE하지 마라.
6. 두 번 실행해도 객체 36(+PDF 36)·asset 키당 1행.
7. 절대 URL을 DB에 쓰지 마라.

실행 예 (환경에 맞게 조정):

```bash
python3 scripts/upload_ja_transparency_report_seed_minio.py
# 필요 시 asset READY만 보정 (제목 SQL은 실행하지 마라)
```

---

## 검증 (Admin UI)

로그인 후:

- `/ja-korea/reports-disclosure` — 연차 목록 썸네일 열에 이미지
- `?tab=audit` — 동일
- Platform `http://localhost:5173/about/transparency/annual-reports` — 청록/그라디언트 표지(또는 올린 PNG)가 보임. 회색 빈 칸 아님.

---

## 회신 템플릿

```text
## MinIO
- 스크립트:
- ja-report KeyCount (thumb / pdf):
- annual-18-thumb.png / audit-18-thumb.png HTTP:

## API
- ANNUAL[0].thumbnailUrl → 200 image/png:
- AUDIT[0].thumbnailUrl → 200 image/png:

## UI
- Platform 연차·감사 커버:
- Admin 보고서 썸네일 열:

## 하지 않은 일
- path·OpenAPI 변경 없음
- 제목·createdAt·원칙·finance SQL 재실행 없음
- storage_key 변경 없음
- TRUNCATE/DELETE 없음
- prod 마이그레이션 없음
- 프론트 수정 없음
```

**Last updated:** 2026-09-26
