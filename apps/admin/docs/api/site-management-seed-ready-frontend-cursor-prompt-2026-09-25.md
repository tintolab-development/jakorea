# Cursor prompt — 사이트 관리 시드 반영 확인 (FE)

아래 지시를 **프론트 레포(`jakorea`)에서 실행**하라.  
`JAHOMEADMINBACK` 를 수정하지 마라.

**백엔드 상태 (2026-09-25 로컬 `:8081` 검증 완료):** 사이트 정보·GNB·푸터 시드를 Platform SSOT로 다시 적용했다. path·DTO·스키마는 바꾸지 않았다.

값 SSOT: [`site-management-seed-2026-09-23.md`](./site-management-seed-2026-09-23.md)  
연동 규칙(이미 구현된 경우 재작성 금지): [`site-shell-public-api-frontend-cursor-prompt-2026-09-23.md`](./site-shell-public-api-frontend-cursor-prompt-2026-09-23.md)

---

## OpenAPI

**갱신 필요: NO.**

- 추가·삭제·rename된 path 없음.
- schema 이름·필드 변경 없음.
- `pnpm --filter admin fetch:openapi` / `generate:api` 를 **하지 마라.**
- 스냅샷에 `/api/admin/site` · `/api/public/site` 가 없을 때만 기존 `orval-codegen.md`의 `site` filter로 fetch한다. 그 경우에도 corporate/talent 스키마를 같이 건드리지 마라.

---

## FE 코드 수정

**기본: 수정하지 않는다.** Admin·Platform이 이미 아래 GET을 쓰면 브라우저 새로고침(쿼리 캐시 무효)만 하면 된다.

| 앱 | 확인 |
|----|------|
| Admin | `GET /api/admin/site/settings` · `/gnb` · `/footer` (JWT) |
| Platform | `GET /api/public/site/settings` · `/gnb` · `/footer` |

remote가 켜져 있으면 store mock / `header-config` / `footer.tsx` 하드코딩을 화면에 쓰지 마라. mock으로 되돌리지 마라.

로컬 Homepage가 꺼져 fallback만 보일 때는 fallback 문구가 아래와 같아야 한다. 옛 값이면 **fallback 카피만** 고친다. API 클라이언트·OpenAPI·백엔드는 건드리지 마라.

| 옛 값 (쓰지 말 것) | 현재 값 |
|--------------------|---------|
| `JA KOREA` | `JA Korea` |
| `기관 소개` | `기관소개` |
| `진로·취업` | `진로취업` |
| `경제·금융` | `경제금융` |
| `기업가정신` | `기업가 정신` |
| 결과 확인 미사용 | `PARTICIPATION_RESULT` enabled, 라벨 `결과 확인` |
| 주소 `(마곡나루역 …)` | 괄호 없는 주소 |

---

## 화면에 보여야 하는 값

- `siteName` = `JA Korea`
- GNB 20, 위 라벨, `결과 확인` 포함
- 푸터 메뉴 7. `온라인 학습관리`는 API에 없고 Platform 로컬 append
- 기관 `organizationDescription` 없음, 주소에 `(` 없음
- 공개 푸터 파트너 3 (슬롯 4는 Admin에서만 disabled)

---

## Out of scope / 금지

- OpenAPI fetch/generate (site path가 스냅샷에 이미 있을 때)
- 백엔드·DTO·시드 SQL 수정
- 메뉴 행 추가·삭제, 푸터 8번째를 API 필드로 요청
- 관련 사이트 7 · SNS 3 를 API로 옮기기
- OG/파비콘/로고 실파일 교체

---

## 회신 템플릿

```text
## 사이트 관리 시드 FE
- OpenAPI 갱신: no
- Admin remote 조회가 SSOT와 같음: (yes/no)
- Platform public 조회가 SSOT와 같음: (yes/no)
- fallback 카피 수정: (없음 / 파일)
- typecheck: (해당 없음 / pass/fail)
```

**Last updated:** 2026-09-25
