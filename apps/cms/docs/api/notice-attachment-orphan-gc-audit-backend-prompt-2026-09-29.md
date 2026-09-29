# Cursor prompt — 공지(및 동형) 첨부 orphan / 미매핑 file_object GC 구현 여부 감사 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 | JABACK 파일 수명주기 · `file_object` · 도메인 바인딩(`notice_attachment` / `file_attachment`) · 스케줄러 |
| 우선순위 | **구현 여부 확인(감사)** — 당장 신규 기능을 강제하지 않음. 없으면 gap과 권장안만 보고 |
| 작성일 | 2026-09-29 |
| 상태 | FE → BE 확인 요청 |
| FE 계약 | 공지는 **create-first** 후 업로드·`PUT …/attachments`. OpenAPI 변경 불필요 |
| 관련 FE | `apps/cms/src/features/posts/api/notices/admin-notices-service.ts`, `notice-attachments.ts` |
| 관련 BE (참고) | `FileStaleUploadCleanupService` / `FileStaleUploadCleanupWorker`, `InlineImageBindingService`, PATCH_09 문서 |

아래 지시는 **CMS 백엔드 레포(JABACK)에서 실행**하라.
프론트 레포를 수정하지 마라. 코드·스케줄러·설정을 읽고 **이미 있는지 / 없는지**만 판정한 뒤, handoff 형식으로 보고하라.

---

## 목적

CMS 공지 등록은 다음 순서다.

1. `POST /api/admin/content/notices` — 공지 본문 생성 (첨부 없음)
2. `POST /api/admin/files/upload-requests` → 저장소 PUT → `POST …/confirm`  
   - `filePurpose=NOTICE_ATTACHMENT`  
   - owner: `CONTENT` / `NOTICE` / `{noticeId}`
3. `PUT /api/admin/content/notices/{noticeId}/attachments` — `fileObjectId[]` 로 도메인 행 연결

실패 시 FE는 공지 soft-delete(또는 본문 rollback)를 **best-effort**로 시도하지만, 이미 `CLEAN`+`AVAILABLE`이 된 `file_object`를 항상 삭제하지는 않는다.

따라서 다음 orphan이 생길 수 있다.

| 시나리오 | 결과 |
|---|---|
| 업로드 성공 → `PUT …/attachments` 실패 | `file_object` AVAILABLE, `notice_attachment`(또는 동등 바인딩) 없음 |
| 업로드 성공 → 공지 rollback 삭제 | owner는 삭제된 NOTICE id를 가리키고, 도메인 바인딩 없음 |
| 수정 시 새 파일만 업로드되고 PUT이 이전 id만 유지 | 새 `file_object`가 바인딩되지 않음 |
| 인라인 이미지는 별도 PUT(`…/inline-images`) | 인라인과 첨부의 GC 정책이 다를 수 있음 |

질문: **백엔드에 “도메인에 매핑되지 않은(또는 대상 리소스가 사라진) AVAILABLE 첨부 file_object”를 정리하는 lifecycle/GC가 있는가?**

이번 프롬프트는 **구현 지시가 아니라 감사**다. 있으면 범위·유예시간·제외 목적을 문서화하고, 없으면 gap으로 보고하라. 무리해서 일반 업무 첨부 전체를 삭제하지 마라.

---

## 이미 알려진 BE 사실 (대조 출발점)

코드상 다음이 **이미 있다**. “전부 커버한다”고 단정하지 말고, 아래가 orphan 첨부까지 포함하는지 검증하라.

1. **`FileStaleUploadCleanupWorker`** (`ja.file-stale-upload-cleanup.*`)
   - 미완료 업로드: `PREPARED` + `PENDING_UPLOAD` (stale hours)
   - confirm 최종 실패: `CONFIRM_REQUESTED` + outbox `FAILED_FINAL`
   - **인라인만**: `AVAILABLE`+`CLEAN` 이고 purpose ∈  
     `NOTICE_INLINE_IMAGE`, `FAQ_INLINE_IMAGE`, `PROGRAM_POST_INLINE_IMAGE`, `PROGRAM_INLINE_IMAGE`  
     이며 active `file_attachment.attachment_type='INLINE_IMAGE'` 가 없으면 `EXPIRED` → `privacy_storage_delete_outbox`
