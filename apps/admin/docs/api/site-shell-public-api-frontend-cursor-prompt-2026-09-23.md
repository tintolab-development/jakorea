# Cursor prompt — Platform 사이트 셸 public API 연동

아래 지시를 **프론트 레포(`jakorea`)의 `apps/platform`에서 실행**하라.  
백엔드 레포를 탐색하지 마라. 엔드포인트·JSON·쿼리키·금지 사항은 이 문서만 사용하라.  
`apps/admin`은 Admin 화면이 이미 `GET/PUT /api/admin/site/*`를 쓰면 **조회 확인만** 하고 store mock으로 되돌리지 마라.  
질문이 필요하면 스키마가 값을 거부할 때(없는 필드·고정 행 수)만 하라.

사람용 시드 값(이미 DB에 있음): `apps/admin/docs/api/site-management-seed-2026-09-23.md`  
이 프롬프트가 그 명세와 다르면 **이 프롬프트**를 따른다.

---

## Goal

사용자 홈 **사이트 셸**(문서 헤드 · GNB · 푸터)을 Homepage 공개 API로 연결한다.  
홈 본문 `GET /api/public/main`과 쿼리·매퍼를 섞지 않는다.

| 영역 | 지금 | 목표 |
|------|------|------|
| GNB | `header-config.ts` 하드코딩 | `GET /api/public/site/gnb` + menuCode→경로 fallback |
| 푸터 | `footer.tsx` 하드코딩 | `GET /api/public/site/footer` + 로컬 전용 항목 유지 |
| 사이트 정보 | 미연동 | `GET /api/public/site/settings` → title/description/og/favicon |

완료 조건:

1. AppLayout이 마운트된 모든 페이지에서 GNB·푸터가 API 라벨을 쓴다.
2. 네트워크 탭 기준 **페이지당 사이트 셸 요청은 최대 3개**(settings / gnb / footer)이고, 라우트 이동마다 재호출되지 않는다.
3. 실패·미설정 시 `header-config` / `footer.tsx` 로컬 값이 fallback이다. GNB가 빈 배열로 사라지지 않는다.
4. 백엔드·Admin OpenAPI를 수정하지 않는다.
5. 끝나면 아래 회신 템플릿으로 답한다.

로컬 Homepage: `:8081`. `isHomepageApiConfigured()`가 false면 요청하지 말고 fallback만 쓴다.

---

## Out of scope / 금지

- 새 Homepage 엔드포인트 요청, DTO 필드 추가, `href`를 GNB JSON에 넣어 달라고 하기.
- 푸터 8번째 `온라인 학습관리`를 API로 만들기. **로컬 고정 append**.
- 관련 사이트 7개 · SNS 3개를 API에서 읽기. **로컬 유지** (SNS `href`가 `/`여도 이번 범위에서 URL을 만들지 않음).
- `GET /api/public/main`에 사이트 셸을 편승시키거나, 홈 쿼리 옵션(1분 `refetchInterval`)을 셸에 복사하기.
- GNB/푸터 컴포넌트마다 `axios.get` 직접 호출. TanStack Query + 팩토리 키만.
- `queryKey` 문자열 리터럴 흩뿌리기 (`['gnb']`, `['site-gnb']` 금지).
- 라우트 `pathname`·로그인 여부·locale를 사이트 셸 queryKey에 넣기.
- 로그아웃 시 사이트 셸 캐시 삭제(아래 키 규칙).
- `refetchOnWindowFocus: true`, `refetchInterval` > 0 (셸은 홈 본문보다 정적).
- Admin mock(`JA KOREA`, `기관 소개`, `진로·취업`, 결과확인 미사용, 주소 괄호)을 Platform fallback으로 쓰기.

---

## 공개 API (인증 없음)

`skipAuth: true`, `skipRefresh: true`, `timeout: 8000`.  
응답이 `{ success, data }` 래퍼면 `data`를 unwrap. 홈 `fetchPublicMain`과 같은 클라이언트 패턴.

### `GET /api/public/site/settings`

```json
{
  "siteName": "JA Korea",
  "seoMetaDescription": "청소년들이 과학기술을 기반으로 …",
  "ogImageUrl": "http://localhost:9000/homepage-public/local/seed/site-og-placeholder.png",
  "faviconUrl": "http://localhost:9000/homepage-public/local/seed/site-favicon-placeholder.png"
}
```

