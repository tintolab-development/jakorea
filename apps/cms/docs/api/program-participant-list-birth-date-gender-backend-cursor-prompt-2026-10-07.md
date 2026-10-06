# Cursor prompt — 참여자 목록 응답에 생년월일·성별 추가 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-participant-list-birth-date-gender-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 중간 (증빙 문서 품질).** CMS에서 개인 참여자 **참가인증서/수료증**을 발급하면
> 「생년월일」이 `-`로 출력된다. FE는 임시로 발급 시점마다 개인 신청 상세를 추가 조회해 보강하고 있다.
> 목록 응답에 필드가 추가되면 이 추가 조회를 없앨 수 있다.

---

## 증상 (로컬, 2026-10-07 01:3x KST)

CMS 일반 프로그램 상세 → 프로그램 진행 현황 → 참여자 (참여 방식: 개인)

- 재현 URL: `http://localhost:3000/programs/general?programId=186048&lnb=progress&tab=progress_participants`
- 참여자 `이건희일반` 선택 → 「수료증/참가인증서 발급」 → 발급된 PDF의 `생년월일` 행이 `-`
- 같은 회원의 개인 신청 상세(`GET /api/admin/individual-applications/{applicationId}`)에는
  `profile.birthDate`가 정상적으로 내려온다.

### 원인

인증서는 참여자 목록 행으로 만든다. 그런데 목록 응답에 생년월일·성별 필드가 없다.

| 엔드포인트 | 응답 스키마 | 생년월일/성별 |
|---|---|---|
| `GET /api/admin/programs/{programId}/participants` | `ParticipantListItemResponse` | **없음** |
| `GET /api/admin/individual-applications/{applicationId}` | `IndividualApplicationDetailResponse.profile` | `birthDate`, `gender` 있음 (마스킹 없이 원문) |

- DTO: `src/main/java/com/jakorea/cms/applicationflow/dto/ParticipantListItemResponse.java`
- 조립: `src/main/java/com/jakorea/cms/applicationflow/service/ProgramExecutionQueryService.java`
  (`new ParticipantListItemResponse(` 부근 목록 SQL + RowMapper)

---

## 요청

### ① 필드 추가 (additive, nullable)

`ParticipantListItemResponse`에 아래 두 필드만 **추가**하라. 기존 필드 순서·이름은 건드리지 마라.

| 필드 | 타입 | 형식 |
|---|---|---|
| `birthDate` | `LocalDate` → JSON `string \| null` | `YYYY-MM-DD` (`format: date`) |
| `gender` | `string \| null` | 회원·신청 상세와 같은 원시 코드 (`MALE` / `FEMALE` 등) — FE가 라벨로 변환함 |

### ② 값 출처 — 개인 신청 상세와 동일하게

`IndividualApplicationAdminService` 상세 조회와 **같은 우선순위**를 따른다. 그래야 신청 상세 화면과 인증서 값이 어긋나지 않는다.

```sql
COALESCE(snapshot.birth_date_snapshot, member.birth_date) AS birth_date,
COALESCE(snapshot.gender_snapshot,     member.gender)     AS gender
-- snapshot = program_individual_application_profile_snapshot
--            ON snapshot.individual_application_id = pp.source_application_id
--           AND snapshot.program_id = pp.program_id
```

| 참여자 유형 (`participant_type`) | 채우는 값 |
|---|---|
| `INDIVIDUAL` (개인 신청 출처) | 위 snapshot → member 순 |
| 강사·봉사자 등 회원 기반 참여자 | `member.birth_date`, `member.gender` |
| 기관(학교) 참여 행 등 회원이 없는 행 | `null` |

- 탈퇴·미존재 회원이면 `null`.

### ③ 개인정보 마스킹

- 개인 신청 상세 API는 마스킹 레벨과 관계없이 `birthDate`를 원문으로 내려준다. 목록도 **같은 정책(원문)** 을 따르라.
- 목록 응답의 다른 PII(`phone`, `email`, `homeAddressSummary`)에 마스킹 규칙이 적용되어 있고,
  생년월일도 목록에서는 마스킹해야 한다는 정책이 있다면 **임의로 결정하지 말고 보고에 명시**하라.
  (인증서 발급에는 원문이 필요하므로 이 경우 FE는 기존 상세 조회 보강을 유지한다.)

### ④ 성능

- 목록 SQL에 `LEFT JOIN`으로 붙여라. 행마다 회원·스냅샷을 단건 조회하지 마라 (N+1 금지).
- 이미 `member`를 조인하고 있다면 재사용하라.

### ⑤ OpenAPI 반영

- 두 필드에 `description` 추가
  - `birthDate`: `참여자 생년월일 (개인 신청 스냅샷 우선, 없으면 회원 정보). 회원 없는 행은 null`
  - `gender`: `참여자 성별 원시 코드 (스냅샷 우선, 없으면 회원 정보). 회원 없는 행은 null`
- 응답 예시에 값 포함

---

## 하지 말 것

- 기존 필드 삭제·이름 변경·타입 변경 금지
- path·쿼리 파라미터·요청 스키마 변경 금지
- 생년월일을 별도 API로 분리하지 말 것 (목록 응답에 포함)
- 개인 신청 상세(`IndividualApplicationDetailResponse`) 로직 변경 금지
- 참여자 목록 정렬·필터·페이지네이션 동작 변경 금지

## 보고 형식

1. 변경 파일과 SQL/RowMapper 변경 위치
2. ② 참여자 유형별 실제 매핑 결과 (개인 / 강사·봉사자 / 기관 행)
3. ③ 마스킹 적용 여부와 근거
4. 재현 데이터 확인: `programId=186048` 참여자 `이건희일반`의 `birthDate`·`gender` 값이
   같은 회원의 `GET /api/admin/individual-applications/{sourceApplicationId}` → `profile.birthDate`·`profile.gender`와 일치하는지
5. 테스트 이름 (스냅샷 우선, 스냅샷 없을 때 회원 값, 회원 없는 행 `null`, 목록 쿼리 수 증가 없음)
6. `docs/frontend` handoff (추가 필드 표 + null 규칙)

---

## FE 후속 작업 (참고, 백엔드 작업 아님)

- OpenAPI 재동기화 → orval 재생성 (`ParticipantListItemResponse`에 `birthDate`, `gender`)
- `apps/cms/src/features/program/general/api/adapters/general-applications-adapters.ts`
  `mapParticipantToParticipatingIndividualRow`의 `detail`에
  `birthDate: dto.birthDate ?? undefined`, `gender: toGenderLabelOrRaw(dto.gender)` 매핑
- `apps/cms/src/features/program/general/lib/participating-individual-participant-certificate.ts`
  `hydrateParticipatingParticipantCertificateProfile`는 목록에 생년월일이 있으면 자동으로 추가 조회를 건너뛴다.
  백엔드 반영이 확인되면 제거해도 된다.
