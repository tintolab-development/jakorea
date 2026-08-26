# Cursor prompt — CMS 실적 관리 목록·합계·엑셀 API 계약

아래 지시를 **이 백엔드 레포에서 실행**하라. 질문은 기존 엔티티/OpenAPI를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

이 작업은 **더미 30건 시드가 아니다.** 시드는 이미 `education-records-fe-mock-30-v1` 로 요청한 상태다. 지금은 **기획 필터·집계 규칙·페이징·합계·엑셀**을 API 계약으로 맞추는 일이다.

---

## Goal

CMS LNB **실적 관리** (`/education-records`, Gemini 실적 아님)가 아래를 서버에서 처리할 수 있게 하라.

1. 공통 필터가 `GET /api/admin/performance-records` 와 `GET /api/admin/performance/summary` 와 `GET /api/admin/performance-records/export` 에 **동일하게** 적용된다.
2. 목록이 `size=50` 한 페이지에 잘리지 않고, 필터된 **전체 건수(`totalElements`)** 를 돌려준다.
3. 합계 탭이 목록과 **같은 필터 집합**으로 집계된다.
4. 엑셀은 시트1 실적 데이터 + 시트2 합계이며, 같은 필터 집합을 쓴다.
5. 교육시간 올림, 시군구 `전국`, 남/여 반반, 봉사·교사 카운트 규칙을 **서버에서** 계산해 응답 숫자에 넣는다. FE는 숫자를 다시 계산하지 않는다.

완료 조건은 맨 아래 **Done when**.

---

## Out of scope / 금지

- Gemini 실적(`training-reports`, `/programs/gemini/performance`, `/api/admin/gemini/...`)과 **테이블·API·시드를 섞지 마라.**
- `POST /api/admin/performance-records/rebuild`만으로 기획 수치를 채우지 마라. rebuild는 프로그램 재집계라 엑셀/시드 숫자가 깨진다.
- 실적 생성·확인·마감·정정·exclude API를 이 화면용으로 새로 노출하지 마라. 이 화면은 **조회 + export** 만 쓴다.
- 없는 값을 `"해당없음"` 문자열로 채우지 마라. null/omit.
- 프론트 필드명을 내부 엔티티명으로 바꿔 노출하지 마라. 목록 아이템은 `PerformanceRecordFrontendResponse`.
- 기존 30건 시드 숫자를 이 작업에서 임의로 다시 쓰지 마라. 집계 규칙을 코드로 구현한 뒤, 시드 행은 **이미 저장된 값**을 목록에 그대로 돌려도 된다. **새로 프로그램에서 재집계할 때만** 아래 규칙을 적용하라.

---

## 화면 / 호출 주체

| 항목 | 값 |
|---|---|
| 화면 | CMS LNB 실적 관리 |
| path | `/education-records` (`?tab=data`, `?tab=summary`) |
| 게이트 | `performanceRecords` + 관리자 JWT |
| 목록 | `GET /api/admin/performance-records` |
| 합계 | `GET /api/admin/performance/summary` |
| 엑셀 | `GET /api/admin/performance-records/export` (감사 fail-closed) |

FE는 지금 목록을 `page=0&size=50` 만 보내고 **클라이언트에서 거른다.** 이 계약을 넣으면 FE가 쿼리를 서버로 넘긴다.

---

## 1. 공통 필터 쿼리 (목록·합계·엑셀 동일)

세 API에 **같은 이름**으로 붙여라. 값은 모두 optional. 빈 값/미전달 = 전체.

| query | 타입 | 의미 | 매칭 |
|---|---|---|---|
| `year` | integer | 년도 YYYY | `educationMonth` 앞 4자리 |
| `quarter` | integer 1~4 | 분기 | 1=01–03, 2=04–06, 3=07–09, 4=10–12 |
| `businessArea` | string | 사업 분야 **정확 일치** | `경제금융` / `진로취업` / `기업가정신` / `디지털리터러시` (`디지털 리터러시` 공백은 동일 취급) |
| `sponsorNameKo` | string | 후원사명(국문) | `sponsorNameKo` **부분일치** (대소문자 무시) |
| `mainTitle` | string | 대표 프로그램명(국문) | **부분일치** |
| `title` | string | 세부 프로그램명(국문) | **부분일치** |
| `textbookName` | string | 교재명(국문) | **부분일치** |
| `institutionName` | string | 기관명 | `schoolOrOrganizationName` **부분일치** |
| `sido` | string | 시/도 | `district`에서 파생한 시/도 **정확 일치** |
| `sigungu` | string | 시/군/구 | `district`의 시/군/구 **정확 일치** |
| `ips` | string | IPS | `Inspire` / `Prepare` / `Succeed` **정확 일치** |
| `educationType` | string | 교육 형태 | `online` / `offline` / `hybrid` (한글 `온라인` / `오프라인` / `온/오프라인` 도 동일) |

