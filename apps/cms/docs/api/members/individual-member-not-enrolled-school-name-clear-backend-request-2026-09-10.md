# BE 수정 요청 (2026-09-10) — 단독 문서

**작성일:** 2026-09-10  
**문서 성격:** **이 파일만** 보고 구현·검수 가능 (선행/관련 문서 열람 불필요)  
**포함 이슈:**

| # | 우선순위 | 대상 API | 한 줄 |
|---|----------|----------|-------|
| **A** | **P1** | Members · 개인 회원 기본정보 PATCH/GET | `NOT_ENROLLED` clear 시 `schoolName`/`affiliationName` 미삭제 |
| **B** | **P1** | Sponsors · 담당자 목록 GET | 담당자 정보 **마스킹 금지**(전 항목 평문) |

---

# A. 일반 회원 — `NOT_ENROLLED` 시 학교명 clear 미영속

**요청 대상:** Members API · 개인(GENERAL) 회원  
**엔드포인트:**

| Method | Path | 역할 |
|--------|------|------|
| `PATCH` | `/api/admin/users/{memberId}/basic-info` | 기본정보 저장 (본 clear 요청) |
| `GET` | 개인 회원 상세 (`IndividualMemberDetailResponse` 계열) | clear 결과 SSOT 검증 |
| `PATCH` | `/api/portal/me/profile` | 포털도 **동일 clear 계약** 적용 권장 |

**FE 전송 구현(참고, 수정 불필요):**  
`map-patch-user-basic-info.ts` → `applyIndividualAffiliationToPatchBody`,  
`all-users-section.tsx` → `handleEnrollmentStatusChange`,  
`admin-provisioned-member-basic-info-draft.ts` → `draftToIndividualAffiliationPatch`

---

## A1. 요약

**한 줄:** 일반 회원 상세에서 **소속 학교 → 소속 해당 없음(삭제/해제)** 으로 바꿔도 학교 정보가 남음.  
**대조:** **새 학교로 바꾸거나**, 재학이 아닌 **다른 소속(기관명 등)을 등록하는 것은 정상**.

CMS **일반 회원 상세**에서

1. `현재 학교 재학 여부`: **재학 중** → **해당 없음**  
2. 소속: 학교명·`schoolOrganizationId` clear  

로 저장하면, **재학 여부(`enrollmentStatus`)와 `schoolOrganizationId`만** 반영되고  
**`schoolName` / `affiliationName`은 이전 학교명이 그대로 남습니다.**

### A1.1 동작 대조 (같은 PATCH API)

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

## A2. 재현

관리자 CMS · members remote · 일반(개인) 회원 상세.

### A2.0 실패 케이스 (본 이슈)

1. 회원 상태: `enrollmentStatus=ENROLLED`, 소속 학교명 있음 (예: 서울계남초등학교).  
2. 기본정보 수정 → **현재 학교 재학 여부 = 해당 없음**(소속 학교 삭제/해제) → 저장.  
3. Network에서 PATCH body 확인 후, 상세 닫기·재오픈(또는 새로고침) → 상세 GET.  
4. (선택) 개인정보 마스킹 해제 후 동일 GET.

### A2.0b 정상 대조 (같은 화면·같은 API)

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

## A3. 관측 데이터 (2026-09-10 · memberId `810125`)

### A3.1 FE → PATCH 요청 (의도 / 실제 전송)

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

### A3.2 PATCH 직후 Response (목록형 `UserResponse` 요약)

- `affiliation`: `null`  
- `schoolInfo`: `null`  
- `affiliatedSchoolName`: `null`  
- **`enrollmentStatus` / `schoolName` 필드 없음** (스키마가 목록형)  
- `updatedAt` 갱신됨 (`2026-09-10T04:27:21.065832Z`)  
- `memberId`: `810125`

→ PATCH 응답만으로는 재학·학교 clear 여부를 검증하기 어렵고, **상세 GET이 SSOT**.

### A3.3 새로고침 후 상세 GET (마스킹)

```json
{
  "enrollmentStatus": "NOT_ENROLLED",
  "grade": null,
  "schoolOrganizationId": null,
  "schoolName": "**초등학교",
  "affiliationName": "**초등학교"
}
```

### A3.4 마스킹 해제 후 상세 GET

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

## A4. PATCH 필드 계약 (이 문서에 전부 수록)

OpenAPI 생성 타입 `AdminMemberBasicInfoUpdateRequest`에는 보통 `name`·`phone`·`email`·`detailAddress`·`affiliation`·`gender`·`birthDate` 등만 있을 수 있다.  
개인 회원 상세 저장 시 FE는 **동일 path**에 아래 **확장 필드**를 함께 보낸다. **OpenAPI에 없어도 런타임 JSON을 바인딩·영속**하거나, OpenAPI·구현을 **동시에** 확장할 것.

### A4.1 재학·소속·학년 (본 이슈 핵심)

