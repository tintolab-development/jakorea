# CMS 숫자 입력 UX 적용 후보 감사

> 기준 규칙: [`numeric-input-ux.mdc`](../../.cursor/rules/design/numeric-input-ux.mdc)  
> 조사 기준일: 2026-07-15  
> 적용 결과: CMS 전역 공통 컴포넌트 도입과 직접 숫자 입력 마이그레이션 완료. 아래 후보 목록은 적용 전 감사 스냅샷이며, 현재 결과는 「이번 적용 결과」를 기준으로 한다.

## 상태 표기

각 항목은 마이그레이션 PR에서 체크박스와 상태를 함께 갱신한다.

- `- [ ] 상태: 후보` — 정적 검색으로 발견, 의미/API 계약 확인 전
- `- [ ] 상태: 확인 완료` — 값 의미·저장 타입·범위 확인, 구현 대기
- `- [ ] 상태: 진행 중` — 코드 또는 테스트 변경 중
- `- [x] 상태: 완료` — 구현·테스트·API payload 확인 완료
- `- [x] 상태: 제외` — 표시 전용·자동생성·의도적 예외 등 사유 기록
- `- [!] 상태: 보류` — 백엔드 계약/기획 확인 필요

완료 처리 시 같은 항목에 PR/커밋, 검증한 화면, API 필드 타입을 덧붙인다.

## 이번 적용 결과

### 공통 기반

- [x] **완료** — `src/shared/lib/numeric-input.ts`
  - 정수·소수·금액·숫자형 문자열 sanitizer, blur 정규화, min/max/precision, 전각 숫자 붙여넣기와 천 단위 포맷을 공통화했다.
- [x] **완료** — `src/shared/ui/numeric-input.tsx`
  - `CmsNumericInput`의 `integer | decimal | currency | numericText` 모드, 모바일 키패드, 빈값/0 구분, 금액 caret 복원을 적용했다.
- [x] **완료** — `src/shared/ui/date-text-input.tsx`
  - `CmsDateTextInput`에 점진 `YYYY.MM.DD`, 실제 달력 검증, `YYYY.M.D`의 blur 0-padding, 8자리·전각 숫자 붙여넣기를 적용했다.
- [x] **완료** — `/design-system` Forms 및 Do/Don't
  - 숫자 모드별 라이브 데모와 금지 패턴, 본 Cursor rule 링크를 추가했다.

### 금액·소수

- [x] **완료** — 정산 제출·정산 항목: `features/settlement/ui/settlement-submit-modal.tsx`, `instructor-settlement-form.tsx`
- [x] **완료** — 정산 기준 설정 전 항목: `pages/settlement-management/settlement-item-setting-detail-modal.tsx`
- [x] **완료** — 프로그램 임금·강사비: `features/program/shared/ui/program-detail/project-info/common-info/program-wage-info-section.tsx`, `features/program/shared/ui/detail-modal/components/instructor-fee-approval-modal.tsx`, `features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-fee-fields.tsx`
- [x] **완료** — 거리·점수·평점: 정산 거리, 일반/UJAT 면접 평가, 강사 평점에 기존 min/max/precision을 유지한 decimal/integer 모드를 적용했다.

### 수량·정수

- [x] **완료** — 일반/shared KPI·모집·신청: `program-kpi-target-section.tsx`, `common-info-view.tsx`, `participant-recruitment-info-view.tsx`, `institutions-schema.tsx`, 기관/개인 신청 상세 편집
- [x] **완료** — UJAT: KPI, 지역 정원, 신청 학급/학생 수, 일정 산정 예상값, 학급 추가/변경, 봉사단 기수
- [x] **완료** — Gemini·1사1교·trained-teachers: 최소 수강 인원, 학생/팀원 수, 모집 한도, 희망 교시를 유형별 기존 state/API 계약을 유지해 전환
- [x] **완료** — 기타: 동적 폼 number, 학교 신청, 프로그램 레거시 폼, 교재 키트 수량, 게시 카테고리 순서, 파일 크기, 강의보고 총 인원