기존 `programId`, `educationMonth`(YYYY-MM), `status` 는 유지하되, **이 화면의 공통 필터는 위 표를 쓴다.**  
`year`+`quarter` 와 `educationMonth`를 동시에 받으면 **둘 다 만족**하는 행만.

목록만 추가:

| query | 기본 | 의미 |
|---|---|---|
| `page` | 0 | 0-base |
| `size` | 50 | 페이지 크기. **필터 결과 전체가 size로 잘리면 안 된다** — `totalElements`로 전체 건수를 줘야 한다. |

합계·엑셀에는 `page`/`size`를 쓰지 마라. 필터된 **전 건**을 집계/출력한다.

---

## 2. 목록 응답

지금은 배열만 준다. FE unwrap은 배열 또는 `{ content: [] }` 를 받는다.

**바꿔라:**

```json
{
  "success": true,
  "data": {
    "content": [ { "...PerformanceRecordFrontendResponse" } ],
    "totalElements": 128,
    "totalPages": 3,
    "number": 0,
    "size": 50
  }
}
```

배열만 유지하면 FE는 총 건수를 알 수 없고, 50건 이후가 사라진다. `totalElements`는 **필터 적용 후** 건수다.

목록 아이템 필드(이미 있음, 유지):

`id`, `educationMonth`, `businessArea`, `sponsorNameKo`, `sponsorNameEn`, `mainTitle`, `titleEn`, `title`, `textbookName`, `textbookNameEn`, `schoolOrOrganizationName`, `district`, `targetLevel`, `ipOwned`, `courseDeliveredBy`, `partnerInvolvement`, `institutionType`, `ips`, `programCategory`, `programChannel`, `educationType`, `educationHours`, `classCount`, `maleParticipants`, `femaleParticipants`, `totalParticipants`, `generalVolunteers`, `staffVolunteers`, `returningVolunteers`, `generalTeachers`, `educatedTeachers`, `instructors`, `managerName`

규칙:

- `educationMonth`: `YYYY-MM`
- `programCategory`: `ips=Succeed` 가 아니면 null. 일정형(세부 프로그램명 해당 없음)이면 null
- `programChannel`: `ips=Inspire` 가 아니면 null. 일정형이면 null
- `institutionType`: `기관 안` / `기관 밖` / `기타` (또는 `inside_school` / `outside_school` / `other` — FE가 둘 다 매핑). **기타를 빠뜨리지 마라.**
- `targetLevel`: `초등학생`/`중학생`/`고등학생`/`대학생`/`성인` 또는 enum `elementary`/`middle`/`high`/`university`/`adult`. 엑셀 원문 `초`/`중`/`고` 도 FE가 매핑한다.
- `educationHours`: 아래 올림 규칙을 **적용한 정수**. 타입이 string이어도 `"2"` 처럼 정수 문자열.
- `partnerInvolvement`: `Yes` / `No` (boolean이면 FE가 변환)
- 빈 `ipOwned`를 `"JA"`로 채우지 마라. 없으면 null.

---

## 3. 합계 응답 `GET /api/admin/performance/summary`

필터 쿼리는 1절과 동일 (`page`/`size` 제외).

`PerformanceStatsFrontendResponse.sections` 를 **항상** 채워라. `stats.totalSchools` 만 주고 끝내지 마라. FE는 `sections`가 없으면 학급수·시간·봉사·교사가 0이 된다.

```json
{
  "sections": [
    {
      "businessArea": "경제금융",
      "rows": [
        {
          "targetLevel": "elementary",
          "schoolCount": 3,
          "classCount": 10,
          "totalParticipants": 200,
          "educationHours": 24,
          "generalVolunteerCount": 4,
          "employeeVolunteerCount": 2,
          "generalTeacherCount": 6,
          "trainedTeacherCount": 1,
          "instructorCount": 3
        }
      ],
      "total": { "schoolCount": 3, "classCount": 10, "totalParticipants": 200, "educationHours": 24, "generalVolunteerCount": 4, "employeeVolunteerCount": 2, "generalTeacherCount": 6, "trainedTeacherCount": 1, "instructorCount": 3 }
    }
  ]
}
```

