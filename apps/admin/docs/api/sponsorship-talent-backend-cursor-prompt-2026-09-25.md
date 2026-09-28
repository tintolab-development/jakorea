# Cursor prompt — 재능기부 소개·신청 (JAHOMEADMINBACK)

아래 지시를 **홈페이지 어드민 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/sponsorship-talent-backend-cursor-prompt-2026-09-25.md`

확인 기준: 2026-09-25 Admin Orval sponsorship 클라이언트.  
`/api/public/sponsorship/personal`, `/api/public/sponsorship/corporate`, `/api/admin/sponsorship/corporate-consultations` 는 있다.  
재능기부(`talent`) path는 (이 프롬프트 작성 시점) Admin OpenAPI 스냅샷에 없다.

**구현 후 OpenAPI 계약 (필수):** record DTO에 `@Schema(name=…)` 로 고유 이름을 붙여라.  
예: `TalentApplicationStatusUpdateRequest`, `TalentApplicationListItem`, `TalentSponsorshipBannerResponse`.  
단순 클래스명 `StatusUpdateRequest` / `BannerResponse` / `ListItem` 을 그대로 쓰면 corporate OpenAPI·Orval을 덮어쓴다.  
FE 재생성 문서: `apps/admin/docs/api/sponsorship-talent-openapi-update-2026-09-25.md`

개인후원·기업후원 안내·후원사·기업 상담은 이 작업 대상이 아니다.

---

## Goal

1. 재능기부 **소개**를 관리자가 저장하고, 로그인 없이 조회할 수 있게 한다.
2. 재능기부 **신청**을 로그인 없이 접수하고, 관리자가 목록·상세·확인·삭제할 수 있게 한다.
3. 로컬 DB에 소개 1건과 익명 신청 3건을 멱등 시드한다.

---

## Out of scope / 금지

- `personal_sponsorship_*`, `corporate_sponsorship_*`, `corporate_sponsor`, `corporate_consultation` 테이블 변경.
- `seed_sponsorship_personal_local.sql`
- `seed_sponsorship_corporate_guide_local.sql`
- `seed_sponsorship_corporate_sponsors_local.sql`
- `seed_sponsorship_corporate_consultations_local.sql`
- 위 개인·기업 path의 요청·응답 필드 추가·삭제·rename.
- 소개 화면에 없는 CTA 문구(`Grow together`, `재능기부 신청하기`)를 DB 필드로 만들기. 그 문구는 Platform 고정 카피다.
- 인터뷰에 임팩트 스토리 id를 지어 넣기. 시드의 `linkedStoryId`는 null.
- 배너·썸네일 파일 바이트 생성. 시드의 asset id는 null.
- 신청 더미에 실명·실전화번호·실이메일을 넣기.
- Platform·Admin 프론트 수정.

---

## 1. 소개

관리자 모델은 배너 1, 방법 카드 3, 인터뷰 2다. 카드 개수를 늘리거나 줄이지 마라.

### 관리자

관리자 JWT.

| 용도 | Method | Path |
|---|---|---|
| 소개 조회 | GET | `/api/admin/sponsorship/talent` |
| 배너 저장 | PUT | `/api/admin/sponsorship/talent/banner` |
| 방법 카드 저장 | PUT | `/api/admin/sponsorship/talent/how-items` |
| 인터뷰 1건 저장 | PUT | `/api/admin/sponsorship/talent/interviews/{slotId}` |

`slotId`는 `interview_01` 또는 `interview_02`만 허용한다.

조회 응답:

- `banner`: `mainText`, `subText`, `imageAssetId` (nullable), `version`
- `howItems`: 길이 3. 각 항목 `id` 1·2·3, `title`, `description`, `version`
- `interviews`: 길이 2. 각 항목 `id`, `mainText`, `subText`, `buttonLabel`, `linkedStoryId` (nullable), `version`
- `updatedAt`

저장 body는 해당 조각과 `version`만 받는다. version이 다르면 409. 이미지 업로드는 기존 homepage asset 준비·확정 흐름을 재사용하고, 이 문서에서 새 업로드 path를 만들지 마라. 배너 저장은 `imageAssetId`를 받을 수 있고 null이면 이미지를 비운다.

### 공개

로그인 없음.

`GET /api/public/sponsorship/talent`

관리자 조회와 같은 소개 필드를 내려라. `version`은 빼도 된다. 미저장이어도 시드가 있으면 200이다. 시드 전 빈 화면을 위해 배너 문구가 없으면 404가 아니라 빈 문자열과 빈 배열이 아닌 **시드와 같은 3·2 길이**를 유지하라. 로컬 시드 후에는 항상 카드 3, 인터뷰 2다.

---

## 2. 신청

Platform 신청 폼 필드가 SSOT다. 주소는 한 줄로 합치지 말고 `sido`, `sigungu`를 따로 저장하라.

### 공개 접수

로그인 없음.

첨부 없는 신청:

`POST /api/public/sponsorship/talent-applications`

첨부 있는 신청은 기업 상담과 같은 순서를 재사용하라.

- `POST /api/public/sponsorship/talent-applications/attachments/upload-requests`
- `POST /api/public/sponsorship/talent-applications/attachments/{assetId}/confirm`
- 그다음 신청 POST에 `attachmentAssetId`를 넣는다.

기업 상담 path(`/api/public/sponsorship/corporate-consultations/attachments/**`)를 재능기부 첨부에 재사용하지 마라.

요청 필드:

| 필드 | 규칙 |
|---|---|
| `name` | 필수 |
| `birthDate` | 필수, `YYYY-MM-DD` |
| `gender` | 필수, `male` 또는 `female` |
| `phone` | 필수 |
| `email` | 필수 |
| `affiliation` | 필수 |
| `sido` | 필수 |
| `sigungu` | 필수 |
| `periodStart` | 필수, `YYYY-MM-DD` |
| `periodEnd` | 필수, `YYYY-MM-DD`, `periodStart` 이상 |
| `bio` | 필수 |
| `talentIntro` | 필수 |
| `motivation` | 필수 |
| `jaParticipation` | 필수, `yes` 또는 `no` |
| `privacyAgreed` | 필수, `true`만 접수. `false`는 400 |
| `attachmentAssetId` | 선택. 없으면 첨부 없음 |

응답은 신청 id와 `status: pending`만 돌려라. 목록 전체를 돌려주지 마라.

### 관리자

관리자 JWT.

| 용도 | Method | Path |
|---|---|---|
| 목록 | GET | `/api/admin/sponsorship/talent-applications` |
| 상세 | GET | `/api/admin/sponsorship/talent-applications/{id}` |
| 확인 처리 | PATCH | `/api/admin/sponsorship/talent-applications/{id}/status` |
| 일괄 삭제 | DELETE | `/api/admin/sponsorship/talent-applications` |
| 첨부 다운로드 | GET | `/api/admin/sponsorship/talent-applications/{id}/attachment-download` |

목록 쿼리: `status` (`pending` \| `confirmed`), `applicantName`, `phone`, `email`, `jaParticipation` (`yes` \| `no`), `appliedFrom`, `appliedTo`, `confirmedFrom`, `confirmedTo`, `page`, `size`.  
목록 항목의 `phone`은 마스킹하라. 상세는 원문을 내려라.

상태 변경 body는 `status: confirmed`만 받는다. `pending`으로 되돌리지 마라. 이미 `confirmed`면 200으로 기존 값을 유지한다. `confirmedAt`, `confirmedByName`을 채운다.

삭제는 body에 id 배열. 없는 id는 무시하고 200.

첨부 다운로드 응답 형태는 `GET /api/admin/sponsorship/corporate-consultations/{id}/attachment-download`와 같게 하라. 첨부가 없으면 404.

---

## 3. 로컬 시드

**상세 SSOT (Platform 카피·개행·신청 3건):**  
[`sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md)

요약만 남긴다. 값이 충돌하면 **시드 전용 문서가 이긴다.**

스크립트 이름: `scripts/seed_sponsorship_talent_local.sql`  
시드 라벨: `platform-talent-donation-v1`  
로컬 DB만. 멱등. 같은 라벨이 있으면 소개 문구와 신청 3건을 그 라벨 범위에서 갱신하고, 라벨 밖 신청은 지우지 마라.

### 소개

배너 asset id는 null. **텍스트는 Platform `constants.ts` 줄바꿈을 `\n`으로 저장**한다. 한 줄로 합치지 마라.

- `mainText`: `당신의 경험이\n청소년의 가능성으로`
- `subText`: `현장에서 쌓은 지식과 경험은\n청소년에게 살아 있는 교육이 됩니다.\nJA Korea와 함께 청소년이 더 넓은 세상을 배우고,\n자신의 미래를 주도적으로 준비할 수 있도록\n여러분의 경험과 전문성을 나눠주세요.`

방법 카드:

| id | title | description |
|---|---|---|
| 1 | 교육 · 멘토링 | `전문 지식과 현장 경험을\n청소년의 눈높이에 맞춰 전합니다.` |
| 2 | 심사 · 자문 | `청소년의 아이디어와\n발표에 전문적인 피드백을 더합니다.` |
| 3 | 프로그램 운영 지원 | `교육 공간 제공, 네트워크 연결 등\n프로그램에 필요한 자원을 제공합니다.` |

인터뷰. `linkedStoryId` null. 썸네일 asset id null.

| id | mainText | subText | buttonLabel |
|---|---|---|---|
| interview_01 | `받은 기회를\n다음 세대에게 돌려주는 일` | 14년 전 JA에서 얻은 도전의 경험은 지금의 진로를 선택하는 데 큰 힘이 되었습니다. 이제는 멘토와 심사위원으로 돌아와 제가 받았던 자극과 응원을 후배들에게 전할 수 있어 뜻깊습니다. | 임민재님의 이야기 살펴보기 |
| interview_02 | `JA 네트워크 안에서\n함께 성장하는 경험` | 대학생 때 경제교육 봉사자로 JA Korea와 인연을 맺었습니다. 봉사활동을 통해 의사 표현에 자신감을 갖게 됐고, 사람들 앞에서 논리정연하게 이야기할 수 있는 리더십을 갖게 되었습니다. | 이대한님의 이야기 살펴보기 |

### 신청 3건

첨부 asset id는 null. `privacyAgreed`는 저장된 동의가 true인 행만. 전화는 `010-1000-0001`부터. 이메일은 `talent-seed-1@example.com` 형태. 이름은 `신청자1`, `신청자2`, `신청자3`.

| 이름 | status | gender | jaParticipation | sido | sigungu |
|---|---|---|---|---|---|
| 신청자1 | pending | male | yes | 서울특별시 | 마포구 |
| 신청자2 | pending | female | no | 경기도 | 성남시 |
| 신청자3 | confirmed | male | yes | 부산광역시 | 해운대구 |

`birthDate` `1990-01-01`, `periodStart` `2026-10-01`, `periodEnd` `2026-12-31`.  
`bio`, `talentIntro`, `motivation`은 각 1문장의 더미 문장. 실명 이력을 넣지 마라.  
`confirmed` 행만 `confirmedAt`을 채운다. `confirmedByName`은 `로컬시드`.

---

## Done when

- `GET /api/public/sponsorship/talent` 가 배너 문구(**개행 포함**), how 3, interview 2를 반환한다. asset id는 null이다.
- `POST /api/public/sponsorship/talent-applications` 에 `privacyAgreed: false`면 400이다.
- 같은 POST에 필수 필드를 채우고 `privacyAgreed: true`면 `pending` id가 반환된다.
- 관리자 목록에서 시드 3건이 보이고, 목록 전화는 마스킹된다.
- `PATCH .../status` 로 `confirmed`가 된다.
- 개인·기업 sponsorship 기존 GET 응답 필드는 이 작업 전과 같다.
- 시드 상세 검증은 `sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md` 회신 템플릿을 따른다.
