# Cursor prompt — 마이페이지 LNB 역할 플래그·강사 정산 목록 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약과 재현만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/mypage-lnb-role-settlement-backend-cursor-prompt-2026-10-06.md`

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 **해당 역할의 회원 Bearer**.  
관리자 토큰으로 회원 API를 통과시키지 마라.

노션 LNB (사용자 & 홈페이지 기능정의서):

| 역할 | LNB |
|------|-----|
| 일반 | 나의 홈 · 교육현황 · 봉사현황 · 문의내역 |
| 교사 | 동일 (강의/정산 없음) |
| 강사 | 나의 홈 · 강의 현황 · 정산 현황 · (구분) · 교육현황 · 봉사현황 · 문의내역 |

Platform FE는 이미 역할별 LNB를 분기한다. path 이름을 바꾸지 마라.

| Method | Path | FE 사용 |
|--------|------|---------|
| GET | `/api/portal/me` | 로그인 직후 세션·역할 힌트 |
| GET | `/api/portal/me/profile` | LNB 역할 SSOT (`teacher`, `instructor`) |
| GET | `/api/portal/me/program-applications?applicationType=INSTRUCTOR` | 강의 현황 |
| GET | `/api/portal/me/settlement-applications` | 강사 LNB 「정산 현황」목록 후보 |
| GET | `/api/portal/me/instructor-role-requests/current` | 강사 권한 신청 상태 |

---

## FE 적용 현황 (참고 — 백엔드에서 FE를 고치지 말 것)

2026-10-06 Platform 확인:

- `getMypageLnbItems(profile)` 로 일반/교사/강사 LNB 분기 **적용됨**
- 강사 라벨 `강의 현황` / `정산 현황` **적용됨**
- 역할 판별: `profile.instructor` + `profile.teacher` / `me.teacher` / `me.memberType=TEACHER`
- 강사 LNB 「정산 현황」은 **노출만** (`enabled: false`). `/mypage/settlement` 페이지·navigate는 FE 미구현
- `HomepageMeResponse`에 `instructor`가 없어, LNB는 **profile 응답에 의존**

---

## Goal

1. `GET /api/portal/me` 에도 `instructor: boolean`을 내려, profile과 **동일 의미**로 LNB 역할을 판별할 수 있게 하라.
2. `instructor=true`가 되는 시점을 OpenAPI에 명시하라 (승인된 강사만인지).
3. 강사 Bearer로 `GET /api/portal/me/settlement-applications` 목록이 **200 + 문서화된 스키마**로 내려오게 하라. FE가 정산 LNB 페이지를 붙일 때 path를 새로 만들지 않도록 한다.

---

## Out of scope / 금지

- Platform·CMS 프론트 수정.
- path 이름 변경·신규 path 남발. 기존 `settlement-applications`로 충분하면 그걸 완성하라.
- `memberType`에 `INSTRUCTOR` enum을 새로 만들어 기존 `GENERAL`/`TEACHER` + `instructor` 플래그 모델을 깨지 마라.
- 일반/교사 LNB에 강의·정산이 보이도록 `instructor`를 임의 true로 두지 마라.
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.

---

## 1. `GET /api/portal/me` 에 `instructor` 추가

현재 OpenAPI `HomepageMeResponse`:

- 있음: `memberType`, `teacher`
- 없음: `instructor`

`PortalProfileResponse`에는 `instructor: boolean`이 있다.

**해야 할 일:**

- `HomepageMeResponse.instructor` (`boolean`, required 권장) 추가
- 값은 `GET /api/portal/me/profile`의 `instructor`와 **항상 동일**
- OpenAPI description 예:

  > 강사회원 여부. 승인된 강사 권한이 있을 때만 true. 강사 권한 신청 중(미승인)은 false.

수락 기준:

| 계정 | `me.teacher` | `me.instructor` | `profile.teacher` | `profile.instructor` |
|------|--------------|-----------------|-------------------|----------------------|
| 일반 | false | false | false | false |
| 교사(비전사) | true | false | true | false |
| 강사만 | false | true | false | true |
| 교사+강사 | true | true | true | true |

