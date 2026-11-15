# [BE] 알림 메일 버튼 — 운영 반영을 위한 BE 요청

## 목표
QA 「공통_기타 > 알림 메일 발송 시」에서는 메일 버튼이 `[버튼명]` 글자로만 보이고 누를 수 없다.
FE는 메일 버튼을 CMS primary 버튼 모양의 HTML 링크로 만들어 템플릿에 넣고, CMS 편집기에서 다시 저장해도 유지되게 했다.
링크 주소는 BE가 발송 시 채우는 `#{도메인 변수}#{알림 링크 경로}`로 만든다(BE 회신 방식 A-2, `CMS_FE_EMAIL_BUTTON_LINK_20261115.md`).
운영에서 동작하려면 BE 배포·환경변수·템플릿 교체가 필요해 요청한다.

## 로컬 검증 결과 (2026-11-15)
- 로컬 JABACK(`keonhee`, NHN 실발송)에서 템플릿 264 `사용자_문의_접수_완료`의 버튼을 아래 HTML로 바꿨다. 회원 문의를 등록해 실제 메일로 받았다.
- 버튼이 CMS primary 모양으로 보였고, 링크는 `https://localhost:5173/mypage/inquiries`로 채워졌다.
  - delivery 2372: `templateParameters`에 `홈페이지 도메인=localhost:5173`, `알림 링크 경로=/mypage/inquiries`가 들어갔다.
- 템플릿에 HTML 블록 태그(`<p>`, `<table>`)가 있으면 BE는 HTML 그대로 보내고, `href` 안의 `#{…}`도 치환한다(`NotificationTemplateParameterResolver.renderLocalTemplateForEmailBody`).
  - 그래서 BE 렌더링 쪽은 바꿀 것이 없다.

## FE 반영 완료 (참고, BE 변경 불필요)
- **메일 버튼 HTML (CMS primary h40):** `layout-html.ts`의 `mailPrimaryButtonHtml(label, href)`. 표식은 `table[data-mail-button]`이고 스타일은 모두 인라인이다.
  - 배경 #00a0af, 흰 글자 14px/600, 높이 40(최소), 모서리 8px, 테두리 1px rgba(61,61,61,0.1)
  - 폭은 라벨 길이만큼이고, 라벨이 길면 단어 단위로 줄바꿈한다(말줄임 없음).
- **CMS 메일 편집기:** 버튼 표를 버튼 노드(`MailButton`)로 읽고, 저장할 때 같은 HTML을 다시 쓴다.
  - 편집기에서 열고 저장해도 버튼 스타일과 href가 남는다.
- **빈 줄:** 편집기가 저장하던 빈 문단 `<p></p>`를 `<p><br></p>`로 바꿔 저장한다.
  - 메일 클라이언트에서 빈 줄이 사라지던 문제를 고쳤다.
- **수정 없이 저장한 템플릿:** 원문 그대로 저장된다(기존 동작). 버튼으로 바뀌는 것은 실제로 수정해서 저장한 템플릿뿐이다.

버튼 HTML 형식(회원 예시, 실제 저장값은 브라우저가 style을 정규화해 `rgb()` 등으로 바뀔 수 있음):
```html
<table data-mail-button="" role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;"><tr><td height="40" bgcolor="#00a0af" style="height:40px;box-sizing:border-box;border:1px solid rgba(61,61,61,0.1);border-radius:8px;background:#00a0af;text-align:center;"><a href="https://#{홈페이지 도메인}#{알림 링크 경로}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:9px 15px;color:#ffffff;font-family:Pretendard,Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;text-decoration:none;word-break:keep-all;overflow-wrap:break-word;">문의 내역 보기</a></td></tr></table>
```
관리자 템플릿은 href만 `https://#{CMS 어드민 도메인}#{알림 링크 경로}`로 다르다.

---

## BE 회신 현황 (2026-11-15, 3차 회신 정정 반영)
요약: BE 렌더링·API 계약 변경 없음(새 API·OpenAPI 변경 없음). (B)안 실행기는 BE 리뷰 완료, 관련 테스트 26건 통과. 커밋·배포 전.

