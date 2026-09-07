# Cursor prompt — 후원사 `sponsorshipStatus` 4종 GO (PD-DM-01)

아래 지시를 **이 백엔드 레포에서 실행**하라. 질문은 기존 컨트롤러/엔티티를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-07 |
| ID | **PD-DM-01** (제품 GO) · handoff **S-1** |
| 범위 | `/api/admin/sponsors` 의 `sponsorshipStatus` 계약만 |
| 배경 | 2026-09-03에 「제품 GO 전」으로 `active`\|`ended`만 고정했음. **FE는 2026-09-07에 4종 UI를 다시 열었음.** BE가 2종만 허용하면 저장·필터가 깨진다. |
| 이전 게이트 | `product-deferred-and-hold-backend-cursor-prompt.md` 의 「GO 전 2종」계약은 **본 프롬프트로 대체(해제)** |
| 관련 handoff | `sponsor-management-api-backend-handoff.md` §2 (S-1) |

## Goal

1. `sponsorshipStatus`를 **4값 enum**으로 고정·허용한다.
2. 목록 필터·POST·PATCH·`POST …/end`가 4값과 정합한다.
3. OpenAPI·시드·에러 코드를 FE 표와 맞춘다.
4. 알 수 없는 값은 기존과 같이 **400**으로 거절한다.

완료 조건:

1. OpenAPI `sponsorshipStatus` enum = 아래 4값 (Request/Response/Detail/Params 공통).
2. tag/description의 「active\|ended만 · GO 후 확장」문구를 **삭제·교체**.
3. staging 인수 체크리스트 통과.
4. FE에 「확정 코드·라벨·전이 규칙」을 회신.

---

## 확정 코드값 (변경 금지 · FE SSOT)

| API 값 | UI 라벨 | 비고 |
|--------|---------|------|
| `active` | 후원 중 | 등록 기본값. 예전 라벨 「진행 중」 폐기 |
| `discussing` | 후원 논의중 | **신규 허용. 400 금지** |
| `dormant` | 후원 휴면 | **신규 허용. 400 금지** |
| `ended` | 후원 종료 | `POST /api/admin/sponsors/{sponsorId}/end`와 동일 상태 |

- 그 외 값(`foo`, `pending`, `ACTIVE` 등) → **400** + `SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED` (또는 기존 동등 코드).
- 대소문자·별칭 정규화하지 마라. **소문자 스네이크 그대로**만 받는다.

---

## 해야 할 일

### 1. 도메인·검증

1. DB/enum/validator에서 `discussing`, `dormant`를 **허용 목록에 추가**.
2. `SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED` 가 위 2값에 더 이상 발생하지 않게 한다.
3. 기존 `active` / `ended` 행·시드·테스트 **회귀 유지**.

### 2. API 동작

| Method | Path | 요구 |
|--------|------|------|
| GET | `/api/admin/sponsors?sponsorshipStatus=` | 4값 각각 필터 200. 생략 = 전체 |
| POST | `/api/admin/sponsors` | body `sponsorshipStatus` 4값 저장. 기본 생략 시 `active` |
| PATCH | `/api/admin/sponsors/{sponsorId}` | 4값으로 변경 가능 |
| POST | `/api/admin/sponsors/{sponsorId}/end` | → `ended`. 이미 `ended`면 **no-op 200** |

필터 키 SSOT:

- FE는 **`sponsorshipStatus`만** 보낸다.
- `status` 쿼리가 남아 있으면 무시하거나 deprecated. **새 로직의 SSOT로 쓰지 마라.**

### 3. 전이 규칙 (최소)

별도 제품 표가 없으면 아래를 따른다. 더 엄격한 전이가 필요하면 OpenAPI description에 명시하고 FE에 회신하라.

- PATCH로 `active` ↔ `discussing` ↔ `dormant` ↔ `ended` **양방향 허용** (제한 없음).
- `POST …/end`는 현재 상태와 무관하게 `ended`로 설정 (이미 ended면 no-op).

### 4. OpenAPI

1. `SponsorRequest` / `SponsorResponse` / `SponsorDetailResponse` / 목록 Params의 `sponsorshipStatus`를 **string enum 4값**으로 고정.
2. 후원사 tag description에서  
   `sponsorshipStatus SSOT는 active|ended만(4종 확장·추가 상태는 제품 GO 후)`  
   →  
   `sponsorshipStatus SSOT: active | discussing | dormant | ended`  
   로 교체.
3. `/v3/api-docs` 갱신 후 FE가 `fetch:openapi && generate:api` 할 수 있게 한다.

### 5. 시드 (dev/staging만)

각 상태 **≥1건**:

| sponsorshipStatus | 용도 |
|-------------------|------|
| `active` | 기존 시드 유지 |
| `discussing` | 신규 ≥1 |
| `dormant` | 신규 ≥1 |
| `ended` | 기존 시드 유지 |

prod 데이터 강제 마이그레이션 금지. 기존 행은 `active`/`ended` 유지.

---

## Out of scope / 금지

- 후원사 로고·homepageUrl·Page 래퍼·이력 DELETE 등 **다른 S-\* / PD-DM-\*** (별도 handoff).
- HOLD 항목(메일 발송 이력 API 등) 재도입.
- `discussing`/`dormant` 외 5번째 상태 발명.
- FE 레포 수정.

---

## 인수 체크 (필수)

```http
### 필터
GET /api/admin/sponsors?sponsorshipStatus=discussing
GET /api/admin/sponsors?sponsorshipStatus=dormant

### 등록
POST /api/admin/sponsors
{ "...", "sponsorshipStatus": "discussing" }

POST /api/admin/sponsors
{ "...", "sponsorshipStatus": "dormant" }

### 변경
PATCH /api/admin/sponsors/{id}
{ "sponsorshipStatus": "dormant" }

PATCH /api/admin/sponsors/{id}
{ "sponsorshipStatus": "active" }

### 종료
POST /api/admin/sponsors/{id}/end
→ sponsorshipStatus == "ended"

### 거절
POST/PATCH 에 "sponsorshipStatus": "foo"
→ 400 SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED
```

- [ ] 위 요청 전부 기대대로
- [ ] OpenAPI enum 4값 + tag description 갱신
- [ ] 시드에 discussing/dormant 각 ≥1
- [ ] `ProductDeferredHoldGateContractTest`(또는 동등)의 **「2종만」게이트를 4종 GO로 갱신** — 2종 고정을 깨지 말고 **허용 목록을 확장**하라
- [ ] FE 회신: 확정 코드 표 + 전이 규칙 + OpenAPI 반영 커밋/PR 링크

---

## FE 현재 상태 (참고 · 수정하지 마라)

- 필터·배지·드롭다운·mock·E2E: **4종 노출** (`active` / `discussing` / `dormant` / `ended`)
- 라벨: 후원 중 / 후원 논의중 / 후원 휴면 / 후원 종료
- 목록 쿼리: `sponsorshipStatus` (URL `sp_st`)
- BE가 2종만 허용하면 discussing/dormant **저장·필터 실패** → 본 작업이 P0

---

## 완료 회신 템플릿 (FE로 그대로 붙여 보내라)

```text
PD-DM-01 GO 완료
- enum: active | discussing | dormant | ended
- 전이: (자유 PATCH / 또는 표 첨부)
- OpenAPI: (커밋/PR)
- 시드: discussing N건, dormant N건
- 거절 코드: SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED (미지원 값)
```
