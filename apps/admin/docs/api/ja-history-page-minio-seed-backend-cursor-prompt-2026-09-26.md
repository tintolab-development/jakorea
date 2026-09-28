# Cursor prompt — JA History MinIO 실파일 시드 (JAHOMEADMINBACK)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 경로·키·검수만** 사용하라.  
질문이 필요하면 MinIO·asset purpose가 거절할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/ja-history-page-minio-seed-backend-cursor-prompt-2026-09-26.md`

선행 작업: `scripts/seed_ja_history_page_local.sql` (텍스트·asset 키는 이미 있음).  
그 스크립트는 **바이트를 넣지 않았다.** 지금 공개 URL은 전부 **404**다.

**Admin·Platform 프론트 파일은 수정하지 마라.** 텍스트·기간·개행 시드를 다시 쓰지 마라.

---

## 현재 갭 (2026-09-26 확인)

`GET /api/public/ja-korea/ja-history` 텍스트·개행·기간 구조는 Platform SSOT와 일치한다.

미디어는 `fileName`·`alt`·`assetId`·`url` 이 내려오지만, 객체는 없다.

```text
http://localhost:9000/homepage-public/local/seed/ja-history/hero-visual.png       → 404
http://localhost:9000/homepage-public/local/seed/ja-history/expansion-photo.png   → 404
http://localhost:9000/homepage-public/local/seed/ja-history/korea-photo.png       → 404
(era / learning / philosophy / thrive / cta / year-1919.svg 동일)
```

Platform은 `url`이 있으면 번들 폴백을 쓰지 않는다. **깨진 URL이 그대로 렌더**된다.  
확대(expansion)·히어로·시대 사진이 비는 이유가 이것이다.

---

## Goal

`local/seed/ja-history/<fileName>` 객체에 **실 바이너리**를 올려라.  
공개·관리자 응답의 `url`을 curl 하면 **HTTP 200** + `image/png` 또는 `image/svg+xml` 이어야 한다.

완료 조건:

1. 아래 표 18개 파일이 MinIO `homepage-public` (또는 로컬이 쓰는 동일 public 버킷)에 있다.
2. storage_key는 기존 시드와 같다: `local/seed/ja-history/<fileName>`.
3. `homepage_asset`(또는 동등) 행은 이미 있으면 **재사용**. 새 행을 쌓지 마라. status `READY`.
4. 시드는 **idempotent**. 두 번 실행해도 객체·asset 행이 늘지 않는다 (덮어쓰기 OK).
5. **local/dev 전용.** prod Flyway·앱 기동이 바이너리를 자동 올리지 않는다.
6. 텍스트·version·기간 id·개행은 바꾸지 마라.

---

## Out of scope / 금지

- JA History 텍스트·PUT API·OpenAPI 변경
- `/api/admin/ja-korea/history` 목록 API
- 1×1 더미·빈 파일·단색 placeholder로 대체
- storage_key rename (`ja-history/` 접두 유지)
- `url: null` 로 바꿔 FE 폴백만 유도하는 것 (이번 작업은 **실파일**)
- Platform·Admin 프론트 수정
- pattern-era / pattern-learning SVG (DB에 없는 CSS 장식. 올리지 마라)

---

## 원본 파일 (프론트 레포)

SSOT는 **Platform** 경로다. Admin 쪽이 같은 파일이면 대체 가능.

| storage_key | purpose | 프론트 원본 (jakorea) |
|-------------|---------|------------------------|
| `local/seed/ja-history/hero-visual.png` | `JA_HISTORY_HERO_IMAGE` | `apps/platform/src/features/history/image/hero-visual.png` |
| `local/seed/ja-history/expansion-photo.png` | `JA_HISTORY_WORLD_TIMELINE_IMAGE` | `apps/platform/src/features/history/image/illustration/expansion-photo.png` |
| `local/seed/ja-history/korea-photo.png` | `JA_HISTORY_KOREA_TIMELINE_IMAGE` | `apps/platform/src/features/history/image/illustration/korea-photo.png` |
| `local/seed/ja-history/year-1919.svg` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/year-1919.svg` |
| `local/seed/ja-history/learning-photo.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/learning-photo.png` |
| `local/seed/ja-history/era-1920.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/era-1920.png` |
| `local/seed/ja-history/era-1950.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/era-1950.png` |
| `local/seed/ja-history/era-1960.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/era-1960.png` |
| `local/seed/ja-history/era-1980.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/era-1980.png` |
| `local/seed/ja-history/philosophy-practice.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/philosophy-practice.png` |
| `local/seed/ja-history/philosophy-role-model.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/philosophy-role-model.png` |
| `local/seed/ja-history/philosophy-mindset.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/philosophy-mindset.png` |
| `local/seed/ja-history/philosophy-support.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/philosophy-support.png` |
| `local/seed/ja-history/thrive-empower.svg` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/thrive-empower.svg` |
| `local/seed/ja-history/thrive-digital.svg` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/thrive-digital.svg` |
| `local/seed/ja-history/thrive-partner.svg` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/thrive-partner.svg` |
| `local/seed/ja-history/thrive-enablers.svg` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/thrive-enablers.svg` |
| `local/seed/ja-history/cta-photo.png` | `JA_HISTORY_LOCKED_MEDIA` | `…/illustration/cta-photo.png` |