문서 헤드에만 반영 (`document.title` / meta description / og / link[rel=icon]). 헤더 로고 텍스트를 이 값으로 바꾸지 않아도 된다.

### `GET /api/public/site/gnb`

enabled 메뉴만. 그룹에 enabled 메뉴가 없으면 그 그룹은 응답에 없다. **`href` 없음.**

```json
[
  {
    "groupCode": "JA_KOREA",
    "groupName": "JA Korea",
    "displayOrder": 1,
    "menus": [
      { "menuCode": "JA_ORGANIZATION", "displayName": "기관소개", "displayOrder": 1 }
    ]
  }
]
```

그룹 코드 고정: `JA_KOREA` · `IMPACT_STORY` · `EDUCATION` · `PARTICIPATION` · `SPONSORSHIP`.

### `GET /api/public/site/footer`

enabled 메뉴·파트너만. 파트너 4번 슬롯(disabled)은 **안 내려온다.**

```json
{
  "menus": [
    {
      "menuCode": "TERMS",
      "label": "이용약관",
      "linkType": "INTERNAL",
      "internalRouteCode": "TERMS",
      "externalUrl": null,
      "displayOrder": 1
    }
  ],
  "organization": {
    "organizationName": "사단법인 제이에이코리아",
    "organizationDescription": null,
    "address": "서울특별시 강서구 마곡중앙로 171 마곡나루역 프라이빗타워2차 714호",
    "postalCode": "07788",
    "representativeName": "이은형",
    "businessRegistrationNumber": "107-82-10367",
    "phone": "02-783-2367",
    "fax": "070-4275-5115",
    "email": "jakorea@jakorea.org",
    "logoUrl": "http://localhost:9000/…"
  },
  "partners": [
    { "partnerId": 1, "organizationName": "기획재정부", "logoUrl": "http://localhost:9000/…", "displayOrder": 1 }
  ]
}
```

`linkType`은 `INTERNAL` | `EXTERNAL`만.

Admin(참고, 이번 PR에서 호출 경로를 바꾸지 않음):

| 권한 | 메서드 | 경로 |
|------|--------|------|
| VIEW | GET | `/api/admin/site/settings` · `/gnb` · `/footer` |
| EDIT+PUBLISH | PUT | `/settings` · `/gnb`(menus **정확히 20**) · `/footer/menus`(**정확히 7**, label 변경 없음) · `/footer/organization` · `/footer/partners/{id}` · `/footer/partners/order`(**정확히 4**) |

사이트 셸은 always-live다. draft/publish 토글 없음.

---

## menuCode → 경로 (GNB fallback SSOT)

API는 경로를 주지 않는다. **로컬 맵이 href의 SSOT**다. 라벨·순서·사용여부는 API가 덮어쓴다.

| menuCode | href | 비고 |
|----------|------|------|
| JA_ORGANIZATION | `/about/introduction` | |
| JA_TRANSPARENCY | `/about/transparency` | |
| JA_PEOPLE | `/about/people` | |
| JA_DIRECTIONS | `/about/directions` | |
| JA_NOTICE | `/notices` | |
| JA_HISTORY | `/about/history` | |
| JA_RECRUIT | `/about/careers` | |
| IMPACT_STORY | `/impact` | 그룹에도 같은 href |
| EDU_CAREER | `/education/career` | |
| EDU_ECONOMY | `/education/finance` | |
| EDU_ENTREPRENEURSHIP | `/education/entrepreneurship` | |
| EDU_DIGITAL_LITERACY | `/education/digital-literacy` | |
| EDU_MATERIAL | `/education/textbooks` | |
| PARTICIPATION_APPLY | `/programs` | |
| PARTICIPATION_RESULT | `/results` | |
| PARTICIPATION_ONLINE | 없음 | `external: true`, URL 발명 금지 |
| PARTICIPATION_ALUMNI | 없음 | `external: true`, URL 발명 금지 |
| SPONSOR_PERSONAL | `/support/individual` | |
| SPONSOR_CORPORATE | `/support/corporate` | |
| SPONSOR_TALENT | `/support/talent` | |

