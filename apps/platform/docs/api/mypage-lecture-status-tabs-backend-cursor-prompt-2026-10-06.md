# Cursor prompt — 회원포탈 강의현황 탭·statusGroup (JABACK)

> **Status (2026-10-06):** BE 옵션 A 반영 완료.  
> FE handoff: `JABACK/docs/frontend/mypage-lecture-status-tabs-frontend-handoff-2026-10-06.md`  
> Platform FE는 종료 탭을 `statusGroup=COMPLETED` 단일 호출로 맞춤. 아래는 이력용.

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약과 재현만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/mypage-lecture-status-tabs-backend-cursor-prompt-2026-10-06.md`

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 **강사 신청을 소유한 회원 Bearer**.  
관리자 토큰으로 회원 API를 통과시키지 마라.

Platform FE는 이미 아래 path를 호출한다. **path·required 이름을 새로 만들거나 바꾸지 마라.**

| Method | Path | FE 사용 |
|--------|------|---------|
| GET | `/api/portal/me/program-applications` | 강의현황 목록. `applicationType=INSTRUCTOR` + 탭별 `statusGroup` + `page`/`size` |
| GET | `/api/portal/me/program-applications/{applicationType}/{applicationId}` | 강의현황 상세 |
| POST | `/api/portal/me/program-applications/{applicationType}/{applicationId}/cancel` | 신청 취소 |

화면: Platform `http://localhost:5173/mypage/lectures`  
탭: `전체` / `신청한 프로그램` / `진행중인 프로그램` / `종료된 프로그램`

---

## Goal

1. `applicationType=INSTRUCTOR` 목록이 탭별 `statusGroup`과 **화면 탭 분류가 일치**하게 필터된다.
2. OpenAPI에 `statusGroup` **허용 값과 displayStatus 매핑**이 문서화된다.
3. `종료된 프로그램` 탭을 **한 번의 목록 호출 + 서버 페이지네이션**으로 처리한다(지금은 FE가 COMPLETED·CANCELLED를 합친다).
4. 목록·상세 모두 `displayStatus`가 내려오고, 같은 신청이면 값이 같다.

---

## FE가 이미 쓰는 탭 ↔ statusGroup 계약

| UI 탭 | query `tab` | query `statusGroup` | 포함해야 하는 `displayStatus` |
|-------|-------------|---------------------|--------------------------------|
| 전체 | `all` | **생략** | 전부 |
| 신청한 프로그램 | `applied` | `WAITING` | `결과 대기`, `서류 합격` (`작성 중` 포함 여부 §2) |
| 진행중인 프로그램 | `in_progress` | `IN_PROGRESS` | `진행 중` |
| 종료된 프로그램 | `completed` | `COMPLETED` **또는** 합집합(§1) | `진행 완료`, `활동 포기`, `신청 반려`, `신청 취소` |

`displayStatus` 허용 라벨(기존 계약 유지 — 바꾸지 마라):

`결과 대기`, `서류 합격`, `진행 중`, `진행 완료`, `활동 포기`, `신청 반려`, `작성 중`, `신청 취소`

페이지네이션: `page` **0-base**, `size=10`(FE 목록 페이지 크기).  
응답: `items`, `page`, `size`, `totalElements`, `totalPages`.

예시 호출:

```http
GET /api/portal/me/program-applications?applicationType=INSTRUCTOR&statusGroup=WAITING&page=0&size=10
GET /api/portal/me/program-applications?applicationType=INSTRUCTOR&statusGroup=IN_PROGRESS&page=0&size=10
GET /api/portal/me/program-applications?applicationType=INSTRUCTOR&page=0&size=10
```

---

## Out of scope / 금지

- Platform·CMS 프론트 수정.
- path 추가·이름 변경·`applicationType` enum에서 `INSTRUCTOR` 제거.
- `displayStatus` 한글 라벨 변경.
- Gemini 강사 모집 전용 API를 새로 만들지 마라(별도 기획).
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.

---

## 1. 종료 탭을 한 번의 statusGroup으로

**문제:** FE UI 「종료된 프로그램」은 `진행 완료` + `활동 포기` + `신청 반려` + `신청 취소`를 한 탭에 둔다.  
현재 FE 타입은 `statusGroup`을 `WAITING | IN_PROGRESS | COMPLETED | CANCELLED`로 두고, 종료 탭에서 `COMPLETED`와 `CANCELLED`를 **두 번 호출해 합친 뒤** 클라이언트 페이지를 자른다. 100건 초과·정확한 `totalElements`가 깨진다.

**해야 할 일 (둘 중 하나. path는 유지):**

### 옵션 A (권장) — 탭 의미의 statusGroup 하나

`statusGroup=COMPLETED`가 위 네 `displayStatus`를 **모두** 포함하게 한다.  
`CANCELLED`는 내부용으로 두거나, OpenAPI description에 “종료 탭은 COMPLETED만 써라”고 명시한다.

### 옵션 B — 다중 값

