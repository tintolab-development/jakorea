# 정산 제출 모달 전체 디버깅 및 수정

**일자**: 2025-01-19  
**Phase**: 0.4.1 - 강사 정산 신청  
**문제**: 모달 닫힘 시 이전 계산 결과가 초기화되지 않음, 숙박비 적용 문제

---

## 🔍 발견된 문제점

### 1. 모달 닫힘 시 초기화 문제
- ❌ `calculationResult`가 초기화되지 않음
- ❌ `calculationMode`가 초기화되지 않음
- ❌ `useSettlementCalculation`의 `reset` 함수가 호출되지 않음
- ❌ 모달이 닫힐 때(`open === false`) 초기화 로직이 없음

### 2. 숙박비 적용 문제
- ❌ `Form.useWatch`가 Switch 변경을 즉시 반영하지 않음
- ❌ `useEffect` dependency가 제대로 트리거되지 않음

### 3. 자동 산출 useEffect 문제
- ❌ 모달이 닫혀있을 때도 계산이 실행될 수 있음
- ❌ 필수 필드가 없을 때 계산 결과가 초기화되지 않음

---

## ✅ 수정 내용

### 1. useSettlementCalculation reset 함수 추가

**수정 전:**
```typescript
const { result: calculationResult, calculate: calculateSettlement } = useSettlementCalculation()
```

**수정 후:**
```typescript
const { result: calculationResult, calculate: calculateSettlement, reset: resetCalculation } = useSettlementCalculation()
```

### 2. 모달 열림/닫힘 시 전체 초기화

**수정 전:**
```typescript
useEffect(() => {
  if (open && user?.instructorId) {
    loadAvailableSettlements()
    form.resetFields()
    setSelectedProgram(null)
    setCostItemsOpen(true)
  }
}, [open, user?.instructorId, form, loadAvailableSettlements])
```

**수정 후:**
```typescript
useEffect(() => {
  if (open && user?.instructorId) {
    loadAvailableSettlements()
    // 모달이 열릴 때 폼 초기화
    form.resetFields()
    setSelectedProgram(null)
    setCostItemsOpen(true)
    setCalculationMode('auto') // 계산 모드 초기화
    resetCalculation() // 계산 결과 초기화
  } else if (!open) {
    // 모달이 닫힐 때 모든 상태 초기화
    form.resetFields()
    setSelectedProgram(null)
    setCostItemsOpen(true)
    setCalculationMode('auto')
    resetCalculation() // 계산 결과 초기화
    setSubmitting(false) // 제출 상태 초기화
  }
}, [open, user?.instructorId, form, loadAvailableSettlements, resetCalculation])
```

### 3. handleCancel에서 전체 초기화

**수정 전:**
```typescript
const handleCancel = () => {
  form.resetFields()
  setSelectedProgram(null)
  setCostItemsOpen(true)
  onCancel()
}
```

**수정 후:**
```typescript
const handleCancel = () => {
  // 모든 상태 초기화
  form.resetFields()
  setSelectedProgram(null)
  setCostItemsOpen(true)
  setCalculationMode('auto')
  resetCalculation() // 계산 결과 초기화
  setSubmitting(false)
  onCancel()
}
```

### 4. 제출 성공 후 전체 초기화

**수정 전:**
```typescript
await submitSettlement(user.instructorId, formData)
message.success('정산이 제출되었습니다.')
form.resetFields()
setSelectedProgram(null)
onSuccess?.()
onCancel()
```

**수정 후:**
```typescript
await submitSettlement(user.instructorId, formData)
message.success('정산이 제출되었습니다.')
// 제출 성공 후 모든 상태 초기화
form.resetFields()
setSelectedProgram(null)
setCalculationMode('auto')
resetCalculation() // 계산 결과 초기화
setCostItemsOpen(true)
onSuccess?.()
onCancel()
```

### 5. 자동 산출 useEffect 개선

**수정 전:**
```typescript
useEffect(() => {
  if (calculationMode === 'auto' && sessions && distance !== undefined && fuelCost !== undefined && tollFee !== undefined) {
    // 계산 로직
  }
}, [calculationMode, sessions, distance, fuelCost, tollFee, hasAccommodation, isBusinessIncome, calculateSettlement, form])
```

**수정 후:**
```typescript
useEffect(() => {
  // 모달이 열려있고 자동 산출 모드일 때만 계산
  if (!open) {
    // 모달이 닫혀있으면 계산하지 않음
    return
  }
  
  if (calculationMode === 'auto' && sessions && distance !== undefined && fuelCost !== undefined && tollFee !== undefined) {
    try {
      const currentHasAccommodation = form.getFieldValue('hasAccommodation') ?? false
      const currentIsBusinessIncome = form.getFieldValue('isBusinessIncome') ?? false
      
      calculateSettlement({
        sessions: Number(sessions),
        distance: Number(distance),
        fuelCost: Number(fuelCost) || 0,
        tollFee: Number(tollFee) || 0,
        accommodationRequired: Boolean(currentHasAccommodation),
        isBusinessIncome: Boolean(currentIsBusinessIncome),
      })
    } catch (error) {
      // 에러는 무시 (입력 중일 수 있음)
    }
  } else if (calculationMode === 'auto') {
    // 필수 필드가 없으면 계산 결과 초기화
    resetCalculation()
  }
}, [open, calculationMode, sessions, distance, fuelCost, tollFee, hasAccommodation, isBusinessIncome, calculateSettlement, form, resetCalculation])
```

