# UJAT 프로그램 상세 전체 뎁스 FE 재검증 보고서

- 검증일: 2026-10-16
- 저장소: `frontend/jakorea`
- 브랜치: `keonhee`
- 기준 커밋: `8f13bea37` (`origin/jiwon` 병합 커밋)
- 범위: UJAT 상세 화면의 URL, 뎁스 분기, 원격 API 연결, 상·하반기 분리, E2E 검증 보강

## A. 실행 환경과 판정 기준

### 환경

- CMS 앱: `apps/cms`
- 로컬 기본 URL: Playwright 설정 기준 `http://127.0.0.1:3000` (환경변수로 재정의 가능)
- 인증: 기존 관리자 Playwright 세션 및 MFA setup 사용
- 이번 실행에서는 `E2E_MFA_CODE`를 환경변수로 주입했으며 비밀값은 로그·파일에 기록하지 않음
- 작업 트리의 기존 사용자 변경은 이번 작업과 무관하므로 보존함

### 판정

- `PASS`: 실제 응답·화면·저장 왕복을 확인
- `FAIL`: 실제 오류 또는 데이터 불일치 확인
- `PARTIAL`: 일부 계약만 확인되고 핵심 흐름이 남음
- `BLOCKED`: 인증·권한·시드·백엔드 응답 등 외부 조건으로 실제 검증 불가
- `NOT RUN`: 실행하지 않음
- `N/A`: 해당 프로그램 설정상 존재하지 않는 뎁스

데이터가 없거나 화면 셸만 확인된 경우 `PASS`로 집계하지 않았다.

## B. UJAT 상세 뎁스 매트릭스

| 영역 | URL 식별자 | 실제 UI 분기 | 주요 데이터/API 경로 | 현재 판정 |
|---|---|---|---|---|
| 공통 정보 | `lnb=info&tab=info` | 공통 정보 조회 | 프로그램 상세 GET | PARTIAL |
| 모집 정보 | `lnb=info&tab=recruit_participant` 등 | 기관·상반기·하반기 모집 편집/조회 | 모집 폼·바인딩 API | PARTIAL |
| 기관 신청 목록 | `lnb=institution_applications&tab=inst_all` | 기관 신청 목록/상세 | 기관 신청 목록·상세 API | PARTIAL |
| 기관 임시 배정 | `tab=inst_schedule_assign` | 기관 일정 임시 배정 | UJAT 기관 일정 배정 API | PARTIAL |
| 기관 일정 확인 | `tab=inst_schedule_confirm` | 확인 목록/상세 | UJAT 일정 확인 API | PARTIAL |
| 상반기 봉사자 전체/서류 | `lnb=volunteer_h1&tab=vh1_all/vh1_doc1` | 신청·서류 심사 | 봉사자 목록 API + `recruitHalf=FIRST_HALF` | PARTIAL |
| 상반기 봉사자 합격/면접 | `tab=vh1_doc_passed/vh1_interview2` | 서류 합격·2차 면접 | 봉사자 목록/면접 API | PARTIAL |
| 하반기 봉사자 전체/서류 | `lnb=volunteer_h2&tab=vh2_all/vh2_doc1` | 신청·서류 심사 | 봉사자 목록 API + `recruitHalf=SECOND_HALF` | PARTIAL |
| 하반기 봉사자 합격/면접 | `tab=vh2_doc_passed/vh2_interview2` | 서류 합격·2차 면접 | 봉사자 목록/면접 API | PARTIAL |
| 상반기 교육 진행 | `tab=edu_h1_*` | 기관·봉사자·지역·출석·과제 | program-execution UJAT API | PARTIAL |
| 하반기 교육 진행 | `tab=edu_h2_*` | 기관·봉사자·지역·출석·과제 | program-execution UJAT API | PARTIAL |
| 교육 진행 요약 | `tab=edu_summary` | 반기 종합 현황 | 기관 신청·진행 집계 API | PARTIAL |
| 참여 기관 상세 | `eduInstId`, `eduInstTab` | 신청/배정/게시글 | 참여 기관 상세·배정 API | NOT RUN |
| 참여 봉사자 상세 | `eduVolId`, `eduVolTab` | 신청/배정 진행 | 참여 봉사자 상세 API | NOT RUN |
| 봉사자 관리자 대리 등록 | `volAddMemberId` | 회원 선택 후 등록 | 등록 API | NOT RUN |
| 설문 | `lnb=survey` | 설문 목록/빈 상태/등록 | 설문 API | PARTIAL |
| 담당자 | `lnb=managers` | 담당자 목록 | 담당자 API | PARTIAL |