| 요청 | 상태 |
|---|---|
| 1. 운영·스테이징 환경변수 3개 | `production.env.example`에 반영(미커밋), `EnvProfileTemplatesContractTest`로 고정. **실제 운영 서버 설정은 운영 작업 — 완료 시 BE가 알림.** 스테이징 값 미정(`development.env.example` 빈 값) |
| 2. BE 반영분 운영 배포 | 도메인 변수·관리자 링크 경로는 커밋됨(`ec7e79dcf`, `85413ce71`), **운영 미배포.** 5·6번 수정은 미커밋 → 다음 커밋에 포함 |
| 3. NHN 앱 키 공유 여부 | **확인 대기** — 앱 키는 환경변수로만 받아 저장소로 판단 불가, 운영 확인 요청 중. 자동 sync 지적은 BE도 인정. FE·BE 모두 sync 동작은 그대로 둔다. 같은 앱이면 BE가 (가) 1·2번과 5번 운영 선반영 또는 (나) 264·235 평문 원복 중 하나를 정해 회신 (3차 정정: 대상 264·235) |
| 4. 일괄 교체 방법 | **(B)안 채택.** `NotificationEmailButtonBody`·`NotificationEmailButtonMigrationRunner` 그대로 사용(BE 리뷰 완료). 운영 조건: APPLY는 **인스턴스 1대에서만**(ApplicationRunner), 운영 DRY_RUN 로그를 FE와 함께 확인 후 APPLY, 실행 후 MODE=OFF |
| 5. 문의 메일함(235) | BE 로컬 반영(미커밋) — `ADMIN_INQUIRY_CREATED_MAILBOX` + DIRECT 수신자에게만 `#{CMS 어드민 도메인}`, `#{알림 링크 경로}=/admin/posts/inquiries`를 채운다. 다른 DIRECT 발송은 그대로(`NotificationEmailLinkDomainTest`). 메일함 수신자에게 링크를 줄지는 **기획 결정** |
| 6. 260 바인딩 | BE 로컬 반영(미커밋) — 카탈로그 이름 괄호 수정. 배포 후 EMAIL sync로 연결 생성. 운영 NHN 260 실제 이름(괄호 여부)은 BE 확인 중. 261은 대상 아님 |
| 7. 227 두 번째 버튼 경로 | **기획 결정 대기** — BE가 채우는 경로는 `/login` 하나, 홈페이지 어드민 로그인 경로는 BE 저장소에서 확인 불가. 결정 전까지 실행기는 227을 건너뜀 |

### 위험 1 — 버튼 템플릿은 경로를 못 구하면 발송이 실패한다 (기획 확인 필요)
- 지금 `[버튼명]` 평문 메일은 경로가 없어도 그대로 나간다.
- 버튼으로 바꾸면 `#{알림 링크 경로}`를 구하지 못한 경우 **발송 자체가 실패한다**(fail-closed). 예:
  - 260에서 승인된 신청이 정확히 1건이 아닐 때
  - 관리자 프로그램 이벤트에서 프로그램이 삭제됐을 때
  - 회원 이벤트의 데이터 조건이 맞지 않을 때
- 이 위험을 받아들일지 기획이 정할 때까지 **운영 APPLY는 보류**한다.

### 운영 반영 순서 (BE 제안, 앞 단계가 끝나야 다음으로)
1. 3번 NHN 앱 공유 여부 확인. 같은 앱이면 264·235 처리 방식 결정 — (가) 1·2·5번 선반영 / (나) 264·235 평문 원복
2. BE 커밋·운영 배포(2·5·6번 포함)
3. 운영 환경변수 3개 설정(스테이징은 값 확정 후)
4. 운영 EMAIL sync 후 260 연결 확인
5. 운영 DRY_RUN(인스턴스 1대) — FE와 함께 교체 대상 수·skipped 사유 확인(로컬 34건과 다를 수 있음)
6. 위험 1·7번 기획 결정 반영 후 APPLY(인스턴스 1대), 끝나면 MODE=OFF

### FE 할 일 (BE 회신 기준)
- 운영 반영 순서 1~4번이 끝나기 전에는 운영 템플릿에 버튼을 넣지 않는다.
- 운영 DRY_RUN 로그 확인에 참여한다.
- FE 코드 변경 요청 없음. 자동 sync 동작도 지금은 그대로 둔다.

