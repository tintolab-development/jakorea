# CMS · Platform 알림톡 · 메일 · 문자 자동발송

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-25 |
| **용도** | CMS와 Platform을 같이 손볼 때 자동발송 케이스의 경계·키·화면을 고정한다 |
| **eventType SSOT** | [`notification-event-type-labels.ts`](../../apps/cms/src/features/dashboard/model/notification-event-type-labels.ts) (Wave1–13) |
| **채널 bind SSOT** | 백엔드 catalog (`notification_event` + `notification_event_channel_template`). 이 문서에 없는 채널은 만들지 않는다 |
| **시트** | `[tinto lab] JA Korea_알림발송 채널 별 문구 체크리스트_260831` |
| **수신 핸드오프** | [`CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md`](../../apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md) · [`CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md`](../../apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md) |

## 세 축을 섞지 않는다

| 축 | 누가 보내는가 | FE가 하는 일 |
|----|----------------|--------------|
| **자동발송** | JABACK. 도메인 이벤트 → catalog 채널 ON → outbox → NHN(알림톡·메일·문자) 및 WEB | path·스케줄러·템플릿 bind를 **만들지 않는다** |
| **CMS 수동 발송** | 관리자가 알림톡·메일·문자 화면에서 고른 수신자에게 발송 | `apps/cms/src/features/notifications/**` |
| **WEB 인박스** | 같은 `eventType`의 인앱 알림 | CMS 대시보드 인박스 · Platform 헤더 알림 패널(`apps/platform/src/features/notification`) 연동 |

수동 발송 피커(Option A): SYSTEM·자동발송 전용 변수는 `enabled=false`. 프로그램 지정 시 「템플릿 사용」이 꺼진다. 자동발송 템플릿을 수동 피커에서 쓰게 만들지 않는다.

「시트에 알림톡/메일이 있다」와 「지금 그 채널로 나간다」는 다르다. 외부채널은 **승인된 템플릿이 bind된 것만** 나간다. 승인 전 케이스는 WEB만인 경우가 있다.

## 앱 경계

| | CMS (`apps/cms`) | Platform (`apps/platform`) |
|--|------------------|----------------------------|
| 역할 | 관리자 인박스, 수동 발송, 심사·일정·피드백처럼 **관리자 액션이 이벤트를 만드는 화면** | 가입·로그인·동의·신청·취소처럼 **회원 액션이 이벤트를 만드는 화면**, 이후 회원 인박스 |
| 라벨 | `resolveNotificationEventTypeLabel` | 인박스 연동 시 **같은 키·같은 한글**을 쓴다. 라벨을 Platform에 새로 짓지 않는다 |
| 금지 | Platform 화면 패턴을 CMS 알림 UI에 이식 | CMS 수동 발송 UI·Orval notifications 클라이언트를 Platform에 복사 |

회원 이벤트(`MEMBER_*`, `PROGRAM_*`, `UJAT_*` 등)의 수신자는 사용자 홈페이지 회원이다. `ADMIN_*` 는 CMS 관리자 인박스다. `PROGRAM_NOTICE_CREATED`(회원)와 `ADMIN_PROGRAM_NOTICE_CREATED`(관리자)를 한 라벨로 합치지 않는다.

프로그램 유형(일반 / UJAT / 1사1교 / Gemini) 알림을 한 유형 작업에서 다른 유형 기본 동작으로 바꾸지 않는다. UJAT 키는 UJAT 화면 전용이다.

마케팅 수신 동의와 서비스 자동발송을 같은 스위치로 다루지 않는다. 마케팅 미동의는 알람 수신 제한이다. 가입·신청·심사·마감 안내는 그 정책과 별도로 백엔드 catalog를 따른다.

## 채널이 문서에 있는 케이스 (2026-09-10)

여기 없는 이벤트의 알림톡·메일·문자 여부는 **비어 있는 것**이다. FE에서 채널을 채우지 않는다.

