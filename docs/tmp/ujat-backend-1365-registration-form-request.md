# [BE 요청] UJAT 1365 봉사시간 등록 양식 — 반기 일괄 조회 API

> 백엔드 담당자(또는 BE 에이전트)에게 그대로 전달하는 프롬프트입니다.
> 작성: 2026-11-09 · FE 화면: CMS > UJAT 프로그램 상세 > 상반기/하반기 교육 진행 현황 > 참여 봉사자 > `1365 봉사시간 등록 양식` 미리보기·엑셀 다운로드
> 피그마: `Popup / View / w1400 / 엑셀 양식 미리보기` (node 10014:40205)

## 1. 배경

CMS는 1365 봉사시간 등록용 엑셀 양식을 미리 보여주고 내려받게 합니다. 피그마 양식은 아래와 같습니다.

| A 이름 | B 생년월일 | C 1365 ID | D 지역 | E 발대식 | F~ 교육일(날짜별) |
|---|---|---|---|---|---|
| 고종욱 | 1999.01.11 | rhwhddnr11 | 서울 | 2시간 | 5시간 / **3시간 32분**(빨강) / 0시간 / - |

- **교육이 완료된 항목만** 시간이 들어가고, 아직 진행하지 않은 교육일은 `-`입니다.
- 결석은 `0시간`입니다.
- 인정 시간이 기준보다 모자라면(지각·조퇴) 빨간 굵은 글씨로 표시합니다.

현재 FE는 아래 API들을 조합해서 시트를 만듭니다. 이 조합으로는 양식을 정확히 채울 수 없습니다.
- `GET /volunteer-applications`: 이름·생년월일·마스킹된 1365 ID
- `GET /program-execution/.../ujat/allocation-matrix`: memberId와 participantId 연결
- `GET /program-execution/programs/{programId}/attendances?scheduleIds=...`: 일정별 출석·`volunteer1365Minutes`

## 2. 현재 데이터로 막히는 점 (programId 186495에서 확인)

1. **1365 ID가 마스킹됨**
   - 목록 응답 `id1365`은 마스킹 값입니다. 원문은 `POST /api/admin/programs/{programId}/participants/{participantId}/1365-registration-form`로 1명씩만 받을 수 있습니다.
   - 봉사자 수만큼 N번 호출해야 하고, 감사 로그(PREVIEW/DOWNLOAD)도 N건 쌓입니다.
2. **대상 봉사자가 페이지 단위로만 옴**
   - 목록이 `page/size=20`이라, 양식에 반기 전체 봉사자가 다 들어간다는 보장이 없습니다.
3. **지각(LATE) 출석에 인정 분이 없음**
   - 예: `attendanceId 1800460`, `status: "LATE"`, `checkInSource: "MEMBER_SELF"`인데 `volunteer1365Minutes: null`, `volunteer1365DurationLabel: null`입니다.
   - 출석은 했는데 양식에는 `-`(미완료)로 나옵니다.
4. **발대식(사전교육) 시간이 없음**
   - `scheduleRole: PRE_EDUCATION` 일정(예: 187570)은 attendances 응답에 행이 아예 없습니다.
   - 피그마 E열(발대식 `2시간`/`0시간`)을 채울 수 없습니다.
5. **"교육 완료"와 "시간 미달" 기준이 없음**
   - 출석 placeholder 행(`attendanceId: null`, `status: null`)만으로는 미진행(`-`)인지 결석(`0시간`)인지 FE가 판단할 수 없습니다.
   - 빨간 표시 기준도 FE가 `internalLate === true || status === 'LATE'`로 추정하고 있습니다. 조퇴나 인정 시간 차감은 반영되지 않습니다.

## 3. 요청 사항

### 3-1. 반기 일괄 조회 API 신설 (권장)

```
POST /api/admin/programs/{programId}/ujat/1365-registration-form
Body: { "semesterType": "FIRST_HALF" | "SECOND_HALF", "mode": "PREVIEW" | "DOWNLOAD" }
```

- **POST로 두는 이유:** 기존 단건 API와 같이 원문 열람 감사 로그를 1회만 남기기 위해서입니다.
- **대상:** 해당 반기의 최종 합격 봉사자 전원입니다. 페이지네이션은 없습니다. 활동 포기(`giveUp`)를 포함할지는 정책을 확인해 주세요. FE는 응답 그대로 그립니다.
- **응답 예시**

