# Cursor prompt — 인재채용 지원 상세 GET (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·enum은 이 문서만 사용하라.

질문이 필요하면 스키마·권한·기존 Flyway가 값을 거부할 때만 하라.

---

## 배경 (2026-09-26 FE 기준)

이미 동작하는 계약:

| Method | Path | 상태 |
|--------|------|------|
| POST | `/api/public/careers/talent-applications` | **구현됨**. body에 주소·학력·경력·동의·선택 `attachmentAssetId` |
| GET | `/api/admin/careers/talent-applications` | **구현됨**. 목록 item은 마스킹된 `name`/`phone`/`email`과 상태·직무·경력구분·일시·`version`만 |
| PATCH | `/api/admin/careers/talent-applications/{id}/confirm` | **구현됨** |
| DELETE | `/api/admin/careers/talent-applications` | **구현됨** |
| GET | `/api/admin/careers/talent-applications/{id}/attachment-download` | **구현됨** |

갭:

Admin 인재채용 신청 상세 모달은 목록에 없는 **원문 연락처·주소·학력·경력 본문·동의·확인자·첨부 파일명**이 필요하다.  
`GET /api/admin/careers/talent-applications/{id}` 는 **없다**.

참고 구현(재사용 패턴, path는 복사하지 말 것):

`GET /api/admin/sponsorship/talent-applications/{id}` → `TalentApplicationDetailResponse`  
(`privacyAgreed`, `confirmedByName`, `attachmentOriginalName`, 원문 연락처).

목록 item에 상세 필드를 추가하지 마라. 목록은 마스킹을 유지한다.

---

## Goal

1. Admin이 지원 1건의 **원문 상세**를 조회한다.
2. 없는 id는 **404**.
3. OpenAPI(`/v3/api-docs`)에 path·스키마가 반영된다.
4. 목록 `CareerTalentApplicationListItem` 필드는 바꾸지 않는다.

---

## Out of scope / 금지

- 목록 응답에 `addressRoad`, `educationInfo`, `careerInfo`, `phone` 원문, `email` 원문, `attachmentOriginalName`을 넣기.
- confirm / delete / list 필터 / attachment-download 계약 변경.
- 공개 create body·enum wire 이름 변경.
- Admin/Platform 프론트 수정.

---

## 1. 상세 조회

권한: 기존 admin 목록과 동일.

`GET /api/admin/careers/talent-applications/{id}`  
응답: **200** `CareerTalentApplicationDetailResponse`  
없음: **404**

| 필드 | 타입 | 비고 |
|------|------|------|
| `id` | int64 | |
| `status` | `PENDING` \| `CONFIRMED` | |
| `version` | int64 | confirm에 쓰는 값 |
| `jobInterest` | create와 동일 enum | |
| `name` | string | **원문**. 목록 마스킹과 다름 |
| `phone` | string | **원문** |
| `email` | string | **원문** |
| `addressRoad` | string | |
| `addressDetail` | string | 없으면 빈 문자열 또는 null |
| `educationLevel` | `HIGH_SCHOOL` \| `COLLEGE` \| `UNIVERSITY` \| `MASTER` \| `DOCTOR` \| `OTHER` | |
| `schoolName` | string | |
| `major` | string | 없으면 빈 문자열 또는 null |
| `educationInfo` | string | max 2000. 없으면 빈 문자열 |
| `careerType` | `NEWBIE` \| `EXPERIENCED` | |
| `careerInfo` | string | max 4000. 없으면 빈 문자열 |
| `privacyAgreed` | boolean | 저장된 값. create는 `true`만 허용 |
| `appliedAt` | date-time | |
| `confirmedAt` | date-time \| null | 미확인이면 null |
| `confirmedByName` | string \| null | 확인자 표시명. DB `confirmed_by`는 admin id이므로 계정 표시명으로 풀어 반환. 미확인이면 null |
| `attachmentOriginalName` | string \| null | 첨부 없으면 null. 다운로드 URL은 기존 attachment-download |

`attachmentAssetId`는 응답에 넣지 않는다. FE는 파일명만 보여주고 다운로드는 기존 path를 쓴다.

---

## 2. 완료 조건

- `GET /api/admin/careers/talent-applications/{id}` 가 OpenAPI에 있다.
- 존재하는 id는 위 필드를 반환하고, 연락처·이메일은 목록과 달리 원문이다.
- 없는 id는 404.
- `GET /api/admin/careers/talent-applications` item 스키마는 그대로다.
