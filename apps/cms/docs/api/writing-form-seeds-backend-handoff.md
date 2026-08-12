# 작성 양식 시드 JSON — 백엔드 전달 (registration-general 제외)

`GET/PUT /api/admin/form-template-versions/{versionId}` 시드·초기 DRAFT용입니다.

**발급 양식 14종** 시드: [issuance-form-seeds-backend-handoff.md](./issuance-form-seeds-backend-handoff.md) (`exportIssuanceFormTemplateSeeds`)

## 제외

- `registration-general` (일반 프로그램 등록 폼) — 별도: [form-template-seeds/registration-general.json](./form-template-seeds/registration-general.json)

## 저장 규칙

| 필드 | 설명 |
|------|------|
| `schemaJson` | `WritingFormDraft` object → API 저장 시 **JSON string** (이중 stringify 금지) |
| `extensionJson` | `{ overlay, editorState, uiState }` object → JSON string |
| `settingsJson` | 인증서·파일 설정. 대부분 `null`. `agreement-crime` 포함 schema-only |

### Payload 종류

| 코드 | body 필드 |
|------|-----------|
| **A** | `schemaJson` (+ 선택 `extensionJson` 빈 object) |
| **C** | `schemaJson` + `extensionJson` (UJAT overlay/editorState) |
| **D** | `schemaJson` 빈 paragraphs 또는 `settingsJson` (agreement-crime) |

상세 계약: [form-template-json-contract.md](./form-template-json-contract.md)

## 목록 (31종)

### 등록 양식 (3)

| templateCode | templateName | Payload | 시드 JSON | 단락 수 |
|--------------|--------------|---------|-----------|--------:|
| `registration-economy` | 1사1교 프로그램 등록 폼 | A | [registration-economy.json](./form-template-seeds/registration-economy.json) | 5 |
| `registration-ujat` | UJAT 프로그램 등록 폼 | C | [registration-ujat.json](./form-template-seeds/registration-ujat.json) | 7 |
| `registration-trained-teachers` | 교육받은 교사 프로그램 등록 폼 | A | [registration-trained-teachers.json](./form-template-seeds/registration-trained-teachers.json) | 5 |

### 모집 양식 (9)

| templateCode | templateName | Payload | 시드 JSON | 단락 수 |
|--------------|--------------|---------|-----------|--------:|
| `recruitment-participant-school` | 일반_참여 기관 모집 폼 | A | [recruitment-participant-school.json](./form-template-seeds/recruitment-participant-school.json) | 2 |
| `recruitment-economy` | 1사1교_참여 기관 모집 폼 | A | [recruitment-economy.json](./form-template-seeds/recruitment-economy.json) | 2 |
| `recruitment-participant-individual` | 일반_참여자 모집 폼 | A | [recruitment-participant-individual.json](./form-template-seeds/recruitment-participant-individual.json) | 2 |
| `recruitment-instructor` | 공통_강사 모집 폼 | A | [recruitment-instructor.json](./form-template-seeds/recruitment-instructor.json) | 2 |
| `recruitment-volunteer` | 공통_봉사자 모집 폼 | A | [recruitment-volunteer.json](./form-template-seeds/recruitment-volunteer.json) | 3 |
| `recruitment-ujat-school` | UJAT_참여 기관 모집 폼 | C | [recruitment-ujat-school.json](./form-template-seeds/recruitment-ujat-school.json) | 2 |
| `recruitment-ujat-volunteer` | UJAT_봉사자 모집 폼 | C | [recruitment-ujat-volunteer.json](./form-template-seeds/recruitment-ujat-volunteer.json) | 3 |
| `recruitment-gemini-visiting-training` | Gemini_찾아가는 연수 모집 폼 | A | [recruitment-gemini-visiting-training.json](./form-template-seeds/recruitment-gemini-visiting-training.json) | 2 |
| `recruitment-trained-teachers` | 교육받은 교사_참여 기관 모집 폼 | A | [recruitment-trained-teachers.json](./form-template-seeds/recruitment-trained-teachers.json) | 2 |

### 신청 양식 (10)

