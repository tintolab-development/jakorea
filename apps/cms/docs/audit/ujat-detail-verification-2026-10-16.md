# UJAT 프로그램 상세 전체 뎁스 FE 재검증 보고서

- 검증일: 2026-10-16
- 저장소: `frontend/jakorea`
- 브랜치: `keonhee`
- 기준 커밋: `26e8a9dde` (`origin/jiwon` 병합 후 현재 `keonhee` HEAD)
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
| UJAT API integrity + detail smoke + volunteer screening + education progress + survey/managers E2E | assertion 기준 setup 포함 17 tests PASS. 단, 실행 중 일시적 HTTP 500이 기록되어 안정 구간 재실행 전까지는 PARTIAL |

실제 실행 증거:

```text
17 passed (4.9m, assertion 기준)
selected programId=182104
FIRST_HALF / SECOND_HALF volunteer API responses: HTTP 200
```

초기 BLOCKED는 MFA나 백엔드 목록 응답 문제가 아니라 `프로그램 신규 등록` 셀렉터 불일치였으며, 실제 UI 라벨 `신규 등록`으로 수정 후 해소됐다. 이후 전체 실행 중 관찰된 HTTP 500은 K 섹션의 안정화 재검증 대상으로 별도 분리했다.

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

실제 UJAT 목록 API와 데이터가 정상임을 확인했고, 데이터가 가장 충분한 `programId=182104`를 선택해 상·하반기 상세 라우팅, 봉사자 `recruitHalf`, 교육 진행 탭, 설문·담당자 셸을 실제 브라우저와 API로 재검증했다. 초기 BLOCKED는 실제 버튼명과 테스트 셀렉터 불일치로 해소됐다. 전체 suite의 assertion은 setup 포함 17개가 통과했지만 실행 중 HTTP 500이 관찰됐으므로, 안정 구간 재실행 전에는 완전 PASS로 판정하지 않는다. 또한 이번 실행은 읽기 전용 검증이므로 공통 정보·모집·일정 배정·교육 진행 저장 mutation과 저장 후 왕복은 아직 NOT RUN이다. 해당 범위는 전용 테스트 DB 또는 안전한 전용 seed를 확보한 뒤 별도로 수행해야 한다.

## K. Mutation E2E 단계별 실행 결과 (2026-10-16 추가)

### 실행 원칙

- 기존 실제 데이터가 있는 `programId=182104`는 읽기 전용으로만 사용했다. 이 프로그램에는 기관 5건, 상반기 봉사자 11건, 하반기 봉사자 4건과 실제 일정 3건이 있어 mutation 대상이 될 수 없다.
- 직접 DB 삽입·수정은 사용하지 않았다.
- 저장 API는 전용 E2E 프로그램과 해당 프로그램만 대상으로 한 cleanup 경계가 확인된 경우에만 실행한다.

### STEP 00~18 상태

| 단계 | 결과 | 확인 내용 |
|---|---|---|
| STEP 00 환경 확인 | PARTIAL | CMS는 `localhost:3000`, 백엔드는 local profile의 `localhost:8080`에서 동작했고 health는 `UP`이었다. 다만 local DB가 다른 작업자와 공유되지 않는다는 증거와 전용 E2E DB 식별자는 확보하지 못했다. |
| STEP 01 읽기 전용 baseline | PARTIAL | 전체 상세 E2E assertion은 setup 포함 17건 통과했다. 실행 중 백엔드 프로세스가 재기동되며 일부 GET이 HTTP 500으로 기록되어, 이를 완전 PASS로 승격하지 않았다. 재기동 후 핵심 API integrity 스펙은 setup 포함 3건 통과했고 오류 로그는 0건이었다. |
| STEP 02 mutation API·캐시 인벤토리 | PASS | 실제 FE 구현과 OpenAPI에서 공통정보/지역 정원, 기관 임시 일정, 봉사자 심사, 배정, 출석 mutation 경로를 대조했다. |
| STEP 03 mutation safety gate | BLOCKED | 전용 테스트 DB 또는 다른 사용자가 접근하지 않는 전용 UJAT 프로그램, 생성 후 cleanup 책임 범위를 입증하지 못했다. |
| STEP 04 테스트 프로그램 생성 | BLOCKED | STEP 03 미충족으로 생성 요청을 보내지 않았다. |
| STEP 05 공통정보·지역 정원 저장 | BLOCKED | 전용 프로그램 없음. |
| STEP 06 기관 임시 일정·학급 배정 저장 | BLOCKED | 전용 기관 신청 없음. |
| STEP 07 일정 확인/변경 요청 | BLOCKED | 전용 기관 신청 없음. |
| STEP 08 상반기 봉사자 심사 | BLOCKED | 전용 상반기 봉사자 신청 없음. |
| STEP 09 하반기 봉사자 심사 | BLOCKED | 전용 하반기 봉사자 신청 없음. |
| STEP 10 교육지역 정원 저장 | BLOCKED | 전용 프로그램 없음. |
| STEP 11 자동/직접 파트너 배정·취소 | BLOCKED | 전용 participant·교육 slot 없음. |
| STEP 12 출석 저장 | BLOCKED | 전용 participant·일정 없음. |
| STEP 13 1365·과제 상태 | NOT RUN | mutation 선행 상태가 없어 실행 대상이 아니다. |
| STEP 14~16 새로고침·deep-link·상하반기 격리 | PARTIAL | 읽기 전용으로 URL, `recruitHalf`, 상세 canonical GET을 확인했다. mutation 직후 재조회는 수행하지 못했다. |
| STEP 17 회귀·품질 게이트 | PARTIAL | 안정화 후 API integrity E2E 3건 통과. 전체 suite 17건은 HTTP 500 동반으로 재실행 필요다. |
| STEP 18 보고서 | PASS | 본 섹션에 mutation 미실행 사유와 재개 조건을 기록했다. |