```json
{
  "programId": 186495,
  "semesterType": "SECOND_HALF",
  "columns": {
    "openingCeremony": { "scheduleId": 187570, "date": "2026-08-31", "completed": true },
    "sessions": [
      { "scheduleId": 187580, "date": "2026-11-06", "completed": true },
      { "scheduleId": 187581, "date": "2026-11-13", "completed": false }
    ]
  },
  "volunteers": [
    {
      "participantId": 1695056,
      "memberId": 190167,
      "name": "김민수",
      "birthDate": "1999-01-11",
      "external1365Id": "rhwhddnr11",
      "educationRegionCode": "SEOUL",
      "educationRegionName": "서울",
      "openingCeremony": { "minutes": 120, "status": "COMPLETED", "shortfall": false },
      "sessions": [
        { "scheduleId": 187580, "minutes": 212, "status": "COMPLETED", "shortfall": true },
        { "scheduleId": 187581, "minutes": null, "status": "NOT_COMPLETED", "shortfall": false }
      ]
    }
  ]
}
```

#### 필드 규칙

- **`columns.sessions`**
  - 해당 반기의 하루 단위 교육일만 넣습니다(`scheduleRole: EDUCATION`, 시작일 = 종료일). 날짜 오름차순입니다.
  - 기간형 일정(학교 경제교육 기간, 연간 운영 창)과 해단식(`CLOSING`)은 넣지 않습니다.
- **`columns.openingCeremony`:** 해당 반기 `PRE_EDUCATION` 일정입니다. 없으면 `null`입니다.
- **셀 `status`**
  - `COMPLETED`: 교육 완료 + 출석
  - `ABSENT`: 교육 완료 + 결석. `minutes`는 0입니다.
  - `NOT_COMPLETED`: 아직 진행 전이거나 미확정입니다. FE는 `-`로 표시합니다.
  - "교육 완료" 판정 기준은 BE가 정해 주세요. 예: 일정 종료 시각 경과 + 출결 확정.
- **`minutes`:** 1365 인정 분입니다. FE는 `5시간` / `3시간 32분` / `0시간`으로 표기합니다.
- **`shortfall`:** 인정 시간이 정책 기준 시간(`ujatTyped1365Policy.defaultHours` 등)보다 모자라면 `true`입니다. FE는 빨간 굵은 글씨로 표시합니다.
- **`external1365Id`:** 원문입니다. 단건 API와 같은 권한·감사 정책을 적용해 주세요.
- **연락처·주소·계좌·주민번호는 포함하지 않습니다.** 기존 `Ujat1365RegistrationFormResponse` 원칙과 같습니다.

### 3-2. 일괄 API 전에라도 필요한 수정 (기존 API)

1. **LATE 출석 인정 분:** `status: LATE` 출석에도 `volunteer1365Minutes`와 `volunteer1365DurationLabel`을 계산해 내려 주세요. 회원 자가 체크인(`MEMBER_SELF`)도 포함입니다.
2. **발대식 출석:** `PRE_EDUCATION` 일정도 `GET .../attendances?scheduleIds=` 응답에 출석 행과 인정 분이 오게 해 주세요. 발대식 인정 시간 정책(예: 2시간)도 알려 주세요.
3. **시간 미달 플래그:** attendances 항목에 `volunteer1365Shortfall: boolean`을 추가해 주세요.

## 4. FE 현재 처리 (BE 반영 전 임시)

- **열 구성**
  - E열 발대식 = 반기의 `PRE_EDUCATION` 일정입니다.
  - 날짜 열 = 하루 단위 교육일입니다. 기간형 일정과 해단식은 제외합니다.
- **칸 값**
  - 출석 행이 없거나 인정 분이 없으면 `-`입니다.
  - `ABSENT`이고 분 값이 없으면 `0시간`입니다.
  - `internalLate` 또는 `LATE`이면 빨간 굵은 글씨입니다.
- **봉사자 정보**
  - 봉사자 목록은 화면에 로드된 행을 사용하므로 20명 제한이 있을 수 있습니다.
  - 1365 ID는 마스킹 값이 그대로 나옵니다.
- **관련 FE 파일:** `apps/cms/src/features/program/ujat/ui/detail-modal/progress/volunteers/`
  - `volunteer-1365-fortune-data.ts`
  - `use-volunteer-1365-attendance.ts`
  - `volunteer-1365-excel.ts`
  - `volunteer-1365-preview-modal.tsx`

## 5. 완료 기준

- [ ] 반기 일괄 API 응답만으로 피그마 양식(A~J열)을 채울 수 있다.
- [ ] 1365 ID 원문, 전체 봉사자, 발대식 시간, 미진행·결석 구분, 시간 미달 표시가 모두 응답에 있다.
- [ ] PREVIEW/DOWNLOAD 감사 로그가 요청 1회당 1건 남는다.
- [ ] OpenAPI(orval) 스키마가 갱신되어 FE가 생성 타입으로 연결할 수 있다.
