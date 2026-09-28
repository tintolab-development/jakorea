# BE 전달 프롬프트 — 프로그램 상세 첨부 포털 노출 · 교육 대상 복수

**작성일:** 2026-09-28  
**문서 성격:** 이 파일만 보고 수정·검수. 변명·우회 금지.  
**우선순위:** P0 (첨부 미노출) · P1 (교육 대상 복수)  
**대상:** Admin programs + Portal programs  
**비범위:** Gemini 모집 전용 API 재설계, UJAT 봉사 모집 첨부, 공지/메일 첨부

FE는 등록·상세에서 `PUT /api/admin/programs/{programId}/thumbnail` · `PUT /api/admin/programs/{programId}/attachments` 를 호출하도록 맞췄다.  
교육 대상 목록·포털 표시도 복수 라벨을 읽을 수 있게 바꿨다. **아래 계약이 서버에 없으면 플랫폼/목록에 여전히 안 보인다.**

---

## 한줄

1. 프로그램 상세 첨부(GENERAL)는 `PUT /api/admin/programs/{id}/attachments` 로 저장된 행이 **포털 상세 `attachments[]`** 로 나와야 한다. `attachmentFileNames` 문자열만으로는 포털에 파일을 만들지 마라.
2. 썸네일은 `PUT …/thumbnail` → 포털 `thumbnailFileObjectId`. GENERAL 첨부 교체가 THUMBNAIL 행을 지우면 안 된다.
3. 교육 대상 복수는 Admin create/update/list·Portal list/detail 에 **배열**로 내려야 한다. top-level `targetLevel` / `educationTarget` 단수만 있으면 FE는 첫 값·단수 라벨만 보인다.

---

## A. 프로그램 상세 첨부 → 포털 노출 (P0)

### 이미 있는 Admin API — 다시 만들지 말 것

| 메서드 | 경로 | 역할 |
|---|---|---|
| PUT | `/api/admin/programs/{programId}/thumbnail` | 대표 이미지(THUMBNAIL). filePurpose=`PROGRAM_THUMBNAIL`, owner=`PROGRAM_CONTENT`/`PROGRAM`/`{programId}` |
| GET | `/api/admin/programs/{programId}/thumbnail` | 대표 이미지 조회 |
| PUT | `/api/admin/programs/{programId}/attachments` | body `{ fileObjectIds: number[] }` — **GENERAL** 상세 첨부 전체 교체 |
| GET | `/api/admin/programs/{programId}/attachments` | GENERAL 목록만 |

### FE가 하는 일 (이미 반영)

- 등록 중: staging ownerId=1, ownerDomain=`PROGRAM_CONTENT` 로 업로드 → create 직후 `putThumbnail` + `putAttachments(fileObjectIds)`
- 상세 수정: 동일 PUT attachments 로 교체
- 포털: `attachments[].fileObjectId` → public download URL

### BE가 보장할 것

1. `PUT …/attachments` 성공 후 `GET /api/portal/programs/{id}`(또는 동일 상세)의 `attachments` 에  
   `{ fileObjectId, originalFileName, … }` 가 **순서대로** 채워진다.
2. `PUT …/attachments` 는 **GENERAL(또는 null)만** 교체·삭제한다. `THUMBNAIL` / `POSTER` / `KEY_VISUAL` / `MAIN_IMAGE` 를 지우지 마라.
3. 업로드 파일 조건: `filePurpose=PROGRAM_DETAIL_ATTACHMENT`, `ownerDomain=PROGRAM_CONTENT`, `ownerType=PROGRAM`, `ownerId=프로그램 PK`, CLEAN+AVAILABLE.  
   staging ownerId=1 로 올라온 파일을 PUT 시 **해당 programId owner 로 재바인딩**하거나, 동일 조건으로 재검수 후 연결하라. ownerId=1 행을 다른 프로그램과 섞지 마라.
4. `ProgramCreateRequest.attachmentFileNames` 만 받아도 포털 `attachments` 를 채우지 마라. **파일 객체 연결이 SSOT** 다.
5. 포털 첨부는 public download 가능해야 한다 (`/api/portal/public/files/{fileObjectId}/download` 등 기존 공개 파일 계약).  
   `FilePublicService` 는 `file_purpose ∈ (PROGRAM_DETAIL_ATTACHMENT, PROGRAM_THUMBNAIL)` + `program.draft_status=PUBLISHED` + `program_attachment` 조인을 요구한다.  
   포털 상세 `attachments()` 쿼리는 purpose 를 안 본다. **목록에 나와도 download 가 404 면 플랫폼에서 받은 것처럼 보이지 않는다.**

### 로컬 검증 (2026-09-28)

| 관찰 | 결과 |
|---|---|
| `GET /api/portal/programs/168007` · `186008` | `attachments[]` 2건 (fileObjectId·원본명 정상) |
| `GET /api/portal/public/files/{그 id}/download` | **404 `PUBLIC_FILE_NOT_FOUND`** (시드 `file_purpose` 미설정) |
| `GET …/files/2055785/download` (186010 썸네일) | **200** |
| **TT `186010` (초등 경제교육 학급 신청 안내)** | `file_object` 에 `PROGRAM_DETAIL_ATTACHMENT` 파일(2055784/2055786)은 있으나 **`program_attachment` GENERAL 행 없음** → 포털 `attachments: []`. 원인: 업로드 `owner_domain=PROGRAM`(오계약). PUT attachments 는 `PROGRAM_CONTENT` 만 받아 **OWNER_MISMATCH 로 연결 실패**(등록 직후 `.catch`로 삼킴). 썸네일만 `PROGRAM_CONTENT` 로 바인딩되어 노출됨 |
| Primary Case 시드 | `file_purpose` 미설정 · `owner_domain=PROGRAM` / `owner_type=ATTACHMENT` |

