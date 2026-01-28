---
priority: high
category: implementation
---

# 템플릿 관리 - 파일 양식 카테고리 구조 개선

## 📋 개요

템플릿 관리의 파일 양식 카테고리 구조를 개선하여 메뉴 구조와 실제 페이지 구조를 일치시키고, 사용자 경험을 향상시키는 작업입니다.

---

## 🎨 (UX/UI 개선) 템플릿 관리 - 파일 양식 카테고리 구조 개선

### 문제 정의 (기획자 관점)

**현재 상황:**

- 파일 양식 하위에 8개 카테고리(강사 이력서, 강의 보고서, 교육계획서, 수료증, 활동확인서, 영수증, 지급조서, 경력증명서)가 존재
- 라우터 구조가 복잡하게 구성됨: `/templates/file-forms/instructor-resume`, `/templates/file-forms/lecture-report` 등
- 실제로는 모두 같은 `TemplateFilesPage` 컴포넌트를 렌더링하며, 카테고리 필터로만 구분됨
- 메뉴 구조와 실제 라우팅이 불일치하여 사용자 혼란 발생
- URL과 실제 동작이 일치하지 않아 브라우저 뒤로가기/앞으로가기 시 예상과 다른 동작

**핵심 문제:**

1. **라우팅 복잡성**: 8개의 별도 경로가 있지만 실제로는 필터링만 다름
2. **메뉴 구조 불일치**: 사이드바 메뉴에는 하위 카테고리가 표시되지만, 실제 페이지는 단일 페이지
3. **URL 의미론적 불일치**: URL이 카테고리를 나타내지만, 실제로는 쿼리 파라미터로 관리되어야 함
4. **사용자 혼란**: 메뉴에서 특정 카테고리를 클릭해도 같은 페이지가 열림

### 개선 목표 (PM 관점)

**비즈니스 목표:**

- 운영자가 **직관적으로** 원하는 카테고리의 템플릿을 빠르게 찾을 수 있어야 함
- 메뉴 구조와 실제 동작이 **일치**하여 사용자 신뢰도 향상
- URL 구조가 **명확하고 예측 가능**하여 공유/북마크 시 혼란 최소화

**기술적 목표:**

- 라우터 구조 단순화로 유지보수성 향상
- 쿼리 파라미터 기반 필터링으로 상태 관리 일관성 확보
- 브라우저 히스토리와 URL 동기화로 사용자 경험 개선

### UX/UI 개선 방향 (디자이너 관점)

#### 1. 페이지 구조 개선

**현재 구조:**

```
/templates (탭: 프로그램 양식, 파일 양식, 문자 양식, 메일 양식)
  └─ /file-forms (파일 양식 목록 - 카테고리 필터만 있음)
      ├─ /instructor-resume (같은 페이지)
      ├─ /lecture-report (같은 페이지)
      └─ ... (8개 경로 모두 같은 페이지)
```

**개선 구조:**

```
/templates (탭: 프로그램 양식, 파일 양식, 문자 양식, 메일 양식)
  └─ /file-forms (파일 양식 목록)
      └─ 쿼리 파라미터: ?category=instructor-resume
```

**변경 사항:**

- 하위 라우트 제거: `/file-forms/instructor-resume` 등의 경로 삭제
- 쿼리 파라미터 사용: `?category=instructor-resume` 형태로 카테고리 관리
- 단일 페이지 유지: 하나의 `TemplateFilesPage`에서 모든 카테고리 처리

#### 2. 메뉴 구조 개선

**현재 메뉴:**

```
템플릿 관리
  ├─ 프로그램 양식
  ├─ 파일 양식 (그룹)
  │   ├─ 강사 이력서
  │   ├─ 강의 보고서
  │   └─ ... (8개 하위 메뉴)
  ├─ 카카오 알림톡 관리
  └─ 메일 관리
```

**개선 메뉴:**

```
템플릿 관리
  ├─ 프로그램 양식
  ├─ 파일 양식 (단일 메뉴, 클릭 시 카테고리 탭 표시)
  ├─ 카카오 알림톡 관리
  └─ 메일 관리
```

**변경 사항:**