### 기획 결정이 필요한 항목
| 항목 | 결정할 것 |
|---|---|
| 위험 1 | 경로를 못 구한 버튼 메일이 발송 실패하는 것을 받아들일지 |
| 5번(235) | 고객사 메일함 수신자에게 CMS 문의 목록 링크를 줄지 |
| 7번(227) | 두 번째 버튼: (a) 같은 경로 / (b) 별도 경로 변수 / (c) CMS 버튼만 |

### FE 추가 확인 — 운영 CMS는 메일 관리 화면 진입 시 sync를 자동 호출한다
- CMS 「알림 메시지 관리 > 메일 관리」는 화면에 들어갈 때마다 `POST /api/admin/notification-templates/sync?channelType=EMAIL`과 발신 프로필 sync를 자동으로 호출한다(`apps/cms/src/features/notifications/api/mail-template-service.ts` `syncMailCatalog`).
- 따라서 "운영에서 sync를 실행하지 않는다"는 운영자가 메일 관리 화면을 열면 지켜지지 않는다.
- BE 회신(2차): 지적이 맞다. 확인될 때까지 FE·BE 모두 sync 동작은 바꾸지 않고, NHN 앱이 같으면 BE가 (가) 1·2번과 5번 운영 선반영 또는 (나) 264·235 평문 원복을 정한다.
- FE는 자동 sync 동작을 바꾸지 않았다.

---

## 요청 사항 (우선순위 순)

### 1. 운영·스테이징 환경변수 3개를 설정해 주세요 (필수)
값이 비면 버튼이 들어간 템플릿은 필수 변수 누락으로 **발송이 실패한다**(`putRecipientLinkDomains` fail-closed). 값은 scheme과 경로 없이 호스트만 넣는다.

| 환경변수 | 운영 값 | 쓰는 수신자 |
|---|---|---|
| `JA_NOTIFICATION_LINKS_HOMEPAGE_DOMAIN` | `www.jakorea.org` | 회원(MEMBER) — `#{홈페이지 도메인}` |
| `JA_NOTIFICATION_LINKS_CMS_ADMIN_DOMAIN` | `cms.jakorea.org` | 관리자(ADMIN) — `#{CMS 어드민 도메인}` |
| `JA_NOTIFICATION_LINKS_HOMEPAGE_ADMIN_DOMAIN` | `admin.jakorea.org` | 관리자(ADMIN) — `#{홈페이지 어드민 도메인}` (현재 이 변수를 쓰는 템플릿 없음) |

- 스테이징 값도 알려 주세요. FE 검증 때 같은 값으로 맞춘다.
- `config/env/production.env.example`에 세 항목이 있는지 확인해 주세요. FE는 권한상 확인하지 못했다.

### 2. 링크 경로·도메인 변수 BE 반영분을 운영에 배포해 주세요 (필수)
- `CMS_FE_EMAIL_BUTTON_LINK_20261115.md`에 적힌 BE 변경(JABACK `keonhee`, 미배포)이 대상이다.
  - 관리자 이벤트 `#{알림 링크 경로}` 채우기, 수신자별 도메인 변수 채우기.
- 1·2번이 운영에 반영되기 전에는 운영 템플릿에 버튼을 넣지 않는다. 넣으면 해당 메일 발송이 실패한다.

### 3. NHN 템플릿 공유 여부를 확인해 주세요 (필수, 즉시)
- 로컬 CMS에서 템플릿을 저장하면 NHN 템플릿도 수정된다(`NotificationService` → `nhn.updateEmailTemplate`).
- 2026-11-15 로컬 검증 중 템플릿 264 `사용자_문의_접수_완료`와 235 `관리자_신규_문의_접수`를 CMS 화면에서 버튼 HTML로 저장했다(둘 다 `PATCH /api/admin/notification-templates/{id}` 200). 이 저장은 `nhn.updateEmailTemplate`으로 NHN을 먼저 수정하므로, 두 템플릿 모두 로컬이 쓰는 NHN 앱에 반영됐다. NHN 콘솔에서 직접 보지는 않았다.
- 로컬과 운영(또는 스테이징)이 **같은 NHN 앱 키**를 쓰는지 확인해 주세요.
  - 같다면 운영 CMS가 템플릿을 동기화(`POST /api/admin/notification-templates/sync`)할 때 이 HTML을 가져간다.
  - 그 상태에서 1·2번이 준비되지 않았으면 운영의 문의 접수 메일이 실패할 수 있다.
  - 이 경우 264·235를 원래 평문으로 되돌릴지, 1·2번과 5번을 먼저 반영할지 정해 주세요.
  - 264: 운영에 1·2번이 없으면 회원 문의 접수 메일이 실패할 수 있다.
  - 235: 관리자 수신은 1·2번이면 되지만, 고객사 메일함(`ADMIN_INQUIRY_CREATED_MAILBOX`) 발송은 5번까지 배포돼야 한다. 그 전에는 메일함 발송이 실패할 수 있다.

