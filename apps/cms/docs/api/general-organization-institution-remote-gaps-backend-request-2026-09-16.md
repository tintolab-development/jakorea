# 일반 프로그램 기관 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16  
**우선순위:** P1  
**대상:** 일반 프로그램 **기관 신청 상세** · **참여 기관 상세** — 정보 수정·합반·교재 등  
**SSOT:** 일반 프로그램(기관) FE 수정·미연동 갭은 본 문서에 누적합니다.  
**FE 연동(2026-09-16):** `organization-merge-groups` GET/POST/DELETE 배선 완료. 그 외 항목은 **서버 계약·응답 보완** 요청.

---

## LNB 기준 remote 보완 요약

### 참여자 신청 목록 > 기관 신청 > 기관 신청 상세

- 기관 신청 상세 GET 부재 — 합반 외 필드(주소·교재·담당 교사 등) 수정은 여전히 mock
- `organization-applications` 목록에 **학년(`educationGrade`)**·지역·합반 파트너 enrich 없음 → 동일 기관 타 학년 lookup FE가 목록 50건 한정
- 합반 저장 후 **파트너 학년 신청 건 교재명 동기화** — merge-groups만으로는 FE가 파트너 상세 갱신 불가
- 신청 단계 합반 POST 후 **목록/상세 재조회 enrich** (합반 상태·파트너 학년) 일관성 검증 필요

### 프로그램 진행 현황 > 참여 기관 > 참여 기관 상세 > 신청 정보

- `participants`(ORGANIZATION) 목록 **학년·반·인원·교재·지역** 필드 부족 — FE adapter 빈값
- 참여 기관 상세 GET 부재 — 합반 외 신청 정보 필드 PATCH API 없음
- `participants` `organizationApplicationId`·`organizationName` 매핑은 2026-09-16 FE 보정, **학년·schedule enrich**는 BE 필요
- 합반 **멤ber(비 lead) 행**에서 취소·변경 API — DELETE는 lead 그룹 기준, member 단독 해제 계약 없음
- 교재 선택 저장 — participant/org-application textbook PATCH와 merge-groups 연동 계약 없음

---

## 1) 이미 구현·FE 연동한 API (참고)

| Method | Path | FE 용도 |
|--------|------|---------|
| GET | `/api/admin/programs/{programId}/organization-merge-groups` | 상세 진입 시 합반 상태 hydrate |
| POST | `/api/admin/programs/{programId}/organization-merge-groups` | 「신청」+ 파트너 학년 저장 |
| DELETE | `/api/admin/programs/{programId}/organization-merge-groups/{mergeGroupId}` | 「미신청」·파트너 변경 전 취소 |

**CreateMergeRequest:** `leadApplicationId`, `members[{ organizationApplicationId, grade }]`, `changeReason?`

---

## 2) participants(ORGANIZATION) 목록 enrich — P1

### 요청 배경

참여 기관 목록·합반 partner lookup·상세 표시에 **학년·기관명·organizationApplicationId**가 필요합니다.  
현재 `ParticipantListItemResponse`는 `organizationName`·`organizationApplicationId`만 일부 내려오며 **학년·반·인원·교재·지역·sessions**는 비어 FE mock 상세에 의존합니다.

### 요청

`GET /api/admin/programs/{programId}/participants?participantType=ORGANIZATION` 응답 item enrich:

| 필드 | 용도 |
|------|------|
| `educationGrade` (또는 `grade`) | 합반 partner select 옵션·POST `members[].grade` |
| `region` / 소재지 | 목록·상세 |
| `classCount`, `studentCount` | 목록·교재 키트 계산 |
| `textbookId`, `textbookName`, `textbookStatus` | 신청 정보 탭 |
| `organizationApplicationId` | **필수** — merge POST·강사 배정 스코프 (sourceApplicationId와 구분 명확화) |
| `mergeGroupId`, `combinedClassYn` (optional) | 목록 배지·상세 1회 조회 생략 |

동일 `organizationId`·다른 `organizationApplicationId`(학년) 다건 페이징(size>50) 지원.

---