알 수 없는 `menuCode` / `groupCode`는 **무시**. 그룹 전체를 버리지 말고 해당 행만 건너뛴다.

머지 규칙:

1. fallback 트리(현재 `navigationGroups`)를 뼈대로 둔다.
2. 원격 그룹은 `groupCode`로 매칭. `groupName`·`displayOrder`는 원격.
3. 원격 메뉴는 `menuCode`로 매칭. `displayName`·`displayOrder`는 원격. `href`/`external`은 fallback.
4. 원격에 없는 코드(disabled)는 그 행을 숨긴다.
5. 원격만 있고 fallback에 없는 코드는 숨긴다(카탈로그 확장 없음).

활성 탭(`getActiveNavigationItem`)은 기존 pathname 헬퍼를 유지하되, 표시 라벨은 원격 `groupName`을 쓴다.

---

## 푸터 매핑

| menuCode | 동작 |
|----------|------|
| TERMS | 기존 약관 모달. 없으면 버튼 no-op |
| PRIVACY | 기존 개인정보 모달 |
| DIRECTIONS | `Link` → `/about/directions` |
| NTS_DISCLOSURE / NTS_EVASION_REPORT / DONATION / DONATION_RECEIPT | `EXTERNAL`이면 `externalUrl`로 `target=_blank rel=noopener noreferrer`. url이 비면 클릭 no-op |

API 7개 뒤에 **로컬** `온라인 학습관리`를 그대로 붙인다.  
기관 한 줄: `organizationName` + 공백 + `address` (괄호를 FE에서 다시 넣지 않음).  
우편번호·대표·사업자번호·전화·팩스·이메일은 API 필드.  
유관로고: public `partners[]`만. 지금 시드는 3개. 4번째는 그리지 않음.  
`logoUrl` 404는 `<img onError>`로 기존 로컬 SVG. 원격 빈 배열이면 로고 줄만 비우고 mock 3개를 되살리지 않음(홈 스폰서와 동일: 성공+빈 목록은 빈 화면).

예외: **요청 실패·미호출**일 때만 현재 `footer.tsx` 로컬 파트너 3 SVG·주소를 fallback.

`organizationDescription`은 null이다. 문장을 지어 넣지 않음.

---

## React Query 키 (필수)

`apps/platform/src/shared/api/query-keys.ts`의 `platformQueryKeys`에만 추가한다.

```ts
site: {
  all: () => [...platformQueryKeys.all, 'site'] as const,
  /** GET /api/public/site/settings — Class B-shell */
  settings: () => [...platformQueryKeys.site.all(), 'settings'] as const,
  /** GET /api/public/site/gnb — Class B-shell */
  gnb: () => [...platformQueryKeys.site.all(), 'gnb'] as const,
  /** GET /api/public/site/footer — Class B-shell */
  footer: () => [...platformQueryKeys.site.all(), 'footer'] as const,
},
```

결과 키 예: `['platform', 'site', 'gnb']`.

| 하면 | 하지 말 것 |
|------|------------|
| `platformQueryKeys.site.gnb()`만 사용 | `'site-gnb'`, `['gnb', pathname]` |
| settings / gnb / footer를 **키 3개**로 분리 | 한 키에 3응답을 합치거나, 헤더/푸터별 다른 키 |
| `queryOptions`를 모듈에서 export하고 Header·Footer가 같은 옵션을 spread | 컴포넌트마다 다른 `staleTime` |
| 훅 이름은 `useSiteSettings` / `useSiteGnb` / `useSiteFooter` 한 세트 | HeaderDesktop·HeaderMobile이 각각 fetch 함수를 가짐 |

### 캐시 클래스 B-shell

홈 `publicMain`과 **값을 맞추되 interval은 빼다**.