| templateCode | templateName | Payload | 시드 JSON | 단락 수 |
|--------------|--------------|---------|-----------|--------:|
| `application-participant-school` | 일반_참여 기관 신청 폼 | A | [application-participant-school.json](./form-template-seeds/application-participant-school.json) | 7 |
| `application-participant-individual` | 일반_참여자 신청 폼 | A | [application-participant-individual.json](./form-template-seeds/application-participant-individual.json) | 5 |
| `application-instructor` | 공통_강사 신청 폼 | A | [application-instructor.json](./form-template-seeds/application-instructor.json) | 4 |
| `application-volunteer` | 공통_봉사자 신청 폼 | A | [application-volunteer.json](./form-template-seeds/application-volunteer.json) | 6 |
| `application-economy` | 1사1교_참여 기관 신청 폼 | A | [application-economy.json](./form-template-seeds/application-economy.json) | 9 |
| `application-trained-teachers` | 교육받은 교사_참여 기관 신청 폼 | A | [application-trained-teachers.json](./form-template-seeds/application-trained-teachers.json) | 4 |
| `application-gemini-visiting-training-instructor` | Gemini_찾아가는 연수 강사 신청 폼 | A | [application-gemini-visiting-training-instructor.json](./form-template-seeds/application-gemini-visiting-training-instructor.json) | 2 |
| `application-gemini-visiting-training-school` | Gemini_찾아가는 연수 참여 기관 신청 폼 | A | [application-gemini-visiting-training-school.json](./form-template-seeds/application-gemini-visiting-training-school.json) | 6 |
| `application-ujat-school` | UJAT_참여 기관 신청 폼 | C | [application-ujat-school.json](./form-template-seeds/application-ujat-school.json) | 8 |
| `application-ujat-volunteer` | UJAT_봉사자 신청 폼 | C | [application-ujat-volunteer.json](./form-template-seeds/application-ujat-volunteer.json) | 9 |

### 설문 양식 (4)

| templateCode | templateName | Payload | 시드 JSON | 단락 수 |
|--------------|--------------|---------|-----------|--------:|
| `survey-default` | 설문조사 | A | [survey-default.json](./form-template-seeds/survey-default.json) | 7 |
| `survey-student` | 만족도조사 (학생용) | A | [survey-student.json](./form-template-seeds/survey-student.json) | 7 |
| `survey-teacher` | 만족도조사 (교사용) | A | [survey-teacher.json](./form-template-seeds/survey-teacher.json) | 7 |
| `survey-admin` | 강의평가 (관리자용) | A | [survey-admin.json](./form-template-seeds/survey-admin.json) | 7 |

### 동의 양식 (5)

| templateCode | templateName | Payload | 시드 JSON | 단락 수 |
|--------------|--------------|---------|-----------|--------:|
| `agreement-third-party` | 지급조서 사전 동의서 | A | [agreement-third-party.json](./form-template-seeds/agreement-third-party.json) | 14 |
| `agreement-crime` | 성범죄 경력조회 동의서 | D | [agreement-crime.json](./form-template-seeds/agreement-crime.json) | 0 |
| `agreement-notice` | 행정정보 공동이용 사전 동의서 | A | [agreement-notice.json](./form-template-seeds/agreement-notice.json) | 9 |
| `agreement-expense` | 교육진행자 동의 서약서 | A | [agreement-expense.json](./form-template-seeds/agreement-expense.json) | 9 |
| `agreement-portrait` | 초상권 수집/이용 동의 | A | [agreement-portrait.json](./form-template-seeds/agreement-portrait.json) | 8 |

## 단락 id 요약

### `registration-economy` — 1사1교 프로그램 등록 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `program-registration-seed-basic-info` | single_item | horizontal_table | 기본 정보 |
| `program-registration-seed-business-kpi` | single_item | horizontal_table | 사업 KPI 목표 |
| `program-registration-seed-wage-info` | single_item | horizontal_table | 임금 정보 |
| `program-registration-seed-education-curriculum` | single_item | horizontal_table | 교육 진행 (커리큘럼) |
| `program-registration-seed-education-schedule-settings` | single_item | horizontal_table | 교육 진행 일정 설정 |

### `registration-ujat` — UJAT 프로그램 등록 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `ujat-reg-basic` | single_item | horizontal_table | 기본 정보 |
| `ujat-reg-business-kpi` | single_item | horizontal_table | 사업 KPI 목표 |
| `ujat-reg-payment` | single_item | horizontal_table | 임금 정보 |
| `ujat-reg-first-half-education-schedule` | single_item | horizontal_table | 상반기 교육 일정 |
| `ujat-reg-second-half-education-schedule` | single_item | horizontal_table | 하반기 교육 일정 |
| `ujat-reg-education-schedule-settings` | single_item | horizontal_table | 교육 진행 일정 설정 |
| `ujat-reg-education-class-capacity-by-region` | single_item | horizontal_table | 지역 별 교육 진행 가능 학급 및 봉사단 수 |

