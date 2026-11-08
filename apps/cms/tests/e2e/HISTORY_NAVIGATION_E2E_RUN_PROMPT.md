# 풀페이지 모달 history E2E 실행·결과 보고 요청

## 목적

`apps/cms/tests/e2e/flows/history-navigation/`에 작성된 E2E(spec 10개, 테스트 41개)를 **실행**하고, 실패를 원인별로 분류해 보고해 달라.
검증 대상 규칙과 케이스 정의는 `apps/cms/tests/e2e/HISTORY_NAVIGATION_E2E_PROMPT.md`에 있다. 먼저 읽고 시작한다.

## 반드시 지킬 것

- **앱 코드(`apps/cms/src/**`)는 수정하지 않는다.** 앱 버그로 보이면 재현 절차만 보고한다.
- 수정은 `tests/e2e/flows/history-navigation/**`, `tests/e2e/helpers/history-stack.ts`, 그리고 꼭 필요한 경우 `tests/e2e/pages/*.page.ts`로 한정한다. 수정하기 전에 이유와 영향 범위를 먼저 적는다.
- 작업 트리에는 커밋하지 않은 변경과 staged 변경이 많다. **commit, push, stash, reset, clean, checkout(브랜치 변경)은 하지 않는다.** 파일을 지우지 않는다.
- 이미 실행 중인 dev 서버를 종료하거나 재시작하지 않는다(`reuseExistingServer`로 재사용됨).
- 데이터를 바꾸는 동작(생성·수정·삭제·승인·저장)은 하지 않는다. `E2E_ALLOW_MUTATION`은 설정하지 않는다.
- 테스트를 통과시키려고 단언을 약하게 바꾸지 않는다. 예를 들어 `idx` 단언 제거, `toHaveURL`을 느슨한 정규식으로 교체, `test.skip` 남발은 금지다.
- 실행하지 않은 테스트를 PASS로 보고하지 않는다.

## 실행 환경

작업 디렉터리: `apps/cms`

| 변수 | 용도 |
| --- | --- |
| `E2E_MFA_CODE` | 실제 백엔드 로그인용 MFA 코드(`auth.setup.ts`). 사용자에게 받는다. 추측하거나 하드코딩하지 않는다 |
| `E2E_BASE_URL` / `E2E_PORT` | 이미 떠 있는 CMS 주소. 없으면 `pnpm dev`가 자동으로 뜬다(기본 `http://127.0.0.1:3000`) |
| `E2E_ADMIN_AUTH_FILE` | 저장된 세션 파일 경로(기본 `tests/e2e/.auth/admin.json`). 유효하면 MFA를 다시 하지 않는다 |
| `E2E_LOG_METADATA_ONLY=1` | 개인정보 없이 메타데이터만 기록하는 모드. trace·스크린샷·영상이 꺼지고 worker 1개로 실행된다. 결과 공유용 실행에서 사용한다 |

- `E2E_MOCK_AUTH=1`은 쓰지 않는다. 목업 인증으로는 시드 데이터가 없어 대부분 skip된다.
- 로그인 세션이 없거나 만료됐고 `E2E_MFA_CODE`도 없으면 **실행을 멈추고 사용자에게 요청**한다.

## 진행 순서 (단계마다 결과를 보고하고 다음 단계 진행 여부를 확인받는다)

### 1단계: 사전 점검 (실행 없음)
```bash
pnpm exec tsc --noEmit -p tsconfig.json
pnpm exec playwright test tests/e2e/flows/history-navigation --project=chromium --list
```
- 테스트 목록이 41개인지 확인한다. 타입 오류나 import 오류가 있으면 여기서 보고한다.
- `tsconfig.json`이 e2e를 포함하지 않으면, 어떤 tsconfig로 검사했는지 적는다.

### 2단계: 한 파일로 연기 테스트
```bash
pnpm exec playwright test tests/e2e/flows/history-navigation/account-payment.spec.ts --project=chromium --workers=1
```
- 로그인(setup)과 서버 연결이 되는지만 확인한다. 실패하면 환경 문제로 분류하고 멈춘다.

### 3단계: 전체 실행
```bash
pnpm test:e2e:history -- --workers=1
```
- `--workers=1`: 같은 계정 세션과 `sessionStorage`를 쓰는 테스트끼리 간섭하지 않도록 한다.
- 결과를 공유해야 하면 `E2E_LOG_METADATA_ONLY=1`을 붙여 다시 실행한다.

### 4단계: 실패 분류 (수정 전)
실패한 테스트마다 아래 중 하나로 분류하고 근거를 적는다.

| 분류 | 판단 기준 | 조치 |
| --- | --- | --- |
| **A. 앱 버그** | 규칙 위반이 재현된다. 예: 닫기 후 `idx`가 목록보다 크다, `history.length`가 늘었다, `goForward`로 상세가 다시 열리지 않는다 | 수정하지 않는다. 재현 절차, 기대값과 실제값(`idx`, URL)을 보고한다 |
| **B. 테스트 버그** | 셀렉터 오류, 대기 부족, 쿼리 이름 오타, 규칙을 잘못 이해한 단언 | 수정안을 먼저 설명하고, 승인 후 고친다 |
| **C. 시드 없음** | 대상 행·링크가 없어 진행할 수 없다 | 이미 annotation으로 skip 처리됐는지 확인한다. 아니면 B로 분류한다 |
| **D. 환경** | 로그인 실패, 서버 미기동, 백엔드 5xx, 타임아웃이 반복된다 | 수정하지 않는다. 로그와 함께 보고한다 |

- 판단이 애매하면 A로 단정하지 말고 "A 또는 B"로 적은 뒤, 추가로 확인할 방법을 제안한다.
- 같은 테스트를 `--repeat-each=3`으로 돌려 간헐 실패(flaky)인지 확인한다.

### 5단계: 테스트 버그 수정 후 재실행
- 승인받은 B 항목만 고친다. 해당 spec만 다시 실행한 뒤 전체를 한 번 더 실행한다.

## 결과 보고 형식

1. 수행한 작업(실행한 명령, 사용한 환경변수. MFA 코드 값은 적지 않는다)
2. 변경한 파일(없으면 "없음")
3. 변경 이유
4. 결과 요약: 통과, 실패, skip 개수
   - spec별 표: 파일, 통과/실패/skip, 실패 분류(A~D)
   - skip 목록과 사유(annotation 문구)
5. 앱 버그(A) 상세: 테스트 이름, 재현 절차, 기대 vs 실제(`idx`, `history.length`, URL), 관련 코드 추정 위치
6. 미검증 항목과 남은 위험(실행하지 못한 케이스, flaky 의심)
7. 다음 단계 제안과 진행 여부 확인
