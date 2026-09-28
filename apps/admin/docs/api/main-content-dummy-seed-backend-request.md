# 메인 콘텐츠 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **갱신** | 2026-09-20 — YouTube URL·후원 CTA path를 Platform 홈 기준으로 맞춤 |
| **대상** | Homepage Admin `main_*_content_setting` (+ 대표 스토리용 `impact_story`) |
| **FE SSOT** | Platform 홈 [`mock.ts` / `fallback.ts`](../../../platform/src/features/home/lib/mock.ts) · 요청서 [platform-home-public-main-seed-backend-request.md](./platform-home-public-main-seed-backend-request.md) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_main_content_local.sql` |

## 실행 (로컬)

```bash
# Postgres (docker 예: jakorea-postgres / 컨테이너명 확인 후)
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_main_content_local.sql
```

또는 컨테이너 안:

```bash
docker exec -i <postgres-container> \
  psql -U postgres -d jakorea < scripts/seed_main_content_local.sql
```

## FE → API/DB 매핑

| FE | API | DB |
|----|-----|-----|
| `education.title` | `EducationUpdateRequest.title` | `main_education_content_setting.title` |
| `impactStory.title` | `ImpactUpdateRequest.title` | `main_impact_content_setting.title` |
| `impactStory.youtubeUrl` | `youtubeUrl` | `youtube_url` |
| `impactStory.featuredContentId` | `featuredStoryId` | `featured_story_id` |
| `performance.metrics[network].value` | `networkDistributionCount` | `network_distribution_count` |
| `performance.metrics[partners].value` | `partnerOrganizationCount` | `partner_organization_count` |
| `performance.metrics[volunteers].value` | `educatorCount` | `educator_count` |
| `performance.metrics[beneficiaries].value` | `youthBeneficiaryCount` | `youth_beneficiary_count` |
| `performance.bottomText` | `bottomText` | `bottom_text` |
| `donation.cta1.label` / `linkUrl` | `cta1Label` / `cta1Url` | `cta1_label` / `cta1_url` |
| `donation.cta2.label` / `linkUrl` | `cta2Label` / `cta2Url` | `cta2_label` / `cta2_url` |

단위 문자열(`지역+`, `개+`, `명+`, `여명`)은 FE 표시 전용 — DB/API에는 숫자만 저장.

## 시드 요약

| 섹션 | 핵심 값 |
|------|---------|
| 교육 | title `새로운 배움이 기다리고 있어요` |
| 임팩트 | title(줄바꿈 포함) + **`https://www.youtube.com/watch?v=ts_hit5wXqg`** + 대표 스토리 1건 + **실 커버 PNG** |
| 실적 | counts `200 / 1000 / 3000 / 90000` + bottom_text |
| 정기후원 | CTA 2개. 라벨은 Platform과 동일. URL은 `https://www.jakorea.org/support/individual` · `/support/corporate` (mrm 외부 URL 폐기). Platform 매퍼가 내부 path로 정규화 |
| 임팩트 스토리 | 대표 1건만 public main. 홈 서브카드 3건은 스토리 목록 API |

Admin mock YouTube(`https://youtu.be/sJYCV5yMa9M?...`)는 **DB 시드에 쓰지 않는다**.

## 완료 기준

- [ ] `main_education_content_setting.title` = Platform fallback
- [ ] `main_impact_content_setting.youtube_url` = `https://www.youtube.com/watch?v=ts_hit5wXqg`
- [ ] `main_performance_content_setting` counts = 200 / 1000 / 3000 / 90000
- [ ] `main_impact_content_setting.featured_story_id` NOT NULL
- [ ] 대표 스토리 `IMPACT_STORY_ATTACHMENT` 실파일 (placeholder PNG 금지). `publicUrl`은 브라우저가 여는 주소(`:9000` MinIO 직접 URL 금지)
- [ ] Admin API 로그인 후 `/main/contents`에 동일 노출

커버만 다시 올릴 때 백엔드 붙여넣기: [platform-home-featured-story-cover-backend-cursor-prompt-2026-09-20.md](./platform-home-featured-story-cover-backend-cursor-prompt-2026-09-20.md)

**Last updated:** 2026-09-20
