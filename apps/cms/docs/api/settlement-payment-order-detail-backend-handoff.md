# 지급 현황 상세 — API 연동·백엔드 핸드오프

**화면:** 정산 관리 > 지급조서 확인 > 행 클릭 → 지급 현황 상세 풀페이지  
**프론트 경로:** `features/settlement-management/api/payment-orders/`, `use-payment-order-detail-fullpage-modal.ts`  
**연동 명세:** [settlement-api-integration.md](./settlement-api-integration.md)  
**공통 갭:** [settlement-api-backend-gaps.md](./settlement-api-backend-gaps.md)

**Last updated:** 2026-08-24

---

## 1. 프론트 변경 요약 (2026-08-24)

지급 현황 상세 진입 시 **전체 settlements/statements fetch + 클라이언트 필터** 대신, 아래 scoped 호출로 전환했습니다.

| 단계 | Method | Path | Query |
|------|--------|------|-------|
| 정산 라인 목록 | GET | `/api/admin/settlements` | `programId` **또는** `instructorMemberId`, (선택) `fromDate`, `toDate` |
| statementId 매핑 | GET | `/api/admin/settlements/statements` | **임시 우회** — §3.1·§4 참고. **권장:** settlements 목록 DTO에 `statementId` embed (§4) |
| 산출 내역서 | GET | `/api/admin/settlements/{settlementId}` | 라인별 (기존 유지) |
| 지급조서 확인 | PATCH | `/api/admin/settlements/statements/{statementId}/confirm` | 단건 순차 (기존 유지) |

**aggregateKey:** 목록 집계 행의 `programId` / `instructorMemberId` 문자열.

**기간:** 목록 URL에 적용된 강의 출강일(`po_from`, `po_to`)을 상세 API `fromDate`/`toDate`에 그대로 전달.

---

## 2. 서버에서 **지금 당장** 확인할 것 (신규 API 없이)

아래가 동작해야 상세 라인 테이블이 채워집니다.

- [ ] `GET /api/admin/settlements?programId={id}` — 해당 프로그램 정산 라인 반환
- [ ] `GET /api/admin/settlements?instructorMemberId={id}` — 해당 강사 정산 라인 반환
- [ ] 동일 API에 `fromDate`, `toDate` 전달 시 **출강일(`lectureDate`) 기준** 필터
- [ ] 응답 `SettlementListItemResponse`에 **`settlementId`, `programId`, `instructorMemberId`, `statementStatus`, `lectureDate`, `netPaymentAmount`** 포함
- [ ] *(임시)* `GET /api/admin/settlements/statements` — 프론트가 settlementId join용으로 2차 호출 중 → **§4 반영 후 제거 예정**

### UI 필드 ↔ API (상세 라인 1행)

