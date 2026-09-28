# Admin Files — confirm 이후 `FAILED` / `QUARANTINED` (스캔 실패) 백엔드 확인 요청

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-18 |
| 대상 | JABACK Admin Files (`/api/admin/files/**`) |
| 우선순위 | **P0** — 성범죄 경력조회 동의서 첨부 등 CMS 파일 업로드 사용 불가 |
| 관련 문서 | [files-upload-fe-integration-backend-handoff-2026-09-07.md](./files-upload-fe-integration-backend-handoff-2026-09-07.md) |
| FE 코드 | `apps/cms/src/shared/lib/admin-file-upload/upload.ts` |

---

## 1. 한 줄 요약

`upload-requests` → S3 Presigned PUT → `confirm` 까지는 **성공**합니다.  
이후 `GET /api/admin/files/{fileObjectId}` 폴링 결과로

- `scanStatus = FAILED`
- `uploadStatus = QUARANTINED`

가 내려와 FE가 **「파일 검사 실패」**로 종료합니다.

**PNG·PDF 모두 동일** → 확장자/MIME 개별 이슈가 아니라 **스캔·격리 파이프라인 공통 실패**로 판단합니다. FE 버그로 보지 않습니다.

---

## 2. FE 기대 / 실패 판정 (계약)

### 성공

```text
scanStatus = CLEAN
uploadStatus = AVAILABLE
```

### FE가 즉시 실패 처리

```text
scanStatus = INFECTED | FAILED
uploadStatus = QUARANTINED
```

구현: `isFileScanFailed` → `throw new Error('파일 검사 실패')`  
(`waitUntilFileAvailable`, 기본 폴링 2초 × 최대 30회)

Confirm 성공만으로는 업로드 완료로 처리하지 않습니다.

---

## 3. 재현 경로 (CMS)

1. CMS 관리자 로그인
2. **성범죄 경력조회 동의서** 등 `CRIMINAL_HISTORY_EVIDENCE` 파일 첨부 화면
3. PNG 또는 PDF 선택 후 업로드
4. Network:
   - `POST /api/admin/files/upload-requests` → 2xx
   - `PUT {uploadUrl}` (S3) → 2xx
   - `POST /api/admin/files/{id}/confirm` → 2xx
   - `GET /api/admin/files/{id}` 반복 → 최종 `FAILED` + `QUARANTINED`
5. UI: 「파일 검사 실패」

---

## 4. 실측 응답 (스테이징)

### 4.1 PNG — `fileObjectId: 28`

| 필드 | 값 |
|------|-----|
| uuid | `add26264-9dfc-499b-9328-589b57dc00fb` |
| ownerDomain / ownerType / ownerId | `MEMBER` / `CONSENT` / `12` |
| filePurpose | `CRIMINAL_HISTORY_EVIDENCE` |
| contentType | `image/png` |
| fileSize | `121751` |
| createdAt → updatedAt | `2026-09-17T23:10:28Z` → `2026-09-17T23:11:00Z` (~32초) |
| **scanStatus** | **`FAILED`** |
| **uploadStatus** | **`QUARANTINED`** |

```json
{
  "fileObjectId": 28,
  "uuid": "add26264-9dfc-499b-9328-589b57dc00fb",
  "ownerDomain": "MEMBER",
  "ownerType": "CONSENT",
  "ownerId": 12,
  "privacyLevel": "PRIVATE_SENSITIVE",
  "originalFileName": "02. 상세_신청 정보.png",
  "contentType": "image/png",
  "fileSize": 121751,
  "checksumSha256": "92b73c1065f7b16b3bb71f5cd3980c183e60056b9c40ded4b3335abf15328e02",
  "scanStatus": "FAILED",
  "uploadStatus": "QUARANTINED",
  "createdAt": "2026-09-17T23:10:28.634233Z",
  "updatedAt": "2026-09-17T23:11:00.283385Z",
  "filePurpose": "CRIMINAL_HISTORY_EVIDENCE",
  "retentionPolicyCode": "CRIMINAL_HISTORY_1Y",
  "downloadStrategy": "SERVER_RELAY",
  "reasonRequiredYn": true,
  "approvalRequiredYn": false,
  "bundleAllowedYn": false,
  "expiresAt": "2027-09-17T23:10:28.635089Z",
  "availableActions": [
    "VIEW",
    "VIEW_DOWNLOAD_AUDIT",
    "VIEW_BLOCKED_REASON"
  ]
}
```