### 확인된 mutation 경로와 실행 차단 사유

| 영역 | 실제 FE 호출 | 저장 뒤 필요한 canonical 재조회 범위 | 실행 상태 |
|---|---|---|---|
| 공통정보·지역 정원 | `PUT /api/admin/program-execution/programs/{programId}/ujat/region-capacities` 후 프로그램 update | 프로그램 상세, 지역 정원, 프로그램 목록 | BLOCKED |
| 기관 임시 일정 | `PUT /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/temporary-schedule` | 기관 신청 전체 목록·상세, 배정/education execution, 프로그램 일정 | BLOCKED |
| 기관 일정 변경 요청 | `POST /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/schedule-change-request` | 기관 신청 전체 목록·상세, 일정 확인 목록 | BLOCKED |
| 봉사자 서류/최종 결과·관리자 평가 | `PUT .../document-evaluations/{A|B}`, `POST .../document-result`, `POST .../final-result` | 해당 반기 봉사자 목록 prefix 및 상세 | BLOCKED |
| 자동·직접 배정/취소 | `/api/admin/program-execution/programs/{programId}/ujat/...partner-assignments` | allocation matrix, assignment submissions, 일정별 배정/출석 | BLOCKED |
| 출석 저장 | `POST /api/admin/program-execution/programs/{programId}/attendances:bulk-upsert` | 일정별 출석, 참여자·진행 요약, 1365 출석 | BLOCKED |

### 정적 캐시 점검 결과

- 봉사자 2차 면접 결과는 `['cms', 'programs', 'ujat', 'applications', 'volunteers', programId]` prefix를 무효화해 반기와 필터가 다른 봉사자 목록을 함께 재조회한다.
- 기관 상세의 임시 반려는 기관 신청 root, 해당 상세, execution, 프로그램 일정을 함께 무효화한다.
- **보완 필요:** 기관 임시 일정 저장은 현재 `status: 'TEMP_ASSIGNED'`인 기관 목록 키 하나만 무효화한다. 동일 프로그램의 다른 기관 필터·상세 및 allocation matrix/진행 화면이 오래된 값을 보일 가능성이 있으므로, 전용 mutation E2E를 재개할 때 이 범위를 실제 저장 후 검증하고 부족하면 programId 단위의 관련 query key를 추가로 무효화해야 한다. 이 항목은 실행 데이터가 없으므로 코드만 보고 PASS로 판정하지 않았다.

### STEP 01 HTTP 500 기록

전체 읽기 전용 suite 실행 도중 백엔드 PID가 교체되었고, 그 시점에 프로그램 목록/상세, UJAT 일정·지역, 봉사자 목록 등 브라우저 GET 요청에 HTTP 500이 기록됐다. 이후 `/actuator/health`가 `UP`인 것을 확인한 뒤 API integrity 스펙을 단독 재실행해 setup 포함 3건 통과 및 오류 로그 0건을 확인했다.

원인은 재기동 시점의 일시적 가용성 문제로 보이나, 서버 로그와 재기동 주체를 대조하지 않았으므로 원인 확정은 하지 않는다. 전체 mutation E2E를 재개하기 전에는 백엔드 재기동이 없는 안정 구간에서 17건 baseline을 다시 실행하고, 핵심 UJAT GET의 HTTP 5xx가 0건인지 확인해야 한다.