단락 순서: `경제금융` → `진로취업` → `기업가정신` → `디지털리터러시`.  
`targetLevel` 행: `elementary`(초등학교) / `middle`(중학교) / `high`(고등학교) / `university`(대학교, 있으면) / `adult`(성인).  
데이터 없는 행은 0으로 채워도 되고 omit 해도 된다. 카테고리 `total`은 그 단락 합.

`schoolCount` = **학교/기관명 유니크 개수** (행 수가 아님).  
나머지 숫자는 해당 버킷 행의 **합**.

합계 API와 목록 API는 **같은 필터·같은 포함 규칙**을 써야 한다. 목록에 보이는 행을 합하면 합계 탭과 맞아야 한다.

---

## 4. 엑셀 `GET /api/admin/performance-records/export`

같은 필터. `exportType` 기본 `EXCEL`.

- 시트1 이름: `실적 데이터` — 목록 컬럼과 동일 순서·동일 값 (필터된 전 건, page 무시)
- 시트2 이름: `합계` — 합계 탭과 같은 사업분야×대상 집계

감사로그 실패 시 파일 주지 마라 (fail-closed).  
개인정보 원문이 없으면 `rawPrivacyIncluded=false` 로 호출되어도 된다.

컬럼 순서 (시트1):

1. 교육 월  
2. 사업분야  
3. 후원사명(국문)  
4. 후원사명(영문)  
5. 대표 프로그램명(국문)  
6. 대표 프로그램명(영문)  
7. 세부 프로그램명(국문)  
8. 교재명(국문)  
9. 교재명(영문)  
10. 기관명  
11. 시군구  
12. 대상 구분  
13. IP Owned  
14. Course Delivered By  
15. Partner Involvement  
16. 기관 구분  
17. IPS  
18. 프로그램 종류  
19. 프로그램 채널 및 형식  
20. 교육 형태  
21. 교육시간  
22. 학급수  
23. 남  
24. 여  
25. 총 참가자  
26. 일반 자원봉사자  
27. 임직원 자원봉사자  
28. 재참여 자원봉사자  
29. 일반 담당교사  
30. 교육받은 교사  
31. 강사  
32. 담당자명  

---

## 5. 집계 비즈니스 규칙 (프로그램 → 실적 레코드)

목록/합계/엑셀 숫자의 **단일 진실**은 서버다. 프로그램·일정·신청에서 실적을 만들거나 rebuild 할 때 적용하라.

### 5-1. 교육 월

교육이 진행된 월. `educationMonth = YYYY-MM`. 화면은 `6월` 처럼 월만 보여 준다.

### 5-2. 시군구 (`district`)

- 기관이 없고 **프로그램이 온라인**이면 `전국`
- 기관이 있고 기관이 온라인이면 **기관 주소의 시군구**
- 그 외는 기관 소재지

### 5-3. 교육시간

교육 일정에 등록된 시간. **1시간 단위 미만이면 올림.**  
예: 1시간 10분 → 2시간. 정수로 저장.

### 5-4. 남 / 여

학교에서 학생 명단을 받지 않으면 총 참가자를 **반반**. 홀수면 **남자 +1**.  
명단이 있으면 명단 성비.

### 5-5. 총 참가자

프로그램 총 참여자(수혜자).  
**사전교육이 설정된 항목이면 봉사자도 참여자로 포함.**

### 5-6. 일반 자원봉사자

일반 봉사자 수.

### 5-7. 임직원 자원봉사자

봉사자 목록에서 매니저가 **밀어넣기로 추가한 수**.

### 5-8. 재참여 자원봉사자

다음을 **합산**:

1. 일반 자원봉사자 중 이전에 JA 봉사 프로그램 참여 이력이 있는 사람 (신청 폼 재참여 여부)
2. 임직원 자원봉사자 중 재참여로 밀어넣은 수

### 5-9. 일반 담당교사

프로그램 신청 교사. **합반이면 합반 학년 수만큼.**  
예: 1학년·2학년 합반 → 담당교사 2.

### 5-10. 교육받은 교사

