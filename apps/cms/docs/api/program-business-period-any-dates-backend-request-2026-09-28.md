# BE 수정 요청 — 사업 운영 기간은 아무 날짜나 허용

**작성일:** 2026-09-28  
**문서 성격:** **이 파일만** 보고 구현·검수 가능  
**우선순위:** P0  
**대상 API:**  
- `POST /api/admin/programs`  
- `PATCH` / `PUT /api/admin/programs/{programId}`  
- `GET /api/admin/programs/{programId}`  
- `GET /api/admin/programs`  
**적용:** 프로그램 **전 유형** (`GENERAL_*` · `COMPANY_SCHOOL` · `UJAT_*` · `TRAINED_TEACHER` · Gemini 포함). 유형별 분기 금지.

이전 요청(09-23 요청 B, 09-27 1사1교 handoff)과 **같은 계약**이다. 아직 `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR` 거절·연도 치환이 남아 있어 재전달한다.

---

## 백엔드 전달용 프롬프트

CMS 「사업 운영 기간」은 관리자가 **직접 고른 시작일·종료일**이다.

**아무 날짜나 된다.** 같은 해일 필요 없다. 1/1~12/31일 필요 없다. 연도를 두 번 넘어도 된다.

예: 화면 `2025.04.01 ~ 2027.08.23`  
→ `startDate` / `endDate` / `businessStartDate` / `businessEndDate` 네 칸 모두 그 기간.

하면 안 되는 일:

1. `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR` (및 동일 의미 코드)로 거절  
2. 같은 해여야 한다는 검증  
3. 들어온 기간을 그해 1/1~12/31로 rewrite  
4. GET에서 `start`/`end`를 `businessYear` 달력으로 덮기  
5. 1사1교만 다른 규칙

허용 검증은 **필수값**과 **시작 ≤ 종료** 뿐이다.

`businessYear`는 목록 필터용 숫자일 수 있다. **일정 컬럼을 그 해 1/1~12/31로 맞추라는 뜻이 아니다.**

---

## 1. 계약

CMS는 한 칸(사업 운영 기간)을 아래 네 필드에 **같은 값**으로 보낸다.

| CMS | 컬럼 |
|-----|------|
| 시작 | `startDate` = `businessStartDate` |
| 종료 | `endDate` = `businessEndDate` |

서버는 네 값을 **그대로** persist·응답한다. 서로 다르게 보냈으면 각각 유지. 같게 보냈으면 같게 유지.

### 되는 예

| 화면 | 의미 |
|------|------|
| `2025.04.01 ~ 2027.08.23` | 연도 2회 걸침. **필수 검수** |
| `2026.11.26 ~ 2026.12.17` | 같은 해 일부 |
| `2026.06.01 ~ 2027.03.31` | 연도 1회 걸침 |
| `2026.01.01 ~ 2026.12.31` | 달력연도도 **선택하면** 됨. 강제하면 안 됨 |

### CREATE 예 (`2025.04.01 ~ 2027.08.23`, Asia/Seoul)

```json
{
  "startDate": "2025-03-31T15:00:00.000Z",
  "endDate": "2027-08-23T14:59:59.999Z",
  "businessStartDate": "2025-03-31T15:00:00.000Z",
  "businessEndDate": "2027-08-23T14:59:59.999Z"
}
```

`201`/`200`. 위 instant를 그대로 저장.

date-only(`2025-04-01` / `2027-08-23`)로 와도 같은 달력일을 유지한다. UTC `…T23:59:59.999Z`를 서울 다음날로 해석해 연도를 올리며 거절하지 말 것.

---

## 2. 지울 검증

- `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR`
- “1사1교 사업 운영 기간은 같은 연도의 1월 1일부터 12월 31일까지여야 합니다.”
- “같은 연도여야 한다”
- 연도 걸침 거부
- 유형별 “사업연도 = 캘린더 연” 분기

### 남겨도 되는 검증

- 시작·종료 필수
- 시작 ≤ 종료 → 아니면 4xx. 달력연도 메시지 없음

---

## 3. GET · 목록 · 상태

저장한 네 필드를 rewrite 없이 내린다.

- GET `startDate`/`endDate`를 `2025-01-01`~`2025-12-31` 등으로 바꾸지 말 것  
- 목록 기간 컬럼·필터도 저장값  
- `lifecycleStatus` / `periodStatus`는 **저장된 운영 기간**으로 계산. 달력연도로 덮은 뒤 `in_progress`가 되면 안 됨

`businessYear`를 유지한다면 목록 필터만. 예: 시작 연도 `2025`. **기간을 2025-01-01~2025-12-31로 맞추지 말 것.**

---

## 4. 검수

유형마다 한 번씩:

- [ ] `2025-04-01 ~ 2027-08-23` create 성공. 달력연도 에러 없음  
- [ ] GET 네 필드가 요청과 같음 (1/1~12/31 아님)  
- [ ] 목록 row 기간이 상세와 같음  
- [ ] `2026-11-26 ~ 2026-12-17` create 성공  
- [ ] PATCH로 연도 걸침 기간 수정 → GET 반영  
- [ ] 시작 > 종료만 4xx. `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR` 없음  

---

## 5. 회신

1. `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR` 삭제 여부  
2. `2025-04-01 ~ 2027-08-23` persist 확인 (유형별)  
3. GET rewrite 제거 여부  
