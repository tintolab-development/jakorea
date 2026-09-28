# Cursor prompt — 인재채용 지원 증빙서류 첨부 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·enum은 이 문서만 사용하라.

질문이 필요하면 스키마·권한·기존 Flyway·MinIO 정책이 값을 거부할 때만 하라.

---

## 배경 (2026-09-26 FE 기준)

이미 동작하는 계약:

| Method | Path | 상태 |
|--------|------|------|
| POST | `/api/public/careers/talent-applications` | **구현됨**. Platform이 연동 완료. body 필드·enum 유지 |
| GET | `/api/admin/careers/talent-applications` | **구현됨** (필터·`appliedAt` 포함) |
| PATCH | `/api/admin/careers/talent-applications/{id}/confirm` | **구현됨** |
| DELETE | `/api/admin/careers/talent-applications` | **구현됨** |

갭:

Platform `/about/careers` 인재 정보 등록 폼에 **증빙서류** 파일 선택이 있다.  
공개 create body에 **`attachmentAssetId`가 없고**, careers 전용 prepare/confirm·Admin 다운로드 path도 **없다**.  
그래서 FE는 파일을 UI에만 보여주고 **업로드·전송하지 않는다**.

참고 구현(재사용 패턴, path는 복사하지 말 것):

| 용도 | 재능기부 (기존) |
|------|----------------|
| prepare | `POST /api/public/sponsorship/talent-applications/attachments/upload-requests` |
| confirm | `POST /api/public/sponsorship/talent-applications/attachments/{assetId}/confirm` |
| create + asset | `POST .../talent-applications` + optional `attachmentAssetId` |
| admin download | `GET /api/admin/sponsorship/talent-applications/{id}/attachment-download` |

기업 상담·재능기부 attachment path를 **인재채용 첨부에 재사용하지 마라**. careers 전용 path를 새로 만든다.

---

## Goal

1. 공개 인재채용 지원에 **선택 첨부 1건**을 prepare → PUT → confirm → create 순으로 넣을 수 있다.
2. Admin이 첨부 있는 지원자의 **다운로드 URL**을 받을 수 있다.
3. 첨부 없는 기존 POST는 그대로 `201`이다.
4. OpenAPI(`/v3/api-docs`)에 새 path·필드가 반영된다.

---

## Out of scope / 금지

- 공개 create의 기존 필수 필드·enum 이름 변경 (`jobInterest` 등 wire **대문자** 유지).
- confirm/delete/list 필터 계약 변경.
- 지원자 **상세 GET** 신설(이번 범위 아님). 다운로드만 추가.
- 다중 첨부·필수 첨부 강제.
- Admin/Platform 프론트 수정.
- 재능기부·기업상담 attachment path에 careers asset purpose를 섞기.
- `privacyAgreed: false` 접수 허용.

---

## 1. 공개 첨부 — prepare / confirm

권한: **무토큰** (공개 POST와 동일).

### Prepare

`POST /api/public/careers/talent-applications/attachments/upload-requests`  
응답: **201**  
body / 응답 스키마는 재능기부와 **동일 형태**:

Request (`PrepareRequest`):

| 필드 | 필수 | 비고 |
|------|------|------|
| `originalName` | yes | max 255 |
| `contentType` | yes | max 100 |
| `sizeBytes` | no | int64 |

Response (`PrepareResponse`):

| 필드 | 비고 |
|------|------|
| `assetId` | |
| `version` | |
| `uploadToken` | |
| `method` | 보통 `PUT` |
| `uploadUrl` | MinIO(또는 동등) pre-signed |
| `requiredHeaders` | map, optional |
| `uploadUrlExpiresAt` / `capabilityExpiresAt` | optional |

asset purpose / owner 타입은 **careers talent application** 전용으로 구분하라.  
sponsorship talent asset과 id 공간을 공유해도 되지만, purpose 혼동으로 교차 confirm이 되면 안 된다.

허용 content-type·최대 size는 기존 sponsorship talent 첨부와 **같거나 더 엄격**하게.  
거부 시 **400**.

### Confirm

`POST /api/public/careers/talent-applications/attachments/{assetId}/confirm`  
응답: **200**

body (`ConfirmRequest`):

| 필드 | 필수 |
|------|------|
| `version` | yes |
| `uploadToken` | yes |

잘못된 token/version → 400/403/404 (기존 asset confirm과 동일 정책).

---

## 2. 공개 create — `attachmentAssetId` 추가

Path 유지: `POST /api/public/careers/talent-applications`  
응답: **201** `{ id, status: "PENDING" }`

### 유지 (변경 금지)

| 필드 | wire |
|------|------|
| `jobInterest` | `MANAGEMENT_PLANNING` \| `PR_DESIGN` \| `ACCOUNTING` \| `HR_ADMIN` \| `EDUCATION_OPS` \| `OTHER` |
| `name` `phone` `email` `addressRoad` | string |
| `addressDetail` `major` `educationInfo` `careerInfo` | optional |
| `educationLevel` | `HIGH_SCHOOL` \| `COLLEGE` \| `UNIVERSITY` \| `MASTER` \| `DOCTOR` \| `OTHER` |
| `schoolName` | required |
| `careerType` | `NEWBIE` \| `EXPERIENCED` |
| `privacyAgreed` | **true만**. false → 400 |