### 6. Switch onChange에서 즉시 재계산 (이전 수정)

**숙박비 Switch:**
```typescript
<Switch 
  disabled={submitting}
  onChange={(checked) => {
    form.setFieldsValue({ hasAccommodation: checked })
    // Switch 변경 시 즉시 재계산
    if (calculationMode === 'auto' && sessions && distance !== undefined && fuelCost !== undefined && tollFee !== undefined) {
      const currentIsBusinessIncome = form.getFieldValue('isBusinessIncome') ?? false
      try {
        calculateSettlement({
          sessions: Number(sessions),
          distance: Number(distance),
          fuelCost: Number(fuelCost) || 0,
          tollFee: Number(tollFee) || 0,
          accommodationRequired: Boolean(checked), // Switch의 최신 값 직접 사용
          isBusinessIncome: Boolean(currentIsBusinessIncome),
        })
      } catch (error) {
        // 에러는 무시
      }
    }
  }}
/>
```

---

## 🧪 검증 시나리오

### 시나리오 1: 모달 열기 → 입력 → 닫기 → 다시 열기
1. 모달 열기
2. 자동 산출 모드에서 차시 수, 거리, 주유비, 통행료 입력
3. 숙박비 스위치 켜기
4. 산출 결과 확인 (숙박비 포함)
5. 모달 닫기
6. **예상 결과**: 모든 상태 초기화, 계산 결과 없음
7. 모달 다시 열기
8. **예상 결과**: 빈 폼, 계산 결과 없음, 자동 산출 모드

### 시나리오 2: 모달 열기 → 제출 → 다시 열기
1. 모달 열기
2. 모든 필드 입력 및 제출
3. 제출 성공
4. **예상 결과**: 모든 상태 초기화
5. 모달 다시 열기
6. **예상 결과**: 빈 폼, 계산 결과 없음

### 시나리오 3: 모달 열기 → 취소 → 다시 열기
1. 모달 열기
2. 모든 필드 입력
3. 취소 버튼 클릭
4. **예상 결과**: 모든 상태 초기화
5. 모달 다시 열기
6. **예상 결과**: 빈 폼, 계산 결과 없음

### 시나리오 4: 숙박비 스위치 변경
1. 모달 열기
2. 자동 산출 모드에서 필수 필드 입력
3. 숙박비 스위치 켜기
4. **예상 결과**: 즉시 재계산, 산출 결과에 숙박비 80,000원 포함
5. 숙박비 스위치 끄기
6. **예상 결과**: 즉시 재계산, 산출 결과에서 숙박비 제거

---

## ✅ 수정 효과

### 개선 사항
1. **완전한 초기화**: 모달이 닫힐 때 모든 상태가 초기화됨
2. **계산 결과 초기화**: `resetCalculation()` 호출로 이전 계산 결과 제거
3. **모드 초기화**: `calculationMode`가 항상 'auto'로 초기화
4. **즉시 반영**: Switch 변경 시 즉시 재계산
5. **안전한 계산**: 모달이 닫혀있을 때는 계산하지 않음

### 초기화되는 항목
- ✅ Form 필드 (`form.resetFields()`)
- ✅ 계산 결과 (`resetCalculation()`)
- ✅ 계산 모드 (`setCalculationMode('auto')`)
- ✅ 선택된 프로그램 (`setSelectedProgram(null)`)
- ✅ 비용 항목 접기/펴기 (`setCostItemsOpen(true)`)
- ✅ 제출 상태 (`setSubmitting(false)`)

---

## 📋 초기화 시점

| 시점 | 초기화 항목 |
|------|------------|
| 모달 열릴 때 | 모든 상태 초기화 |
| 모달 닫힐 때 | 모든 상태 초기화 |
| 취소 버튼 클릭 | 모든 상태 초기화 |
| 제출 성공 후 | 모든 상태 초기화 |

---

## 🎯 결론

**수정 완료**: 정산 제출 모달의 모든 초기화 문제를 해결했습니다.

**주요 변경점**:
1. `useSettlementCalculation`의 `reset` 함수 사용
2. 모달 열림/닫힘 시 전체 초기화
3. `handleCancel`에서 전체 초기화
4. 제출 성공 후 전체 초기화
5. 자동 산출 useEffect에 모달 상태 확인 추가
6. Switch onChange에서 즉시 재계산

**검증 필요**: 실제 UI에서 모달을 열고 닫으면서 이전 상태가 남아있지 않는지 확인