| UI (`PaymentOrderAdminProgramDetailInstructorRow` 등) | API 필드 | 비고 |
|------------------------------------------------------|----------|------|
| `instructorName` / `programName` | `instructorName` / `programNameKo` | |
| `lectureDate` | `lectureDate` | |
| `sessionOrdinal` | `scheduleId` | 없으면 index fallback |
| `processingStatus` | `statementStatus` | REQUESTED→pending 등 ([§11 갭 문서](./settlement-api-backend-gaps.md#11-ui-8종-vs-api-statementpayment-status)) |
| `estimatedAmount` | `netPaymentAmount` | |
| `lectureFeePaymentScheduledDate` | `expectedTransferDate` | |
| `statementId` | **`SettlementListItemResponse.statementId`** (요청) | 현재는 statements 2차 조회 join — §4 |
| `institutionName` | **없음** | 현재 UI `-` ([§3.4](#34-참여-기관명)) |

---

## 3. 서버 **수정 권장** (P1 — 성능·정확도)

### 3.1 statements 목록 — settlementId 스코프 필터 *(차선 — §4 미적용 시)*

| | |
|---|---|
| **현재** | `GET /api/settlements/statements` — `status`, `page`, `size` 만 지원 |
| **프론트 임시** | statements **전체 pagination** 후, 상세 settlements의 `settlementId` 집합으로 **클라이언트 필터** |
| **문제** | statement 건수 증가 시 상세 진입마다 전량 조회 |
| **제안** | `settlementIds`(comma-separated 또는 repeated param) 또는 `programId` / `instructorMemberId` 필터 추가 |

예:

```
GET /api/admin/settlements/statements?settlementIds=1,2,3
GET /api/admin/settlements/statements?programId=42
```

> **우선순위:** 아래 §4(`statementId` embed)가 반영되면 §3.1은 불필요.

### 3.2 settlements 목록 — `statementId` embed *(§4와 동일)*

§4 백엔드 수정 요청 본문 참고.

### 3.3 상세 기본정보 (강사 블록)

| | |
|---|---|
| **UI** | 강사 상세 — 이름·주소·연락처·계좌 (mock 기준) |
| **현재 API** | settlements 라인에 **개인정보·계좌 없음** |
| **프론트 임시** | remote 시 `-` 표시 |
| **제안 (택1)** | ① `GET /api/admin/members/{instructorMemberId}` 조합 · ② `GET /api/settlements/instructor-summary?instructorMemberId=` 신규 · ③ settlements 집계 DTO에 embed |

### 3.4 참여 기관명

| | |
|---|---|
| **UI** | 상세 라인 「참여 기관명」 컬럼·필터 |
| **현재 API** | `SettlementListItemResponse`에 기관명 필드 없음 |
| **제안** | `institutionName` 또는 `schoolName` 필드 추가 (assignment/schedule join) |

### 3.5 산출 내역서 — 산정 항목 `type` enum 확장 *(P1)*

| | |
|---|---|
| **UI** | 지급 현황 상세 > 산출 내역서 > **산정 항목** 컬럼 |
| **현재 API** | `GET /api/admin/settlements/{settlementId}` → `SettlementFrontendResponse.items[]` |
| **item DTO** | `SettlementFrontendItemResponse` — `type`(string, enum 미정의), `description`, `amount` |
| **문제** | `type`이 `instructor_fee` 등 **snake_case 코드**로만 내려와 UI에 그대로 노출됨. OpenAPI에 허용 값·한글 라벨 규격 없음 |
| **프론트 대응** | `shared/constants/settlement-item-type.ts`에서 코드→한글 매핑 (서버 enum 확정 전 임시) |

#### 백엔드 수정 요청

1. **`SettlementFrontendItemResponse.type`에 enum(또는 문서화된 상수 집합) 정의** — OpenAPI `enum` 또는 별도 `SettlementItemType` 스키마
2. **아래 7종을 SSOT로 합의** — 산출 내역서·지급조서·정산 신청 items 공통 사용 권장

| `type` (제안 코드) | 산정 항목 (UI 라벨) | 비고 |
|--------------------|---------------------|------|
| `instructor_fee` | 강사비 | 기존 |
| `transportation` | 교통비 | 기존 |
| `accommodation` | 숙박비 | 기존 |
| `meal` | 식사비 | **신규** — 정산 항목 설정 「식사비」 |
| `activity` | 활동비 | **신규** — UJAT·자원봉사 활동비 등 |
| `withholding` | 원천징수 | **신규** — 공제 라인. `amount`는 **음수** 권장 |
| `other` | 기타 | 기존 |

3. **`description`** — 항목별 상세(차시·거리·공제율 등)는 기존처럼 자유 텍스트. **카테고리명은 `type`으로만** 내려주고 UI는 위 표로 라벨 변환
4. **원천징수 표현** — `type: "withholding"` + 음수 `amount` 라인을 items에 포함. 상위 `withholdingTaxAmount`만 두고 items에 없으면 산출 내역서 합계 행·라인 불일치
5. **breaking change 없음** — 기존 4종(`instructor_fee`, `transportation`, `accommodation`, `other`) 응답 유지. 신규 3종은 해당 정산에 항목 있을 때만 추가

#### 응답 예시 (제안)

```json
{
  "items": [
    { "type": "instructor_fee", "description": "강사비 (3차시)", "amount": 300000 },
    { "type": "transportation", "description": "대전 → 서울 (146.8km)", "amount": 31500 },
    { "type": "meal", "description": "식사비", "amount": 15000 },
    { "type": "activity", "description": "UJAT 활동비", "amount": 20000 },
    { "type": "withholding", "description": "원천징수 8.8%", "amount": -32508 }
  ],
  "totalAmount": 333992
}
```

#### 수용 기준 (Acceptance)

- [ ] OpenAPI에 `SettlementFrontendItemResponse.type` 허용 값 7종 명시
- [ ] 스테이징: 식사비·활동비·원천징수가 포함된 정산 상세 조회 시 items에 해당 `type` 존재
- [ ] 원천징수 라인 `amount` 음수, `items` 합계 = `totalAmount` (또는 `netPaymentAmount`와 정합)
- [ ] 프론트 Orval 재생성 후 enum 타입 반영 가능

#### 프론트 후속 (백엔드 enum 반영 후)

- `settlement-item-type.ts` — 서버 enum과 1:1 동기화 확인
- `map-settlement-detail-to-calculation-statement.ts` — `type` 라벨 매핑 유지 (현재 연동됨)

---

## 4. 백엔드 **수정 요청** — `GET /settlements` 목록에 `statementId` 포함 *(권장·P1)*

프론트는 지급 현황 상세 진입 시 **`statementId`를 얻기 위해** `GET /settlements/statements`를 **2차 호출**하고 있습니다.  
**우회 제거**를 위해 아래 DTO 확장을 요청합니다.

### 요청 요약

| 항목 | 내용 |
|------|------|
| **대상 API** | `GET /api/admin/settlements` (기존 목록·상세 scoped query 동일) |
| **대상 DTO** | `SettlementListItemResponse` |
| **추가 필드** | `statementId?: number` — 해당 정산 라인(`settlementId`)에 연결된 지급조서 ID |
| **관계** | `settlementId` 1건당 지급조서 0~1건. `statementStatus`가 null/미생성이면 `statementId`도 null |
| **OpenAPI** | 스펙·Orval 재생성 후 프론트 `fetchAllPaymentStatementsRemote` 상세 경로 **제거** |

### 프론트 사용처 (필드 필요 이유)

| 기능 | API |
|------|-----|
| 라인 「지급조서 확인」 | `PATCH /api/admin/settlements/statements/{statementId}/confirm` |
| 「일괄 확인」 | 동일 PATCH (또는 bulk-confirm) — 라인별 `statementId` 필요 |
| 산출 내역서 모달 | 라인에 `statementId` 바인딩 |

현재는 `PaymentStatementListItemResponse`에서 `settlementId`로 join (`map-settlement-detail.ts`).

### 수용 기준 (Acceptance)

- [ ] `GET /settlements?programId={id}` 응답 각 item에 `statementId` 포함 (지급조서 있는 라인)
- [ ] `GET /settlements?instructorMemberId={id}` 동일
- [ ] `statementStatus`와 `statementId` 일관 — 조서 미생성 라인은 둘 다 null/부재
- [ ] 기존 `statementStatus`, `settlementId` 등 필드 **breaking change 없음**
- [ ] 스테이징: 상세 1행 confirm 시 Network에 **`/statements` 목록 호출 없음** (프론트 반영 후)

### 프론트 후속 (백엔드 반영 후)

1. `getPaymentOrdersDetailContextRemote` — `fetchPaymentStatementsForSettlementIds` 제거
2. `map-settlement-detail.ts` — `item.statementId` 직접 매핑
3. Orval 재생성 (`SettlementListItemResponse.statementId`)

### 대안 (비권장)

§3.1처럼 `GET /statements?settlementIds=` 필터만 추가해도 2차 호출은 줄일 수 있으나, **여전히 API 2번**이므로 DTO embed가 더 단순합니다.

---

## 5. 서버 **추가 권장** (기존 갭 문서와 연계)

상세 화면에서도 아래는 **별도 API/DTO**가 필요합니다. ([settlement-api-backend-gaps.md](./settlement-api-backend-gaps.md) P0/P1)

| 우선순위 | 항목 | 상세 화면 영향 |
|----------|------|----------------|
| P0 | `POST .../statements/bulk-confirm` + 이체 예정일 | 「일괄 확인」 모달 |
| P0 | `PATCH .../statements/{id}/reject` | 산출 내역서 「신청 반려」 |
| P1 | 산출 내역서 DTO (`GET /settlements/{id}` 확장) | 산출 내역서 모달 본문 · **items[].type enum 7종** ([§3.5](./settlement-payment-order-detail-backend-handoff.md#35-산출-내역서--산정-항목-type-enum-확장-p1)) |
| P1 | `GET /settlements/aggregates` (목록용) | 상세와 무관, 목록 성능 |

---

## 6. 신규 전용 API 필요 여부 — 결론

| 범위 | 신규 API 필수? |
|------|----------------|
| **상세 정산 라인 목록** (프로그램별 강사 라인 / 강사별 프로그램 라인) | **아니오** — 기존 `GET /settlements` scoped query로 충분 (프론트 연동 완료) |
| **statementId** | **DTO 필드 추가** — `SettlementListItemResponse.statementId` (§4). 신규 endpoint 불필요 |
| **강사 기본정보·계좌** | **예 (또는 회원 API 조합)** |
| **참여 기관명** | **DTO 필드 추가** |
| **일괄 확인·반려·산출서** | **예** — 기존 갭 문서 항목 |

---

## 7. 스테이징 점검 (상세)

1. 목록에서 프로그램 행 클릭 → Network에 `GET /settlements?programId=` (및 `fromDate`/`toDate`) 확인
2. 강사별 탭에서 행 클릭 → `GET /settlements?instructorMemberId=` 확인
3. 상세 테이블 건수 = API 라인 건수 (동일 기간·동일 program/instructor)
4. 라인 「지급조서 확인」→ `PATCH .../confirm` 후 목록·상세 상태 일치
5. `statementId` 없는 라인 → confirm/산출서 버튼 비활성 또는 에러 (seed 데이터 점검)

---

## 8. 문의

프론트: `features/settlement-management/`  
테스트: `admin-payment-orders-service.test.ts` (`buildPaymentOrdersDetailListParams`)
