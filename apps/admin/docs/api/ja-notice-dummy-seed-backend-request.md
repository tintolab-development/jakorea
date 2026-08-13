# JA Korea 공지사항 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `ja_notice` |
| **FE SSOT** | [`apps/admin/src/features/notices/api/store.ts`](../../src/features/notices/api/store.ts) `buildSeed` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_notices_local.sql` |

## 실행 (로컬)

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_ja_notices_local.sql
```

또는:

```bash
docker exec -i <postgres-container> \
  psql -U postgres -d jakorea < scripts/seed_ja_notices_local.sql
```

## FE → API/DB 매핑

| FE | API | DB |
|----|-----|-----|
| `isPublic` | `published` | `published` |
| `isPinned` | `pinned` | `pinned` |
| `publishedAt` | `publishAt` | `publish_at` (00/30분 정렬) |
| `title` | `title` | `title` |
| `contentMarkdown` | `body` (HTML) | `body` |
| `attachments[0]` | `attachmentAssetId` | `attachment_asset_id` (API 1건) |
| `authorName` | (create 시 principal) | `author_name` |
| `viewCount` | `viewCount` | `view_count` |
| `version` | `version` | `version` |

## 시드 12건

| # | published | pinned | 첨부 | 작성자 |
|---|-----------|--------|------|--------|
| 1 | true | true | Y | 홍길동 |
| 2–3 | true | true | N | 김지은 / 이준호 |
| 4 | true | false | Y | 홍길동 |
| 5 | true | false | N | 김지은 |
| 6 | **false** | false | N | 이준호 (비공개 샘플) |
| 7–11 | true | false | N | 순환 |
| 12 | **false** | false | N | 이준호 |

본문: FE markdown seed와 동일 문구를 HTML(`h2`/`p`)로 저장.

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.ja_notice` = 12
- [ ] `published=false` = 2 · `pinned=true` = 3 · attachment NOT NULL = 2
- [ ] Admin API 로그인 후 `/ja-korea/notices`에 동일 노출

**Last updated:** 2026-08-13