### 4. 템플릿 일괄 교체 방법을 정해 주세요 (필수)
`[버튼명]` 평문인 EMAIL 템플릿 중 **36개**에 버튼을 넣는다(아래 표). 방법을 BE가 정해 주세요.
- **(A) CMS에서 하나씩 재저장:** 운영자가 각 템플릿에서 `[버튼명]` 줄을 버튼으로 바꿔 저장한다.
  - CMS 편집기에는 버튼을 새로 넣는 메뉴가 없다(시안 없음). 이 방식을 쓰려면 FE가 버튼 삽입 UI 시안을 받아야 한다.
- **(B) BE 마이그레이션 + NHN 재동기화 (FE 권장):** `[버튼명]` 줄을 위 버튼 HTML로 바꾸는 일괄 스크립트를 BE가 실행하고 NHN에 반영한다.
  - 평문 템플릿은 줄마다 `<p>…</p>`, 빈 줄은 `<p><br></p>`로 바꿔야 줄바꿈이 유지된다. FE 편집기 저장 형식과 같다.
  - 버튼 라벨은 대괄호를 뺀 글자를 쓴다. 예: `[문의 내역 보기]` → `문의 내역 보기`
  - 운영 템플릿 목록은 BE가 운영 DB 기준으로 다시 뽑아 주세요. 아래는 로컬 DB 기준이다.

#### (B) 구현 반영 (2026-11-15, JABACK `keonhee` 로컬 수정, 커밋 전)
FE 세션이 JABACK에 (B)안 실행기를 직접 추가했다. 리뷰와 커밋·배포 판단을 부탁한다.
- **파일:**
  - `notification/service/NotificationEmailButtonBody.java` — 판정·변환
  - `notification/service/NotificationEmailButtonMigrationRunner.java` — 실행기
  - `NotificationEmailButtonBodyTest.java` — 테스트 10개 통과
  - `application.yml` — 설정 추가
  - `config/env/*.env.example` 3개, `EnvProfileTemplatesContractTest` — 1번 환경변수 예시
- **켜는 방법:** 환경변수 `JA_NOTIFICATION_EMAIL_BUTTON_MIGRATION_MODE`(`ja.notification.email-button-migration.mode`)로 켜고 서버를 시작한다.
  - `OFF`(기본): 아무것도 하지 않는다.
  - `DRY_RUN`: 로그만 남긴다.
  - `APPLY`: 실제로 바꾼다. 실행 후에는 다시 `OFF`로 둔다.
  - 새 API는 추가하지 않았다. OpenAPI·계약 파일은 바뀌지 않는다.
- **APPLY 동작:** 기존 `NotificationService.updateNotificationTemplate`으로 본문만 바꾼다. NHN 모드면 NHN 템플릿을 먼저 수정하고 DB를 수정한다.
  - 템플릿별로 실패해도 나머지는 계속 진행하고 로그에 남긴다.
  - 이미 버튼(`data-mail-button`)이 있는 템플릿은 건너뛰므로 다시 실행해도 안전하다.
- **판정 기준:** 템플릿에 연결된(EMAIL·사용 중) 이벤트가 **모두** 허용 목록에 있고 수신자 유형이 하나일 때만 바꾼다.
  - 허용 목록 `LINK_EVENT_AUDIENCE`(관리자 23, 회원 17)는 이 요청서와 BE 회신 기준이다. BE 링크 경로 로직이 바뀌면 같이 고쳐야 한다.
  - 건너뛰는 사유(로그 `skipped=`):
    - `NO_EMAIL_BINDING`(발송 연결 없음)
    - `UNSUPPORTED_EVENT`(허용 목록 밖 이벤트)
    - `MIXED_AUDIENCE`(회원·관리자 섞임)
    - `ALREADY_HAS_BUTTON`(이미 버튼 있음)
    - `HTML_BODY`(이미 HTML 본문)
    - `NO_BUTTON_LINE`(버튼 줄 없음)
    - `MULTIPLE_BUTTON_LINES`(버튼 줄 2개 이상)
    - `MULTIPLE_BUTTONS_ON_LINE`(한 줄에 버튼 2개 이상)
