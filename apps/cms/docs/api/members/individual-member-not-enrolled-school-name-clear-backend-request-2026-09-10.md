# 일반 회원 기본정보 PATCH — `NOT_ENROLLED` 시 `schoolName`/`affiliationName` 미삭제 · BE 수정 요청

**작성일:** 2026-09-10  
**우선순위:** **P1** (소속 학교 → 해당 없음으로 삭제해도 학교 정보 잔존. 새 학교·다른 소속 등록은 정상)  
**요청 대상:** Members API · 개인(GENERAL) 회원 기본정보 PATCH 영속  
**관련 FE:**  
- `map-patch-user-basic-info.ts` → `applyIndividualAffiliationToPatchBody` (`NOT_ENROLLED` 시 `schoolName: ""`, `grade: ""`, `schoolOrganizationId: null`)  
- `all-users-section.tsx` → `handleEnrollmentStatusChange` (해당 없음 전환 시 draft 소속·메타 clear)  
- `admin-provisioned-member-basic-info-draft.ts` → `draftToIndividualAffiliationPatch`  
**OpenAPI:** `AdminMemberBasicInfoUpdateRequest` · 개인 상세 GET (`IndividualMemberDetailResponse` 계열)  
**관련 선행 문서:**  
- [`individual-member-basic-info-patch-unmask-1365-backend-request-2026-09-04.md`](./individual-member-basic-info-patch-unmask-1365-backend-request-2026-09-04.md) §4.2  
- [`admin-register-signup-type-portal-profile-backend-request-2026-08-14.md`](./admin-register-signup-type-portal-profile-backend-request-2026-08-14.md) §8  

---

## 1. 요약

**한 줄:** 일반 회원 상세에서 **소속 학교 → 소속 해당 없음(삭제/해제)** 으로 바꿔도 학교 정보가 남음.  
**대조:** **새 학교로 바꾸거나**, 재학이 아닌 **다른 소속(기관명 등)을 등록하는 것은 정상**.

CMS **일반 회원 상세**에서

1. `현재 학교 재학 여부`: **재학 중** → **해당 없음**  
2. 소속: 학교명·`schoolOrganizationId` clear  

로 저장하면, **재학 여부(`enrollmentStatus`)와 `schoolOrganizationId`만** 반영되고  
**`schoolName` / `affiliationName`은 이전 학교명이 그대로 남습니다.**

### 1.1 동작 대조 (같은 PATCH API)

| 시나리오 | 결과 |
|----------|------|
| 소속 학교 A → **다른 학교 B**로 변경 | ✅ 저장·재조회 반영됨 |
| 재학 중 → **해당 없음이 아닌** 다른 소속(기관명 등) 등록 | ✅ 정상 |
| 소속 학교 → **해당 없음**(학교 정보 삭제/해제) | ❌ `enrollmentStatus`만 `NOT_ENROLLED`로 바뀌고 **학교명 잔존** |

→ **비어 있는 clear(`schoolName: ""` / FK `null`) 경로만** 영속이 빠지는 패턴으로 보임. (값→값 교체는 됨, 값→빈값 해제는 안 됨)

| 구분 | 결과 |
|------|------|
| FE 요청 | clear 계약대로 전송 (`enrollmentStatus: NOT_ENROLLED`, `schoolName: ""`, `schoolOrganizationId: null`) |
| PATCH 직후 응답 | 목록형 `UserResponse` — `affiliation: null` (enrollment/school 필드 없음) |
| **새로고침 후 상세 GET** | `enrollmentStatus: NOT_ENROLLED` ✅ · `schoolOrganizationId: null` ✅ · **`schoolName`/`affiliationName` 잔존** ❌ |
| 마스킹 해제 GET | 동일 — 옛 학교명(원문) 잔존 ❌ |

**판정:** FE 요청/표시 문제가 아니라 **BE persist 누락**(특히 empty/`null` clear).  
(저장 직후 UI 머지는 PATCH 응답 스키마 한계로 보조 이슈일 수 있으나, **재조회에도 남으면 BE 확정**.)

