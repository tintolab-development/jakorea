# Cursor prompt — GENERAL 강사 승인: 희망 일정 원천 · OSA 선배정 비필수 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-instructor-approve-preferred-schedule-not-osa-backend-request-2026-10-09.md`

> **결과 (2026-10-09):** BE가 희망 일정 스코프로 정렬했고 FE 핸드오프를 냈다.  
> FE 「할 일」1–4는 이미 반영됨. 로컬은 Flyway `V26__…` 적용 후 bootRun 재시작 → program `186068` 강사승인 재현으로 연동 확인.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-09 |
| 상태 | **반영 완료 (BE 핸드오프 수신)** — 추가 BE 작업 불필요 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | ~~P0~~ 완료 |
| 프로그램 유형 | **`GENERAL_ORGANIZATION`만** — UJAT·1사1교와 섞지 마라 |
| 재현 | programId `186068`, 기관 `1691189`(강서초, 승인·희망 10/23·10/30), 강사신청 `1694641` |
| BE 핸드오프 (SSOT) | `JABACK/docs/frontend/general-instructor-approve-preferred-schedule-scope-frontend-handoff-2026-10-09.md` |
| 폐기된 이전 핸드오프 | `instructor-approve-organization-schedule-scope-frontend-handoff-2026-10-09.md` (활성 OSA만 선택지) |

---

## 1. 한 줄 요약 (기획 SSOT)

**GENERAL 기관의 「승인된 희망 교육 일정」이 강사 신청·배정의 원천이다.  
관리자 OSA(`program_organization_schedule_assignment`) 선배정은 필수가 아니다.**

UJAT 「신청 기관 임시 배정」플로우를 GENERAL에 이식하지 마라.

---

## 2. 노션 기획 (FE·기획 합의, 2026-10-09)

```text
기관 신청
  → 희망 교육 일정 저장
  → 기관 승인
  → 승인 기관 + 희망 일정 = 강사 신청·CMS 배정 후보
  → 강사 신청
  → CMS 강사 승인 시 기관+희망 일정 선택
  → 실제 강사-기관-일정 배정 생성
  (이후 진행 현황에서 추가 배정도 가능)
```

| 항목 | 기획 |
|------|------|
| 기관 승인 후 별도 「교육 일정 배정 / OSA 생성」단계 | **없음** (버튼: 승인 취소·정보 수정·코멘트·개인정보만) |
| 강사 신청 폼 「강의 진행 가능 일정」 | **승인 기관이 신청한 희망 일정** |
| 강사 승인 「기관 배정 안내」 | 기관+일정 선택 후 배정 |
| 진행 현황 참여 기관·강사 상세 | 배정 대기·선택 배정·추가 배정 **존재** (UJAT 임시배정과 별개) |
| UJAT 임시 배정 | UJAT 전용 — GENERAL에 동일 선행 조건으로 쓰지 않음 |

---

## 3. 현재 BE/관측 갭

### 3.1 FE가 본 데이터

```http
GET /api/admin/programs/186068/organization-applications/1691189/schedule-assignments
```

```json
{
  "programId": 186068,
  "organizationApplicationId": 1691189,
  "revision": 0,
  "totalClassCount": 0,
  "slots": []
}
```

기관은 **승인 완료**이고 희망 일정(10/23, 10/30)은 상세에 있다.  
`slots: []`만으로 「선배정이 안 되어 비정상」이라고 보면 **기획과 반대**다.

### 3.2 문제의 계약 (재검토 대상)

`instructor-approve-organization-schedule-scope-frontend-handoff-2026-10-09.md` 는:

1. 강사 승인 전 관리자가 OSA를 만들 것  
2. 활성 OSA 쌍만 FE 선택지에 둘 것  
3. 없으면 `409 INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID`

을 요구했다. 이는 **GENERAL 노션 기획과 불일치**한다.

FE는 위 핸드오프를 따랐다가 모달이 비게 되었고, **OSA 사전 필터는 제거**한다.  
후보 = 승인 기관 목록 + 희망 일정/`resolvedScheduleId`.  
BE가 그대로 OSA 미존재를 409로 막으면 **모달은 열려도 승인은 계속 실패**한다 → **FE·BE 함께 검증** 필요.

---

## 4. BE에 요청하는 일

### 4.1 검증 (수정 전)

