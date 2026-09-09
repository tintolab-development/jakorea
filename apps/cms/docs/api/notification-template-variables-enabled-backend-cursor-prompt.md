# Cursor prompt — 알림 template-variables `enabled` SSOT · enrich 갭

> 작성: 2026-09-09  
> 대상: JA Korea CMS Java Backend (Notifications / send-batches)  
> FE: `apps/cms/src/features/notifications` (메일·문자 발송·템플릿 변수 패널)  
> 관련 노션: [자동입력(변수값) 리스트](https://app.notion.com/p/38af3e2a77d080598856dc19c161b2cf), [사용 가능 항목](https://app.notion.com/p/341f3e2a77d080eb8b8dfd2f857baec7), [알림 발송 케이스](https://app.notion.com/p/37df3e2a77d08056afccf8c3445e24fc)

아래 블록을 백엔드 구현 에이전트·담당자에게 **그대로 전달**하면 된다.

---

## 프롬프트 (복사용)

```
당신은 JA Korea CMS Java 백엔드(Notifications)를 구현·수정한다.
프론트 레포는 없다. OpenAPI·기존 Controllers/Services/Enricher 를 찾아 맞춰라.
질문은 계약이 코드와 충돌할 때만 하라.

# 배경 / 역할 분리

CMS 알림(메일·문자·알림톡) 발송에서 템플릿 변수 `#{…}` 치환이 실패하면
`NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키` 로 fail-closed 한다 (이미 있음 — 유지).

문제 유형별 담당:

| 문제 | 담당 |
|---|---|
| 강사 전용 변수를 참여자 발송에 넣는 실수 | FE가 카탈로그 `enabled=false` 항목을 회색·삽입 차단. BE가 `enabled` SSOT 계산 |
| 목록에 뜨고 `enabled=true` 인데 enricher가 값을 못 만듦 (구현 누락) | BE enricher 갭 (예: 교육 진행 수업 시간, 배정 기관명) |
| 맥락상 사용 가능(`enabled=true`)인데 **원천 데이터가 없음** | BE **발송 실패(fail-closed)** — 아래 「변수값 데이터 부재 = 발송 실패」 |
| 빈 `#{…}` 가 NHN으로 나감 | 절대 금지. 위 fail-closed로 막는다 |

프론트는 이미 다음을 호출한다:

GET /api/admin/notification-send-batches/template-variables
  ?programId={int64?}
  &participantType={PARTICIPANT|INSTRUCTOR|VOLUNTEER?}
  &memberType={GENERAL|SCHOOL_TEACHER|INSTRUCTOR|TEACHER_AND_INSTRUCTOR|ADMIN?}
  &keyword=
  &category=

규칙 (노션·수신자 후보와 동일):
- 프로그램 선택됨 → `programId` + (유형 필터/단일 수신자 유형이 있으면) `participantType`
- 프로그램 미선택(발송 진입 기본 · 지정 해제 UI 「미선택」) → `memberType` (있으면). create 시 programId 생략
- FE는 `enabled` 를 재계산하지 않는다. 응답의 `enabled` 만 믿는다.
- `requiresProgram=true` 이고 programId 미전달이면 FE도 비활성 가드하지만, BE `enabled` 가 최종 SSOT.
- **템플릿 등록**: 변수 전체 선택·삽입 가능.
- **발송**: 해당 맥락에서 `enabled=true` 변수는 발송 화면에서 **추가(삽입) 가능**. `enabled=false`만 차단.

# Goal

1. `template-variables` 응답의 각 CatalogVariableItem 에 **`enabled: boolean` 을 맥락에 맞게 계산**해 반환한다.
2. `enabled` 는 「이 발송 맥락에서 변수 **삽입/사용이 허용되는지**」만 뜻한다.
   **원천 데이터 존재 여부와 혼동하지 마라.** (`enabled=true` ≠ 값이 항상 있다)
3. 본문·제목에 등장하는 `#{키}` 에 대해 enrich 결과가 **없거나 공백**이면 **발송 실패**로 처리한다 (fail-closed).
4. 발송 실패 계약:
   - code: `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING`
   - message / delivery.failedReason: `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}`
     (키는 카탈로그 `key` = 토큰 안쪽 라벨. 예: `교육 진행 수업 시간`)
   - 해당 delivery `sendStatus` = 발송 실패에 해당하는 상태 (기존 SEND_FAILED 등)
   - **NHN(또는 provider) 호출 전에** 실패 확정. 빈 `#{…}` / 빈 치환값 전송 금지
5. OpenAPI CatalogVariableItem / TemplateVariablesParams 와 구현이 일치한다.

완료 조건:

- [ ] programId=특정 프로그램 + participantType=PARTICIPANT 요청 시
      강사·배정 전용 변수는 `enabled=false` (목록에는 보여도 됨)
- [ ] 동일 맥락에서 참여자에 의미 있는 변수는 `enabled=true`
- [ ] participantType=INSTRUCTOR 이면 강사 맥락 변수가 `enabled=true`
- [ ] programId 없음 + memberType=GENERAL 등에서도 `enabled` 가 일관
- [ ] `enabled=true` 이고 원천 데이터가 있으면 enrich·치환 후 발송 성공
- [ ] `enabled=true` 이어도 **원천 데이터가 없으면** 해당 수신자(또는 배치)는
      발송 실패 + `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}`
      (빈 토큰 NHN 전송 금지)
- [ ] enricher 미구현(갭)과 데이터 부재를 모두 동일 fail-closed 경로로 처리
- [ ] 계약 테스트에 enabled 맥락 + **데이터 부재 발송 실패** 케이스 추가

# Out of scope / 금지

- FE가 enabled 를 로컬 재계산하도록 요구하지 마라.
- 카탈로그에서 `enabled=false` 항목을 응답에서 숨기지 마라 (디스에이블 UX용으로 목록 유지).
- invent-ban: 스키마에 없는 쿼리 키·응답 필드를 임의로 만들지 마라.
  이미 OpenAPI에 `programId` / `participantType` / `memberType` / `enabled` /
  `requiresProgram` / `participantTypes` / `memberTypes` 가 있으면 그걸 써라.
- 알림톡 NHN 템플릿 본문 수정 API를 열지 마라.
- fail-closed 를 느슨하게 만들지 마라 (빈 치환값 통과 금지).

# enabled 계산 (BE SSOT)

의사코드:

```
for each catalog variable V (Notion "사용" 항목만):
  if V.requiresProgram && programId == null:
    enabled = false
  else if participantType 이 전달됨:
    enabled = V.participantTypes 가 비었거나 participantType 을 포함
  else if memberType 이 전달됨:
    enabled = V.memberTypes 가 비었거나 memberType 을 포함
  else:
    enabled = 프로그램(또는 전체) 공통으로 안전한 변수만 true
              (유형 특화 변수는 false 권장 — FE가 유형 없이 삽입하는 실수 방지)
```

참여자 전용 / 강사 전용 매핑은 기존 domain metadata·programGroups·recruitmentTypes·
participantTypes·memberTypes 를 SSOT로 쓴다. FE에 soft-coding 표를 요구하지 마라.

# enricher 갭 vs 데이터 부재 (둘 다 발송 실패)

스크린샷/실측: `enabled=true`(또는 삽입 허용)인데 치환 값이 비어 발송 실패.

우선 확인할 키 예시:
- `교육 진행 수업 시간` (Notion: 시간 카테고리 사용 항목)
- `배정 기관명`

요구:
1. 해당 키가 enabled=true 인 발송 맥락이면 enricher 가 **가능한 한** 값을 채운다 (구현 갭 해소).
2. 그래도 값이 없으면(아래 「데이터 부재」) **발송 실패** — placeholder/`-`/공백으로 억지 치환 금지.
3. 키 철자·공백은 카탈로그 `key` 와 본문 `#{…}` 와 동일해야 한다.

# 변수값 데이터 부재 = 발송 실패 (필수)

`enabled` 와 별개로, **실발송 시점**에 템플릿(제목·본문·알림톡 필드 등)에 등장하는
모든 `#{키}` 는 enrich 후 non-blank 문자열이어야 한다.

## 「데이터 부재」 판정 (다음을 모두 부재로 본다)

- enrich 결과가 `null` / 키 자체 미존재
- `""` 또는 whitespace-only (`trim()` 후 길이 0)
- (금지) `-`, `N/A`, `#{키}` 원문 잔존, 미치환 토큰을 “값 있음”으로 취급

## 처리 규칙

1. **수신자 단위**로 enrich → 치환 검증한다.
2. 한 수신자라도 필수 키 값이 부재하면 그 delivery 는 **발송 실패**:
   - `sendStatus` = SEND_FAILED (또는 기존 발송 실패 enum)
   - `failedReason` = `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}`
   - 키가 여러 개면 **누락된 키를 모두** 드러낸다.
     권장: `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키1},{키2}`
     (최소 1개 키는 반드시 포함. 키 없는 코드만 반환 금지)
3. **provider(NHN) 호출 전**에 실패를 확정한다. 빈/미치환 본문을 외부로 보내지 마라.
4. 배치에 수신자가 여러 명이면:
   - 값이 있는 수신자만 성공 발송하고 부재 수신자만 실패로 남겨도 된다 (부분 성공 허용)
   - 또는 배치 전체를 한 번에 거절해도 된다 — **이미 프로젝트에 있는 배치 실패 정책 SSOT를 따르라.**
     새로 invent 하지 말고, 문서/기존 코드의 배치 정책을 유지하되
     **부재 수신자는 무조건 실패 기록 + failedReason 키 포함**을 지켜라.
5. 동기 API 응답(배치 생성 직후 검증 실패)에서도 동일 코드·메시지 형식을 쓴다.
   FE toast는 `템플릿 필수 변수가 없습니다: {키}` 로 매핑한다.
6. **직접 입력(DIRECT) 수신자**도 동일: enrich 불가한 키면 발송 실패.
   (광고성 등 별도 코드가 있어도, 변수 부재는 본 코드로 남겨라.)

## enabled=true 인데 데이터가 없는 경우 (정상 실패 UX)

예: 참여자 발송 맥락에서 `교육 진행 수업 시간` 은 enabled=true 이나,
해당 프로그램/수신자에 수업 시간 원천 행이 없음.

- FE가 변수를 넣는 것 자체는 막을 수 없음 (맥락상 허용 변수)
- BE는 enrich 실패/공백 → **발송 실패 케이스**로 처리하고 키를 failedReason에 넣는다
- “성공으로 보내고 본문에 빈칸”은 버그다

## 구현 체크리스트 (데이터 부재)

- [ ] 발송 파이프라인에 “치환 후 blank 검사” 단계가 provider 호출보다 앞이다
- [ ] blank 이면 SEND_FAILED + failedReason에 키
- [ ] 이력 상세 API가 failedReason 을 그대로(또는 동일 포맷으로) 반환한다
- [ ] 단위/계약 테스트: 원천 데이터 삭제(또는 null) 시드 → 발송 → 실패 + 키 검증
- [ ] 단위/계약 테스트: 원천 데이터 있음 → 동일 템플릿 발송 성공

# API 계약 요약

## GET …/template-variables

Query:
- programId?: int64
- participantType?: string (PARTICIPANT | INSTRUCTOR | VOLUNTEER)
- memberType?: string (GENERAL | SCHOOL_TEACHER | INSTRUCTOR | TEACHER_AND_INSTRUCTOR | ADMIN)
- keyword?, category?

Response item (기존 CatalogVariableItem):
- key, token, description
- requiresProgram: boolean
- enabled: boolean   ← 맥락 반영 필수
- programGroups?, recruitmentTypes?, participantTypes?, memberTypes?

## 발송 실패 / 배치·delivery 에러 (변수값 데이터 부재 포함)

공통:
- code: `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING`
- message 및 delivery.failedReason:
  `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키}`
  복수: `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:{키1},{키2}`
- delivery.sendStatus: 발송 실패 (SEND_FAILED 등 기존 enum)
- FE toast/이력 상세: `템플릿 필수 변수가 없습니다: {키}`
  → **키 누락 금지.** message/failedReason에 키를 꼭 넣어라.

적용 시점 (모두 동일 계약):
- 배치 생성/발송 API 동기 검증 실패
- 비동기 워커 enrich 직후·provider 호출 직전
- 수신자별 delivery 실패 기록

# 검증 시나리오

1. programId=유효ID, participantType=PARTICIPANT
   → 강사 배정 전용 변수 enabled=false, 클릭 삽입은 FE가 막음
2. 동일 맥락에서 본문에 `#{교육 진행 수업 시간}` 이 있고 **원천 데이터가 있으면**
   발송 성공·치환됨
3. 동일 템플릿인데 **원천 데이터 없음**(null/미등록 일정 등)
   → 해당 수신자 delivery 발송 실패
   → failedReason = `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:교육 진행 수업 시간`
   → NHN 요청 로그에 해당 수신자 발송이 없어야 함
4. 본문에 키 2개 모두 부재 → failedReason에 두 키 모두 포함 (또는 동등한 복수 표기)
5. programId 없이 memberType=GENERAL
   → requiresProgram 변수 enabled=false
6. 빈 #{…} / 공백 치환값이 provider(NHN) 요청 body에 절대 나가지 않음
7. 수신자 A는 데이터 있음(성공), B는 없음(실패) — 기존 배치 부분성공 정책을 따르되
   B의 failedReason에 키가 있다

# 참고 (FE 이미 반영)

- 쿼리 빌드: buildNotificationTemplateVariablesQuery
- 비활성: isNotificationCatalogVariableDisabled / VariablesPanel aria-disabled
- 실패 문구: formatNotificationFailedReason
- 메일·문자 발송 화면이 programId + participantType|memberType 을 넘김
```

---

## FE 쪽 요약 (백엔드 참고용, 구현 불필요)

- 메일/문자 발송: 선택 프로그램·수신자 유형(필터 또는 단일 유형 수신자)으로 `template-variables` 재조회.
- `enabled !== true` 또는 `requiresProgram && !programId` → 회색 + 삽입 차단 + 안내 토스트.
- **원천 데이터 부재는 FE가 사전에 막지 않음** — BE 발송 실패 + `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키` 를 toast/이력 상세에 `템플릿 필수 변수가 없습니다: 키` 로 표시.
