# CMS 파일 업로드 프론트 연동 현황 — 백엔드 전달

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-07 |
| 대상 | JABACK 파일 업로드 (Admin Files) |
| 목적 | FE가 가이드 기준으로 **1~4단계**를 붙였으니, 실서버에서 전체 Flow가 도는지 함께 확인 |
| 우선순위 | **P0** — 업로드 전체 Flow 정상 동작 확인 (보안/정책 고도화는 후순위) |
| FE 코드 | `apps/cms/src/shared/lib/admin-file-upload/` · `apps/cms/src/features/user/api/upload-consent-evidence-file.ts` |

---

## 1. 한 줄 요약

프론트는 파일을 Backend로 `multipart/form-data`로 보내지 않습니다.  
**Upload Request → S3 Presigned PUT → Confirm → 상태 조회(`CLEAN` + `AVAILABLE`)** 순서로 구현했습니다.

현재 **실 API를 타는 첫 화면**은 CMS **성범죄 경력조회 동의서 첨부**입니다.

이번 단계에서 FE가 기대하는 완료 조건:

```text
파일 선택
→ POST /api/admin/files/upload-requests 성공
→ PUT {uploadUrl} 2xx
→ POST /api/admin/files/{fileObjectId}/confirm 성공
→ GET /api/admin/files/{fileObjectId}
→ scanStatus = CLEAN
→ uploadStatus = AVAILABLE
```

여기까지 되면 프론트 ↔ JABACK 파일 업로드 연동은 정상으로 봅니다.

---

## 2. FE가 구현한 호출 순서

```text
1. SHA-256 계산 (브라우저 Web Crypto, hex 소문자)
2. POST /api/admin/files/upload-requests
3. PUT {uploadUrl}          ← Backend API 아님. S3 직접 호출
4. POST /api/admin/files/{fileObjectId}/confirm
5. GET  /api/admin/files/{fileObjectId}  (2초 간격, 최대 30회)
```

최종 성공 판단:

```text
scanStatus = CLEAN
uploadStatus = AVAILABLE
```

Confirm 성공만으로는 업로드 완료로 처리하지 않습니다.

실패로 처리하는 상태:

```text
scanStatus = INFECTED | FAILED
uploadStatus = QUARANTINED
```

`PENDING_SCAN`이 60초(2초 × 30회)를 넘으면 FE는 `파일 검사 대기 시간 초과`로 실패합니다.  
이 경우 **프론트 업로드 구간(1~4)은 성공한 것**으로 보고, Worker / SQS / Scanner / Callback을 확인해 주세요.

---

## 3. 요청/응답 계약 (FE 실제 전송값)

### 3.1 Upload Request

```http
POST /api/admin/files/upload-requests
Authorization: Bearer {accessToken}
Content-Type: application/json
Idempotency-Key: {uuid}
```

```json
{
  "ownerDomain": "MEMBER",
  "ownerType": "CONSENT",
  "ownerId": 1001,
  "privacyLevel": "SENSITIVE",
  "originalFileName": "crime-consent.png",
  "contentType": "image/png",
  "fileSize": 204800,
  "checksumSha256": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
}
```

| 필드 | FE 동작 |
|------|---------|
| `checksumSha256` | **항상 전송**. SHA-256 hex **소문자**, padding 포함 64자 |
| `Idempotency-Key` | 요청마다 `crypto.randomUUID()` |
| `contentType` | `file.type`이 비면 `application/octet-stream` |
| `fileSize` | `file.size` (byte) |

FE가 기대하는 응답:

```json
{
  "fileObjectId": "101",
  "uploadUrl": "https://s3-presigned-url...",
  "method": "PUT",
  "expiresAt": "2026-09-07T10:00:00Z",
  "requiredHeaders": {
    "Content-Type": "application/pdf",
    "x-amz-meta-checksum-sha256": "SHA256_VALUE"
  },
  "confirmPath": "/api/admin/files/101/confirm"
}
```

`fileObjectId`는 **string / number 모두** 파싱합니다.  
공통 envelope `{ "success": true, "data": { ... } }` 도 unwrap 합니다.

필수 응답 필드: `fileObjectId`, `uploadUrl`.  
`requiredHeaders`, `method`, `confirmPath`는 있으면 그대로 사용하고, 없으면 아래 fallback입니다.

- `method` 없음 → `PUT`
- `confirmPath` 없음 → `/api/admin/files/{fileObjectId}/confirm`
- `requiredHeaders` 없음 → 헤더 없이 PUT (서명 실패 가능)