- **로컬 DRY_RUN 결과(46개 판정):**
  - 교체 대상 **34**: 관리자 18, 회원 16(260 포함)
  - 이미 버튼 있음 2: 235, 264
  - 발송 연결 없음 10
  - 227은 7번 참고. 수정 후 `MULTIPLE_BUTTONS_ON_LINE`으로 건너뛴다.
- **운영 APPLY 전 확인:** 1번 환경변수, 2번 배포, 3번 NHN 공유 여부, 7번 결정. 그리고 운영 DRY_RUN 로그를 FE와 함께 확인한다.

### 5. 문의 메일함 발송(템플릿 235)을 확인해 주세요 (필수)
- `관리자_신규_문의_접수`(235)는 `ADMIN_INQUIRY_CREATED`(관리자)와 `ADMIN_INQUIRY_CREATED_MAILBOX`(고객사 메일함 `jakorea@jakorea.org`, `DirectNotificationPublisher`)에 같이 연결돼 있다.
- 메일함 발송은 수신자가 ADMIN/MEMBER가 아니라 `#{CMS 어드민 도메인}`이 채워지지 않는다. 버튼을 넣으면 **메일함 발송이 실패한다**.
- 메일함 발송에도 CMS 어드민 도메인을 채우거나, 메일함용 템플릿을 분리해 주세요.
- (3차 정정) 235는 로컬에 이미 버튼이 있다(2026-11-15 CMS 저장). 5번 BE 수정이 운영에 배포되기 전에는 운영 235에 버튼이 들어가지 않게 한다(3번 참고).

### 6. 발송 연결 불일치 확인 (참고)
- `CMS_FE_EMAIL_BUTTON_LINK_20261115.md`에는 `EDUCATION_SCHEDULE_CHANGED_BEFORE_ASSIGNMENT`(260 `사용자_교육_일정_변경_배정_전`)가 EMAIL 바인딩 대상으로 적혀 있다.
- (3차 정정) 로컬은 BE 카탈로그 이름 수정 후 EMAIL sync로 연결이 생겼다(2026-11-15, `notification_event_channel_template` id 35152, 사용 중). 운영은 배포 + sync 후 운영 반영 순서 4단계에서 확인한다.

### 7. 템플릿 227의 두 번째 버튼 경로를 정해 주세요 (필수)
- `관리자_관리자_권한_승인_안내`(227, `ADMIN_ACCOUNT_APPROVED`) 본문 마지막 줄에 버튼이 **두 개** 있다.
  - `[CMS 어드민 바로가기] [홈페이지 어드민 바로가기]`
- 현재 BE가 채우는 값은 `#{알림 링크 경로}` 하나다(`CMS_FE_EMAIL_BUTTON_LINK_20261115.md` 기준 `/login`). 그래서 두 버튼이 같은 경로를 쓰게 된다.
  - CMS 버튼: `https://#{CMS 어드민 도메인}#{알림 링크 경로}` → `https://cms.jakorea.org/login`
  - 홈페이지 어드민 버튼: `https://#{홈페이지 어드민 도메인}#{알림 링크 경로}` → `https://admin.jakorea.org/login`. **이 경로가 맞는지 확인되지 않았다.**
- 아래 중 하나로 정해 주세요.
  - (a) 홈페이지 어드민 로그인 경로도 `/login`이면 같은 경로 변수를 쓴다. 두 버튼을 넣는다.
  - (b) 홈페이지 어드민 경로가 다르면 별도 경로 변수(예: `#{홈페이지 어드민 링크 경로}`)를 BE가 채운다.
  - (c) 버튼을 CMS 하나만 두고 「홈페이지 어드민 바로가기」는 뺀다. 문구 변경이므로 기획 확인이 필요하다.
- 정해질 때까지 일괄 교체 실행기는 227을 건너뛴다(`MULTIPLE_BUTTONS_ON_LINE`). 정해지면 227만 CMS에서 직접 바꾸거나 실행기 규칙을 추가한다.
- 참고: `#{홈페이지 어드민 도메인}`은 ADMIN 수신자에게 채워진다(`putRecipientLinkDomains`). 값은 운영 `admin.jakorea.org`.

