# 양식 draft mock→API 전환 — 프론트 수정 및 BE 핸드오프

작성일: 2026-07-20

## 배경

템플릿 관리·프로그램 상세 신청정보 탭에서 draft 로드 전에 FE 시드(mock)가 먼저 그려지고, API 응답 후 실제 양식으로 바뀌는 깜빡임이 있었습니다. 특히 신청 양식 에디터는 초기 state가 **항상 개인 신청 mock**이라 학교/강사/봉사자 탭에서도 잠깐 다른 양식이 보였습니다.

## FE에서 해결한 내용 (이번 변경)

1. draft 로드 전 **빈 draft + `isDraftLoading`** 유지
2. 로드 완료 전 **`FormDraftLoading` 스피너** 표시 (잘못된 mock UI 비노출)
3. API 성공 → API `schemaJson` 표시 / 실패·없음 → variant별 FE 시드 fallback
4. 적용 표면
   - 템플릿 관리 작성 양식 (`TemplatePreviewModal`)
   - 발급 양식 일부 (지급조서·사전동의·정산신청)
   - 프로그램 상세 신청정보 미리보기
   - 신청 양식 수정 모달
   - 일반·UJAT 프로그램 등록 풀페이지

관련 훅: `useProgramParticipantApplicationEditor`, `useProgramRegistrationEditor`, `useWritingFormEditorWithUserPreview`, `useUjatProgramRegistrationEditor`, 지급조서·정산 발급 에디터 등.

## BE에 전달·확인이 필요한 사항

### 1. 신청·등록 양식 시드 paragraph id 일치 (P0)

FE는 일부 단락을 **paragraph id**로 하드코딩 UI에 매핑합니다. API `schemaJson.paragraphs[].id`가 FE 시드 id와 다르면:

- 카드 제목/순서는 API
- 본문은 제네릭 표이거나 FE 전용 UI와 섞여 **템플릿 관리와 프로그램 상세 내용이 달라 보임**

**요청:** 아래 templateCode의 DRAFT/PUBLISHED `schemaJson`이 FE 시드 JSON과 **동일 id·순서**인지 검증·재시드.

| templateCode | FE 시드 |
|--------------|---------|
| `application-participant-school` | [application-participant-school.json](./form-template-seeds/application-participant-school.json) |
| `application-participant-individual` | [application-participant-individual.json](./form-template-seeds/application-participant-individual.json) |
| `application-instructor` | [application-instructor.json](./form-template-seeds/application-instructor.json) |
| `application-volunteer` | [application-volunteer.json](./form-template-seeds/application-volunteer.json) |
| `registration-general` | [registration-general.json](./form-template-seeds/registration-general.json) |

학교 신청 예 (`application-participant-school`):

- `program-application-institution-seed-personal-info`
- `program-application-institution-seed-third-party`
- `program-application-institution-seed-basic-info`
- `program-application-institution-seed-guidance`
- `program-application-institution-seed-sex-offense-consent-submission`
- `program-application-institution-seed-sex-offense-consent-inquiry`
- `program-application-institution-seed-schedule`

### 2. 표(table) 단락 본문은 schemaJson이 SSOT

개인정보 수집·제3자 동의 등 **horizontal_table field** 단락은 FE가 `schemaJson`의 `columnHeaders` / `fieldDataRows` / `bottomText`를 그대로 렌더합니다.

**요청:**

- 시드에 넣은 동의 문구·수집 항목이 운영 정책과 맞는지 확정
- 임의 id·빈 paragraphs로 올리면 FE가 시드로 보정하거나(빈 경우만) 깨진 표를 보여 줌
- `paragraphs: []`만 오면 FE가 로컬 시드로 보정함 → **의도적으로 빈 양식이면** `EMPTY_PARAGRAPHS_ALLOWED`에 넣는 계약이 필요 (현재는 인증서·범죄동의 등만 허용)

### 3. 하드코딩 DetailInfoForm 단락 (참고)

`basic-info`, `guidance`, 성범죄 동의 등 id가 맞으면 FE 전용 UI를 쓰고 **표 cell 값은 무시**합니다.  
제목(`paragraphTitle`)·필수 여부·단락 존재 여부만 API에서 제어 가능합니다.  
필드 라벨/옵션을 API로 바꾸려면 FE 컴포넌트 변경 또는 schema 기반 렌더로 전환이 필요합니다 (별도 스펙).

### 4. 버전 조회 성능·캐시

FE는 모달/탭 오픈마다 `resolveTemplateVersionId` → `GET .../form-template-versions/{id}`를 호출합니다.

**요청 (선택):**

- 목록 응답에 `latestVersionId`가 안정적으로 포함되는지
- 동일 templateCode 연속 오픈 시 304/ETag 또는 짧은 TTL 캐시 가능 여부

### 5. 완료 조건 (BE + FE 합동)

- [ ] 위 templateCode 시드 id가 FE 시드와 1:1 일치
- [ ] 템플릿 관리 편집 화면과 프로그램 상세 신청정보 미리보기의 단락 구성이 동일
- [ ] draft 로드 중 mock 양식이 한 프레임도 보이지 않음 (FE 스피너)
- [ ] API 장애 시 FE 시드 fallback으로 편집 가능 (현행 유지)

## 관련 문서

- [form-template-json-contract.md](./form-template-json-contract.md)
- [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md)
- [issuance-form-api-follow-up.md](./issuance-form-api-follow-up.md)
