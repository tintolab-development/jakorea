# DB Seed 업데이트 — 지급조서 ↔ 계좌 지급 원장 연동

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-27 |
| **대상** | 백엔드 local / staging DB seed (Flyway · seed runner · DataLoader) |
| **목적** | CMS 두 화면을 **한 settlement 원장**으로 E2E 검증 |
| **BE Cursor 프롬프트** | [`settlement-ledger-link-p0-backend-cursor-prompt.md`](./settlement-ledger-link-p0-backend-cursor-prompt.md) |
| **기계 스펙** | [`payment-orders-seed-v1.spec.json`](./payment-orders-seed-v1.spec.json) · [`account-payments-seed-v1.spec.json`](./account-payments-seed-v1.spec.json) |
| **단건 핸드오프(참고)** | [`payment-orders-backend-seed-handoff-2026-08-27.md`](./payment-orders-backend-seed-handoff-2026-08-27.md) · [`account-payments-backend-seed-handoff-2026-08-27.md`](./account-payments-backend-seed-handoff-2026-08-27.md) |

**모듈 플래그(FE):** `VITE_REAL_API_MODULES=...,paymentOrders,accountPayments`

BE local **재시작 후 두 시드 라벨이 모두** 있어야 한다.

| 라벨 | 화면 |
|------|------|
| `payment-orders-catalog-v1-2026-08` | 지급조서 확인 |
| `account-payments-catalog-v1-2026-08` | 계좌 지급 확인 |

---

## 1. 왜 업데이트하나

기존 local 검증 시드(`로컬 테스트 경제교육`, 마스킹 이름, 대기 6건인데 11+ 라벨 등)와 **계좌 카탈로그를 한글명으로 합치면** FE 검색·집계·confirm 연동이 깨진다.

이번 업데이트 목표:

1. **고정 ID**로 시안 케이스 고정 (이름으로 찾지 말 것)
2. **두 카탈로그 member/program ID 분리** (같은 한글명 ≠ 같은 사람)
3. **confirm → account_payment** 검증용 대기 행(170601) + 이미 CONFIRMED인 이체 대기 쇼케이스(2026-09-15)
4. 지급조서 카탈로그에 **PAID 0** / 계좌 카탈로그는 **CONFIRMED + WAITING_PAYMENT|PAID**만
5. 예산 카드 `year=2026` → `annualBudgetAmount=109150000`

---

## 2. 공통 규칙

| 규칙 | 내용 |
|------|------|
| 신청자명 | **실명** (마스킹 금지). 연락처·계좌·예금주만 마스킹 가능 |
| 제미나이 | Settlement / AccountPayment에 **달지 말 것** |
| 재신청 | 구 `REJECTED` **유지** + **신규** settlement + statement(`REAPPLICATION`) |
| 계좌 목록 전제 | `statementStatus=CONFIRMED`만 |
| 계좌 `paymentStatus` | 시드·응답 **`WAITING_PAYMENT` / `PAID`** (`FAILED` 선택). 응답을 `REQUESTED`로 넣지 말 것 |
| net=0 CONFIRMED 필러 | 지급조서 스크롤용만. **계좌 지급에 넣지 말 것** |
| 한글명 merge | 금지. 검증은 `settlementId` / `programId` / `memberId` |

### 엔티티 체인

```
Member(강사) ──┐
Program ───────┼── Settlement(+items 산출) ── PaymentStatement(statementId)
               │         │
               │         ├──[confirm]──► AccountPayment(WAITING_PAYMENT)
               │         └──[paid]─────► AccountPayment(PAID)  → 지급조서 목록 제외
```

---

## 3. 지급조서 카탈로그 `payment-orders-catalog-v1-2026-08`

### 3.1 날짜

- 출강일(`lectureDate`): **2026-08** 중심 (기본 필터 2026-08-01 ~ 2026-09-01에 포함)
- 이 카탈로그에 **`payment_status=PAID` / statement `PAID` / `NONE` 없음**

### 3.2 프로그램 집계 (고정 ID)

| 케이스 | programId | 프로그램명 | aggregateStatus | 대기 | estimatedAmount |
|--------|----------|------------|-----------------|------|-----------------|
| 초등 PARTIAL | **170302** | `2026년 JA Korea 초등 경제교육` | `PARTIAL` | **5** | **2,000,000** |
| HSBC 1_5 | **170301** | `HSBC/HKU Business Case Competition 2026 모집 안내` | `REQUESTED` | **3** | **915,000** |
| 확인완료 NONE | **170303** | (확인완료 카탈로그명) | `CONFIRMED` | **0** | **625,000** |
| 재신청 8 | **170304** | (임의, 1703xx 대역) | `REAPPLICATION` | **8** | **1,200,000** |
| 11+ | **170305** | (임의) | `REQUESTED` | **12** | — |

