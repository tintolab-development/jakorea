# FE 전달용 상세 프롬프트 — 프로그램 미선택 = 전체회원(수신자 설정 팝업) 2026-09-14

> **이 문서가 FE Cursor/에이전트에 넘길 SSOT입니다.**  
> 아래 **「복붙용 프롬프트」** 코드펜스(` ```text ` … ` ``` `) **안 전체**를 그대로 복사해 FE 채팅에 붙여 넣으세요.
>
> 관련:
> - 구계약(DIRECT만, **폐기**): [`notification-send-program-optional-backend-cursor-prompt.md`](./notification-send-program-optional-backend-cursor-prompt.md)
> - 피커: 알림톡 템플릿 피커 변수 Option A 관련 CMS_FE_PROMPT

| 메타 | 값 |
|------|-----|
| BE 레포 | `JABACK` (`com.jakorea.cms`) |
| 대상 | CMS Admin 알림 발송 「대상 프로그램」미선택 + **수신자 설정 팝업** |
| BE 상태 | **반영 완료** — `recipient-candidates` programId optional · POST MEMBER 허용 |
| Orval | **권장** — query `programId` required→optional |
| invent-ban | path invent 금지. `"all"` 문자열 programId 금지 |

---

## BE 계약 요약

| 상황 | GET recipient-candidates | POST send-batches |
|------|--------------------------|-------------------|
| 프로그램 **선택** | `?programId=&channelType=` → 참여자, `typeLabel`=참여 유형 | MEMBER는 참여자만 |
| 프로그램 **미선택** | `?channelType=` only (**programId omit**) → **전체 활성 회원**, `typeLabel`=회원 유형 | **MEMBER + DIRECT** 허용. ADMIN은 400 |
| 직접입력 | 이 API 아님 | DIRECT 유지 |

- 미선택 시 FE는 「직접입력만」모달을 **띄우지 않음**. 「수신자 설정」팝업을 열고 위 GET으로 목록을 채운다.
- 배치 상한 500명 유지(자동 전수 선택/분할 없음).
- `requiresProgram` 템플릿 키 포함 시 미선택 발송은 기존처럼 400.

---

## 복붙용 프롬프트

