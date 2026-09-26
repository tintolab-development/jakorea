# Cursor prompt — 공개 사이트 관리 API 계약 확인·정합 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·공개 필터는 이 문서만 사용하라.

질문이 필요하면 OpenAPI·기존 Spec·공개 필터가 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/public-site-management-api-backend-cursor-prompt-2026-09-26.md`

관련 시드 문서(별도):

`apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 Platform FE 기준)

Admin **사이트 관리** 3화면과 Platform 헤더·푸터·문서 헤드는 이미 있는 site API를 쓴다.

| 화면 | Admin (JWT) | Public (무토큰) |
|------|-------------|-----------------|
| 사이트 정보 | `GET/PUT /api/admin/site/settings` | `GET /api/public/site/settings` |
| GNB | `GET/PUT /api/admin/site/gnb` | `GET /api/public/site/gnb` |
| 푸터 | `GET /api/admin/site/footer` | `GET /api/public/site/footer` |
| 푸터 메뉴 | `PUT /api/admin/site/footer/menus` | (위 GET에 포함) |
| 푸터 기관 | `PUT /api/admin/site/footer/organization` | (위 GET에 포함) |
| 푸터 파트너 | `PUT /api/admin/site/footer/partners/{id}` · `PUT .../partners/order` | (위 GET에 포함) |

OpenAPI에 `PublicSiteSettingsResponse`, `PublicGnbGroupResponse`, `PublicFooterResponse` 가 이미 있다.  
이번 작업은 **새 path를 만들지 말고**, 공개 GET이 Platform이 읽는 필드·공개 필터를 **실제로** 맞추는 것이다.

Admin FE는 localStorage mock 없이 위 Admin path만 호출한다.  
Platform은 공개 GET만 읽는다. 인증 없음. `{ success, data }` 래퍼가 있으면 Platform이 data까지 벗긴다.

---

## Goal

1. 무토큰 공개 GET 3개가 **200** 이고 아래 스키마 형태다.
2. 공개 GNB·푸터 메뉴·파트너는 **enabled(사용)만**. `displayOrder` 오름차순.
3. 공개 응답에 `version`·asset id를 넣지 않는다.
4. Admin path·DTO 이름은 바꾸지 않는다. 공개 스키마 필드명도 바꾸지 않는다.

완료 조건:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:8081/api/public/site/settings
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:8081/api/public/site/gnb
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:8081/api/public/site/footer
```

세 호출 모두 `200`.

---

## Out of scope / 금지

- 새 public path (`/site/header`, `/site/nav`, `/footer/related-sites` 등) 추가
- Admin path·필드명·enum 변경
- `version` / Admin 낙관적 잠금을 공개 응답에 노출
- GNB에 `href`·외부 URL 추가. 경로는 프론트 고정
- 푸터 메뉴에 `온라인 학습관리` 행 추가. Platform이 로컬에서 7개 뒤에 붙인다
- 관련 사이트 7개(JA Worldwide 등)·SNS 3개를 푸터 API에 추가. 프론트 고정
- 파트너 로고 SVG를 API 바이너리로 제공. URL 문자열만
- `GET /api/public/participation/links` 수정. GNB `온라인 학습`/`Alumni`와 푸터 `온라인 학습관리`의 외부 URL은 그 API다
- Admin/Platform 프론트 수정
- 시드 SQL 작성(시드 문서에서 한다)

---

## 1. 공개 응답 계약 (Platform이 읽는 필드)

권한: **없음**

### 1.1 `GET /api/public/site/settings` — `PublicSiteSettingsResponse`

| 필드 | Platform |
|------|----------|
| `siteName` | `document.title`, `og:title`. 비면 프론트가 `JA Korea` |
| `seoMetaDescription` | `meta description`, `og:description` |
| `ogImageUrl` | `og:image`. `http`/`https`만 반영 |
| `faviconUrl` | `link[rel=icon]`. `http`/`https`만 반영 |

### 1.2 `GET /api/public/site/gnb` — `PublicGnbGroupResponse[]`

배열. 그룹·메뉴는 `displayOrder` 오름차순. **enabled=false 메뉴는 빼라.** 그룹의 공개 메뉴가 0이면 그 그룹도 빼라.

| 필드 | Platform |
|------|----------|
| `groupCode` | `JA_KOREA` `IMPACT_STORY` `EDUCATION` `PARTICIPATION` `SPONSORSHIP` 만 사용. 그 외 코드는 프론트가 버린다 |
| `groupName` | 1뎁스 라벨 |
| `displayOrder` | 그룹 순서 |
| `menus[].menuCode` | 프론트가 아는 20코드만 사용. 목록은 시드 문서 |
| `menus[].displayName` | 2뎁스 라벨 |
| `menus[].displayOrder` | 그룹 안 순서 |

`enabled`를 공개 항목에 넣어도 된다. 넣지 않아도 된다. **비활성 행이 배열에 있으면 안 된다.**

### 1.3 `GET /api/public/site/footer` — `PublicFooterResponse`

`menus`는 배열이어야 한다. 없으면 Platform은 응답 전체를 버린다.

#### `menus[]` — enabled만, `displayOrder` 오름차순

| 필드 | Platform |
|------|----------|
| `menuCode` | `TERMS` `PRIVACY` `DIRECTIONS` `NTS_DISCLOSURE` `NTS_EVASION_REPORT` `DONATION` `DONATION_RECEIPT` 만 사용 |
| `label` | 버튼 문구 |
| `linkType` | `INTERNAL` 또는 `EXTERNAL` |
| `internalRouteCode` | INTERNAL일 때 `TERMS` `PRIVACY` `DIRECTIONS` |
| `externalUrl` | EXTERNAL이고 `http`/`https`일 때만 새 창 링크. 아니면 버튼만 |
| `displayOrder` | 순서 |

`DIRECTIONS`의 경로는 프론트가 `/about/directions`로 고정한다. API href를 믿지 않는다.

#### `organization`

| 필드 | Platform |
|------|----------|
| `organizationName` | 주소 줄 앞부분 |
| `address` | 주소 줄 뒷부분. 화면은 `organizationName + ' ' + address` |
| `postalCode` | 우편번호 |
| `representativeName` | 대표자 |
| `businessRegistrationNumber` | 사업자등록번호 |
| `phone` | 전화 |
| `fax` | 팩스 |
| `email` | 이메일 |
| `logoUrl` | 기관 로고. `http`/`https`만. 실패·없음이면 프론트 기본 로고 |

`organizationDescription`은 Platform이 읽지 않는다. 공개에 있어도 된다. 시드는 NULL.

#### `partners[]` — enabled이고 `organizationName`이 비어 있지 않은 행만

| 필드 | Platform |
|------|----------|
| `partnerId` | 1·2·3 (4번 빈 슬롯은 비활성 → 공개 배열에서 제외) |
| `organizationName` | alt·이름 |
| `logoUrl` | `http`/`https`만. 없거나 깨지면 프론트 로컬 SVG |
| `displayOrder` | 순서 |

빈 배열은 허용한다. 비활성 4번 슬롯을 넣지 마라.

---

## 2. Admin 응답 (바꾸지 말 것)

Admin GET은 공개와 다르다. 비활성 행·`version`·asset id를 **유지**한다.

| 화면 | 유지 |
|------|------|
| settings | `version`, `ogImage`/`favicon`의 `assetId`·`publicUrl`·`originalName` |
| gnb | 20메뉴 전부(비활성 포함), `enabled`, `version` |
| footer | 메뉴 7, 기관 싱글톤 `version`, 파트너 슬롯 4(4번은 비활성·이름 빈 값 허용) |

행 수를 늘리거나 줄이지 마라. GNB 20, 푸터 메뉴 7, 파트너 4.

---

## 3. 구현 체크

기존 site 공개 핸들러가 위 필터를 적용하는지 확인하라. 갭이 있으면 **공개 조회 필터만** 고쳐라.

예:

- 공개 GNB에 `enabled=false` 메뉴가 포함됨
- 공개 푸터 메뉴에 비활성 행이 포함됨
- 공개 파트너에 id 4(이름 없음·비활성)가 포함됨
- 공개 settings/gnb/footer에 `version`이 노출됨
- 공개 GNB `menus` 정렬이 `displayOrder`가 아님

OpenAPI 필드명을 바꾸지 마라.

---

## 4. 검증

```bash
curl -sS -o /tmp/site-settings.json -w '%{http_code}\n' \
  'http://localhost:8081/api/public/site/settings'