### 날짜·숫자형 식별자

- [x] **완료** — 생년월일: 관리자 가입 2종, 학생 추가/명단 인라인 편집, 회원 기본정보 전체/강사, 동적 폼 날짜
- [x] **완료** — 주민등록번호·계좌번호: 지급조서 기본정보, 강사/개인 회원 등록, 강사 추가, 회원 생성, 강사 상세
- [x] **완료** — 기수·학급 번호: UJAT 활동 기수와 변경 학급 번호를 `numericText`로 유지해 선행 0을 보존

### 최종 잔여·의도적 예외

- [x] **제외** — `features/certificate-template/ui/certificate-text-fields-editor.tsx`
  - X/Y 좌표는 증감·직접 산술 조작이 핵심인 편집 도구라 `InputNumber` 2개를 유지한다.
- [x] **제외** — 전화번호·기간 설명·검증번호 등 계약상 숫자 전용임이 확인되지 않은 문자열
  - `+`, 하이픈, 내선, 문장형 기간 또는 영숫자 코드 가능성을 보존한다. 의미가 확정되기 전 digits-only로 축소하지 않는다.
- [x] **제외** — generic short-essay의 placeholder만 생년월일인 항목
  - placeholder 추론으로 입력을 강제하지 않는다. 템플릿 schema에 date semantic type이 추가되면 `CmsDateTextInput`으로 연결한다.
- [x] **확인** — 자동생성 API/OpenAPI와 표시 전용 formatter는 수정하지 않았다.
- [x] **검색 결과** — CMS 소스의 `type="number"`는 0건, `InputNumber`는 위 좌표 편집기 2건만 남았다.

## 조사 범위와 제외

- 조사 대상: `apps/cms/src/**/*.{ts,tsx}`의 `type="number"`, `InputNumber`, `inputMode`, 숫자 sanitizer, 금액 formatter/parser, 6·8자리 날짜/식별자 입력.
- **자동생성 제외:** `apps/cms/src/shared/api/generated/**`, `apps/cms/openapi/**`는 직접 수정하지 않는다. DTO가 숫자 입력 계약과 충돌하면 adapter 또는 submit 경계 후보로 별도 등록한다.
- **표시 전용 제외:** `Statistic`, 테이블/카드 formatter, `toLocaleString`, 차트·미리보기·읽기 전용 점수/금액은 입력 마이그레이션에서 제외한다.
- 정적 검색 결과이므로 조건부 렌더, 공통 컴포넌트 내부, 동적 폼 schema에서 추가 후보가 나올 수 있다.

## 프로그램 유형 영향

| 유형 | 주요 후보 영역 | 영향 원칙 |
|---|---|---|
| 일반 | `features/program/general/**`, 일반 등록·신청·심사 | 일반 전용 파일에서 처리. `shared` 변경 시 다른 유형 회귀 확인 |
| UJAT | `features/program/ujat/**`, UJAT 신청 양식 | UJAT의 지역 정원·기수·학급 제약을 별도 확인 |
| 1사1교 | 현재 `general`의 `economy`/`overview`, `template/**/1c-1s/**` | 일반 기본 동작과 분리하고 1사1교 전용 최대/단위 확인 |
| Gemini | `features/program/gemini/**`, `template/**/gemini-*/**` | 모집/승인 플로우를 분리 검증 |
| trained-teachers | `features/program/trained-teachers/**`, `template/**/trained-teachers/**` | 일반·1사1교 템플릿 복제 변경으로 간주하지 않고 독립 검증 |

`features/program/shared/**` 또는 `features/template/**`의 공용 편집기를 바꾸면 일반/UJAT/1사1교/Gemini/trained-teachers 중 실제 import 대상을 확인하고 `variant`/`programType` 등으로 기본 동작을 격리한다.

## 금액(currency)

- [ ] **상태: 후보** — `apps/cms/src/features/settlement/ui/settlement-submit-modal.tsx`
  - 주유비·통행료·강사비·교통비 `InputNumber` formatter/parser.
  - `value ? ... : ''`, 빈 parser 결과를 0으로 바꾸는 경로를 점검한다.
  - 쉼표 표시와 raw 정수 payload, `0`과 미입력, 최대 금액, 키보드/붙여넣기를 테스트한다.
