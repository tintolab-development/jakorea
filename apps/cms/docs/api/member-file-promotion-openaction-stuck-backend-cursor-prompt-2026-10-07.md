# Cursor prompt — 회원 증빙 PDF 업로드가 60초 대기 후 실패 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/member-file-promotion-openaction-stuck-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 높음 (신청 불가).**
> Platform 봉사자 신청 「증빙서류 첨부」에서 평범한 PDF를 올리면 1분 가까이 로딩하다 실패한다.
> 파일은 `CLEAN + PROMOTION_PENDING`에 영구히 멈추고, 승격 outbox 행은 `PROCESSING`에 갇힌다.
>
> 범위: 파일 승격 파이프라인(`FileStoragePromotionOutboxService`, `EnterpriseFileContentPolicy`).
> 회원 파일 업로드 API 계약(`/api/portal/me/files/**`) 응답 형태는 바꾸지 마라.

---

## 재현 (로컬, 2026-10-07 17:40 KST)

- 회원 190081이 `POST /api/portal/me/files/upload-requests` (`filePurpose=VOLUNTEER_APPLICATION_EVIDENCE`) → PUT → confirm.
- `file_object.id = 2055833`
  - `original_file_name = JA_KOREA_강의명_강의보고서.pdf`, `application/pdf`, 490,101 bytes
  - `scan_status = CLEAN` (08:40:44Z, 1초 만에 완료)
  - `upload_status = PROMOTION_PENDING` — **이후 변하지 않음**
- `file_storage_promotion_outbox.id = 50`
  - `status = PROCESSING`, `attempt_count = 0`, `last_error_message = NULL`, `locked_at = 08:40:44.037Z`
- `scheduler_execution_log.id = 233625` (`file_storage_promotion_outbox`, 08:40:44.036Z)
  - `status = FAILED`, `failure_count = 1`
  - `error_message = type=DataIntegrityViolationException;rootType=PSQLException`
- 이후 실행은 모두 `processed=0` — `PROCESSING` 행은 claim 대상이 아니다.
- 프론트는 `GET /api/portal/me/files/{id}`를 2초 × 30회 폴링하다 타임아웃 → 「업로드 실패」.

## 원인

### 1) 내용 정책이 무해한 `/OpenAction`을 거부

PDF 원본(`.local-object-storage/INTERNAL/test/quarantine/member_portal/2026/10/07/member_upload-190081/file-83755d0d-….pdf`)

```
%PDF-1.3
/Producer (jsPDF 4.2.1)
/OpenAction [3 0 R /FitH null]
```

- `EnterpriseFileContentPolicy.PDF_ACTIVE_TOKENS`에 `/openaction`이 있어 문자열 포함만으로 거부한다.
- 그런데 `/OpenAction [page /FitH null]`은 **"열 때 3페이지를 폭 맞춤으로 표시"하는 destination 배열**이다. 스크립트가 아니다.
- jsPDF, 여러 브라우저 "PDF로 저장", 워드프로세서 내보내기 PDF가 흔히 넣는다. 회원 증빙·보고서 PDF 상당수가 막힌다.
- 실제 위험한 경우(`/OpenAction << /S /JavaScript … >>`, `/S /Launch`)는 이미 `/javascript`, `/launch` 토큰으로 잡힌다.

### 2) 정책 거부 기록이 NOT NULL 위반으로 롤백 → 행이 영구 `PROCESSING`

`FileStoragePromotionOutboxService.markContentPolicyRejected`:

```sql
UPDATE file_storage_promotion_outbox
   SET status='FAILED_FINAL', attempt_count=attempt_count,
       next_attempt_at=NULL,   -- ← 컬럼이 NOT NULL
       ...
```

