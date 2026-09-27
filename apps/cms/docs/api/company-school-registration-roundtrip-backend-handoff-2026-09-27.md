# 1사1교 등록 round-trip 불일치 (186026)

**작성:** 2026-09-23 (임금·JSON 미러)  
**재작성:** 2026-09-27 (`186026` POST vs 응답)  
**우선순위:** P0 정산 금액 · P0 컬럼/회차 훼손 · P1 JSON 미러  
**대상:** Programs API · `programType=COMPANY_SCHOOL`  
**이 문서만으로 구현·검수할 수 있다.**

**범위:** 1사1교(`COMPANY_SCHOOL`)만. 일반 / UJAT / 교육받은 교사 / Gemini의 JSON merge는 이 요청으로 바꾸지 말 것.

관측: `POST /api/admin/programs` → 응답 `id=186026` · `중학생 진로 설계 워크숍` · 2026-09-27.  
`186014`도 같은 정산 기본값(1급 50만, 장거리 교통비 포함)이었다. `186026`에서 그 상태가 그대로다.

FE는 create에 `wagePolicies` / `paymentItems` 배열을 넣지 않는다. 임금·지급은 `serviceDetailJson`뿐이다. 서버가 JSON을 정산 row로 안 옮기면 유형 기본값이 남는다.

---

## 한줄

등록 JSON의 강사비·지급항목은 echo되지만 `settlementPolicy`는 **1급 50만 · 장거리 교통비 포함 기본 세트**다.  
그와 별도로 회차 종료일, `deliveryType`, 루트 `curriculum`, 공고명 미러, 모집 상한 flat 키가 요청과 다르다.

---

## 맞는 것 (이번 요청 아님)

| 항목 | 요청 | 응답 |
|------|------|------|
| 제목·영문·후원 `163391`·사업분야·세부프로그램 `900131` | 동일 | 동일 |
| `applicationStartDate` / `End` | `10-12T15Z`~`10-21T15Z` → 서울 **10/13~10/22** | `2026-10-13` ~ `2026-10-22` |
| `businessStartDate` / `End` | `2025-12-31T15Z`~`2026-12-31T14:59Z` → 서울 **1/1~12/31** | `2026-01-01` ~ `2026-12-31` |
| 회차 시작 | `10-10T15Z` → 서울 **10/11** | `rounds.startDate` `2026-10-11`, `schedules.startAt` 동일 instant |
| 회차 정원·회차 커리큘럼 문구 | capacity 30 · `… 커리큘럼` | 동일 |
| JSON `wageGradeRows` · overlay `grade*Fee` | 14만/5만 · 12만/4만 · 10만/3만 | echo |
| JSON `paymentItems` | `p-166201, p-166202` | echo |
| nested `generalCommonInfo.announcementTitle` | `중학생 진로·직업 탐색 프로그램 모집` | echo |
| nested KPI | 49 / 3 / 9 / 13 | echo. 루트 `totalParticipants` 49, `instructors` 3, `finalSchools` 9, `finalClasses` 13 으로도 올라옴 |
| 공제 | `일용근로자 원천징수세액` | `deductionType=DAILY_WORKER_WITHHOLDING` |
| 담당자 미선택 | `__sponsor_contact_unselected__` | `managerName: null` |

날짜는 UTC instant를 **Asia/Seoul 달력 날짜**로 비교했다. `10-12T15:00:00Z` = 서울 10/13.

---

## 불일치

### 1. 정산 테이블이 등록 금액이 아님 (P0, 미수정)

JSON / overlay:

| 급 | 기본 | 장거리 |
|----|------|--------|
| 1급 | 140,000 | 50,000 |
| 2급 | 120,000 | 40,000 |
| 3급 | 100,000 | 30,000 |

응답 `settlementPolicy.wagePolicies` (유형 기본):

| feeGrade | feeKind | amount |
|----------|---------|--------|
| GRADE_1 | NORMAL / LONG_DISTANCE | **500,000 / 500,000** |
| GRADE_2 | NORMAL / LONG_DISTANCE | **400,000 / 400,000** |
| GRADE_3 | NORMAL / LONG_DISTANCE | **300,000 / 300,000** |

`186014`(17만/3만 …)와 같은 패턴이다. 등록 숫자가 달라도 기본 50/40/30만이 남는다.

