# CMS 회원 관리 — BE seed → FE remote 연동 핸드오ff (2026-08-28)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-28 |
| **출처** | JABACK local seed handoff (3 contributors ready) |
| **BE 문서** | `docs/frontend/member-management-backend-seed-handoff-2026-08-28.md` |
| **FE catalog** | `member-management-seed-catalog.ts` · `member-detail-history-seed-catalog.ts` |
| **FE spec mirror** | `member-management-seed-v1.spec.json` · `member-detail-history-seed-v1.spec.json` |

---

## 1. FE catalog ↔ handoff ID 대조

**결과: ✅ 일치** (vitest `member-seed-catalog-parity.test.ts`)

| 영역 | FE catalog | handoff §3 | 상태 |
|------|------------|------------|------|
| Directory MD-INDIVIDUAL~REVOKED | 171001–171005 | §3.1 | ✅ |
| School org | 171501–171503 | §3.2 | ✅ |
| Permission IR/AA | 172001–172231 | §3.3–3.4 | ✅ |
| Detail history MH-* | 173001–175013 | §3.5 | ✅ |
| FE mock ↔ directory id | `MOCK_TO_BE_DIRECTORY_MEMBER_ID` | §4 | ✅ |
| FE mock ↔ permission id | `MOCK_TO_BE_PERMISSION_MEMBER_ID` | §4 | ✅ |

> **로그인 admin(162001)** 과 **디렉터리 showcase admin(171601)** 은 FE catalog·handoff 모두 별개 id로 문서화됨.

---

## 2. local BE smoke (§7) — 2026-08-28 재실행 (seed 적재 후)

```bash
pnpm --filter cms smoke:member-management-be
# 또는: node apps/cms/scripts/member-management-be-smoke.mjs --base=http://localhost:8080
```

**전제:** `SPRING_PROFILES_ACTIVE=local` + `JA_LOCAL_DEMO_ENABLED=true` + BE 3 contributor bootRun · `localhost:8080` UP.

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1–3 | Directory (members/all · schools · bulk-delete) | ✅ | 171001 · 171501 teachers=3 · delete blocked |
| 4–10 | Detail history | ✅ | applications / program-history / enrollment / program-roles / settlements |
| 11–15, 19 | Permission | ✅ | 172001∈ · 172007∉ · 172231∉ · roles |

**결과: ✅ 16/16 passed** (2026-08-28 재연동)

### BE 실계약 메모 (smoke 반영)

| 항목 | handoff 기대 | 실제 local BE (GAP fix 후) | FE smoke |
|------|--------------|---------------------------|----------|
| schools bulk-delete 171501 | HTTP **409** | **409** + `SCHOOL_HAS_BUSINESS_HISTORY` | ✅ 409 단정 |
| `users/171002/applications` | total **5** INDIVIDUAL `173011–015` | total **5** · ORGANIZATION 없음 | ✅ 엄격 단정 |
| schools 171501 teachers | 3 | `affiliatedTeacherCount=3` | ✅ |
| school enrollment 171501 | 5 (`174001–174005`) | 회원 API와 분리 · history API 유지 | ✅ |

> **2026-08-28 GAP-A/B:** BE applications UNION 제거 · bulk-delete 409 확정. FE smoke §7-3/§7-6 엄격 복원 → **16/16**.

---

## 3. FE id 분기 (171xxx vs 172xxx)

| 진입 경로 | API path param | memberId 출처 | 이력 API |
|-----------|----------------|---------------|----------|
| 회원 목록 → 상세 | `member-{171003}` | list `memberId` → registry | `GET /users/171003/applications` |
| 권한승인 → 강사 상세 | `instructor-role-request-{172001}` | detail `memberId=172101` | `GET /instructor-role-requests/172001` (이력 탭 없음) |
| 학교 목록 → 상세 | `organization-171501` | org id | `GET .../schools/171501/program-enrollment-history` |
| 관리자 목록 → 상세 | `admin-account-171601` | adminAccountId | `GET .../admin-accounts/171601/program-roles` |

**FE 구현:**
- `registerMemberIdMapping` — list/detail mapper가 API 응답 `memberId` 등록 (`map-member-list-item`, `map-instructor-role-request-detail-to-user`)
- `resolveMemberIdForApi(userId, { memberId })` — 상세 이력·정산은 **`displayUser.memberId` hint 우선** (`use-user-detail-applications`, `use-user-detail-controller`)
- 권한승인 상세에서 member directory 이력 API **호출하지 않음** (별도 화면·requestId SSOT)

**주의:** 동일 인물(정멘토)이라도 directory=171003 / permission=172101 — **경로별 API id 혼용 금지**.

---

## 4. FE remote 연동 체크리스트

| # | 작업 | 상태 |
|---|------|------|
| 1 | `.env.local` — `VITE_REAL_API_MODULES=...,members,instructorRoleRequests,adminApprovalRequests,adminPermissions` | ✅ example 반영 |
| 2 | Catalog ↔ spec JSON parity test | ✅ |
| 3 | Permission smoke (§7-11~15, 19) | ✅ local BE |
| 4 | Directory + detail history smoke (§7-1~10) | ✅ **16/16** (2026-08-28 seed 재적재 후) |
| 5 | UI: 강사 승인 list 서버 마스킹 (이중 마스킹 없음) | ✅ (기존 PR) |
| 6 | UI: memberProfile별 LNB 탭 (`memberTypeTabs` SSOT) | ✅ strategy |
| 7 | Mutation bulk/reset/resend `{ reason }` | ✅ |

---

## 5. BE GAP-A/B 재검증 (2026-08-28)

| GAP | BE 조치 | FE 결과 |
|-----|---------|---------|
| **A** 171002 ORGANIZATION 혼입 | applications에서 school enrollment UNION 제거 | ✅ total=5 · 173011–015 · INDIVIDUAL only |
| **B** bulk-delete 계약 | 단건 차단 → HTTP **409** | ✅ `SCHOOL_HAS_BUSINESS_HISTORY` |

`pnpm --filter cms smoke:member-management-be` → **16/16** (§7-3/§7-6 엄격 단정).

---

## 6. FE 실행 명령

```bash
# catalog parity (offline)
pnpm --filter cms test -- src/data/mock/member-seed-catalog-parity.test.ts

# BE smoke (local bootRun 필요)
pnpm --filter cms smoke:member-management-be

# remote UI 수동 smoke
pnpm --filter cms dev
# → 회원 목록 171001 상세 → 수강·봉사 5건
# → 권한승인 172001 상세 → structured profile
# → 학교 171501 상세 → 수강 이력 5건
```

**Last updated:** 2026-08-28
