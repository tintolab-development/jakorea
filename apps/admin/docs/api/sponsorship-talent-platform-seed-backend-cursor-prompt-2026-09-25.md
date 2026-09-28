# Cursor prompt — 재능기부 Platform mock DB 시드 (JAHOMEADMINBACK)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서의 `SEED_DATA`가 SSOT**다.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md`

선행 API 계약:  
[`sponsorship-talent-backend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-backend-cursor-prompt-2026-09-25.md)

FE 카피 원본(참고만, 시드 값은 이 문서 JSON이 이긴다):  
`apps/platform/src/features/talent-donation/lib/constants.ts`

---

## Goal

Platform 「재능기부」소개·신청이 공개 API로 **Platform 상수와 같은 문구**를 보도록 local/dev DB를 맞춘다.  
Admin JWT CRUD path는 이미 있다. 이번 작업은 **시드만**.

완료 조건:

1. 무토큰 `GET /api/public/sponsorship/talent`
   - `banner.mainText` / `banner.subText` 가 아래 JSON과 **문자 단위 동일** (개행 `\n` 포함)
   - `howItems` 길이 **3**, id `1`·`2`·`3`
   - `interviews` 길이 **2**, id `interview_01`·`interview_02`
   - `banner.imageAssetId` · 인터뷰 `linkedStoryId` 는 **null**
2. 관리자 JWT `GET /api/admin/sponsorship/talent-applications?page=0&size=20`
   - 시드 라벨 범위 신청 **3건**이 보인다
   - 목록 `phone`은 마스킹
3. 시드는 **idempotent**. `seedLabel=platform-talent-donation-v1`. 다시 돌려도 소개 1세트·신청 3건을 넘지 않는다.
4. **local/dev 전용.** prod Flyway에 넣지 마라. 앱 기동·repeatable이 이 SQL을 자동 재실행하지 않는다.

---

## Out of scope / 금지

- `personal_sponsorship_*`, `corporate_sponsorship_*`, `corporate_sponsor`, `corporate_consultation` 변경
- Admin/Platform 프론트 수정
- 배너·첨부 **파일 바이트** 생성. asset id는 null
- 인터뷰에 임팩트 스토리 id를 지어 넣기 (`linkedStoryId` null)
- CTA 문구(`Grow together`, `재능기부 신청하기`)를 DB 필드로 만들기 — Platform 고정 카피
- 신청 더미에 실명·실전화·실이메일
- TRUNCATE
- Admin FE localStorage mock 문구를 이 시드 기준으로 맞추라고 백엔드가 요구하지 마라

---

## 구현 순서

1. 기존 local seed 패턴을 재사용한다. 새 시드 프레임워크를 만들지 마라.
2. 스크립트: `scripts/seed_sponsorship_talent_local.sql`
3. 순서: 소개(배너·how 3·interview 2) → 신청 3건 upsert
4. `seedLabel=platform-talent-donation-v1` 범위만 갱신한다. 라벨 밖 신청·수동 소개 수정은 지우지 마라.
5. 텍스트 컬럼에 **JSON의 `\n`을 실제 개행으로 저장**한다. 한 줄로 합치지 마라. Platform이 줄바꿈으로 렌더한다.
6. how `description`·인터뷰 `mainText`도 `\n`을 유지한다.

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_sponsorship_talent_local.sql
```

(compose DB 이름·유저가 다르면 레포 README에 맞춘다.)

---

## 검증 curl

무토큰:

```text
GET /api/public/sponsorship/talent
```

관리자 JWT:

```text
GET /api/admin/sponsorship/talent
GET /api/admin/sponsorship/talent-applications?page=0&size=20
GET /api/admin/sponsorship/talent-applications?status=pending
GET /api/admin/sponsorship/talent-applications?status=confirmed
```

공개 응답에서 `banner.mainText`에 개행이 있고, how 3·interview 2가 JSON과 같으면 통과다.

---

## SEED_DATA

### 소개

```json
{
  "seedLabel": "platform-talent-donation-v1",
  "banner": {
    "mainText": "당신의 경험이\n청소년의 가능성으로",
    "subText": "현장에서 쌓은 지식과 경험은\n청소년에게 살아 있는 교육이 됩니다.\nJA Korea와 함께 청소년이 더 넓은 세상을 배우고,\n자신의 미래를 주도적으로 준비할 수 있도록\n여러분의 경험과 전문성을 나눠주세요.",
    "imageAssetId": null
  },
  "howItems": [
    {
      "id": 1,
      "title": "교육 · 멘토링",
      "description": "전문 지식과 현장 경험을\n청소년의 눈높이에 맞춰 전합니다."
    },
    {
      "id": 2,
      "title": "심사 · 자문",
      "description": "청소년의 아이디어와\n발표에 전문적인 피드백을 더합니다."
    },
    {
      "id": 3,
      "title": "프로그램 운영 지원",
      "description": "교육 공간 제공, 네트워크 연결 등\n프로그램에 필요한 자원을 제공합니다."
    }
  ],
  "interviews": [
    {
      "id": "interview_01",
      "mainText": "받은 기회를\n다음 세대에게 돌려주는 일",
      "subText": "14년 전 JA에서 얻은 도전의 경험은 지금의 진로를 선택하는 데 큰 힘이 되었습니다. 이제는 멘토와 심사위원으로 돌아와 제가 받았던 자극과 응원을 후배들에게 전할 수 있어 뜻깊습니다.",
      "buttonLabel": "임민재님의 이야기 살펴보기",
      "linkedStoryId": null
    },
    {
      "id": "interview_02",
      "mainText": "JA 네트워크 안에서\n함께 성장하는 경험",
      "subText": "대학생 때 경제교육 봉사자로 JA Korea와 인연을 맺었습니다. 봉사활동을 통해 의사 표현에 자신감을 갖게 됐고, 사람들 앞에서 논리정연하게 이야기할 수 있는 리더십을 갖게 되었습니다.",
      "buttonLabel": "이대한님의 이야기 살펴보기",
      "linkedStoryId": null
    }
  ]
}
```

### 신청 3건

첨부 asset id null. `privacyAgreed` true만.

공통:

| 필드 | 값 |
|------|-----|
| `birthDate` | `1990-01-01` |
| `periodStart` | `2026-10-01` |
| `periodEnd` | `2026-12-31` |
| `affiliation` | `시드소속` |
| `bio` | `시드용 자기소개입니다.` |
| `talentIntro` | `시드용 재능 소개입니다.` |
| `motivation` | `시드용 지원 동기입니다.` |

| seedKey | name | status | gender | jaParticipation | phone | email | sido | sigungu |
|---------|------|--------|--------|-----------------|-------|-------|------|---------|
| `talent-app-1` | `신청자1` | `pending` | `male` | `yes` | `010-1000-0001` | `talent-seed-1@example.com` | `서울특별시` | `마포구` |
| `talent-app-2` | `신청자2` | `pending` | `female` | `no` | `010-1000-0002` | `talent-seed-2@example.com` | `경기도` | `성남시` |
| `talent-app-3` | `신청자3` | `confirmed` | `male` | `yes` | `010-1000-0003` | `talent-seed-3@example.com` | `부산광역시` | `해운대구` |

`confirmed` 행만 `confirmedAt`을 채운다. `confirmedByName` = `로컬시드`.  
`seedKey`(또는 동등 unique)가 같으면 위 값으로 갱신한다.

---

## Platform 고정 카피 (DB에 넣지 마라)

| 위치 | 문구 |
|------|------|
| CTA eyebrow | `Grow together` |
| CTA title | `재능을 나눈 작은 실천` / `지금 시작해보세요.` |
| CTA button | `재능기부 신청하기` |
| methods section title | `JA와 함께하는 방법` |
| stories eyebrow | `재능기부가 만드는 변화를 만나보세요` |
| hero label | `재능기부` |

---

## 회신 템플릿

```text
## 재능기부 Platform 시드
- 스크립트: (경로)
- seedLabel: platform-talent-donation-v1
- 공개 GET banner 개행 유지: (yes/no)
- how 3 / interview 2: (yes/no)
- 신청 3건: (pending 2 / confirmed 1)
- 수동 검증 curl: (통과/실패)
```

**Last updated:** 2026-09-25