2. **`InlineImageBindingService`** — 인라인 SSOT가 `file_attachment`(INLINE_IMAGE). 첨부와 별개.
3. 역사 문서 `PATCH_09_REMAINING_FILE_CONTENT_COMPLETION` 요지:  
   > 일반 업무 첨부파일은 보존정책이 도메인별로 다르므로 **동일한 자동 orphan 삭제를 적용하지 않는다.**

감사 핵심: **`NOTICE_ATTACHMENT`(및 동형 업무 첨부)는 의도적으로 제외된 것인지, 빠진 gap인지**를 코드·테스트·설정으로 확정하라.

---

## 감사 범위

### A. 공지 첨부 (1순위)

- purpose: `NOTICE_ATTACHMENT`
- 도메인 연결: `PUT/GET /api/admin/content/notices/{noticeId}/attachments`
- owner: `CONTENT` / `NOTICE` / `{noticeId}`
- 바인딩 테이블/행: `notice_attachment` 및/또는 `file_attachment` (실제 SSOT가 무엇인지)

다음을 답하라.

1. AVAILABLE + CLEAN 인 `NOTICE_ATTACHMENT` 가 도메인 바인딩 없이 N시간 지나면 자동 만료/삭제되는가?
2. 공지 soft-delete / hard 경로에서 연결된 `file_object` 와 **미연결 orphan** 을 어떻게 다루는가?
3. `PUT attachments` 가 replace 할 때 요청에서 빠진 기존 파일은 soft-delete 되는가, 스토리지까지 가는가, orphan으로 남는가?

### B. 동형 create-first / upload-then-bind (2순위, 같은 정책이면 함께)

동일 패턴이면 A와 같은 GC 유무를 한 줄씩만 표로 적어라. 없으면 “미적용/미확인”으로 둔다.

| 도메인 | purpose | 바인딩 API |
|---|---|---|
| 공지 인라인 | `NOTICE_INLINE_IMAGE` | `…/notices/{id}/inline-images` |
| FAQ 인라인 | `FAQ_INLINE_IMAGE` | `…/faqs/{id}/inline-images` |
| 프로그램 상세 첨부 | `PROGRAM_DETAIL_ATTACHMENT` | `…/programs/{id}/attachments` |
| 프로그램 인라인 | `PROGRAM_INLINE_IMAGE` | `…/programs/{id}/inline-images` |
| 프로그램 게시글 첨부 | `PROGRAM_POST_ATTACHMENT` | `…/posts/{postId}/attachments` |
| 메일/문자 템플릿 첨부 | `MAIL_TEMPLATE_ATTACHMENT` / `MMS_IMAGE` | notification-templates attachments |

인라인은 A의 stale worker에 이미 들어가면 “있음(인라인 전용)”으로 표기하라. 첨부는 따로 판정하라.

### C. 제외해도 되는 것 (이번 감사에서 구현 요구 금지)

- 민감 보존 목적 파일의 일괄 자동 삭제 (`CRIMINAL_HISTORY_EVIDENCE`, `EXPENSE_RECEIPT`, 학생명단 등)
- 새 `filePurpose` / 새 업로드 파이프라인
- FE create-first → upload-first 로의 계약 변경
- OpenAPI 스키마 변경 (감사용이라 불필요)

---

## 조사 절차 (백엔드에서 할 일)

1. `FileStaleUploadCleanupService` SQL의 purpose·조인 조건을 읽고, `NOTICE_ATTACHMENT` / `PROGRAM_DETAIL_ATTACHMENT` 등이 **의도적으로 빠졌는지** 주석·커밋·문서와 대조.
2. `notice` 삭제·첨부 replace 서비스에서 `file_object` / `privacy_storage_delete_outbox` 호출 여부를 추적.
3. 스케줄러·설정 키 검색:  
   `orphan`, `unbound`, `unlinked`, `stale-upload`, `file_stale`, `storage_delete`, `FileGc`, `unreferenced`.
4. 테스트: `NOTICE_ATTACHMENT` orphan → EXPIRED/outbox 되는 회귀가 있는지. 없으면 “테스트 없음”으로 기록.
5. (선택) 로컬 DB에서 재현 쿼리 초안을 handoff에 포함:

```sql
-- 예시: 공지 첨부 orphan 후보 (실제 스키마에 맞게 수정)
SELECT f.id, f.file_purpose, f.upload_status, f.scan_status, f.owner_domain, f.owner_type, f.owner_id, f.created_at
  FROM file_object f
 WHERE f.deleted_at IS NULL
   AND f.upload_status = 'AVAILABLE'
   AND f.scan_status = 'CLEAN'
   AND f.file_purpose = 'NOTICE_ATTACHMENT'
   AND NOT EXISTS (
         SELECT 1 FROM notice_attachment na  -- 또는 file_attachment 등 실제 SSOT
          WHERE na.file_object_id = f.id /* AND na.deleted_at IS NULL */
       );
```