| 옵션 | 값 | 이유 |
|------|-----|------|
| `staleTime` | `5 * 60_000` | 라우트 이동·리렌더에 재호출 없음 |
| `gcTime` | `30 * 60_000` | 레이아웃 언마운트 후 재진입 시 재사용 |
| `refetchOnWindowFocus` | `false` | 탭 왕복 과호출 방지 |
| `refetchOnReconnect` | `true` | 오프라인 복구 1회 |
| `refetchOnMount` | `true`(기본) | stale이면 마운트 시 1회. staleTime 안이면 0회 |
| `refetchInterval` | 쓰지 않음 | 홈 본문 1분 폴링을 셸에 복사 금지 |
| `retry` | 홈과 같이 최대 1회, 4xx는 0회 (`shouldRetryQuery` ∧ `failureCount < 1`) | |
| `retryDelay` | `400` | 홈과 동일 |
| `enabled` | `isHomepageApiConfigured()` | |

`placeholderData: keepPreviousData` 또는 이전 성공 데이터. 백그라운드 refetch 동안 GNB가 fallback으로 깜빡이지 않게 한다.

---

## 과호출 금지 (구현 체크리스트)

1. **구독은 레이아웃 한 번.** `AppLayout`(또는 Header/Footer가 레이아웃에만 있는 한)에서 훅을 쓴다. 페이지 컴포넌트·라우트 loader에서 같은 GET을 다시 하지 않는다.
2. **헤더 데스크톱 + 모바일**이 둘 다 GNB를 쓰면 **동일 `queryOptions`**. React Query가 in-flight를 합친다. `fetchQuery`를 두 번 수동 호출하지 마라.
3. **prefetch + useQuery**를 같이 쓸 거면 **완전 동일한 `queryOptions`**. prefetch만 다른 staleTime이면 즉시 두 번째 요청이 난다.
4. **`useEffect` → axios** 로 셸을 가져오지 마라.
5. settings는 `SiteDocumentHead` 한 곳에서만 subscribe. 페이지마다 `useSiteSettings` 남발 금지.
6. 홈 마운트가 `publicMain`을 1분마다 돌릴 때 **site 키를 invalidate하지 마라.**
7. 로그인/로그아웃이 `['platform']`을 `removeQueries`할 때 **`site`를 보존**한다. 지금 `clearAuthTokens`는 `queryKey[1] !== 'home'`만 남긴다. `home` **또는** `site`를 남기도록 고친다.

```ts
predicate: query => query.queryKey[1] !== 'home' && query.queryKey[1] !== 'site'
```

8. Strict Mode 개발 더블 마운트는 같은 키면 네트워크 1회여야 한다. 키가 다르면 2회이므로 키를 의심하라.
9. Devtools로 확인: `/` → `/about/introduction` → `/programs` 이동 시 settings/gnb/footer URL이 **추가되지 않음** (5분 내).
10. Admin(`apps/admin`): 푸터는 이미 `GET /api/admin/site/footer` 1회 번들(`footerQueryKeys.admin`). top-menus / org / logos로 **다시 쪼개지 마라.** PUT 성공 시 그 화면 키만 invalidate.

---

## 엣지케이스

| 상황 | 기대 |
|------|------|
| Homepage API 미설정 | 요청 0. fallback 트리 표시. `source: 'fallback'` |
| 첫 응답 전 | GNB/푸터는 fallback으로 레이아웃 유지(빈 헤더 금지). 헤드 메타는 기존 인덱스 HTML 유지 |
| 네트워크/5xx/타임아웃 | fallback. 토스트 남발 금지. 콘솔 error 1회면 충분 |
| 4xx | 재시도 없음. fallback |
| 성공 + 그룹/메뉴 `[]` | 빈 셸. fallback 트리를 되살리지 않음 (홈 목록과 동일: 성공은 원격이 SSOT) |
| 성공 + 일부 그룹만 | 있는 그룹만 표시. 없는 그룹은 숨김 |
| JSON 깨짐 / 배열이 아닌 gnb | 실패와 동일 → fallback |
| 알 수 없는 menuCode | 행 스킵 |
| `displayName` 공백 | 그 행 스킵 |
| PARTICIPATION_ONLINE / ALUMNI | 라벨만 표시, 클릭 시 이동 없음(현 header-config와 동일) |
| 푸터 INTERNAL + `externalUrl` null | 모달/내부 path. 빈 새 탭 금지 |
| 푸터 EXTERNAL + url 공백 | 버튼 no-op |
| 파트너 0개 (성공) | 유관로고 영역 빈 상태. mock 3개 복구 금지 |
| 파트너 logoUrl 404 | 해당 img만 로컬 SVG |
| settings URL 404 이미지 | favicon/og는 기존 정적 자산 유지 |
| `siteName` 빈 문자열 | 타이틀 fallback `JA Korea` |
| `organizationDescription` null | 렌더하지 않음 |
| 주소에 `(` 없음 | FE가 괄호를 넣지 않음 |
| 세 쿼리 중 하나만 실패 | 성공한 영역은 원격, 실패한 영역만 fallback. 한 실패가 세 영역을 무너뜨리지 않음 |
| 로그아웃 | site 캐시 유지. GNB가 재요청으로 깜빡이지 않음 |
| 로그인 | site 키 invalidate 하지 않음 (공개 데이터) |
| React Query 이미 있는 데이터 + 백그라운드 refetch 실패 | 화면은 이전 성공 데이터 유지 |