`statusGroup=COMPLETED,CANCELLED`(또는 동일 의미의 반복 쿼리)를 공식 지원하고, **서버에서 합쳐 페이지네이션**한다.  
클라이언트 merge 금지.

수락 기준:

- 종료 탭에 해당하는 건만 나오고, `totalElements`/`totalPages`가 합집합 기준이다.
- FE는 `statusGroup` **한 값**(A) 또는 **공식 다중 값 한 요청**(B)만으로 `page`/`size`를 돌릴 수 있다.

---

## 2. statusGroup ↔ displayStatus 매핑을 OpenAPI에 고정

`GET /api/portal/me/program-applications` 의 `statusGroup` 파라미터 description에 **허용 enum과 포함 displayStatus**를 적어라.  
지금 Swagger는 `type: string`만 있고 매핑이 없다.

권장 표(옵션 A 기준):

| statusGroup | displayStatus |
|-------------|---------------|
| `WAITING` | `결과 대기`, `서류 합격` (+ 정책상 `작성 중`을 신청 탭에 넣을지 명시) |
| `IN_PROGRESS` | `진행 중` |
| `COMPLETED` | `진행 완료`, `활동 포기`, `신청 반려`, `신청 취소` |
| `CANCELLED` | (옵션 A면 deprecated 또는 COMPLETED와 동일 설명) |

`작성 중`을 강의현황에 노출할지 정책이 없으면 **WAITING에 포함하지 말고** description에 “목록 비노출 또는 WAITING 제외”라고 적어라. FE는 현재 작성 중을 결과 대기로 매핑한다.

---

## 3. INSTRUCTOR 목록·상세 displayStatus 일관성

목록 `ApplicationListItemResponse.displayStatus`와  
상세 `GET .../INSTRUCTOR/{applicationId}` 의 `displayStatus`가 **같은 신청이면 동일**해야 한다.

상세에 `displayStatus`가 비어 있으면 FE는 `applicationStatus`로 추정한다(`FINAL_SELECTED` → 진행 중 등).  
추정에만 의존하지 말고 **상세에도 displayStatus를 채워라.**

수락 기준:

- 강사 Bearer로 목록 1페이지를 받은 뒤, 각 `applicationId` 상세를 조회했을 때 `displayStatus`가 목록과 같다.
- `applicationType=INSTRUCTOR`만 필터했을 때 `INDIVIDUAL`/`ORGANIZATION`/`VOLUNTEER` 행이 섞이지 않는다.

---

## 4. 목록 카드 기간 필드 채움

목록 스키마에 `recruitmentStartAt` / `recruitmentEndAt` / `educationStartAt` / `educationEndAt`이 이미 있다.  
FE는 이 네 필드로 모집·운영 기간을 표시한다.

**요청:** `applicationType=INSTRUCTOR` 목록에서 값이 있으면 채워라. 모르면 null.  
빈 문자열·가짜 날짜로 채우지 마라. path를 새로 만들지 마라.

---

## 5. 잘못된 statusGroup / applicationType

| 입력 | 기대 |
|------|------|
| `statusGroup=FOO` | **400** (unknown). 조용히 전체 반환 금지 |
| `applicationType=INSTRUCTOR` 이고 해당 회원에 강사 신청 0건 | **200** 빈 페이지 (`items: []`, `totalElements: 0`) |
| 인증 없음 | **401** |

---

## 검증 (로컬)

강사 신청이 있는 회원 Bearer로:

```bash
# 전체
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8080/api/portal/me/program-applications?applicationType=INSTRUCTOR&page=0&size=10'

# 신청
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8080/api/portal/me/program-applications?applicationType=INSTRUCTOR&statusGroup=WAITING&page=0&size=10'

# 진행
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8080/api/portal/me/program-applications?applicationType=INSTRUCTOR&statusGroup=IN_PROGRESS&page=0&size=10'

# 종료 (옵션 A면 COMPLETED만)
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8080/api/portal/me/program-applications?applicationType=INSTRUCTOR&statusGroup=COMPLETED&page=0&size=10'
```

체크리스트:

- [ ] 각 탭 응답의 `displayStatus`가 위 표와 일치한다.
- [ ] 전체 `totalElements` ≥ 각 탭 `totalElements` 합이 아니어도 되지만, 탭 간 **중복 applicationId가 없다**(한 신청이 두 탭에 동시에 나오지 않음).
- [ ] OpenAPI `statusGroup` description에 enum·매핑이 있다.
- [ ] 상세 `displayStatus`가 목록과 같다.
- [ ] `v3/api-docs`에 위 내용이 반영된다.

---

## FE 동작 (옵션 A 반영 후)

Platform `apps/platform` 강의현황은 remote 설정 시:

1. `applicationType=INSTRUCTOR`
2. `all` → statusGroup 생략 · `applied` → `WAITING` · `in_progress` → `IN_PROGRESS` · `completed` → `COMPLETED`
3. 모든 탭 서버 `page`(0-base)/`size=10`
4. `CANCELLED` merge 없음

---

**Last updated:** 2026-10-06