---

## 적용 대상 템플릿 (로컬 DB 기준)

### 관리자 대상 20개 — `https://#{CMS 어드민 도메인}#{알림 링크 경로}`
| id | 템플릿 | 이벤트 | 버튼 |
|---|---|---|---|
| 227 | 관리자_관리자_권한_승인_안내 (⚠️ 버튼 2개, 7번 결정 전 보류) | ADMIN_ACCOUNT_APPROVED | CMS 어드민 바로가기 / 홈페이지 어드민 바로가기 |
| 232 | 관리자_신규_관리자_권한_요청 | ADMIN_SIGNUP_APPROVAL_REQUESTED | 관리자 신청 목록 보기 |
| 230 | 관리자_신규_강사_권한_요청 | ADMIN_INSTRUCTOR_ROLE_REQUESTED | 강사 신청 목록 보기 |
| 228 | 관리자_교사_정보_변경 | ADMIN_TEACHER_EMPLOYMENT_CHANGED | 교사 회원 정보 상세 보기 |
| 235 | 관리자_신규_문의_접수 (로컬 적용됨 / 5번 BE 로컬 반영, 배포·환경변수 후 운영 가능 / 메일함 링크 여부 기획 확인) | ADMIN_INQUIRY_CREATED, _MAILBOX | 문의 내용 확인하기 |
| 225 | 관리자_강사비_확인_완료 | ADMIN_PAYMENT_STATEMENT_CONFIRMED | 계좌 지급 대상 목록 보기 |
| 239 | 관리자_영수증_확인_완료 | ADMIN_EXPENSE_RECEIPT_CONFIRMED | 계좌 지급 대상 목록 보기 |
| 250 | 관리자_학생_명단_제출_완료 | ADMIN_STUDENT_ROSTER_SUBMITTED | 학생 명단 확인 |
| 249 | 관리자_학생_명단_수정_제출 | ADMIN_STUDENT_ROSTER_UPDATED | 학생 명단 확인 |
| 248 | 관리자_학생_명단_미제출 | ADMIN_STUDENT_ROSTER_UNSUBMITTED | 학생 명단 확인 |
| 242 | 관리자_초상권_동의서_미제출 | ADMIN_PORTRAIT_CONSENT_UNSUBMITTED | 학생 명단 확인 |
| 238 | 관리자_신규_정산_신청 | ADMIN_SETTLEMENT_APPLICATION_SUBMITTED | 정산 신청 내역 확인하기 |
| 240 | 관리자_정산_재신청 | ADMIN_SETTLEMENT_APPLICATION_RESUBMITTED | 정산 신청 내역 확인하기 |
| 246 | 관리자_프로그램_신규_신청자 | ADMIN_PROGRAM_APPLICATION_SUBMITTED | 신청자 목록 보기 |
| 244 | 관리자_프로그램_신규_신청_기관 | ADMIN_ORGANIZATION_APPLICATION_SUBMITTED | 신청 기관 목록 보기 |
| 243 | 관리자_프로그램_신규_신청_강사 | ADMIN_INSTRUCTOR_APPLICATION_SUBMITTED | 신청 강사 목록 보기 |
| 245 | 관리자_프로그램_신규_신청_봉사자 | ADMIN_VOLUNTEER_APPLICATION_SUBMITTED | 신청 봉사자 목록 보기 |
| 247 | 관리자_프로그램_신청_취소 | ADMIN_PROGRAM_APPLICATION_CANCELLED | 프로그램 정보 보기 |
| 231 | 관리자_신규_게시글_안내 | ADMIN_PROGRAM_NOTICE_CREATED | 게시글 확인하기 |
| 234 | 관리자_신규_댓글_안내 | ADMIN_PROGRAM_POST_COMMENT_CREATED | 댓글 확인하기 |