Admin 대체 루트(동일 파일명):

`apps/admin/src/features/ja-history/image/<fileName>`

Content-Type: PNG → `image/png`, SVG → `image/svg+xml`.

참고 크기(대략, 검증용): `hero-visual.png` ~1.2MB, `expansion-photo.png` ~1.1MB, `cta-photo.png` ~2.3MB, thrive SVG 는 수 KB.

---

## 구현

기존 로컬 시드 MinIO 업로드 패턴을 재사용하라.

예: `scripts/upload_local_seed_minio.py` 가 있으면 확장.  
없으면 `scripts/upload_ja_history_seed_minio.py` (또는 `.sh`) 를 **local/dev 전용**으로 추가하라.

권장 흐름:

1. 프론트 레포에서 위 18파일을 백엔드 `scripts/seed-assets/ja-history/` 등으로 복사 (커밋해도 되고, 문서에 복사 명령을 남겨도 된다).
2. MinIO에 `put` / `mc cp`. 키 = `local/seed/ja-history/<fileName>`.
3. DB asset 행: 같은 `storage_key` 가 있으면 UPDATE(status READY)·없으면 INSERT. purpose는 표와 동일.
4. JA History 싱글톤이 가리키는 asset id는 **이미 연결돼 있으면** 그대로 둔다. 키가 맞으면 URL이 살아난다.
5. 기존 `seed_ja_history_page_local.sql` 텍스트 구간은 재실행하지 않아도 된다. 필요하면 “바이트만” 스크립트를 분리하라.

버킷·엔드포인트·공개 URL 규칙은 **이미 200인 다른 local/seed 객체**와 같게 맞춰라.  
(로컬에서 다른 seed PNG가 전부 404여도, 이번 작업은 ja-history 18개가 200이면 성공이다.)

---

## 검수

```bash
# 공개 API의 url 이 200 인지
URL=$(curl -sS http://localhost:8081/api/public/ja-korea/ja-history \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['worldTimeline']['image']['url'])")
curl -sS -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" "$URL"
# 기대: 200 image/png  (size > 10000)

# 18개 키 일괄
for f in \
  hero-visual.png expansion-photo.png korea-photo.png \
  year-1919.svg learning-photo.png \
  era-1920.png era-1950.png era-1960.png era-1980.png \
  philosophy-practice.png philosophy-role-model.png philosophy-mindset.png philosophy-support.png \
  thrive-empower.svg thrive-digital.svg thrive-partner.svg thrive-enablers.svg \
  cta-photo.png
do
  curl -sS -o /dev/null -w "$f %{http_code}\n" \
    "http://localhost:9000/homepage-public/local/seed/ja-history/$f"
done
# 전부 200

# 텍스트 회귀 (개행 유지)
curl -sS http://localhost:8081/api/public/ja-korea/ja-history \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert '\\n' in d['hero']['mainText']
assert d['worldTimeline']['periods'][1]['title']=='' and d['worldTimeline']['periods'][1]['events']==[]
assert 'Junior Achivement' in d['worldTimeline']['periods'][0]['events'][1]['text']
print('text ok')
"
```

스크립트를 두 번 실행한 뒤 asset 행 수·객체 수가 늘지 않는지 확인하라.

---

## Done when

회신에 채워라.

- `expansion-photo.png` URL HTTP 상태·Content-Type·대략 byte 크기
- `hero-visual.png` · `era-1920.png` · `thrive-empower.svg` · `cta-photo.png` 각각 200 여부
- 업로드 스크립트 경로·실행 명령
- `seed_ja_history_page_local.sql` 텍스트를 바꿨는지 (기대: 아니오)
- 스크립트 2회 실행 후 asset/객체 증분 여부 (기대: 없음)
