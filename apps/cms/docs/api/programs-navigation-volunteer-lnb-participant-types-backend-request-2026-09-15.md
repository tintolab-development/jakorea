# BE 수정 요청 (2026-09-15) — 단독 문서

**작성일:** 2026-09-15  
**문서 성격:** **이 파일만** 보고 구현·검수 가능 (선행/관련 문서 열람 불필요)  
**포함 이슈:**

| # | 우선순위 | 대상 API | 한 줄 |
|---|----------|----------|-------|
| **A** | **P0** | Programs · `GET …/navigation` | `serviceDetailJson.generalParticipantTypes`에 봉사자가 있어도 `VOLUNTEER_APPLICATIONS`가 `enabled:false` |

---

# A. 일반 프로그램 navigation — 참여자 유형과 LNB enable 불일치

**요청 대상:** Programs API · 일반(GENERAL / GENERAL_INDIVIDUAL / GENERAL_ORGANIZATION) 프로그램  
**엔드포인트:**

| Method | Path | 역할 |
|--------|------|------|
| `GET` | `/api/admin/programs/{programId}` | 상세 SSOT — `serviceDetailJson`에 참여자 유형 영속 |
| `GET` | `/api/admin/programs/{programId}/navigation` | 상세 LNB enable/disable · `allowedApplicationTargets` |

**FE 동작(참고, 수정 불필요 — 서버 응답을 그대로 따름):**

- `use-general-program-navigation.ts` → `lnb[].enabled === false` 이면 해당 LNB 숨김  
- 키 매핑: `VOLUNTEER_APPLICATIONS` → `volunteer_applications`  
- 공통정보 「참여자 유형」표시: `serviceDetailJson` 파싱 → `Program.generalParticipantTypes`

---

## A1. 요약

**한 줄:** 공통정보에 참여자 유형 **봉사자**가 있는데, navigation은 「봉사자 신청」LNB를 **정책상 비활성**으로 내려 FE에서 메뉴가 안 보임.

| 구분 | 결과 |
|------|------|
| 상세 GET `serviceDetailJson.generalParticipantTypes` | `volunteer` 포함 ✅ |
| 공통정보 UI 「참여자 유형」 | 봉사자 노출 ✅ |
| 진행 현황 「참여 봉사자」등 types 기반 메뉴 | 노출되는 경우 있음 ✅ |
| **navigation `VOLUNTEER_APPLICATIONS.enabled`** | **`false`** ❌ |
| **navigation `allowedApplicationTargets`** | 봉사 타겟 없음 ❌ |

**판정:** FE 표시/가드 문제가 아니라 **navigation 판정이 상세에 영속된 참여자 유형과 어긋남**.

---

## A2. 재현 (실측)

관리자 CMS · programs remote · 실 JWT.

### A2.1 케이스 — `programId=170308`

1. 일반 프로그램 상세 오픈 (`id=170308`, `programType=GENERAL_INDIVIDUAL`).  
2. 공통정보 「참여자 유형」 확인.  
3. Network:
   - `GET /api/admin/programs/170308`
   - `GET /api/admin/programs/170308/navigation`

#### 상세 GET (발췌)

- 탑레벨: `programType: "GENERAL_INDIVIDUAL"`, `category: "individual"`
- `serviceDetailJson` (파싱):

```json
{
  "generalParticipantTypes": ["individual", "volunteer"],
  "generalProgramAudience": "individual"
}
```

#### navigation GET (발췌, 실측)

```json
{
  "programId": 170308,
  "rawProgramType": "GENERAL_INDIVIDUAL",
  "canonicalProgramType": "GENERAL_INDIVIDUAL",
  "allowedApplicationTargets": ["INDIVIDUAL"],
  "lnb": [
    {
      "key": "PARTICIPANT_APPLICATIONS",
      "label": "참여자 신청 정보",
      "enabled": true
    },
    {
      "key": "INSTRUCTOR_APPLICATIONS",
      "label": "강사 신청 정보",
      "enabled": true
    },
    {
      "key": "VOLUNTEER_APPLICATIONS",
      "label": "봉사자 신청 정보",
      "enabled": false,
      "reason": "현재 프로그램 정책상 해당 메뉴를 사용할 수 없습니다."
    }
  ]
}
```

**모순:**

| 항목 | 상세 types | navigation |
|------|------------|------------|
| 개인 신청 | `individual` 있음 | `PARTICIPANT_APPLICATIONS` on ✅ |
| 봉사자 신청 | **`volunteer` 있음** | **`VOLUNTEER_APPLICATIONS` off** ❌ |
| 강사 신청 | `teacher_instructor` **없음** | `INSTRUCTOR_APPLICATIONS` **on** ⚠️ |

### A2.2 동일 패턴 — `programId=166422` (기 보고)

