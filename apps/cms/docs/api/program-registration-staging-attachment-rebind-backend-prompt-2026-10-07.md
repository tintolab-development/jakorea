# BE 수정 요청 (2026-10-07) — 등록 위저드 모집 첨부 staging 재바인딩

**작성일:** 2026-10-07  
**우선순위:** P0  
**문서 성격:** **이 파일만** 보고 구현·검수. 변명·우회 금지.  
**대체:** `program-attachments-education-targets-multi-backend-prompt-2026-09-28.md` (삭제). 교육 대상 복수는 `program-target-levels-column-ignored-backend-prompt-2026-09-30.md`.  
**대상 API:** 아래 4개 PUT. **새 엔드포인트 만들지 말 것.**

| 메서드 | 경로 | 언제 |
|--------|------|------|
| PUT | `/api/admin/programs/{programId}/attachments` | 1사1교·교육받은 교사 등록 직후 GENERAL 첨부 |
| PUT | `/api/admin/programs/{programId}/thumbnail` | 동일, 대표 이미지 |
| PUT | `/api/admin/programs/{programId}/recruitments/{recruitmentId}/attachments` | 일반 프로그램 등록 직후 모집 행 첨부 |
| PUT | `/api/admin/programs/{programId}/recruitments/{recruitmentId}/thumbnail` | 동일, 모집 행 대표 이미지 |

**실측 에러 (2026-10-07):** 프로그램 등록 위저드 모집 양식에 첨부 후 등록 완료 시

```json
{
  "success": false,
  "data": null,
  "message": "파일 접근 권한이 없습니다.",
  "error": {
    "code": "PROGRAM_ATTACHMENT_FILE_OWNER_MISMATCH",
    "message": "파일 접근 권한이 없습니다.",
    "field": null,
    "traceId": "48fd7404d0364b638b54fd82284f3a97"
  }
}
```

**비범위:** Gemini 모집 전용 업로드 API, 공지/메일 첨부, 포털 public download 시드 교정, 교육 대상 배열.

---

## 한 줄

등록 전에는 프로그램 PK가 없다. FE는 모집 상세 첨부·썸네일을 **staging `ownerId=1`** 로 올린 뒤, create 직후 위 PUT에 `fileObjectId`만 보낸다. PUT이 그 파일을 **대상 programId(또는 recruitmentId) owner로 재바인딩**하지 않고 owner PK 일치만 검사하면 이 에러가 난다.

---

## 이미 끝난 것 (다시 하지 말 것)

| 항목 | 상태 |
|------|------|
| 업로드 `ownerDomain` | FE는 `PROGRAM_CONTENT` 로 올린다. 예전 `PROGRAM` 도메인 거절은 해결됨. |
| PUT 경로 | create 직후 FE가 thumbnail + attachments PUT을 호출한다. 실패하면 방금 만든 프로그램을 롤백한다. |
| 상세 수정 업로드 | 프로그램/모집 행 PK가 있으면 그 PK로 올린다. 이번 범위 아님. |

---

## FE가 지금 하는 일

등록 위저드 모집 「상세 정보」 첨부·썸네일:

1. 업로드 owner (프로그램 ID 없음)

| 필드 | ownerDomain | ownerType | ownerId | filePurpose |
|------|-------------|-----------|---------|-------------|
| 첨부 | `PROGRAM_CONTENT` | `PROGRAM` | **`1`** | `PROGRAM_DETAIL_ATTACHMENT` |
| 썸네일 | `PROGRAM_CONTENT` | `PROGRAM` | **`1`** | `PROGRAM_THUMBNAIL` |

2. 프로그램 create 성공 직후 PUT

| 유형 | 첨부 | 썸네일 |
|------|------|--------|
| **1사1교 · 교육받은 교사** | `PUT /programs/{새 id}/attachments` `{ fileObjectIds }` | `PUT /programs/{새 id}/thumbnail` `{ fileObjectId }` |
| **일반** (모집 행이 있으면) | `PUT /programs/{id}/recruitments/{recruitmentId}/attachments` | `PUT …/recruitments/{recruitmentId}/thumbnail` |
| 일반 (모집 행 id 없음) | 프로그램 단위 PUT과 동일 | 동일 |