### 4.2 PDF — `fileObjectId: 29`

| 필드 | 값 |
|------|-----|
| uuid | `061e8b59-993d-4f1e-bc6d-0f0587adf6a8` |
| ownerDomain / ownerType / ownerId | `MEMBER` / `CONSENT` / `12` |
| filePurpose | `CRIMINAL_HISTORY_EVIDENCE` |
| contentType | `application/pdf` |
| fileSize | `42373` |
| createdAt → updatedAt | `2026-09-17T23:11:52Z` → `2026-09-17T23:12:00Z` (~8초) |
| **scanStatus** | **`FAILED`** |
| **uploadStatus** | **`QUARANTINED`** |

```json
{
  "fileObjectId": 29,
  "uuid": "061e8b59-993d-4f1e-bc6d-0f0587adf6a8",
  "ownerDomain": "MEMBER",
  "ownerType": "CONSENT",
  "ownerId": 12,
  "privacyLevel": "PRIVATE_SENSITIVE",
  "originalFileName": "sample.pdf",
  "contentType": "application/pdf",
  "fileSize": 42373,
  "checksumSha256": "277bf30a8ca2a7d767e44ecc6620704e1b1ec4be6fe641353fe0ba52ed818205",
  "scanStatus": "FAILED",
  "uploadStatus": "QUARANTINED",
  "createdAt": "2026-09-17T23:11:52.094457Z",
  "updatedAt": "2026-09-17T23:12:00.350503Z",
  "filePurpose": "CRIMINAL_HISTORY_EVIDENCE",
  "retentionPolicyCode": "CRIMINAL_HISTORY_1Y",
  "downloadStrategy": "SERVER_RELAY",
  "reasonRequiredYn": true,
  "approvalRequiredYn": false,
  "bundleAllowedYn": false,
  "expiresAt": "2027-09-17T23:11:52.095130Z",
  "availableActions": [
    "VIEW",
    "VIEW_DOWNLOAD_AUDIT",
    "VIEW_BLOCKED_REASON"
  ]
}
```

---

## 5. 책임 구분

| CASE | 증상 | 구간 | 우선 확인 |
|------|------|------|-----------|
| (이번 이슈) | confirm 성공 후 `FAILED` + `QUARANTINED` | **Scan / Worker / Callback** | SQS, File Scanner, Scanner Callback, 격리 사유. **FE 문제로 보지 않음** |
| (참고) | confirm 후 계속 `PENDING_SCAN`만 | Backend Worker | 스캐너 미기동 → FE는 60초 후 타임아웃 |

관련: 기존 handoff **CASE 5** (`INFECTED` / `FAILED` / `QUARANTINED`).

---

## 6. 백엔드에 요청하는 확인 사항

1. **fileObjectId `28`, `29`** (uuid 위 표)의 스캔·격리 로그  
   - 왜 `FAILED`인지 (스캐너 오류, 콜백 실패, 스토리지 접근 실패, 설정 누락 등)
2. 스테이징에서 **File Scanner / Worker가 정상 기동** 중인지
3. 응답 `availableActions`에 `VIEW_BLOCKED_REASON`이 있음  
   - FE/운영이 사유를 조회할 수 있는 API·필드가 있는지, 있다면 호출 방법
4. 정상 시 기대 최종 상태 재확인  
   - `scanStatus=CLEAN`, `uploadStatus=AVAILABLE`
5. (가능하면) 동일 파일로 재업로드 시 `CLEAN`+`AVAILABLE`까지 가는지 확인 후 FE에 회신

---

## 7. FE 측 조치

- 추가 FE 수정 없음 (계약대로 실패 상태 반영).
- 스캔이 `CLEAN`+`AVAILABLE`로 마감되면 동일 FE 코드로 업로드 성공합니다.

---

## 8. 회신 시 부탁드리는 것

- `28` / `29` 실패 root cause 한 줄 + 상세
- 스테이징 스캐너 정상 여부
- 수정 ETA 또는 임시 우회(스테이징에서 스캔 bypass 등) 가능 여부