스키마가 다르면 올바른 SSOT 테이블명으로 고쳐 결과를 보고하라. 운영 DB에 파괴적 DELETE를 실행하지 마라.

---

## 판정 기준

| 판정 | 조건 |
|---|---|
| **구현됨** | AVAILABLE `NOTICE_ATTACHMENT` 가 grace 이후 자동 EXPIRED(또는 soft-delete) + storage delete outbox(또는 동등)까지 가는 코드·설정·테스트가 있음 |
| **부분 구현** | 인라인만 / 미완료 업로드만 / 공지 삭제 시에만 연결 파일 정리. **미바인딩 AVAILABLE 첨부는 남음** |
| **미구현(의도적)** | 문서·주석에 “일반 첨부는 자동 orphan 삭제 안 함”이 명시되고 코드와 일치 |
| **미구현(gap)** | 문서에 없고, create-first 실패 시 orphan이 영구 잔존 |

`부분 구현` 또는 `미구현(gap)` 이면 **권장안만** 제안하라. 이번 프롬프트만으로 프로덕션 스케줄러를 켜거나 grace를 바꾸지 마라. 구현이 필요하면 별도 구현 프롬프트를 FE/기획과 합의 후 작성한다.

권장안을 쓸 때 최소로 제안할 내용:

- 대상 purpose 화이트리스트 (예: `NOTICE_ATTACHMENT`만 먼저)
- grace (예: 24h, 기존 `stale-hours` 재사용 여부)
- “도메인 바인딩 없음” 판정 SQL (notice_attachment vs file_attachment)
- 공지가 삭제된 owner_id 에 매달린 orphan 처리
- 절대 건드리면 안 되는 purpose 블랙리스트

---

## 산출물 (handoff)

`docs/handoff/notice-attachment-orphan-gc-audit-frontend-handoff-YYYY-MM-DD.md` 형식으로 FE에 돌려줘라.

필수 섹션:

1. **판정**: 구현됨 / 부분 구현 / 미구현(의도적) / 미구현(gap)
2. **근거 코드·설정 경로** (클래스, cron, property)
3. **A/B 표**: purpose별 GC 유무
4. **재현·검증 SQL** (로컬에서 돌린 결과 요약; PII/실파일 키는 넣지 말 것)
5. **FE 영향**:  
   - GC가 있으면 FE는 create-first 실패 시 best-effort delete만으로 충분한지  
   - 없으면 FE가 `removeNoticeFileObjects` 를 실패 경로에 넣을지, BE GC가 필요한지
6. **후속**: 구현이 필요하면 범위(공지 첨부만 vs 동형 전부)와 예상 리스크 한 단락

프론트 OpenAPI 재생성·FE 코드 변경은 이 감사의 산출물이 아니다.

---

## 복사용 짧은 프롬프트

```
JABACK에서 공지 첨부 orphan GC 구현 여부를 감사하라. FE는 수정하지 마라.

배경: CMS 공지는 create-first → NOTICE_ATTACHMENT 업로드(owner CONTENT/NOTICE/{id}) → PUT /api/admin/content/notices/{id}/attachments 이다. FE는 실패 시 공지 rollback만 best-effort이고, 이미 AVAILABLE인 file_object를 항상 지우지 않는다.

확인할 것:
1) FileStaleUploadCleanupService가 NOTICE_ATTACHMENT(미바인딩 AVAILABLE)까지 만료하는지, 아니면 인라인·미완료 업로드만인지.
2) 공지 삭제/첨부 replace 시 연결·미연결 파일 lifecycle.
3) PROGRAM_DETAIL_ATTACHMENT 등 동형 upload-then-bind도 같은지 표로.
4) PATCH_09의 「일반 업무 첨부는 자동 orphan 삭제 안 함」이 현행 코드와 일치하는지 → 의도적 제외인지 gap인지.

산출: handoff에 판정(구현됨/부분/미구현-의도/미구현-gap), 근거 경로, purpose별 표, 검증 SQL 요약, FE 영향. 이번 턴에서 스케줄러를 바꾸거나 일반 첨부를 일괄 삭제하는 구현을 강제하지 마라.
```