### 3.2 S3 PUT

```http
PUT {uploadUrl}
```

- Body: 원본 `File`
- Header: **`requiredHeaders`만 그대로 사용**
- **관리자 `Authorization`을 붙이지 않습니다**
- `requiredHeaders`에 없는 `Content-Type`을 FE가 임의로 추가하지 않습니다

S3 응답은 **2xx만 성공**으로 봅니다(S3는 200 또는 204를 줄 수 있음). 그 외는 `S3 파일 업로드 실패: {status}` 입니다.

브라우저 PUT 구현 (`uploadToS3`):

- `fetch({uploadUrl})` 직접 호출. **axios / 관리자 JWT / cookie 없음** (`credentials: 'omit'`)
- `requiredHeaders`를 plain object로 **그대로** 전달. 키 추가·삭제·값 변경 없음
- 파일 MIME이 서명 `Content-Type`과 다르면 body만 같은 type의 `Blob`으로 맞춤 (헤더는 응답값 유지)
- CORS/네트워크 `TypeError` → `S3 파일 업로드 요청이 실패했습니다. Presigned URL CORS 또는 네트워크를 확인해 주세요.`
- `POST /upload-requests` 200은 Presigned 발급일 뿐이며, 이 PUT이 끝나기 전에는 confirm을 호출하지 않습니다.

2026-09-07 BE 확인: fileObjectId 1·2는 `scanStatus=PENDING_UPLOAD`, `uploadStatus=PREPARED`이고 S3 객체 0건. **실패 구간은 2번 PUT** (confirm 미도달).

### 3.3 Confirm