| eventType | 채널 | 비고 |
|-----------|------|------|
| `ADMIN_MFA_FAILURE_NOTICE` | WEB + 알림톡 | 실패 **5회째 잠금과 동시에** 각 1건. 1~4회는 알림 없음. 템플릿 `관리자_2단계_인증_실패_안내` |
| `ADMIN_LOGIN_LOCK_NOTICE` | WEB | 알림톡 없음 |
| `MEMBER_SIGNUP_COMPLETED` | 템플릿 `회원가입완료안내` (V108) | 기타 Wave2 A는 APPROVED 템플릿 없으면 WEB |
| `MEMBER_CONSENT_WITHDRAWN` | 템플릿 `동의_철회_안내` | |
| `DORMANT_ACCOUNT_TRANSITIONED` | 템플릿 `계정_휴면_전환_처리_안내` | |
| 휴면 **전환 예정** | EMAIL | `DORMANT_ACCOUNT_PRE_NOTICE` |
| `MEMBER_CONSENT_EXPIRING` | WEB + EMAIL | 알림톡은 승인 후. 템플릿 `필수_동의_항목_만료_예정_안내`. 스케줄러 기본 OFF |
| `MEMBER_IDENTITY_VERIFIED` | WEB | |
| `DORMANT_ACCOUNT_WITHDRAWAL_PRE_NOTICE` | WEB | 알림톡은 승인 후. 스케줄러 기본 OFF |
| `MEMBER_WITHDRAWAL_COMPLETED` | WEB | 익명화 전. 외부채널은 후속 |

MFA: 최대 5회. 5회째 `ACCOUNT_LOCKED`(423)와 알림이 동시에 간다. 「4회째 경고」「6회 잠금」구계약은 폐기되었다.

## eventType 목록

한글은 라벨 맵과 같다. **촉발**은 이 저장소에서 확인된 사용자 행동이다. 스케줄·배치로만 보이는 것은 BE다.

### 인증 · 가입 · 동의 · 휴면

| eventType | 한글 | 촉발 |
|-----------|------|------|
| `MEMBER_LOGIN_FAILURE_NOTICE` | 로그인 실패 안내 | Platform 로그인 |
| `MEMBER_LOGIN_LOCK_NOTICE` | 계정 잠금 처리 안내 | Platform 로그인 |
| `ADMIN_LOGIN_LOCK_NOTICE` | 계정 잠금 처리 안내 | CMS 관리자 로그인 |
| `ADMIN_MFA_FAILURE_NOTICE` | MFA 2단계 인증 실패 안내 | CMS MFA 5회째 |
| `MEMBER_SIGNUP_COMPLETED` | 회원가입 완료 안내 | Platform 가입 완료 |
| `MEMBER_IDENTITY_VERIFIED` | 본인인증 완료 | Platform 본인인증 |
| `MEMBER_CONSENT_COMPLETED` | 동의 완료 | Platform 동의 완료 |
| `MEMBER_CONSENT_WITHDRAWN` | 동의 철회 안내 | 동의 철회 |
| `MEMBER_CONSENT_EXPIRING` | 필수 동의 항목 만료 예정 | BE 스케줄러 |
| `DORMANT_ACCOUNT_PRE_NOTICE` | 계정 휴면 전환 예정 안내 | BE 스케줄러 |
| `DORMANT_ACCOUNT_TRANSITIONED` | 계정 휴면 전환 처리 안내 | BE |
| `DORMANT_ACCOUNT_WITHDRAWAL_PRE_NOTICE` | 장기 휴면 회원 탈퇴 처리 안내 | BE 스케줄러 |
| `MEMBER_WITHDRAWAL_COMPLETED` | 홈페이지 탈퇴 완료 안내 | Platform 탈퇴 |

### 프로그램 신청

신청 **접수** 전용 `eventType`은 라벨 맵에 없다. 접수 API를 붙일 때 알림 키를 새로 짓지 않는다. 백엔드 catalog에 키가 생긴 뒤에만 라벨 맵에 추가한다.