코드상 상세 라우터는 `apps/cms/src/features/program/ujat/ui/detail-modal/ujat-program-detail-fullpage-modal.tsx`에서 기관, 봉사자, 교육 진행, 설문, 담당자 뎁스를 분기한다. 참여 기관/봉사자 상세와 관리자 대리 등록은 URL 식별자와 렌더 분기가 존재하지만 이번 라이브 실행에서는 시드 진입 전 차단되어 저장 왕복까지 확인하지 못했다.

## C. 상반기·하반기 분리 검증

### 확인된 코드 계약

- `apps/cms/src/features/program/ujat/api/applications-service.ts`는 UI 반기를 API 값으로 변환한다.
  - `h1` → `FIRST_HALF`
  - `h2` → `SECOND_HALF`
- 봉사자 목록 요청은 `recruitHalf`를 요청 파라미터에 항상 포함한다.
- 상세 렌더링은 `activeTab.startsWith('vh2')` 또는 `activeTab.startsWith('edu_h2')`로 반기를 분기한다.
- 상반기와 하반기 모두 봉사자 4개 탭과 교육 진행 5개 탭을 같은 검증 목록에 포함하도록 E2E를 보강했다.

### 검증 결과

- URL/탭 계약 단위 테스트: PASS
- 실제 상·하반기 `recruitHalf` 네트워크 검증: PASS
  - 상반기 요청에서 `recruitHalf=FIRST_HALF` 확인
  - 하반기 요청에서 `recruitHalf=SECOND_HALF` 확인
  - 두 반기의 목록 응답이 모두 HTTP 200
  - 기존 BLOCKED 원인은 API/권한이 아니라 E2E 목록 셀렉터가 실제 버튼명 `신규 등록`과 불일치했던 테스트 결함

## D. API·화면 정합성 점검

### 신청 목록

`applications-service.ts`는 목록 데이터를 원격 API에서 직접 읽고, 원격 API가 활성화되지 않으면 다음 오류를 발생시킨다.

> UJAT 신청 API가 활성화되지 않았습니다 ... mock 폴백은 사용하지 않습니다.

이 구조로 UJAT 신청 목록에서 mock 데이터를 실제 응답처럼 표시하는 경로는 차단되어 있다.

### 프로그램 상세

`queries.ts`의 `useProgramDetail`은 remote scope에서 목록 행을 `initialData`/`placeholderData`로 사용하지 않는다. 목록 seed를 허용하는 것은 local scope로 제한되어 있다. remote 상세 조회의 stale time은 30초이며 상세 GET이 canonical source가 된다.

### 교육 진행

`education-execution-api.ts`에서 다음 유형의 UJAT 전용 경로가 구현되어 있다.

- allocation matrix
- 직접 배정 후보/직접 배정
- 일정별 임시 불가 조회·등록·삭제
- 일정별 기관 배정 조회·확정·취소
- 일정별 출석 조회 및 프로그램 출석 bulk 조회
- 과제 제출 현황

다만 이 파일의 타입은 현재 dashboard용 OpenAPI 필터에 일부 execution schema가 빠져 있어 수동 선언을 사용하는 구간이 있다. 요청 URL과 응답 필드의 서버 계약 재검증이 필요하다.

### 저장·재조회

읽기 전용 라이브 실행에서는 실제 UJAT 상세 seed를 확보해 API·라우팅·화면 셸을 검증했다. 공통 정보 저장, 모집 저장, 기관 일정 배정, 임시 배정 확인, 교육 진행 저장 후 새로고침까지의 mutation 왕복은 데이터 변경 보호를 위해 `NOT RUN`이다. 코드와 HTTP 200만으로 저장 성공을 PASS로 판정하지 않았다.

### 실제 서버 응답 증거

브라우저 관리자 세션으로 다음을 확인했다.

- `GET /api/admin/programs?page=0&size=20&programType=UJAT`: HTTP 200, UJAT 5건
- 선택 seed `programId=182104` 상세: HTTP 200, `programType=UJAT`, 실제 교육 일정 3건
- `GET /api/admin/programs/182104/organization-applications?page=0&size=1`: HTTP 200, `totalElements=5`
- 상반기 봉사자 목록: HTTP 200, `recruitHalf=FIRST_HALF`, `totalElements=11`
- 하반기 봉사자 목록: HTTP 200, `recruitHalf=SECOND_HALF`, `totalElements=4`

따라서 이번 재검증은 DB가 비어 있거나 다른 환경을 바라보는 상황이 아니라, 실제 UJAT 데이터가 있는 로컬 서버에서 수행했다.

## E. fallback·placeholder·legacy 경로 조사

