# Cursor prompt — Platform Gemini Portal 노출 (`featuredOnHome` · `programType` · 탭)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** (프론트 `jakorea` 에서 이 버그를 고치지 마라) |
| 작업 위치 | 백엔드 프로젝트에서 이 프롬프트를 열어 구현·테스트·커밋한다 |
| 주 API | `GET /api/portal/programs` · `GET /api/portal/programs/{programId}` |
| 관련 Admin | Gemini 모집 `GEMINI_TRAINING` create/PATCH · 홈 노출 플래그(`featuredOnHome` / `homeDisplayOrder`) |
| 재현 ID (로컬) | `185002` · `185003` · `185004` · `186025` |
| 프로그램 유형 | `GEMINI_TRAINING` (등록 SSOT). Portal 목록/상세 `programType` 표기 SSOT는 아래에서 확정 |
| 우선순위 | **P1** (목록·홈·상세 케이스 노출) |
| 작성일 | 2026-09-30 |
| 상태 | **BE 완료 · FE 반영 (2026-09-30).** Portal SSOT=`GEMINI_TRAINING`. 매퍼·preview·selfcheck 반영 |
| FE handoff | `JABACK/docs/frontend/gemini-portal-platform-visibility-frontend-handoff-2026-09-30.md` |
| FE 계약 | `apps/platform/docs/api/public-program.md` · `apps/platform/docs/api/programs-portal-tab-category-backend-cursor-prompt-2026-09-29.md` |
| 관련 기존 prompt | `apps/cms/docs/api/portal-platform-programs-backend-cursor-prompt-2026-09-20.md` (§3 홈 8건) |

**이 문서는 백엔드 Cursor/에이전트용이다. Platform·CMS FE를 이 작업으로 고치지 마라.**

---

## 한줄

Platform 홈·참여하기에서 Gemini가 “안 보인다 / 강사면 안 보인다”로 보고된다.  
원인은 FE 역할 필터가 아니라 **(1) 홈 `featuredOnHome`에 Gemini가 없음**, **(2) Portal `programType`이 Platform 매퍼 SSOT(`GEMINI`)와 불일치(`GEMINI_TRAINING`)**, **(3) 강사 탭에 Gemini가 없음(기관 모집만이면 정상 — 강사 모집이 있으면 `INSTRUCTOR` 누락 버그)**.  
공개 목록은 **로그인·강사 권한과 무관**해야 한다.

---

## 현재 관측 (로컬 `localhost:8080`, 2026-09-30)

로그인 없이 측정.

| 호출 | totalElements | Gemini |
|------|---------------|--------|
| `GET /api/portal/programs?page=0&size=50` | 45 | `185002` `185003` `185004` `186025` (`programType=GEMINI_TRAINING`) |
| `?portalTab=ORGANIZATION` | 33 | 위 4건 포함. `portalCategories`에 `ORGANIZATION` (일부 + `YOUTH_YOUNG`) |
| `?portalTab=INSTRUCTOR` | 11 | **0건** |
| `?featuredOnHome=true&page=0&size=8` | 7 | **0건** |

예시 행:

```json
{
  "programId": 185002,
  "programType": "GEMINI_TRAINING",
  "portalCategories": ["ORGANIZATION"],
  "title": "제미나이 찾아가는 연수 모집 예정 ( 수정)",
  "recruitmentStatus": "UPCOMING",
  "featuredOnHome": null
}
```

홈 7건은 GENERAL / TRAINED_TEACHER 등만 포함. Gemini `featuredOnHome=true` 행이 없다.

---

## Platform FE 소비 (참고 — 바꾸지 마라)

| 화면 | 호출 | 비고 |
|------|------|------|
| 홈 캐러셀 | `GET /api/portal/programs?featuredOnHome=true&page=0&size=8` | `skipAuth`. 빈 배열이면 섹션 숨김. mock 금지 |
| `/programs` | 같은 path + `portalTab` 등 | 탭: `YOUTH_YOUNG` / `ORGANIZATION` / `INSTRUCTOR`. 기본 탭 `전체`(portalTab 생략) |
| 상세 | `GET /api/portal/programs/{programId}` | `skipAuth` |

FE는 회원 역할·강사 권한으로 목록을 거르지 않는다. Authorization도 붙이지 않는다(`skipAuth` → Bearer 제거).  
`withCredentials`는 켜져 있으므로 **쿠키 세션이 있으면 BE가 개인화하면 안 된다.** 공개 목록은 익명과 동일해야 한다.

