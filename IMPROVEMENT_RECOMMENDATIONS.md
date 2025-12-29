# 프로젝트 구조 개선 권장 사항

## 📋 현재 구조 분석

### ✅ 잘 구성된 부분
1. **규칙과 문서 분리**: `.cursor/rules/`와 `docs/` 명확히 분리
2. **프로젝트별 독립성**: 각 프로젝트가 독립적인 규칙 보유
3. **계층적 구조**: 모노레포 공통 → 프로젝트별 규칙

### 🔧 개선이 필요한 부분

#### 1. 규칙 파일 크기 문제
- `project-guide.md` (41KB) - 너무 커서 AI가 전체를 참조하기 어려움
- 한 파일에 너무 많은 주제 포함

#### 2. 규칙 간 참조 부족
- 관련 규칙 간 연결이 없음
- 상위 규칙에서 하위 규칙 참조 부재

#### 3. 인덱스/목차 부재
- 어떤 규칙이 있는지 한눈에 파악 어려움
- 규칙 탐색이 비효율적

#### 4. 규칙 우선순위 불명확
- 모든 규칙이 동일한 중요도로 처리됨
- 핵심 규칙과 참고 규칙 구분 없음

---

## 🎯 구체적 개선 사항

### 1. 규칙 파일 분할 (High Priority)

**현재:**
```
project-guide.md (41KB)
├── 코드 스타일
├── FSD 구조
├── Ant Design
├── 상태 관리
├── 라우팅
└── ... (14개 섹션)
```

**개선 후:**
```
.cursor/rules/
├── README.md (인덱스)
├── project-overview.md (개요)
├── architecture/
│   ├── fsd-structure.md
│   └── routing.md
├── coding/
│   ├── code-style.md
│   ├── file-naming.md
│   └── component-patterns.md
├── libraries/
│   ├── ant-design-usage.md
│   └── required-libraries.md
└── state/
    └── state-management.md
```

**장점:**
- AI가 필요한 규칙만 선택적으로 참조
- 파일 크기 최적화 (각 5-10KB)
- 유지보수 용이

### 2. 인덱스 파일 생성 (High Priority)

**각 `.cursor/rules/` 디렉토리에 `README.md` 추가:**

```markdown
# CMS 프로젝트 규칙

## 🎯 핵심 규칙 (필수 읽기)
- [프로젝트 개요](./project-overview.md) - 프로젝트 전체 이해
- [FSD 구조](./architecture/fsd-structure.md) - 아키텍처 기반

## 📐 아키텍처
- [FSD 구조](./architecture/fsd-structure.md)
- [라우팅](./architecture/routing.md)

## 💻 코딩 표준
- [코드 스타일](./coding/code-style.md)
- [파일 명명](./coding/file-naming.md)
- [컴포넌트 패턴](./coding/component-patterns.md)

## 🎨 UI/UX
- [UI 원칙](./design/ui-principles.md)
- [이벤트 처리](./design/event-handling.md)
- [색상 시스템](./design/color-system.md)
```

### 3. 규칙 카테고리화 (Medium Priority)

**디렉토리 구조로 분류:**

```
.cursor/rules/
├── README.md
├── architecture/      # 아키텍처 관련
├── coding/            # 코딩 표준
├── design/            # 디자인/UI
├── api/               # API 관련
└── libraries/         # 라이브러리 사용법
```

### 4. 규칙 우선순위 표시 (Medium Priority)

**각 규칙 파일에 frontmatter 추가:**

```markdown
---
priority: high | medium | low
category: architecture | coding | design
last_updated: 2024-12-29
---

# 규칙 제목
```

### 5. 규칙 간 참조 체계 (Low Priority)

**상위 규칙에서 하위 규칙 참조:**

```markdown
## 컴포넌트 작성 시 참고
- [컴포넌트 패턴](./coding/component-patterns.md)
- [이벤트 처리](./design/event-handling.md)
- [파일 명명 규칙](./coding/file-naming.md)
```

---

## 📊 .md vs .mdc 사용 기준

### `.md` (Markdown) - 현재 사용 중

**사용 시기:**
- ✅ 설명/가이드 성격의 규칙
- ✅ 참고 문서
- ✅ 사람이 읽기 쉬운 문서
- ✅ 버전 관리가 중요한 문서

**현재 프로젝트의 모든 규칙이 `.md` 형식이 적합함**

### `.mdc` (Cursor Markdown) - 향후 검토

**사용 시기 (가능성):**
- ✅ 자동 검증이 필요한 규칙
- ✅ 코드 생성 시 직접 실행되는 규칙
- ✅ 구조화된 형식이 필요한 규칙

**현재는 도입 불필요:**
- 대부분의 규칙이 설명/가이드 성격
- `.md` 형식으로 충분히 효과적
- Cursor의 `.mdc` 형식이 아직 명확하지 않음

**향후 도입 고려:**
- Cursor의 `.mdc` 형식이 더 명확해졌을 때
- 자동 검증이 필요한 규칙이 많아졌을 때
- 팀 내 표준이 확립되었을 때

---

## 🚀 개선 실행 계획

### Phase 1: 즉시 개선 (1-2일)
1. ✅ `project-guide.md` 분할
2. ✅ 인덱스 파일 생성
3. ✅ 규칙 카테고리화

### Phase 2: 단기 개선 (1주)
1. 규칙 우선순위 표시
2. 규칙 간 참조 체계 구축
3. 예제 코드 추가

### Phase 3: 장기 개선 (필요 시)
1. `.mdc` 형식 도입 검토
2. 자동 검증 규칙 추가
3. 규칙 버전 관리

---

## 💡 추가 권장 사항

### 1. 규칙 검증 체크리스트
각 규칙 파일에 체크리스트 추가하여 준수 여부 확인

### 2. 규칙 변경 이력
규칙 변경 시 이력 관리 (Git 히스토리 활용)

### 3. 규칙 리뷰 주기
정기적으로 규칙 검토 및 업데이트 (분기별)

### 4. 규칙 사용 통계
어떤 규칙이 자주 참조되는지 추적 (향후)

---

## 📝 결론

**현재 구조는 잘 되어 있으나, 다음 개선으로 효율성 향상 가능:**

1. **규칙 파일 분할** - AI 참조 효율성 ↑
2. **인덱스 파일** - 규칙 탐색 용이성 ↑
3. **카테고리화** - 구조 명확성 ↑
4. **우선순위 표시** - 중요도 구분 ↑

**`.md` 형식 유지 권장:**
- 현재 모든 규칙이 `.md` 형식으로 적합
- `.mdc` 도입은 향후 검토 사항


