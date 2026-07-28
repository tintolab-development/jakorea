# Handover: CMS 강사 신규 등록 — payload ↔ 상세 조회 갭

**대상:** 백엔드  
**앱:** CMS (관리자)  
**일시:** 2026-07-28 (FE 매핑·갭 재점검 동일일)  
**도메인:** `members` · 강사 pre-register / 강사 상세  
**관련 API:**

| Method | Path | 스키마 |
|--------|------|--------|
| `POST` | `/api/admin/instructors/pre-register` | `AdminPreRegisterInstructorRequest` |
| `GET` | `/api/admin/instructors/{memberId}` (또는 동등 상세) | `InstructorMemberDetailResponse` |

**관련 FE 코드:**

- 등록 모달: `apps/cms/src/features/user/shared/ui/instructor-register-modal.tsx`
- submit: `apps/cms/src/pages/users/user-list-page.tsx` → `createUser`
- 요청 매핑: `apps/cms/src/features/user/api/map-pre-register-request.ts`
- 약관·자격증 등 extras: `apps/cms/src/features/user/api/map-instructor-register-extras.ts`
- 상세 매핑: `apps/cms/src/features/user/api/map-member-detail-to-user.ts`
- 이력서 행 매핑: `apps/cms/src/features/user/shared/lib/user-to-applicant-instructor-row.ts`

---

## 1. 요약

CMS **강사 신규 등록** 폼에는 이력서·동의·학력 등 필드가 많지만, OpenAPI `AdminPreRegisterInstructorRequest` / 상세 `InstructorMemberDetailResponse`에 **대응 필드가 없거나**, 등록 시 보냈는데 **상세에서 null·잘림·스키마 누락**인 항목이 있습니다.

2026-07-28 FE 재점검:

- **API에 이미 있는 필드** → 등록·상세 표시까지 **매핑 완료** (§2)
- **스키마/저장/상세에 없는 필드** → **서버 수정·필드 추가 요청** (§3) — FE는 등록 시 드롭하거나 빈 값 표시

---

## 2. FE에서 이미 연결한 항목 (등록 ↔ 상세)

| 폼 UI | 등록 요청 필드 | 상세 응답 | FE 상세/이력서 표시 |
|-------|----------------|-----------|-------------------|
| 성명·성별·연락처·이메일 | `name`, `gender`, `phone`, `email` | `member.*` | 기본정보 |
| 생년월일 | `birthDate` | `member.birthDate` | 매핑됨 — **단, 상세 `null` 버그** → §3.1 |
| 회원 유형 | `instructorType` (`GENERAL` / `SCHOOL_TEACHER`) | `instructorProfile.primaryActivityType` | 활동 유형 (소속란에 넣지 않음) |
| 자택 주소·상세 | `homeAddress`, `homeAddressDetail` | `homeAddress`만 (detail **스키마 없음**) | 주소 줄 — **잘림·detail 누락** → §3.1 |
| 강사 경력(텍스트/연수) | `careerText` | `instructorProfile.careerText` | 경력 표시 (`16` → `16년`); `"마스킹"` 처리 |
| 한 줄 소개 | `oneLineIntro` | `oneLineIntro` | `bio` / 이력서 한 줄 |
| 자유작성 **1번** | `selfIntroduction` | `selfIntroduction` | 이력서 자유작성 1 (2~4는 §3) |
| 계좌·사업소득 | `bankName`, `account*`, `bankAccounts`, `businessIncome` | 루트/배열 + `businessIncomeYn` | **기본정보 계좌** (이력서가 아님) |
| 서비스·개인정보·마케팅 | `termsAgreements[]` | (동의 API 별도) | 동의 섹션 |
| **자격증 rows** | `certifications[]` | `certifications[]` | **이력서 자격·면허** (`certificationName`/`issuedDate`→연도) |
| 학력 유형·상태(요약) | `educationLevel` (`"4년제 / 졸업"`) | `educationLevel` | 이력서 학력 **요약 1행** (학교명·전공·기간 rows는 §3) |
| 강사비·JA 등급 | (등록 시 미전송 가능) | `defaultFeeGrade` / `defaultJaGrade` | 목록·섹션 등급 라벨 |

