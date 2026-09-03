# Cursor prompt — CMS 기획 확정·보류 미반영 항목 (계약 게이트 / 금지 / GO 후 구현)

아래 지시를 **이 백엔드 레포에서 실행**하라. 질문은 기존 컨트롤러/엔티티를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

작성일: 2026-09-03  
갱신: 2026-09-03 (BE `active`|`ended` 고정 회신 + FE 정합)  
FE 근거 SSOT: CMS `apps/cms/docs/api/product-deferred-and-hold-backend-cursor-prompt.md` (본 문서)  
BE 게이트 표: `docs/frontend/CMS_PRODUCT_DEFERRED_HOLD_GATE_2026-09-03.md`  
정렬 기준: 2026-08-26 Notion 노란 하이라이트 · `기획 확정 후` · `정책 확정 후` · `기획 보류`

## Goal

1. **기획 보류(HOLD)** 항목은 API·시드·LNB를 **만들지 마라**. 이미 고정한 HOLD 회귀 테스트를 **깨지 마라**.
2. **제품 GO 전**에는 임의 enum·엔드포인트를 **발명하지 마라**.
3. **현재 확정분**(`sponsorshipStatus`: `active` | `ended`)은 유지·강화하고, FE와 코드값 표를 일치시켜라.
4. 이 문서에 없는 프로그램/정산 gap은 **기존 handoff만** 따르라.

완료 조건 (제품이 해당 ID를 **GO**로 확정한 항목만):

1. OpenAPI에 enum·path·권한·에러 코드가 문서화된다.
2. staging 인수 체크리스트가 통과한다.
3. FE에 「확정 코드값·라벨 표」를 회신한다.

---

## 현재 확정 계약 (GO 전 — 변경 금지)

### `sponsorshipStatus` (PD-DM-01 · **2종만**)

| 코드 | UI 라벨 | 비고 |
|------|---------|------|
| `active` | 진행 중 | 등록 기본값 |
| `ended` | 후원 종료 | `POST /api/admin/sponsors/{sponsorId}/end` · 이미 `ended`면 **no-op** |

- 그 외 값(`discussing`, `dormant`, `foo` 등) → **400** + `SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED`
- **`discussing` / `dormant`는 제품 GO 후에만** OpenAPI enum·시드·이 표에 **한꺼번에** 추가하라. 지금 발명하지 마라.

### 필터 키 SSOT (PD-DM-10 · 이미 문서화됨)

- 목록 필터 SSOT: **`sponsorshipStatus` > `status`**
- FE는 `sponsorshipStatus`만 전송한다.

### FE 현재 (2026-09-03 정합)

- UI·필터·배지·드롭다운·mock: **`active` | `ended`만**
- E2E: 「후원 논의중」「후원 휴면」→ **`toHaveCount(0)`**
- 「진행 중」「후원 종료」옵션은 존재

### BE가 이미 한 일 (회귀 유지)

- HOLD 회귀: mail-sends API·발송이력 위젯·홈 재도입 위젯 API·Payload E 빈 DRAFT·교사 bulk-withdraw/unlink **미존재**를  
  `ProductDeferredHoldGateContractTest` + `verify_stage527_…`(+ smokeChecks)로 고정
- PD-DM-01 GO 전: enum 2종만 허용
- 누적합 규칙·`POST …/end` no-op 문서화
- OpenAPI 로그/알림 태그에서 가짜 「메일 발송 이력 API」 문구 제거

**이 작업에서 HOLD·2종 계약을 되돌리지 마라.**

---

## Out of scope / 금지

### 절대 만들지 마라 (기획 보류)

| ID | 금지 대상 | 이유 |
|----|-----------|------|
| **PD-LOG-01** | `GET /api/admin/logs/mail-sends` 및 유사 | Notion 메일 발송 이력 **기획 보류** |
| **PD-NOTI-01** | 대시보드 카탈로그 **알림톡/메일 발송 이력** 위젯 | 기획 보류 |
| **PD-NOTI-02~04** | 알림톡/메일/문자 관리 CRUD **이 프롬프트로 신규 발명** | FE Coming soon |
| **PD-DASH-01** | 홈 미재도입 위젯 전용 집계 API | 설계 보류 |
| **PD-TPL-02** | Payload E 3종을 **가짜 본문으로 채움** | 스펙 전 빈 DRAFT 유지 |
| **PD-MEM-01** | 교사 `bulk-withdraw` / `bulk-unlink` **정책 GO 전 구현** | 탈퇴 vs 소속 해제 미정 |