`pendingItemBucket`: NONE=0, 1_5=3|5, 6_10=8, 11_PLUS=**12**(이름만 11+이고 건수 6이면 실패).

권장 규모: 프로그램 집계 ≥30행, 신청자 집계 ≥20행 (위 표는 **고정 필수**).

### 3.3 Member (지급조서 대역)

| 이름 | memberId | 비고 |
|------|----------|------|
| 박틴토 | **170201** | 산출·대기·반려(구) |
| 김틴토 | **170202** | 확인완료 라인 |
| 최틴토 | **170203** | 재신청 |
| 허틴토 | (170204 권장) | 정정 요청 |
| 이틴토 | **170205** | 개인 프로그램 · institution null |

### 3.4 초등 경제교육(170302) 상세 라인

| 신청자 | memberId | 기관 | 차시 | statementStatus | net | 비고 |
|--------|----------|------|------|-----------------|-----|------|
| 박틴토 | 170201 | 강서초등학교 | 3 | `REQUESTED` | 915,000 | **settlementId=170601** |
| 김틴토 | 170202 | 대구수성초등학교 | 2 | `CONFIRMED` | 300,000 | → 계좌 대기 쇼케이스(§4.4) |
| 최틴토 | 170203 | 강서초등학교 | 1 | `REAPPLICATION` | 315,000 | 신규 settlement. 구 REJECTED 별도 |
| 허틴토 | — | 진월초등학교 | 2 | `CORRECTION_REQUESTED` | 480,000 | 총액 제외 |
| 박틴토 | 170201 | 강서초등학교 | 3 | `REJECTED` | 915,000 | 사유 `제출 서류 미비`. **overwrite 금지** |
| 이틴토 | 170205 | **null** | 1 | `REQUESTED` | 15,000 | 기관 `-` |

헤더: 혼재 → **`PARTIAL`**. 총액 2,000,000 = 반려·정정 제외.

### 3.5 박틴토 산출 (settlementId **170601**)

| 항목 | 금액 |
|------|------|
| 특강 강의비 | 915,000 |
| 교통비 | 31,500 |
| 숙박비 | 80,000 |
| 식사비 | **행 없음** |
| 활동비 | **행 없음** |
| 원천징수 | **8.8%** |

`scheduleChangeCancelCount = 1`.  
`PaymentStatement.statementId` ↔ 170601. 목록 DTO에 **`statementId` embed**.

### 3.6 confirm 연동 기대

`PATCH/POST confirm` on 170601의 statement:

- statement → `CONFIRMED`
- settlement `paymentStatus` → `WAITING_PAYMENT`
- `account_payment` 생성, **동일 `settlementId=170601`**
- body 이체일이 있으면 그 날짜, 없으면 기존 이체일 복사

---

## 4. 계좌 지급 카탈로그 `account-payments-catalog-v1-2026-08`

### 4.1 전제

- 모든 행: Settlement `statementStatus=CONFIRMED`
- AccountPayment `paymentStatus` ∈ {`WAITING_PAYMENT`, `PAID`} (± `FAILED` 소수)
- 목록 필터 날짜 = **이체 예정일**. 캘린더 배치용 `lectureDate`는 extras로 유지

### 4.2 프로그램명 (지급조서와 겹치지 않게 접미사)

| programId | 이름 |
|-----------|------|
| **169301** | `HSBC/HKU 2026 (계좌 지급 카탈로그)` |
| **169302** | `2026 초등 경제교육 (계좌 지급 카탈로그)` |
| **169303** | `2026 멘토링 (계좌 지급 카탈로그)` |
| **169304** | `2026 중등 경제교육 (계좌 지급 카탈로그)` |

### 4.3 Member (계좌 대역 — 지급조서와 다름)

| 이름 | memberId (계좌) | 지급조서 memberId (참고) |
|------|-----------------|--------------------------|
| 김틴토 | **169201** | 170202 |
| 박틴토 | **169202** | 170201 |

이름 contains 검색 시 두 카탈로그가 같이 보이면 **정상**. 금액/행을 이름으로 merge하지 말 것.

### 4.4 레거시 + Q3 + 연동 쇼케이스

| 케이스 | 식별 | 기대 |
|--------|------|------|
| 레거시 대기/완료 | accountPaymentId **169801–169832** | CONFIRMED + `WAITING_PAYMENT` 또는 `PAID`. 이체 **2026-02** |
| Q3 8/9/10월 | 이체월 필터 | 월별 쇼케이스 ≥1씩 |
| confirm 후 쇼케이스 | (런타임) settlement **170601** | confirm 전엔 없을 수 있음. confirm 후 `WAITING_PAYMENT` |
| 시드 대기 쇼케이스 | net>0 CONFIRMED (김틴토 초등 300,000 / 170303 625,000 등) | 이체일 **2026-09-15**, `WAITING_PAYMENT` |
| 연간 예산 | `GET …/budget-summary?year=2026` | `annualBudgetAmount` **109150000** |