### 2. 지급 항목이 고른 id가 아님 (P0, 미수정)

요청: `paymentItems: "p-166201, p-166202"` (2개). overlay도 같은 두 id.

응답 `settlementPolicy.paymentItems` 전부 `useYn: true`:

- `TRANSPORTATION`
- `LONG_DISTANCE_TRANSPORTATION` ← **요청에 없는 기본 항목**
- `LODGING`

고른 id 2개를 enum으로 바꾸지 않고, 1사1교 기본 3종을 켠다.

같은 객체에 요청에 없던 기본값도 있다.

| 필드 | 응답 | 요청 |
|------|------|------|
| `tollReimbursementYn` | `true` | 없음 |
| `fixedLodgingAmount` | `80000` | 없음 |
| `longDistanceThresholdKm` | `200.00` | 없음 |

임금 `amount`만이 아니라 이 세 필드도 유형 기본으로 채우지 말 것. 요청·JSON에 없으면 넣지 않거나, 화면 값과 같게 할 것.

### 3. 회차 종료 **날짜**가 하루 짧다 (P0)

요청 회차 `endDate`: `2026-11-09T14:59:59.999Z` (서울 **2026-11-09** 23:59).

| 응답 필드 | 값 | 판정 |
|-----------|-----|------|
| `schedules[0].endAt` | `2026-11-09T14:59:59.999Z` | 요청 instant와 같음 |
| `rounds[0].endDate` | `2026-11-08` | **하루 앞당김** |
| `schedules[0].endDate` | `2026-11-08` | **하루 앞당김** |

시작 쪽 `startAt` / `rounds.startDate=2026-10-11` 은 맞다. **종료 date-only만** inclusive end-of-day를 전날로 자른다.

루트 운영 기간도 요청과 다르다. 요청은 `startDate`/`endDate`를 서울 **10/11~11/09**로, `businessStartDate`/`businessEndDate`만 **1/1~12/31**로 나눠 보냈다. 응답 루트 `startDate`/`endDate`는 `2026-01-01`~`2026-12-31`로 바뀌어 `business*`와 같아졌다. 회차 instant는 짧은 기간이 남아 있다.

1사1교는 사업 기간이 그해 1/1~12/31이 아니면 `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR`로 거절하거나, 들어온 기간을 달력연도로 고친다. `186026`은 거절 대신 **운영 `startDate`/`endDate`를 사업 연도로 덮은 경우**다. 둘 다 하지 말 것. 클라이언트가 보낸 `startDate`/`endDate`와 `businessStartDate`/`businessEndDate`를 각각 그대로 저장한다. 시작 ≤ 종료만 검사한다. 1/1~12/31 강제, 연도가 다르다는 이유의 거절, 응답에서 기간을 다시 쓰는 것 모두 금지.

그 덮어쓰기 때문에 상태도 어긋난다. 응답 시각은 `2026-09-27`인데 `periodStatus=IN_PROGRESS`, `lifecycleStatus=in_progress`, `status=active`다. 교육 시작이 10/11이면 이날은 **시작 전**이다. 루트 `startDate`를 1/1로 두면 9월에도 진행 중이 된다.

요청 JSON 안에는 종료가 이미 두 가지다. BE `endDate=11-08`이 어느 쪽인지는 회신으로 확정할 것.

| 요청 위치 | 종료 |
|-----------|------|
| `rounds[].endDate` | `2026-11-09T14:59:59.999Z` (서울 11/09) |
| `operationRangeSeal.end` | `2026-11-08T15:00:00.000Z` (서울 11/09 00:00) |
| `educationScheduleLines` | `2026. 10. 11 ~ 2026. 11. 08` |
| `dateRangeSeal.end` | `2026-11-07T15:00:00.000Z` (서울 11/08 00:00) |

`schedules.endAt`은 회차 instant(11/09)와 같고, date-only만 11/08이다.

### 4. `rounds.deliveryType` 유실 (P1)

요청 `deliveryType: "offline"` → 응답 `null`.

### 5. 루트 `curriculum`이 회차 커리큘럼이 아님 (P0)

요청 최상위에는 `curriculum`이 없다. 회차만 `curriculum: "중학생 진로 설계 워크숍 커리큘럼"`.

응답 최상위:

```text
curriculum = "모집 인원 초과 시 선착순으로 마감합니다."
```