### 재개 조건

1. `E2E_DB_URL` 또는 동등한 방식으로 다른 개발 DB와 분리된 전용 DB임을 확인한다.
2. CMS UI 또는 공식 관리자 API로 생성한 전용 UJAT 프로그램 ID와 생성 시각을 기록한다.
3. cleanup은 해당 ID prefix의 테스트 프로그램만 대상으로 하고, 삭제 가능 여부·담당자를 사전에 확정한다.
4. 서버가 안정화된 상태에서 전체 읽기 전용 17건을 HTTP 5xx 없이 통과시킨다.
5. 그 후 각 mutation은 pre-state → 요청 payload(식별정보만, 개인정보 제외) → response → 새로고침/deep-link post-state 순으로 기록한다.

## L. 전용 E2E 환경 재개 실행 결과 (2026-10-16)

### 연결 및 격리

- 전용 백엔드 `http://localhost:18080`, 전용 PostgreSQL `localhost:55433`에 연결했다.
- 기존 CMS `localhost:3000`과 기존 백엔드 `localhost:8080`은 변경하지 않았다.
- 백엔드 CORS 허용 origin을 유지하기 위해 Playwright 실행 시에만 `/api/`로 시작하는 브라우저 요청을 18080으로 라우팅하는 E2E 전용 헬퍼를 추가했다. `/src/.../api/...` 같은 Vite 모듈 경로는 라우팅하지 않는다.
- 인증 setup 및 브라우저 Network 캡처에서 전용 서버 요청을 확인했다. 토큰과 비밀번호는 보고서에 기록하지 않았다.

### fixture 확인

| fixture | 확인 결과 | 용도 |
|---|---|---|
| 182101 | UJAT, 일정 14건, 기관/봉사 신청 0건 | 지역 정원 |
| 182102 | UJAT, 일정 14건, 기관 임시 배정 fixture | 기관 임시 일정 |
| 182103 | UJAT, 상반기 봉사 11건·하반기 봉사 4건 | 봉사 심사 조회 |
| 182104 | UJAT, 일정 3건, participant 11건, 출석 데이터 존재 | 교육 진행·출석 |
| 182105 | UJAT, 종료 프로그램, 일정 0건 | 종료 상태 조회 |

182104의 기존 데이터는 조회 및 회귀에만 사용하고, mutation은 전용 fixture 범위에서만 실행했다. 직접 DB 삽입은 수행하지 않았다.

### 조회 회귀

- UJAT 상세·API integrity·상하반기 봉사자·교육 진행·설문·담당자 스펙: setup 포함 최초 실행 17건 PASS, API error 0건.
- mutation 이후 저장 세션으로 dependency를 제외하고 동일 회귀를 재실행: 16건 PASS, API error 0건, HTTP 5xx 관찰 없음.
- 검증한 내용: 상세 deep-link, programId 식별자 일치, `FIRST_HALF`/`SECOND_HALF` 분리, 기관·봉사자·지역·출석·과제 탭, 설문·담당자 셸.

### 실제 mutation 저장·재조회

신규 스펙 `apps/cms/tests/e2e/flows/programs/ujat/ujat-mutation-revalidation.spec.ts`를 추가하고 전용 서버에서 반복 실행했다.

| mutation | pre-state → 요청 | GET 재조회 결과 | 결과 |
|---|---|---|---|
| 지역 정원 | 182101 서울 `FIRST_HALF` 정원 값을 22/44↔23/46으로 PUT | `maxClassCount`, `maxVolunteerCount`, 지역 코드 일치 | PASS |
| 기관 임시 일정 | 182102/182812/182344 학생 수 9↔10 PUT | revision 증가 및 해당 slot 학생 수 일치 | PASS |
| 출석 bulk upsert | 182104/182381/183061 `LATE`, 도착시각 08:55 POST | 회차 GET에서 동일 participant·schedule·status 및 `internalLate=true` | PASS |
| 일정 변경 요청 경계 | 182102/182812 상태 충돌 조건에서 변경 요청 POST | HTTP 409, `UJAT_WORKFLOW_STATE_CONFLICT` | PASS |

최종 확인된 전용 fixture 상태는 182101 서울 정원 22/44, 182102 임시 일정 revision 6·학생 수 9, 182104 출석 183061 `LATE`·`internalLate=true`다. 이 값들은 전용 DB에만 반영되었다.

