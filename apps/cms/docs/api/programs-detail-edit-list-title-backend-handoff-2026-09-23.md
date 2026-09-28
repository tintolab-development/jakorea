# Programs API · 2026-09-23 BE 수정 요청

**작성일:** 2026-09-23  
**우선순위:** P1  
**요청 대상:** Programs API · `POST /api/admin/programs` · `PATCH /api/admin/programs/{id}` · `GET /api/admin/programs` · `GET /api/admin/programs/{id}`  
**이 문서만으로 구현·검수할 수 있다.**

오늘 전달. **요청 A**는 목록 프로그램명. **요청 B**는 사업 운영 기간 — **현재 SSOT는** [`program-business-period-any-dates-backend-request-2026-09-28.md`](./program-business-period-any-dates-backend-request-2026-09-28.md) (아무 날짜, `2025.04.01 ~ 2027.08.23` 포함). **요청 C**는 1사1교 임금↔정산 테이블 (별도 문서).

| # | 요약 | 유형 |
|---|------|------|
| A | 상세에서 고친 대표 프로그램명(국문)이 목록에 안 나옴 | 일반 관측. UJAT · 1사1교 · 교육받은 교사도 동일 |
| B | 사업 운영 기간을 1/1~12/31·같은 해로 강제하지 말 것. 선택값을 그대로 저장 | **전 유형 공통** |
| C | 1사1교 등록 round-trip (임금·정산 기본값, 회차·기간·공고명·JSON 미러) | **`COMPANY_SCHOOL`만** · [company-school-registration-roundtrip-backend-handoff-2026-09-27.md](./company-school-registration-roundtrip-backend-handoff-2026-09-27.md) |

---

## 요청 A. 상세 수정 후 목록 프로그램명 미반영

**관측 프로그램:** `id=186020` (`GENERAL_INDIVIDUAL`)  
**대상 유형:** 일반(`GENERAL_INDIVIDUAL` / `GENERAL_ORGANIZATION`). 동일 `title`/`mainTitle` 컬럼을 쓰는 UJAT · 1사1교 · 교육받은 교사도 같은 규칙으로 맞춰 주세요.

---

## 1. 무엇을 바꾸는가

CMS **프로그램 상세 → 공통 정보 → 대표 프로그램명 (국문)** 을 수정해 저장하면, **상세 GET의 `mainTitle`은 바뀌는데 목록 GET의 프로그램명은 생성 당시 값이 그대로**입니다.

목록 「프로그램명」은 **대표 프로그램명 (국문)** 입니다. 상세에서 고친 그 값이 목록에도 나와야 합니다.

| CMS 라벨 | 1차 컬럼 | 등록 시 FE | 상세 수정 시 FE |
|----------|----------|------------|-----------------|
| 대표 프로그램명 (국문) | **`mainTitle`** | `mainTitle` + `title`에 동일 값 | **`mainTitle` + `title`에 동일 값** PATCH |
| 대표 프로그램명 (영문) | `titleEn` | `titleEn` | `titleEn` PATCH |
| 공고용 프로그램명 | 1차 컬럼 없음 | `serviceDetailJson.generalCommonInfo.announcementTitle` | JSON `announcementTitle` |
| (내부) 관리/레거시 제목 | `title` | 등록 때 대표명과 같게 보냄 | **보내지 않음** |

CMS에서 대표 프로그램명 (국문) = 목록 「프로그램명」 = 상세 모달 타이틀입니다. FE는 이 값을 `mainTitle`과 `title`에 같이 넣고, 목록·모달은 `mainTitle`을 우선 표시합니다.

---

## 2. 재현

1. CMS 일반 프로그램 등록. 대표 프로그램명 (국문)을 예: `세부프로그램명 경제리터러시기초`.
2. 상세 공통 정보에서 대표 프로그램명 (국문)을 `수정1`로 바꾸고 저장.
3. `PATCH /api/admin/programs/186020` → 200.
4. `GET /api/admin/programs/186020` (상세) 와 `GET /api/admin/programs` (목록) 비교.

