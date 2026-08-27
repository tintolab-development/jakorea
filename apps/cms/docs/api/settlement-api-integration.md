# 정산 관리 API 연동 명세

LNB 「정산 관리」 3화면(지급조서·계좌 지급·정산 항목 설정)과 Swagger API 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

---

## 모듈 키

| env | 화면 |
|-----|------|
| `VITE_REAL_API_MODULES=...,paymentOrders` | 지급조서 확인 (리스트·상세·캘린더) |
| `VITE_REAL_API_MODULES=...,accountPayments` | 계좌 지급 확인 (리스트·상세·캘린더·지급 완료) |
| `VITE_REAL_API_MODULES=...,settlementConfigs` | 정산 항목 설정 (v2 카탈로그 GET/PUT·지급 duplicate/delete) |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/settlement/` |
| OpenAPI subset | `openapi/settlement.openapi.json` (`scripts/filter-openapi-settlement.mjs`) |
| 공통 query keys | `features/settlement-management/api/settlement-query-keys.ts` |
| 캐시 clear | `features/settlement-management/api/clear-settlement-query-cache.ts` |
| 지급조서 | `features/settlement-management/api/payment-orders/` |
| 계좌 지급 | `features/settlement-management/api/account-payments/` |
| 캘린더 adapter | `features/settlement-management/api/calendar/` |
| 정산 항목 | `features/settlement-management/api/settlement-configs/` |

---

## TanStack Query 캐시

- Key prefix: `['cms', 'settlement', …]`
- `logout` / `completeAdminAuth` → `clearSettlementQueryCache()`

---

## 지급조서 확인 (`/settlement-management/payment-orders`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/settlements` | 프로그램별·강사별 목록 (클라이언트 집계) · **지급 현황 상세 라인** (`programId` / `instructorMemberId` + `fromDate`/`toDate`) |
| GET | `/api/settlements/statements` | statementId 매핑 (상세: settlementId 집합으로 클라이언트 필터) |
| GET | `/api/settlements/{settlementId}` | 상세 라인·산출 내역서 |
| PATCH | `/api/settlements/statements/{statementId}/confirm` | 지급조서 확인·일괄 확인·산출 모달 확인(순차) |
| GET | `/api/settlements/{settlementId}/payment-statement/download` | 지급조서 다운로드 |
| GET | `/api/settlements/calendar` | 캘린더 뷰 (출강일·기간) |
| GET | `/api/settlements/calendar/summary` | 월별 요약 (hook 준비) |
| GET | `/api/settlements/calendar/dates/{date}` | 일자 상세 (hook 준비) |

**remote 잔여 갭:** 산출 내역서 「신청 반려」— statement reject API 없음 → 버튼 비활성 · **상세 백엔드 핸드오프:** [settlement-payment-order-detail-backend-handoff.md](./settlement-payment-order-detail-backend-handoff.md)

---

## 계좌 지급 확인 (`/settlement-management/account-payments`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/account-payments` | 목록·캘린더 (이체 예정일) |
| GET | `/api/account-payments/{paymentId}` | 계좌 지급 현황 상세 (목표: **이 1회로 산출 블록까지**) |
| GET | `/api/settlements/{settlementId}` | 지급조서 확인 산출 내역서. **계좌 지급 상세에서는 우회 호출 중** → [갭 §5.2](./settlement-api-backend-gaps.md#52--p0-서버-보완-요청--계좌-지급-현황-상세를-get-account-paymentsid-1회로) |
| PATCH | `/api/account-payments/{paymentId}/paid` | 지급 완료 (목록·상세) |
| PATCH | `/api/account-payments/{paymentId}/failed` | 지급 실패 (hook만) |
| POST | `/api/settlements/exports/bulk-transfer` | 대량이체 export |
| POST | `/api/settlements/exports/tax-report` | 세금신고 export |
| GET | `/api/settlements/exports` | export 이력 |

**캘린더:** `/api/settlements/calendar`가 아닌 **account-payments 목록** (`scheduledPaymentDate` 기준)

**409 `PAYMENT_STATEMENT_STATUS_CONFLICT`:** 지급조서가 `CONFIRMED`가 아닐 때. 서버 `message`를 모달에 그대로 표시 — **메시지 상세화는 BE 요청** ([갭 문서 §5.1](./settlement-api-backend-gaps.md#51--p0-서버-수정-요청--지급-완료-409-message-상세화)).

---

## 정산 항목 설정 (`/settlement-management/item-settings`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/settlement-configs/current` | 카드 목록 조회 |

remote 시 카드 삭제·복제·상세 저장 UI 비활성.

---

## API 갭 상세

백엔드 협의용: [settlement-api-backend-gaps.md](./settlement-api-backend-gaps.md) · [지급 현황 상세](./settlement-payment-order-detail-backend-handoff.md)