- 파일 양식 하위 메뉴 제거
- 파일 양식 클릭 시 페이지 내부에 카테고리 탭/필터 표시
- 사이드바 메뉴 단순화로 인지 부하 감소

#### 3. 페이지 내 카테고리 네비게이션

**옵션 A: 탭 형태 (권장)**

- 파일 양식 페이지 상단에 카테고리 탭 추가
- "전체", "강사 이력서", "강의 보고서", "교육계획서" 등 8개 카테고리 + "기타"
- 탭 클릭 시 쿼리 파라미터 업데이트: `?category=instructor-resume`
- URL 공유 시 선택된 카테고리 유지

**옵션 B: 필터 드롭다운 (현재 유지)**

- UnifiedFilterCard의 카테고리 필터 유지
- 초기 로드 시 쿼리 파라미터에서 카테고리 읽어서 필터 적용
- 필터 변경 시 쿼리 파라미터 업데이트

**권장: 옵션 A (탭 형태)**

- **이유**: 카테고리가 고정적이고 8개로 적당한 수준
- **장점**: 시각적으로 명확하고, 빠른 전환 가능
- **단점**: 카테고리가 많아지면 탭이 길어질 수 있음 (현재는 문제 없음)

#### 4. URL 구조 개선

**현재 URL:**

```
/templates/file-forms/instructor-resume
/templates/file-forms/lecture-report
```

**개선 URL:**

```
/templates/file-forms?category=instructor-resume
/templates/file-forms?category=lecture-report
/templates/file-forms (전체 보기)
```

**변경 사항:**

- 경로 기반 → 쿼리 파라미터 기반으로 변경
- 브라우저 히스토리와 URL이 실제 상태와 일치
- 북마크/공유 시 선택된 카테고리 정보 포함

#### 5. 사용자 플로우 개선

**시나리오 1: 사이드바 메뉴에서 파일 양식 클릭**

1. `/templates/file-forms`로 이동
2. 페이지 상단에 카테고리 탭 표시 (기본: "전체")
3. 전체 템플릿 목록 표시

**시나리오 2: 카테고리 탭 클릭**

1. 사용자가 "강사 이력서" 탭 클릭
2. URL 업데이트: `/templates/file-forms?category=instructor-resume`
3. 해당 카테고리 템플릿만 필터링하여 표시
4. 브라우저 히스토리에 상태 저장

**시나리오 3: URL 직접 접근**

1. `/templates/file-forms?category=lecture-report` 접근
2. 페이지 로드 시 "강의 보고서" 탭이 활성화된 상태로 표시
3. 해당 카테고리 템플릿만 표시

---

## 🔄 (UX/UI 개선 수정) 템플릿 관리 - 파일 양식 카테고리 구조 재조정

### 변경 요구사항 (기획자 관점)

**요청 사항:**

- 파일 양식 하위 카테고리의 **뎁스는 그대로 유지** (사이드바 메뉴 구조 유지)
- 페이지 내 **탭을 제거**하고, 각 카테고리별로 **별도 페이지 경로**로 접근
- 사용자가 사이드바 메뉴에서 특정 카테고리를 클릭하면 해당 카테고리의 템플릿만 보이도록

**변경 이유:**

- 탭 방식보다 메뉴 기반 네비게이션이 더 직관적
- 각 카테고리가 독립적인 페이지로 느껴지도록 하여 사용자 경험 개선
- 사이드바 메뉴 구조를 활용하여 정보 아키텍처 명확화

### 개선 목표 (PM 관점)

**비즈니스 목표:**

- 사이드바 메뉴를 통한 **명확한 카테고리 네비게이션** 제공
- 각 카테고리가 **독립적인 페이지**로 인식되도록 하여 사용자 혼란 최소화
- 메뉴 구조와 실제 페이지 구조의 **완전한 일치** 보장

**기술적 목표:**

- 라우터 구조를 카테고리별 경로로 복원 (하지만 단순한 구조 유지)
- 각 카테고리 경로에서 해당 카테고리만 필터링하여 표시
- URL과 메뉴 구조의 완전한 동기화

### UX/UI 개선 방향 (디자이너 관점)

#### 1. 메뉴 구조 복원