**기대**

| 필드 | 상세 | 목록 |
|------|------|------|
| `mainTitle` | `수정1` | `수정1` |
| 목록 프로그램명으로 쓰는 값 | — | `수정1` |

**실제 (186020, 2026-09-23)**

| 필드 | 상세 GET | 목록 GET |
|------|----------|----------|
| `mainTitle` | `수정1` | `세부프로그램명 경제리터러시기초` |
| `title` | `세부프로그램명 경제리터러시기초` | `세부프로그램명 경제리터러시기초` |
| `titleEn` | `수정1` | `수정1` |

`titleEn`은 목록·상세가 같습니다. **`mainTitle`만 목록이 상세와 다릅니다.** 목록 `mainTitle`이 상세 `title`(생성값)과 같습니다. 목록 프로젝션이 갱신된 `mainTitle` 컬럼을 읽지 않고 `title`을 복사하는 것으로 보입니다.

---

## 3. API

| # | Method | Path | 화면 |
|---|--------|------|------|
| A | `PATCH` | `/api/admin/programs/{id}` | 상세 공통 정보 저장 |
| B | `GET` | `/api/admin/programs/{id}` | 상세 |
| C | `GET` | `/api/admin/programs` | 목록 |

권한: 관리자 · 프로그램 수정/조회.

---

## 4. FE PATCH 계약 (공통 정보 저장)

대표 국문을 고치면 **`title`과 `mainTitle`을 같은 값으로** 보냅니다. 목록·상세 모달 타이틀이 이 값입니다.

```json
{
  "title": "수정1",
  "mainTitle": "수정1",
  "titleEn": "수정1",
  "serviceDetailJson": "{ ... generalCommonInfo.announcementTitle, registration.overlay ... }"
}
```

매퍼: `mapProgramPatchFieldsToRequest`  
`has('title')` → `body.title = merged.title`  
`has('mainTitle')` → `body.mainTitle = merged.mainTitle`

상세 저장 후 FE는 목록을 다시 GET 합니다. 클라가 목록 캐시에 대표명을 직접 쓰지 않습니다. **목록 응답이 맞아야 화면이 맞습니다.**

---

## 5. 서버가 할 일

### 5.1 목록 `mainTitle` = 상세 `mainTitle`

`PATCH`로 `mainTitle`이 오면 1차 컬럼 `mainTitle`을 갱신하고, **목록 쿼리가 그 컬럼을 그대로** 내려야 합니다.  
목록 `mainTitle`을 `title`에서 복사하지 마세요.

### 5.2 목록 프로그램명

목록 「프로그램명」= **대표 프로그램명 (국문)** = `mainTitle`.

FE는 이제 `PATCH`에 `title`과 `mainTitle`을 같이 보내고, 목록은 `mainTitle`을 우선 그립니다.

서버는 **둘 다 같은 대표명으로 저장**하고, 목록 GET의 `title`·`mainTitle`이 상세와 같아야 합니다. 목록 `mainTitle`을 예전 `title`로 덮지 마세요.

### 5.3 검색

목록 검색 `title` 쿼리가 있으면 **갱신된 대표명(`mainTitle`)** 으로도 찾아야 합니다.

---

## 6. 검수

프로그램 하나에서 대표 국문을 A → B로 수정한 뒤:

- [ ] 상세 GET `mainTitle` === `B`
- [ ] 목록 GET 해당 row `mainTitle` === `B`
- [ ] 목록 화면 프로그램명 === `B`
- [ ] 목록 GET `titleEn`이 상세와 같음 (이미 됨. 깨지지 말 것)
- [ ] 대표명을 B로 검색하면 해당 행이 나옴
- [ ] 공고용명만 바꾼 경우 목록 프로그램명은 대표명 유지 (공고용 ≠ 목록명)

---

## 7. 같은 응답에서 같이 보이는 공고용명 (참고)

`186020` 상세 `serviceDetailJson`에는 공고용명이 세 곳에 있습니다.