- `file_storage_promotion_outbox.next_attempt_at`은 `NOT NULL`이다.
- `FileContentPolicyViolationException` → `markContentPolicyRejected` → `DataIntegrityViolationException` → `requiresNew` 롤백.
- `processDueRows`의 `catch (RuntimeException)`는 `process()`만 감싼다. `markFailed`에서 난 예외는 루프를 깨고 스케줄러까지 올라간다.
- 결과
  - outbox 행: `PROCESSING` 그대로 (10분 뒤 `recoverStaleProcessingRows`가 `FAILED_RETRYABLE`로 되돌림 → 다시 거부 → 다시 갇힘, **무한 반복**)
  - `file_object`: `QUARANTINED`로 안 바뀌고 `PROMOTION_PENDING` 영구
  - 같은 배치의 뒤쪽 행들도 이번 실행에서 처리되지 않음

## 요청

### A. `markContentPolicyRejected` NOT NULL 위반 수정 (필수)

- `next_attempt_at=NULL` 대신 `next_attempt_at=now()` (또는 `COALESCE(next_attempt_at, now())`)로 쓴다. claim 조건이 `status IN ('PENDING','FAILED_RETRYABLE')`이라 `FAILED_FINAL`은 다시 집히지 않는다.
- 결과: outbox `FAILED_FINAL`, `file_object.upload_status = QUARANTINED`, 감사 `FILE_CONTENT_POLICY_REJECTED`.

### B. 실패 기록 예외가 배치를 깨지 않게 (필수)

- `processDueRows` 루프에서 `markFailed`가 던지는 예외도 행 단위로 잡아 로그를 남기고 다음 행으로 진행한다.
- `FileUploadConfirmOutboxService` 등 같은 패턴의 outbox가 있으면 함께 점검한다.

### C. PDF `/OpenAction` 판정 완화 (필수)

- `/OpenAction` 뒤 값이 **배열(destination, `[`로 시작)** 이면 허용한다.
- `/OpenAction` 뒤 값이 **사전(`<<`) 또는 간접 참조**이고, 그 action의 `/S`가 `/JavaScript`·`/Launch`·`/ImportData`·`/SubmitForm`·`/URI`(정책에 맞게)면 거부한다.
- 판정이 어려우면 최소한 `/openaction` 토큰을 목록에서 빼고, `/javascript`·`/launch`·`/embeddedfile`·`/richmedia`·`/aa`(추가 검토) 토큰 검사에 맡긴다.
- 규칙 변경은 모든 `filePurpose`에 공통 적용된다. 보안 담당 기준이 다르면 결과 보고에 명시하라.

### D. 로컬 데이터 복구

- `file_storage_promotion_outbox.id=50`을 `FAILED_RETRYABLE`, `next_attempt_at=now()`로 되돌려 C 반영 후 재승격되는지 확인한다. (또는 회원이 다시 업로드)

## 회귀 테스트

1. `/OpenAction [3 0 R /FitH null]`만 있는 PDF → 승격 성공, `AVAILABLE`.
2. `/OpenAction << /S /JavaScript /JS (app.alert(1)) >>` PDF → `FAILED_FINAL` + `QUARANTINED`, outbox `PROCESSING`에 남지 않음.
3. 정책 거부 행 뒤에 정상 행이 있는 배치 → 정상 행도 같은 실행에서 `SUCCEEDED`.
4. `markContentPolicyRejected`가 `DataIntegrityViolationException` 없이 끝난다(통합 테스트, 실제 스키마).

## 프론트 반영 상태 (참고)

- Platform `uploadMemberPortalFile`은 이제 `uploadStatus ∈ {QUARANTINED, DELETED, DESTROYED, EXPIRED}` 또는 `scanStatus ∈ {INFECTED, FAILED, DESTROYED}`면 즉시 실패로 끝내고 「보안 정책상 등록할 수 없는 파일입니다」를 보여준다.
- 즉 A만 고쳐도 사용자는 60초 대신 수 초 안에 거부 사유를 본다. C까지 고쳐야 정상 PDF가 올라간다.

## 보고 형식

- 변경 파일 목록
- A/B/C/D 각각 처리 결과
- 회귀 테스트 결과
- `/OpenAction` 판정 규칙 최종안(허용/거부 예시)
- 남은 위험