**변경 전 (현재):**

```
템플릿 관리
  ├─ 프로그램 양식
  ├─ 파일 양식 (단일 메뉴)
  ├─ 카카오 알림톡 관리
  └─ 메일 관리
```

**변경 후 (목표):**

```
템플릿 관리
  ├─ 프로그램 양식
  ├─ 파일 양식 (그룹)
  │   ├─ 강사 이력서
  │   ├─ 강의 보고서
  │   ├─ 교육계획서
  │   ├─ 수료증
  │   ├─ 활동확인서
  │   ├─ 영수증
  │   ├─ 지급조서
  │   └─ 경력증명서
  ├─ 카카오 알림톡 관리
  └─ 메일 관리
```

#### 2. 라우터 구조 변경

**변경 전 (현재):**

```typescript
{
  path: 'file-forms',
  element: <TemplateFilesPage />,
}
```

**변경 후 (목표):**

```typescript
{
  path: 'file-forms',
  children: [
    {
      index: true,
      element: <TemplateFilesPage />, // 전체 보기
    },
    {
      path: 'instructor-resume',
      element: <TemplateFilesPage defaultCategory="instructor-resume" />,
    },
    {
      path: 'lecture-report',
      element: <TemplateFilesPage defaultCategory="lecture-report" />,
    },
    // ... 나머지 6개 카테고리
  ],
}
```

#### 3. 페이지 구조 변경

**변경 전 (현재):**

- 페이지 상단에 카테고리 탭 표시
- 탭 클릭 시 쿼리 파라미터로 필터링

**변경 후 (목표):**

- 페이지 상단의 카테고리 탭 제거
- URL 경로에서 카테고리를 읽어서 자동 필터링
- 각 카테고리 페이지는 해당 카테고리의 템플릿만 표시

#### 4. URL 구조

**변경 후 URL:**

```
/templates/file-forms (전체 템플릿)
/templates/file-forms/instructor-resume (강사 이력서만)
/templates/file-forms/lecture-report (강의 보고서만)
/templates/file-forms/education-plan (교육계획서만)
... (나머지 카테고리)
```

---

## 👨‍💻 구현 가이드라인 (시니어 개발자 관점)

### 1. 라우터 구조 변경 (P0)

**작업 내용:**

- `apps/cms/src/app/router/index.tsx`에서 `file-forms` 라우트를 children 구조로 변경
- 각 카테고리별 경로 추가 (8개 카테고리)
- `TemplateFilesPage`에 `category` prop 전달 방식 구현

**구현 방법:**

```typescript
// router/index.tsx
{
  path: 'file-forms',
  children: [
    {
      index: true,
      element: <TemplateFilesPage />,
    },
    {
      path: 'instructor-resume',
      element: <TemplateFilesPage defaultCategory="instructor-resume" />,
    },
    {
      path: 'lecture-report',
      element: <TemplateFilesPage defaultCategory="lecture-report" />,
    },
    // ... 나머지 6개
  ],
}
```

### 2. TemplateFilesPage 컴포넌트 수정 (P0)

**작업 내용:**

- `category` prop 추가 (선택적)
- URL 경로에서 카테고리 읽기 (`useParams` 또는 `useLocation`)
- 카테고리 탭 제거
- 초기 로드 시 카테고리 자동 필터링

**구현 방법:**

```typescript
// template-files-page.tsx
interface TemplateFilesPageProps {
  defaultCategory?: FileTemplateCategory
}

export default function TemplateFilesPage({ defaultCategory }: TemplateFilesPageProps = {}) {
  const location = useLocation()
  // URL 경로에서 카테고리 추출
  const pathCategory = location.pathname.split('/').pop()
  const categoryFromPath =
    pathCategory && pathCategory !== 'file-forms'
      ? (pathCategory as FileTemplateCategory)
      : undefined

  const activeCategory = defaultCategory || categoryFromPath || 'all'

  // 탭 제거, 초기 필터에 카테고리 설정
  useEffect(() => {
    if (activeCategory !== 'all') {
      setPendingFilters(prev => ({ ...prev, category: activeCategory }))
      setAppliedFilters(prev => ({ ...prev, category: activeCategory }))
    }
  }, [activeCategory])

  // ... 나머지 로직
}
```