### `registration-trained-teachers` — 교육받은 교사 프로그램 등록 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `program-registration-seed-basic-info` | single_item | horizontal_table | 기본 정보 |
| `program-registration-seed-business-kpi` | single_item | horizontal_table | 사업 KPI 목표 |
| `program-registration-seed-type-settings` | single_item | horizontal_table | 프로그램 유형 설정 |
| `program-registration-seed-education-curriculum` | single_item | horizontal_table | 교육 진행 (커리큘럼) |
| `program-registration-seed-education-schedule-settings` | single_item | horizontal_table | 교육 진행 일정 설정 |

### `recruitment-participant-school` — 일반_참여 기관 모집 폼

> UJAT 모집 overlay는 extensionJson.overlay에 저장(초기 {}).

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `applicant-recruit-institution-seed-recruit-info` | single_item | horizontal_table | 참여자 모집 정보 |
| `applicant-recruit-institution-seed-detail-info` | single_item | horizontal_table | 상세 정보 |

### `recruitment-economy` — 1사1교_참여 기관 모집 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `economy-recruit-institution-seed-recruit-info` | single_item | horizontal_table | 참여 기관 모집 정보 |
| `economy-recruit-institution-seed-detail-info` | single_item | horizontal_table | 상세 정보 |

### `recruitment-participant-individual` — 일반_참여자 모집 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `applicant-recruit-individual-seed-recruit-info` | single_item | horizontal_table | 참여자 모집 정보 |
| `applicant-recruit-individual-seed-detail-info` | single_item | horizontal_table | 상세 정보 |

### `recruitment-instructor` — 공통_강사 모집 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `recruit-form-instructor-seed-recruit-info` | single_item | horizontal_table | 강사 모집 정보 |
| `recruit-form-instructor-seed-detail-info` | single_item | horizontal_table | 상세 정보 |

### `recruitment-volunteer` — 공통_봉사자 모집 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `recruit-form-volunteer-seed-recruit-info` | single_item | horizontal_table | 봉사자 모집 정보 |
| `recruit-form-volunteer-seed-detail-info` | single_item | horizontal_table | 상세 정보 |
| `recruit-form-volunteer-seed-interview-schedule` | single_item | horizontal_table | 면접 진행 가능 일정 |

### `recruitment-ujat-school` — UJAT_참여 기관 모집 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `ujat-recruit-institution-seed-recruit-info` | single_item | horizontal_table | 참여자 모집 정보 |
| `ujat-recruit-institution-seed-detail-info` | single_item | horizontal_table | 참여자 상세 정보 |

### `recruitment-ujat-volunteer` — UJAT_봉사자 모집 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `ujat-recruit-form-volunteer-seed-recruit-info` | single_item | horizontal_table | 봉사자 모집 정보 |
| `ujat-recruit-form-volunteer-seed-detail-info` | single_item | horizontal_table | 상세 정보 |
| `ujat-recruit-form-volunteer-seed-interview-schedule` | single_item | horizontal_table | 면접 진행 가능 일정 |

### `recruitment-gemini-visiting-training` — Gemini_찾아가는 연수 모집 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `gemini-vt-recruit-seed-recruit-info` | single_item | horizontal_table | 참여 기관 모집 정보 |
| `gemini-vt-recruit-seed-detail-info` | single_item | horizontal_table | 상세 정보 |

### `recruitment-trained-teachers` — 교육받은 교사_참여 기관 모집 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `trained-teachers-recruit-institution-seed-recruit-info` | single_item | horizontal_table | 참여 기관 모집 정보 |
| `trained-teachers-recruit-institution-seed-detail-info` | single_item | horizontal_table | 상세 정보 |

### `application-participant-school` — 일반_참여 기관 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `program-application-institution-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `program-application-institution-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `program-application-institution-seed-basic-info` | single_item | horizontal_table | 기본 정보 |
| `program-application-institution-seed-guidance` | single_item | horizontal_table | 안내 사항 |
| `program-application-institution-seed-sex-offense-consent-submission` | single_item | horizontal_table | 성범죄 경력 조회 동의서 제출 요청 |
| `program-application-institution-seed-sex-offense-consent-inquiry` | single_item | horizontal_table | 성범죄 경력 조회 동의서 조회 방식 |
| `program-application-institution-seed-schedule` | single_item | multiple_choice | 진행 희망 교육 일정 |

