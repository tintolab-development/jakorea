# BE 수정 요청 — 정산 지급 항목 복제 API 200 무처리

**작성일:** 2026-09-16
**대상 화면:** CMS 정산 관리 → 정산 항목 설정 (`/settlement-management/item-settings`)
**우선순위:** P0 — API는 성공 응답하지만 실제 데이터가 변경되지 않음
**관련 기존 명세:** `settlement-item-settings-category-backend-cursor-prompt.md` §2.2

## 백엔드 전달용 프롬프트

아래 재현 결과를 기준으로 정산 설정의 **지급 항목 복제 API가 실제 신규 항목을 저장하도록 수정**해 주세요.

현재 API는 HTTP 200과 current config를 반환하지만, 복제 대상의 신규 DB row가 생성되지 않고 응답 및 후속 조회에도 기존 6건만 남습니다. 성공처럼 보이는 no-op이므로 프론트에서는 복제 결과를 표시할 수 없습니다.

---

## 1. 재현

관리자 JWT와 `SETTLEMENT_WRITE` 권한으로 다음 요청을 실행합니다.

```http
POST /api/admin/settlement-configs/current/items/payment/166203/duplicate
Authorization: Bearer {adminJwt}
```

대상 항목:

```json
{
  "id": 166203,
  "paymentItemType": "LODGING_GENERAL",
  "itemName": "숙박비",
  "maxAmount": 150000,
  "taxableYn": false,
  "evidenceRequiredYn": true,
  "useYn": true,
  "iconKey": "pay_lodging",
  "layout": "lodging",
  "maxLimitWon": 150000
}
```

### 실제 결과

- HTTP status: `200`
- 응답 `configId`: `166000`
- 응답 `paymentItems`: 기존 6건
- 응답 ID: `166201`, `166202`, `166203`, `166204`, `166207`, `166205`
- `166203`을 복제한 신규 ID가 없음
- 직후 `GET /api/admin/settlement-configs/current`도 기존 6건만 반환
- 동일 요청을 반복해도 매번 200이지만 항목 수와 ID가 변하지 않음

따라서 FE 캐시나 렌더링 문제가 아니라 **복제 API의 저장 no-op**입니다. FE는 성공 후 current config를 다시 조회하고 있으며, 서버가 반환한 6건을 그대로 표시합니다.

---

## 2. 기대 동작

`itemKind=payment`이고 대상이 현재 config에 속하는 활성 지급 항목이면:

1. 원본 항목을 조회한다.
2. 새로운 PK로 지급 항목 row를 생성한다.
3. 원본의 설정값을 복사한다.
   - `paymentItemType`
   - `itemName`
   - `maxAmount`
   - `taxableYn`
   - `evidenceRequiredYn`
   - `useYn`
   - `iconKey`
   - `emojiOverride`
   - `layout`
   - `maxLimitWon`
   - `description`
   - `detailJson`
4. 신규 row를 current config에 연결하고 트랜잭션 안에서 flush한다.
5. 신규 항목이 포함된 최신 `SettlementConfigResponse`를 반환한다.
6. 후속 `GET /api/admin/settlement-configs/current`에서도 동일 신규 항목을 반환한다.

복제 직후 응답은 기존 6건이 아니라 **7건**이어야 하며, 원본 `166203`과 별도의 신규 ID가 있어야 합니다.

`itemName`은 기존 제품 정책이 있으면 그 정책을 따르되, 별도 정책이 없다면 원본과 구분할 수 있도록 `숙박비 (복사본)`처럼 생성해 주세요. FE가 임의로 신규 ID나 복제 데이터를 만들어 표시하지 않게 합니다.

---

## 3. 구현 시 확인할 가능성이 높은 원인

- 복제 엔티티를 만들지만 repository `save` 또는 연관관계 추가를 하지 않는 경로
- transaction 종료 전에 저장되지 않거나 read-only transaction으로 실행되는 경로
- `BeanUtils.copyProperties`/mapper가 원본 ID를 유지해 신규 INSERT가 되지 않는 경로
- current config 응답을 mutation 전 객체 또는 영속성 캐시에서 다시 반환하는 경로
- `(config_id, payment_item_type)` 등의 unique 제약으로 같은 유형 복제가 불가능한데 예외를 삼키는 경로
- 권한·항목 종류 검증 이후 성공 응답만 반환하고 실제 duplicate service를 호출하지 않는 경로

복제 기능은 동일 `paymentItemType`의 사용자 복제본을 허용하는 계약입니다. DB에 `config_id + payment_item_type` unique 제약이 있다면 복제 API와 충돌하므로, 계산 분류값은 유지하면서 복제 row를 저장할 수 있도록 제약과 조회 로직을 조정해 주세요. 저장 실패를 잡아서 기존 config를 200으로 반환하지 마세요.

---

## 4. 오류 계약

- 존재하지 않는 `itemId`: `404`
- current config에 속하지 않는 항목: `404` 또는 프로젝트 표준 리소스 불일치 오류
- `itemKind=wage|deduction`: `409`
  - 코드: `SETTLEMENT_CONFIG_ITEM_KIND_LOCKED`
  - 메시지: `임금/공제 항목은 복제·삭제할 수 없습니다`
- DB 제약·저장 실패: 성공 응답 금지, 표준 `4xx/5xx` 오류 반환
- 권한 없음: `403`

HTTP 200은 신규 row 저장과 응답 반영이 모두 완료된 경우에만 반환해야 합니다.

---

## 5. 필수 테스트

### 서비스/통합 테스트

1. `LODGING_GENERAL` 지급 항목 복제
   - 요청 전 지급 항목 수 `N`
   - 응답 수 `N + 1`
   - 신규 PK가 원본 PK와 다름
   - 복제 필드가 원본과 동일
   - 신규 항목이 current config에 연결됨

2. 복제 후 재조회
   - 별도 트랜잭션의 `GET /current`에서 신규 PK 확인
   - 서버 재시작 후에도 신규 항목 유지

3. 같은 원본 연속 복제
   - 두 요청 모두 별도의 신규 PK 생성
   - 최종 수 `N + 2`

4. 저장 실패
   - transaction rollback
   - 기존 config를 담은 200 응답 금지

5. 가드
   - `payment`은 성공
   - `wage`, `deduction`은 409
   - 존재하지 않는 ID는 404

6. 삭제 연계
   - 생성된 복제본을 `DELETE /api/admin/settlement-configs/current/items/payment/{newId}`로 삭제 가능
   - 삭제 후 `GET /current`에서 제외

---

## 6. 완료 조건

- `POST .../payment/166203/duplicate` 응답에 신규 ID가 포함된다.
- 응답 `paymentItems.length`가 요청 전보다 정확히 1 증가한다.
- 후속 `GET /current`에서도 신규 ID와 설정값이 유지된다.
- 동일 원본을 반복 복제할 때 요청마다 신규 row가 하나씩만 생성된다.
- 실패를 200 no-op으로 반환하지 않는다.
- 기존 임금/공제 복제 차단 정책과 지급 항목 삭제 API가 회귀하지 않는다.
- OpenAPI의 성공·오류 응답 설명 및 관련 자동화 테스트를 갱신한다.