1. `POST /api/admin/instructor-applications/{id}/approve` 에서  
   `INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID` 가 **언제** 나는지 (코드 경로·가드 조건)를 문서화하라.
2. GENERAL에서 `assignments[].scheduleId` + `organizationApplicationId` 가  
   **승인 기관의 희망 일정(resolved schedule)** 을 가리킬 때, OSA 행이 없으면 거절하는지 확인하라.
3. 출석·정산·진행 현황이 OSA / instructor-assignment / requested-schedule 중 **무엇을 FK로 쓰는지** 확인하라.

### 4.2 수정 방향 (고정하지 말 것)

목표는 다음을 **가능하게** 하는 것이다.

- 승인 기관 + 그 기관 희망 일정에서 나온 `scheduleId`(+ `organizationApplicationId`)로  
  강사 `approve` / 진행 현황 배정이 **성공**한다.
- OSA 행이 **미리 없어도** GENERAL 강사 승인이 막히지 않는다.

구현 선택지는 BE가 DB·연동을 보고 고른다. **무조건 OSA 자동 생성으로 고정하지 마라.**

가능한 방향 예:

| 옵션 | 설명 |
|------|------|
| A | approve/배정 시점에 필요한 배정·스케줄 링크를 BE가 생성 (내부적으로 OSA를 쓸지 여부는 BE 재량) |
| B | 희망 일정/`resolvedScheduleId`만으로 스코프를 인정하고, OSA는 선택·지연 생성 |
| C | 기타 — 출석·정산 FK를 깨지 않는 설계 |

유지할 검증:

- 중복 배정
- 일정·하루 기관 충돌 (기존 계약)
- 기관/강사 **승인 상태**
- `organizationApplicationId` 생략·null (기존 계약)
- **UJAT** 임시 배정·OSA 계약 **변경하지 않음**
- 기존 OSA 데이터·`schedule-assignments` GET **호환** (읽기 API 유지 OK). GENERAL 강사 승인 **선행 조건**으로만 쓰지 말 것.

### 4.3 하지 말 것

- GENERAL 관리자에게 UJAT식 「기관 일정 선배정」UI를 필수 단계로 요구하지 마라.
- FE에게 「활성 OSA만 선택지로 노출」을 다시 요구하지 마라 (기획 불일치).
- `DATABASE_ERROR`로 되돌리지 마라. 거절이 남으면 명확한 비즈니스 코드·message.

---

## 5. 수용 기준

- [ ] 강서초(`1691189`) 승인 + 희망 10/23·10/30 이 강사 승인 후보로 **의미 있는 scheduleId**를 갖는다 (`resolvedScheduleId` 등).
- [ ] `schedule-assignments` `slots: []`인 상태에서도  
      `POST …/instructor-applications/{id}/approve` +  
      `assignments: [{ scheduleId, organizationApplicationId, … }]` 가 **200** (또는 기획상 성공) 한다.
- [ ] 승인 후 진행 현황(참여 기관·참여 강사 상세) **추가 배정**이 기존처럼 동작한다.
- [ ] UJAT 임시 배정·승인 플로우 **회귀 없음**.
- [ ] FE 핸드오프에: 스코프 규칙 변경 요약, OSA 역할(내부 저장 vs 비필수), 409가 남는 경우와 message.

---

## 6. FE 측 (참고 — BE가 고치지 않음)

| 항목 | 상태 |
|------|------|
| GENERAL 강의 배정 모달 OSA 사전 필터 | **제거 완료** — 승인 기관 희망 일정 기준 |
| UJAT | 변경 없음 |
| `409 INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID` | 서버 `message` 표시 유지. OSA 선배정 UI 유도 문구 제거 |
| 단독 FE 배포 | 모달은 채워지나 BE 미수정 시 **409 가능** → 최종 QA는 FE+BE 동시 |

---

## 7. BE → FE 핸드오프 형식

`JABACK/docs/frontend/` 에 남겨라.

1. `INSTRUCTOR_ORGANIZATION_SCHEDULE_SCOPE_INVALID` 발생 조건 (변경 전/후)
2. GENERAL 강사 approve 스코프 SSOT: **희망 일정** (OSA 선배정 비필수) 명시
3. 배정 시 BE가 생성하는 데이터 (있다면 테이블/엔티티)
4. OSA / `schedule-assignments` 의 이후 역할
5. 회귀: UJAT, 1사1교, `organizationApplicationId` 생략
