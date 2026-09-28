# Cursor prompt — 재능기부 백엔드 완료 → Admin·Platform FE 적용

아래 지시를 **프론트 레포(`jakorea`)에서 실행**하라.  
`JAHOMEADMINBACK` 를 탐색·수정하지 마라. path·JSON·스키마·금지는 이 문서와 링크된 FE 프롬프트만 사용하라.

**백엔드 상태 (2026-09-25 로컬 `:8081` 검증 완료):**

| 항목 | 상태 |
|------|------|
| Flyway `V21__talent_sponsorship.sql` | 적용됨 |
| Admin / Public talent API | 라이브 (Swagger·curl 확인) |
| OpenAPI `@Schema(name=Talent…)` 고유 이름 | 반영됨 (corporate 덮어쓰기 방지) |
| 로컬 시드 `platform-talent-donation-v1` | 개행(`\n`) 포함 · 신청 3건 |
| 개인·기업 sponsorship 계약 | 변경 없음 |

이 문서는 **적용 순서 오케스트레이션**이다. 화면별 상세 매핑은 기존 FE 프롬프트를 따른다.

---

## 적용 순서 (필수)

```text
1) OpenAPI fetch·generate   ← 스냅샷에 talent 없으면 여기서 막힘
2) Admin FE 연동            ← apps/admin
3) Platform FE 연동         ← apps/platform (Admin과 병렬 가능, OpenAPI 이후)
```

