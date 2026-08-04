# 강사 권한 박탈 · 회원 API — 백엔드 수정 요청 (2026-07-29)

| 항목 | 값 |
|------|-----|
| **우선순위** | P0 |
| **도메인** | `members` / instructors |
| **출처** | 수동 QA · `e2e-error-log-store.json` (2026-07-29) |

---

## 1. 목록에 권한 박탈 상태 미하달 (P0)

**증상:** `POST /api/admin/instructors/{memberId}/revoke` 성공 후 전체 회원 목록 회원 유형이 잠시 `강사(권한박탈)`이다가 **새로고침 시 다시 `강사`**.

**원인:** 목록 item에 `instructorStatus=REVOKED`(또는 `revokedAt`)가 없음.

**요청**

| | |
|---|---|
| 목록 item | **`instructorStatus: "REVOKED"`** (권장) 또는 `revokedAt` non-null |
| 강사 목록 | 박탈 회원 **제외** |
| 상세 | `instructorProfile.status=REVOKED` 및/또는 `revokedAt` 정합 |
| OpenAPI | 목록 item · enum 문서화 |

**기대 UI:** 전체 목록 → `강사(권한박탈)` · 강사 목록 → 비노출.

---

## 2. E2E 에러 로그 (2026-07-29, `/users/list`)

### 2.1 `POST …/evaluation-grade` → `DATABASE_ERROR` (P0)

| | |
|---|---|
| Path | `POST /api/admin/instructors/166094/evaluation-grade` |
| HTTP | 500 |
| Body | `{"grade":"A","reason":"Q1~Q4=…, total=100, grade=A"}` |
| Message | `database operation failed` |
| traceId 예 | `d6ea2714c202459f8babad82fcc7618b` (동일 요청 다수 재현) |

### 2.2 `GET /api/admin/users` → HTTP 500 (P0)

| | |
|---|---|
| 시각 | 2026-07-29T07:42:53.989Z |
| route | `kind=all` + 강사 상세 열린 상태 |
| body | 비어 있음 |

### 2.3 `GET …/school` → profile not found (P1)

| | |
|---|---|
| Path | `GET /api/admin/users/166093/school` |
| HTTP | 401 · `INVALID_CREDENTIALS` |
| Message | `School member profile not found.` |
| traceId | `b8dc01919ba343d8a3096edfd1c4eb57` |
| 기대 | 없음 → **404** (not-found), 401 아님 |

### 2.4 `POST …/pre-register/school` → email 필수 (P1)

| | |
|---|---|
| Path | `POST /api/admin/users/pre-register/school` |
| HTTP | 400 · `VALIDATION_FAILED` · field `email` |
| Message | `email 공백일 수 없습니다` |
| traceId | `eb130b387b1246109c6a4943b98465b0` |
| 기대 | 학교 사전등록 **email optional** ([members-pre-register-handover-2026-07-28.md](./members-pre-register-handover-2026-07-28.md)) |

---

**Last updated:** 2026-07-29