### `application-participant-individual` — 일반_참여자 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `program-participant-application-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `program-participant-application-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `program-participant-application-seed-self-intro` | single_item | short_essay | 자기소개 및 지원동기 |
| `program-participant-application-seed-team-info` | single_item | horizontal_table | 팀 정보 |
| `program-participant-application-seed-schedule` | single_item | multiple_choice | 진행 희망 교육 일정 |

### `application-instructor` — 공통_강사 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `program-instructor-application-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `program-instructor-application-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `program-instructor-application-seed-crime-record` | single_item | horizontal_table | 성범죄 경력 조회서 제출 |
| `program-instructor-application-seed-available-schedule` | single_item | horizontal_table | 강의 진행 가능 일정 |

### `application-volunteer` — 공통_봉사자 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `program-volunteer-application-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `program-volunteer-application-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `program-volunteer-application-seed-ja-experience` | single_item | multiple_choice | JA 봉사 프로그램 진행 경험 여부 |
| `program-volunteer-application-seed-previous-ja-program` | single_item | horizontal_table | 이전 참여 JA 봉사 프로그램 |
| `program-volunteer-application-seed-free-text-items` | single_item | horizontal_table | 자유 작성 항목 |
| `program-volunteer-application-seed-interview-schedule` | single_item | horizontal_table | 면접 진행 가능 일정 |

### `application-economy` — 1사1교_참여 기관 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `program-application-economy-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `program-application-economy-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `program-application-economy-seed-basic-info` | single_item | horizontal_table | 기본 정보 |
| `program-application-economy-seed-guidance` | single_item | horizontal_table | 안내 사항 |
| `program-application-economy-seed-sex-offense-consent-submission` | single_item | horizontal_table | 성범죄 경력 조회 동의서 제출 요청 |
| `program-application-economy-seed-sex-offense-consent-inquiry` | single_item | horizontal_table | 성범죄 경력 조회 동의서 조회 방식 |
| `program-application-economy-seed-lesson-reply` | single_item | horizontal_table | 결연 금융 회사명 |
| `program-application-economy-seed-education-experience` | single_item | horizontal_table | 전년도 1사1교 경제금융교육 진행 여부 |
| `program-application-economy-seed-preferred-schedule` | single_item | horizontal_table | 진행 희망 교육 일정 |

### `application-trained-teachers` — 교육받은 교사_참여 기관 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `program-application-trained-teachers-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `program-application-trained-teachers-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `program-application-trained-teachers-seed-basic-info` | single_item | horizontal_table | 기본 정보 |
| `program-application-trained-teachers-seed-preferred-schedule` | single_item | horizontal_table | 진행 희망 교육 일정 |

### `application-gemini-visiting-training-instructor` — Gemini_찾아가는 연수 강사 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `gemini-vt-instructor-seed-available-schedule` | single_item | horizontal_table | 강의 진행 가능 일정 |
| `gemini-vt-instructor-seed-official-document` | single_item | horizontal_table | 연수 공문 |

### `application-gemini-visiting-training-school` — Gemini_찾아가는 연수 참여 기관 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `gemini-vt-inst-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `gemini-vt-inst-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `gemini-vt-inst-seed-portrait` | single_item | horizontal_table | 초상권 수집·이용 동의 |
| `gemini-vt-inst-seed-training-info` | single_item | horizontal_table | 연수 정보 |
| `gemini-vt-inst-seed-contact` | single_item | horizontal_table | 담당 교사 정보 |
| `gemini-vt-inst-seed-preferred-schedule` | single_item | horizontal_table | 진행 희망 교육 일정 |

### `application-ujat-school` — UJAT_참여 기관 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `ujat-program-application-institution-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `ujat-program-application-institution-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `ujat-program-application-institution-seed-application-region` | single_item | horizontal_table | 신청 지역 |
| `ujat-program-application-institution-seed-basic-info` | single_item | horizontal_table | 기본 정보 |
| `ujat-program-application-institution-seed-grade-application-info` | single_item | horizontal_table | 학년 별 신청 정보 |
| `ujat-program-application-institution-seed-grade-class-time` | single_item | horizontal_table | 학년 별 수업 시간 |
| `ujat-program-application-institution-seed-preferred-education-schedule` | single_item | horizontal_table | 진행 희망 교육 일정 |
| `ujat-program-application-institution-seed-submit-confirmation` | single_item | multiple_choice | 상기 내용 모두 확인하였으며 현재 답변으로 제출합니다. |

