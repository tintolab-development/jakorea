# Cursor prompt — 공개 기관소개 API 계약 확인·정합 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·공개 필터는 이 문서만 사용하라.

질문이 필요하면 OpenAPI·기존 Spec·published 필터가 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/public-organization-introduction-api-backend-cursor-prompt-2026-09-26.md`

관련 시드 문서(별도):

`apps/admin/docs/api/organization-introduction-platform-seed-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 Platform FE 기준)

Platform `/about/introduction`(기관소개)는 **공개 싱글톤 GET** 으로 remote 전환한다.

| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/public/ja-korea/organization` | Platform 기관소개 전체. 무토큰 |
| GET/PUT | `/api/admin/ja-korea/introduction` | Admin JA Korea 소개 |
| GET/PUT | `/api/admin/ja-korea/global-values` | Admin Global Value |
| GET/PUT | `/api/admin/ja-korea/worldwide` | Admin Worldwide |
| CRUD | `/api/admin/ja-korea/history` · `awards` · `certifications` | Admin 연혁/수상/인증 |
| GET/PUT | `/api/admin/ja-korea/bi` | Admin BI |

OpenAPI에 `PublicOrganizationResponse` 가 이미 있다.  
이번 작업은 **새 path를 만들지 말고**, 공개 GET이 Platform이 읽는 필드·공개 필터를 **실제로** 맞추는 것이다.

Platform FE는 mock fallback 없이 이 GET만 읽는다. 인증 없음.

---

## Goal

1. 무토큰 `GET /api/public/ja-korea/organization` 이 **200** 이고 `PublicOrganizationResponse` 형태다.
2. 응답에 아래 블록이 있다(비어 있어도 키는 허용, null 대신 빈 배열/객체 정책은 기존과 동일).
3. `history` / `awards` / `certifications` 는 **published(공개)만**.
4. `globalValues` 는 **enabled=true 만**, `displayOrder` 오름차순.
5. Admin path·DTO 이름은 바꾸지 않는다. 공개 스키마 필드명도 바꾸지 않는다.

완료 조건:

```bash
curl -sS 'http://localhost:8081/api/public/ja-korea/organization'
```

- HTTP 200
- JSON에 `introduction`, `globalValues`, `worldwide`, `history`, `awards`, `certifications`, `bi` 존재(또는 스펙상 optional 이면 생략 가능하되, Platform은 undefined를 빈 값으로 처리)
- `history`/`awards`/`certifications` 배열에 비공개 행이 없다
- `globalValues` 에 `enabled=false` 행이 없다(공개 DTO에 enabled 필드가 없어도, 소스 기준 비활성은 제외)

---

## Out of scope / 금지

- 새 public path (`/introduction`, `/organization/intro` 등) 추가
- Admin path·필드명·enum 변경
- `version` / Admin 낙관적 잠금을 공개 응답에 노출
- 아이콘 파일·지도 SVG·심볼 이미지를 API로 제공(프론트 고정)
- Worldwide 지도 CTA 좌표(`linkX`/`linkY`), eyebrow `JA Worldwide`, 스탯 `15,140,800`, 호버 가이드 문구를 DB/API에 추가
- 연혁 기간 탭 라벨(`2026 ~ Now` 등)을 API에 추가 — 프론트 고정
- Admin/Platform 프론트 수정
- 시드 SQL 작성(시드 문서에서 한다)

---

## 1. 공개 응답 계약 (Platform이 읽는 필드)

Path: `GET /api/public/ja-korea/organization`  
권한: **없음**

### 1.1 `introduction` — `PublicIntroductionResponse`

| 필드 | Platform 화면 |
|------|----------------|
| `section1Subtitle` | Hero intro (JA Korea는 … 가능성을 믿습니다) |
| `section1Title` | Hero message (청소년이 마음껏 … 함께합니다) |
| `section2TitleEn` | Inspiring Youth |
| `section2SubtitleKo` | Inspiring 설명 |
| `content1Title` / `content1Description` | 글로벌 교육 네트워크 블록 |
| `content2Title` / `content2Description` | 체계적인 교육 경험 블록 |
| `globalVisionSubtitleEn` / `globalVisionTextKo` | Global Vision |
| `globalMissionSubtitleEn` / `globalMissionTextKo` | Global Mission |

줄바꿈: FE는 `\n` 이 있으면 PC용 줄 분리, 없으면 한 줄. **필수로 `\n` 을 넣을 필요는 없다.**

### 1.2 `globalValues[]` — `PublicGlobalValueResponse`

| 필드 | 비고 |
|------|------|
| `id` | |
| `itemCode` | `VALUE_1` … `VALUE_5` |
| `iconCode` | 있어도 되고, FE는 `itemCode`→로컬 SVG 매핑 |
| `mainText` | 영문 |
| `subText` | 한글 |
| `displayOrder` | 오름차순 정렬 |

**enabled=false 는 공개 배열에서 제외.**

### 1.3 `worldwide` — `PublicWorldwideResponse`

| 필드 | Platform |
|------|----------|
| `guidanceText` | 하단 긴 설명문 |
| `links[].linkCode` | `JA_WORLDWIDE`, `JA_USA`, `JA_EUROPE`, `JA_MENA`, `JA_ASIA_PACIFIC`, `JA_AMERICAS`, `JA_AFRICA` |
| `links[].displayName` | Admin 표시명(공개 화면 CTA 라벨은 FE 고정) |
| `links[].externalUrl` | 외부 URL |

`JA_WORLDWIDE` → 헤더 「JA Worldwide 바로가기」.  
나머지 6코드 → 지도 지역 링크.  
호버 가이드·스탯·CTA 좌표는 FE 고정.

### 1.4 `history[]` — `PublicHistoryResponse`

| 필드 | 비고 |
|------|------|
| `id` | |
| `year` | 정수 |
| `month` | 1–12 |
| `content` | 항목 문구 |

**published=true 만.** FE가 year→month→items 로 그룹한다.

### 1.5 `awards[]` — `PublicAwardResponse`

| 필드 | Platform |
|------|----------|
| `awardedDate` | `YYYY-MM-DD` (또는 ISO). FE가 `2025년 12월` 로 표시 |
| `awardName` | 상명 |
| `awardingInstitution` | 수여기관 |

**published=true 만.** 정렬: 최신 `awardedDate` 우선(기존과 동일하면 유지).

### 1.6 `certifications[]` — `PublicCertificationResponse`

| 필드 | Platform |
|------|----------|
| `certifiedDate` | 날짜 |
| `content` | 내용 |
| `certificationInstitution` | 인증기관 |

**published=true 만.**

### 1.7 `bi` — `PublicBiResponse`

| 필드 | Platform |
|------|----------|
| `title` | 섹션 제목 |
| `mainText` | lead |
| `subText` | 본문 설명 |

심볼 이미지 3장은 FE 고정. API로 이미지 URL을 주지 마라.

---

## 2. 구현 체크

기존 `JaKoreaPublicController`(또는 organization 공개 핸들러)가 위 블록을 조립하는지 확인하라.

갭이 있으면 **공개 조립·필터만** 고쳐라.

예:

- history/awards/certs에 published 필터 누락
- globalValues에 disabled 포함
- worldwide links 누락
- introduction/bi 싱글톤 null 처리 오류

OpenAPI 필드명을 바꾸지 마라. 누락된 공개 필드가 OpenAPI에 이미 있으면 구현만 맞추면 된다.

---

## 3. 검증

```bash
# 무토큰
curl -sS -o /tmp/org.json -w '%{http_code}\n' \
  'http://localhost:8081/api/public/ja-korea/organization'
# 기대: 200

python3 - <<'PY'
import json
raw=open('/tmp/org.json').read()
data=json.loads(raw)
# envelope면 data 언랩
if isinstance(data, dict) and data.get('success') is True and 'data' in data:
  data=data['data']
assert isinstance(data, dict)
for key in ('introduction','globalValues','worldwide','history','awards','certifications','bi'):
  # optional 허용 — 키가 없어도 됨. 있으면 타입만 확인
  if key not in data: continue
  v=data[key]
  if key in ('globalValues','history','awards','certifications'):
    assert isinstance(v, list), key
  elif key=='worldwide':
    assert isinstance(v, dict), key
  elif key in ('introduction','bi'):
    assert v is None or isinstance(v, dict), key
print('organization public shape: ok')
PY
```

Admin JWT로 비공개 연혁/수상/인증을 하나 만든 뒤, 공개 GET에 **포함되지 않는지** 확인하라.

---

## 4. 완료 후

시드 값은 **시드 문서**만 따른다. 이 API 문서에서 SQL/문구 시드를 넣지 마라.