필드는 유지. 계산 규칙은 고객사 미결이다. **임의 추측으로 채우지 마라.** 원천 데이터가 있으면 그 값을 넣고, 없으면 0/null.

### 5-11. 강사

해당 실적에 잡힌 강사 수.

### 5-12. 담당자명

**프로그램을 등록한 매니저 이름.**

### 5-13. IPS 종속 필드

- `프로그램 종류` (`programCategory`): `ips=Succeed` 일 때만. 아니면 null.  
  일정형(세부 프로그램명 해당 없음) → null.  
  값: Alumni Experiences / Award / Competition / Conference / Credential / Job Fairs / Launching a business / Scholarship / Trade Shows / Work Experience / Workshop
- `프로그램 채널 및 형식` (`programChannel`): `ips=Inspire` 일 때만. 아니면 null.  
  일정형 → null.  
  값: Downloaded resource / Kick-Off event / Live video social media post / Mobile app / Content social media post / Online resource / Podcast / Radio / Recorded video social media post / TV

### 5-14. 강사 활동 포기 (있을 때만)

중단일 **포함** 이전 일정만 실적에 넣는다. 이후 회차·학생 수·강사 실적은 제외.  
`performanceIncludedScheduleIds`(또는 동등 서버 규칙)가 있으면 그걸 따른다.

### 5-15. 포함할 실적

이 화면은 **확정된 최신 리비전**만. `status=CONFIRMED`, `latestRevision=true`. exclude/마감 제외 건은 빼라.

---

## 6. OpenAPI

`performance.openapi.json` / backend spec을 이 계약과 맞춰라.

- `ListRecordsParams` / `GetPerformanceSummaryParams` / export params 에 1절 필터 추가
- 목록 200 스키마를 Page(`content`, `totalElements`, …) 로
- `SummarySection` / `TargetTotal` 필수 필드 설명
- `institutionType`에 기타
- 집계 규칙은 description 또는 내부 위키에 1절~5절을 요약해 남겨라. 컨트롤러에 “실적 조회”만 있는 보일러플레이트는 부족하다.

---

## 7. 구현 순서

1. 실적 엔티티와 `PerformanceRecordFrontendResponse` 매퍼를 찾아라.
2. 목록/합계/엑셀 쿼리에 공통 필터 스펙을 한 클래스/함수로 묶어 **세 API가 같은 함수를 호출**하게 하라.
3. 목록 응답을 Page + `totalElements` 로 바꿔라. 기존 배열 클라이언트가 깨지지 않게 `data.content` 를 쓰거나, 당분간 배열+헤더 `X-Total-Count` 를 병행하되 **FE는 content+totalElements 를 기다린다.**
4. summary `sections` 를 필터된 레코드로 채워라.
5. export 2시트. 감사 fail-closed.
6. rebuild/생성 경로에 5절 규칙을 넣어라. 기존 시드 30건은 덮어쓰지 마라.
7. local/staging에서 아래 Done when 을 통과시켜라.

---

## Done when

1. `GET /api/admin/performance-records?year=2026&quarter=2&page=0&size=50` 가 2026년 2분기만 돌려주고, `totalElements` 가 그 분기 **전체 건수**다. size=50이어도 51건째는 `page=1` 로 나온다.
2. `sponsorNameKo=현대` 부분일치가 동작한다. `businessArea=경제금융`, `ips=Prepare`, `educationType=offline` 정확 일치가 동작한다.
3. `institutionName` 부분일치, `sido`+`sigungu` 정확 일치가 동작한다.
4. 동일 쿼리로 `GET /api/admin/performance/summary` 의 참가자 합 = 그 필터 목록 행의 `totalParticipants` 합.
5. summary `sections` 에 학급수·교육시간·봉사·교사·강사가 0이 아닌 실제 합으로 나온다 (데이터 있는 경우).
6. export 가 동일 필터로 시트 2장을 주고, 감사 실패 시 200 파일을 주지 않는다.
7. 1시간 10분 일정으로 새로 집계하면 `educationHours` 가 2 이다.
8. 프로그램 온라인이고 기관이 없으면 `district=전국`.
9. Gemini training-report API 응답이 이 변경으로 바뀌지 않는다.
10. OpenAPI에 필터 파라미터가 보인다.

로컬 JWT로 위 1~6을 curl 한 번씩 검증하고, 실패하면 프론트에 “구현됨”이라고 하지 마라.
