# 풀페이지 상세 모달 history 정합성 E2E 작성 요청

## 배경

CMS(`apps/cms`, React Router `createBrowserRouter`)의 풀페이지 상세 모달은 모두 **URL 쿼리**로 열리고 닫힌다.
최근 "브라우저 뒤로가기 스택 = 브레드크럼 단계"가 되도록 이동 규칙을 바꿨다. 이 규칙이 모달별로 지켜지는지 Playwright E2E로 검증해 달라.

### 이동 규칙 (검증 대상)

| 동작 | 기대 동작 |
| --- | --- |
| 목록에서 상세 열기, 중첩 상세(학교·강사·봉사자·신청자 등) 열기 | **push** (history 엔트리 +1) |
| LNB·하위 메뉴 변경 | **push**. 단, 이미 선택된 메뉴를 다시 누르면 엔트리를 만들지 않는다 |
| 모달 닫기(X), 중첩 상세 닫기, 브레드크럼 상위 단계 클릭 | 목표 URL이 **이미 지나온 엔트리**면 그 엔트리로 **뒤로 이동**(`navigate(-n)`), 아니면(딥링크·새로고침) 현재 엔트리를 **replace**. **절대 push 하지 않는다** |

구현 참고:
- `src/shared/lib/history-ancestor-navigation.ts`: 핵심 로직. 엔트리 URL을 `sessionStorage['cms:history-entry-urls']`에 `history.state.idx` 기준으로 기록한다.
- `src/shared/hooks/use-history-ancestor-navigation.ts`: 훅
- `src/shared/ui/detail-fullpage-breadcrumb.tsx`: 브레드크럼
- 회원 상세 → 프로그램 상세 복귀: `src/features/user/detail/lib/member-detail-program-navigation-return.ts`

## 검증 방법 (공통)

React Router가 `history.state.idx`를 관리하므로, **idx로 스택 위치를 단언**한다. URL만으로는 push와 back을 구분할 수 없다.

`tests/e2e/helpers/history-stack.ts`에 아래 헬퍼를 만들어 공용으로 쓴다:

```ts
export async function historyIdx(page: Page): Promise<number> {
  return page.evaluate(() => (window.history.state as { idx?: number } | null)?.idx ?? -1)
}
export async function historyLength(page: Page): Promise<number> {
  return page.evaluate(() => window.history.length)
}
/** 쿼리 파라미터 존재·값 단언 (null = 없어야 함) */
export async function expectSearchParams(page: Page, expected: Record<string, string | null>): Promise<void>
```

케이스마다 확인할 기본 패턴:
1. 목록을 `page.goto`로 **한 번만** 연다(전체 새로고침은 이 한 번뿐). 이후 이동은 모두 앱 안의 클릭으로 한다. 목록의 `idx`를 `listIdx`로 저장한다.
2. 상세 열기 → `idx === listIdx + 1`
3. LNB 변경 → `idx +1`. 같은 LNB를 다시 클릭 → `idx`가 그대로다.
4. 브라우저 `page.goBack()` → 직전 LNB로 돌아가고 화면(활성 LNB)도 따라 바뀐다.
5. 모달 X 닫기 → `idx === listIdx`, 상세 쿼리가 없고, 모달이 숨겨진다. **`history.length`가 닫기 전보다 늘지 않는다.**
6. 닫은 뒤 `page.goForward()` → 마지막으로 보던 상세가 다시 열린다(앞쪽 엔트리가 보존되는지 확인).
7. **딥링크**: 상세 URL로 바로 `page.goto` → X 닫기 → URL은 목록이 되고 `idx`는 그대로다(replace). `page.goBack()`을 해도 상세가 다시 열리지 않는다.
8. 같은 틱에 X를 두 번 클릭해도 `idx`가 목록보다 작아지지 않는다(두 번 뒤로 가지 않음).

## 케이스 목록 (모달별 spec 1개씩)