실행 결과:

```text
ujat-mutation-revalidation.spec.ts --no-deps: 4 passed
UJAT read-only regression after mutation --no-deps: 16 passed
ujat-education-regions-crud.spec.ts: 7 passed
changed E2E files eslint: exit 0
apps/cms pnpm typecheck: exit 0
```

### 테스트 인프라 보완 및 미완료 항목

- 교육 지역 인라인 수정 테스트는 편집 후 지역명이 input value로 이동해 기존 `hasText` 행 locator가 끊기는 결함이 있어, `저장` 버튼이 있는 편집 행을 재탐색하도록 수정했다. CRUD 재실행은 7건 전부 PASS했고 테스트 행은 삭제 완료했다.
- UJAT 수정 스펙은 실제 버튼명 `신규 등록`에 맞춰 locator를 보정했다. 전용 DB에 `[수정 가능] UJAT 프로그램 더미`가 없어 1개 진입 단계와 후속 5개 단계는 의도된 skip이다.
- 신규 등록 스펙은 실제 등록 POST 전에 필수 교육 일정 행 검증에서 중단됐다. 현재 POM이 동적으로 생성되는 일정·지역 필드 전체를 채우지 못하는 테스트 인프라 문제이며, 백엔드 오류나 저장 성공으로 판정하지 않았다. 생성된 프로그램/등록 POST는 없다.
- 일정 변경 요청은 fixture 상태가 `UJAT_WORKFLOW_STATE_CONFLICT`를 반환하는 경계 케이스만 검증했다. 정상 승인 상태에서의 변경 성공 경로, 자동·직접 배정·취소, 상·하반기 봉사자 심사 mutation은 현재 fixture 상태와 공식 테스트 데이터가 없어 실행하지 않았다.

### 현재 결론

전용 DB 안전성 확인 후 실제 서버 mutation 4개와 저장 후 GET 재조회, 상태 충돌 보호, mutation 이후 상세 회귀까지 완료했다. 현재 남은 작업은 신규 등록 POM의 동적 필수 일정 입력 보강과 승인 가능한 봉사자/배정 fixture 확보 후 자동·직접 배정 및 봉사 심사 mutation을 별도 실행하는 것이다. 제품 코드에서 실패를 숨기거나 fallback으로 성공 처리하지 않았다.

## M. 잔여 BLOCKED·SKIP 해소 후속 검증 결과 (2026-10-16)

### 실행 환경

- CMS `http://localhost:3000`과 전용 UJAT E2E 백엔드 `http://localhost:18080`을 사용했다.
- 전용 PostgreSQL 환경을 사용했으며 기존 `localhost:8080` 백엔드는 변경하지 않았다.
- 만료된 관리자 세션은 MFA setup으로 갱신한 뒤 테스트를 재실행했다. 인증 코드·토큰·비밀번호는 기록하지 않았다.
- 직접 DB 삽입·수정은 수행하지 않았다.

### 최종 결과 요약

| 검증 범위 | 결과 | 근거 |
|---|---|---|
| UJAT 신규 프로그램 등록 | PASS | 신규 등록 스펙 2건 통과. 실제 POST 성공, 생성 `programId` 확보, canonical 상세 GET에서 `programId`와 `mainTitle` 일치, 목록 재조회 확인 |
| UJAT mutation 재검증 | PASS | 지역 정원, 기관 임시 일정, 출석 bulk-upsert, 일정 변경 충돌 경계 등 4건 통과 |
| mutation 후 읽기 회귀 | PASS | 저장 후 UJAT read-only 회귀 16건 통과, API error 0건 및 HTTP 5xx 미관찰 |
| UJAT 수정 저장 E2E | PARTIAL/BLOCKED | 기존 fixture 진입 단계는 통과했으나 실제 수정 저장은 필수 정원 입력 검증에 막혔고, 보정 후 재실행은 CMS 빈 화면으로 렌더링되지 않아 완료 판정 불가 |
| 봉사자 심사 mutation | NOT RUN/BLOCKED | 승인·반려 가능한 전용 봉사자 fixture가 없어 실행하지 않음 |
| 자동·직접 배정·취소 | NOT RUN/BLOCKED | 승인된 participant·배정 가능한 slot fixture가 없어 실행하지 않음 |
| React Query UI 캐시 왕복 | PARTIAL | API 저장 후 GET 재조회는 PASS. 실제 브라우저 mutation 직후 관련 화면 캐시 무효화까지는 전용 fixture 부족으로 미검증 |

### 1. 신규 등록 검증