```text
[CMS BE → FE] 프로그램 미선택 = 전체회원 (수신자 설정 팝업) 2026-09-14

BE 레포: JABACK
대상: CMS Admin 「알림」발송(알림톡·메일·문자) — 대상 프로그램 미선택 + 수신자 설정 팝업
SSOT: docs/frontend/CMS_FE_PROMPT_SEND_NO_PROGRAM_ALL_MEMBERS_2026-09-14.md
구계약 폐기: CMS_FE_PROMPT_SEND_PROGRAM_ID_OPTIONAL_2026-09-09.md 의
  「미선택=DIRECT만 / recipient-candidates 호출 금지」는 더 이상 따르지 마라.

════════════════════════════════════════════════════════════════
0) 배경
════════════════════════════════════════════════════════════════
스크린: 대상 프로그램「미선택」→ 수신자 설정 클릭 시
「프로그램을 참여 회원 목록을 조회할 수 없습니다. 수신자 직접 입력을 이용해 주세요」
모달이 뜨던 것은 구 BE 계약(DIRECT-only) 반영이었다.

신계약: 미선택 = 전체 활성 회원을 **수신자 설정 팝업 안에서** 조회·선택.

════════════════════════════════════════════════════════════════
1) BE API (이미 반영)
════════════════════════════════════════════════════════════════
GET /api/admin/notification-send-batches/recipient-candidates
- programId: **optional**
- 미선택: GET …/recipient-candidates?channelType=ALIMTALK&page=0&size=50
  (programId 쿼리 키 자체를 omit)
- 응답: actorType=MEMBER, memberId, participantId=null,
  typeLabel=회원 유형 한글(일반/강사/교사…), memberType 코드
- 프로그램 선택 시: 기존처럼 typeLabel=참여 유형(참여자/강사/봉사자)

POST /api/admin/notification-send-batches
- programId omit + recipients[].actorType=MEMBER + actorId 허용
- ADMIN + programId omit → 400 NOTIFICATION_PROGRAM_REQUIRED_FOR_RECIPIENTS
- DIRECT 유지
- requiresProgram 본문 키 → 기존 400 TEMPLATE_VARIABLES

OpenAPI 재생성 권장(programId query required=false).

════════════════════════════════════════════════════════════════
2) FE 필수 수정
════════════════════════════════════════════════════════════════
A) 「수신자 설정」클릭 (프로그램 미선택)
   - ❌ 삭제: 「직접입력만」안내 모달 / 후보 API 호출 차단
   - ✅ 수신자 설정 팝업 오픈
   - ✅ 즉시 GET recipient-candidates?channelType=… (programId 없음)
   - ✅ 테이블에 전체회원 목록 렌더 (페이지네이션)

B) 팝업 컬럼 (미선택)
   - 「회원 유형」= typeLabel (또는 memberType 매핑). 참여 유형 컬럼 금지/숨김
   - 선택 시 recipients에 { actorType:"MEMBER", actorId: memberId }

C) 프로그램 선택 시
   - 기존: GET …?programId=&channelType=&participantType=
   - typeLabel=참여 유형 유지

D) 발송 POST
   - 미선택: body에서 programId omit
   - recipients에 팝업에서 고른 MEMBER (+ 선택적 DIRECT)
   - 문자열 programId:"all" / 0 / null 필드 전송 금지

E) 템플릿
   - requiresProgram 키 있는 템플릿은 미선택 시 피커/발송 비활성 유지(기존)

════════════════════════════════════════════════════════════════
3) 검증
════════════════════════════════════════════════════════════════
[ ] 미선택 → 수신자 설정 → 모달 없이 팝업 + Network GET(programId 없음)
[ ] 목록에 회원 표시(마스킹 연락처) · 이건희 등 선택 가능
[ ] POST programId omit + MEMBER → 200
[ ] 프로그램 선택 시 참여자 목록 회귀
[ ] 「직접입력만」카피/모달 잔존 없음
[ ] Orval: recipient-candidates programId optional

완료 보고: 팝업 fetch URL + 컬럼 바인딩 + 삭제된 모달 경로.
```

---

## Test plan (BE 수동)

```bash
# 수신자 설정 팝업 — 전체회원
curl -sS -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/admin/notification-send-batches/recipient-candidates?channelType=ALIMTALK&page=0&size=50"
```

## FE 구현 메모 (2026-09-14)

- Orval `RecipientCandidatesParams.programId` 이미 optional.
- UI 「미선택」= 진입 빈 값 + 지정 해제 sentinel `all` — HTTP에는 `"all"` 미전송(필드 omit).
- 배치 수신자 「전체 선택」상한 **500**.

### 완료 보고

| 항목 | 내용 |
|------|------|
| 팝업 fetch URL | 미선택: `GET /api/admin/notification-send-batches/recipient-candidates?channelType={ALIMTALK\|EMAIL\|SMS}&page=0&size=50` (**programId omit**). 프로그램 선택: 동일 + `programId` + (참여 유형 시) `participantType` |
| 컬럼 바인딩 | 헤더: 미선택=`회원 유형` / 선택=`참여 유형` (`resolve*RecipientTypeMode`). 셀: BE `typeLabel` SSOT (`*SendRecipientTypeLabel`). POST: `{ actorType:"MEMBER", actorId: memberId }` |
| 삭제된 모달 | 「프로그램 참여 회원 후보를 조회할 수 없습니다. 수신자 직접 입력을 이용해 주세요.」 / 「직접 입력 수신자만」검증 — 알림톡·메일·문자 fullpage + payload validator |