파일 위치: `tests/e2e/flows/history-navigation/<모달>.spec.ts`

### 1. 일반 프로그램 상세 — `/programs/general`
- 쿼리: `programId`, `lnb`, `tab`. 중첩 상세: `schoolId`, `instructorId`, `volunteerId`, `applicantId`
- 공통 패턴 1~8
- 중첩: LNB(예: 진행 → 봉사자) → 봉사자 행 열기(`volunteerId`, push) → 중첩 닫기 → 봉사자 목록 엔트리로 뒤로(`idx -1`, `volunteerId` 없음)
- 브레드크럼: 중첩 상세 상태에서 브레드크럼의 **프로그램명**(상세 첫 단계) 클릭 → 그 엔트리까지 여러 단계를 한 번에 뒤로 이동하고, `history.length`는 그대로다
- 브레드크럼 첫 항목(목록) 클릭 → `idx === listIdx`
- 후원사 오버레이: 프로그램 상세에서 후원사 링크 클릭 → `sponsorId` 추가(push) → X 닫기 → 프로그램 상세 엔트리로 뒤로 이동하고 `sponsorId`가 없다

### 2. 우잣 프로그램 상세 — `/programs/ujat`
- 쿼리: `programId`, `lnb`, 하위 메뉴 쿼리, 봉사자 심사 신청자 상세
- 1번과 같은 항목(중첩·브레드크럼·후원사 오버레이 포함)

### 3. 제미나이 방문연수 — `/programs/gemini/visiting-training`
- 모집 상세: `recruitmentId` → 닫기 → 목록 엔트리로 뒤로 이동
- 승인 연수 상세: `approvedTrainingId`, `approvedLnb`. LNB 변경은 push, 같은 LNB 재클릭은 엔트리를 만들지 않는다
- 강사 신청 중첩: `approvedInstructorApplicationId` 열기 → 헤더 X → 중첩만 닫히고 강사 목록 엔트리로 뒤로 이동한다(모달 자체는 열려 있음) → 다시 X → 목록으로 이동

### 4. 회원 상세 → 프로그램 상세 → 복귀
- `/users/list?kind=all`에서 회원 상세 → 프로그램 이력에서 프로그램 클릭(`/programs/...`로 이동, `sessionStorage['cms:member-detail-return-after-program']`에 복귀 URL이 저장됨)
- 프로그램 상세 X → **회원 상세 URL로 뒤로 이동**(`idx`가 회원 상세 엔트리와 같음). 앞쪽에 프로그램 엔트리를 새로 쌓지 않는다
- 프로그램 상세에서 브라우저 뒤로가기로 회원 상세에 돌아간 뒤, 다른 경로로 무관한 프로그램 상세를 열고 닫는다 → 예전 회원 상세로 가지 **않는다**(복귀 URL은 `/programs` 밖으로 나가면 지워짐)

### 5. 회원 상세 — `/users/list?kind=all`
- 쿼리: `id`, `lnb`(`detail-info` 등), `programsChild`
- 공통 패턴 1~8. LNB `history`는 하위 메뉴(`programsChild`)가 있으니 하위 메뉴 변경도 push인지 확인한다
- **학교 → 소속 교사**: 학교 회원 상세 → (선택) 학교 LNB 변경 → 소속 교사 클릭(`id`가 교사로 바뀜, push) → X → **학교 상세 엔트리로 뒤로 이동**(그때 보던 LNB 그대로, `id`=학교) → 다시 X → 목록
- 기존 `flows/members/member-detail-single-click-open.spec.ts`의 오픈 대기 방식(`[?&]id=`가 URL에 반영된 뒤 조작)을 따른다

### 6. 권한 요청 회원 상세 — `/admin/permission-requests`
- 쿼리: `pr_detail_user`, `pr_detail_role`, `pr_detail_request`
- 열기(push) → X → 목록 엔트리로 뒤로. 딥링크로 열고 닫으면 replace
- 승인·반려 버튼은 누르지 않는다(데이터 변경)

