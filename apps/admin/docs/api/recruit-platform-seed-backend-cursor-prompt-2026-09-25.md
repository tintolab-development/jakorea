# Cursor prompt — 채용 안내·공고·인재풀 (JAHOMEADMINBACK)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 탐색하지 마라. 값·경로는 이 문서만 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/recruit-platform-seed-backend-cursor-prompt-2026-09-25.md`

값의 기준은 Platform 채용 화면 상수다. Admin mock은 SSOT가 아니다.  
OpenAPI에 채용 path가 생기기 전에는 Admin·Platform 프론트가 remote를 켜지 않는다.

---

## Goal

로컬/dev Homepage DB에 채용 3화면 데이터를 둔다.

| 화면 | Admin | Public |
|------|-------|--------|
| 채용 안내 | `GET/PUT /api/admin/careers/guide` | `GET /api/public/careers/guide` |
| 채용공고 | `GET /api/admin/careers/postings` · `PATCH .../{id}/visibility` · `DELETE ...` (ids) | `GET /api/public/careers/postings` |
| 인재채용 | `GET /api/admin/careers/talent-applications` · `PATCH .../confirm` · `DELETE ...` | `POST /api/public/careers/talent-applications` |

등록·수정 본문 모달 계약은 이 문서에 없다. 목록·안내 시드·접수 POST만 만든다.

완료 조건:

1. 아래 표와 같은 안내·공고가 DB에 있다.
2. 인재 지원자 더미 행은 만들지 않는다.
3. 시드는 **idempotent**. 안내는 UPDATE. 공고는 Platform id(`job-1`…`job-10`)로 upsert. TRUNCATE 금지.
4. **local/dev 전용.** prod Flyway·앱 기동이 이 SQL을 자동 실행하지 않는다.
5. Admin/Platform 프론트 파일은 수정하지 않는다.

---

## Out of scope / 금지

- 공고 29건 반복 더미, 지원자 `홍길동` 시드
- 조직문화 행 추가·삭제. 4행 고정
- 인터뷰를 3건이 아닌 다른 제목으로 바꾸기
- 배너를 Unsplash URL로 두기
- 공고 작성자·모집 기간·작성일시에 값을 지어 넣기. NULL
- OpenAPI 없이 프론트 Orval을 돌리라고 요구하기

---

## 시드 규칙

스크립트: `scripts/seed_careers_local.sql`