| 위치 | 내용 | 판정/위험 |
|---|---|---|
| `api/applications-service.ts` | 원격 API 미활성 시 오류, mock fallback 금지 | 안전한 차단, PASS 근거 |
| `api/queries.ts` | local scope에서만 `initialData`/`placeholderData` 허용 | local QA 전용인지 운영 설정 확인 필요 |
| `api/applications-adapters.ts` | 선택 문자열이 없을 때 표시용 fallback 문자열 | 원본 데이터 대체 가능성, P2 확인 필요 |
| `api/adapters.ts` | 표시 프로그램/target level fallback overlay | 상세 canonical 필드 우선순위 확인 필요 |
| `api/allocation-matrix-adapters.ts` | region code 미존재 시 fallback region key | 잘못된 지역 표시 가능성, P1 확인 필요 |
| `lib/ujat-half-education-schedule-display.ts` | 교육 일정 표시용 fallback | 누락 필드가 실제 값처럼 보이지 않는지 확인 필요 |
| `lib/normalize-ujat-progress-status.ts` | 상태를 알 수 없을 때 undefined, 일부 목록 fallback 주석 | 서버 상태 누락 시 임의 상태 금지 검토 필요 |
| `ui/detail-modal/ujat-program-detail-fullpage-modal.tsx` | 지원하지 않는 봉사자 탭에서 placeholder section 표시 | URL은 열리지만 실제 기능이 아닌 화면이 될 수 있음 |
| 설문 동의 UI | `준비 중입니다` 안내 | 실제 미구현 영역으로 분류, PASS 금지 |
| legacy URL | `lnb=volunteer_applications`를 tab prefix로 h1/h2 복원 | 호환 규칙 단위 테스트 PASS |

이번 작업에서는 fallback을 임의로 제거하거나 product data를 `-`로 치환하지 않았다. 실제 응답이 없는 영역을 코드 수정으로 PASS처럼 만들지 않는 것이 우선이다.

## F. OpenAPI·수동 타입 점검

- 신청 목록은 generated API client의 원격 요청을 통해 사용한다.
- 교육 실행 API는 `education-execution-api.ts`에 수동 response/request type이 존재한다.
- 현재 OpenAPI dashboard subset에 UJAT execution schema가 충분히 노출되지 않아 수동 타입이 유지되고 있다.
- 권장 보강:
  1. 백엔드 OpenAPI에 UJAT execution request/response schema를 공개
  2. 프론트에서 수동 타입을 generated type으로 교체
  3. `sessions`, `items`, `scheduleId`, `participantId`, `educationRegionCode`의 nullable/empty-array 계약 명시
  4. 기관 배정·출석·과제 응답에서 빈 배열과 필드 생략을 구분

## G. 확인된 이슈와 우선순위

### UJAT-FE-001 — E2E 상세 seed 진입 실패 (해결)

- 원인: 실제 UJAT 목록의 등록 버튼 라벨은 `신규 등록`인데 POM이 `프로그램 신규 등록`을 찾고 있었다.
- 영향: API와 권한은 정상인데 목록 셸 탐색이 실패해 상세 seed가 BLOCKED로 오판되었다.
- 조치: POM 셀렉터를 실제 버튼 라벨에 맞추고, 목록 API에서 일정·기관·상반기·하반기 데이터가 가장 충분한 프로그램을 읽기 전용으로 선택하도록 보강했다.
- 재검증: 관리자 인증 setup 및 UJAT API 정합성/상세 smoke 전체 통과.

### UJAT-FE-002 — 하반기 E2E coverage 부족 (P1, 보강 완료)

- 기존 하반기 봉사자는 `vh2_all`, `vh2_doc1`만 순회했고, 교육 진행은 기관 탭만 순회했다.
- 하반기 봉사자 합격/면접 및 교육 진행 지역/출석/과제 탭을 추가했다.
- 실제 상·하반기 네트워크 검증은 `FIRST_HALF`/`SECOND_HALF` 요청과 HTTP 200 응답을 확인해 PASS다.

### UJAT-FE-003 — 알 수 없는 봉사자 탭 placeholder (P2, 제품 정책 확인 필요)

- 지원하지 않는 tab도 placeholder 화면을 렌더링한다.
- 허용되지 않은 URL을 기본 탭으로 정규화할지, 명시적 오류/404로 처리할지 기획 확인이 필요하다.

### UJAT-FE-004 — 수동 execution API 타입 (P2, 백엔드/OpenAPI 협업 필요)

- URL 호출은 구현되어 있으나 response schema가 generated contract로 고정되지 않았다.
- API 응답 필드 변경 시 화면이 조용히 빈 값으로 표시될 수 있으므로 OpenAPI 공개와 타입 재생성을 권장한다.

### UJAT-FE-005 — 표시용 fallback 데이터 (P1/P2 혼재, 추가 판정 필요)