| UI | PATCH JSON 키 | 값 |
|----|---------------|-----|
| 현재 학교 재학 여부 | `enrollmentStatus` | `ENROLLED` \| `NOT_ENROLLED` |
| 소속(학교명) | `schoolName` | 문자열. **비재학(해당 없음) 시 `""`** |
| 학년 | `grade` | 재학 시 학년 문자열. **비재학 시 `""`** |
| CMS 학교 PK | `schoolOrganizationId` | number 또는 해제 시 **`null` (`omit` 금지)** |
| (선택) 검색 선택 | `schoolSelection` | organizationId 없을 때 사용 가능 |

**비재학(해당 없음) 전환 — FE 실제 전송 예:**

```json
{
  "enrollmentStatus": "NOT_ENROLLED",
  "schoolName": "",
  "grade": "",
  "schoolOrganizationId": null
}
```

**재학 + 기존 CMS 학교 — 정상 경로 예:**

```json
{
  "enrollmentStatus": "ENROLLED",
  "schoolName": "○○고등학교",
  "grade": "2학년",
  "schoolOrganizationId": 123
}
```

`affiliation` 문자열만 갱신하고 `enrollmentStatus` / `schoolName` / `grade` / `schoolOrganizationId`를 **무시하면** UI의 재학·소속·학년이 되돌아간다.

### A4.2 clear 의미 (영속 계약)

| 입력 | 영속 결과 |
|------|-----------|
| `enrollmentStatus: NOT_ENROLLED` | 재학 아님 |
| `schoolName: ""` | 학교명 **없음** (이전 값 유지 금지) |
| `schoolOrganizationId: null` | FK **해제** (`omit`과 구분 — omit 시 기존 FK 유지로 해석하지 말 것) |
| `grade: ""` | 학년 없음 |

상세 GET도 동일하게 반영:

| 필드 | clear 후 기대 |
|------|----------------|
| `schoolName` | `null` 또는 `""` |
| `affiliationName` | `null` 또는 `""` (schoolName과 동일 clear) |
| `schoolOrganizationId` | `null` |
| `enrollmentStatus` | `NOT_ENROLLED` |
| `grade` | `null` 또는 `""` |

`NOT_ENROLLED`인데 `schoolName`이 **비어 있지 않은** 요청을 거부하는 정책이 있다면, **빈 문자열 clear는 허용**하고 “학교명 유지 + NOT_ENROLLED”만 거절할 것.

### A4.3 포털 동일 계약 (권장 · 동일 clear)

관리자 PATCH와 맞추기 위해 포털도 동일 clear를 영속할 것.

```http
PATCH /api/portal/me/profile
```

```json
{
  "enrollmentStatus": "NOT_ENROLLED",
  "schoolName": "",
  "grade": "",
  "affiliationName": "",
  "schoolOrganizationId": null
}
```

(레거시 키 `schoolEnrollmentStatus`가 오면 `enrollmentStatus`와 동일 의미로 처리하거나, **`enrollmentStatus`를 SSOT**로 통일.)

요청:

1. `schoolOrganizationId: null` + 빈 이름 + `NOT_ENROLLED` → 소속 **완전 해제**  
2. 이후 `GET /api/portal/me/profile`도 null/빈 값 반환  
3. response와 DB persist 불일치 금지  

---

## A5. BE 요청 사항 (체크리스트용 요약)

1. **`enrollmentStatus: "NOT_ENROLLED"`** 이고 `schoolName`이 `""`/`null` 이거나 `schoolOrganizationId: null` 인 PATCH에 대해 **소속 학교명을 DB에서 완전 해제**.  
   - 대상: `schoolName`, `affiliationName`(및 동일 의미 affiliation 저장소)  
2. clear 후 **상세 GET**이 A4.2 표를 만족할 것.  
3. PATCH 응답이 목록형이어도 **영속 결과는 상세 GET과 일치**.  
4. OpenAPI에 필드가 없어도 **바인딩·영속**하거나 OpenAPI·핸들러를 함께 확장.  
5. (권장) `PATCH /api/portal/me/profile`에도 **동일 clear** 적용.

---

## A6. FE 측 상태 (참고)

| 항목 | 상태 |
|------|------|
| 해당 없음 전환 시 draft clear | ✅ |
| PATCH body `schoolName: ""` + `schoolOrganizationId: null` | ✅ |
| 재조회 후 소속 잔존 | ❌ BE GET이 옛 `schoolName`/`affiliationName` 반환 |

저장 직후 UI가 잠깐 옛 소속을 보일 수 있는 FE 머지 여지는 있으나, **본 이슈의 재현 증거(재조회·언마스크 GET)는 BE persist**.

---

## A7. 验收 체크리스트 (BE) — 이슈 A

