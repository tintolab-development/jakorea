# JAKorea CMS 디자인 가이드라인

## 🎨 디자인 언어 통일 원칙

### 1. 레이아웃 패턴 통일

#### 목록 페이지 (List Pages)

**공통 구조:**

```
┌─────────────────────────────────────────┐
│ 페이지 헤더 (제목 + 주요 액션 버튼)      │
├─────────────────────────────────────────┤
│ 필터 영역 (검색, 드롭다운 필터)         │
├─────────────────────────────────────────┤
│ 컨텐츠 영역                              │
│ - 테이블: 데이터 밀도 높은 경우          │
│ - 카드 그리드: 시각적 표현 중요할 때     │
│ - 리스트: 중간 밀도, 간단한 정보         │
├─────────────────────────────────────────┤
│ 페이지네이션 (항상 중앙 정렬)            │
└─────────────────────────────────────────┘
```

**레이아웃 선택 기준:**

- **테이블**: 정렬/검색이 중요한 데이터 (강사 목록)
- **카드 그리드**: 시각적 구분이 중요한 데이터 (스폰서 목록)
- **리스트**: 간단한 정보, 빠른 스캔 (학교 목록)

#### 상세 페이지 (Detail Pages)

**공통 구조:**

```
┌─────────────────────────────────────────┐
│ 페이지 헤더 (제목 + 액션 버튼)           │
├─────────────────────────────────────────┤
│ 정보 카드 섹션                           │
│ - MdCard 사용 (variant 구분)            │
│ - 섹션별로 구분                          │
└─────────────────────────────────────────┘
```

#### 폼 페이지 (Form Pages)

**공통 구조:**

```
┌─────────────────────────────────────────┐
│ 페이지 헤더 (제목)                       │
├─────────────────────────────────────────┤
│ 폼 섹션 (MdCard로 감싸기)               │
│ - 그리드 레이아웃 (반응형)               │
│ - 필드별 적절한 M3 컴포넌트 사용         │
├─────────────────────────────────────────┤
│ 액션 버튼 (하단 고정, MdCard 내부)      │
└─────────────────────────────────────────┘
```

---

## 🧩 M3 컴포넌트 사용 가이드

### 버튼 (Button)

**Variant 선택 기준:**

- `filled`: 주요 액션 (등록, 저장, 확인)
- `outlined`: 보조 액션 (수정, 취소)
- `text`: 부가 액션 (상세보기, 삭제)
- `tonal`: 강조하되 filled보다 약한 액션
- `elevated`: 강조하고 싶은 부가 액션

**사용 예시:**

```tsx
// 주요 액션
<MdButton variant="filled" onClick={handleSubmit}>등록</MdButton>

// 보조 액션
<MdButton variant="outlined" onClick={handleCancel}>취소</MdButton>

// 부가 액션
<MdButton variant="text" onClick={handleDetail}>상세보기</MdButton>
```

### 텍스트 필드 (TextField)

**Variant 선택:**

- `outlined`: 기본 (대부분의 경우)
- `filled`: 강조하고 싶은 입력 필드

**사용 예시:**

```tsx
<MdTextField
  label="이름"
  value={name}
  onChange={value => setName(value)}
  required
  error={errors.name ? true : false}
  errorText={errors.name}
/>
```

### 카드 (Card)

**Variant 선택:**

- `elevated`: 기본 카드 (목록, 상세 정보)
- `outlined`: 구분이 필요한 정보 (중요 정보, 경고)
- `filled`: 배경이 필요한 섹션

**사용 예시:**

```tsx
// 기본 카드
<MdCard variant="elevated">...</MdCard>

// 중요 정보 강조
<MdCard variant="outlined" className="highlight-card">...</MdCard>
```

### 칩 (Chip)

**사용 시나리오:**

- 태그/라벨 표시
- 필터 표시
- 상태 표시

**사용 예시:**

```tsx
<MdChip label={status} selected={false} disabled />
```

---

## 🎨 색상 시스템

### 색상 토큰 사용

**M3 색상 토큰 우선 사용:**