- 지역, 일정, 프로그램 target level 등에서 fallback 코드가 확인된다.
- 실제 API 응답 필드가 누락되었을 때만 실행되는지, 목록 캐시를 상세 데이터처럼 사용하는지 각각 실제 응답으로 확인해야 한다.
- 이번 실행에서는 seed가 없어 product code 수정이나 fallback 제거를 하지 않았다.

## H. 이번 작업에서 추가·수정한 검증 코드

1. `apps/cms/src/features/program/ujat/lib/ujat-program-detail-url.test.ts`
   - 교육 진행 상·하반기 URL 생성
   - 봉사자 지원자 상세 deep-link 식별자 유지
   - legacy volunteer URL의 h1/h2 복원
   - 기관/봉사자 상세 하위 탭 허용 목록 및 기본값

2. `apps/cms/tests/e2e/flows/programs/ujat/detail/ujat-program-detail-api-integrity.spec.ts`
   - 상세 GET 응답 식별자와 URL programId 일치
   - 상·하반기 봉사자 API `recruitHalf` 분리
   - 시드가 없으면 PASS가 아닌 skip/보고서 BLOCKED

3. `ujat-program-volunteer-screening.spec.ts`
   - 하반기 봉사자 서류 합격·2차 면접 탭까지 검증 목록 확장

4. `ujat-program-education-progress.spec.ts`
   - 하반기 기관·봉사자·지역·출석·과제 탭까지 검증 목록 확장

5. `ujat-program-detail.page.ts`
   - 목록 셸이 없는 데이터/권한 환경을 호출자가 BLOCKED/skip으로 분류할 수 있도록 안전한 조회 helper 추가

## I. 실행 결과

| 명령 | 결과 |
|---|---|
| `pnpm exec vitest run src/features/program/ujat/lib/ujat-program-detail-url.test.ts` | PASS: 4 tests |
| `pnpm exec vitest run src/features/program/ujat` | PASS: 36 files / 179 tests |
| 변경 파일 대상 ESLint | PASS: exit 0 (baseline-browser-mapping 업데이트 경고만 출력) |
| `pnpm typecheck` (`apps/cms`) | PASS: exit 0 |
| `git diff --check` | PASS |
| UJAT API integrity + detail smoke + volunteer screening + education progress + survey/managers E2E | setup 포함 17 tests PASS |

실제 실행 증거:

```text
17 passed (4.9m)
selected programId=182104
FIRST_HALF / SECOND_HALF volunteer API responses: HTTP 200
```

초기 BLOCKED는 MFA나 백엔드 목록 응답 문제가 아니라 `프로그램 신규 등록` 셀렉터 불일치였으며, 실제 UI 라벨 `신규 등록`으로 수정 후 해소됐다.

## J. 후속 실행 순서

1. 실제 데이터가 있는 UJAT 목록에서 선택된 seed를 사용해 아래 스펙을 실행 (완료)
   - `tests/e2e/flows/programs/ujat/detail/ujat-program-detail-api-integrity.spec.ts`
   - `tests/e2e/flows/programs/ujat/detail/ujat-program-detail-smoke.spec.ts`
   - `tests/e2e/flows/programs/ujat/detail/ujat-program-volunteer-screening.spec.ts`
   - `tests/e2e/flows/programs/ujat/detail/ujat-program-education-progress.spec.ts`
   - `tests/e2e/flows/programs/ujat/detail/ujat-program-survey-managers.spec.ts`
2. 실제 seed로 공통 정보·모집·기관 일정 배정·임시 배정 확인·교육 진행 mutation 후 새로고침 왕복 확인 (데이터 변경 승인 후)
3. 실제 응답과 화면 텍스트/상태를 비교해 E 섹션 fallback 후보를 P1/P2로 확정
4. OpenAPI execution schema를 백엔드와 맞춘 뒤 generated client/type으로 교체

## 결론

실제 UJAT 목록 API와 데이터가 정상임을 확인했고, 데이터가 가장 충분한 `programId=182104`를 선택해 상·하반기 상세 라우팅, 봉사자 `recruitHalf`, 교육 진행 탭, 설문·담당자 셸을 실제 브라우저와 API로 재검증했다. 초기 BLOCKED는 실제 버튼명과 테스트 셀렉터 불일치로 해소되었으며, 인증 setup 포함 17개 E2E가 통과했다. 다만 이번 실행은 읽기 전용 검증이므로 공통 정보·모집·일정 배정·교육 진행 저장 mutation과 저장 후 왕복은 아직 NOT RUN이다. 해당 범위는 데이터 변경 승인 또는 전용 테스트 seed를 확보한 뒤 별도로 수행해야 한다.
