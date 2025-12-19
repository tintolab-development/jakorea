# 이벤트 처리 가이드

## 이벤트 버블링 및 전파 방지

모든 컴포넌트에서 이벤트 버블링을 고려하여 `stopPropagation()`을 적절히 사용해야 합니다.

## 적용 규칙

### 1. 테이블 작업 컬럼
- 드롭다운 메뉴, 버튼, Popconfirm 등 모든 인터랙티브 요소에 `stopPropagation()` 적용
- 테이블 행 클릭 이벤트와 충돌 방지

```tsx
// ✅ 올바른 예시
<div onClick={(e) => e.stopPropagation()}>
  <Dropdown menu={{ items }} trigger={['click']}>
    <Button onClick={(e) => e.stopPropagation()}>...</Button>
  </Dropdown>
</div>

// ❌ 잘못된 예시
<Dropdown menu={{ items }}>
  <Button>...</Button>
</Dropdown>
```

### 2. 폼 요소
- Select, Input, DatePicker, TimePicker 등 모든 폼 요소의 onChange 이벤트
- Radio.Group, Checkbox.Group 등 그룹 컴포넌트

```tsx
// ✅ 올바른 예시
<Select
  onChange={(value) => {
    // stopPropagation은 onChange에서 직접 처리 불가
    // 대신 부모 요소에서 처리
  }}
  onClick={(e) => e.stopPropagation()}
/>

<Radio.Group
  onChange={(e) => {
    e.stopPropagation()
    // 처리 로직
  }}
  onClick={(e) => e.stopPropagation()}
>
  <Radio.Button onClick={(e) => e.stopPropagation()}>...</Radio.Button>
</Radio.Group>
```

### 3. 캘린더 컴포넌트
- Calendar의 onSelect, onPanelChange
- Radio.Group (월간/연간 전환)
- 날짜 셀 내부의 모든 클릭 이벤트

```tsx
// ✅ 올바른 예시
<div onClick={(e) => e.stopPropagation()}>
  <Calendar
    onSelect={(date) => {
      // 날짜 선택 처리
    }}
    onPanelChange={(date, mode) => {
      // 패널 변경 처리
    }}
  />
</div>

<Radio.Group
  onChange={(e) => {
    e.stopPropagation()
    setMode(e.target.value)
  }}
  onClick={(e) => e.stopPropagation()}
>
  <Radio.Button onClick={(e) => e.stopPropagation()}>월간</Radio.Button>
</Radio.Group>
```

### 4. 모달 및 Drawer
- 모달 내부의 모든 인터랙티브 요소
- Drawer 내부의 버튼, 폼 요소

```tsx
// ✅ 올바른 예시
<Modal>
  <Form>
    <Select onClick={(e) => e.stopPropagation()} />
    <Button onClick={(e) => e.stopPropagation()}>저장</Button>
  </Form>
</Modal>
```

### 5. Popover 및 Tooltip
- Popover 내부의 링크, 버튼
- Tooltip이 적용된 요소의 클릭 이벤트

```tsx
// ✅ 올바른 예시
<Popover content={...}>
  <div onClick={(e) => e.stopPropagation()}>
    {/* 내용 */}
  </div>
</Popover>
```

## 체크리스트

새로운 컴포넌트를 만들 때 다음을 확인하세요:

- [ ] 테이블의 작업 컬럼 버튼에 `stopPropagation()` 적용
- [ ] 드롭다운 메뉴의 클릭 이벤트에 `stopPropagation()` 적용
- [ ] 폼 요소의 onChange/onClick에 `stopPropagation()` 적용
- [ ] Radio.Group, Checkbox.Group에 `stopPropagation()` 적용
- [ ] 캘린더의 패널 변경 이벤트에 `stopPropagation()` 적용
- [ ] 모달/Drawer 내부 요소에 `stopPropagation()` 적용
- [ ] Popover/Tooltip 내부 요소에 `stopPropagation()` 적용
- [ ] 중첩된 클릭 이벤트가 있는 경우 모든 레벨에서 처리

## 주의사항

1. **과도한 사용 금지**: 모든 이벤트에 무작정 적용하지 말고, 실제로 버블링이 문제가 되는 경우에만 사용
2. **이벤트 위임 활용**: 가능한 경우 이벤트 위임을 활용하여 성능 최적화
3. **접근성 고려**: 키보드 이벤트도 함께 고려 (onKeyDown 등)