### `application-ujat-volunteer` — UJAT_봉사자 신청 폼

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `ujat-program-application-volunteer-seed-personal-info` | single_item | horizontal_table | 개인정보 수집·이용 |
| `ujat-program-application-volunteer-seed-third-party` | single_item | horizontal_table | 개인정보 제3자 정보 제공·이용 동의 |
| `ujat-program-application-volunteer-seed-basic-info` | single_item | horizontal_table | 기본 정보 |
| `ujat-program-application-volunteer-seed-previous-term` | single_item | horizontal_table | 이전 UJAT 활동 기수 |
| `ujat-program-application-volunteer-seed-preferred-region` | single_item | horizontal_table | 희망 교육 활동 지역 |
| `ujat-program-application-volunteer-seed-education-experience` | single_item | horizontal_table | 교육 진행 경험 여부 |
| `ujat-program-application-volunteer-seed-interview-schedule` | single_item | horizontal_table | 면접 진행 가능 일정 |
| `ujat-program-application-volunteer-seed-free-text-items` | single_item | horizontal_table | 자유 작성 항목 |
| `ujat-program-application-volunteer-seed-submit-confirmation` | single_item | multiple_choice | 상기 내용 모두 확인하였으며 현재 답변으로 제출합니다. |

### `survey-default` — 설문조사

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `survey-paragraph-title` | description | survey_title_with_period |  |
| `survey-paragraph-user` | single_item | user_info | 설문자 정보 |
| `survey-paragraph-score` | single_item | scale_type | 오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요? |
| `survey-paragraph-score-2` | single_item | scale_type | 프로그램 전반적인 프로세스에 대해 명확히 이해했나요? |
| `survey-paragraph-subjective` | single_item | short_essay | 오늘 강의에서 배운 점, 기억나는 점, 좋았던 점 등을 작성해 주세요. |
| `survey-paragraph-subjective-2` | single_item | short_essay | 기타 의견이 있다면 작성해 주세요. |
| `survey-paragraph-closing` | description | closing |  |

### `survey-student` — 만족도조사 (학생용)

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `survey-paragraph-title` | description | survey_title_with_period |  |
| `survey-paragraph-user` | single_item | user_info | 설문자 정보 |
| `survey-paragraph-score` | single_item | scale_type | 오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요? |
| `survey-paragraph-score-2` | single_item | scale_type | 프로그램 전반적인 프로세스에 대해 명확히 이해했나요? |
| `survey-paragraph-subjective` | single_item | short_essay | 오늘 강의에서 배운 점, 기억나는 점, 좋았던 점 등을 작성해 주세요. |
| `survey-paragraph-subjective-2` | single_item | short_essay | 기타 의견이 있다면 작성해 주세요. |
| `survey-paragraph-closing` | description | closing |  |

### `survey-teacher` — 만족도조사 (교사용)

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `survey-paragraph-title` | description | survey_title_with_period |  |
| `survey-paragraph-user` | single_item | user_info | 설문자 정보 |
| `survey-paragraph-score` | single_item | scale_type | 오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요? |
| `survey-paragraph-score-2` | single_item | scale_type | 프로그램 전반적인 프로세스에 대해 명확히 이해했나요? |
| `survey-paragraph-subjective` | single_item | short_essay | 오늘 강의에서 배운 점, 기억나는 점, 좋았던 점 등을 작성해 주세요. |
| `survey-paragraph-subjective-2` | single_item | short_essay | 기타 의견이 있다면 작성해 주세요. |
| `survey-paragraph-closing` | description | closing |  |

### `survey-admin` — 강의평가 (관리자용)

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `survey-paragraph-title` | description | survey_title_with_period |  |
| `survey-paragraph-user` | single_item | user_info | 설문자 정보 |
| `survey-paragraph-score` | single_item | scale_type | 오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요? |
| `survey-paragraph-score-2` | single_item | scale_type | 프로그램 전반적인 프로세스에 대해 명확히 이해했나요? |
| `survey-paragraph-subjective` | single_item | short_essay | 오늘 강의에서 배운 점, 기억나는 점, 좋았던 점 등을 작성해 주세요. |
| `survey-paragraph-subjective-2` | single_item | short_essay | 기타 의견이 있다면 작성해 주세요. |
| `survey-paragraph-closing` | description | closing |  |

### `agreement-third-party` — 지급조서 사전 동의서