1. 안내 싱글톤이 없으면 실패로 보고하고 INSERT하지 마라. 마이그레이션이 만든다.
2. 배너 이미지는 placeholder asset. `storage_key` `local/seed/careers-hero.png`, purpose `CAREERS_HERO`. 파일이 없으면 키만 연결한다.
3. 인터뷰 커버는 3행이 같은 asset. `storage_key` `local/seed/careers-story-metlife.png`, purpose `CAREERS_STORY`.
4. 공고 `external_key` `job-1`…`job-10` upsert. 없는 키만 INSERT, 있는 키는 제목·상태·게시일만 UPDATE. 관리자가 넣은 다른 공고는 지우지 마라.
5. 지원자 테이블은 비워 두지 말고, **새로 넣지 마라.**
6. 스크립트를 두 번 실행해도 공고 10건이 늘지 않는다.

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_careers_local.sql
```

---

## 값

### 안내 배너

| 필드 | 값 |
|------|-----|
| main_text | `가능성을 믿는 사람들이\n만드는 변화, 우리는 청소년의\n가능성을 믿습니다` |
| sub_text_ko | `신뢰와 존중을 바탕으로 함께 배우고 성장하며,\n그 가능성을 현실로 만들어갑니다.` |
| sub_text_en | `People who believe in young people, creating impact together through trust, partnership, and continuous learning.` |

`\n`은 실제 개행으로 저장한다.

### 조직문화 (순서 고정)

| order | code | label | title | description |
|-------|------|-------|-------|-------------|
| 1 | MAKE_AN_IMPACT | Make an Impact | 청소년의 성장이라는 공동의 목적을 향해 함께 나아갑니다 | 각자의 노력이 만드는 작은 변화가 더 큰 사회적 가치로 이어진다고 믿으며, 맡은 일에 책임감을 가지고 긍정적인 변화를 만들어갑니다. |
| 2 | KEEP_LEARNING | Keep Learning | 배움은 성장의 시작입니다 | 호기심을 가지고 새로운 것에 도전하며 끊임없이 배우고 더 나은 방법을 함께 찾아갑니다. |
| 3 | SPEAK_OPENLY | Speak Openly | 좋은 아이디어는 열린 소통에서 시작됩니다 | 신뢰와 정직을 바탕으로 자유롭게 의견을 나누며, 직급이나 역할에 관계없이 서로의 목소리에 귀 기울이고 더 나은 방향을 함께 만들어갑니다. |
| 4 | READY_TO_HELP | Ready to Help | 협력은 서로를 존중하는 마음에서 시작됩니다 | 다양한 의견에 귀 기울이고, 도움이 필요한 순간에는 기꺼이 손을 내밀며 함께 해결책을 찾아갑니다. |

### 직무 인터뷰 3

| order | story_key | title | year |
|-------|-----------|-------|------|
| 1 | story-metlife-2026 | 메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울 | 2026 |
| 2 | story-summer-camp | 청소년과 함께한 JA Korea 여름 캠프 이야기 | 2025 |
| 3 | story-volunteer-day | 임직원 봉사로 이어진 따뜻한 하루 | 2025 |

### 공고 10

`is_public = true`. `author_name`, `recruit_start`, `recruit_end`, `created_at` 은 NULL. `published_on` 은 날짜만.

| external_key | status | title | published_on |
|--------------|--------|-------|--------------|
| job-1 | RECRUITING | 교육사업팀 프로그램 매니저 채용 | 2026-05-08 |
| job-2 | RECRUITING | 마케팅·커뮤니케이션 담당자 채용 | 2026-04-22 |
| job-3 | RESULT | 디지털 콘텐츠 기획자 채용 — 서류 합격자 안내 | 2026-03-15 |
| job-4 | RESULT | 지역 파트너십 코디네이터 채용 — 최종 합격자 발표 | 2026-02-28 |
| job-5 | CLOSED | 경영지원팀 회계·총무 담당자 채용 | 2025-12-10 |
| job-6 | CLOSED | 자원봉사 운영 매니저 채용 | 2025-11-05 |
| job-7 | CLOSED | 2025 하반기 신입·경력 공개채용 | 2025-09-18 |
| job-8 | CLOSED | 교육 콘텐츠 에디터 채용 | 2025-08-01 |
| job-9 | CLOSED | IT·데이터 분석 담당자 채용 | 2025-06-20 |
| job-10 | CLOSED | 대외협력팀 어시스턴트 채용 | 2025-05-08 |

공개 `GET /api/public/careers/postings` 는 `is_public = true` 이고 status가 `RECRUITING` 또는 `RESULT` 인 행만 반환한다. `CLOSED` 는 Admin 목록에만 있다.

### 인재풀 POST

더미 INSERT 없음. 공개 접수가 받을 필드:

| 필드 | 값 |
|------|-----|
| job_interest | `MANAGEMENT_PLANNING` · `PR_DESIGN` · `ACCOUNTING` · `HR_ADMIN` · `EDUCATION_OPS` · `OTHER` |
| name, phone, email | 문자열 |
| address_road, address_detail | 문자열 |
| education_level | `HIGH_SCHOOL` · `COLLEGE` · `UNIVERSITY` · `MASTER` · `DOCTOR` · `OTHER` |
| school_name, major, education_info | 문자열 |
| career_type | `NEWBIE` · `EXPERIENCED` |
| career_info | 문자열 |
| privacy_agreed | true만 접수. false면 400 |

Admin 목록은 처리 상태 `PENDING` / `CONFIRMED`, 확인일시, 위 관심 직무·경력·연락처·이메일을 보여 준다. 목록의 전화·이메일은 마스킹하지 않고 원문을 준다. 마스킹은 Admin 프론트가 한다.

---

## 검증 SQL

```sql
SELECT main_text IS NOT NULL FROM homepage.career_guide WHERE id = 1;
SELECT count(*) FROM homepage.career_culture_item;
SELECT code, title FROM homepage.career_culture_item ORDER BY display_order;
SELECT count(*) FROM homepage.career_interview;
SELECT external_key, status, published_on, author_name IS NULL
FROM homepage.career_posting
WHERE external_key LIKE 'job-%'
ORDER BY external_key;
SELECT count(*) FROM homepage.career_talent_application;
```

기대:

- culture 4, 첫 code `MAKE_AN_IMPACT`
- interview 3
- posting external_key 10건, author_name IS NULL
- talent application 시드로 늘어나지 않음

```bash
curl -s http://localhost:8081/api/public/careers/guide
curl -s http://localhost:8081/api/public/careers/postings
```

공개 공고 응답에 `CLOSED` 가 없으면 된다.

---

## 회신 템플릿

```text
## 한 일
- 스크립트:
- 실행:

## 검증
- culture count / first code:
- interview count:
- posting job-1..job-10 / author null:
- talent application inserted:

## 하지 않은 일
- 프론트 수정 없음
- 지원자 더미 없음
- 공고 29건 더미 없음

## 막힌 점
- (없으면 없음)
```

**Last updated:** 2026-09-25