| 위치 | 값 | 의미 |
|------|-----|------|
| `generalCommonInfo.announcementTitle` | `수정1` | 상세 공통 정보 공고용 (이 건에서는 대표명과 동일) |
| `registration.overlay["generalRegistration.basicInfo.publicProgramTitle"]` | `수정1` | 등록 폼 공고용 |
| **루트** `serviceDetailJson.announcementTitle` | `세부프로그램명 경제리터러시기초` | **생성 시 `title`과 같음. 공고용 아님** |

루트 `announcementTitle`을 `title`로 채우지 마세요. 공고용 SSOT는 `generalCommonInfo.announcementTitle` (및 overlay `publicProgramTitle`) 입니다.  
이번 요청의 필수 수정은 **§5 목록 프로그램명** 입니다.

---

## 8. 회신 부탁 (요청 A)

1. 목록 프로그램명을 **A(`title` 동기화)** / **B(목록 `mainTitle` SSOT)** 중 무엇으로 할지  
2. 수정 대상 API (`PATCH` persist / 목록 쿼리 / 둘 다)  
3. UJAT · 1사1교 · 교육받은 교사 동일 적용 여부  

---

## 요청 B. 사업 운영 기간 — 달력연도 고정 제거 · 연도 걸침 허용 (전 유형)

**우선순위:** P1  
**관측:** 1사1교 등록 `POST /api/admin/programs` · `2026-09-23`  
**에러:** `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR`  
**필드:** `businessStartDate`  
**대상 유형:** 일반 · 1사1교(`COMPANY_SCHOOL`) · UJAT · 교육받은 교사 · Gemini 포함 **프로그램 전 유형**. 유형별 분기를 두지 마세요.

---

## 9. 무엇을 바꾸는가

CMS 「사업 운영 기간」은 관리자가 **임의 기간**을 고릅니다. **다른 해로 넘어가도 됩니다.**  
예: `2026-06-01` ~ `2027-03-31`.

서버는 그 값을 `startDate`/`endDate`와 `businessStartDate`/`businessEndDate`에 **그대로** 저장·검증·응답해야 합니다.

| 하면 안 됨 | 해야 함 |
|------------|---------|
| 같은 해 1월 1일~12월 31일로 강제 | 클라이언트가 보낸 시작·종료를 그대로 persist |
| 연도가 다르면 거절 | 연도 걸침 허용 (26년 6월 ~ 27년 3월) |
| 1사1교만 달력연도, 다른 유형은 자유 | **전 유형 동일 규칙** |
| 들어온 기간을 그해 1/1~12/31로 rewrite | GET도 저장한 기간 그대로 |

허용해도 되는 검증은 **시작 ≤ 종료**, 필수값 누락뿐입니다. 「한 해의 1/1~12/31」은 검증이 아닙니다.

---

## 10. 재현 (1사1교, 2026-09-23)

폼에서 사업 운영 기간을 **2026-11-26 ~ 2026-12-17** 로 두고 등록.

`POST /api/admin/programs` body (해당 필드만):

```json
{
  "programType": "COMPANY_SCHOOL",
  "startDate": "2026-11-25T15:00:00.000Z",
  "endDate": "2026-12-17T14:59:59.999Z",
  "businessStartDate": "2026-11-25T15:00:00.000Z",
  "businessEndDate": "2026-12-17T14:59:59.999Z"
}
```

**실제 응답**

```json
{
  "success": false,
  "error": {
    "code": "COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR",
    "message": "1사1교 사업 운영 기간은 같은 연도의 1월 1일부터 12월 31일까지여야 합니다.",
    "field": "businessStartDate"
  }
}
```

**기대:** `201`/`200`. 위 기간을 그대로 저장. 달력연도 에러 없음.

같은 규칙으로 아래도 성공해야 합니다 (전 유형).