### BE가 당장 고칠 것 (시드·공개 다운로드 · TT 등록 연결)

1. 시드 GENERAL 첨부를 `file_purpose=PROGRAM_DETAIL_ATTACHMENT`, `owner_domain=PROGRAM_CONTENT`, `owner_type=PROGRAM`, `owner_id=programId` 로 맞춘다.  
2. `GET /api/portal/programs/{id}` 에 나온 `attachments[].fileObjectId` 로 `GET /api/portal/public/files/{id}/download` 가 **200**(또는 signed redirect) 이어야 한다.  
3. `PUT …/attachments` 거절 시 FE가 삼키지 않도록 — 응답에 **명확한 에러 코드** 유지(`PROGRAM_ATTACHMENT_FILE_OWNER_MISMATCH`). 가능하면 등록 중 `owner_domain=PROGRAM` 으로 올라온 `PROGRAM_DETAIL_ATTACHMENT` 도 staging 과 같이 **PROGRAM_CONTENT 로 교정·재바인딩**하거나 prepare 단계에서 거절한다.  
4. 위 검수를 Primary Case `168001`–`168008` · TT `186001`–`186008` 및 로컬 TT `186010` 유형에서 통과시킨다.

### 검수

```http
PUT /api/admin/programs/{id}/attachments
{ "fileObjectIds": [101, 102] }

GET /api/portal/programs/{id}
→ attachments.length === 2
→ attachments[0].fileObjectId === 101
→ thumbnailFileObjectId 유지 (있다면)

GET /api/portal/public/files/101/download
→ 200 (또는 3xx signed URL). 404 PUBLIC_FILE_NOT_FOUND 금지
```

시드 프로그램 `186001`–`186008` 의 **사업 데이터는 덮어쓰지 말 것.** 첨부 `file_object` 메타·purpose 교정은 예외.

---

## B. 교육 대상 복수 (P1)

### 현재 깨진 계약

| 계층 | 지금 | 문제 |
|---|---|---|
| Admin create/update | `targetLevel?: string` 단수 | FE가 `targetLevels[0]`만 보냄. 배열은 `serviceDetailJson` 에만 남음 |
| Admin list | `targetLevel` 위주 | 목록 컬럼이 복수 라벨을 못 채움 |
| Portal list/detail | `educationTarget?: string` 단수 enum | 상세·필터가 하나만 표시 |

CMS 모집 상세는 nested `participantRecruitmentInfo` / `targetLevels` 조인으로 이미 복수 라벨을 보여 준다. **목록·포털만 단수.**

### BE가 할 일

1. **Admin Program create/update**  
   - `targetLevels?: string[]` (`elementary` \| `middle` \| `high` \| `university` \| `adult`) 추가·저장.  
   - `targetLevel` 은 호환용으로 `targetLevels[0]` 미러 유지 가능.  
   - `serviceDetailJson.program.targetLevels` 와 top-level 을 **동기화**하라. JSON 만 있고 컬럼/목록이 비면 안 된다.

2. **Admin Program list item**  
   - `targetLevels: string[]` 를 내려라. 없으면 FE는 단수 `targetLevel` 만 표시한다.

3. **Portal Program list + detail**  
   - `educationTargets?: string[]` 추가 (동일 enum).  
   - `educationTarget` 은 호환용 첫 값 유지 가능.  
   - 상세 `educationTargets` 가 있으면 FE가 `대학(원)생, 중학교, 고등학교` 형태로 조인한다.  
   - 목록 필터 `educationTarget=high` 는 **배열에 high 가 포함된 프로그램**에 매칭하라 (첫 값만 보면 안 됨).

4. OpenAPI / ProgramCreateRequest·ProgramResponse·Portal DTO 를 위 필드에 맞춰라. 스키마만 고치고 저장을 안 하면 실패다.

### 검수

```http
# Admin
POST/PATCH … body.targetLevels = ["university","middle","high"]
GET /api/admin/programs → item.targetLevels 길이 3

# Portal
GET /api/portal/programs/{id}
→ educationTargets = ["university","middle","high"]
# 또는 최소 educationTarget 이 콤마 구분이면 FE fallback 가능 — 배열 권장
```

등록 UI에서 대학(원)생·중학교·고등학교를 모두 고른 뒤:

- CMS 목록 「교육 대상」: `대학(원)생, 중학교, 고등학교` (또는 동일 의미 라벨)
- Platform 상세 「교육 대상」: 동일 복수 라벨
- CMS 모집 상세와 불일치하지 말 것

---

## 금지

- 포털 첨부를 `attachmentFileNames` 문자열 mock 으로 채우기
- `PUT …/attachments` 가 THUMBNAIL 행을 삭제
- 교육 대상 복수를 FE만 고치고 Admin/Portal 단수 필드만 유지
- 시드 `186001`–`186008` 덮어쓰기

---

## FE 참고 경로

- 첨부 바인딩: `apps/cms/src/features/program/shared/api/program-attachments.ts`
- 등록 후 연결: `apps/cms/src/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media.ts`
- 포털 첨부 매퍼: `apps/platform/src/features/program/api/mappers.ts` (`attachments[].fileObjectId`)
- 교육 대상 목록 표시: `apps/cms/.../program-list-columns.tsx` (`formatTargetLevelsLabel`)
- 포털 복수 매퍼: `mapEducationTargets` (`educationTargets` · 콤마 `educationTarget` fallback)

**Last updated:** 2026-09-28