- [ ] `ENROLLED` + 학교명 있는 회원에 대해 A3.1 clear PATCH → **200**  
- [ ] 동일 회원 상세 GET: `enrollmentStatus=NOT_ENROLLED`, `schoolOrganizationId=null`  
- [ ] 동일 GET: `schoolName` / `affiliationName` 이 **null 또는 빈 문자열** (이전 학교명 금지)  
- [ ] 마스킹 해제 GET에서도 동일 clear  
- [ ] (회귀·대조) 학교 A → 학교 B 변경 저장·재조회 정상  
- [ ] (회귀·대조) 학교가 아닌 다른 소속 등록 저장·재조회 정상  
- [ ] (회귀) `ENROLLED` + `schoolName` + `grade` + `schoolOrganizationId` 저장·재조회 정상  
- [ ] OpenAPI·핸들러 바인딩에 clear 필드 누락 없음  
- [ ] (권장) 포털 `PATCH /api/portal/me/profile` clear → GET에서 학교명 없음  

### A7.1 관측 샘플 (디버그용)

- 관측 회원: `memberId=810125`, `uuid=246053ab-f409-406e-8198-bea5cac0f53c`  
- PATCH `updatedAt`: `2026-09-10T04:27:21.065832Z`  

---

# B. 후원사 · 담당자 목록 — 마스킹하지 않음

**요청 대상:** Sponsors API · 후원사 상세 **담당자 목록**  
**관련 FE 화면:** 데이터 관리 > 후원사 > 상세 **담당자 목록**

| Method | Path |
|--------|------|
| `GET` | `/api/admin/sponsors/{sponsorId}/contacts` |
| `GET` | `/api/admin/sponsors/{sponsorId}` (응답 embed `contacts[]`) |

---

## B1. 요약

**후원사 담당자 정보는 마스킹하지 않는다.**  
회원(개인정보) 마스킹·언마스크 정책과 **분리**한다.  
담당자 응답은 **항상 원문(평문)**. 별도 「마스킹 해제」 액션·쿼리·헤더 없이, **기본 GET부터 전 항목 평문**.

---

## B2. 마스킹 해제 대상 (모든 담당자 항목)

| 화면 | 응답 필드 | 기대 |
|------|-----------|------|
| 담당자 유형 | `contactType`, `primary` | 원문 (`lead` / `assistant`, `primary=true` = 주 담당자) |
| 부서 | `department` | 원문 |
| 직함 | `position` | 원문 |
| 담당자명 | `name` | 원문 (**마스킹 금지**) |
| 내선번호 | `officePhone` | 원문 |
| 연락처 | `mobilePhone` 또는 `phone` | 원문 (FE는 `phone ?? mobilePhone`로 읽음) |
| 이메일 | `email` | 원문 |
| 회사주소 | `companyAddress` | 원문 |
| 비고 | `memo` | 원문 |
| 등록일시 | `registeredAt` 또는 `createdAt` | 원문 (가능하면 항상 채움) |

→ **담당자명 · 내선번호 · 연락처 · 이메일 · 회사주소 등 모든 항목 마스킹 해제.**  
부분 마스킹·`*` 치환·중간 자리 가리기 **금지**.

---

## B3. BE 요청

1. `GET …/sponsors/{id}/contacts` 및 상세 `contacts[]`에서 담당자 필드를 **마스킹하지 말 것**.  
2. 회원 상세 마스킹·언마스크 플로우를 후원사 담당자에 **적용하지 말 것**.  
3. OpenAPI/응답 샘플도 **원문** 기준으로 맞출 것.  
4. (참고) POST/PATCH가 `officePhone` / `companyAddress` / `memo` / `department` / `position` / `email` / `name` / `mobilePhone`을 버리지 않고 재조회에 되돌려 줄 것.

### B3.1 기대 응답 예시 (평문)

```json
{
  "contacts": [
    {
      "id": "…",
      "contactType": "lead",
      "primary": true,
      "department": "CSR팀",
      "position": "과장",
      "name": "홍길동",
      "officePhone": "1234",
      "mobilePhone": "010-1234-5678",
      "email": "hong@example.com",
      "companyAddress": "서울특별시 …",
      "memo": "",
      "registeredAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

(`name`이 `"홍**"` / `"홍*동"`, `mobilePhone`이 `"010-****-5678"` 등이면 **실패**.)

---

## B4. 验收 체크리스트 (BE) — 이슈 B

- [ ] 담당자 목록 GET: `name` / `officePhone` / `mobilePhone`(또는 `phone`) / `email` / `companyAddress` 가 `*`·부분 마스킹 없이 **원문**  
- [ ] 부서·직함·비고·유형·등록일시 등 나머지 담당자 필드도 동일  
- [ ] 마스킹 해제 API/쿼리 없이도 원문 노출 (기본 응답 = 평문)  
- [ ] 상세 embed `contacts[]`와 `GET …/contacts` 마스킹 정책 일치  

---

## 문서 범위

- **이 문서만**으로 이슈 A·B 구현·검수 가능.  
- 다른 BE handoff/선행 요청서 열람은 **필수가 아님**.  