```http
POST /api/admin/files/{fileObjectId}/confirm
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```json
{
  "fileSize": 204800,
  "checksumSha256": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  "contentType": "image/png"
}
```

`fileSize` / `checksumSha256` / `contentType`은 **upload-requests와 동일한 값**입니다.

### 3.4 상태 조회

```http
GET /api/admin/files/{fileObjectId}
Authorization: Bearer {accessToken}
```

기대 필드: `fileObjectId`, `scanStatus`, `uploadStatus`.

---

## 4. 1차 실연동 화면 (성범죄 동의서)

CMS 회원 등록/상세의 **성범죄 경력조회 동의서 첨부**가 첫 실호출입니다.

| 항목 | 값 |
|------|-----|
| `ownerDomain` | `MEMBER` |
| `ownerType` | `CONSENT` |
| `privacyLevel` | `SENSITIVE` |
| `ownerId` (회원 있음) | 해당 `memberId` |
| `ownerId` (회원 생성 전) | `GET /api/public/terms-documents/CRIMINAL_HISTORY_CHECK_CONSENT/current` 의 문서 `id` |

권한: 관리자 JWT + **`FILE_UPLOAD`**.

재현 경로:

1. CMS 로그인 (FILE_UPLOAD 있는 계정)
2. 회원 신규 등록 또는 회원 상세
3. 약관 및 동의 → 성범죄 경력조회 동의서 작성 → 파일 첨부/제출

---

## 5. 합동 테스트 체크리스트

BE 스테이징에서 아래를 같이 확인해 주세요.

### 필수

- [ ] `POST /api/admin/files/upload-requests` 200
- [ ] `fileObjectId` 응답
- [ ] `uploadUrl` 응답
- [ ] `requiredHeaders` 응답 (최소 `Content-Type`, 체크섬 메타 쓰면 해당 키)
- [ ] Presigned URL로 S3 PUT 2xx
- [ ] S3 PUT에 관리자 JWT가 **없음**
- [ ] `POST /api/admin/files/{id}/confirm` 200
- [ ] `GET /api/admin/files/{id}` 200
- [ ] `scanStatus = CLEAN`
- [ ] `uploadStatus = AVAILABLE`

### 테스트 계정/환경 요청

아래를 FE에 알려 주시면 바로 실호출합니다.

1. CMS가 붙는 **API Base URL** (스테이징)
2. `FILE_UPLOAD` 권한이 있는 **관리자 계정**
3. S3 CORS에 CMS 프론트 origin이 허용돼 있는지
4. Scanner가 스테이징에서 실제로 돌아가는지 (안 돌면 `PENDING_SCAN`에서 FE 타임아웃)
5. 성범죄 약관 문서 `CRIMINAL_HISTORY_CHECK_CONSENT` **current 게시본** 존재 여부

---

## 6. 실패 구간 책임 구분

이슈가 나면 **어느 hop에서 끊겼는지** 먼저 구분해 주세요.

| CASE | 증상 | 구간 | 우선 확인 |
|------|------|------|-----------|
| 1 | `upload-requests` 4xx/5xx | FE → Backend | Authorization, `FILE_UPLOAD`, body (`ownerDomain`/`ownerType`/`ownerId`/`fileSize`/`contentType`/`checksumSha256`) |
| 2 | request는 성공, S3 PUT 실패 | FE → S3 | URL 만료, `requiredHeaders` 누락/변형, Content-Type, **CORS**, Presigned URL 변조 |
| 3 | S3 PUT 성공, confirm 실패 | FE → Backend | confirm의 `fileSize`/`checksumSha256`/`contentType`/`fileObjectId`가 request와 동일한지 |
| 4 | confirm 성공 후 계속 `PENDING_SCAN` | Backend Worker | SQS, File Scanner, Scanner Callback. **FE 문제로 보지 않음** |
| 5 | `INFECTED` / `FAILED` / `QUARANTINED` | Scan / 파일 확인 | BE 로그. FE는 실패 UI만 표시 |

---

## 7. 백엔드에 확인하고 싶은 것

1. **S3 CORS**  
   CMS 브라우저 origin에서 `PUT` + `requiredHeaders`에 들어 있는 커스텀 헤더(`x-amz-meta-*` 등)가 허용되는지.

2. **`checksumSha256` 필수 여부**  
   OpenAPI `FileUploadPrepareRequest`는 optional인데, 가이드 예시는 포함합니다. FE는 **항상 보냅니다**. 형식이 hex 소문자 64자가 맞는지.

3. **`requiredHeaders` 서명 범위**  
   FE는 내려준 키만 PUT에 넣습니다. 서명에 필요한 헤더가 응답에서 빠지면 S3가 403이 납니다. 필요한 헤더는 모두 `requiredHeaders`에 넣어 주세요.

4. **응답 envelope**  
   FE는 `{ success, data }` 또는 `{ status, data }`를 unwrap합니다. raw DTO를 그대로 내려도 됩니다. `fileObjectId`만 빠지지 않으면 됩니다.

5. **회원 생성 전 `ownerId`**  
   신규 등록 중 성범죄 파일은 아직 `memberId`가 없어서 약관 문서 `id`를 `ownerId`로 씁니다.  
   `ownerDomain=MEMBER`, `ownerType=CONSENT`, `privacyLevel=SENSITIVE` + 약관 문서 ID 조합이 허용되는지.  
   (이전에 이 경로에서 401이 난 이력이 있습니다.)

6. **스캔 SLA**  
   FE 폴링은 **2초 × 30회 ≈ 60초**입니다. 스테이징 Scanner가 이보다 길면 알려 주세요. 간격을 맞추겠습니다.

7. **테스트용 `ownerId`**  
   성범죄 화면 외에 가이드 예시(`PROGRAM` / `APPLICATION` / `10001`)로 먼저 찍어볼 수 있는 시드 ID가 있으면 공유해 주세요.

---

## 8. 이번 범위에 포함하지 않은 것

아래는 **아직 FE에 안 붙였습니다.** 1~4단계가 통과한 뒤 진행합니다.

| 항목 | API | 상태 |
|------|-----|------|
| 업무 Attachment 연결 | `POST /api/admin/files/attachments` | 미연동 |
| Available Actions | `GET /api/admin/files/{id}/available-actions` | 미연동 |
| 회원 포탈 업로드 | `POST /api/portal/me/files/upload-requests` 등 | 미연동 |
| CMS 다른 화면 mock 업로드 | 프로그램 신청 엑셀 등 | 아직 mock |

---

## 9. FE에서 이미 검증한 것 / 못 한 것

| 항목 | 결과 |
|------|------|
| 단위 테스트 (SHA-256, S3 헤더에 JWT 없음, confirm 동일 checksum, CLEAN+AVAILABLE 대기, INFECTED 실패) | 통과 |
| CMS typecheck | 통과 |
| 스테이징 실 S3 PUT | **미실시** — BE 환경·권한·CORS·Scanner 확인 후 진행 |

실서버에서 한 건만 성공하면 회신 부탁드립니다.

성공 시 알려 주시면 좋은 값:

- `fileObjectId`
- `upload-requests` / S3 PUT / confirm / GET status 각각의 HTTP status
- 최종 `scanStatus` / `uploadStatus`
- Scanner 완료까지 걸린 시간