- 공통정보: 학교/기관 · 강사 · **봉사자**
- navigation: `VOLUNTEER_APPLICATIONS.enabled: false` (동일 reason)
- `allowedApplicationTargets`: `ORGANIZATION`, `INDIVIDUAL`만 (봉사 없음)

→ **특정 시드 1건이 아니라 navigation 정책이 `generalParticipantTypes`를 반영하지 않는 구조 이슈**로 판단.

---

## A3. 기대 계약

### A3.1 SSOT

참여자 유형의 **단일 진실**은 프로그램 상세에 영속된 값이어야 한다.

| 우선순위 | 소스 | 비고 |
|----------|------|------|
| 1 | `serviceDetailJson.generalParticipantTypes` | CMS 등록·공통정보 수정이 기록하는 조합 |
| 2 (보조) | `generalProgramAudience` / `programType` / `category` | 대분류(개인/기관) — **봉사·강사 세부 조합 대체 불가** |

navigation은 **1번을 읽어** LNB·`allowedApplicationTargets`를 계산한다.  
`programType=GENERAL_INDIVIDUAL`만 보고 봉사 LNB를 끄면 안 된다.

### A3.2 LNB enable 매핑 (일반 프로그램)

| `generalParticipantTypes` 포함 | navigation `lnb` key | `enabled` |
|--------------------------------|----------------------|-----------|
| `school_institution` | `ORGANIZATION_APPLICATIONS` (또는 기관 신청 키) | `true` |
| `individual` | `PARTICIPANT_APPLICATIONS` | `true` |
| `teacher_instructor` | `INSTRUCTOR_APPLICATIONS` | `true` |
| `volunteer` | `VOLUNTEER_APPLICATIONS` | **`true`** |
| 해당 값 없음 | 위 대응 키 | `false` (+ reason) |

`170308` 기대:

- `PARTICIPANT_APPLICATIONS`: `true`
- `VOLUNTEER_APPLICATIONS`: **`true`**
- `INSTRUCTOR_APPLICATIONS`: types에 강사 없으면 **`false`** (현재 `true`면 과다 노출)

### A3.3 `allowedApplicationTargets`

참여자 유형·신청 타겟과 정합.

| types | targets에 포함 권장 |
|-------|---------------------|
| `school_institution` | `ORGANIZATION` |
| `individual` | `INDIVIDUAL` |
| `volunteer` | **봉사 타겟 enum** (BE 기존 명명에 맞춤 — 예: `VOLUNTEER`. 없으면 OpenAPI·응답에 문서화) |
| `teacher_instructor` | 강사 타겟이 별도면 포함, 없으면 instructor LNB만 types로 제어 |

`170308` 최소 기대 예:

```json
"allowedApplicationTargets": ["INDIVIDUAL", "VOLUNTEER"]
```

(실제 enum 문자열은 BE SSOT에 맞출 것. **핵심은 volunteer가 types에 있으면 타겟·LNB 모두 활성.**)

### A3.4 reason

유형에 없어 끈 경우에만 정책 reason.  
유형에 **있는데** 끄면 reason `"현재 프로그램 정책상…"` 은 부적절 — **버그**.

---

## A4. FE 영향

| 항목 | 내용 |
|------|------|
| FE 수정 | **불필요** (navigation `enabled` 소비만) |
| 수정 후 기대 UI | 공통정보에 봉사자 있으면 LNB 「봉사자 신청 목록」 노출 |
| 회귀 | types에 봉사 없는 프로그램은 계속 숨김 |

---

## A5. 검수 체크리스트

- [ ] `170308`: 상세 types에 `volunteer` → navigation `VOLUNTEER_APPLICATIONS.enabled === true`
- [ ] `170308`: `allowedApplicationTargets`에 봉사 타겟 포함
- [ ] `170308`: types에 강사 없음 → `INSTRUCTOR_APPLICATIONS.enabled === false` (또는 제품 명시)
- [ ] `166422`(또는 기관+강사+봉사 시드): 봉사 LNB on
- [ ] types에 `volunteer` **없는** 프로그램: 봉사 LNB 계속 off
- [ ] 공통정보에서 참여자 유형에 봉사 추가 PATCH 후 navigation 재조회 시 LNB 반영 (캐시/재계산)
- [ ] CMS 상세 새로고침 후 「봉사자 신청」메뉴 노출·진입 가능

---

## A6. 참고 (FE 키 별칭 — 본 이슈 P0 아님)

FE `LNB_KEY_ALIASES`는 `volunteer_applications` / `instructor_applications` 등은 매핑하나,  
`organization_applications` → `institution_applications` 별칭이 없어 **기관 신청 LNB가 navigation disable을 무시할 수 있음**.  
봉사 이슈와 별개. 기관 disable까지 맞출 때 FE 별칭 또는 BE 키를 `INSTITUTION_APPLICATIONS` 등으로 맞추면 됨.

---

**Last updated:** 2026-09-15