### 2.1 FE 매핑 완료 (2026-07-28 추가)

- 상세 `certifications[]` → `User.instructorCertifications` → 이력서 `qualifications`
- `educationLevel` 요약 → 이력서 `educations` 1행 (구조화 rows 대체용)
- 계좌는 API 제공·기본정보 매핑됨 — **「계좌 API 미제공」 안내 문구는 제거**

---

## 3. 서버 필드·저장·상세 반환 추가 요청

등록 폼과 상세 UI를 **둘 다** 확인한 결과, 아래는 스키마에 없거나 등록→상세가 깨집니다.

### 3.1 등록 요청은 받지만 상세에서 깨지는 항목 (버그/누락)

| 필드 | 등록 | 상세 문제 |
|------|------|-----------|
| `birthDate` | `"1997-07-21"` 등 전송 | `member.birthDate` = `null` |
| `homeAddress` | 도로명 전체 전송 | 시·군·구만 반환되는 사례 |
| `homeAddressDetail` | 요청 스키마에 있음 | **`InstructorDetailResponse`에 필드 없음** |
| `certifications[]` | 제목 있는 행 전송 | 관측 예시에 **빈 배열** — 저장·반환 확인 필요 |
| `oneLineIntro` / `careerText` / `selfIntroduction` | 원문 전송 | `"마스킹"` 문자열만 (unmask 계약 필요) |

### 3.2 등록 폼에 있으나 **요청 스키마에 없어 FE가 드롭**하는 항목

| 폼 필드 | FE 현재 | 서버 요청 (제안) |
|---------|---------|------------------|
| 소속명 / 소속 없음 (일반) | `createUser.affiliation` 조합만, **pre-register body 미포함** | `affiliation` 또는 `organizationText` |
| 학교명 · 재직 현황 (학교교사) | 위와 동일하게 affiliation 문자열만 만들고 **미전송** | `affiliatedSchoolName` + `employmentStatus` |
| 구조화 학력 rows (고/전문/4년/대학원·전공·기간) | `eduSchoolType`/`eduStatus`만 `educationLevel` 요약 | `educations[]` |
| 경력사항 `careerLevel` + `careers[]` | 미전송 (`careerText`만) | `careerLevel` + `careers[]` |
| JA Korea 활동 `jaKoreaRows[]` | 미전송 | `jaKoreaActivities[]` |
| 수상 `awardRows[]` | 미전송 (자격증과 분리) | `awardRows[]` / `awards[]` |
| 자유작성 2~4 | `freeWrite1`만 → `selfIntroduction` | `freeWrite2`~`4` 또는 `essays[]` |
| 동의서 작성형 5종 (초상권·지급조서·교육진행자·행정정보·성범죄) | 라디오만 UI, terms 미전송 | `termsType` 확장 + 작성 완료 상태 |
| **초기 비밀번호** | FE는 email=temp password 준비, **body 미전송** | `rawPassword` (값은 email과 동일) — [temp-password handover](./admin-pre-register-temp-password-handover-2026-07-28.md) |

### 3.3 상세/이력서 UI에 필요하나 API에 없는 항목 (표시 공백)

| 이력서/상세 UI | 현재 FE | 필요 API |
|----------------|---------|----------|
| 구조화 학력 카드 | 요약 1행만 | `educations[]` |
| 경력사항 카드 | `careerDetails: []` | `careers[]` |
| JA 활동 | (등록 전용 UI) | `jaKoreaActivities[]` |
| 수상·수료 | remote 시 `awards: []` | `awards[]` |
| 자유작성 2~4 | `-` 또는 경력/소개 문단 분할 임시 | 문항별 필드 |
| 소속·재직 태그 | loose `affiliation` 있을 때만 | 구조화 소속·재직 |

---

## 4. 관측 예시 (2026-07-28)

### 등록 payload (발췌)

