# Cursor prompt — 함께하는 사람들 Platform SSOT 시드 (문구 + 조직도 SVG)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. 값·경로·해시는 이 문서만 사용하라.  
질문이 필요하면 스키마·asset purpose·MinIO가 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/people-platform-seed-backend-cursor-prompt-2026-09-26.md`

값의 기준은 Platform `/about/people` 이다. Admin 예전 mock(영문 소속·다른 이름)과 `people-dummy-seed-backend-request.md`(2026-08-13)의 **사람 목록은 SSOT가 아니다.** 컬럼 매핑만 그 문서와 같다.

조직도·이사회 Admin API와 `GET /api/public/ja-korea/people` 는 이미 있다.  
이번 작업은 **로컬/dev DB 문구 + 조직도 파일**을 Platform 화면과 같게 맞춘다. 테이블·엔드포인트를 새로 만들지 마라.

---

## 배경 (2026-09-26 FE 기준)

| 화면 | Method | Path |
|------|--------|------|
| Admin 조직도 | GET/PUT | `/api/admin/ja-korea/people/organization-chart` |
| Admin 이사회 | GET/PUT/POST | `/api/admin/ja-korea/people/board-members` |
| 공개 함께하는 사람들 | GET | `/api/public/ja-korea/people` |

Platform은 공개 GET만 읽는다. 인증 없음.

공개 응답에서 화면이 쓰는 필드:

| 화면 | 응답 |
|------|------|
| 히어로 제목 | `organizationChart.title` |
| 조직도 이미지 | `organizationChart.imageUrl` |
| 이름 | `boardMembers[].koreanName` |
| 직함(이사장·회장·이사) | `boardMembers[].positionTitle` |
| 소속 | `boardMembers[].affiliationTitle` |
| 영문 이름 | `boardMembers[].englishName` |
| 그룹 | `boardMembers[].role` |
| 그룹 안 순서 | `boardMembers[].displayOrder` |

`roleLabel`, 섹션 영문 제목, 열 수(2·3·4), eyebrow `함께하는 사람들`, 페이지 배경 그라데이션은 **프론트 고정**이다. DB 컬럼으로 넣지 마라.

`role` → 화면 섹션 (프론트가 고정):

| role | 섹션 제목 | 열 |
|------|-----------|----|
| `BOARD_CHAIR_PRESIDENT` | Board Chair & President | 2 |
| `FIDUCIARY_BOARD_MEMBER` | Fiduciary Board Member | 3 |
| `BOARD_CHAIR` | Board Chair | 4 |

공개 GET은 **`published=true` 만** 반환해야 한다. 이미 그렇다면 필터를 바꾸지 마라. 비공개 행이 공개 응답에 있으면 그 필터만 고쳐라.

---

## Goal

로컬/dev Homepage DB의 함께하는 사람들이 Platform `/about/people` 과 같게 한다. 조직도 URL은 **실파일 200**이다.

완료 조건:

1. 무토큰 `GET /api/public/ja-korea/people` 의 `organizationChart.title` 이 아래 제목과 **문자 단위 동일**하다.
2. `boardMembers` 는 **11명**. role별 인원·`displayOrder`·이름·직함·소속·영문 이름이 아래 JSON과 같다. 배열 전체 정렬은 달라도 된다. 프론트는 role 안에서 `displayOrder` 로 정렬한다.
3. `organizationChart.imageUrl` 을 curl 하면 **HTTP 200**, `Content-Type` 에 `image/svg+xml`, 바이트 **59555**, SHA-256 은 아래 표와 같다.
4. 시드는 **idempotent**. 두 번 실행해도 조직도 행 1, 이 11명, asset 행(키당 1)이 늘지 않는다. TRUNCATE 금지.
5. 이 11칸이 아닌 **다른 published 이사회 행**은 `published=false` 로 내린다. DELETE 하지 마라. 공개 응답에는 이 11명만 남는다.
6. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL·업로드를 자동 실행하지 않는다.
7. Admin/Platform 프론트 파일은 수정하지 않는다.

```bash
curl -sS 'http://localhost:8081/api/public/ja-korea/people'
curl -sS -D - -o /tmp/ja-people-org-chart.svg "$(
  python3 - <<'PY'
import json,urllib.request
raw=urllib.request.urlopen('http://localhost:8081/api/public/ja-korea/people').read()
print(json.loads(raw)['organizationChart']['imageUrl'])
PY
)"
shasum -a 256 /tmp/ja-people-org-chart.svg
wc -c /tmp/ja-people-org-chart.svg
```

기대 해시: `063f90e1e44d1cde0afbe8e67bbdb86c845157785f44da58dd4e33a307b04e40`  
기대 크기: `59555`

---

## Out of scope / 금지

- 조직도·이사회 API path, DTO 필드명, OpenAPI operation 변경.
- `role` enum 추가·이름 변경.
- 섹션 제목·열 수·eyebrow·그라데이션을 DB에 저장.
- Admin mock에 있던 다른 사람(이존, 방경인, 박준형, 정미라, 최성호)과 옛 표기 `호바트 엡스타인` 을 남기거나 영문 소속 문장으로 되돌리기. Platform 표기는 `호버트 엡스타인` 이다.
- 1×1 더미·빈 파일·단색 placeholder. Admin `org-chart.png`(1141×654)나 Platform `org-chart.png` 로 대체.
- `imageUrl` 컬럼에 `http://localhost:9000/...` 를 저장. 공개 URL은 조회 시 storage key에서 만든다.
- 조직도 SVG를 PNG로 변환.
- 팽경인의 `englishName` `Mr. Cheulsik Shin` 을 다른 영문으로 교정. Platform 화면 원문이다.
- TRUNCATE, 이사회 행 DELETE.
- prod 마이그레이션.

