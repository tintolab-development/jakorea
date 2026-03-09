# 대시보드 위젯 재정렬 — 비즈니스 로직 및 UX 개선

## 1. 위젯 재정렬 비즈니스 로직 (현재 구현)

### 1.1 데이터 구조

| 저장소 | 키 | 설명 |
|--------|-----|------|
| **dashboard-widget-order-store** (Zustand + persist) | `orderByRole` | 역할별 위젯 id 배열 `string[]` (표시 순서) |
| | `widthByRole` | 역할별 위젯별 너비 `Record<widgetId, 12 \| 24>` (12=50%, 24=100%) |

- **orderedIds**: `getOrderedIds(role, defaultIds)`로 복원. 저장된 순서가 defaultIds와 동일 집합이면 저장값 사용, 아니면 기본 순서 사용.
- **순서 변경**: `setOrderedIds(role, next)` 호출 시 `orderByRole[role]`만 갱신.
- **너비 변경**: `setWidgetWidth(role, widgetId, colSpan)` 호출 시 `widthByRole[role][widgetId]`만 갱신.
- **지속화**: localStorage 키 `dashboard-widget-order`로 자동 저장·복원.

### 1.2 재정렬이 일어나는 시점

1. **드래그 종료 (handleDragEnd)**  
   - `over`(드롭 대상) 또는 **포인터 위치(getSlotRects)**로 `newIndex` 계산.
2. **순서 반영**  
   - `next = arrayMove(orderedIds, oldIndex, newIndex)`  
   - `setOrderedIds(userRole, next)` → 스토어 갱신 → React가 `orderedIds` 기준으로 Row 자식 다시 렌더.
3. **너비 반영 (50% 분할 등)**  
   - `shouldSplit`이면 `setWidgetWidth(role, overId, 12)`, `setWidgetWidth(role, activeId, 12)`.  
   - 빈 영역에 100% 위젯을 놓은 경우 `setWidgetWidth(role, activeId, 12)`만 호출.
4. **화면 반영**  
   - `orderedIds`·`widthByRole` 변경 → 대시보드 리렌더 → Ant Design `Row`/`Col`이 새 순서·`span`으로 레이아웃 재배치.  
   - **별도 “재정렬” API 없음**: 순서·너비만 바꾸면 그리드가 그에 맞춰 재배치됨.

### 1.3 플로우 요약

```
드래그 종료
  → newIndex 결정 (over 또는 getInsertIndexFromPoint)
  → setOrderedIds(role, arrayMove(orderedIds, oldIndex, newIndex))
  → (조건에 따라) setWidgetWidth 1~2회
  → 스토어 갱신 → persist → 리렌더 → Row/Col 재배치
```

- **드래그 중**: `@dnd-kit` Sortable의 `transform`/`transition`으로 다른 슬롯들이 부드럽게 자리 이동.
- **드롭 직후**: DragOverlay `dropAnimation` 300ms, 슬롯별 `transition` 300ms.  
- **너비 변경 시**: `SortableWidgetSlot`에서 `flex-basis`/`max-width`에 0.35s 트랜지션 적용.

---

## 2. UX 디자이너 검토 및 개선 방향

### 2.1 현재 동작에서의 UX 이슈

| 이슈 | 설명 |
|------|------|
| **저장 피드백 부재** | 순서·너비가 바뀌어도 “저장됐다”는 시각/알림이 없어 사용자가 불안할 수 있음. |
| **모션 일관성** | 드롭 애니메이션(300ms)과 슬롯 전환(300ms)은 있으나, “재정렬 완료”를 느끼는 하나의 흐름으로 정리되면 좋음. |
| **접근성** | `prefers-reduced-motion` 사용자에 대한 고려가 없음. |
| **드래그 인지도** | 오버레이가 “들어 올려진” 느낌을 주기 위해 살짝 강조되면 드래그 의도가 더 분명해짐. |

### 2.2 UX 개선 방향 (개발 위임 사항)

1. **저장 피드백**  
   - 순서 또는 너비가 변경된 직후 **짧은 토스트**(예: “위젯 위치가 저장되었습니다”) 표시.  
   - 중복 노출 방지를 위해 한 번의 드롭당 한 번만 노출.

2. **모션 정리**  
   - 드롭·재정렬 관련 duration/easing을 통일해 “한 번에 재배치됐다”는 인상을 주기.  
   - (선택) `prefers-reduced-motion: reduce`일 때는 duration 단축 또는 애니메이션 비활성화.

3. **드래그 오버레이**  
   - 드래그 중 오버레이에 **살짝 확대**(예: scale 1.02) 또는 그림자 강화로 “들어 올려진 카드” 인지도 향상.

4. **재정렬 로직 자체**  
   - 비즈니스 로직(순서·50% 분할)은 현재 구현 유지.  
   - “재정렬”은 **순서/너비 상태만 갱신하면 그리드가 자동 재배치되는 현재 방식**을 그대로 사용.

---

## 3. 개발자 구현 체크리스트

- [ ] 드래그 종료 후 순서 또는 너비가 변경된 경우에만 **message.success** 등으로 “위젯 위치가 저장되었습니다” 토스트 1회 표시.
- [ ] **prefers-reduced-motion** 미디어 쿼리 반영: 감소 시 dropAnimation·slot transition duration 단축 또는 0.
- [ ] **DragOverlay**에 `transform: scale(1.02)`(또는 CSS 클래스) 적용해 드래그 인지도 개선.
- [ ] 위 변경 후, 50% 분할·빈 영역 드롭·다른 위젯 위 드롭 시나리오로 회귀 확인.

---

**문서 역할**: 기획/디자이너는 §1로 재정렬 비즈니스 로직을 확인하고, §2로 UX 개선 방향을 공유한 뒤 §3을 개발자에게 위임한다.