| eventType | 한글 | 촉발 | 수신 |
|-----------|------|------|------|
| `PROGRAM_APPLICATION_CANCELLED` | 프로그램 신청 취소 완료 | Platform 마이페이지 신청 취소 | 회원 |
| `ADMIN_PROGRAM_APPLICATION_CANCELLED` | 프로그램 신청 취소 | 회원 취소의 관리자 통지 | CMS |
| `ORGANIZATION_APPLICATION_APPROVAL_CANCELLED` | 기관 승인 취소 | CMS 심사 취소 | 회원 |
| `ORGANIZATION_APPLICATION_REJECTION_CANCELLED` | 기관 반려 취소 | CMS 심사 취소 | 회원 |
| `INDIVIDUAL_APPLICATION_REJECTION_CANCELLED` | 개인 반려 취소 | CMS 심사 취소 | 회원 |

CMS 「알림 재발송」은 새 이벤트가 아니다. 승인/반려 결과를 다시 outbox에 넣는 관리자 액션이다.

- 강사: `POST /api/admin/instructor-applications/{applicationId}/notifications/resend` (BE 존재)
- 개인: `POST /api/admin/individual-applications/{applicationId}/notifications/resend` — CMS 모달은 있고 HTTP는 아직 없음 ([요청 문서](../../apps/cms/docs/api/general-individual-application-notification-resend-backend-request-2026-09-16.md))
- 재발송 카피·대상(개인/기관/강사)은 `applicant-notification-resend.ts`. Platform 신청 화면에 재발송 UI를 두지 않는다.

### 마감 · 미제출

마감 안내는 BE 스케줄러다. 미제출 `ADMIN_*` 는 CMS 관리자 인박스다.

| eventType | 한글 | 수신 |
|-----------|------|------|
| `STUDENT_ROSTER_SUBMISSION_DEADLINE_NOTICE` | 학생 명단 제출 마감일 안내 | 회원 |
| `PORTRAIT_CONSENT_SUBMISSION_DEADLINE_NOTICE` | 초상권 동의서 제출 마감일 안내 | 회원 |
| `LECTURE_REPORT_SUBMISSION_DEADLINE_NOTICE` | 강의보고서 제출 마감일 안내 | 회원 |
| `EXPENSE_RECEIPT_SUBMISSION_DEADLINE_NOTICE` | 영수증 제출 마감일 안내 | 회원 |
| `SETTLEMENT_APPLICATION_SUBMISSION_DEADLINE_NOTICE` | 지급조서 제출 마감일 안내 | 회원 |
| `ADMIN_PORTRAIT_CONSENT_UNSUBMITTED` | 초상권 동의서 미제출 | CMS |
| `ADMIN_STUDENT_ROSTER_UNSUBMITTED` | 학생 명단 미제출 | CMS |
| `ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED` | 개인 프로그램 교육진행자 미배정 건 안내 | CMS |
| `ADMIN_ORGANIZATION_PROGRAM_INSTRUCTOR_UNASSIGNED` | 기관 프로그램 교육진행자 미배정 건 안내 | CMS |

### UJAT

| eventType | 한글 |
|-----------|------|
| `UJAT_ORGANIZATION_SCHEDULE_SUBMITTED` | UJAT 진행 일정 제출 완료 |
| `UJAT_ORGANIZATION_SCHEDULE_APPROVED` | UJAT 진행 일정 승인 완료 |
| `UJAT_ORGANIZATION_SCHEDULE_REVISION_REQUESTED` | UJAT 진행 일정 수정 요청 |
| `UJAT_VOLUNTEER_ATTENDANCE_STATUS_CHANGED` | UJAT 출석 현황 안내 |
| `UJAT_ATTENDANCE_MANAGER_CHANGED` | UJAT 출석 현황 관리자 변경 안내 |

구 키 `UJAT_VOLUNTEER_ATTENDANCE_NOTICE` 는 호환용이다. 신규 코드는 `STATUS_CHANGED` 만 쓴다.

