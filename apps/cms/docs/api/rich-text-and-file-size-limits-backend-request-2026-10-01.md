# 리치 텍스트·파일 업로드 용량/글자수 서버 검증 요청

| 항목 | 값 |
|---|---|
| 작성일 | 2026-10-01 |
| 대상 | JABACK 리치 텍스트 저장 API + Admin Files / 도메인 파일 바인딩 API |
| 우선순위 | **P1** — FE 제한만으로는 우회 요청·기존 첨부 합산 검증 불가 |
| 관련 FE | `@jakorea/rich-text`, CMS 공지/FAQ/프로그램 모집양식/메일/게시글 에디터, 파일 첨부/썸네일 업로드 |

아래는 **CMS 백엔드(JABACK)** 검증 규칙 추가 요청이다.  
FE에도 동일 제한을 적용하지만, 최종 데이터 무결성은 서버에서 막아야 한다.

---

## 1. 한 줄 요약

서버에서도 아래 정책을 공통 검증하라.

1. 리치 텍스트 본문: **50,000자 허용, 50,001자 차단**
2. 리치 텍스트 인라인 이미지: **총합 20MB 이하**
   - 단건 20MB 허용
   - 단건 20MB 초과 차단
   - 여러 장 합산 20MB 초과 차단
3. 일반 첨부파일 / 썸네일: **15MB 초과 차단**
4. 일반 첨부파일 다건 바인딩은 **저장된 기존 첨부까지 포함한 총합 15MB** 검증

---

## 2. FE 정책과 서버 검증 필요성

FE는 입력 시점 UX로 차단한다.

| 구분 | FE 정책 |
|---|---|
| rich-text 글자수 | visible text 기준 50,000자 |
| rich-text 이미지 | 에디터 내 업로드 이미지 file size 총합 20MB |
| 일반 첨부파일 | 총합 15MB |
| 썸네일 | 단건 15MB |

하지만 FE 검증은 다음을 막지 못한다.

- API 직접 호출
- 기존 저장 첨부의 file size를 FE가 모르는 화면
- 여러 세션/탭에서 동시 수정
- 첨부 바인딩 API에 이미 업로드된 `fileObjectId`만 전달되는 경우

따라서 서버가 최종 검증해야 한다.

---

## 3. 리치 텍스트 본문 50,000자

### 대상

리치 텍스트 HTML/Markdown을 저장하는 모든 CMS 필드.

예:

- 공지사항 본문
- FAQ 답변
- 프로그램 모집양식 상세정보 에디터 필드
- 프로그램 추가 내용
- 프로그램 게시글 본문
- 메일 템플릿 본문
- 기타 `@jakorea/rich-text` 기반 CMS 저장 필드

### 기준

- **HTML 문자열 길이 아님**
- 사용자에게 보이는 텍스트 기준
- 태그(`<p>`, `<strong>`, `<img>` 등)는 글자수에서 제외
- 50,000자까지 허용
- 50,001자부터 400

예:

```html
<p>안녕하세요</p>
```

위 값은 HTML length가 아니라 `안녕하세요` 5자로 계산한다.

### 기대 오류

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "field": "content",
    "message": "본문은 최대 50,000자까지 입력할 수 있습니다."
  }
}
```

필드명은 실제 요청 필드에 맞춰 `content`, `answer`, `additionalContentHtml`, `recruitmentGuide` 등으로 내려도 된다.

---

## 4. 리치 텍스트 인라인 이미지 총합 20MB

### 대상 purpose

리치 텍스트 안에 삽입되는 인라인 이미지.

| purpose | 사용 예 |
|---|---|
| `NOTICE_INLINE_IMAGE` | 공지사항 본문 이미지 |
| `FAQ_INLINE_IMAGE` | FAQ 답변 이미지 |
| `PROGRAM_INLINE_IMAGE` | 프로그램 모집양식/상세정보 에디터 이미지 |
| `PROGRAM_POST_INLINE_IMAGE` | 프로그램 게시글 이미지 |
| `MAIL_TEMPLATE_ATTACHMENT` 중 에디터 인라인 이미지로 쓰는 파일 | 메일 템플릿 본문 이미지 |

실제 목적값이 다르면 백엔드 구현 기준 purpose 목록으로 보정하라.

### 검증 기준

에디터 본문에 포함된 인라인 이미지들의 `file_object.file_size` 합산이 **20MB 이하**여야 한다.

| 케이스 | 결과 |
|---|---|
| 이미지 1개 20MB | 허용 |
| 이미지 1개 20MB + 1 byte | 차단 |
| 이미지 10MB + 10MB | 허용 |
| 이미지 10MB + 10MB + 1 byte | 차단 |

외부 이미지 URL은 파일 업로드가 아니므로 합산 대상이 아니다.  
`/api/admin/files/{fileObjectId}/content` 또는 바인딩된 inline image file object만 합산한다.

### 검증 시점

둘 다 필요하다.

1. 본문 저장 API
   - 본문 HTML/Markdown 안의 file id를 파싱해 합산
2. inline image 바인딩 API
   - 예: `PUT /api/admin/content/notices/{id}/inline-images`
   - 예: `PUT /api/admin/content/faqs/{id}/inline-images`
   - 예: `PUT /api/admin/programs/{id}/inline-images`

본문과 바인딩 목록이 분리되어 있으면, **최종 바인딩 기준**으로 합산해도 된다.  
중요한 것은 저장 완료 상태에서 인라인 이미지 총합이 20MB를 넘지 않는 것이다.

### 기대 오류

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "field": "inlineImages",
    "message": "에디터 이미지는 총 20MB까지 업로드 가능합니다."
  }
}
```

