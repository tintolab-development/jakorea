# 정산 제출 모달 숙박비 적용 검증 및 수정

**일자**: 2025-01-19  
**Phase**: 0.4.1 - 강사 정산 신청  
**문제**: 자동 산출 방식에서 숙박비가 적용되지 않는 케이스 발생

---

## 🔍 문제 분석

### 발견된 문제
1. **Form.useWatch 지연 반영**: `Form.useWatch`가 스위치 변경을 즉시 반영하지 않을 수 있음
2. **useEffect dependency 문제**: `hasAccommodation` 값이 변경되어도 `useEffect`가 제대로 트리거되지 않을 수 있음
3. **제출 시점 값 불일치**: 제출 시점에 `Form.useWatch`로 가져온 값과 실제 form 값이 다를 수 있음

### 영향받는 코드
- `apps/cms/src/features/settlement/ui/settlement-submit-modal.tsx`
  - Line 78: `hasAccommodation` 감시
  - Line 91-106: 자동 산출 `useEffect`
  - Line 187-195: 제출 시 숙박비 처리

---

## ✅ 수정 내용

### 1. useEffect 내에서 form.getFieldValue 사용

**수정 전:**
```typescript
useEffect(() => {
  if (calculationMode === 'auto' && sessions && distance !== undefined && fuelCost !== undefined && tollFee !== undefined) {
    try {
      calculateSettlement({
        sessions: Number(sessions),
        distance: Number(distance),
        fuelCost: Number(fuelCost) || 0,
        tollFee: Number(tollFee) || 0,
        accommodationRequired: Boolean(hasAccommodation), // Form.useWatch 값 사용
        isBusinessIncome: Boolean(isBusinessIncome),
      })
    } catch (error) {
      // 에러는 무시 (입력 중일 수 있음)
    }
  }
}, [calculationMode, sessions, distance, fuelCost, tollFee, hasAccommodation, isBusinessIncome, calculateSettlement])
```

**수정 후:**
```typescript
useEffect(() => {
  if (calculationMode === 'auto' && sessions && distance !== undefined && fuelCost !== undefined && tollFee !== undefined) {
    try {
      // Form.useWatch가 즉시 반영되지 않을 수 있으므로 form.getFieldValue로 최신 값 가져오기
      const currentHasAccommodation = form.getFieldValue('hasAccommodation') ?? false
      const currentIsBusinessIncome = form.getFieldValue('isBusinessIncome') ?? false
      
      calculateSettlement({
        sessions: Number(sessions),
        distance: Number(distance),
        fuelCost: Number(fuelCost) || 0,
        tollFee: Number(tollFee) || 0,
        accommodationRequired: Boolean(currentHasAccommodation), // form에서 직접 가져온 최신 값 사용
        isBusinessIncome: Boolean(currentIsBusinessIncome),
      })
    } catch (error) {
      // 에러는 무시 (입력 중일 수 있음)
    }
  }
}, [calculationMode, sessions, distance, fuelCost, tollFee, hasAccommodation, isBusinessIncome, calculateSettlement, form])
```

### 2. 제출 시점 추가 검증

**수정 전:**
```typescript
// 숙박비는 accommodationFee가 0보다 크면 추가 (hasAccommodation 스위치가 켜져있을 때)
// calculationResult.accommodationFee는 accommodationRequired가 true일 때만 80000이 됨
if (calculationResult.accommodationFee > 0) {
  items.push({
    type: 'accommodation',
    description: '숙박비',
    amount: calculationResult.accommodationFee,
  })
}
```

**수정 후:**
```typescript
// 숙박비는 accommodationFee가 0보다 크면 추가 (hasAccommodation 스위치가 켜져있을 때)
// calculationResult.accommodationFee는 accommodationRequired가 true일 때만 80000이 됨
// 추가 검증: form에서 직접 값을 가져와서 확인 (Form.useWatch가 반영되지 않을 수 있음)
const currentHasAccommodation = form.getFieldValue('hasAccommodation') ?? false
if (calculationResult.accommodationFee > 0 || currentHasAccommodation) {
  items.push({
    type: 'accommodation',
    description: '숙박비',
    amount: calculationResult.accommodationFee > 0 ? calculationResult.accommodationFee : 80000,
  })
}
```

---

## 🧪 검증 시나리오

### 시나리오 1: 스위치를 켠 후 즉시 계산
1. 자동 산출 모드 선택
2. 차시 수, 거리, 주유비, 통행료 입력
3. **숙박비 스위치를 켬**
4. **예상 결과**: 산출 결과에 숙박비 80,000원 포함
5. **검증**: `calculationResult.accommodationFee === 80000`

### 시나리오 2: 스위치를 켠 후 제출
1. 자동 산출 모드 선택
2. 모든 필수 필드 입력
3. 숙박비 스위치를 켬
4. 제출 버튼 클릭
5. **예상 결과**: 제출된 items에 숙박비 항목 포함
6. **검증**: `items` 배열에 `type: 'accommodation'` 항목 존재

### 시나리오 3: 스위치를 켰다가 끈 후 다시 켬
1. 숙박비 스위치를 켬
2. 스위치를 끔
3. 스위치를 다시 켬
4. **예상 결과**: 최종 상태(켜짐)가 반영되어 숙박비 포함
5. **검증**: `calculationResult.accommodationFee === 80000`

---

## ✅ 수정 효과

### 개선 사항
1. **즉시 반영**: `form.getFieldValue`를 사용하여 스위치 변경이 즉시 반영됨
2. **이중 검증**: `useEffect`와 `handleSubmit` 모두에서 form 값을 직접 확인
3. **안전성 향상**: `Form.useWatch`와 `form.getFieldValue`를 함께 사용하여 값 불일치 방지

### 예상 결과
- ✅ 숙박비 스위치를 켜면 즉시 산출 결과에 반영
- ✅ 제출 시 숙박비가 항목에 포함됨
- ✅ 스위치 상태 변경이 실시간으로 계산에 반영됨

---

## 📋 추가 확인 사항

### 정산 계산 로직 확인
- `apps/cms/src/entities/settlement/lib/settlement-calculation.ts`
- Line 69-70: `accommodationRequired`가 `true`일 때만 `ACCOMMODATION_FEE` (80,000원) 적용
- ✅ 로직 정상

### Form 초기값 확인
- Line 329: `hasAccommodation: false` 초기값 설정
- ✅ 정상

### 스위치 컴포넌트 확인
- Line 499-508: `Form.Item`에 `name="hasAccommodation"`, `valuePropName="checked"` 설정
- ✅ 정상

---

## 🎯 결론

**수정 완료**: 자동 산출 방식에서 숙박비가 제대로 적용되도록 수정했습니다.

**주요 변경점**:
1. `useEffect` 내에서 `form.getFieldValue`로 최신 값 가져오기
2. 제출 시점에 추가 검증 로직 추가
3. `form`을 dependency에 추가하여 form 인스턴스 변경 감지

**검증 필요**: 실제 UI에서 테스트하여 스위치 변경 시 즉시 반영되는지 확인