분포 권장: ≥32건, 대기≈60% / 완료≈40%.  
개인 프로그램 ≥2 (institution/session null). 다차시 `"2 ~ 3차시"` ≥1.  
상세 embed용 items: 강의비+교통+숙박+원천 ≥1건.

### 4.5 하지 말 것 (계좌 시드)

- 미확인 조서(`REQUESTED`/`REAPPLICATION`)를 AccountPayment에 연결
- 응답/시드 `paymentStatus=REQUESTED`로 대기 위장 (대기 = **`WAITING_PAYMENT`**)
- net=0 CONFIRMED를 계좌 목록에 넣기
- 지급조서 programId 1703xx 이름을 `(계좌 지급 카탈로그)` 접미사 없이 재사용하며 member를 합치기

---

## 5. 교차 검증 매트릭스 (시드 수용)

BE 재시작 → 관리자 JWT → 아래 순서.

| # | 검증 | 기대 |
|---|------|------|
| 1 | 지급조서 aggregates `fromDate=2026-08-01&toDate=2026-09-01&groupBy=program` | **170302** PARTIAL · 대기 5 · 2,000,000 |
| 2 | `GET /settlements?programId=170302` | 라인에 `statementId`, 5종 상태 + 이틴토 institution null |
| 3 | `GET /settlements/170601` | 특강/교통/숙박 · 식사·활동 없음 · 원천 8.8% |
| 4 | confirm 170601 (+ `scheduledPaymentDate=2026-09-15`) | 조서 CONFIRMED · 계좌 list에 settlementId=170601 · `WAITING_PAYMENT` · 이체 2026-09-15 |
| 5 | 계좌 `PATCH …/paid` on 그 행 | 지급조서 aggregates/list에서 170601 **없음** |
| 6 | 계좌 `status=WAITING_PAYMENT` (또는 alias REQUESTED) | 응답 본문 status는 **`WAITING_PAYMENT`** |
| 7 | 지급조서 list에 PAID 없음 | — |
| 8 | `instructorName=박틴토` 검색 | 조서 170201 / 계좌 169202 **별도**. 금액 합치지 않음 |
| 9 | `budget-summary?year=2026` | annualBudgetAmount=109150000 |
| 10 | `GET /account-payments/{id}` | Network에 `/settlements/{id}` 없이 산출 표시 (embed) |

---

## 6. 시드 구현 체크리스트

### 지급조서
- [ ] 라벨 `payment-orders-catalog-v1-2026-08`
- [ ] programId 170301–170305 + settlement 170601 + member 170201–170205
- [ ] PAID/NONE/Gemini 0 · 이름 plain
- [ ] 버킷 0 / 3|5 / 8 / 12
- [ ] 재신청 + 구 REJECTED 둘 다
- [ ] statementId embed
- [ ] 박틴토 산출 금액 고정

### 계좌 지급
- [ ] 라벨 `account-payments-catalog-v1-2026-08`
- [ ] programId 169301–169304 접미사 이름
- [ ] member 169201/169202 ≠ 지급조서
- [ ] 169801–169832 + Q3 + 2026-09-15 대기 쇼케이스
- [ ] paymentStatus WAITING_PAYMENT|PAID only
- [ ] CONFIRMED settlement만 연결 · net=0 제외
- [ ] budget 109150000
- [ ] list extras + detail settlement embed 가능 데이터

### 교차
- [ ] confirm 170601 → 동일 settlementId account_payment
- [ ] PAID → 지급조서 제외
- [ ] 두 라벨 동시 로드

---

## 7. 기존 시드와의 관계

| 기존 | 조치 |
|------|------|
| `로컬 테스트 경제교육` / 마스킹 이름 / 「11건 이상」인데 대기 6 | **교체 또는 비활성**. 시안 케이스로 쓰지 말 것 |
| 계좌만 REQUESTED 응답 시드 | **WAITING_PAYMENT로 이전** |
| 지급조서에 PAID 넣어 둔 행 | **제거** 또는 payment_status 정리 후 계좌 카탈로그만 PAID |
| 단건 화면 P0 시드 문서 | ID·원장 절은 **본 문서가 SSOT**. 단건 핸드오프는 본 문서로 링크 |

---

## 8. 관련 FE (참고 · BE 작업 범위 밖)

- 캐시: confirm/reject/paid 후 `payment-orders` + `account-payments` + calendar + budget **교차 invalidate**
- 계좌 상세: embed only (settlements 단건 호출 없음)
- 연동 명세: [`settlement-api-integration.md`](./settlement-api-integration.md)
