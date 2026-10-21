# Platform 홈 셸 연동 순서

홈 **본문**(`GET /api/public/main` → `useHomeMain`)과 **사이트 셸**(전 페이지 GNB·푸터·공지·팝업)은 따로 연동한다.

띠배너는 홈 레이아웃 셸에 이미 있다 (`TopBannerStrip`, `layout === 'home'`). public `stripBanners[]`를 본문과 같은 쿼리로 소비한다. 배경색은 DB에 없으므로 FE 토큰을 유지한다.

## 현재

| 영역 | Platform | Admin / public | 이번 홈 연동 |
|------|----------|----------------|--------------|
| 홈 본문 (히어로·교육 제목·유튜브·실적·후원·소셜 레일) | `GET /api/public/main` | `/main/*` | **포함** |
| 홈 프로그램 카드 | `GET /api/portal/programs?page=0&size=8&sort=LATEST` (CMS `:8080`) | 최신순 최대 8 | **포함** (Homepage `education.programs` 미사용) |
| 상단 띠배너 | `TopBannerStrip` | `/main/strip-banners` · `stripBanners[]` | **포함** (홈 전용) |
| 팝업 | **UI 없음** | `/main/popups` · `popups[]` (동시 최대 4) | **제외** — DB 시드만 유지, 렌더하지 않음 |
| GNB | `GET /api/public/site/gnb` + [`header-config.ts`](../../src/widgets/layout/app-layout/header/header-config.ts) fallback | `/site/gnb` · `GET /api/public/site/gnb` | **포함** |
| 푸터 | `GET /api/public/site/footer` + [`footer.tsx`](../../src/widgets/layout/app-layout/footer.tsx) fallback. SNS·관련 사이트는 로컬 | `/site/footer` · `GET /api/public/site/footer` | **포함** |
| 사이트 OG/파비콘 | `GET /api/public/site/settings` → `SiteDocumentHead` | `/site/info` · `GET /api/public/site/settings` | **포함** |
| 공지 | 홈 미노출 (`/notices` 별도) | `/ja-korea/notices` · `GET /api/public/ja-korea/notices` | **제외** |

## 권장 다음 순서

1. **팝업** — 홈 전용 오버레이. public `popups[]`는 이미 `GET /api/public/main`에 실려 오므로 렌더러만 추가하면 된다. 기간·동시 4건·닫기(오늘 하루 보지 않기) UX를 먼저 정한다. Platform 기본 에셋은 없다.
2. **GNB** — `GET /api/public/site/gnb`. 라벨·순서·사용 여부는 원격, 경로는 `menu-routes` fallback. **연동됨.**
3. **푸터** — `GET /api/public/site/footer`. 메뉴 7 + 로컬 `온라인 학습관리`. 관련 사이트·SNS는 로컬. **연동됨.**
4. **사이트 설정** — `GET /api/public/site/settings` → 문서 헤드. **연동됨.**
5. **공지** — 홈 블록을 새로 넣을 때만. 지금은 `/notices` 목록만.

## 하지 말 것

- 홈 본문 연동 PR에 GNB·푸터·공지 매퍼를 같이 넣지 않는다.
- 팝업을 홈에 렌더하기 전에 Admin mock 이미지만으로 레이아웃을 확정하지 않는다.
- 띠배너를 GNB 연동 뒤로 미루지 않는다. 이미 홈 셸에 있다.

**Last updated:** 2026-09-20
