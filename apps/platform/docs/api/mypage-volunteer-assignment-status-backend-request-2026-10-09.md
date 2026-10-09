# Cursor prompt — 회원 포탈 봉사현황 상세 「배정현황」 API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/mypage-volunteer-assignment-status-backend-request-2026-10-09.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-09 |
| 상태 | **BE 완료** — FE 수용 QA 대기. 핸드오프: `JABACK/docs/frontend/mypage-volunteer-assignment-status-frontend-handoff-2026-10-09.md` |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P0** |
| 화면 | Platform 마이페이지 → 봉사현황 → 프로그램 상세 → **배정현황** 탭 |
| 시안 | Figma `tiDywBHEhTkruOHjh1ctuT` node `11005:341176` |
| 기획 | Notion `4-0. 일반 > 봉사현황 상세_배정 현황 탭` (`382f3e2a-77d0-8036-9fe7-fdb19e2066a9`) |

관련:

- 활동 API 게이트: [mypage-lnb-activity-gate-backend-cursor-prompt-2026-09-29.md](./mypage-lnb-activity-gate-backend-cursor-prompt-2026-09-29.md) — `.../schedules` 403 이슈. **배정현황 UI는 schedules 리스트가 아니라 본 문서의 assignments** 를 쓴다.
- CMS 개인 봉사 배정 enrich: `apps/cms/docs/api/general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md` — 관리자 education-scope enrich. 포탈 응답은 **회원 읽기 전용**으로 동등 필드를 내려라.

---

## 1. 한 줄 요약

일반 회원 봉사현황 상세 「배정현황」탭에 **배정됨 / 대기·취소** 두 테이블을 채울  
`GET /api/portal/me/program-applications/VOLUNTEER/{applicationId}/assignments` 가 필요하다.

기존 `GET .../schedules` 는 교육일정형 회차 목록이라 시안(지역·거리·배정 상태·복수 일정 셀)을 충족하지 못한다.  
FE는 schedules로 invent하지 않는다.

---

## 2. 지금 (FE)

화면: `VolunteerAssignmentPanel`  
경로: `/mypage/volunteer/VOLUNTEER/{applicationId}?section=schedule`

호출(준비됨):

```http
GET /api/portal/me/program-applications/VOLUNTEER/{applicationId}/assignments
Authorization: Bearer <member>
```

- **200** → 아래 shape로 테이블 렌더
- **404 / 501 / 기타 실패** → 「배정현황을 불러오지 못했습니다.」 (mock으로 채우지 않음)
- mock(원격 API 비활성)일 때만 FE mock 시드 사용

관리자 액션(배정 취소·추가·선택 배정·엑셀·배정 봉사자 수)은 **포탈 비노출** (기획 노란 하이라이트).

---

## 3. 화면이 필요한 것

### 3.1 개인 (`programAudience=individual`) — 시안 11005:341176

**배정된 봉사 일정**

| UI | 의미 | 권장 소스 |
|----|------|-----------|
| No. | 내림차순 | FE 계산 가능 |
| 봉사 지역 | 시·도+구·군 | schedule `locationName` / `address` 축약 |
| 자택과의 거리 | `Nkm` / `Nkm (장거리)` | 회원 자택 ↔ 장소 `distanceKm` |
| 담당 봉사 진행 일정 | 복수 줄 가능 | `YYYY년 MM월 DD일(요일) HH:mm~HH:mm \| n차시` |

행 단위: **같은 봉사 지역(+거리)으로 묶인 배정 확정 schedule 그룹** (시안은 한 셀에 복수 일정).

**배정된 봉사 일정 목록** (시안 제목 — CMS 「배정 대기 봉사 일정」과 동일 데이터, 포탈 라벨만 다름)

| UI | 의미 | 권장 소스 |
|----|------|-----------|
| No. | 내림차순 | FE |
| 기관 소재지 | 장소 요약 | schedule 지역 (시안 placeholder `text`) |
| 자택과의 거리 | 동일 | `distanceKm` |
| 담당 봉사 진행 일정 | 1행 1일정 | schedule 라벨 |
| 배정 상태 | `배정 대기` / `배정 취소` | enum |

- **배정 봉사자 수 비노출**
- 선택 배정·엑셀 비노출

### 3.2 기관 (`programAudience=organization`)

기획: CMS 「배정된 기관 목록 / 배정 대기 기관 목록」과 동일 컬럼, 관리 버튼·배정 봉사자 수 비노출.

| 테이블 | 컬럼 |
|--------|------|
| 배정된 기관 목록 | No. / 기관명 / 담당학년 / 기관 소재지 / 자택과의 거리 / 담당 봉사 진행 일정(복수) |
| 배정된 대기 기관 목록 | + 희망 학년 / 배정 상태(`배정 대기`\|`배정 취소`) |

---

## 4. BE 요청

### 4.1 신규 path (필수)

```http
GET /api/portal/me/program-applications/{applicationType}/{applicationId}/assignments
```