이 문장은 요청 `oneLineIntroduction` / JSON `participantRecruitmentInfo.remarks` 와 같다.  
회차 커리큘럼 문구를 프로그램 `curriculum` 컬럼에 넣지 말고, 한 줄 소개·비고를 `curriculum`에 넣지 말 것.

### 6. 공고명이 프로그램명으로 덮임 (P0, JSON 미러)

요청 nested:

`generalCommonInfo.announcementTitle = "중학생 진로·직업 탐색 프로그램 모집"`

응답:

| 위치 | 값 |
|------|-----|
| `program.generalCommonInfo.announcementTitle` | **모집 공고명 유지** (맞음) |
| `program.announcementTitle` (미러) | **`중학생 진로 설계 워크숍`** (프로그램명) |
| 루트 `generalCommonInfo.announcementTitle` | **프로그램명** |

공고명과 대표 제목은 다른 필드다. 미러가 공고명을 제목으로 바꾸면 조회 SSOT가 둘로 갈라진다.

### 7. `serviceDetailJson`에 요청에 없던 flat 키 (P1)

응답 JSON 끝에 서버가 붙인 값 (요청 envelope에는 없음):

| 서버가 쓴 키 | 값 | 요청에 있던 대응 | 판정 |
|--------------|-----|------------------|------|
| `fixedSessionCount` | 2 | 차시 2개 | 차시 수와는 맞을 수 있음 |
| `maxRequestedScheduleCount` | **2** | `participantRecruitmentInfo.maxScheduleCount` **1** | **불일치** |
| `maxDailySessionCount` | **2** | `maxSessionsPerDay` **4** | **불일치** |
| `studentRosterRequiredYn` | false | `studentListRequired=not_required` | 일치 |
| `satisfactionTarget` | **NONE** | `generalSurveyMenuKeys`에 `satisfaction` 포함 | **불일치** |
| `longDistanceThresholdKm` | 200 | 요청에 없음 | 유형 기본 주입 |
| `educationStructure` | CURRICULUM | JSON `generalProgramEducationStructure=curriculum` | 의미는 맞음. 키 추가는 replace 계약과 충돌 |
| `allowCombinedClassYn` | false | 요청에 없음 | 기본값 주입 |

snake_case 복본(`fixed_session_count`, `max_requested_schedule_count`, `max_daily_session_count`, `allow_combined_class_yn`, `student_roster_required_yn`, `long_distance_threshold_km`, `satisfaction_target`)도 같이 붙는다.

`program` 객체 안에도 요청 slice에 없던 평탄 복본이 있다. `sponsorId`, `title`, `titleEn`, `mainTitle`, `representativeProgramNameKo`, `district`, `ips`/`ipsType`, `businessArea`, `detailedProgramId`. 공고명·잘린 kpi는 위 6번과 이 표다.

루트 `generalCommonInfo` 미러에는 임금 키가 없다. nested `wageGradeRows`와 **빈 임금 복본**이 한 JSON에 공존한다 (`186014`와 동일).

미러 `program.kpi`는 `{ "instructorCount": 3 }` 만이다. nested KPI(49/3/9/13)와 다르다. 컬럼(`totalParticipants` 등)은 맞게 올라왔으므로, **JSON 미러만 잘린 것**이다.

### 8. `recruitments`는 참여자 1건 · 운영기간은 연도 전체 (P1)

응답 `recruitments`는 `PARTICIPANT` / `ORGANIZATION` 하나.

- `startAt`~`endAt`: 모집 10/13~10/22 계열 (instant는 요청 application과 맞음)
- `operationStartDate` / `operationEndDate`: **`2026-01-01` ~ `2026-12-31`** (교육 10/11~11/09 아님)

강사 모집 창(`instructorApplicationStartDate` / `End`)은 JSON에만 있고 recruitment row가 없다. 1사1교가 강사 모집을 엔티티로 안 만들기로 한 것이면 문서에 그렇게 적어 달라. 침묵 누락이면 행을 만들 것.

`recruitments[0].maxCount` / `minCount` / `selectionMethod`는 `null`이다. JSON 상한(배정 강사 4, 학급 5, 일정 1, 1일 차시 4)은 이 행에 없다.

### 9. `otherNotes`는 JSON에만 있고 `otherMatters`는 null (P1)

