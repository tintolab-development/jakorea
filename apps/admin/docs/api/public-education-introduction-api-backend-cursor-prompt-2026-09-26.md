# Cursor prompt — 공개 교육 소개 API 계약 확인·정합 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·공개 필터는 이 문서만 사용하라.

질문이 필요하면 OpenAPI·기존 Spec·enabled 필터가 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/public-education-introduction-api-backend-cursor-prompt-2026-09-26.md`

관련 시드 문서(별도):

`apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-26.md`

이전 합본(`education-platform-seed-backend-cursor-prompt-2026-09-20.md`)의 path와 충돌하면 **이 문서가 우선**이다. 새 path를 만들지 마라.

---

## 배경 (2026-09-26 Platform FE 기준)

Admin 「교육 소개 관리」와 Platform 「교육 소개」는 아래 API만 쓴다. Platform은 mock 본문 fallback이 없다.

| 화면 | Method | Path | 권한 |
|------|--------|------|------|
| Admin 프로그램 소개 4탭 | GET/PUT | `/api/admin/education/program-intros/{fieldCode}` | Admin JWT. PUT는 `version` |
| Platform 프로그램 4페이지 | GET | `/api/public/education/program-intros/{fieldCode}` | 없음 |
| Admin 사업분야 | GET/PUT | `/api/admin/education/business-catalog` | Admin JWT |
| Admin 교육 대상 | GET/PUT | `/api/admin/education/targets` | Admin JWT |
| Admin 교재 | GET/POST/PUT/PATCH/DELETE | `/api/admin/education/textbooks…` | Admin JWT |
| Platform 교재 목록 | GET | `/api/public/education/textbooks` | 없음. 페이지 키는 `items` |
| Platform 교재 상세 | GET | `/api/public/education/textbooks/{id}` | 없음 |
| Platform 교재 디렉터리 문단 | GET | `/api/public/education/overview` | 없음. `introText` · `businessFields` · `targets` |

`fieldCode` 고정:

| fieldCode | Admin 탭 | Platform path |
|-----------|----------|---------------|
| `CAREER_EMPLOYMENT` | 진로·취업 | `/education/career` |
| `ECONOMICS_FINANCE` | 경제·금융 | `/education/finance` |
| `ENTREPRENEURSHIP` | 기업가 정신 | `/education/entrepreneurship` |
| `DIGITAL_LITERACY` | 디지털 리터러시 | `/education/digital-literacy` |

OpenAPI에 위 path가 이미 있다. **없으면 그 path·기존 DTO 이름으로 구현**하라. 다른 이름(`/education/intros`, `/programs` 재사용)은 금지.

`GET /api/admin/education/programs` · `GET /api/public/education/programs` 는 CMS 신청 카탈로그다. 교육 소개 본문으로 쓰지 마라.

---

## Goal

1. 무토큰 공개 GET 4종이 **200**이고 아래 shape다.
2. 공개 응답에서 `enabled=false` 사업분야·교재·비활성 대상은 빠진다.
3. 사업분야 `enabled=false` 인 `fieldCode`의 프로그램 소개 공개 GET은 **404**.
4. 알 수 없는 `fieldCode` 는 **404**.
5. Admin path·DTO 이름은 바꾸지 않는다. 공개 스키마 필드명도 바꾸지 않는다.
6. 공개 프로그램 소개에 `version` 을 넣지 않는다. Admin GET/PUT에는 `version` 이 있다.
7. 공개 교재 **목록** item에 `unitCount`, `sessionDescription` 이 있다. 상세와 같은 값이다. OpenAPI list item에 없으면 **그 두 필드만** 목록 스키마에 추가하라. 새 path는 만들지 마라.

완료 조건:

```bash
curl -sS 'http://localhost:8081/api/public/education/program-intros/CAREER_EMPLOYMENT'
curl -sS 'http://localhost:8081/api/public/education/program-intros/DIGITAL_LITERACY'
curl -sS 'http://localhost:8081/api/public/education/overview'
curl -sS 'http://localhost:8081/api/public/education/textbooks?page=0&size=20'
```

- program-intros: `fieldCode`, `heroText`, `sections[]`
- `sections[]`: `sectionKey`, `sortOrder`, `programType`, `typeDescription`, `representativeProgram`, `sponsorName`, `representativeDescription`, `images[]`
- `images[]`: `sortOrder`, `alt`, `width`, `height`, `publicUrl`
- overview: `introText`, `businessFields[]`(`fieldCode`, `displayName`, `description`, `displayOrder`, `enabled`는 공개에서 빼도 됨), `targets[]`(`targetCode`, `targetName`, `displayOrder`)
- textbooks items: `id`, `textbookName`, `description`, `thumbnailUrl`, `educationEffect`, `businessField`, `targets`, `unitCount`, `sessionDescription`
- detail 추가: `unitIntroHtml`

---

## Out of scope / 금지

- `GET /api/public/education/programs` 를 프로그램 소개 본문으로 재사용
- 갤러리 크롭·`object-position`·히어로 영문 라벨(`Work Readiness` 등)을 DB/API에 추가. 프론트 고정
- 교재 `compositions[]` 컬럼 추가
- 디렉터리에 교재 제목이 아닌 짝 제목(`아이디어 랩`, `용돈 관리 교실` 등)을 위한 별도 리소스
- 디렉터리 제목(`진로취업`, `경제금융`, `기업가정신`, `디지털리터러시`)을 API로 제공. 프론트 탭 상수
- `version` 을 공개 프로그램 소개에 노출
- Admin/Platform 프론트 수정
- 시드 SQL (시드 문서에서 한다)
- prod Flyway에 운영 카피

---

## 1. 프로그램 소개

`sections` 길이는 고정 3이 아니다. 진로·경제·기업가 3, 디지털 2.  
`sectionKey` 는 프론트 레이아웃 키다. 이름을 바꾸지 마라.

| fieldCode | sectionKey |
|-----------|------------|
| CAREER_EMPLOYMENT | `explore`, `experience`, `strengthen` |
| ECONOMICS_FINANCE | `ujat`, `employee`, `instructor` |
| ENTREPRENEURSHIP | `startup`, `contest`, `elementary` |
| DIGITAL_LITERACY | `ai-literacy`, `sw-ai` |

`heroText` 는 `\n` 으로 줄을 나눈다.  
`representativeProgram` · `sponsorName` · `representativeDescription` 는 빈 문자열 허용.  
`images[].publicUrl` 은 공개 GET에 필수. `assetId` 는 Admin에만.

PUT body는 GET과 같은 필드 + `version`. 충돌은 기존 `OPTIMISTIC_LOCK_CONFLICT`.

---

## 2. 사업분야 · 교육 대상 · overview

공개 overview의 `businessFields` 는 **enabled=true 만**, `displayOrder` 오름차순.  
`targets` 는 고정 5코드, `displayOrder` 오름차순.

| targetCode | Platform 칩에 쓰는 이름(시드 문서) |
|------------|-----------------------------------|
| `PRESCHOOL` | 유아, 유치원생 |
| `ELEMENTARY` | 초등학교 |
| `MIDDLE_SCHOOL` | 중학교 |
| `HIGH_SCHOOL` | 고등학교 |
| `ADULT` | 성인 |

소문자 `preschool` 을 공개 코드로 쓰지 마라. FE 매퍼는 위 enum만 안다.

---

## 3. 교재

공개 목록·상세는 **enabled=true 만**.  
목록 쿼리 `page`, `size`, `businessFieldCode` 는 기존과 같다.  
상세 `unitIntroHtml` 은 HTML 문자열. 단원 배열 JSON을 새로 만들지 마라.

목록 item에 `unitCount`, `sessionDescription` 이 없으면 카탈로그 카드의 「교육 차시」가 비는다. 상세에만 두지 말고 목록에도 넣어라.

---

## 작업 후 회신

```text
- 변경 파일:
- 신설 path: (없어야 함. 있었으면 none)
- 목록 item에 unitCount·sessionDescription 추가 여부:
- 공개 program-intros에 version 없음:
- enabled=false 공개 제외:
- TRUNCATE 사용 여부: (없어야 함)
```