### 임의 발명 금지 (제품 GO 전)

- `discussing` / `dormant` OpenAPI·DB 선반영
- Gemini 종료 = 삭제 vs 상태 유지 임의 선택
- 본 문서 밖 programs/settlement/members seed gap 재정의

### FE 일 (BE가 하지 마라)

- CMS 필터·배지·E2E (`toHaveCount(0)` 유지/해제)
- Non-admin LNB (`menu-config`)
- Coming soon 라우트 제거
- 인증서 「사용 범위」UI (이미 FE 재노출)

---

## 의사결정 게이트

| ID | 상태 | 제품 질문 / 확정 시 BE | FE 해제 |
|----|------|------------------------|---------|
| PD-DM-01 | **확정 2종** · 4종은 `NEEDS_PRODUCT` | 4종 GO? 코드·전이 규칙? | E2E 0 제거 + 필터/배지 추가 |
| PD-DM-02 | 필드 존재 · 합산 문서화 유지 | 합산 규칙 변경 시 description | 목록 컬럼 **이미 표시** |
| PD-DM-03 | 홈페이지 FE 반영 · 로고/비고 GO 대기 | 로고 upload/delete/bulk DL·비고? | 상세 폼 확장 |
| PD-DM-04 | `NEEDS_PRODUCT` | 이력 총 수혜자 필드? | 이력 컬럼 |
| PD-DM-05 | `NEEDS_PRODUCT` | DELETE path · 실적 유지? | `programHistoryDeleteDisabled` 해제 |
| PD-DM-06 | `NEEDS_PRODUCT` | server export + 감사로그 fail-closed? | 클라 dump 제거 |
| PD-DM-07 | `NEEDS_PRODUCT` | Page 래퍼? | `pagination` 활성 |
| PD-DM-08/09 | `NEEDS_PRODUCT` | from/to · participantType 서버 필터 | 클라 보조 필터 제거 |
| PD-DM-10 | **문서화됨** | alias deprecate 유지 | FE는 `sponsorshipStatus` |
| PD-MEM-01 | HOLD/정책 | A 탈퇴 vs B unlink | stub 제거 |
| PD-PRG-* / PD-SEC-01 | `NEEDS_PRODUCT` | 개별 표 참고 | 가드 해제 |
| PD-LOG/NOTI/DASH | **HOLD** | — | — |

---

## 1. 데이터 관리 · 후원사 (PD-DM-*)

Base: `/api/admin/sponsors`  
Auth: Bearer 관리자 JWT  
관련: `data-management-api-backend-gaps.md`

### 1.1 PD-DM-01 — 제품 GO 후 4종 확장 (지금은 하지 마라)

제품이 **GO**하고 코드·전이를 회신하면:

| 코드 (제안 · 제품이 바꾸면 표만 교체) | UI 라벨 |
|--------------------------------------|---------|
| `active` | 진행 중 |
| `discussing` | 후원 논의중 |
| `dormant` | 후원 휴면 |
| `ended` | 후원 종료 |

GO 시 BE:

1. OpenAPI enum에 확정 N값만 · 미지원 → 기존과 동일하게 400 + 코드
2. 전이 표(어느 상태↔어느 상태)를 OpenAPI description에 명시
3. dev/staging 시드에 신규 값 **각 ≥1건** (prod 마이그레이션 금지)
4. FE에 확정 표 회신 → FE가 E2E `toHaveCount(0)` 제거

### 1.2 PD-DM-10 — 필터 키 SSOT

이미 SSOT 문서화됨. 회귀만 유지. `organizationKind`: `corporate` | `foundation`.

### 1.3 PD-DM-07 — 목록 Page (GO 후)