요청 JSON `otherNotes`: `우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.`  
응답 `otherMatters`: `null`. JSON 안의 `otherNotes`는 echo.

같은 응답에서 `educationTargetDetail` / `recruitmentTargetDetail` / `remarks` / `studentListRequired`는 컬럼으로 올라왔다. `otherNotes`만 컬럼이 비어 있다. `otherMatters`가 그 필드의 컬럼이면 채울 것.

### 10. 이 응답만으로는 확인 불가

요청에 있었으나 create 응답 `data`에 없다. 저장 실패로 단정하지 말 것. 양식 API로 따로 확인할 것.

- `programDraftId`: `14`
- `autoApplyDefaultFormBindings`: `false`
- `formBindings` 5건 (`REGISTRATION` 1, `RECRUITMENT` 기관·강사, `APPLICATION` 기관·강사)

### 11. 요청 안에 이미 있던 차이 (BE가 바꾼 것 아님)

echo일 뿐이면 서버 결함으로 넣지 말 것.

| 내용 | 요청에서의 모습 |
|------|-----------------|
| 교육 일정 라벨 종료 | `educationScheduleLines`는 **11.08**. 회차 instant 종료는 **11/09** |
| 모집 운영 라벨 | `operationPeriodLabel`은 **10/13~11/11**. 프로그램 `start`/`end`는 **10/11~11/09** |
| 정원 vs KPI | 회차 `capacity` **30**. KPI 참여자 **49** |
| 봉사 블록 | `generalParticipantTypes`에 volunteer 없음, `generalVolunteerInterviewEnabled=false`. 그런데 `volunteerRecruitmentInfo`는 있고 그 안의 면접 플래그는 true |
| 대상 컬럼 | JSON `targetLevels`는 `university`,`adult`. 컬럼 `targetLevel`은 첫 값 `university` (JSON 배열은 유지) |

`contactName=김서연`은 요청 최상위에는 없고, 참여자 모집 `contactOrganizationName`과 같다. 최상위 `contactPhone`/`contactEmail`도 그 모집 문의처와 같아서, 컬럼 승격으로 본다. `managerName`은 담당자 미선택이라 `null`이 맞다.

`adminAssignments`(PM 최지원)는 요청에 없다. 로그인 관리자 자동 배정이면 결함이 아니다.

---

## 서버가 할 일

### 1. 정산 정책을 등록값으로 저장 (P0)

`COMPANY_SCHOOL` create/update에서 `wagePolicies` / `paymentItems`를 **50만·3종 지급 기본으로 채우지 말 것.**

1. body에 `wagePolicies` / `paymentItems` 배열이 있으면 그 값.
2. 없으면 `serviceDetailJson` → `program.generalCommonInfo.wageGradeRows` 로 wage row.
3. `paymentItems` 문자열의 id·라벨만 `useYn: true`. **문자열에 없는 `LONG_DISTANCE_TRANSPORTATION`을 켜지 말 것.**
4. `deductionItems`가 `일용근로자 원천징수세액`이면 `deductionType=DAILY_WORKER_WITHHOLDING`.

`pricing` 파싱:

- `1시간 당 | 기본 : {n}원 | 장거리 : {m}원`
- `NORMAL` ← 기본, `LONG_DISTANCE` ← 장거리
- `1급`/`2급`/`3급` → `GRADE_1`/`GRADE_2`/`GRADE_3`
- `calculationUnit=HOUR`
- `maxAmount` 급수 한도(50만/40만/30만)는 유지해도 된다. **`amount`는 등록 금액.**

`186014`, `186026` 은 다음 PATCH 또는 배치로 JSON 금액과 settlement를 맞출 것.

`186026` 기대 `amount`:

| feeGrade | NORMAL | LONG_DISTANCE |
|----------|--------|---------------|
| GRADE_1 | 140000 | 50000 |
| GRADE_2 | 120000 | 40000 |
| GRADE_3 | 100000 | 30000 |

### 2. 회차·커리큘럼·배달 유형 (P0)