셀프체크(가능하면 `*.selfcheck.ts`):

- fallback 그룹 5, `JA_ORGANIZATION` href = `/about/introduction`
- overlay 시 `EDU_CAREER` 라벨이 원격 `진로·취업`이어도 href는 `/education/career`
- unknown code 무시
- 푸터 메뉴 7 + 로컬 8번째
- queryKey `['platform','site','gnb']` 동등

`package.json` test 스크립트에 selfcheck를 끼워 넣되, 홈/program selfcheck를 지우지 마라.

---

## 파일 가이드 (있으면 재사용)

- `apps/platform/src/shared/api/query-keys.ts`
- `apps/platform/src/shared/lib/auth-token.ts` (`clearAuthTokens` predicate)
- `apps/platform/src/widgets/layout/app-layout/header/header-config.ts` — fallback SSOT, 삭제 금지
- `apps/platform/src/widgets/layout/app-layout/header/header-desktop.tsx` · `header-mobile-menu.tsx`
- `apps/platform/src/widgets/layout/app-layout/footer.tsx`
- `apps/platform/src/widgets/layout/app-layout/app-layout.tsx`
- 신규 예: `apps/platform/src/features/site-shell/**` (types, client, hooks, map, fallback)
- 홈 참고만: `features/home/api/use-home-main.ts`, `docs/api/public-main-home-fallback.md`  
  셸 폴링/홈 매퍼 복사 금지. `docs/api/home-shell-integration-order.md`의 GNB·푸터·설정을 **이번 작업으로 포함**으로 고친다.

Admin: 시드 후 `/site/info` · `/site/gnb` · `/site/footer`가 `JA Korea` / `기관소개` / `결과 확인` 사용 / 주소 괄호 없음인지만 확인. 코드 변경이 필요 없으면 하지 마라.

---

## 검증

```bash
curl -s http://localhost:8081/api/public/site/settings
curl -s http://localhost:8081/api/public/site/gnb
curl -s http://localhost:8081/api/public/site/footer
```

브라우저:

1. 홈 진입 → Network에 위 3 URL 각 1회 (`/api/public/main`과 별개).
2. 다른 GNB 경로로 이동 → 위 3 URL 추가 호출 없음.
3. GNB 라벨: `기관소개`, `진로취업`, `경제금융`, `기업가 정신`, `결과 확인` 보임.
4. 푸터 주소에 `(` 없음. 메뉴 8개(API 7 + 온라인 학습관리). 유관로고 3.
5. Homepage 서버를 끄고 새로고침 → fallback GNB/푸터가 비지 않음.
6. 로그인 후 로그아웃 → gnb/footer가 즉시 다시 호출되지 않음(캐시 보존).

---

## 회신 템플릿

```text
## 한 일
- 파일:
- queryKey:
- clearAuthTokens site 보존: (예/아니오)

## 과호출
- AppLayout 최초: settings/gnb/footer 각 N회
- 라우트 이동 추가 호출: (0이어야 함)
- refetchInterval 없음: (예/아니오)

## 엣지
- 실패 시 fallback:
- 성공+빈 partners:
- unknown menuCode:
- 8번째 온라인 학습관리 로컬:

## 하지 않은 일
- 백엔드/OpenAPI 변경 없음
- 관련사이트·SNS API화 없음
- public/main 과 키 혼합 없음

## 막힌 점
- (없으면 없음)
```

**Last updated:** 2026-09-23
