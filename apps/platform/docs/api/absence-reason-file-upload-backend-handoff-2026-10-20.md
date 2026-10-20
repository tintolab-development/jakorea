# Platform 교육현황 — 결석 사유 증빙 파일 업로드 백엔드 연동 확인

| 항목    | 값                                                             |
| ------- | -------------------------------------------------------------- |
| 작성일  | 2026-10-20                                                     |
| 대상    | Platform 마이페이지 교육현황 결석 사유 제출 모달               |
| FE 상태 | 업로드·제출 플로우 구현 완료                                   |
| BE 상태 | 신규 API 불필요. 파일 목적값·첨부 정책·스모크 테스트 확인 필요 |
| OpenAPI | 관련 Portal 파일 업로드/결석 사유 제출 경로 존재               |

## 0. 확인 결과

현재 프론트는 회원 포탈 공통 파일 업로드 플로우를 사용한다.

1. 업로드 요청 URL 발급
2. 발급된 `uploadUrl`로 파일 바이트 업로드
3. 파일 업로드 확정
4. `CLEAN` + `AVAILABLE` 상태까지 조회
5. 반환된 `fileObjectId[]`를 결석 사유 제출 body에 전달

결석 증빙 파일 목적값은 백엔드 파일 목적 정의에 맞춰 `ABSENCE_EVIDENCE`로 정렬했다.
기존 프론트의 `ABSENCE_REASON_EVIDENCE`는 백엔드 목적값과 일치하지 않아 업로드 요청이 거부될 수 있는 값이었다.

로컬 백엔드에 인증 없이 다음 경로를 호출한 결과는 모두 `401`이었다. 인증 라우트가 정상적으로 등록되어 있음을 확인했으며, 실제 업로드 성공 여부는 로그인 회원 토큰과 파일이 필요하다.

- `POST /api/portal/me/files/upload-requests`
- `POST /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/absence-reasons`

## 1. 사용 API

| 순서 | Method      | Path                                                                                                           | 용도                              |
| ---: | ----------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------- |
|    1 | POST        | `/api/portal/me/files/upload-requests`                                                                         | 회원 파일 업로드 URL 발급         |
|    2 | 응답 method | 응답의 `uploadUrl`                                                                                             | Object Storage 파일 바이트 업로드 |
|    3 | POST        | `/api/portal/me/files/{fileObjectId}/confirm`                                                                  | 파일 업로드 확정                  |
|    4 | GET         | `/api/portal/me/files/{fileObjectId}`                                                                          | 보안 검사 상태 확인               |
|    5 | POST        | `/api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/absence-reasons` | 결석 사유 및 증빙 ID 제출         |

## 2. 요청 계약

### 2.1 파일 업로드 요청

```json
{
  "filePurpose": "ABSENCE_EVIDENCE",
  "originalFileName": "absence-proof.jpg",
  "contentType": "image/jpeg",
  "fileSize": 123456
}
```

프론트 제한:

- JPG/JPEG, PNG
- 파일당 최대 20MB
- 결석 사유 제출당 최대 20개

### 2.2 결석 사유 제출

```json
{
  "reason": "개인 사유로 교육에 참석하지 못했습니다.",
  "fileObjectIds": [12345, 12346]
}
```

`reason`은 필수이며 최대 2,000자, `fileObjectIds`는 선택이며 최대 20개다. 파일이 없으면 `fileObjectIds`를 생략한다.

## 3. 백엔드 확인 요청

신규 컨트롤러나 신규 path를 추가하는 작업은 아니다. 아래 정책이 현재 로컬·스테이징 백엔드에 동일하게 적용되는지만 확인해 주세요.

1. `filePurpose=ABSENCE_EVIDENCE`를 회원 포탈 업로드 목적값으로 허용
2. 결석 증빙 파일의 JPG/JPEG/PNG 및 파일당 20MB 정책 적용
3. 결석 사유 제출 시 로그인 회원 본인이 업로드한 파일만 허용
4. 파일 상태가 `CLEAN` 및 `AVAILABLE`인 경우에만 `fileObjectIds` 연결 허용
5. 다른 목적값 파일, 다른 회원 파일, 미확정·검사 중 파일 연결 거부
6. `fileObjectIds` 20개 초과 요청 거부
7. 연결된 파일의 목적값이 `ABSENCE_EVIDENCE`인지 검증

## 4. OpenAPI 보완 요청

현재 `AbsenceReasonSubmissionRequest.fileObjectIds`의 `maxItems=20`과 `reason.maxLength=2000`은 반영되어 있다. 다만 회원 포탈 파일 업로드 요청의 `filePurpose`가 일반 `string`으로만 노출되어 목적값 계약이 명확하지 않다.

가능하면 OpenAPI에 다음 내용을 명시해 주세요.

- `filePurpose` 허용값에 `ABSENCE_EVIDENCE` 추가
- `ABSENCE_EVIDENCE` 설명: 결석 사유 증빙, JPG/JPEG/PNG, 파일당 20MB
- 결석 사유 제출의 `fileObjectIds`는 본인 소유·`CLEAN`·`AVAILABLE` 파일만 허용한다는 설명
- 목적값·소유권·파일 상태 위반 시의 최종 HTTP 상태 및 `error.code`

## 5. 인수 테스트

인증된 일반 회원 계정과 실제 교육 일정으로 다음을 확인한다.

1. JPG/PNG 파일 업로드 요청이 `ABSENCE_EVIDENCE`로 성공한다.
2. Storage 업로드와 confirm 이후 파일 상태가 `CLEAN` + `AVAILABLE`이 된다.
3. 반환된 `fileObjectId`를 포함한 결석 사유 제출이 `200`으로 성공한다.
4. 제출 응답의 `fileObjectIds`, `submissionId`, `scheduleId`, `reviewStatus`가 반환된다.
5. 파일 없이 사유만 제출할 수 있다.
6. 20MB 초과, JPG/PNG 외 파일은 거부된다.
7. 21개 파일, 다른 회원 파일, 다른 `filePurpose` 파일은 거부된다.
8. 파일 보안 검사 실패·타임아웃 시 결석 사유 제출이 실행되지 않는다.
9. 제출 성공 후 교육 일정 조회에서 결석 사유 상태가 갱신된다.

## 6. FE 구현 위치

- 파일 업로드 공통 처리: `src/features/mypage/instructor-apply/api/member-file-upload.ts`
- 결석 사유 모달: `src/features/mypage/education/schedules/ui/absence-reason-modal.tsx`
- 결석 사유 제출 API: `src/features/mypage/education/applications/api/activity-client.ts`
- 제출 mutation/cache 갱신: `src/features/mypage/education/applications/api/activity-hooks.ts`
