# FE 회신 반영 — `GET …/program-history` BAD_REQUEST (2026-09-11)

> **상태: BE 원인 확정 · 로컬 수정 완료** (bootRun 재시작 필요 · staging은 PR merge 후)  
> Path: `GET /api/admin/users/{memberId}/program-history`  
> 재현 traceId 예: `fca766384afa4213bd10ab56d68d03f1`

---

## 1) BAD_REQUEST 실제 원인 (BE)

`MemberHistoryQueryService` 목록 SQL에 `LIKE '%ASSIGNMENT%'`가 있는데 `.formatted(whereSql)`를 써서  
`UnknownFormatConversionException`(IllegalArgumentException) → `400 BAD_REQUEST` / `field=null` / `입력값을 확인해 주세요.`

**`size` · `historyType` · `role` 문제가 아님.**

---

## 2) 허용 query (BE 확정)

| 이름 | 타입 | required | enum / max |
|------|------|----------|------------|
| `historyType` | string | no | `COURSE` \| `VOLUNTEER` \| `ALL`(또는 생략=전체) |
| `programName` | string | no | 부분 검색 |
| `progressYear` | int | no | 1900–3000 (아니면 `PROGRAM_HISTORY_YEAR_INVALID`) |
| `progressStatus` | string | no | `SCHEDULED` / `IN_PROGRESS` / `COMPLETED` 등 |
| `managerName` | string | no | 담당자명 부분 검색 |
| `page` | int | no | default `0` |
| `size` | int | no | default `20`, **max clamp 100**(거절 아님) |
| `role` | — | — | **없음** (보내도 무시) |

잘못된 `historyType` → `PROGRAM_HISTORY_TYPE_INVALID`, `field=historyType`.

---

## 3) 봉사만 필터

- 서버: `historyType=VOLUNTEER`
- 또는 쿼리 없이 받은 뒤 FE `participantType === 'VOLUNTEER'`

`role` / `participantType` query는 없음.

---

## 4) FE 현재 호출 (2026-09-11 반영)

```http
GET /api/admin/users/{memberId}/program-history?page=0&size=50
```

- **historyType 생략**: 동일 응답을 봉사 탭(`volunteerHistories`) + 수강 enrollment 보강(`enrollmentFromHistory`)에 나눠 씀 → 서버 `VOLUNTEER`만 받으면 enrollment 쪽이 비게 됨.
- 봉사 행: `mapMemberProgramHistoryItems` → `participantType === 'VOLUNTEER'`
- size=50: BE max clamp 100 · 다른 회원 상세 목록 size와 맞춤

구현: `use-member-detail-subresource-queries.ts` → `memberProgramHistoryQueryOptions`

---

## 5) staging

로컬 BE 수정 후 **bootRun 재시작**. staging은 해당 브랜치/PR merge 후.

**Last updated:** 2026-09-11