---

## SVG content-type

purpose `JA_ORGANIZATION_CHART_IMAGE` 가 `image/svg+xml` 을 거부하면, **이 purpose만** `image/svg+xml` 을 허용하라.  
다른 purpose의 이미지 제한은 바꾸지 마라.  
허용 후에도 아래 바이트·해시를 그대로 올려라. PNG로 우회하지 마라.

---

## 시드 규칙 — 문구

스크립트: `scripts/seed_ja_people_platform_local.sql`  
없으면 이 이름으로 만든다. 기존 `scripts/seed_ja_people_local.sql` 이 있으면 **그 파일의 사람 목록으로 실행하지 마라.** 새 스크립트만 실행한다.

테이블은 기존 조직도 싱글톤·이사회 테이블이다. 새 테이블을 만들지 마라.  
로컬 DB 이름이 `ja_cms_local` 이 아니면, Homepage가 이미 쓰는 DB를 써라. DB를 새로 만들지 마라.

1. 조직도 싱글톤이 있으면 `title` 을 아래 값으로 UPDATE 하고 asset을 연결한다. 없으면 행 1개만 INSERT. 이미 1행이면 두 번째 행을 만들지 마라.
2. 이사회는 `(role_code, display_order)` 11칸을 UPDATE, 없으면 INSERT.
3. 그 11칸 밖이면서 `published=true` 인 이사회 행은 `published=false`. DELETE 금지.
4. 조직도 asset은 `storage_key = local/seed/ja-people-org-chart.svg`, purpose `JA_ORGANIZATION_CHART_IMAGE`. 없으면 INSERT, 있으면 그 id를 조직도에 연결한다. status `READY`. content type `image/svg+xml`. original name `org-chart.svg`.
5. 시드한 조직도·이사회 행 `version = 0`.
6. 스크립트를 두 번 실행해도 조직도 1행, 이 11명 published, asset 행(이 키) 1개다.

실행:

```bash
docker exec -i jaback-postgres-1 \
  psql -U ja_cms -d ja_cms_local < scripts/seed_ja_people_platform_local.sql
```

컨테이너·유저·DB 이름이 로컬과 다르면, **이미 쓰는 Homepage Postgres**에 맞춰라.

컬럼 매핑 (기존과 동일):

| 화면 | API | DB |
|------|-----|-----|
| 히어로 제목 | `title` | `title` |
| 조직도 | `organizationChartImage` / `organizationChartAssetId` | `organization_chart_asset_id` |
| 그룹 | `role` | `role_code` |
| 공개 | `published` | `published` |
| 이름 | `koreanName` | `korean_name` |
| 영문 | `englishName` | `english_name` |
| 직함 | `positionTitle` | `position_title` |
| 소속 | `affiliationTitle` | `affiliation_title` |
| 순서 | `displayOrder` | `display_order` |
| 잠금 | `version` | `version` |

`display_order` 는 **role 안에서 1부터**.

---

## 시드 규칙 — 실파일

기존 로컬 시드 MinIO 업로드 패턴을 재사용하라.  
예: `scripts/upload_local_seed_minio.py` 가 있으면 이 키를 추가.  
없으면 `scripts/upload_ja_people_seed_minio.py` (또는 `.sh`) 를 **local/dev 전용**으로 추가하라.

1. 프론트 레포에서 아래 파일을 백엔드 `scripts/seed-assets/ja-people/` 로 복사한다. 커밋해도 된다.
2. MinIO `homepage-public`(로컬이 쓰는 동일 public 버킷)에 put. 키는 표의 `storage_key`.
3. DB asset 행은 같은 `storage_key` 가 있으면 UPDATE(status `READY`)·없으면 INSERT. purpose는 표와 같다. 같은 키로 행을 쌓지 마라.
4. 조직도 싱글톤이 그 asset id를 가리키게 한다. 이미 같은 키를 가리키면 id는 유지한다.
5. Content-Type은 `image/svg+xml`.
6. 업로드를 두 번 해도 객체 1개·asset 행 1개다. 덮어쓰기 OK.
7. 버킷·엔드포인트·공개 URL 규칙은 **이미 200인 다른 local/seed 객체**와 같게 맞춰라.

| storage_key | purpose | 프론트 원본 (jakorea) | bytes | SHA-256 |
|-------------|---------|------------------------|------:|---------|
| `local/seed/ja-people-org-chart.svg` | `JA_ORGANIZATION_CHART_IMAGE` | `apps/platform/src/features/people/image/illustration/org-chart.svg` | 59555 | `063f90e1e44d1cde0afbe8e67bbdb86c845157785f44da58dd4e33a307b04e40` |