### 회원 대상 16개 — `https://#{홈페이지 도메인}#{알림 링크 경로}`
| id | 템플릿 | 이벤트 | 버튼 |
|---|---|---|---|
| 215 | 공통_필수_동의_항목_만료_예정 | MEMBER_CONSENT_EXPIRING | 동의 항목 확인하기 |
| 264 | 사용자_문의_접수_완료 (로컬 적용·검증 완료) | INQUIRY_RECEIVED | 문의 내역 보기 |
| 255 | 사용자_강사_권한_승인_취소 | INSTRUCTOR_ROLE_APPROVAL_CANCELLED | 관리자 1:1 문의하기 |
| 256 | 사용자_강사_권한_종료 | INSTRUCTOR_ROLE_TERMINATED | 관리자 1:1 문의하기 |
| 268 | 사용자_프로그램_수료_불가_안내 | PROGRAM_PARTICIPANT_COMPLETION_NOT_COMPLETED | 관리자 1:1 문의하기 |
| 254 | 사용자_UJAT_프로그램_신청_반려 | UJAT_ORGANIZATION_APPLICATION_REJECTED | 관리자 1:1 문의하기 |
| 253 | 사용자_UJAT_진행_일정_제출_완료 | UJAT_ORGANIZATION_SCHEDULE_SUBMITTED | 신청 내역 확인하기 |
| 252 | 사용자_UJAT_진행_일정_승인_완료 | UJAT_ORGANIZATION_SCHEDULE_APPROVED | 진행 일정 수정하기 |
| 251 | 사용자_UJAT_진행_일정_수정_요청 | UJAT_ORGANIZATION_SCHEDULE_REVISION_REQUESTED | 진행 일정 수정하기 |
| 270 | 사용자_프로그램_시작_안내 | PROGRAM_START_NOTICE | 안내사항 확인하기 |
| 271 | 사용자_프로그램_준비_안내 | PROGRAM_PREPARATION_NOTICE | 안내사항 확인하기 |
| 262 | 사용자_교육_일정_확정 | EDUCATION_SCHEDULE_CONFIRMED | 교육 일정 보기 |
| 272 | 사용자_학생_명단_제출_마감일_안내 | STUDENT_ROSTER_SUBMISSION_DEADLINE_NOTICE | 학생 명단 제출하기 |
| 267 | 사용자_초상권_동의서_제출_마감일_안내 | PORTRAIT_CONSENT_SUBMISSION_DEADLINE_NOTICE | 학생 초상권 동의서 제출하기 |
| 259 | 사용자_강의보고서_제출_마감일_안내 | LECTURE_REPORT_SUBMISSION_DEADLINE_NOTICE | 강의보고서 제출하기 |
| 269 | 사용자_프로그램_수료_완료_안내 | PROGRAM_PARTICIPANT_COMPLETION_COMPLETED | 수료증 발급하기 |

### 추가 예정 1개 — 6번 BE 반영 후 (배포 + EMAIL sync로 연결 생성)
| id | 템플릿 | 이벤트 | 버튼 |
|---|---|---|---|
| 260 | 사용자_교육_일정_변경_배정_전 (회원, `#{홈페이지 도메인}`) | EDUCATION_SCHEDULE_CHANGED_BEFORE_ASSIGNMENT | 교육 일정 보기 (본문 기존 글자) |

### 제외 10개 — EMAIL 발송 연결 없음 (버튼을 넣어도 발송되지 않음)
224 관리자_강사비_정정_요청, 241 관리자_채용_공고_마감_안내, 216 관리자_장기_휴면_회원_탈퇴_처리_안내, 217 사용자_장기_휴면_회원_탈퇴_처리_안내, 265 사용자_봉사자_배정_완료, 257 사용자_강사_배정_취소, 258 사용자_강사비_신청_마감일_안내, 266 사용자_영수증_신청_마감일_안내, 263 사용자_면접_일정_변경, 261 사용자_교육_일정_변경_배정_후(BE 회신: 이번에도 대상 아님)
- 바인딩이 생기면 같은 방식으로 버튼을 넣는다. 그 이벤트의 `#{알림 링크 경로}`도 BE가 채워야 한다.

---

## 확인 기준 (BE 반영 후)
- 회원 메일: 버튼이 CMS primary 모양으로 보이고, 누르면 `https://www.jakorea.org/…` 해당 화면으로 이동한다.
- 관리자 메일: 누르면 `https://cms.jakorea.org/…` 해당 화면으로 이동한다(로그인 필요).
- 버튼 없는 템플릿과 문의 메일함 발송이 실패 없이 나간다.
- 같은 템플릿을 CMS에서 열고 다시 저장해도 버튼 HTML이 유지된다(FE 반영분).