실행 대상:

```text
tests/e2e/flows/programs/ujat-program-registration.spec.ts
```

최종 결과:

```text
2 passed
```

확인 내용:

- DEV 자동입력 완료 이벤트를 기다린 뒤 모집 정보와 공통 정보 입력을 진행하도록 테스트 동기화를 보강했다.
- 자동입력 이후 controlled overlay 값을 다시 덮어써 필수 일정이 초기화되던 문제를 방지했다.
- 실제 `POST /api/admin/programs` 성공을 확인했다.
- 생성 응답의 `programId`를 확보했다.
- 생성 직후 canonical `GET /api/admin/programs/{programId}`를 호출해 HTTP 200, ID 일치, 프로그램명 일치를 확인했다.
- 프로그램 목록 재조회 후 생성 프로그램이 노출되는 것을 확인했다.

### 2. mutation 및 저장 후 재조회

실행 대상:

```text
tests/e2e/flows/programs/ujat/ujat-mutation-revalidation.spec.ts
```

최종 결과:

```text
4 passed
```

| 케이스 | 결과 |
|---|---|
| 교육 지역 정원 PUT 후 GET | PASS |
| 기관 임시 일정 PUT 후 GET | PASS |
| 출석 bulk-upsert 후 회차 GET | PASS |
| 일정 변경 요청의 상태 충돌 409 | PASS |

첫 실행에서 만료된 관리자 JWT로 401이 발생했으나, 제품 API 오류가 아니라 인증 세션 만료로 분류했다. 관리자 auth setup 갱신 후 동일 스펙을 재실행해 4건 모두 통과했다.

### 3. UJAT 수정 E2E 잔여 상태

수정 대상:

```text
tests/e2e/flows/programs/ujat-program-edit.spec.ts
tests/e2e/pages/ujat-program-edit.page.ts
```

확인 결과:

- 목록의 고정 더미 행이 없는 경우 canonical UJAT 프로그램 목록 API에서 Playwright 생성 프로그램을 찾도록 보강했다.
- 상세 진입 후 canonical 상세 API의 실제 프로그램명을 사용하도록 보강했다.
- 수정 저장 시 필수 `최대 학급 수`·`최대 봉사자 수` 입력 누락으로 저장 모달이 막히던 테스트 문제를 보완했다.
- 그러나 보정 후 재실행에서는 CMS 화면이 빈 화면으로 렌더링되어 신규 등록 진입 단계에서 중단됐다.
- 따라서 수정 저장 성공, 저장 후 상세 왕복, 목록 반영은 아직 PASS로 판정하지 않는다.

남은 확인 조건:

1. CMS 빈 화면이 재현되지 않는 안정적인 브라우저 세션 확보
2. 수정 대상 프로그램의 상세 진입 및 필수 필드 입력 확인
3. PATCH 성공 응답 확인
4. 상세·목록·새로고침에서 서버 원본 값 일치 확인

### 4. 아직 실행하지 않은 범위

- 상·하반기 봉사자 서류 심사 및 최종 결과 mutation
- 자동 배정·직접 배정·배정 취소
- 승인된 participant 기준의 진행 현황·출석 UI mutation 왕복
- 실제 브라우저 화면에서 mutation 직후 React Query 캐시가 관련 목록·상세·진행 화면 전체에 반영되는지 확인

위 항목은 테스트를 생략한 것이 아니라, 승인 상태의 전용 봉사자·participant·slot fixture가 없어 안전하게 실행할 수 없었던 범위다. 기존 실제 데이터에 임의로 승인·배정·반려를 적용하지 않았다.

### 5. 정적 품질 검증

```text
git diff --check: 통과
변경 E2E/registration 파일 ESLint: 통과
apps/cms pnpm typecheck: 통과
```

ESLint 실행 중 baseline-browser-mapping 업데이트 안내가 출력됐지만 오류는 아니며, 최종 exit code는 0이다.

### 최종 판정

- 신규 UJAT 생성과 핵심 mutation API 저장·재조회는 PASS다.
- mutation 이후 읽기 전용 상세 회귀도 PASS다.
- UJAT 수정 저장, 봉사자 심사 mutation, 자동·직접 배정·취소, 실제 UI 캐시 왕복은 아직 완료되지 않았다.
- 실패한 범위를 성공으로 보정하거나 fallback 데이터로 대체하지 않았다.
- 현재 작업 트리는 기존 변경사항과 이번 보완사항이 함께 남아 있으며, 이번 검증에서는 커밋·푸시하지 않았다.