상세 케이스 매퍼(Platform):

- `programType === 'GEMINI' \|\| 'VISITING_TRAINING'` → `detailCase: 'gemini'`
- **`GEMINI_TRAINING`은 아직 case에 없음** → 기관 탭 분류는 `portalCategories`로 되나, 상세/신청 케이스가 Gemini가 아닐 수 있다.

CMS 미리보기는 Portal용으로 `programType: 'GEMINI'`를 강제한다 (`platform-preview-payload.ts`). 등록 Admin은 `GEMINI_TRAINING`.

---

## Goal

1. **공개 목록·홈·상세가 로그인/강사 권한에 따라 달라지지 않는다.**
2. **홈에 올릴 Gemini는 `featuredOnHome=true`(및 필요 시 `homeDisplayOrder`)로 내려온다.**
3. **Portal `programType` SSOT를 확정**하고, Platform이 Gemini 상세 케이스를 인식할 수 있게 한다.
4. **`portalCategories`는 실제 모집만** — 기관 모집만 있으면 `ORGANIZATION`만. 강사 모집이 있으면 `INSTRUCTOR`도.

---

## 1. 공개 API는 역할 비의존 (회귀 금지)

`GET /api/portal/programs` · `GET /api/portal/programs/{id}` · `featuredOnHome=true`:

- 무토큰 / 일반 회원 Bearer / 강사 권한 Bearer / (있다면) 세션 쿠키  
  → **같은 `programId` 집합** (필터 쿼리가 같을 때).
- 강사 로그인만으로 Gemini 행을 빼지 마라.
- 목록을 `GET /api/portal/me/...` 로 바꾸지 마라.

검증:

```bash
# A 익명
curl -s 'http://localhost:8080/api/portal/programs?page=0&size=50' | jq '.data.totalElements, [.data.items[] | select(.programType|test("GEMINI";"i")) | .programId]'

# B 강사 access token (있으면)
curl -s -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  'http://localhost:8080/api/portal/programs?page=0&size=50' | jq '.data.totalElements, [.data.items[] | select(.programType|test("GEMINI";"i")) | .programId]'
```

A·B의 Gemini `programId` 집합이 같아야 한다.

---

## 2. 홈 노출 — `featuredOnHome`

옵션 A 유지: `GET /api/portal/programs?featuredOnHome=true&size=8`.

할 일:

1. `GEMINI_TRAINING` 프로그램도 GENERAL과 동일하게 `featuredOnHome` / `homeDisplayOrder`를 저장·조회할 수 있게 하라.  
   (Admin PATCH/create 또는 시드. CMS UI가 아직 없으면 **로컬 시드라도** true인 Gemini ≥1건을 넣어 FE 홈 검증이 되게 하라.)
2. `featuredOnHome=true` 응답에 Gemini가 포함되면 `programId`·`title`·`programType`·`portalCategories`·`recruitmentStatus`·`thumbnailFileObjectId`가 다른 유형과 같은 목록 스키마다.
3. true인 행이 0이면 빈 배열. mock/LATEST로 채우지 마라.
4. 운영이 홈에 안 올리는 Gemini는 `false`/`null` 유지 — 강제 노출 금지. **시드·플래그 경로만** 열어라.

Done 예:

```bash
curl -s 'http://localhost:8080/api/portal/programs?featuredOnHome=true&page=0&size=8' \
  | jq '[.data.items[] | {programId, programType, title, featuredOnHome, homeDisplayOrder}]'
# → programType 이 GEMINI* 인 행 ≥1 (시드 기준으로)
```

---

## 3. `programType` SSOT (`GEMINI` vs `GEMINI_TRAINING`)

現状:

| 층 | 값 |
|----|-----|
| Admin create/목록 (CMS FE) | `GEMINI_TRAINING` |
| Portal 목록 런타임 | `GEMINI_TRAINING` |
| Platform 상세 매퍼 / CMS Portal 미리보기 | `GEMINI` |

둘 중 **하나를 Portal 목록·상세의 공개 SSOT로 확정**하라. 권장:

| 선택 | 조치 |
|------|------|
| **A (권장)** Portal도 `GEMINI_TRAINING` 유지 | FE에 handoff: Platform `mapDetailCase` / `mapCategory`에 `GEMINI_TRAINING` 추가하라고 한 줄. **이 작업에서는 FE 고치지 말고 handoff만.** |
| **B** Portal만 `GEMINI`로 alias | Admin 저장은 `GEMINI_TRAINING` 유지해도 됨. Portal projection만 `GEMINI`. OpenAPI·시드 문서에 명시. |

