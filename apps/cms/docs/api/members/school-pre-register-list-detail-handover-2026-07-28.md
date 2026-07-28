# Handover: CMS 학교(기관) 등록 · 목록 · 상세 — 주소·더미 필드

**대상:** 백엔드 (+ FE 참고)  
**앱:** CMS (관리자)  
**일시:** 2026-07-28  
**도메인:** `members` · 학교 pre-register / 학교 목록 / 학교 상세  

| Method | Path | 스키마 |
|--------|------|--------|
| `POST` | `/api/admin/…/pre-register/school` | `AdminPreRegisterSchoolRequest` |
| `GET` | `/api/admin/users` (`role=SCHOOL` 등) | 목록 row (`UserResponse` / list item) |
| `GET` | `/api/admin/users/{memberId}/school` | `SchoolMemberDetailResponse` |

**관련 FE 코드:**

- 등록: `apps/cms/src/pages/users/user-list-page.tsx` (`handleSchoolRegisterSubmit`)
- 매핑: `apps/cms/src/features/user/api/map-pre-register-request.ts`
- 목록: `apps/cms/src/features/user/api/map-member-list-item.ts` · `user-list.tsx` (기관 소재지)
- 상세: `map-member-detail-to-user.ts` · `institution-section.tsx` · `display.ts` (`addressLine`)

> 강사 등록 갭은 별도 문서: [instructor-pre-register-detail-handover-2026-07-28.md](./instructor-pre-register-detail-handover-2026-07-28.md)

---

## 1. 요약

1. **학교 등록** 시 폼에 없는 `email`을 FE가 `school-{ts}@institution.jakorea.local` 형태로 **임의 생성**해 보냄 → **입력하지 않은 값은 보내지 않도록** 계약·구현 정리 필요 (uuid 등 서버 생성 필수 값은 제외).
2. **학교 목록**에서 `address` / `addressDetail`이 **전부 null** → 목록에도 내려줘야 함 (상세에는 이미 있음).
3. **학교(기관) 회원 목록** 「기관 소재지」·**학교 상세** 「기관 소재지」는 `address` + (`addressDetail`이 null이 아닐 때만) 조합 표시.

---

## 2. 학교 등록 — 더미 email / 미입력 필드

### 현상

학교 등록 모달에는 **이메일 입력란이 없음**.  
OpenAPI `AdminPreRegisterSchoolRequest.email`이 **required**라서, FE가 임시로 아래를 넣어 왔음.

```ts
email: `school-${Date.now()}@institution.jakorea.local`
```

기관 계정은 보통 `loginEnabled: false` / pre-registered라 **로그인용 email이 불필요**할 수 있음.

### 요청 (BE)

- 학교(기관) pre-register에서 **`email`을 optional**로 변경 (또는 기관 등록 전용 계약으로 email 제외).
- OpenAPI `AdminPreRegisterSchoolRequest` 반영.
- 클라이언트가 넣지 않은 필드(`gender`, `birthDate`, 가짜 email 등)를 **서버가 채우지 않음**. 서버가 채워야 하는 값은 **uuid / memberId / createdAt** 등 식별·감사 필드만.

### FE 방침

- 폼에 없는 값은 **임의 문자열로 채우지 않음**.
- `email` optional 반영 후 codegen되면 email 미전송.
- (전환 전) required 제약으로 등록이 막히면 BE optional 배포를 선행.
- 로그인 계정 없는 기관이므로 **임시 비밀번호(`rawPassword`) 발급 대상 아님**. 개인·강사는 [admin-pre-register-temp-password-handover-2026-07-28.md](./admin-pre-register-temp-password-handover-2026-07-28.md).

---

## 3. 학교 목록 — `address` / `addressDetail` null

### 현상

- **상세** `SchoolMemberDetailResponse`에는 `address`, `addressDetail`이 내려와 표시 가능.
- **목록** 조회에서는 주소 필드가 **전부 null** (또는 미포함) → 「기관 소재지」가 `-`.

### 요청 (BE)

목록 row에 최소 다음을 포함해 주세요.

| 필드 | 설명 |
|------|------|
| `address` | 도로명/기본 주소 (등록 시 `address`와 동일) |
| `addressDetail` | 상세 주소 (없으면 `null` 또는 omit) |

권장 위치 (택1, OpenAPI에 명시):

- `schoolInfo.address` + `schoolInfo.addressDetail`, 또는
- 상세와 동일하게 row 루트의 `address` / `addressDetail`

등록 시 넣은 값이 목록·상세에서 **동일하게** 보여야 합니다.

### FE 방침

- 목록 「기관 소재지」: `address` + (`addressDetail` null/빈값 아닐 때만 공백 join).
- `schoolInfo.addressDetail` 및 루트 `address`/`addressDetail` 동의어를 매핑.

---

## 4. 학교 상세 — 기관 소재지

### 표시 규칙 (FE)

```text
기관 소재지 = address + (addressDetail이 null/빈 문자열이 아닐 때만 " " + addressDetail)
```

예:

- `address=서울특별시 강서구 화곡로 1`, `addressDetail=3층` → `서울특별시 강서구 화곡로 1 3층`
- `addressDetail=null` → `서울특별시 강서구 화곡로 1`만

### 요청 (BE)

- 상세에서 `address` / `addressDetail`을 **등록값 그대로** 유지·반환 (이미 상세에 있으면 목록만 §3).
- 마스킹 정책: 기관 주소는 개인정보 마스킹 대상이 **아님** (기존 핸드오프 기관 주소 정책과 동일).

---

## 5. 수락 기준

| # | 기대 |
|---|------|
| 1 | 학교 등록 시 FE가 가짜 `*@institution.jakorea.local` email을 **넣지 않아도** 성공 (email optional) |
| 2 | 등록한 `address` / `addressDetail`이 **목록** API에 null이 아닌 값으로 내려옴 |
| 3 | 학교(기관) 목록 「기관 소재지」에 주소 표시 |
| 4 | 학교 상세 「기관 소재지」가 `address` + (있을 때만) `addressDetail` |

---

## 6. 백엔드 회신 부탁

1. 학교 pre-register `email` optional 가능 여부·ETA  
2. 목록 row 주소 필드 위치 (`schoolInfo.*` vs 루트) OpenAPI 확정  
3. 목록 null이 **미구현**인지 **버그**인지  

**Last updated:** 2026-07-28