```json
{
  "startDate": "2026-05-31T15:00:00.000Z",
  "endDate": "2027-03-30T14:59:59.999Z",
  "businessStartDate": "2026-05-31T15:00:00.000Z",
  "businessEndDate": "2027-03-30T14:59:59.999Z"
}
```

(서울 `2026-06-01` 00:00 ~ `2027-03-31` 23:59:59.999)

---

## 11. API

| # | Method | Path | 화면 |
|---|--------|------|------|
| D | `POST` | `/api/admin/programs` | 프로그램 등록 완료 |
| E | `PATCH` | `/api/admin/programs/{id}` | 상세 공통 정보 · 기간 수정 |
| F | `GET` | `/api/admin/programs/{id}` | 상세 |
| G | `GET` | `/api/admin/programs` | 목록 |

권한: 관리자 · 프로그램 생성/수정/조회.

---

## 12. 필드 계약

CMS 「사업 운영 기간」 한 칸입니다. FE는 같은 값을 두 쌍으로 보냅니다.

| CMS | 1차 컬럼 |
|-----|----------|
| 사업 운영 기간 시작 | `startDate` = `businessStartDate` |
| 사업 운영 기간 종료 | `endDate` = `businessEndDate` |

- `business*`만 달력연도이고 `start`/`end`만 폼 값인 분기를 두지 마세요.
- 1사1교라고 `business*`를 그해 1/1~12/31로 바꾸지 마세요.
- 타임존: Asia/Seoul. UTC `…T23:59:59.999Z`를 서울 다음날로 해석해 연도를 올리며 거절하지 마세요.

**지울 검증**

- 에러 코드 `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR` (및 동일 의미의 유형별 코드)
- “같은 연도여야 한다”
- “1월 1일부터 12월 31일까지여야 한다”
- 연도 걸침 거부

**남겨도 되는 검증**

- `businessStartDate` / `startDate` 필수
- `businessEndDate` / `endDate` 필수
- 시작 ≤ 종료

등록·수정·목록·상세 모두 같은 기간이 나와야 합니다.

---

## 13. 서버가 할 일

### 13.1 달력연도 검증 삭제

`COMPANY_SCHOOL` create/update에서 사업 기간이 그해 1/1~12/31인지 검사하지 마세요.  
다른 `programType`에도 같은 검사를 넣지 마세요.

### 13.2 연도 걸침 허용

시작 연도와 종료 연도가 달라도 persist 합니다. 예: 2026-06 ~ 2027-03.

### 13.3 전 유형 동일

`GENERAL_INDIVIDUAL` · `GENERAL_ORGANIZATION` · `COMPANY_SCHOOL` · UJAT · 교육받은 교사 · Gemini.  
유형별 “사업연도 = 캘린더 연” 규칙을 두지 마세요.

### 13.4 GET

저장한 `startDate`/`endDate`/`businessStartDate`/`businessEndDate`를 rewrite 없이 그대로 내립니다.  
목록 기간 표시·필터도 이 값을 씁니다.

---

## 14. 검수

아래를 **유형마다** 한 번씩:

- [ ] 같은 해 일부 기간(예: 2026-11-26 ~ 2026-12-17) create 성공. `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR` 없음
- [ ] 연도 걸침(2026-06-01 ~ 2027-03-31) create 성공
- [ ] 상세 GET의 `startDate`/`endDate`/`businessStartDate`/`businessEndDate`가 요청과 같음 (1/1~12/31로 바뀌지 않음)
- [ ] 목록 GET 해당 row 기간이 상세와 같음
- [ ] 상세에서 기간을 연도 걸침으로 PATCH → GET 반영
- [ ] 시작 > 종료만 4xx. 달력연도 메시지 없음

---

## 15. 회신 부탁 (요청 B)

1. `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR` 삭제 일정  
2. 동일 제약을 다른 유형에도 쓰는지. 있으면 같이 삭제  
3. 연도 걸침 persist 확인 (2026-06 ~ 2027-03)  
4. `startDate`/`endDate`와 `business*`를 계속 같은 값으로 둘지, 나중에 필드를 하나로 줄일지  
