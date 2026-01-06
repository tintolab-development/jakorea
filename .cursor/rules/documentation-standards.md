# 문서 관리 표준

## 📋 파일 확장자 구분 기준

### `.md` (Markdown) - 일반 문서 및 규칙

**사용 시기:**
- ✅ 개발 가이드 및 규칙 문서
- ✅ 프로젝트 구조 설명
- ✅ API 명세서
- ✅ 컴포넌트 패턴 가이드
- ✅ 디자인 가이드라인
- ✅ 코딩 표준
- ✅ 참고 문서 (로드맵, 브리핑 등)

**특징:**
- Cursor가 자동으로 인식하여 AI 컨텍스트에 포함
- 사람이 읽기 쉬운 형식
- 버전 관리에 적합
- GitHub/GitLab에서 자동 렌더링

**예시:**
- `project-guide.md` - 프로젝트 가이드
- `component-patterns.md` - 컴포넌트 패턴
- `api-spec-mock.md` - API 명세

### `.mdc` (Cursor Markdown) - 구조화된 규칙

**사용 시기:**
- ✅ 매우 구체적이고 실행 가능한 규칙
- ✅ 코드 생성 시 직접 참조되는 규칙
- ✅ 자동화된 검증이 필요한 규칙
- ✅ 프로젝트별 필수 준수 사항

**특징:**
- Cursor가 더 높은 우선순위로 처리
- 구조화된 형식 (YAML frontmatter 등)
- 코드 생성 시 직접 참조
- 규칙 위반 시 경고 가능

**예시:**
- `file-naming.mdc` - 파일 명명 규칙 (자동 검증)
- `component-structure.mdc` - 컴포넌트 구조 규칙
- `api-conventions.mdc` - API 컨벤션 규칙

---

## 🎯 현재 프로젝트 권장 사항

### 현재 상태
- 모든 규칙이 `.md` 형식으로 작성됨
- 대부분의 규칙이 일반 문서로 충분함

### `.mdc`로 전환 고려 대상

다음 규칙들은 `.mdc`로 전환을 고려할 수 있습니다:

1. **파일 명명 규칙** (`file-naming.mdc`)
   - 케밥케이스 강제
   - 자동 검증 가능
   - 예: `Dashboard.tsx` → 경고

2. **컴포넌트 구조 규칙** (`component-structure.mdc`)
   - FSD 계층 구조 검증
   - 잘못된 위치에 파일 생성 시 경고

3. **타입 정의 규칙** (`type-definitions.mdc`)
   - 타입 파일 위치 규칙
   - 타입 네이밍 컨벤션

### 권장 사항

**현재는 `.md` 유지 권장:**
- 대부분의 규칙이 설명/가이드 성격
- 자동 검증이 필요한 규칙이 적음
- `.md` 형식이 더 유연하고 읽기 쉬움

**향후 `.mdc` 도입 시기:**
- Cursor의 `.mdc` 형식이 더 명확해졌을 때
- 자동 검증이 필요한 규칙이 많아졌을 때
- 팀 내 표준이 확립되었을 때

---

## 📁 문서 구조 개선 사항

### 1. 규칙 파일 크기 최적화

**현재 문제:**
- `project-guide.md` (41KB) - 너무 큼
- 한 파일에 너무 많은 내용 포함

**개선 방안:**
```
project-guide.md (개요만)
├── fsd-architecture.md (FSD 구조 상세)
├── ant-design-usage.md (Ant Design 사용법)
├── state-management.md (상태 관리)
└── routing.md (라우팅)
```

### 2. 규칙 우선순위 명시

**개선 방안:**
각 규칙 파일에 우선순위 표시:
```markdown
---
priority: high | medium | low
category: architecture | coding | design
---
```

### 3. 규칙 간 참조 체계

**개선 방안:**
- 상위 규칙에서 하위 규칙 참조
- 관련 규칙 간 링크 연결

### 4. 버전 관리

**개선 방안:**
- 규칙 변경 이력 관리
- 규칙 버전 표시

---

## 🔍 추가 개선 사항

### 1. 인덱스 파일 생성

각 `.cursor/rules/` 디렉토리에 `README.md` 생성:
```markdown
# CMS 프로젝트 규칙

## 핵심 규칙
- [project-guide.md](./project-guide.md) - 프로젝트 전체 가이드
- [component-patterns.md](./component-patterns.md) - 컴포넌트 패턴

## UI/UX 규칙
- [ui-principles.md](./ui-principles.md) - UI 원칙
- [event-handling.md](./event-handling.md) - 이벤트 처리
```

### 2. 규칙 카테고리화

디렉토리 구조로 카테고리 분리:
```
.cursor/rules/
├── architecture/
│   ├── fsd-structure.md
│   └── routing.md
├── coding/
│   ├── file-naming.md
│   └── component-patterns.md
└── design/
    ├── ui-principles.md
    └── color-system.md
```

### 3. 규칙 검증 체크리스트

각 규칙 파일에 검증 체크리스트 추가:
```markdown
## ✅ 체크리스트

- [ ] 파일명이 케밥케이스인가?
- [ ] FSD 계층 구조를 따르는가?
- [ ] 타입이 명확히 정의되었는가?
```

### 4. 예제 코드 포함

규칙에 실제 예제 코드 추가:
```markdown
## ✅ 올바른 예시

\`\`\`typescript
// 올바른 파일명
export function instructor-list.tsx() { ... }
\`\`\`

## ❌ 잘못된 예시

\`\`\`typescript
// 잘못된 파일명
export function InstructorList.tsx() { ... }
\`\`\`
```

---

## 📊 현재 구조 평가

### ✅ 잘 된 점
- 규칙과 문서가 명확히 분리됨
- 프로젝트별 규칙이 독립적으로 관리됨
- 계층적 구조가 잘 되어 있음

### 🔧 개선 필요
- 일부 규칙 파일이 너무 큼 (분할 필요)
- 규칙 간 참조 체계 부족
- 인덱스/목차 부재
- 규칙 우선순위 불명확

---

## 🎯 권장 개선 순서

1. **즉시 개선** (High Priority)
   - 큰 규칙 파일 분할 (`project-guide.md`)
   - 인덱스 파일 생성 (`README.md`)

2. **단기 개선** (Medium Priority)
   - 규칙 카테고리화
   - 규칙 간 참조 체계 구축

3. **장기 개선** (Low Priority)
   - `.mdc` 형식 도입 검토
   - 자동 검증 규칙 추가