### 3. 메뉴 설정 복원 (P0)

**작업 내용:**

- `apps/cms/src/shared/config/menu-config.tsx`에서 파일 양식 하위 메뉴 복원
- 각 카테고리별 메뉴 아이템 추가

**구현 방법:**

```typescript
// menu-config.tsx
{
  key: 'file-forms-group',
  label: '파일 양식',
  icon: <FolderOutlined />,
  enabled: true,
  allowedRoles: ['ADMIN'],
  children: [
    {
      key: '/templates/file-forms/instructor-resume',
      label: '강사 이력서',
      enabled: true,
      allowedRoles: ['ADMIN'],
    },
    // ... 나머지 7개 카테고리
  ],
}
```

### 4. 쿼리 파라미터 로직 제거 (P1)

**작업 내용:**

- `useQueryParams`를 사용한 category 파라미터 처리 제거
- URL 경로 기반으로만 카테고리 관리
- 탭 관련 코드 제거

---

## 📊 우선순위 및 작업 분류

### P0 (즉시 적용 - 필수)

**1. 라우터 구조 변경**

- **담당**: 시니어 개발자
- **작업**: `file-forms` 라우트를 children 구조로 변경, 8개 카테고리 경로 추가
- **예상 시간**: 30분
- **의존성**: 없음

**2. TemplateFilesPage 컴포넌트 수정**

- **담당**: 시니어 개발자
- **작업**:
  - `category` prop 추가
  - URL 경로에서 카테고리 읽기 로직 추가
  - 카테고리 탭 제거
  - 초기 필터링 로직 수정
- **예상 시간**: 1시간
- **의존성**: 라우터 구조 변경 완료 후

**3. 메뉴 설정 복원**

- **담당**: 시니어 개발자
- **작업**: 파일 양식 하위 메뉴 8개 복원
- **예상 시간**: 15분
- **의존성**: 없음

### P1 (다음 단계 - 정리)

**4. 쿼리 파라미터 로직 정리**

- **담당**: 시니어 개발자
- **작업**:
  - `useQueryParams`를 사용한 category 관련 코드 제거
  - 탭 관련 핸들러 및 상태 제거
  - 불필요한 useEffect 정리
- **예상 시간**: 30분
- **의존성**: P0 작업 완료 후

**5. 테스트 및 검증**

- **담당**: 시니어 개발자
- **작업**:
  - 각 카테고리 경로 접근 테스트
  - 메뉴 클릭 시 올바른 페이지 표시 확인
  - 필터링 동작 확인
- **예상 시간**: 30분
- **의존성**: P0, P1 작업 완료 후

---

## ✅ 성공 기준 (검증)

### 기능적 검증

- [ ] `/templates/file-forms` 접근 시 전체 템플릿 표시
- [ ] `/templates/file-forms/instructor-resume` 접근 시 강사 이력서만 표시
- [ ] 각 카테고리 경로에서 해당 카테고리 템플릿만 필터링 표시
- [ ] 사이드바 메뉴에서 카테고리 클릭 시 올바른 페이지로 이동
- [ ] 페이지 내 탭이 제거되었는지 확인

### UX 검증

- [ ] 메뉴 구조와 실제 페이지 구조가 일치함
- [ ] 각 카테고리가 독립적인 페이지로 느껴짐
- [ ] 사용자가 직관적으로 원하는 카테고리를 찾을 수 있음

### 기술적 검증

- [ ] 라우터 구조가 명확하고 유지보수하기 쉬움
- [ ] URL 경로와 메뉴 구조가 완전히 동기화됨
- [ ] 불필요한 쿼리 파라미터 로직이 제거됨

---

## 📝 참고사항

- 이 개선은 **파일 양식**에만 적용되며, 문자 양식/메일 양식은 별도 검토 필요
- 카테고리 목록이 변경될 경우(추가/삭제) 라우터와 메뉴 설정도 함께 업데이트 필요
- 향후 카테고리가 15개 이상으로 증가할 경우, UI 패턴 재검토 필요

---

**마지막 업데이트**: 2026-01-28