### 수료 · 배정 · 시작 · 일정 · 피드백 · 정산

| eventType | 한글 | 메모 |
|-----------|------|------|
| `PROGRAM_PARTICIPANT_COMPLETION_COMPLETED` | 프로그램 수료 완료 안내 | |
| `PROGRAM_PARTICIPANT_COMPLETION_NOT_COMPLETED` | 프로그램 수료 불가 안내 | 구 키 `…_FAILED` 는 호환용 |
| `ACTIVITY_ORGANIZATION_ASSIGNED` | 활동 기관 배정 완료 | |
| `ACTIVITY_ORGANIZATION_ASSIGNMENT_CANCELLED` | 활동 기관 배정 취소 | |
| `PROGRAM_START_NOTICE` | 프로그램 시작 안내 | |
| `PROGRAM_PREPARATION_NOTICE` | 프로그램 준비 안내 | |
| `PROGRAM_NOTICE_CREATED` | 신규 안내사항 안내 | 회원 |
| `ADMIN_PROGRAM_NOTICE_CREATED` | 신규 안내사항 안내 (관리자) | CMS |
| `PROGRAM_INFO_CHANGED` | 프로그램 정보 변경 안내 | |
| `EDUCATION_SCHEDULE_CONFIRMED` | 교육 일정 확정 | CMS 일정 확정이 촉발 |
| `EDUCATION_SCHEDULE_CHANGED_BEFORE_ASSIGNMENT` | 교육 일정 변경 (배정 전) | |
| `EDUCATION_SCHEDULE_CHANGED_AFTER_ASSIGNMENT` | 교육 일정 변경 (배정 후) | |
| `ASSIGNMENT_FEEDBACK_REQUESTED` | 과제 피드백 확인 요청 | CMS 피드백 작성. Platform은 모달 open 시 피드백만 GET |
| `EDUCATION_PLAN_FEEDBACK_REQUESTED` | 교육계획서 피드백 확인 요청 | UJAT |
| `EDUCATION_JOURNAL_FEEDBACK_REQUESTED` | 교육일지 피드백 확인 요청 | UJAT |
| `SETTLEMENT_CORRECTION_COMPLETED` | 지급조서 정정 완료 | CMS 정산 정정 → 회원 |

## Platform에서 이 문서를 쓸 때

- 프로그램 신청 플로우를 붙여도 알림 발송 API를 Platform에 만들지 않는다. 신청·취소 API가 백엔드 이벤트를 만들면, 수신 확인은 인박스(미구현)와 NHN이다.
- 인박스를 열 때는 CMS `NOTIFICATION_EVENT_TYPE_LABELS` 의 키를 그대로 쓴다. 없는 코드는 raw를 보여주지 않고 `알림` 으로 떨어뜨린다.
- 헤더 「알림」 버튼은 `features/notification` 인박스 패널을 연다 (`GET /api/portal/me/notifications`, 카드 클릭 시 `PATCH …/{recipientId}/clicked`로 읽음). 카테고리 탭 코드·라벨은 JABACK `MemberNotificationCategory`와 같고, 카드 제목·카테고리 라벨은 서버 응답(`title`, `notificationCategoryLabel`)을 그대로 쓴다.

## CMS에서 이 문서를 쓸 때

- 수동 발송 화면(알림톡·메일·문자 템플릿/발송/이력)과 자동발송 catalog 편집을 한 작업으로 합치지 않는다.
- 인박스 라벨을 화면마다 하드코딩하지 않는다. `resolveNotificationEventTypeLabel` / `resolveNotificationInboxTitle`.
- 프로그램 관리 유형 경계를 알림 작업에서도 유지한다.

## 갱신

라벨 맵에 키를 추가·삭제하면 이 문서의 표도 같은 커밋에서 고친다. 채널 열은 백엔드 핸드오프에 적힌 문장만 옮긴다.