- [ ] **상태: 후보** — `apps/cms/src/features/settlement/ui/instructor-settlement-form.tsx`
  - 정산 항목 금액의 `InputNumber`; formatter와 `Number(...) || 0` parser가 빈 값을 0과 합치는지 확인한다.
  - 숙박비 disabled 분기와 필드 배열 삭제/재추가 시 값 보존을 함께 확인한다.
- [ ] **상태: 확인 완료** — `apps/cms/src/pages/settlement-management/settlement-item-setting-detail-modal.tsx`
  - `parseWonInput`, `handleIntOnly`, `inputMode="numeric"` 기반의 최대 한도·단순노무비·주휴수당 등.
  - 이미 text 입력 패턴을 사용하므로 공통 규칙 적합성(빈 값, caret, 붙여넣기, API raw)과 중복 구현 통합 가능성만 감사한다.
- [ ] **상태: 확인 완료** — `apps/cms/src/features/program/shared/ui/detail-modal/components/instructor-fee-approval-modal.tsx`
  - 강사비 입력은 `formatLectureFeeAmountInput`/`parseLectureFeeAmountDigits`를 사용한다.
  - shared 변경이 일반 및 재사용 프로그램 유형에 미치는 영향, blur/typing 중 쉼표 caret을 확인한다.
- [ ] **상태: 확인 완료** — `apps/cms/src/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-fee-fields.tsx`
  - 일반 프로그램 강사비 `suffix="원"` 입력.
  - formatter와 실제 value 형태, 빈 값/0, 제출 adapter의 number 변환을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/shared/ui/program-detail/project-info/common-info/program-wage-info-section.tsx`
  - 임금 정책 수치에 `type="number"` 사용.
  - 금액인지 정수 기준값인지 필드별 분류 후 공용 화면의 유형별 API 계약을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/registration-form/1c-1s/paragraphs/wage-info-paragraph.tsx`
  - 1사1교 강사비·장거리비 입력 UI.
  - 현재 placeholder의 최대 금액이 실제 validation인지, raw 저장 타입과 쉼표 표시를 확인한다.

## 정수·수량(integer/count)

- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/program-form.tsx`
  - 총 참가자 수, 회차 번호, 회차 정원 `type="number"` 및 RHF `valueAsNumber`.
  - 빈 값 `NaN`, 최소값(0/1), 회차 중복, 교재 자동 계산 연동을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields.tsx`
  - 총 학생 수 `type="number"`; 일반 신청 상세의 저장 타입과 최소 1 검증 대상.
- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/detail-modal/info/participant-recruitment-info-view.tsx`
  - 모집 인원 수치 `type="number"`; 일반과 1사1교 `economy/overview` 분기 영향을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/register-employee-volunteer-modal.tsx`
  - text + numeric + pattern + keydown 차단 조합.
  - 붙여넣기/IME/탐색 키를 보존하는지, 인원 0 허용 여부와 aria 오류 연결을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/shared/ui/program-detail/project-info/recruitment/schema/institutions-schema.tsx`
  - 기관 모집 수치 `type="number"`; shared이므로 실제 사용 유형과 기본값을 먼저 조사한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/shared/ui/program-detail/project-info/common-info/program-kpi-target-section.tsx`
  - KPI 목표 여러 필드의 `type="number"`.
  - 목표별 정수/소수 구분, 0 허용, 최대값 및 일반/UJAT/1사1교/Gemini 영향을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/ujat/ui/detail-modal/info/ujat-business-kpi-program-view.tsx`
  - UJAT KPI 목표의 optional non-negative integer.
  - `''`와 `0`의 controller 왕복, clamp 여부, UJAT 전용 스키마를 확인한다.
- [ ] **상태: 확인 완료** — `apps/cms/src/features/program/ujat/ui/detail-modal/application-institution/schedule-assign/estimation-table.tsx`
  - 예상 봉사자 수가 digits string으로 저장된다.
  - submit/API 경계에서 정수 변환, 빈 값, 상·하반기 독립 상태를 확인한다.
- [ ] **상태: 확인 완료** — `apps/cms/src/features/program/ujat/ui/detail-modal/progress/institutions/detail/add-class-modal.tsx`
  - 학생 수 sanitizer와 blur/submit parse가 분리되어 있다.
  - 학급 번호(식별 성격)와 학생 수(산술값)를 서로 다른 규칙으로 유지한다.
- [ ] **상태: 확인 완료** — `apps/cms/src/features/program/ujat/ui/detail-modal/progress/institutions/detail/change-class-modal.tsx`
  - 변경 학급 번호 digits 입력.
  - 학급 번호의 선행 0 정책과 최소 1 validation, paste/IME를 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/gemini/ui/recruitment/gemini-recruitment-institution-fields.tsx`
  - 최소 수강 인원에 `type="number"` + `inputMode`.
  - 별도 input string과 도메인 number의 동기화, 빈 값 재삭제 동작을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/application-form/gemini-institution/paragraphs/gemini-training-info-paragraph.tsx`
  - 학생 수에 `type="number"`와 digits sanitizer가 중복 적용된다.
  - Gemini 신청 양식 상태가 string인지 number인지 확정한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-grade-info-paragraph.tsx`
  - 총 학급 수 `type="number"`, 최대 40 clamp.
  - 사용자가 입력 중 갑자기 값이 바뀌는지와 0/빈 값 의미를 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/application-form/institution/paragraphs/institution-basic-info-paragraph.tsx`
  - 총 학생 수 `type="number"`; 템플릿 미리보기 상태인지 실제 제출 상태인지 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/recruit-form/institution/paragraphs/applicant-recruit-participant-info-paragraph.tsx`
  - 모집 인원 `type="number"`; 일반/1사1교 템플릿 variant 영향을 분리한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/application-form/individual/paragraphs/individual-team-info-paragraph.tsx`
  - 직접 입력 팀원 수 `type="number"`; select의 정해진 인원과 직접 입력 전환 시 빈 값/기존 값 정책 확인.
- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/detail-modal/applications/applicant-detail/individual-basic-info.tsx`
  - 팀원 수를 `String(draft.teamMemberCount)`로 number input에 전달.
  - 빈 draft가 `"undefined"`/0으로 변환되지 않는지와 저장 시 integer 검증을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/textbook/ui/textbook-kit-quantity-modal.tsx`
  - 교재 키트 수량 native `input type="number"`.
  - 0 허용, 휠/스피너, 최대 재고, mutation payload와 optimistic 상태를 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/application/ui/school-application-form.tsx`
  - 학급 수·학급별 인원 `InputNumber`.
  - RHF controller의 `undefined/null`, 최소 1, API DTO를 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/pages/posts/admin-category-page.tsx`
  - 카테고리 정렬 순서 `InputNumber min={1}`.
  - 실제 증감 컨트롤이 필요한지와 중복 순서 서버 오류를 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/form-field-editor.tsx`
  - 업로드 용량(MB) `type="number"`.
  - bytes 변환의 precision, 빈 값, 0, 최대 업로드 크기를 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/paragraph/single-item/lecture-report-program-progress.tsx`
  - 총 인원이 일반 text 입력으로 저장된다.
  - 숫자 전용 여부, 빈 값/0, Platform 제출 계약을 확인한다.

### trained-teachers / 1사1교 독립 확인

- [ ] **상태: 후보** — `apps/cms/src/features/program/trained-teachers/ui/common-info/common-info-view.tsx`
  - 여러 non-negative 정수 helper가 `type="number"`를 사용한다.
  - trained-teachers 전용 스키마·단위별로 분류하고 다른 프로그램 공용화 없이 검증한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/application-form/trained-teachers/paragraphs/basic-info-paragraph.tsx`
  - 총 학생 수 `type="number"`; 템플릿 표시/실제 입력 여부와 상태 저장을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/application-form/trained-teachers/paragraphs/preferred-schedule-paragraph.tsx`
  - 수업 교시 text + `inputMode="numeric"`; 정수 수량인지 “1~2” 같은 표시 문자열인지 기획 확인.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/application-form/1c-1s/paragraphs/basic-info-paragraph.tsx`
  - 총 학생 수 `type="number"`; 1사1교 전용 제출 스키마 확인.
- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/application-form/1c-1s/paragraphs/preferred-schedule-paragraph.tsx`
  - 수업 교시 numeric text; 2차시 자동 연계와 빈 값 삭제를 확인한다.

## 소수·점수(decimal/score)

- [ ] **상태: 후보** — `apps/cms/src/features/settlement/ui/settlement-submit-modal.tsx`
  - 편도 거리 km `InputNumber precision={1}`.
  - `0.`, 소수점 키패드, 반올림 방식, 음수 거부, 장거리 기준 비교 전 raw/rounded 값을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/instructor/ui/instructor-form.tsx`
  - 평점 `type="number" min={0} max={5} step={0.1}`.
  - 소수 한 자리 제한이 실제 schema/API와 일치하는지, 빈 값/0과 브라우저 지수 입력을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/detail-modal/applications/volunteer-screening/interview-evaluation-modal.tsx`
  - 담당자 A/B 정수 점수 `InputNumber`, 합계 범위 검증.
  - 점수 입력은 소수 분류가 아니라 `precision={0}` 정수임을 유지하고 null/0을 구분한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/evaluation-modal.tsx`
  - UJAT 담당자 A/B 정수 점수.
  - 일반 프로그램의 최대점수 상수를 공유하지 말고 UJAT 범위를 독립 검증한다.

## 날짜 텍스트(date text)

- [ ] **상태: 확인 완료** — `apps/cms/src/features/program/general/ui/add-student-modal.tsx`
  - 생년월일 8자리 digits, `maxLength={8}`, numeric keyboard.
  - blur 시 표시 padding 필요 여부, 실제 달력 날짜/leap year, submit 포맷을 추가 검증한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/detail-modal/program-status/school-detail-student-list-section.tsx`
  - placeholder `YYYY. MM. DD.`의 자유 text 편집.
  - add-student의 `YYYYMMDD` 상태와 형식이 달라 동일 adapter로 왕복 가능한지 확인한다.
- [ ] **상태: 확인 완료** — `apps/cms/src/features/user/shared/ui/admin-register-modal.tsx`
  - 생년월일 8자리 `sanitizeBirthDateInput`.
  - blur padding/표시, 유효 날짜, 오류의 `aria-describedby`를 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/user/shared/ui/instructor-register-modal.tsx`
  - 경력/자격/수상 내역의 `기간 또는 일자`, `취득일`, `일자` 자유 text.
  - 날짜 텍스트로 제한할 필드와 설명 문자열을 허용할 필드를 먼저 구분한다.
- [ ] **상태: 제외** — `CmsDatePicker`, `ParagraphDatePicker` 사용 화면
  - 달력 컴포넌트 입력은 본 문서의 8자리 text migration 대상이 아니다.
  - 단, API ISO/local date 경계와 접근성은 각 컴포넌트 테스트에서 유지한다.

## 숫자형 문자열(numericText / identifier)