### 7. 교재 상세 — `/data-management/textbook`
- 쿼리: `textbookId`, `textbookMode=view|edit`
- 행 클릭 → `view` push → 수정 버튼 → `edit` push → **취소** → `view` 엔트리로 뒤로(`idx -1`) → X → 목록
- 다른 교재 행을 열 때는 push(되돌아가기 아님)인지 확인: 목록 → A 열기 → 닫기 → B 열기 → `idx === listIdx + 1`
- 저장 후 `view` 복귀도 뒤로 이동해야 하지만 데이터를 바꾸므로 **기본은 skip**. 격리 데이터가 있을 때만 `test.skip(!process.env.E2E_ALLOW_MUTATION)`으로 실행한다

### 8. 후원사 상세 — `/data-management/sponsor`
- 쿼리: `sponsorId`, `sponsorLnb`(`sponsor-programs` 등), `returnTo`
- 공통 패턴 1~8. 기존 `flows/data-management/sponsor/detail.spec.ts`와 `pages/sponsor-management.page.ts`(`clickLnb`, `expectLnbUrl`)를 재사용한다
- `returnTo` 케이스: 다른 화면(예: 프로그램 상세)에서 후원사 페이지로 이동해 `returnTo`가 붙은 상태 → X → `returnTo` 엔트리로 뒤로 이동한다(엔트리가 없으면 replace)

### 9. 계좌 지급 현황 상세 — `/settlement-management/account-payments`
- 쿼리: `ap_detail`
- 열기(push) → X → 뒤로 이동. 딥링크 → X → replace
- 권한 없는 계정 처리는 기존 `flows/settlement/account-payments-access.spec.ts`를 참고하고, 이 spec은 관리자 계정만 다룬다

### 10. 지급명령 상세 — `/settlement-management/payment-orders`
- 쿼리: `po_detail`, `po_detail_no`, `po_detail_key`
- 열기(push) → X → 뒤로 이동. 딥링크 → X → replace

## 작성 규칙

- `@playwright/test` 대신 `tests/e2e/fixtures/test.ts`의 `test`, `expect`를 import 한다(API 오류 수집 fixture).
- 로그인은 `chromium` 프로젝트의 storageState(`auth.setup.ts`)를 그대로 쓴다.
- 셀렉터는 `tests/e2e/pages/*.page.ts`의 기존 page object를 먼저 재사용하고, 없으면 같은 스타일로 추가한다. 쿼리 이름은 위 목록을 기준으로 하되, 실제 코드에서 상수를 확인한다.
- 시드 데이터는 읽기 전용이다. 행이 없으면 기존 패턴처럼 `test.info().annotations.push({ type: 'note', ... })` 후 return 한다(실패로 처리하지 않음).
- 생성·수정·삭제·승인 같은 데이터 변경은 하지 않는다(교재 저장 케이스만 위 조건으로 예외).
- 대기는 `waitForTimeout` 대신 `expect(page).toHaveURL(...)`과 `expect.poll(() => historyIdx(page))`로 한다. 닫기·뒤로 이동은 비동기 pop이라 URL 반영을 기다린 뒤 idx를 단언해야 한다.
- 각 테스트 이름에 기대 동작을 적는다. 예: `'봉사자 상세 닫기 — 봉사자 목록 엔트리로 뒤로(push 없음)'`
- `package.json`에 스크립트를 추가한다: `"test:e2e:history": "playwright test tests/e2e/flows/history-navigation --project=chromium"`

## 완료 기준

- 10개 spec 파일과 `helpers/history-stack.ts`
- `npm run test:e2e:history`가 로컬에서 통과한다(시드가 없어 skip된 케이스는 목록으로 보고한다)
- 실패가 앱 버그로 보이면 테스트를 고쳐 통과시키지 말고 재현 절차와 함께 보고한다