이 SVG가 Platform이 지금 그리는 조직도다. 같은 폴더의 `org-chart.png`(61601 bytes)는 올리지 마라.

---

## SEED_DATA

`published` 는 11명 모두 `true`.

```json
{
  "organizationChart": {
    "title": "청소년들의 미래를 위해 JA Korea와 함께하는 사람들",
    "storageKey": "local/seed/ja-people-org-chart.svg",
    "purpose": "JA_ORGANIZATION_CHART_IMAGE",
    "contentType": "image/svg+xml",
    "originalName": "org-chart.svg"
  },
  "boardMembers": [
    {
      "role": "BOARD_CHAIR_PRESIDENT",
      "displayOrder": 1,
      "published": true,
      "koreanName": "신철식",
      "englishName": "Mr. Cheulsik Shin",
      "positionTitle": "이사장",
      "affiliationTitle": "우호문화재단 이사장"
    },
    {
      "role": "BOARD_CHAIR_PRESIDENT",
      "displayOrder": 2,
      "published": true,
      "koreanName": "이은형",
      "englishName": "Eunhyung Lee",
      "positionTitle": "회장",
      "affiliationTitle": "국민대 경영학부 교수"
    },
    {
      "role": "FIDUCIARY_BOARD_MEMBER",
      "displayOrder": 1,
      "published": true,
      "koreanName": "윤종록",
      "englishName": "Mr. Jongrok Yoon",
      "positionTitle": "이사",
      "affiliationTitle": "KAIST 과기정책대학원 겸임교수"
    },
    {
      "role": "FIDUCIARY_BOARD_MEMBER",
      "displayOrder": 2,
      "published": true,
      "koreanName": "존 리",
      "englishName": "John Lee",
      "positionTitle": "이사",
      "affiliationTitle": "존리의 부자학교 대표"
    },
    {
      "role": "FIDUCIARY_BOARD_MEMBER",
      "displayOrder": 3,
      "published": true,
      "koreanName": "팽경인",
      "englishName": "Mr. Cheulsik Shin",
      "positionTitle": "이사",
      "affiliationTitle": "서부 T&D 사외이사"
    },
    {
      "role": "BOARD_CHAIR",
      "displayOrder": 1,
      "published": true,
      "koreanName": "류혁선",
      "englishName": "Hyuksun Rhu",
      "positionTitle": "이사",
      "affiliationTitle": "KAIST 경영대학 교수"
    },
    {
      "role": "BOARD_CHAIR",
      "displayOrder": 2,
      "published": true,
      "koreanName": "김소연",
      "englishName": "Soyeon Kim",
      "positionTitle": "이사",
      "affiliationTitle": "Disney Korea 대표"
    },
    {
      "role": "BOARD_CHAIR",
      "displayOrder": 3,
      "published": true,
      "koreanName": "호버트 엡스타인",
      "englishName": "Hobart Epsteine",
      "positionTitle": "이사",
      "affiliationTitle": "원익홀딩스 사외이사"
    },
    {
      "role": "BOARD_CHAIR",
      "displayOrder": 4,
      "published": true,
      "koreanName": "비비안 라우",
      "englishName": "Vivian Lau",
      "positionTitle": "이사",
      "affiliationTitle": "퍼시픽 에어 홀딩스 회장/그룹 CEO"
    },
    {
      "role": "BOARD_CHAIR",
      "displayOrder": 5,
      "published": true,
      "koreanName": "전창원",
      "englishName": "Changwon Cheon",
      "positionTitle": "이사",
      "affiliationTitle": "김앤장법률사무소 변호사"
    },
    {
      "role": "BOARD_CHAIR",
      "displayOrder": 6,
      "published": true,
      "koreanName": "송연주",
      "englishName": "Yonju Song",
      "positionTitle": "이사",
      "affiliationTitle": "삼일회계법인 파트너"
    }
  ]
}
```

인원: Board Chair & President **2**, Fiduciary Board Member **3**, Board Chair **6**. 합계 **11**.

---

## 완료 확인

- [ ] 공개 `boardMembers` 11명. 첫 그룹 첫 사람은 `신철식` / `이사장` / `우호문화재단 이사장` / `Mr. Cheulsik Shin`
- [ ] Fiduciary 3번째 `팽경인` 의 `englishName` 은 `Mr. Cheulsik Shin` (교정 금지)
- [ ] Board Chair 6명. 마지막은 `송연주` / `삼일회계법인 파트너` / `Yonju Song`
- [ ] 공개 응답에 이존·방경인·박준형·정미라·최성호 없음
- [ ] `organizationChart.title` 이 시드 제목과 동일
- [ ] 이미지 URL curl 200, `image/svg+xml`, 59555 bytes, SHA-256 일치
- [ ] 스크립트·업로드를 두 번 해도 행·객체가 늘지 않음
- [ ] Admin `GET /api/admin/ja-korea/people/board-members` 에서 이 11명이 `published=true`

**Last updated:** 2026-09-26
