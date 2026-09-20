# Platform 홈 셸 연동 순서

홈 **본문**(`GET /api/public/main` → `useHomeMain`)과 **사이트 셸**(전 페이지 GNB·푸터·공지·팝업)은 따로 연동한다.

띠배너는 홈 레이아웃 셸에 이미 있다 (`TopBannerStrip`, `layout === 'home'`). public `stripBanners[]`를 본문과 같은 쿼리로 소비한다. 배경색은 DB에 없으므로 FE 토큰을 유지한다.

## 현재

| 영역 | Platform | Admin / public | 이번 홈 연동 |
|------|----------|----------------|--------------|
| 홈 본문 (히어로·교육 제목·유튜브·실적·후원·소셜 레일) | `GET /api/public/main` | `/main/*` | **포함** |
| 홈 프로그램 카드 | `GET /api/portal/programs` (CMS `:8080`) | CMS 프로그램 | **포함** (Homepage `education.programs` 미사용) |
| 상단 띠배너 | `TopBannerStrip` | `/main/strip-banners` · `stripBanners[]` | **포함** (홈 전용) |
| 팝업 | **UI 없음** | `/main/popups` · `popups[]` (동시 최대 4) | **제외** — DB 시드만 유지, 렌더하지 않음 |
| GNB | [`header-config.ts`](../../src/widgets/layout/app-layout/header/header-config.ts) 하드코딩 | `/site/gnb` · `GET /api/public/site/gnb` | **제외** |
| 푸터 | [`footer.tsx`](../../src/widgets/layout/app-layout/footer.tsx) 주소·메뉴·유관로고 3 SVG. SNS `href="/"` | `/site/footer` · `GET /api/public/site/footer` | **제외** |
| 사이트 OG/파비콘 | 미연동 | `/site/info` · `GET /api/public/site/settings` | **제외** |
| 공지 | 홈 미노출 (`/notices` 별도) | `/ja-korea/notices` · `GET /api/public/ja-korea/notices` | **제외** |

## 권장 다음 순서

1. **팝업** — 홈 전용 오버레이. public `popups[]`는 이미 `GET /api/public/main`에 실려 오므로 렌더러만 추가하면 된다. 기간·동시 4건·닫기(오늘 하루 보지 않기) UX를 먼저 정한다. Platform 기본 에셋은 없다.
2. **GNB** — `GET /api/public/site/gnb`. Admin은 고정 20행의 하위명·사용여부·순서만. Platform `header-config` 트리·경로를 fallback SSOT로 두고 덮어쓴다. 홈 본문과 쿼리를 섞지 않는다.
3. **푸터** — `GET /api/public/site/footer`. 주소·메뉴·유관로고. Admin 시드 로고 4 vs Platform SVG 3 — 에셋 정책을 맞춘 뒤 연동. SNS는 홈 소셜 레일(`main_social_link`)과 출처가 다를 수 있다.
4. **사이트 설정** — OG/파비콘 `GET /api/public/site/settings`. 홈 본문과 무관.
5. **공지** — 홈 블록을 새로 넣을 때만. 지금은 `/notices` 목록만.

## 하지 말 것

- 홈 본문 연동 PR에 GNB·푸터·공지 매퍼를 같이 넣지 않는다.
- 팝업을 홈에 렌더하기 전에 Admin mock 이미지만으로 레이아웃을 확정하지 않는다.
- 띠배너를 GNB 연동 뒤로 미루지 않는다. 이미 홈 셸에 있다.

**Last updated:** 2026-09-20
