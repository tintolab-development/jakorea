# Cursor prompt — 오시는 길 공개·Admin 시드 카카오 Roughmap 실키 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·금지는 이 문서만 사용하라.

질문이 필요하면 Kakao Roughmap 파싱·시드 SQL이 거부할 때만 하라.

---

## 배경 (2026-09-26 FE 기준)

이미 동작하는 계약 (변경하지 마라):

| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/admin/ja-korea/directions` | Admin 조회. `DirectionsResponse` + `version` |
| PUT | `/api/admin/ja-korea/directions` | Admin 저장. `DirectionsUpdateRequest` + `version` |
| GET | `/api/public/ja-korea/directions` | Platform 공개. `PublicDirectionsResponse` (무토큰) |

Admin·Platform FE는 위 path로 연동 완료다. **새 path를 만들지 마라.**

갭:

로컬 시드 `ja_directions_setting` 의 Kakao Roughmap `key` 가 **`2xyz` 자리표시자**다.  
공개 GET이 돌려주는 `kakaoMapHtml` 은 형식은 맞지만, 카카오 지도 서버가 실지도를 렌더하지 못한다.  
Platform `/about/directions` 지도 영역이 비거나 깨진다.

FE는 Admin에서 붙여 넣는 **생성 스니펫**만 허용한다 (iframe·Leaflet 금지).  
BE `KakaoRoughmapPolicy` 파싱·재조립 규칙을 유지하라.

---

## Goal

1. 로컬(및 필요 시 스테이징) 싱글톤 `id=1` 의 Kakao Roughmap 필드를 **실제 공유용 Roughmap timestamp/key** 로 갱신한다.
2. `GET /api/public/ja-korea/directions` 의 `kakaoMapHtml` 이 Admin PUT과 동일 형식으로 재조립된다.
3. OpenAPI path·스키마 이름은 그대로다.

---

## Out of scope / 금지

- Admin/Public path·필드명·enum 변경
- 임의 HTML·iframe·Leaflet·외부 map SDK 저장
- `version` 낙관적 잠금 제거
- `attachmentAssetId` 등 무관 필드 추가
- Admin/Platform 프론트 수정

---

## 1. 시드 값

대상 테이블: `homepage.ja_directions_setting` (singleton `id=1`)

주소·전화·팩스·이메일은 현재 시드를 유지해도 된다:

| DB 컬럼 | 유지 값 (참고) |
|---------|----------------|
| `korean_address` | 서울특별시 강서구 마곡중앙로 171 (마곡나루역 프라이빗타워2차 714호) |
| `english_address` | Rm 714, Magoknaru Station Private Tower 2, 171 Magokjungang-ro, Gangseo-gu, Seoul, 07788, Republic of Korea |
| `phone` | 02-783-2367 |
| `fax` | 070-4275-5115 |
| `email` | jakorea@jakorea.org |

지도:

| DB 컬럼 | 요구 |
|---------|------|
| `kakao_map_timestamp` | 카카오맵 「지도 퍼가기」Roughmap 생성 HTML의 timestamp (숫자 문자열) |
| `kakao_map_key` | 동일 HTML의 key. **`2xyz` 금지** |
| `kakao_map_width` | 권장 `1440` |
| `kakao_map_height` | 권장 `728` |

실키 확보 방법 (백엔드 작업자가 한 번):

1. https://map.kakao.com 에서 「사단법인 제이에이코리아」(마곡나루역 프라이빗타워2) 위치 검색
2. 「공유」→「지도 퍼가기」→ 생성 HTML 복사
3. `daumRoughmapContainer{timestamp}` 와 Lander `timestamp`/`key`/`mapWidth`/`mapHeight` 추출
4. 시드 SQL·Flyway 또는 로컬 UPDATE에 반영

생성 HTML 형식은 FE·BE가 공유하는 이 형태여야 한다:

```html
<div id="daumRoughmapContainer{TIMESTAMP}" class="root_daum_roughmap root_daum_roughmap_landing"></div>
<script charset="UTF-8" class="daum_roughmap_loader_script" src="https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js"></script>
<script charset="UTF-8">new daum.roughmap.Lander({"timestamp":"{TIMESTAMP}","key":"{KEY}","mapWidth":"1440","mapHeight":"728"}).render();</script>
```

`id` 의 timestamp 와 Lander `timestamp` 는 **같아야** 한다.

---

## 2. 완료 조건

```bash
curl -sS http://localhost:8081/api/public/ja-korea/directions
# kakaoMapHtml 에 key=2xyz 가 없다
# daumRoughmapContainer{timestamp} 와 Lander timestamp 가 같다

# Admin JWT로
curl -sS -H "Authorization: Bearer <token>" \
  http://localhost:8081/api/admin/ja-korea/directions
# version · updatedAt 포함. public과 동일 지도 필드 재조립
```

- [ ] `kakao_map_key` ≠ `2xyz`
- [ ] 공개·Admin GET의 `kakaoMapHtml` 이 위 생성 스니펫 형식
- [ ] 브라우저에서 Roughmap이 실제 지도를 그린다 (카카오 CDN 로드 가능 환경)
- [ ] OpenAPI path 변경 없음

---

## FE 참고 (수정하지 말 것)

- Admin: `GET/PUT /api/admin/ja-korea/directions`
- Platform: `GET /api/public/ja-korea/directions` (`skipAuth`)
- 지도 마운트: Roughmap script 재실행. iframe 금지

**Last updated:** 2026-09-26