```json
{
  "email": "ememail@em.com",
  "name": "김성명",
  "phone": "01022234455",
  "gender": "F",
  "birthDate": "1997-07-21",
  "instructorType": "GENERAL",
  "homeAddress": "서울특별시 관악구 조원로16길 7 (신림동, 신림동신도브래뉴아파트)",
  "homeAddressDetail": "신림동상세주소강사경력16",
  "oneLineIntro": "사업자여부해당함 한줄소개이다 이것은",
  "careerText": "16",
  "selfIntroduction": "자기소개와라랄ㄹ",
  "bankName": "우리은행",
  "accountNumber": "1002859723089",
  "accountHolder": "김성명예금주",
  "businessIncome": true,
  "bankAccounts": [
    {
      "bankName": "우리은행",
      "accountNumber": "1002859723089",
      "accountHolder": "김성명예금주"
    }
  ]
}
```

### 상세 response (발췌) — 문제 포인트

```json
{
  "member": {
    "memberId": 6,
    "birthDate": null,
    "gender": "F"
  },
  "instructorProfile": {
    "primaryActivityType": "GENERAL",
    "businessIncomeYn": true,
    "homeAddress": "서울특별시 관악구",
    "careerText": "마스킹",
    "selfIntroduction": "마스킹",
    "oneLineIntro": "마스킹"
  },
  "bankName": "우리은행",
  "accountNumber": "*************",
  "accountHolder": "김**",
  "bankAccounts": [ … ],
  "certifications": []
}
```

| 기대 | 실제 |
|------|------|
| `member.birthDate` = `1997-07-21` | `null` |
| `homeAddress` 전체 도로명 | `서울특별시 관악구`만 |
| `homeAddressDetail` 반환 | **필드 없음** |
| `certifications` 등록분 반환 | 빈 배열 관측 사례 있음 — 저장 여부 확인 |
| 소개·경력 원문 (또는 마스킹 + unmask) | `"마스킹"` 문자열 |

---

## 5. 수락 기준 (우선순위)

### P0 — 등록↔상세 정합

1. pre-register로 보낸 `birthDate`가 상세 `member.birthDate`에 동일하게 내려옴  
2. `homeAddress` 전체 + `homeAddressDetail`이 상세에 분리 저장·반환 (`InstructorDetailResponse`에 `homeAddressDetail` 추가)  
3. pre-register `certifications[]`가 상세 `certifications[]`에 round-trip  
4. OpenAPI 반영 후 FE `generate:api`  
5. pre-register `rawPassword` 수용·저장 (계정 아이디 = 임시 비밀번호) — 개인 포함 [temp-password handover](./admin-pre-register-temp-password-handover-2026-07-28.md)

### P1 — 폼·이력서 커버리지

1. 소속·학교교사 재직 필드 pre-register·상세  
2. 구조화 학력 / 경력 / JA활동 / 수상 / 자유작성 2~4  
3. 동의서 작성형 5종 `termsType`·작성 완료 상태

### P2 — 마스킹

1. `"마스킹"` 플레이스홀더 vs unmask API 계약 문서화  
2. 개인정보 상세보기 후 `oneLineIntro` / `careerText` / `selfIntroduction` / 계좌 원문 복원

---

## 6. 백엔드 회신 부탁

1. §3.1 (`birthDate`, `homeAddress`, `homeAddressDetail`, certifications round-trip) 수정 ETA  
2. §3.2 **`rawPassword`** (개인·강사) 필드명·required·ETA — [temp-password handover](./admin-pre-register-temp-password-handover-2026-07-28.md)  
3. §3.2 중 **등록 1차에 넣을 필드** 범위 (소속만 / 이력서 전체 등)  
4. 동의서 작성형의 `termsType` / consentType **확정 enum**  
5. OpenAPI 반영 일정 (FE `generate:api` 후 매핑 추가)

회신 주시면 CMS 등록 매핑·상세 표시를 이어서 맞추겠습니다.

관련:

- [admin-pre-register-temp-password-handover-2026-07-28.md](./admin-pre-register-temp-password-handover-2026-07-28.md) (개인·강사 `rawPassword`)
- [school-pre-register-list-detail-handover-2026-07-28.md](./school-pre-register-list-detail-handover-2026-07-28.md) (학교 등록 더미 email · 목록 주소)

**Last updated:** 2026-07-28 (자격증·학력 요약 FE 매핑 반영, 서버 갭 §3.2/3.3 재정리, `rawPassword` 요청 추가)