- `applicationType` = `VOLUNTEER` (1차). UJAT 봉사는 후속(「배정 및 출결 현황」) — 이번 티켓에서 shape만 깨지지 않게 두거나 동일 path에 `programAudience`로 분기.
- 소유 회원만 200. 타인·미선정 → 403 (기존 활동 API와 동일 게이트).
- OpenAPI에 등록.

### 4.2 응답 shape (권장)

```json
{
  "programAudience": "individual",
  "assigned": [
    {
      "id": "assigned-group-1",
      "locationName": "서울특별시 강서구",
      "distanceKm": 10.0,
      "scheduleLines": [
        "2026년 01월 09일(금) 09:00~12:20 | 2차시",
        "2026년 01월 09일(금) 10:00~11:20 | 1차시"
      ]
    }
  ],
  "waiting": [
    {
      "id": "waiting-5",
      "scheduleId": 186626,
      "locationName": "서울특별시 양천구",
      "distanceKm": 10.0,
      "scheduleLine": "2026년 01월 09일(금) 09:00~12:20 | 2차시",
      "assignmentStatus": "WAITING"
    },
    {
      "id": "waiting-3",
      "scheduleId": 186627,
      "locationName": "서울특별시 영등포구",
      "distanceKm": 12.3,
      "scheduleLine": "2026년 01월 09일(금) 09:00~12:20 | 1차시",
      "assignmentStatus": "CANCELLED"
    }
  ]
}
```

기관형 예시 필드 추가:

- assigned: `schoolName`, `educationGrade`, `region` (+ `scheduleLines`)
- waiting: `schoolName`, `desiredGrade`, `region`, `scheduleLine`, `assignmentStatus`

| 필드 | 규칙 |
|------|------|
| `programAudience` | `individual` \| `organization` |
| `distanceKm` | number 또는 null. FE는 null → `-`, `>=100` → `Nkm (장거리)`. **FE invent 금지** |
| `assignmentStatus` | `WAITING` \| `CANCELLED` (대소문자 무시). CMS 「배정 불가」는 포탈에서 `CANCELLED`로 매핑하거나 별도 enum을 OpenAPI에 명시 |
| `scheduleLines` / `scheduleLine` | 표시용 한글 라벨 권장. 없으면 FE `-` 행 제외 |
| 빈 목록 | `assigned: []`, `waiting: []` (omit 금지 권장) |

### 4.3 데이터 의미

| 배열 | 포함 |
|------|------|
| `assigned` | 해당 봉사자에게 **배정 확정**된 일정(개인) / 기관(기관형) |
| `waiting` | 배정 대기·배정 취소(또는 불가) 건. **배정 완료 건은 waiting에 넣지 말 것** |

거리·지역 산출은 CMS 개인 봉사 education-scope enrich와 동일 소스(회원 자택 ↔ schedule 장소)를 재사용해라.

### 4.4 하지 말 것

- `GET .../schedules` 응답만으로 포탈 배정현황을 대체하라고 FE에 요구하지 마라 (컬럼·상태 부족)
- 포탈 응답에 배정 봉사자 수·체크박스·배정 PUT 액션 필드를 필수로 넣지 마라
- education-scope 관리자 path를 회원 Bearer로 열지 마라 — **포탈 전용 GET**을 둬라
- FE가 km·지역을 invent하도록 요구하지 마라

---

## 5. 수용 기준

- [ ] `GET .../VOLUNTEER/{applicationId}/assignments` 가 소유 회원 Bearer로 **200**
- [ ] 개인 프로그램: `assigned[].locationName` + `scheduleLines[]` + `distanceKm`(또는 null) 존재
- [ ] 개인 프로그램: `waiting[].assignmentStatus` 가 `WAITING` 또는 `CANCELLED`
- [ ] Platform 배정현황 탭에서 시안과 같은 두 테이블이 채워진다 (지역·거리·일정·상태)
- [ ] 관리 버튼·배정 봉사자 수가 포탈에 노출되지 않는다
- [ ] `.../schedules` 계약은 유지 (교육현황·UJAT 등 다른 화면용)

---

## 6. FE 참고 경로

| 역할 | 경로 |
|------|------|
| 패널 | `apps/platform/src/features/mypage/volunteer/assignments/ui/panel.tsx` |
| fetch | `apps/platform/src/features/mypage/volunteer/assignments/api/client.ts` |
| mapper | `apps/platform/src/features/mypage/volunteer/assignments/api/mappers.ts` |
| query key | `platformQueryKeys.mypage.programApplications.assignments` |
| 상세 탭 | `apps/platform/src/pages/mypage/volunteer/detail/page.tsx` |

---

## 7. QA

- Platform 로그인 후 `/mypage/volunteer` → 진행중 봉사 상세 → **배정현황**
- Network: `.../assignments` 200 + JSON
- 개인: 상단 「배정된 봉사 일정」, 하단 「배정된 봉사 일정 목록」+ 주황 `배정 대기` / 회색 `배정 취소`
