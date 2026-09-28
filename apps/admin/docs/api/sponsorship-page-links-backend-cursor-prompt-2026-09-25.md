# Cursor prompt — 후원 페이지 버튼 연결 (JAHOMEADMINBACK)

아래 지시를 **홈페이지 어드민 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/sponsorship-page-links-backend-cursor-prompt-2026-09-25.md`

Platform은 후원 하위 페이지의 버튼을 이미 연결했다.  
이 문서가 요청하는 새 API는 **재능기부 소개의 `linkedStoryId`를 공개 응답에 실어 주는 것**뿐이다.  
그 소개 API의 나머지 계약은 아래 문서를 그대로 따른다. 이 문서에서 그 계약을 다시 쓰지 마라.

`apps/admin/docs/api/sponsorship-talent-backend-cursor-prompt-2026-09-25.md`

확인 기준: 2026-09-25 Admin Orval sponsorship 클라이언트.

---

## Goal

1. `GET /api/public/sponsorship/talent` 인터뷰의 `linkedStoryId`를 저장된 값 그대로 내려, Platform이 `/impact/{id}`로 이동할 수 있게 한다.
2. 개인후원·기업후원·임팩트 스토리의 기존 공개 API는 필드 추가 없이 유지한다.

---

## Platform이 이미 호출하는 것

백엔드가 새로 만들 필요가 없다. 응답 필드명과 path를 바꾸지 마라.

| 화면 | Platform 동작 | 기존 API |
|---|---|---|
| 개인후원 투명경영 바로가기 | `/about/transparency` 내부 이동 | 없음 |
| 개인후원 성장 후원하기 | `donationUrl`이 `http` 또는 `https`일 때만 새 탭 | `GET /api/public/sponsorship/personal` 의 `donationUrl`, `donationButtonLabel` |
| 개인후원 임팩트 카드 | 공개 스토리 목록 앞 6건을 `/impact/{id}`로 이동 | `GET /api/public/impact-story/stories` |
| 기업후원 문의하기 | `/support/corporate/inquiry`에서 첨부 없이 접수 | `POST /api/public/sponsorship/corporate-consultations` |
| 재능기부 신청하기 | `/support/talent/apply` 내부 이동 | 신청 API는 재능기부 프롬프트 |

기업 문의 body는 다음만 보낸다. 첨부와 `linkUrl`은 보내지 않는다.

- `companyName`, `contactName`, `departmentTitle`, `contactPhone`, `consultationContent`
- `privacyConsent: true`

기존 첨부 path(`/api/public/sponsorship/corporate-consultations/attachments/**`)는 유지하라. 이 화면용으로 필드를 추가하거나 필수로 바꾸지 마라.

개인후원 응답에 임팩트 카드 id 배열을 추가하지 마라. Platform은 개인후원 응답이 아니라 공개 임팩트 스토리 목록을 쓴다.

`donationUrl`은 절대 URL이다. 상대 경로나 `javascript:`는 Platform이 열지 않는다.

---

## 재능기부 스토리 버튼

로그인 없음.

`GET /api/public/sponsorship/talent`

인터뷰 2건(`interview_01`, `interview_02`)마다 `linkedStoryId`를 내려라.

- 관리자가 스토리를 연결하지 않았으면 `null`. 시드도 `null`이다. id를 지어 넣지 마라.
- 값이 있으면 공개 임팩트 스토리 id와 같은 값이어야 한다. Platform은 `/impact/{linkedStoryId}`로 이동한다.
- 숫자 id는 JSON number로, 문자열 id는 원문 그대로 내려라. 다른 필드로 감싸지 마라.
- 소개 API의 배너·방법 카드·신청 API는 재능기부 프롬프트와 같다. 여기 적지 않은 path를 만들지 마라.

`linkedStoryId`가 `null`이면 Platform 버튼은 이동하지 않는다. 없는 스토리로 연결되는 placeholder id를 넣지 마라.

---

## Out of scope / 금지

- `personal_sponsorship_*`, `corporate_sponsorship_*`, `corporate_consultation` 스키마 변경.
- 개인후원 공개 응답에 `impactStoryIds` 또는 카드 href 추가.
- 기업 상담 생성 요청에 필수 첨부 추가.
- 재능기부 시드에 임팩트 스토리 id를 추측해서 넣기.
- Platform·Admin 프론트 수정.

---

## Done when

- `GET /api/public/sponsorship/personal` 의 `donationUrl` 필드명이 그대로다.
- `POST /api/public/sponsorship/corporate-consultations` 에 첨부 없는 body와 `privacyConsent: true`가 201 또는 기존 성공 코드로 접수된다.
- `GET /api/public/sponsorship/talent` 인터뷰에 `linkedStoryId`가 있고, 시드 값은 `null`이다.
- 관리자가 인터뷰에 공개 임팩트 스토리 id를 저장하면 같은 공개 GET이 그 id를 반환한다.
- 개인후원·기업후원 기존 공개 응답에 이 작업으로 필드가 늘지 않는다.