업로드 파일의 ownerId는 여전히 **`1`** 이다. PUT path의 `{programId}` / `{recruitmentId}` 와 다르다.

FE 경로: `apps/cms/src/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media.ts` (`RECRUIT_DETAIL_STAGING_PROGRAM_OWNER_ID = 1`, `bindRecruitDetailMediaAfterProgramCreate`, `bindGeneralRecruitDetailMediaToRows`).

---

## BE가 할 일

PUT 4개 모두, body의 `fileObjectId`(들)에 대해:

1. `filePurpose`가 해당 PUT과 맞는지 검사 (첨부는 `PROGRAM_DETAIL_ATTACHMENT`, 썸네일은 `PROGRAM_THUMBNAIL`).
2. `uploadStatus=AVAILABLE`, `scanStatus=CLEAN`.
3. **owner가 아래 둘 중 하나면 허용하고, 대상 리소스 owner로 재바인딩한 뒤 `program_attachment`(또는 모집 행 첨부)에 연결하라.**

| 허용 업로드 owner | 재바인딩 후 owner |
|-------------------|-------------------|
| `PROGRAM_CONTENT` / `PROGRAM` / `{PUT의 programId}` | 그대로 (상세 수정) |
| `PROGRAM_CONTENT` / `PROGRAM` / **`1`** (등록 위저드 staging) | 프로그램 PUT: `PROGRAM` / `{programId}`. 모집 행 PUT: `PROGRAM_RECRUITMENT` / `{recruitmentId}` |

4. staging `ownerId=1` 파일은 **이번 PUT의 대상 프로그램(모집 행)에만** 붙인다. 다른 프로그램이 같은 fileObjectId를 가로채지 못하게 하라.
5. owner가 다른 프로그램 PK이거나, `ownerDomain`이 `PROGRAM_CONTENT`가 아니면 지금처럼 `PROGRAM_ATTACHMENT_FILE_OWNER_MISMATCH` (썸네일은 `PROGRAM_THUMBNAIL_FILE_OWNER_MISMATCH`) 로 거절.
6. `PUT …/attachments`는 GENERAL만 교체. THUMBNAIL 행을 지우지 마라. 모집 행 PUT은 **그 행** 첨부만 교체.

새 업로드 API, 등록 전 프로그램 선생성, FE가 파일을 다시 올리게 하는 우회는 금지.

---

## 검수

등록 위저드에서 모집 상세에 첨부 1개 + 썸네일 1개를 올리고 등록을 끝낸다. **OWNER_MISMATCH로 실패·롤백되면 안 된다.**

```http
# 1사1교 또는 교육받은 교사
PUT /api/admin/programs/{newId}/thumbnail
{ "fileObjectId": <staging에서 올린 PROGRAM_THUMBNAIL> }

PUT /api/admin/programs/{newId}/attachments
{ "fileObjectIds": [<staging에서 올린 PROGRAM_DETAIL_ATTACHMENT>] }

GET /api/admin/programs/{newId}/attachments
→ 같은 fileObjectId, GENERAL만

GET /api/admin/programs/{newId}/thumbnail
→ 같은 fileObjectId

# 일반 (모집 행 있는 경우)
PUT /api/admin/programs/{id}/recruitments/{recruitmentId}/attachments
{ "fileObjectIds": [<staging PROGRAM / ownerId=1>] }

GET …/recruitments/{recruitmentId}/attachments
→ 같은 fileObjectId. 다른 모집 행 첨부는 그대로
```

재바인딩 후 `file_object.owner_id` 가 `1`이 아니어야 한다. 프로그램 PUT이면 `{newId}`, 모집 행 PUT이면 `{recruitmentId}`.

다른 프로그램 PK owner인 파일을 PUT하면 403/해당 MISMATCH. staging이 아닌 파일과 `ownerId=1` 행을 섞어 쓰지 마라.

---

## 금지

- staging을 검사에서 빼 주고 owner를 `1`로 남기기 (프로그램 간 파일 혼동)
- `attachmentFileNames` 문자열만으로 첨부 행을 만들기
- 일반 모집 행 PUT에서 프로그램 단위 GENERAL만 채우고 행 첨부는 비우기
- 09-28 문서의 시드·포털 download 404·교육 대상 복수를 이 티켓에 섞기