- `rounds[].endDate` / `schedules[].endDate` = 요청 end instant의 **서울 달력 날짜**. `2026-11-09T14:59:59.999Z` → `2026-11-09`. `11-08` 금지.
- `schedules.endAt` 처럼 instant는 유지하고 date-only만 하루 빼지 말 것.
- `rounds[].deliveryType` 은 요청 값 유지 (`offline`).
- 프로그램 `curriculum` 컬럼에 `oneLineIntroduction` / 모집 `remarks` 를 넣지 말 것. 회차 `curriculum`과 혼동 금지.
- 루트 `startDate`/`endDate`를 `business*` 달력연도로 덮지 말 것. 요청이 둘을 다르게 보냈으면 둘 다 유지. `COMPANY_SCHOOL_BUSINESS_PERIOD_MUST_BE_CALENDAR_YEAR`로 1/1~12/31이 아닌 기간을 거절하지 말 것.

### 3. JSON은 요청 envelope로 교체 · 미러로 공고명·상한을 바꾸지 말 것 (P1)

```json
{ "schemaVersion": 1, "program": { } }
```

- `COMPANY_SCHOOL`은 `TRAINED_TEACHER`처럼 **replace**. deep merge · 루트 `generalCommonInfo` · 평탄 `title` / `announcementTitle` / `businessStartDate` 미러 **금지**.
- `announcementTitle`은 nested 공고명 유지. 프로그램 `title`로 덮지 말 것.
- `maxRequestedScheduleCount` / `maxDailySessionCount` / `satisfactionTarget` 을 요청 모집·설문과 다르게 만들지 말 것.  
  `186026`이면 일정 상한 **1**, 1일 차시 **4**, 만족도 키 있으면 `NONE`이 되면 안 된다.
- 일반(`GENERAL_*`) merge는 유지.

---

## 검수 (`186026`과 같은 payload 1건 + 기존 id PATCH)

- [ ] `GRADE_1` `NORMAL` `amount` = 140000 (500000 아님). 장거리 = 50000
- [ ] 2급 120000/40000, 3급 100000/30000
- [ ] `LONG_DISTANCE_TRANSPORTATION` `useYn: true` 는 지급 id에 그 항목이 있을 때만
- [ ] `p-166201`, `p-166202` 에 해당하는 enum만 true
- [ ] 요청에 없으면 `tollReimbursementYn=true`, `fixedLodgingAmount=80000`, `longDistanceThresholdKm=200` 을 기본으로 넣지 않음
- [ ] `rounds.endDate` / `schedules.endDate` = `2026-11-09` (`endAt` instant와 같은 서울 날짜)
- [ ] `rounds.deliveryType` = `offline`
- [ ] 루트 `curriculum` ≠ `oneLineIntroduction`
- [ ] 루트 `startDate`/`endDate`가 요청 운영 기간(10/11~11/09)을 유지. 1/1~12/31로 덮지 않음
- [ ] 등록일이 교육 시작 전이면 `periodStatus`가 `IN_PROGRESS`가 아님
- [ ] GET JSON에 루트 `generalCommonInfo` 없음
- [ ] `announcementTitle` = `중학생 진로·직업 탐색 프로그램 모집` (프로그램명으로 바뀌지 않음)
- [ ] flat `maxRequestedScheduleCount`/`maxDailySessionCount` 가 있으면 1 / 4. `satisfactionTarget=NONE` 인데 설문 키에 satisfaction이 있으면 실패
- [ ] `otherNotes`를 컬럼으로 둔다면 `otherMatters`가 null이 아님
- [ ] 일반 프로그램 JSON merge는 이 배포로 안 바뀜

---

## 회신 부탁

1. `wagePolicies` 없이 JSON만 오면 서버가 파싱할지, FE가 배열을 필수로 보낼지  
2. `186014`·`186026` 기본 50만 row를 PATCH로 맞출지, 배치로 맞출지  
3. `COMPANY_SCHOOL` `serviceDetailJson`을 replace로 바꿀 수 있는지  
4. 정산이 `settlementPolicy`만 보는지  
5. `endDate=11-08`이 회차 instant를 하루 자른 것인지, 요청 `educationScheduleLines`/`dateRangeSeal`(이미 11/08)을 따른 것인지  
6. 강사 모집 창을 `recruitments` 행으로 안 만드는 것이 1사1교 계약인지. `maxCount`에 모집 상한을 안 넣는 것도 계약인지  
7. `otherNotes`의 컬럼이 `otherMatters`인지  
8. `tollReimbursementYn` / `fixedLodgingAmount` / `longDistanceThresholdKm` 기본 주입이 의도인지  
