# 프로그램 모집양식 상세정보 — 기존 string에 HTML 저장 가능 여부 확인

| 항목 | 값 |
|---|---|
| 작성일 | 2026-10-01 |
| 대상 | JABACK 프로그램 모집 상세 (`PATCH /api/admin/programs/{id}`, 포털 `GET /api/portal/programs/{id}`) |
| 우선순위 | **확인만** — 새 필드·엔드포인트 요청이 아님 |
| 화면 | CMS 프로그램 > 모집양식 > 상세 정보 |
| FE | `recruit-detail-info-paragraph.tsx`, overlay `recruit*.detailInfo.*` |

아래는 **구현 지시가 아니다.** 기존 컬럼이 HTML을 받아도 되는지만 답하라.  
가능하면 FE는 필드 추가 없이 에디터만 붙인다. 잘리거나 태그가 빠지면 그때 컬럼/검증만 고친다.

---

## 1. 한 줄

모집양식 상세의 **모집 안내 · 지원 방법 · 학습 지원 내용**(및 동형 기타사항)을 공지와 같은 WYSIWYG로 바꾼다.  
`additionalContentHtml` 과 같이 **지금 있는 string에 HTML을 넣을 수 있는지** 확인해 달라.  
**새 property / 새 API는 만들지 마라.** 못 받으면 이유(길이·sanitize·컬럼 타입)만 적어라.

---

## 2. 화면 → 지금 쓰는 필드

참여자 모집 폼 기준. 강사·봉사자·UJAT·Gemini·1사1교도 **같은 키 이름**을 nested `*RecruitmentInfo` / overlay 에 둔다.

| 화면 라벨 | 지금 CMS UI | wire / overlay suffix | OpenAPI 타입 |
|---|---|---|---|
| 썸네일 이미지 | 파일 | thumbnail | 파일 API — 이번 확인 제외 |
| 프로그램 설명 | 한 줄 입력 유지 | `description` / `programDescription` | `string` — **이번엔 에디터 아님** |
| 모집 안내 | textarea → **에디터** | `recruitmentGuide` | `string` |
| 지원 방법 | textarea → **에디터** | `applicationMethod` | `string \| null` |
| 학습 지원 내용 | textarea → **에디터** | `learningSupportContent` | `string` |
| 추가 내용 | 이미 에디터 | `additionalContentHtml` | `string` — **이미 HTML 계약** |
| 기타사항 (강사 등) | textarea → **에디터 예정** | `otherNotes` / `otherMatters` | `string` |
| 첨부 파일 | 파일 | attachments | 파일 API — 이번 확인 제외 |

저장 경로 예:

- top-level `PATCH /api/admin/programs/{id}` 의 `recruitmentGuide`, `applicationMethod`, `learningSupportContent`, `additionalContentHtml`
- nested `generalCommonInfo.participantRecruitmentInfo` (강사/봉사자 info 동형)
- 공개 `GET /api/portal/programs/{id}` 동일 키

본문 예 (에디터 저장분):

```html
<p>모집 안내입니다.</p>
<p><img src="/api/admin/files/2055827/content" alt="안내.png" class="rich-text-content__image" /></p>
```

인라인 이미지 purpose는 기존 `PROGRAM_INLINE_IMAGE` 다. 모집양식은 `ownerId: null` prepare 가 이미 된다. **파일 API를 이 확인에서 바꾸지 마라.**

---

## 3. 확인할 것 (예/아니오로)

각 필드(`recruitmentGuide`, `applicationMethod`, `learningSupportContent`, `otherNotes`/`otherMatters`)에 대해:

1. **HTML 유지**  
   `<p>`, `<strong>`, `<ul>`, `<a>`, `<img src="/api/admin/files/{id}/content">` 를 strip / escape / markdown 강제 변환하지 않는가?
2. **길이**  
   DB·검증 max가 `VARCHAR(255)` 수준이 아니고, `additionalContentHtml` 과 같이 긴 본문(수 KB~수십 KB)을 받는가? 한도가 있으면 **숫자**를 적어라.
3. **왕복**  
   PATCH에 넣은 HTML이 GET 상세·포털 GET에 **그대로** 내려오는가? (엔티티 이스케이프된 평문이면 안 됨)
4. **nested**  
   참여자 / 강사 / 봉사자 `*RecruitmentInfo` 의 같은 키도 1~3과 동일한가?
5. **포털**  
   `GET /api/portal/programs/{id}` 가 위 HTML을 내려주면, Platform은 태그 있으면 리치 텍스트로 그린다. 포털이 태그를 빼면 FE가 평문으로 보인다.

`additionalContentHtml` 은 이미 된다. **나머지 필드가 이와 같은지만** 대조하라.

---

## 4. 하지 말 것

- `recruitmentGuideHtml` 같은 **새 필드 추가**
- 엔드포인트 신설
- 기존 평문 데이터를 마이그레이션하거나 HTML로 변환
- `PROGRAM_INLINE_IMAGE` / public file 계약 변경 (별도 이슈)
- OpenAPI 타입을 `string` → 객체로 바꾸기

평문 기존 값은 그대로 두고, 앞으로 쓰는 값만 HTML이면 된다.

---

## 5. 판정

| 판정 | 의미 |
|---|---|
| **가능** | 위 필드에 HTML PATCH → GET/포털 왕복, 한도는 `additionalContentHtml` 급. FE는 에디터만 붙이면 됨 |
| **부분 가능** | 일부 키만 HTML 가능하거나 한도가 짧음. 키·maxLength를 표로 |
| **불가** | sanitize/짧은 VARCHAR. 어떤 검증·컬럼인지 경로를 적어라. FE는 그때 컬럼 확장만 요청함 |

---

## 6. 산출

`docs/handoff/recruit-detail-rich-text-html-storage-frontend-handoff-YYYY-MM-DD.md`

1. 판정 (가능 / 부분 / 불가)
2. 필드별 표: HTML 유지 · maxLength/컬럼 타입 · GET/포털 왕복
3. sanitize·XSS 필터가 있으면 허용 태그 목록
4. FE 영향: 에디터만 진행 / 한도 안내 / 컬럼 확장 재요청

---

## 복사용 짧은 프롬프트

```
JABACK 확인만. 새 필드·API 만들지 마라.

CMS 프로그램 모집양식 상세를 WYSIWYG로 바꾼다.
additionalContentHtml 은 이미 HTML이다.
같은 방식으로 기존 string에 HTML을 넣어도 되는지 확인해라.

필드:
- recruitmentGuide (모집 안내)
- applicationMethod (지원 방법)
- learningSupportContent (학습 지원 내용)
- otherNotes / otherMatters (기타사항, 강사 폼 등)
- 참여자/강사/봉사자 nested *RecruitmentInfo 동명 키
- description / programDescription 은 이번엔 한 줄 유지

확인할 것:
1) PATCH HTML(<p>, <img src="/api/admin/files/{id}/content">) 을 strip/escape 하지 않는가
2) VARCHAR(255) 가 아니고 additionalContentHtml 급 길이인가. 한도 숫자
3) GET /api/admin/programs/{id} 와 GET /api/portal/programs/{id} 에 HTML이 그대로 내려오는가

산출: 가능/부분/불가 + 필드별 표. 가능하면 FE는 에디터만 붙인다.
PROGRAM_INLINE_IMAGE 계약은 이 확인에서 바꾸지 마라.
```