지금은 FE **전체 배열** + `pagination={false}`. 교재와 동일 Page 래퍼:

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "hasNext": false
}
```

- query: `page`(0-base), `size`(기본 20, 최대 100) + 기존 필터
- 전환 일정 OpenAPI·릴리즈 노트에 적어 FE에 알려라

### 1.4 PD-DM-02 — 누적 후원금·수혜자

OpenAPI에 `totalDonationAmount` / `totalBeneficiaryCount` 존재. FE 목록 컬럼 **이미 표시**(없으면 `-`).  
합산 규칙 description 유지·변경 시 FE 재합산하지 않음.

### 1.5 PD-DM-08 — 후원 시작일 기간 (GO 후)

- `sponsorshipStartDateFrom` / `To` (`YYYY-MM-DD`) inclusive · TZ 문서화
- FE는 전송 + 일시적 클라 보조 필터 → 서버 정확하면 클라 제거

### 1.6 PD-DM-05 — 프로그램 이력 삭제 (GO 후 · P0)

Notion: 이력 삭제(실적 값은 유지).

- `DELETE /api/admin/sponsors/{sponsorId}/program-histories/{historyId}`
- 선택 bulk-delete
- FE: `programHistoryDeleteDisabled: true` → API 후 활성

### 1.7 PD-DM-04 · PD-DM-09 — 이력 DTO·필터 (GO 후)

- history row `totalBeneficiaryCount`(확정 필드명)
- `participantType`: `school` | `individual` | `volunteer` 서버 필터

### 1.8 PD-DM-03 — 상세 홈페이지·로고·비고

| 항목 | 상태 |
|------|------|
| `homepageUrl` | OpenAPI·FE 상세 **반영됨** |
| 로고 upload/delete · 일괄 DL · 스폰서 비고 | **제품 GO 후** |

확정 시: multipart 또는 fileId · DELETE · ZIP bulk + 감사로그 · 비고 필드명 고정.

### 1.9 PD-DM-06 — 서버 엑셀 export (GO 후)

- `GET …/sponsors/export`, `…/textbooks/export` — 목록과 동일 필터
- 감사로그 **fail-closed**
- FE는 현재 클라 dump

---

## 2. 로그·알림 보류 (PD-LOG / PD-NOTI) — HOLD 유지

### 2.1 PD-LOG-01 — 메일 발송 이력

**구현하지 마라.** HOLD 회귀 테스트가 미존재를 고정함.

### 2.2 PD-NOTI-01 — 대시보드 카탈로그

알림톡·메일 발송 이력 위젯 **넣지 마라**.

### 2.3 PD-NOTI-02~04 — 알림 관리 Coming soon

신규 admin notification CRUD를 이 프롬프트로 확장하지 마라.

---

## 3. 회원·학교 (PD-MEM-*)

### 3.1 PD-MEM-01 — 소속 교사 일괄 (정책 GO 전 구현 금지)

FE stub: `준비 중입니다.`  
제품 택1 후:

| 옵션 | 의미 | 제안 path |
|------|------|-----------|
| A | 회원 탈퇴(비활성) | `…/teachers/bulk-withdraw` |
| B | 소속만 해제 | `…/teachers/bulk-unlink` |

HOLD 회귀: 위 path **미존재** 유지 until GO.

### 3.2 PD-MEM-02 — Non-admin LNB

**BE 무작업.** FE `menu-config` 기획 후.

### 3.3 PD-MEM-03 · PD-MEM-04 — 학교 상세 UX 권한

기존 권한 코드와 OpenAPI 문서만 맞추면 됨. 신규 API 필수 아님.

---

## 4. 프로그램 상세 · Gemini (PD-PRG-*)

### 4.1 PD-PRG-01 — 출석 sessions[]

제품 GO 후 enum 고정 예: `attended` | `absent` | `not_held`.  
기존 member-program-history handoff 우선.

### 4.2–4.3 신청자·이력서

신규 path 발명 금지. 기존 approve/reject·구조화 resume handoff 완료.

### 4.4–4.6 Gemini 종료 / DELETE / bulk

OpenAPI에 **한 문장**으로 정책 고정 후 FE 가드 해제. 임의 선택 금지.

### 4.7–4.8 담당자 탭 · 학교 placeholder

해당 handoff 따름. 별도 API 없으면 BE 무작업.

---

## 5. 양식·인증서 (PD-TPL-*)

### 5.1 PD-TPL-01 — 사용 범위

FE **재노출 완료**. settingsJson 키는 제품 확정값과 OpenAPI 정합만.

### 5.2 PD-TPL-02 — Payload E 빈 DRAFT

| templateCode | 이름 |
|--------------|------|
| `issuance-1` | UJAT 결과리포트 |
| `issuance-5` | 결과보고서 |
| `document-1` | 지출증빙서류(필수폼) |

**빈 DRAFT 유지.** HOLD 회귀가 고정함. 가짜 본문 금지.

### 5.3 PD-TPL-03 — 이미지 스토리지

`certificate-image-storage-handoff.md` — 권한·확장자·용량·보존 문서화.

---

## 6. 대시보드·보안 (PD-DASH / PD-SEC)

### 6.1 PD-DASH-01

홈 미재도입 위젯 API **설계하지 마라**. HOLD 회귀 유지.

### 6.2 PD-SEC-01 — MFA

SMS / TOTP / 병행 제품 택 전 auth 플로우 임의 변경 금지.

### 6.3 PD-UI-01

강사 추가 모달 RHF+Zod — **FE only**.

---

## 7. 인수 테스트 체크리스트 (staging)

### 현재 확정분 (항상)

- [ ] `sponsorshipStatus` = `active` | `ended`만 허용
- [ ] `discussing` / `dormant` / `foo` → 400 `SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED`
- [ ] `POST …/end` → `ended` · 이미 ended면 no-op
- [ ] 필터 SSOT `sponsorshipStatus` > `status`
- [ ] HOLD: mail-sends **미존재** · 발송이력 위젯 없음 · Payload E 빈 DRAFT · 교사 bulk path 미존재

### 제품 GO 후만

- [ ] PD-DM-01 4종 enum·시드·전이 표
- [ ] PD-DM-07 Page · PD-DM-05 DELETE · PD-DM-08/09 · PD-DM-06 export · PD-DM-03 로고/비고
- [ ] PD-MEM-01 · PD-PRG-* · PD-TPL-03 등 게이트 표 ID

---

## 8. 관련 기존 문서 인덱스

| 주제 | 문서 |
|------|------|
| BE 게이트 표 | BE `docs/frontend/CMS_PRODUCT_DEFERRED_HOLD_GATE_2026-09-03.md` |
| 후원·교재 gap | `data-management-api-backend-gaps.md` |
| 후원 시드 | `data-management-dummy-seed-backend-request.md` |
| 로그 + 메일 금지 | `logs-api-backend-cursor-prompt.md`, `logs-api-backend-gaps.md` |
| 대시보드 시드 | `dashboard-settings-dummy-seed-backend-request.md` |
| 일괄 삭제 #16 | `cms-table-bulk-delete-api-backend-handoff.md` |
| 회원 프로그램·출석 | `members/member-program-history-ui-api-parity-backend-handoff-2026-08-25.md` |
| 프로그램·Gemini | `programs-api-backend-gaps-consolidated.md`, `programs-gemini-performance-api-backend-handoff.md` |
| 발급·인증서 | `issuance-form-api-follow-up.md`, `certificate-image-storage-handoff.md` |

---

## 9. FE 상태 (2026-09-03 · BE 회신 정합)

| ID | FE 상태 |
|----|---------|
| PD-DM-01 | **BE 정합** — `active`\|`ended`만. 논의중/휴면 E2E `toHaveCount(0)`. 4종은 제품 GO 후 |
| PD-DM-02 | **목록 컬럼 유지** — `totalDonationAmount`/`totalBeneficiaryCount` |
| PD-DM-03 | **부분** — `homepageUrl`만. 로고·비고·일괄 DL 게이트 |
| PD-DM-05~09 | **게이트** — DELETE disabled · pagination off · 클라 export · 클라 보조 필터 |
| PD-TPL-01 | **반영** — 인증서 사용범위 UI |
| PD-TPL-02 / PD-LOG / PD-NOTI / PD-DASH / PD-MEM-01 | **HOLD·stub 유지** |
| 그 외 PD-* | 제품/BE GO 대기 |

---

## 10. 부록 — FE stub 구분

| 구분 | 예시 | BE |
|------|------|-----|
| 정책 게이트 stub | 소속 교사 탈퇴 | §3.1 |
| 기획 보류 Coming soon | 알림 관리 라우트 | §2 |
| 계약·배선 잔여 | 과제/출석 `FEATURE_COMING_SOON` | programs handoff |
| FE only | 일부 UX | FE |

---

## 11. 작업 순서 권장 (백엔드)

1. **현재:** HOLD 회귀 + PD-DM-01 **2종** 계약 **유지** (추가 발명 없음).
2. 제품 미팅: PD-DM-01 **4종 GO 여부** · 코드·전이. GO 아니면 다음 단계로.
3. GO 시: PD-DM-01 4종 → PD-DM-07 Page → PD-DM-05 DELETE → PD-DM-08/09 → PD-DM-06 → PD-DM-03 로고/비고.
4. PD-MEM-01 · PD-PRG-01 · PD-PRG-05~07 · PD-TPL-03은 개별 GO.
5. §7 체크 후 FE에 **확정 코드값 표** 회신.

### 제품 확인 질문 (BE → 제품)

> PD-DM-01을 4종(`active` / `discussing` / `dormant` / `ended`)으로 GO할까요?  
> GO이면 snake_case 코드값과 전이 규칙을 알려 주세요. 그때 enum·시드·Page/이력 DELETE 등 게이트표를 순서대로 구현합니다.