금지:

- OpenAPI에 둘 다 두고 문서 없이 섞기.
- GENERAL / UJAT / TRAINED_TEACHER / COMPANY_SCHOOL enum 회귀.

완료 시 답변에 **확정 값 한 줄**을 적어라:  
`Portal programType SSOT for 찾아가는 연수 = ________`

---

## 4. `portalCategories` · 강사 탭

기존 계약 (`programs-portal-tab-category-backend-cursor-prompt-2026-09-29.md`):

| portalCategories | 의미 |
|------------------|------|
| `ORGANIZATION` | 기관 모집 (Gemini 기관·교육받은 교사·UJAT 기관·1사1교 기관 포함) |
| `INSTRUCTOR` | **강사(`INSTRUCTOR`) 모집이 실제로 있을 때만** |
| `YOUTH_YOUNG` | 개인/봉사 모집이 있을 때만 |

Gemini:

- **기관 모집만** 있으면 `["ORGANIZATION"]` — 강사 탭 0건은 **정상**. Platform 「강사 프로그램」탭에 안 나오는 것이 맞다.
- **강사 모집 공고/모집 row가 있으면** `portalCategories`에 `INSTRUCTOR`를 넣어라. 없으면 넣지 마라.
- 기관 모집만 있는데 `INSTRUCTOR`를 넣거나, 강사 모집이 있는데 `ORGANIZATION`만 두는 것은 버그다.

`185002`는 문서상 기관 탭·`UPCOMING` 유지 대상이다. 신청 0건이어도 목록에서 빼지 마라.

---

## Out of scope / 금지

- Platform·CMS 프론트 수정 (handoff 노트만 허용).
- 목록 path·`portalTab` enum 변경.
- 공개 목록을 로그인 전용으로 바꾸기.
- Homepage Admin(`:8081`) `education.programs`를 홈 SSOT로 복구.
- Gemini PATCH Instant / top-level create 필드 이슈와 한 PR에 섞지 마라 (별도 2026-09-30 prompt 있음).
- TRUNCATE. prod Flyway에 임의 운영 카피 금지. 시드는 local/dev만.

---

## Done when

- [ ] 동일 쿼리에서 익명 vs 강사 토큰의 Gemini `programId` 집합이 같다
- [ ] `featuredOnHome=true`로 Gemini ≥1건이 시드/플래그로 내려오거나, “의도적 0건 + Admin 플래그 경로 존재”를 handoff에 명시
- [ ] Portal `programType` SSOT 한 줄 확정 (`GEMINI` 또는 `GEMINI_TRAINING`)
- [ ] Gemini `portalCategories`가 실제 모집과 일치 (기관만 → ORGANIZATION만; 강사 모집 있으면 INSTRUCTOR)
- [ ] `185002` 기관 탭·목록 유지
- [ ] GENERAL / UJAT / TRAINED_TEACHER 탭·홈 회귀 없음
- [ ] 작업 후 아래 템플릿으로 회신

```
Changed:
- …

Portal programType SSOT: GEMINI | GEMINI_TRAINING

Verify:
curl -s 'http://localhost:8080/api/portal/programs?featuredOnHome=true&page=0&size=8' | jq '[.data.items[] | {programId, programType, title}]'
curl -s 'http://localhost:8080/api/portal/programs?portalTab=ORGANIZATION&page=0&size=50' | jq '[.data.items[] | select(.programType|test("GEMINI";"i")) | {programId, portalCategories, recruitmentStatus}]'
curl -s 'http://localhost:8080/api/portal/programs?portalTab=INSTRUCTOR&page=0&size=50' | jq '[.data.items[] | select(.programType|test("GEMINI";"i")) | {programId, portalCategories}]'
# 익명 vs 강사 토큰 totalElements + Gemini ids 동일 여부: yes/no

FE follow-up needed: yes/no
- (yes면) mapDetailCase에 GEMINI_TRAINING 추가 / featured CMS UI 등
```

---

## FE follow-up (BE 완료 후, 별도 PR)

BE가 Portal SSOT를 `GEMINI_TRAINING`으로 확정하면 Platform만:

- `apps/platform/src/features/program/api/mappers.ts` — `mapDetailCase` / `mapCategory`에 `GEMINI_TRAINING` 추가
- selfcheck 갱신

`featuredOnHome` Admin UI가 없으면 CMS Gemini 모집 폼에 홈 노출 토글은 **별도 FE 작업**.