---

## 5. 일반 첨부파일 / 썸네일 15MB

### 대상

리치 텍스트 내부 이미지가 아닌 일반 파일 업로드.

| 구분 | 정책 |
|---|---|
| 썸네일 | 단건, 15MB 이하 |
| 일반 첨부파일 | 다건 가능, 총합 15MB 이하 |

### 대상 예

- 프로그램 썸네일
- 프로그램 상세 첨부
- 프로그램 게시글 첨부
- 공지사항 첨부
- FAQ/콘텐츠 첨부가 있으면 동일
- 메일/문자 템플릿 첨부
- 기타 CMS 일반 첨부

민감 보존 파일·정산 증빙 등 별도 정책 purpose가 있으면 제외 목록을 명시하라.

### 검증 기준

#### 썸네일

- 바인딩 가능한 파일은 1개
- `file_size > 15MB` 차단

#### 일반 첨부파일

`PUT .../attachments` 같이 `fileObjectIds` 전체 교체 방식이면:

```text
sum(file_object.file_size where id in request.fileObjectIds) <= 15MB
```

이어야 한다.

즉, FE가 이번에 새로 선택한 파일만 보는 게 아니라, **요청에 포함된 기존 저장 첨부까지 모두 합산**해야 한다.

예:

| 기존 저장 첨부 | 신규 첨부 | 요청 fileObjectIds 총합 | 결과 |
|---:|---:|---:|---|
| 10MB | 4MB | 14MB | 허용 |
| 10MB | 6MB | 16MB | 차단 |
| 0MB | 15MB | 15MB | 허용 |
| 0MB | 15MB + 1 byte | 15MB + 1 byte | 차단 |

### 기대 오류

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "field": "attachments",
    "message": "첨부파일은 총 15MB까지 업로드 가능합니다."
  }
}
```

썸네일은 field를 `thumbnail` 또는 실제 필드명으로 내려도 된다.

---

## 6. API 응답에 필요한 파일 size 정보

FE가 수정 화면에서 기존 첨부까지 포함해 총합을 보여주려면 상세 응답에 file size가 필요하다.

다음 응답에 각 첨부의 `fileSize`를 내려라.

- `GET /api/admin/content/notices/{id}` 또는 공지 첨부 조회
- `GET /api/admin/programs/{id}` 또는 프로그램 첨부 조회
- `GET /api/admin/programs/{id}/attachments`
- 프로그램 게시글 첨부 조회
- 메일/문자 템플릿 첨부 조회
- 기타 일반 첨부 조회

이미 `fileSize`가 있는 API는 유지하면 된다. 없는 API만 보강하라.

예:

```json
{
  "fileObjectId": 123,
  "originalFileName": "guide.pdf",
  "contentType": "application/pdf",
  "fileSize": 1048576
}
```

---

## 7. 하지 말 것

- FE 검증만 믿고 서버 검증 생략
- 썸네일과 일반 첨부를 20MB로 올리기
- 리치 텍스트 HTML 태그 길이를 글자수로 계산
- 외부 이미지 URL을 file size 합산에 포함
- 민감 보존 파일 purpose에 일반 첨부 15MB 정책을 무조건 적용

---

## 8. Done when

- [ ] rich-text 본문 visible text 50,000자 저장 성공
- [ ] rich-text 본문 visible text 50,001자 저장 400
- [ ] 인라인 이미지 20MB 단건 저장/바인딩 성공
- [ ] 인라인 이미지 20MB 초과 단건 저장/바인딩 400
- [ ] 인라인 이미지 여러 장 합산 20MB 초과 저장/바인딩 400
- [ ] 썸네일 15MB 초과 400
- [ ] 일반 첨부 fileObjectIds 총합 15MB 초과 400
- [ ] 일반 첨부 조회 응답에 기존 첨부 `fileSize` 포함

---

## 복사용 짧은 프롬프트

```text
JABACK 서버 검증 추가 요청.

FE에도 제한을 넣지만 서버에서도 반드시 막아야 한다.

1) 리치 텍스트 본문
- HTML length가 아니라 visible text 기준
- 50,000자 허용
- 50,001자부터 400 VALIDATION_FAILED
- 대상: 공지/FAQ/프로그램 모집양식/프로그램 게시글/메일 템플릿 등 rich-text 저장 필드

2) 리치 텍스트 인라인 이미지
- inline image file_object.file_size 총합 20MB 이하
- 20MB 단건 허용
- 20MB 초과 단건 차단
- 여러 장 합산 20MB 초과 차단
- 대상 purpose: NOTICE_INLINE_IMAGE, FAQ_INLINE_IMAGE, PROGRAM_INLINE_IMAGE, PROGRAM_POST_INLINE_IMAGE, 메일 템플릿 인라인 이미지 purpose
- 본문 저장 API 또는 inline-images 바인딩 API에서 최종 상태 기준으로 검증

3) 일반 첨부파일 / 썸네일
- 썸네일: 단건 15MB 이하
- 일반 첨부파일: 다건 가능, fileObjectIds 전체 file_size 총합 15MB 이하
- 기존 저장 첨부까지 포함한 진짜 총합으로 검증
- PUT .../attachments 에 요청된 fileObjectIds 전체 합산

4) FE 수정 화면을 위해 첨부 조회/상세 응답에 fileSize 포함

외부 이미지 URL은 인라인 이미지 용량 합산 대상 아님.
HTML 태그 길이를 글자수로 세지 말 것.
민감 보존 파일 purpose는 별도 정책이면 제외 목록 명시.
```