- [ ] **상태: 후보** — `apps/cms/src/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form.tsx`
  - 주민등록번호 앞 6/뒤 7자리와 계좌번호.
  - number 변환 금지, 선행 0 유지, digits/paste/마스킹, 민감정보 autocomplete 정책을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/user/shared/ui/instructor-register-modal.tsx`
  - 주민등록 앞 6자리.
  - `inputMode`, pattern/sanitizer, 선행 0, 자동완성/마스킹, 오류 연결을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/user/shared/ui/add-user-individual.tsx`
  - 주민등록 앞 6자리.
  - shared 사용자 폼 영향과 string API 계약을 확인한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/general/ui/add-instructor-modal.tsx`
  - native input의 주민등록번호 조각·계좌번호.
  - 숫자 키패드, sanitizer, paste, 선행 0, 민감정보 노출/마스킹을 확인한다.
- [ ] **상태: 확인 완료** — `apps/cms/src/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/volunteer-info-program.tsx`
  - 활동 기수를 digits string으로 유지한다.
  - 기수는 식별 성격이므로 number 변환 여부와 선행 0 정책을 API 계약으로 확정한다.
- [ ] **상태: 후보** — `apps/cms/src/features/program/ujat/ui/detail-modal/progress/volunteers/activity-term-section.tsx`
  - UJAT 등록 기수 입력.
  - 표시 label과 실제 저장 코드가 같은지, 위 volunteer-info와 규칙을 맞춘다.
- [ ] **상태: 확인 완료** — `apps/cms/src/shared/ui/labeled-search-input.tsx`
  - `numericOnly`가 digits string 검색어를 만든다.
  - 검색어가 ID/전화번호일 때 선행 0 보존, 한글 IME/붙여넣기, clear 동작을 확인한다.
- [ ] **상태: 후보** — 문의처 전화번호 입력군
  - 대표 파일: `features/program/general/ui/detail-modal/info/volunteer-recruitment-info-view.tsx`, `features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/participant-info-program.tsx`, `features/program/gemini/ui/recruitment/gemini-recruitment-institution-fields.tsx`.
  - 전화번호는 산술값이 아니다. `+`, 내선, 하이픈 허용 계약을 확인한 뒤 숫자 전용 sanitizer 적용 여부를 결정한다.

## 의도적 예외

- [ ] **상태: 확인 필요** — `apps/cms/src/features/certificate-template/ui/certificate-text-fields-editor.tsx`
  - X/Y 좌표 `InputNumber`는 증감/직접 산술 조작이 핵심인 편집 도구이므로 유지 후보.
  - 좌표 최소·최대와 null fallback만 테스트한 뒤 `상태: 제외`로 확정한다.
- [ ] **상태: 확인 필요** — `apps/cms/src/features/application/ui/dynamic-form-fields.tsx`
  - schema의 `field.type === 'number'`를 그대로 렌더링하는 동적 폼.
  - 서버/템플릿이 산술 number를 명시한 경우 `InputNumber` 유지 가능. identifier/date/currency를 number type으로 보내지 않는지 계약 조사 후 결정한다.
- [ ] **상태: 확인 필요** — `apps/cms/src/pages/posts/admin-category-page.tsx`
  - 정렬 순서의 증감 버튼이 운영 UX로 의도되었다면 `InputNumber` 유지 가능.
- [ ] **상태: 제외** — 표시 전용 금액/점수
  - 예: `features/dashboard/ui/monthly-settlement-card.tsx`, `features/instructor/ui/instructor-detail.tsx`, `pages/settlements/my-monthly-settlement-page.tsx`, 점수 읽기 전용 section/columns.
  - 입력 이벤트가 없으므로 이번 migration 대상이 아니다.
- [ ] **상태: 제외** — 자동생성 API 및 OpenAPI
  - `src/shared/api/generated/**`, `openapi/**`는 생성 파이프라인 결과다. 직접 수정하지 않는다.

## 마이그레이션 완료 조건

- [x] 후보별 값 의미(integer/decimal/currency/date text/numeric identifier)와 API 타입 기록
- [x] `type="number"` 제거 또는 예외 사유 기록
- [x] `inputMode`/`pattern`/label/aria 전달 테스트
- [x] 빈 값과 0, min/max/precision/negative/leading zero 단위 테스트
- [ ] 실제 브라우저에서 caret/Undo/모바일 키패드·스크린리더 수동 확인
- [x] 날짜 blur padding 및 실제 날짜 검증
- [x] 금액 쉼표 표시와 raw value 왕복 검증
- [x] 자동생성 파일 미수정 확인
- [x] 일반/UJAT/1사1교/Gemini/trained-teachers 영향 유형별 회귀 화면 기록
- [x] shared/template 변경은 프로그램 유형별 기존 분기·값 타입 보존 확인