| 단계 | 문서 | 앱 |
|------|------|-----|
| 1 | [`sponsorship-talent-openapi-update-2026-09-25.md`](./sponsorship-talent-openapi-update-2026-09-25.md) | `apps/admin` |
| 2 | [`sponsorship-talent-admin-frontend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-admin-frontend-cursor-prompt-2026-09-25.md) | `apps/admin` |
| 3 | [`../platform` 문서](../../../platform/docs/api/sponsorship-talent-platform-frontend-cursor-prompt-2026-09-25.md) | `apps/platform` |

한 채팅에서 Admin+Platform을 같이 하지 말고, **OpenAPI → Admin** 또는 **OpenAPI → Platform** 중 하나로 좁혀라.  
질문이 필요하면 Orval 생성 타입이 이 문서·연동 프롬프트와 충돌할 때만 하라.

---

## 1) OpenAPI 갱신 (필수 · YES)

**필요 여부: YES** — Admin 스냅샷에 talent path가 없으면 Orval에 타입이 없다.  
로컬 Homepage `:8081` 이 talent 컨트롤러를 띄운 상태에서 fetch한다.

```bash
# 전제: Homepage bootRun local, VITE_HOMEPAGE_API_SERVER=http://localhost:8081
pnpm --filter admin fetch:openapi
pnpm --filter admin generate:api
pnpm --filter admin typecheck
```

### 스냅샷에 들어와야 하는 path (12)

**Admin**

| Method | Path |
|--------|------|
| GET | `/api/admin/sponsorship/talent` |
| PUT | `/api/admin/sponsorship/talent/banner` |
| PUT | `/api/admin/sponsorship/talent/how-items` |
| PUT | `/api/admin/sponsorship/talent/interviews/{slotId}` |
| GET | `/api/admin/sponsorship/talent-applications` |
| DELETE | `/api/admin/sponsorship/talent-applications` |
| GET | `/api/admin/sponsorship/talent-applications/{id}` |
| PATCH | `/api/admin/sponsorship/talent-applications/{id}/status` |
| GET | `/api/admin/sponsorship/talent-applications/{id}/attachment-download` |

**Public**

| Method | Path |
|--------|------|
| GET | `/api/public/sponsorship/talent` |
| POST | `/api/public/sponsorship/talent-applications` |
| POST | `/api/public/sponsorship/talent-applications/attachments/upload-requests` |
| POST | `/api/public/sponsorship/talent-applications/attachments/{assetId}/confirm` |

### components/schemas — Talent 전용 (덮어쓰기 방지용 이름)

반드시 아래 **접두사** 이름이 있어야 한다. 단순 `StatusUpdateRequest` / `BannerResponse` / `ListItem` 으로 talent가 들어오면 **커밋하지 말고 중단**.

| Schema | 용도 |
|--------|------|
| `TalentSponsorshipAdminResponse` | Admin 소개 조회 |
| `TalentSponsorshipBannerResponse` / `TalentSponsorshipBannerUpdateRequest` | 배너 |
| `TalentSponsorshipHowItemResponse` / `TalentSponsorshipHowItemUpdate` / `TalentSponsorshipHowItemsUpdateRequest` | 방법 카드 3 |
| `TalentSponsorshipInterviewResponse` / `TalentSponsorshipInterviewUpdateRequest` | 인터뷰 slot |
| `TalentSponsorshipPublicResponse` (+ PublicBanner/How/Interview) | 공개 소개 |
| `TalentApplicationCreateRequest` / `TalentApplicationCreateResponse` | 공개 신청 |
| `TalentApplicationListItem` | 목록 (phone 마스킹) |
| `PageResponseTalentApplicationListItem` | `{ items, totalCount, page, size, totalPages }` |
| `TalentApplicationDetailResponse` | 상세 (PII 원문) |
| `TalentApplicationStatusUpdateRequest` | `{ status }` only — **version 없음** |
| `TalentApplicationAttachmentDownloadResponse` | `{ originalName, downloadUrl, expiresAt }` |

### 첨부 prepare/confirm 스키마 이름 (주의)

라이브 OpenAPI에서 talent 첨부 body는 corporate와 동일 레코드 재사용으로:

- `PrepareRequest` / `PrepareResponse`
- `ConfirmRequest` / `ConfirmResponse`

path는 **talent 전용**이다. corporate-consultations attachments URL을 재능기부에 재사용하지 마라.  
response HTTP: prepare `201`, confirm `200` (빈 body일 수 있음 — generated 타입 확인).

### corporate 회귀 가드 (실패 시 즉시 중단)

- corporate `StatusUpdateRequest` 에 **`version` (required)** 가 그대로 있다.
- `TalentApplicationStatusUpdateRequest` 는 `{ status: "confirmed" }` only.
- 기존 `corporate-consultation` mappers / typecheck가 깨지면 fetch 스펙을 커밋하지 마라.

커밋 대상 (OpenAPI 단계):

- `apps/admin/openapi/backend.openapi.json`
- `apps/admin/openapi/sponsorship.openapi.json`
- `apps/admin/src/shared/api/generated/sponsorship/**` (및 filter가 건드리는 산출물)

상세 체크리스트: [`sponsorship-talent-openapi-update-2026-09-25.md`](./sponsorship-talent-openapi-update-2026-09-25.md)

---

## 2) Admin FE (`apps/admin`)

OpenAPI 통과 후 [`sponsorship-talent-admin-frontend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-admin-frontend-cursor-prompt-2026-09-25.md) 전체를 실행하라.

요약만:

| feature | remote |
|---------|--------|
| `talent-donation-intro` | GET talent + PUT banner / how-items / interviews/{slotId} |
| `talent-donation-application` | list·detail·status·delete·attachment-download |

- `shouldUseHomepageRemoteApi()` 기준. remote on이면 localStorage mock 금지.
- Orval `getJAKoreaHomepageAdminAPISponsorshipSubset()` + feature mappers. UI에서 generated import 금지.
- enum wire **소문자**: `pending`\|`confirmed`, `male`\|`female`, `yes`\|`no`.
- 목록 `phone` 마스킹 · 상세만 원문 (`HOMEPAGE_PII_VIEW`).
- status PATCH는 `confirmed`만. pending 되돌리기 없음.
- `slotId`는 `interview_01` \| `interview_02`만.
- how-items는 **항상 길이 3** (id 1·2·3).

권한: 목록 VIEW · 상세/첨부 PII_VIEW · 상태/삭제 EDIT · 소개 저장 EDIT+PUBLISH.

---

## 3) Platform FE (`apps/platform`)

[`sponsorship-talent-platform-frontend-cursor-prompt-2026-09-25.md`](../../../platform/docs/api/sponsorship-talent-platform-frontend-cursor-prompt-2026-09-25.md) 실행.

요약만:

| 화면 | API |
|------|-----|
| `/support/talent` | `GET /api/public/sponsorship/talent` |
| `/support/talent/apply` | 첨부 prepare→S3 PUT→confirm → `POST .../talent-applications` |

- `isHomepageApiConfigured()` 일 때만 remote. 실패·미설정 시 `constants.ts` fallback.
- 배너·how·interview 문구에 **실제 개행**이 온다. `splitPublicTextLines`로 줄바꿈 유지.
- CTA(`Grow together`, `재능기부 신청하기` 등)는 API에 없음 — constants 고정.
- `privacyAgreed: true`만 접수. false는 400.
- 주소는 `sido` + `sigungu` 분리. 한 줄로 합치지 마라.
- 첨부 path는 talent 전용. corporate attachments 재사용 금지.

---

## 로컬 시드 (FE 검증용 · 백엔드 이미 적용됨)

라벨: `platform-talent-donation-v1`  
스크립트 (백엔드 레포): `scripts/seed_sponsorship_talent_local.sql`  
재적용 예 (JABACK Postgres):

```bash
docker exec -i jaback-postgres-1 \
  psql -U ja_cms -d ja_cms_local < scripts/seed_sponsorship_talent_local.sql
```

기대:

- `GET /api/public/sponsorship/talent` → banner 개행 유지, how 3, interview 2, `imageAssetId` non-null (시드 배너), linkedStoryId null
- Admin 목록 → 시드 신청 **3건** (pending 2 / confirmed 1), phone `010-****-000x`
- Admin 소개 → `banner.imageAssetId` 로 MinIO `local/seed/sponsorship/talent-banner.png` 해석
- CTA·히어로 라벨은 DB에 없음

시드 배너 원본: Platform `talent-donation/image/hero-image.png` → `local/seed/sponsorship/talent-banner.png` (MinIO upload via `scripts/upload_local_seed_minio.py`)

시드 SSOT: [`sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md)

---

## Out of scope / 금지

- `JAHOMEADMINBACK` 수정, Flyway·시드·DTO 변경 요청
- 개인·기업 sponsorship path/필드 변경
- corporate `StatusUpdateRequest` 와 talent status body 혼용
- talent 첨부에 corporate-consultations attachments URL 사용
- CTA·섹션 타이틀을 API 필드로 추가 요청
- UI에서 `@/shared/api/generated/**` 직접 import

---

## 수동 스모크 (OpenAPI·연동 후)

```bash
curl -s http://localhost:8081/api/public/sponsorship/talent | head
# Admin JWT 필요:
# GET /api/admin/sponsorship/talent
# GET /api/admin/sponsorship/talent-applications?page=0&size=20
```

- [ ] public banner `mainText`에 개행
- [ ] Admin 소개 how 3 / interview 2
- [ ] Admin 신청 시드 3건 · 목록 전화 마스킹
- [ ] `pnpm --filter admin typecheck` (및 Platform 작업 시 `pnpm --filter platform typecheck`)
- [ ] corporate consultation status 업데이트(version) 회귀 없음

---

## 회신 템플릿

```text
## 재능기부 FE 적용
- OpenAPI talent path: (yes/no)
- TalentApplication* / TalentSponsorship* schema: (yes/no)
- corporate StatusUpdateRequest.version 유지: (yes/no)
- Admin intro remote: (연동/미완)
- Admin applications remote: (연동/미완)
- Platform intro GET: (연동/fallback)
- Platform apply POST+첨부: (연동/미완)
- typecheck admin / platform: (pass/fail)
```

**Last updated:** 2026-09-25 (backend ready · seed newlines verified)