---

## 2. 재현

관리자 CMS · members remote · 일반(개인) 회원 상세.

### 2.0 실패 케이스 (본 이슈)

1. 회원 상태: `enrollmentStatus=ENROLLED`, 소속 학교명 있음 (예: 서울계남초등학교).  
2. 기본정보 수정 → **현재 학교 재학 여부 = 해당 없음**(소속 학교 삭제/해제) → 저장.  
3. Network에서 PATCH body 확인 후, 상세 닫기·재오픈(또는 새로고침) → 상세 GET.  
4. (선택) 개인정보 마스킹 해제 후 동일 GET.

### 2.0b 정상 대조 (같은 화면·같은 API)

| 조작 | 기대·관측 |
|------|-----------|
| 소속 학교를 **다른 학교**로 바꿔 저장 | 재조회 시 새 학교명 반영 ✅ |
| **학교가 아닌 다른 소속**(기관명 등) 등록 | 재조회 시 해당 소속 반영 ✅ |

→ 회귀 검증 시 **값 교체 OK / clear만 NG** 를 함께 확인할 것.

**기대 (실패 케이스)**

| 필드 | 기대값 |
|------|--------|
| `enrollmentStatus` | `NOT_ENROLLED` |
| `schoolOrganizationId` | `null` |
| `grade` | `null` 또는 `""` |
| `schoolName` | `null` 또는 `""` |
| `affiliationName` | `null` 또는 `""` (schoolName과 동일 clear) |

**실제 (관측)**

| 필드 | 실제값 |
|------|--------|
| `enrollmentStatus` | `NOT_ENROLLED` ✅ |
| `schoolOrganizationId` | `null` ✅ |
| `grade` | `null` ✅ |
| `schoolName` | `"서울계남초등학교"` (마스킹 시 `"**초등학교"`) ❌ |
| `affiliationName` | 동일 학교명 ❌ |

---

## 3. 관측 데이터 (2026-09-10 · memberId `810125`)

### 3.1 FE → PATCH 요청 (의도 / 실제 전송)

Wire 키는 개인 상세·pre-register SSOT에 맞춤 (`enrollmentStatus`, 레거시 `schoolEnrollmentStatus` 아님).

```http
PATCH /api/admin/users/{memberId}/basic-info
Content-Type: application/json
```

```json
{
  "enrollmentStatus": "NOT_ENROLLED",
  "schoolName": "",
  "grade": "",
  "schoolOrganizationId": null
}
```

(`name` / `phone` / `email` / 주소 등 다른 기본정보 필드는 함께 전송될 수 있음. 이슈 핵심은 위 4키.)

### 3.2 PATCH 직후 Response (목록형 `UserResponse` 요약)

- `affiliation`: `null`  
- `schoolInfo`: `null`  
- `affiliatedSchoolName`: `null`  
- **`enrollmentStatus` / `schoolName` 필드 없음** (스키마가 목록형)  
- `updatedAt` 갱신됨 (`2026-09-10T04:27:21.065832Z`)  
- `memberId`: `810125`

→ PATCH 응답만으로는 재학·학교 clear 여부를 검증하기 어렵고, **상세 GET이 SSOT**.

### 3.3 새로고침 후 상세 GET (마스킹)

```json
{
  "enrollmentStatus": "NOT_ENROLLED",
  "grade": null,
  "schoolOrganizationId": null,
  "schoolName": "**초등학교",
  "affiliationName": "**초등학교"
}
```

### 3.4 마스킹 해제 후 상세 GET

```json
{
  "enrollmentStatus": "NOT_ENROLLED",
  "grade": null,
  "schoolOrganizationId": null,
  "schoolName": "서울계남초등학교",
  "affiliationName": "서울계남초등학교"
}
```

**해석:** BE는 enrollment·organizationId·grade는 갱신했으나, **`schoolName`/`affiliationName` clear(`""`)를 적용하지 않음.**