### 추가

| 필드 | 타입 | 필수 | 규칙 |
|------|------|------|------|
| `attachmentAssetId` | int64 | no | 없으면 첨부 없음. 있으면 **confirm 완료된 careers 첨부 asset**만. 미confirm·타 purpose·없는 id → **400** |

DB에 `attachment_asset_id`(nullable) 컬럼이 없으면 Flyway로 추가하라.  
기존 행은 null.

---

## 3. Admin 첨부 다운로드

`GET /api/admin/careers/talent-applications/{id}/attachment-download`  
권한: 목록과 동일 계열 (**PII_VIEW**). EDIT 불필요해도 된다(기존 목록과 맞춤).

응답 **200** — 재능기부와 동일 형태:

| 필드 | 비고 |
|------|------|
| `originalName` | |
| `downloadUrl` | 단기 URL |
| `expiresAt` | ISO instant |

첨부가 없으면 **404**.  
없는 지원자 id → **404**.

목록 item에 첨부 메타를 굳이 추가하지 마라(이번 범위 아님).  
다운로드 path만으로 Admin FE가 후속 연동한다.

---

## 4. OpenAPI

로컬 `/v3/api-docs`에 반영:

- 공개 prepare / confirm path
- create request에 `attachmentAssetId` (optional)
- Admin `attachment-download` path
- 스키마 재사용 가능: `PrepareRequest` / `PrepareResponse` / `ConfirmRequest`  
  다운로드 응답은 `TalentApplicationAttachmentDownloadResponse` 재사용 가능. careers 전용 이름으로 복제해도 된다.

operationId는 careers 쪽과 충돌만 없으면 된다.

---

## 5. 검증

```bash
# 1) 첨부 없이 기존과 동일
curl -sS -w "\n%{http_code}\n" -X POST 'http://localhost:8081/api/public/careers/talent-applications' \
  -H 'Content-Type: application/json' \
  -d '{
    "jobInterest":"EDUCATION_OPS",
    "name":"첨부없음",
    "phone":"01011112222",
    "email":"no-attach@example.com",
    "addressRoad":"서울시 중구",
    "educationLevel":"UNIVERSITY",
    "schoolName":"테스트대",
    "careerType":"NEWBIE",
    "privacyAgreed":true
  }'
# → 201, {"id":...,"status":"PENDING"}

# 2) prepare
curl -sS -w "\n%{http_code}\n" -X POST \
  'http://localhost:8081/api/public/careers/talent-applications/attachments/upload-requests' \
  -H 'Content-Type: application/json' \
  -d '{"originalName":"resume.pdf","contentType":"application/pdf","sizeBytes":1234}'
# → 201, assetId / uploadUrl / uploadToken / version

# 3) PUT uploadUrl (file body) → 2xx
# 4) confirm
curl -sS -w "\n%{http_code}\n" -X POST \
  "http://localhost:8081/api/public/careers/talent-applications/attachments/${ASSET_ID}/confirm" \
  -H 'Content-Type: application/json' \
  -d "{\"version\":${VERSION},\"uploadToken\":\"${TOKEN}\"}"

# 5) create with attachmentAssetId → 201
# 6) Admin JWT
curl -sS -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8081/api/admin/careers/talent-applications/${ID}/attachment-download"
# → 200 originalName + downloadUrl

# 7) 첨부 없는 id 의 download → 404
# 8) privacyAgreed:false → 400
# 9) 미confirm assetId 로 create → 400
# 10) sponsorship talent prepare assetId 를 careers create 에 넣으면 → 400
```

체크:

1. 첨부 없는 POST 회귀 없음  
2. careers prepare → confirm → create → admin download 한 사이클 성공  
3. sponsorship attachment path와 **교차 사용 불가**  
4. OpenAPI에 3 path(+ create 필드) 노출  
5. list/confirm/delete 기존 동작 유지  

---

## 6. FE 후속 (백엔드 완료 후 · 이 레포에서 하지 마라)

백엔드가 끝나면 **별도 프론트 채팅**에서:

1. Admin OpenAPI fetch → careers generate  
2. Platform `careers/api/client.ts` 에 prepare/confirm/upload 추가  
3. create body에 optional `attachmentAssetId`  
4. `TalentApplyForm` 이 선택 파일을 prepare→PUT→confirm 후 mutate  
5. (선택) Admin 인재채용 목록/상세에 첨부 다운로드 버튼  

---

## 회신 템플릿

```text
## 구현
- prepare/confirm path:
- create.attachmentAssetId:
- admin attachment-download:

## 검증
- 첨부 없는 POST 201:
- prepare→confirm→create→download:
- sponsorship asset 교차 400:
- 첨부 없는 download 404:

## OpenAPI
- /v3/api-docs 반영:

## 하지 않은 일
- 프론트 수정 없음
- list/confirm/delete 계약 변경 없음
```

**Last updated:** 2026-09-26
