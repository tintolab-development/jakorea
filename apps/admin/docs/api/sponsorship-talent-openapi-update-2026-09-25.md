# OpenAPI 갱신 — 재능기부 (sponsorship talent)

**필요 여부:** talent path·`TalentApplication*` / `TalentSponsorship*` schema가 스냅샷에 **없으면 YES.**  
2026-09-25 이후 fetch·generate를 한 번 반영했다면 재실행은 백엔드 계약 변경 시에만.

**백엔드 준비됨 (2026-09-25):** 로컬 `:8081` Swagger에 talent path 12개·`Talent*` schema가 확인됨.  
FE 적용 오케스트레이션: [`sponsorship-talent-backend-ready-frontend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-backend-ready-frontend-cursor-prompt-2026-09-25.md)

관련 연동 프롬프트:  
[`sponsorship-talent-admin-frontend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-admin-frontend-cursor-prompt-2026-09-25.md)  
시드: [`sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md)

---

## 왜 갱신이 필요한가

| 항목 | 현재 Admin 스냅샷 | 백엔드(갱신 후) |
|------|-------------------|-----------------|
| `/api/admin/sponsorship/talent` | 없음 | 소개 get / banner·how·interview PUT |
| `/api/admin/sponsorship/talent-applications` | 없음 | 목록·상세·status·delete·첨부 |
| `/api/public/sponsorship/talent*` | 없음 | 공개 소개·신청·첨부 |
| OpenAPI schema 이름 | corporate만 `StatusUpdateRequest` 등 | talent는 `TalentApplication*` / `TalentSponsorship*` 접두사 |

스키마 이름이 겹치면 Orval이 corporate `StatusUpdateRequest`를 덮어 **`version`이 사라질 수 있다.**  
백엔드는 이미 `@Schema(name = "TalentApplicationStatusUpdateRequest")` 등으로 분리했다. **그 스펙을 fetch한 스냅샷만** 커밋한다.

---

## 전제

1. Homepage Admin 로컬 `:8081` 기동 (talent 컨트롤러·V21 마이그레이션 포함 브랜치).
2. `VITE_HOMEPAGE_API_SERVER=http://localhost:8081` (또는 fetch 스크립트 기본값).
3. Swagger UI에서 path 확인:  
   `/api/admin/sponsorship/talent`, `/api/admin/sponsorship/talent-applications`.

---

## 절차 (apps/admin)

```bash
pnpm --filter admin fetch:openapi
pnpm --filter admin generate:api
pnpm --filter admin typecheck
```

커밋 대상:

- `openapi/backend.openapi.json`
- `openapi/sponsorship.openapi.json`
- `src/shared/api/generated/sponsorship/**` (및 filter가 건드리는 관련 산출물)

---

## 검증 체크리스트

스냅샷 / generated 에서 전부 확인한다.

- [ ] path에 `talent` · `talent-applications` 가 있다.
- [ ] components/schemas 에 `TalentApplicationListItem`, `TalentApplicationDetailResponse`, `TalentApplicationStatusUpdateRequest`, `TalentApplicationAttachmentDownloadResponse` 가 있다.
- [ ] `TalentSponsorshipAdminResponse` / `TalentSponsorshipBannerResponse` 등이 있다.
- [ ] corporate `StatusUpdateRequest` 에 **`version` (required)** 가 그대로 있다.
- [ ] `TalentApplicationStatusUpdateRequest` 는 `{ status }` only (version 없음).
- [ ] enum wire: status `pending`|`confirmed`, gender `male`|`female`, jaParticipation `yes`|`no` (소문자).
- [ ] `pnpm --filter admin typecheck` pass.
- [ ] 기존 `corporate-consultation` mappers가 `StatusUpdateRequest.version` 때문에 깨지지 않는다.

실패 시: fetch한 스펙을 커밋하지 말고, 백엔드 `@Schema(name=…)` 고유 이름 반영 여부를 먼저 확인한다.

---

## Admin FE 코드와의 관계

갱신 **전**에는 `features/talent-donation-*/api` 가 hand-written `client.ts` / 로컬 `types` 로 path를 칠 수 있다.  
갱신 **후** 목표는 Orval `getJAKoreaHomepageAdminAPISponsorshipSubset()` + mappers로 옮기고, hand client는 제거하거나 thin wrapper만 남긴다.  
상세 매핑·capabilities는 연동 프롬프트를 따른다.

---

## 회신 (OpenAPI만 갱신할 때)

```text
## OpenAPI talent 갱신
- fetch 서버: (URL)
- talent path 포함: (yes/no)
- TalentApplication* / TalentSponsorship* schema: (yes/no)
- corporate StatusUpdateRequest.version 유지: (yes/no)
- typecheck: (pass/fail)
- 커밋 파일: (openapi + generated 목록)
```

**Last updated:** 2026-09-25