## 3) organization-applications 목록 enrich — P1

### 요청 배경

**신청 단계** 합반 partner lookup은 `organization-applications` 목록에서 동일 `organizationName`·다른 학년을 필터합니다.  
현재 list item에 **학년·지역** 없음.

### 요청

`OrganizationApplicationListItemResponse` enrich:

- `educationGrade` / `grade`
- `region`
- `schoolName` alias 정리 (`organizationName` SSOT)
- (optional) `mergeGroupId`, `combinedClassPartnerGrades[]`

---

## 4) 기관 신청·참여 상세 GET + PATCH — P1

### 요청 배경

합반 외 **신청 정보 탭** 필드(주소·교육형태·교재·담당 교사·안내 사항 등)는 admin 상세 GET/PATCH가 없어 FE mock patch만 동작합니다.

### 신규 API (안)

- `GET /api/admin/organization-applications/{applicationId}` — 신청 상세 (합반·교재·profile 포함)
- `PATCH /api/admin/organization-applications/{applicationId}` — 상세 필드 수정
- (참여) `GET/PATCH /api/admin/programs/{programId}/participants/{participantId}/organization-detail` 또는 participant enrich 확장

합반은 merge-groups 유지, PATCH body에 `combinedClassApplication` 중복 넣지 않음.

---

## 5) 합반 저장 후 교재·파트너 동기화 — P1

### 요청 배경

스펙: lead 기관이 합반 「신청」+ 교재 선택 시 **선택한 타 학년(파트너) 신청/참여 건에도 교재명·합반 표시 동기화**.  
현재 mock `patchApplicantInstitutionDetailWithCombinedClass`만 로컬 반영. remote는 merge POST 후 파트너 row 갱신 API 없음.

### 요청

- merge POST 성공 시 BE가 member `organizationApplicationId`에 대해 **교재·합반 표시 필드** snapshot/propagate
- 또는 `GET organization-merge-groups` 응답 `members[]`에 `textbookId`, `textbookName`, `textbookGrade` 포함
- FE는 merge-groups + list refetch로 파트너 상세 갱신

---

## 6) 합반 수정·멤버 해제 — P2

### 현재 FE 동작

파트너 변경·「미신청」 시 **기존 pending 그룹 DELETE → POST** (OpenAPI에 PUT 없음).

### BE 확인·요청

- 효력 발생 전(`effectiveFromScheduleStartAt` 이전)만 DELETE 가능한지 — 409 케이스 FE 안내 문구
- **member(비 lead) 기관**에서 합반 해제 UI 필요 시: lead 전용 DELETE 외 member withdraw API 또는 lead 위임 규칙
- 동일 lead·동일 members 재POST idempotency / 409 vs 200

---

## 7) 신청 단계 vs 진행 단계 합반 — P2

### 요청

- 신청(승인 전) `organization-applications`에서 merge POST 허용 여부·비즈 규칙 (승인된 건만 merge 가능 등)
- 진행 단계 `participants`만 merge 가능한 경우 **신청 상세 합반 UI disabled** 조건을 `availableActions` 또는 program phase flag로 내려주기

---

## 8) FE 검증 체크리스트 (스테이징)

- [ ] 동일 기관 2학년 이상 — 「신청」 라디오 활성·partner select 옵션
- [ ] GET merge-groups → 상세 「신청 | n학년」 hydrate
- [ ] POST merge → GET 재조회 반영
- [ ] 「미신청」→ pending DELETE
- [ ] 파트너 변경 → DELETE + POST
- [ ] member(비 lead) 행 — 합반 read-only
- [ ] participants 목록 `organizationApplicationId` — 강사 배정 create와 동일 ID

---

## 관련

- FE spec: `apps/cms/.cursor/rules/process/applicant-institution-combined-class-spec.md`
- FE 코드: `organization-merge-groups-api-client.ts`, `organization-merge-groups-service.ts`, `organization-merge-groups-mapper.ts`
- OpenAPI: `GET/POST/DELETE …/organization-merge-groups` (구현 완료 표기)

**Last updated:** 2026-09-16
