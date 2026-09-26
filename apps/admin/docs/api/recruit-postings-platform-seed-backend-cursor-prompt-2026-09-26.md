# Cursor prompt — 채용공고 Platform SSOT 시드 (JAHOMEADMINBACK)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 탐색하지 마라. 값·경로는 이 문서만 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/recruit-postings-platform-seed-backend-cursor-prompt-2026-09-26.md`

값의 기준은 Platform `MOCK_CAREER_JOBS` (`apps/platform/src/features/careers/lib/mock-data.ts`)다.  
Admin mock·공고 29건 더미는 SSOT가 아니다.

선행 합본: `recruit-platform-seed-backend-cursor-prompt-2026-09-25.md`  
이 문서와 공고 표가 다르면 **이 문서**를 따른다.

2026-09-26 로컬 확인: `GET /api/public/careers/postings` 가 `job-1` **1건만** 내려온다.  
Platform·Admin 목록이 비어 보이거나 mock과 어긋나는 이유가 이것이다. **공고 10건**을 다시 맞춘다.

안내(배너·문화·인터뷰)·인재 지원자·MinIO 바이트는 건드리지 마라.  
(안내는 `recruit-guide-platform-seed-backend-cursor-prompt-2026-09-26.md`)

---

## Goal

로컬/dev Homepage DB의 채용공고가 Platform `/about/careers` 채용공고 탭 mock과 같게 한다.

| 화면 | Admin | Public |
|------|-------|--------|
| 채용공고 | `GET /api/admin/careers/postings` · `PATCH .../{id}/visibility` · `DELETE` | `GET /api/public/careers/postings` |

완료 조건:

1. `external_key` `job-1`…`job-10` 이 아래 표와 **문자 단위 동일**한 `title`·`status`·`published_on` 을 갖는다.
2. 공개 API는 `is_public = true` 이고 status가 `RECRUITING` 또는 `RESULT` 인 행만 반환한다 → 기대 **4건** (`job-1`…`job-4`).
3. Admin 목록용으로 `author_name`, `recruit_start`, `recruit_end`, `created_at` 을 **채운다**.  
   (이전 지시의 NULL 유지는 폐기. Platform 공개 API 스키마에는 이 필드가 없어도 됨 — Admin list DTO만 사용.)
4. 시드는 **idempotent upsert** (`external_key`). TRUNCATE 금지. 관리자가 넣은 다른 공고는 지우지 마라.
5. **local/dev 전용.** prod Flyway·앱 기동이 이 SQL을 자동 실행하지 않는다.
6. Admin/Platform 프론트 파일은 수정하지 않는다.

---

## Out of scope / 금지

- 채용 안내 배너·문화·인터뷰 재시드
- 인재 지원자 INSERT
- 공고 이미지·첨부 컬럼 추가. Platform 공고 목록에는 이미지가 없다.
- `published_on`에 시각(`T00:00:00`)을 강제. 날짜만.
- Platform 라벨 `2026년 05월 08일` 을 DB에 넣기. DB는 `2026-05-08`.
- 공고 29건 반복 더미, 제목을 공지 시안으로 바꾸기
- list GET 필터 query·등록 PUT API 신규 (이번 작업은 시드만)

---

## 시드 규칙

스크립트: `scripts/seed_careers_postings_local.sql`  
없으면 만든다. 기존 `scripts/seed_careers_local.sql` 의 **공고 upsert 구간만** 이 표로 바꿔 실행해도 된다. 안내·지원자 구간은 실행하지 마라.

1. `external_key` 로 upsert. 없으면 INSERT, 있으면 title·status·published_on·is_public UPDATE.
2. `is_public = true`.
3. `version = 0` (컬럼이 있으면).
4. 스크립트를 두 번 실행해도 `job-%` 건수가 10에서 늘지 않는다.

```bash
docker exec -i jaback-postgres-1 \
  psql -U ja_cms -d ja_cms_local < scripts/seed_careers_postings_local.sql
```

---

## SEED_DATA