curl -sS -o /tmp/site-gnb.json -w '%{http_code}\n' \
  'http://localhost:8081/api/public/site/gnb'
curl -sS -o /tmp/site-footer.json -w '%{http_code}\n' \
  'http://localhost:8081/api/public/site/footer'
```

```bash
python3 - <<'PY'
import json

def unwrap(path):
    data = json.load(open(path))
    if isinstance(data, dict) and data.get('success') is True and 'data' in data:
        data = data['data']
    return data

settings = unwrap('/tmp/site-settings.json')
assert isinstance(settings, dict), 'settings'
for key in ('siteName', 'seoMetaDescription'):
    if key in settings:
        assert isinstance(settings[key], str), key
assert 'version' not in settings

gnb = unwrap('/tmp/site-gnb.json')
assert isinstance(gnb, list), 'gnb'
allowed_groups = {'JA_KOREA','IMPACT_STORY','EDUCATION','PARTICIPATION','SPONSORSHIP'}
for group in gnb:
    assert group.get('groupCode') in allowed_groups
    menus = group.get('menus') or []
    assert menus, group.get('groupCode')
    for menu in menus:
        assert menu.get('menuCode') and menu.get('displayName')
        assert menu.get('enabled') in (None, True)

footer = unwrap('/tmp/site-footer.json')
assert isinstance(footer, dict) and isinstance(footer.get('menus'), list)
allowed_menus = {
    'TERMS','PRIVACY','DIRECTIONS','NTS_DISCLOSURE',
    'NTS_EVASION_REPORT','DONATION','DONATION_RECEIPT',
}
for menu in footer['menus']:
    assert menu.get('menuCode') in allowed_menus
    assert menu.get('menuCode') != 'LOCAL_ONLINE_LEARNING'
for partner in footer.get('partners') or []:
    assert partner.get('organizationName','').strip()
    assert partner.get('partnerId') != 4 or partner.get('organizationName','').strip()
print('public site shape: ok')
PY
```

Admin JWT가 있으면 `GET /api/admin/site/gnb` 메뉴 수가 20인지, `GET /api/admin/site/footer` 파트너가 4인지 확인하라. 공개 배열은 그보다 짧을 수 있다.

---

## 5. 완료 후

시드 값은 **시드 문서**만 따른다. 이 API 문서에서 SQL·문구 시드를 넣지 마라.

## 회신 템플릿

```text
## 한 일
- 공개 필터: (변경 없음 / 수정한 조건)
- OpenAPI 필드명 변경: 없음

## 검증
- public settings/gnb/footer HTTP:
- public gnb에 enabled=false 없음:
- public footer menus에 온라인 학습관리 없음:
- public partners에 빈 4번 없음:
- admin gnb 20 / footer partner 4 유지:

## 하지 않은 일
- 프론트 수정 없음
- 시드 SQL 없음
- path 추가 없음

## 막힌 점
- (없으면 없음)
```

**Last updated:** 2026-09-26