같은 Bearer로 `me`와 `profile`을 연속 호출했을 때 teacher/instructor가 어긋나면 실패다.

---

## 2. `instructor=true` 시점 문서화

FE는 `instructor=true`이면 LNB에 강의·정산을 켠다.

OpenAPI `PortalProfileResponse.instructor` / `HomepageMeResponse.instructor` description에 아래를 **명시**하라.

- `true`: 강사 권한이 **승인·활성**인 회원
- `false`: 미신청, 신청 중(`SUBMITTED` 등), 반려, 철회, 권한 없음

`GET /api/portal/me/instructor-role-requests/current` 가 `APPROVED`/`COMPLETED`가 아닌데 `instructor=true`이면 버그다.  
반대로 승인·활성인데 `instructor=false`여도 버그다.

---

## 3. 강사 「정산 현황」목록 — 기존 path 계약 고정

노션 강사 LNB에 **정산 현황**이 있다. FE는 페이지를 아직 안 붙였고, 목록 SoT 후보는 이미 있다.

```http
GET /api/portal/me/settlement-applications
```

OpenAPI상 구현 완료로 표기되어 있으나, 로컬 스펙의 200 응답 schema가 비어 있다.

**해야 할 일:**

1. 강사 Bearer로 위 GET이 **200** (0건이면 빈 목록, 403이 아님).
2. 응답을 페이지 또는 배열로 문서화하고, 항목에 최소 아래 필드를 포함·스키마 반영:

   - `applicationId`
   - `assignmentId` (nullable 가능)
   - `programId`
   - `status`
   - `grossAmount` / `withholdingTaxAmount` / `netPaymentAmount`
   - `submittedAt` / `createdAt`
   - `availableActions` (있으면)

3. 일반·교사(비전사) Bearer로 호출 시:
   - **200 빈 목록** 권장 (또는 정책상 403이면 OpenAPI에 명시).  
   - FE가 LNB를 숨기므로 빈 목록이면 충분하다. path를 나누지 마라.

4. `page`/`size`를 받으면 0-base page를 문서화. 안 받으면 “전체 배열”이라고 description에 써라.

수락 기준:

```bash
# 강사
curl -sS -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  'http://localhost:8080/api/portal/me/settlement-applications'

# 일반 (빈 목록 또는 문서화된 403)
curl -sS -H "Authorization: Bearer $GENERAL_TOKEN" \
  'http://localhost:8080/api/portal/me/settlement-applications'
```

- `v3/api-docs`에 200 응답 schema가 비어 있지 않다.
- 강사 계정에서 본인 정산만 보인다 (타 회원 건 없음).

---

## 4. (선택) 강의 현황 applicationType 가드 문서화

FE LNB는 일반/교사에게 강의 메뉴를 숨긴다. URL 직접 입력은 FE 가드가 없다.

정책이 있으면 OpenAPI에만 적어라 (강제 구현 여부는 백엔드 정책):

- `applicationType=INSTRUCTOR` + 비강사 → **200 빈 목록** 또는 **403**
- 어느 쪽이든 description에 한 줄로 고정

새 path를 만들지 마라.

---

## 검증 체크리스트

- [ ] `GET /api/portal/me` JSON에 `instructor` boolean
- [ ] 같은 Bearer로 me/profile의 `teacher`·`instructor` 일치 (4역할 표)
- [ ] OpenAPI에 `instructor=true` 시점(승인·활성) 명시
- [ ] 강사 `GET /api/portal/me/settlement-applications` 200 + schema
- [ ] 일반/교사 호출 시 빈 목록 또는 문서화된 403
- [ ] path 신규 없이 기존 URL 유지

---

## FE 후속 (백엔드 범위 밖)

BE §1·§3 완료 후 Platform에서:

1. `parseHomepageMeResponse`에 `instructor` 파싱
2. `mapPortalMemberToPlatformProfile`에서 `me.instructor` 폴백
3. `/mypage/settlement` 페이지 + LNB `enabled: true` + `navigateMypageLnb('settlement')`

이 문서 작업 중 FE를 수정하지 마라.

---

**Last updated:** 2026-10-06