```css
/* Primary */
--md-sys-color-primary
--md-sys-color-on-primary
--md-sys-color-primary-container

/* Secondary */
--md-sys-color-secondary
--md-sys-color-on-secondary
--md-sys-color-secondary-container

/* Error */
--md-sys-color-error
--md-sys-color-error-container
```

### 도메인별 색상 (Variation)

**도메인별 구분용 색상:**

- 학교: `--md-sys-color-school-primary`
- 강사: `--md-sys-color-instructor-primary`
- 스폰서: `--md-sys-color-sponsor-primary`

---

## 📐 간격 및 레이아웃

### 간격 (Spacing)

**일관된 간격 사용:**

- 작은 간격: `8px`
- 기본 간격: `12px`, `16px`
- 섹션 간격: `24px`, `32px`

### 패딩 (Padding)

- 카드 내부: `16px 20px` (상하 16px, 좌우 20px)
- 섹션 내부: `24px`
- 필터 영역: `12px 16px`

### 최소 높이 (Min Height)

- 인풋 필드: `44px`
- 버튼: `40px`
- 테이블 헤더: `48px`
- 테이블 행: `52px`

---

## 🔤 타이포그래피

### 폰트 크기

- 페이지 제목: `28px` (font-weight: 400)
- 섹션 제목: `20px` (font-weight: 500)
- 본문: `14px` (font-weight: 400)
- 라벨: `12px`, `14px` (font-weight: 500)
- 작은 텍스트: `12px` (font-weight: 400)

---

## ✅ 상태 표시

### 로딩 상태

- 테이블: `TableSkeleton` 사용
- 카드 리스트: `MdSkeleton` 사용
- 단일 컴포넌트: `MdSkeleton` 사용

### 에러 상태

- 폼 필드: `error` prop + `errorText`
- 페이지 레벨: 에러 카드 (error-container 색상)

### 빈 상태

- 적절한 메시지 표시
- 필요한 경우 액션 버튼 제공

---

## 🎯 접근성 (Accessibility)

### ARIA 레이블

- 버튼: `ariaLabel` prop 사용
- 폼 필드: `label` prop 사용
- 필수 필드: `required` prop 사용

### 키보드 네비게이션

- 모든 인터랙티브 요소는 키보드로 접근 가능
- 포커스 상태 명확히 표시

---

## 📱 반응형 디자인

### 브레이크포인트 (데스크톱 우선)

- 데스크톱: 1200px 이상
- 태블릿: 768px - 1199px
- 모바일: 767px 이하 (현재 미지원, 향후 고려)

### 반응형 패턴

- 그리드: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- 테이블: 작은 화면에서는 카드 형태로 전환 고려

---

## 🔄 페이지별 일관성

### 공통 패턴

1. **필터 영역**: 항상 상단, 일관된 레이아웃
2. **페이지네이션**: 항상 하단 중앙 정렬
3. **액션 버튼**: 페이지 헤더 오른쪽 또는 카드 하단
4. **로딩 상태**: 스켈레톤 UI 사용
5. **에러 처리**: 사용자 친화적 메시지 (한글)

---

## 🎨 UI Variation 원칙

### 언제 다른 레이아웃 사용?

- **테이블**: 정렬/검색이 중요한 데이터
- **카드 그리드**: 시각적 구분이 중요한 데이터
- **리스트**: 간단한 정보, 빠른 스캔

### 언제 같은 패턴 유지?

- 필터 영역: 모든 목록 페이지에서 동일 패턴
- 페이지네이션: 모든 목록 페이지에서 동일 스타일
- 폼 레이아웃: 모든 폼에서 동일한 그리드 시스템

---

## 📝 체크리스트

새 페이지 구현 시 확인:

- [ ] 페이지 헤더 구조 일관성
- [ ] 필터 영역 레이아웃 일관성
- [ ] M3 컴포넌트 적절히 사용
- [ ] 색상 토큰 사용
- [ ] 간격/패딩 일관성
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리
- [ ] 페이지네이션 중앙 정렬
- [ ] 접근성 고려 (ARIA, 키보드)