| external_key | status | title | published_on | author_name | recruit_start | recruit_end | created_at |
|--------------|--------|-------|--------------|-------------|---------------|-------------|------------|
| job-1 | RECRUITING | 교육사업팀 프로그램 매니저 채용 | 2026-05-08 | 홍길동 | 2026-05-08 | 2026-06-08 | 2026-05-07 12:00:32+09 |
| job-2 | RECRUITING | 마케팅·커뮤니케이션 담당자 채용 | 2026-04-22 | 홍길동 | 2026-04-22 | 2026-05-22 | 2026-04-21 12:00:32+09 |
| job-3 | RESULT | 디지털 콘텐츠 기획자 채용 — 서류 합격자 안내 | 2026-03-15 | 홍길동 | 2026-02-01 | 2026-03-01 | 2026-03-14 12:00:32+09 |
| job-4 | RESULT | 지역 파트너십 코디네이터 채용 — 최종 합격자 발표 | 2026-02-28 | 홍길동 | 2026-01-15 | 2026-02-15 | 2026-02-27 12:00:32+09 |
| job-5 | CLOSED | 경영지원팀 회계·총무 담당자 채용 | 2025-12-10 | 홍길동 | 2025-11-01 | 2025-12-01 | 2025-12-09 12:00:32+09 |
| job-6 | CLOSED | 자원봉사 운영 매니저 채용 | 2025-11-05 | 홍길동 | 2025-10-01 | 2025-11-01 | 2025-11-04 12:00:32+09 |
| job-7 | CLOSED | 2025 하반기 신입·경력 공개채용 | 2025-09-18 | 홍길동 | 2025-08-01 | 2025-09-15 | 2025-09-17 12:00:32+09 |
| job-8 | CLOSED | 교육 콘텐츠 에디터 채용 | 2025-08-01 | 홍길동 | 2025-07-01 | 2025-07-31 | 2025-07-31 12:00:32+09 |
| job-9 | CLOSED | IT·데이터 분석 담당자 채용 | 2025-06-20 | 홍길동 | 2025-05-20 | 2025-06-19 | 2025-06-19 12:00:32+09 |
| job-10 | CLOSED | 대외협력팀 어시스턴트 채용 | 2025-05-08 | 홍길동 | 2025-04-08 | 2025-05-07 | 2025-05-07 12:00:32+09 |

upsert 시 `author_name`·`recruit_start`·`recruit_end`·`created_at` 도 UPDATE한다.  
`recruit_start`/`recruit_end` 컬럼 타입은 **date** — 날짜만 넣는다. `created_at`은 timestamptz.

Platform 노출:

| status | statusLabel |
|--------|-------------|
| RECRUITING | 모집중 |
| RESULT | 결과발표 |
| CLOSED | 모집완료 (Admin만. 공개 API 제외) |

게시일 라벨은 FE가 `published_on` → `2026년 05월 08일` 로 만든다.

---

## 검증

```bash
curl -sS http://localhost:8081/api/public/careers/postings
```

기대:

- `items` 길이 **4**
- 첫 건(최신 게시일) `externalKey` `job-1`, `status` `RECRUITING`, `title` 위 표와 동일, `publishedOn` `2026-05-08`
- `CLOSED` 없음
- `authorName` / 모집기간 필드가 공개 스키마에 없어도 된다

```sql
SELECT external_key, status, title, published_on,
       author_name IS NULL AS author_null,
       recruit_start IS NULL AS recruit_null
FROM homepage.career_posting
WHERE external_key LIKE 'job-%'
ORDER BY external_key;
```

기대: 10행, author_null·recruit_null·created_null **전부 false**.

스크립트 2회 실행 후 `job-%` 건수가 그대로인지 확인하라.

---

## 회신 템플릿

```text
## 한 일
- 스크립트:
- 실행한 DB:

## 검증
- job-1..job-10 count:
- public items count / first externalKey:
- CLOSED in public:
- author/recruit null:

## 하지 않은 일
- 프론트 수정 없음
- 안내·지원자 시드 없음
- 이미지 업로드 없음
- API/DTO 변경 없음

## 막힌 점
- (없으면 없음)
```

**Last updated:** 2026-09-26