---

## 4. BE 요청 사항

1. **`enrollmentStatus: "NOT_ENROLLED"`** 이고  
   - `schoolName`이 `""` / `null` 이거나  
   - `schoolOrganizationId: null`  
   인 PATCH에 대해 **소속 학교명을 DB에서 완전 해제**할 것.  
   - 대상 컬럼/투영: `schoolName`, `affiliationName`(및 동일 의미의 affiliation 저장소)  
2. clear 후 **상세 GET**이 다음을 반환할 것:  
   - `schoolName`: `null` 또는 `""`  
   - `affiliationName`: `null` 또는 `""`  
   - `schoolOrganizationId`: `null`  
   - `enrollmentStatus`: `NOT_ENROLLED`  
3. (권장) PATCH 응답이 목록형이어도, **영속 결과는 상세 GET과 일치**해야 함.  
4. OpenAPI `AdminMemberBasicInfoUpdateRequest`에 `enrollmentStatus` / `schoolName` / `grade` / `schoolOrganizationId`가 빠져 있으면 **스키마·바인딩·영속을 함께** 맞출 것. (선행 문서 §4.2와 동일)

### clear 의미 (계약)

| 입력 | 영속 결과 |
|------|-----------|
| `enrollmentStatus: NOT_ENROLLED` | 재학 아님 |
| `schoolName: ""` | 학교명 없음 (이전 값 유지 금지) |
| `schoolOrganizationId: null` | FK 해제 (**omit과 구분** — omit 시 기존 FK 유지로 해석하지 말 것) |
| `grade: ""` | 학년 없음 |

`NOT_ENROLLED`인데 `schoolName`이 비어 있지 않은 요청을 거부하는 정책(`CMS_INDIVIDUAL_SCHOOL_NOT_ALLOWED_WHEN_NOT_ENROLLED` 등)이 있다면, **빈 문자열 clear는 허용**하고 “학교명 유지 + NOT_ENROLLED”만 거절하는 쪽으로 정리해 주세요.

---

## 5. FE 측 상태 (참고)

| 항목 | 상태 |
|------|------|
| 해당 없음 전환 시 draft clear | ✅ |
| PATCH body `schoolName: ""` + `schoolOrganizationId: null` | ✅ |
| 재조회 후 소속 잔존 | ❌ BE GET이 옛 `schoolName`/`affiliationName` 반환 |

저장 직후 UI가 잠깐 옛 소속을 보일 수 있는 FE 머지 여지는 있으나, **본 이슈의 재현 증거(재조회·언마스크 GET)는 BE persist**.

---

## 6. 验收 체크리스트 (BE)

- [ ] `ENROLLED` + 학교명 있는 회원에 대해 §3.1 clear PATCH → **200**  
- [ ] 동일 회원 상세 GET: `enrollmentStatus=NOT_ENROLLED`, `schoolOrganizationId=null`  
- [ ] 동일 GET: `schoolName` / `affiliationName` 이 **null 또는 빈 문자열** (이전 학교명 금지)  
- [ ] 마스킹 해제 GET에서도 동일 clear  
- [ ] (회귀·대조) 학교 A → 학교 B 변경 저장·재조회 정상 (기존과 같이 ✅ 유지)  
- [ ] (회귀·대조) 학교가 아닌 다른 소속 등록 저장·재조회 정상  
- [ ] (회귀) `ENROLLED` + `schoolName` + `grade` + `schoolOrganizationId` 저장·재조회 정상  
- [ ] OpenAPI·핸들러 바인딩에 clear 필드 누락 없음  

---

## 7. 비고

- 관측 회원: `memberId=810125`, `uuid=246053ab-f409-406e-8198-bea5cac0f53c`  
- PATCH `updatedAt`: `2026-09-10T04:27:21.065832Z`  
- 포털 `PATCH /api/portal/me/profile` 동일 clear 계약도 §8(선행 문서)와 맞추는 것을 권장.  