> 발급 document-payment-order-pre-consent와 동일 schema, templateCode만 분리.

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `payment-statement-pre-consent-seed-title` | description | survey_title_with_period |  |
| `payment-statement-pre-consent-seed-intro` | single_item | agreement_explanation_text | 개인정보 수집‧이용 및 제공 동의서 |
| `payment-statement-pre-consent-seed-p1-collection` | single_item | horizontal_table | 개인정보 수집·이용 |
| `payment-statement-pre-consent-seed-p2-rrn-collection` | single_item | horizontal_table | 고유식별번호(주민등록번호) 수집·이용 |
| `payment-statement-pre-consent-seed-p3-third-party` | single_item | horizontal_table | 개인정보 제3자 제공·이용 |
| `payment-statement-pre-consent-seed-p4-rrn-third-party` | single_item | horizontal_table | 고유식별번호 제3자 제공·이용 |
| `payment-statement-pre-consent-seed-mid-consent-line` | single_item | agreement_explanation_text |  |
| `payment-statement-pre-consent-seed-mid-date` | description | system | 날짜 유형 |
| `payment-statement-pre-consent-seed-mid-signature` | description | system | 서명란 유형 |
| `payment-statement-pre-consent-seed-payment-record` | single_item | vertical_table | 지급조서 |
| `payment-statement-pre-consent-seed-final-confirm` | single_item | agreement_explanation_text |  |
| `payment-statement-pre-consent-seed-tail-date` | description | system | 날짜 유형 |
| `payment-statement-pre-consent-seed-tail-signature` | description | system | 서명란 유형 |
| `payment-statement-pre-consent-seed-closing-recipient` | description | closing |  |

### `agreement-crime` — 성범죄 경력조회 동의서

> 정적 A4 문서 + 파일 교체 UI. schemaJson paragraphs 빈 배열 허용.

_(paragraphs 없음)_

### `agreement-notice` — 행정정보 공동이용 사전 동의서

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `agreement-notice-title` | description | survey_title_with_period |  |
| `agreement-notice-institution` | single_item | agreement_explanation_text | 이용기관 명칭 |
| `agreement-notice-purpose` | single_item | agreement_explanation_text | 이용사무(이용목적) |
| `agreement-notice-table` | single_item | horizontal_table | 공동이용 행정정보(구비서류) |
| `agreement-notice-consent-static` | description | static_description_lines | 정보주체(본인) 동의사항 |
| `agreement-notice-subject` | single_item | short_essay | 대상자 본인 |
| `agreement-notice-confirmation-closing` | description | closing |  |
| `agreement-notice-system-date` | description | system | 날짜 유형 |
| `agreement-notice-system-signature` | description | system | 서명란 유형 |

### `agreement-expense` — 교육진행자 동의 서약서

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `agreement-expense-pledge-title` | description | survey_title_with_period |  |
| `agreement-expense-pledge-intro` | single_item | agreement_explanation_text |  |
| `agreement-expense-pledge-clause-1` | single_item | multiple_choice | 아동·청소년 보호와 성범죄 예방 |
| `agreement-expense-pledge-clause-2` | single_item | multiple_choice | 종교적 정치적 중립성 유지 |
| `agreement-expense-pledge-clause-3` | single_item | multiple_choice | 개인정보 보호 |
| `agreement-expense-pledge-clause-4` | single_item | multiple_choice | 품위 유지 및 성실한 교육 수행 |
| `agreement-expense-pledge-violation-closing` | description | closing |  |
| `agreement-expense-pledge-system-date` | description | system | 날짜 유형 |
| `agreement-expense-pledge-system-signature` | description | system | 서명란 유형 |

### `agreement-portrait` — 초상권 수집/이용 동의

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `agreement-portrait-title` | description | survey_title_with_period |  |
| `agreement-portrait-intro` | single_item | agreement_explanation_text |  |
| `agreement-portrait-personal-consent-table` | single_item | vertical_table | 개인정보 및 초상권 수집·이용 동의 |
| `agreement-portrait-delegated-consent-table` | single_item | vertical_table | 개인정보처리위탁 제공 동의 |
| `agreement-portrait-usage-table` | single_item | vertical_table | 초상권 제공·이용 동의 |
| `agreement-portrait-confirmation-closing` | description | closing |  |
| `agreement-portrait-system-date` | description | system | 날짜 유형 |
| `agreement-portrait-system-signature` | description | system | 서명란 유형 |

---

_Generated from FE draft factories (`export-writing-form-template-seeds.ts`)._
