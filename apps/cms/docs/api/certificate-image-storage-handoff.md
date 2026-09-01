# 인증서·수료증 이미지 저장 연동 — FE/BE 핸드오프

발급 양식의 인증서·수료증 이미지가 업로드 직후에는 보이지만 저장 후 재진입하면 복원되지 않는 문제를 정리합니다.

## 대상

- `document-2` — 휴가 인증서
- `document-3` — 수료증
- `document-participation-certificate` — 참여인증서
- `document-4` — 강사 활동 인증서
- `document-5` — 봉사 활동 인증서

위 양식은 Payload D이며 `schemaJson`이 아니라 `settingsJson`을 사용합니다.

이미지 필드는 다음 4개입니다.

- `orgLogo`
- `orgLogo02`
- `certificateBackground`
- `chairmanSeal`

## 현재 증상

1. 파일 선택 직후에는 브라우저의 `URL.createObjectURL(file)`로 미리보기가 표시됩니다.
2. 저장 시 mock 업로드가 생성한 `/uploads/image/file-....png` URL이 `settingsJson`에 들어갑니다.
3. 실제 서버에 파일이 저장되지 않으므로 재진입 후 해당 URL 요청이 실패합니다.
4. 이미지 파싱에 실패하거나 URL이 없으면 FE 기본 에셋으로 대체됩니다.

따라서 같은 세션의 미리보기 성공은 서버 업로드 성공을 의미하지 않습니다.

## 현재 FE 구현 근거

- mock 업로드와 가짜 URL 생성  
  `src/entities/application/api/file-upload-service.ts`
- 파일 선택 직후 blob 미리보기 및 mock 업로드 호출  
  `src/features/template/ui/template-management/template-custom-fields-form.tsx`
- `settingsJson` 이미지 파싱·저장  
  `src/features/template/lib/certificate-form-settings.ts`
- 템플릿 버전 API load/save  
  `src/features/template/api/admin-form-templates-service.ts`
- 인증서 편집 모달 저장  
  `src/pages/templates/form-template-fullpage-modal.tsx`

현재 파서는 다음 형태만 이미지로 인정합니다.

```json
{
  "url": "/uploads/image/example.png",
  "fileName": "example.png",
  "fileSize": 12345,
  "uploadedAt": "2026-07-20T00:00:00.000Z"
}
```

`fileId` 문자열만 전달하거나 `{ "fileId": 1 }`처럼 `url`이 없는 객체를 전달하면 FE는 해당 이미지를 복원하지 못합니다.

## 시드 상태

인증서 5종 시드의 이미지 필드는 모두 `null`입니다.

```json
{
  "orgLogo": null,
  "orgLogo02": null,
  "certificateBackground": null,
  "chairmanSeal": null
}
```

이는 기본 이미지 사용을 의미하며 오류는 아닙니다. 관리자가 업로드한 이미지는 실제 파일 저장소와 연결된 참조값으로 별도 저장되어야 합니다.

## 합의가 필요한 API 계약

### 권장안

1. 공통 파일 업로드 API가 실제 파일을 저장합니다.
2. 응답은 최소 `fileId`와 브라우저에서 표시 가능한 `url`을 반환합니다.
3. FE는 응답 객체를 인증서 `settingsJson`에 저장합니다.
4. 템플릿 버전 조회 응답은 저장된 이미지 참조에 유효한 `url`을 포함합니다.

권장 응답·저장 형태:

```json
{
  "fileId": 123,
  "url": "https://cdn.example.com/templates/certificate-background.png",
  "fileName": "certificate-background.png",
  "fileSize": 12345,
  "uploadedAt": "2026-07-20T00:00:00.000Z"
}
```

상대 URL을 반환한다면 API base URL과 결합해야 하는지 계약에 명시해야 합니다. 만료 URL을 사용한다면 조회 시 갱신된 URL을 반환해야 합니다.

## 역할

### FE

- mock `fileUploadService.upload()`를 실제 업로드 API 호출로 교체
- 확정된 파일 응답 형식에 맞게 이미지 파서 확장
- 업로드 응답을 `settingsJson`에 저장
- 재진입 시 이미지 URL 복원 및 기본 에셋 fallback 유지
- 업로드·저장·재조회 실패 상태를 사용자에게 표시

### BE

- 실제 파일 업로드 및 접근 URL 제공
- 파일 권한, 확장자, 용량, 보존 정책 확정
- 템플릿 버전 `settingsJson`에 이미지 참조 보존
- 템플릿 버전 조회 시 FE가 표시할 수 있는 URL 반환
- 템플릿 삭제·이미지 교체 시 미사용 파일 정리 정책 제공

## 완료 조건

- 이미지를 업로드하면 네트워크 요청으로 실제 파일이 저장된다.
- 저장한 `settingsJson`에 확정된 이미지 참조가 포함된다.
- 새로고침·로그아웃·다른 브라우저에서도 동일 이미지가 표시된다.
- `document-2`~`document-5`와 `document-participation-certificate`가 각각 독립된 이미지를 유지한다.
- 이미지가 없거나 조회에 실패하면 기본 에셋이 표시되고 화면이 깨지지 않는다.
- PDF 다운로드와 프로그램 실발급 미리보기에도 저장된 이미지가 반영된다.

## Payload E 3종과의 구분

다음 양식은 인증서 이미지 문제와 별개인 Payload E입니다.

- `issuance-1` — UJAT 결과리포트
- `issuance-5` — 결과보고서
- `document-1` — 지출증빙서류(필수폼)

현재 빈 `paragraphs`는 최종 JSON이 아니라 구현 전 플레이스홀더입니다. 화면·필드·발급 데이터 매핑 스펙이 확정되면 FE가 다음을 구현해 BE에 전달합니다.

1. `WritingFormDraft` factory와 단락 JSON
2. 편집·미리보기·저장 UI
3. 프로그램 실발급 데이터 매핑
4. 초기 DRAFT 시드 JSON
5. 백엔드 시드 반영용 핸드오프 문서와 검증 기준

BE는 전달받은 시드를 등록하고 버전 load/save 및 실발급에 필요한 데이터 API를 제공합니다. 단, 필드 구성과 출력 디자인이 확정되지 않은 상태에서 FE가 JSON 구조를 임의로 결정해서는 안 됩니다.

## 관련 문서

- [발급 양식 API 후속 작업](./issuance-form-api-follow-up.md)
- [발급 양식 시드 JSON — 백엔드 전달](./issuance-form-seeds-backend-handoff.md)
- [폼 템플릿 JSON 계약](./form-template-json-contract.md)
