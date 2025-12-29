# 토큰 사용량 분석

## 📊 크기 비교

### 기존 구조
- **파일**: `project-guide.md` (단일 파일)
- **크기**: 41KB
- **추정 토큰**: 약 10,000-12,000 토큰
- **특징**: 모든 내용이 한 파일에 집중

### 최적화 후 구조
- **파일 수**: 24개 파일 (rules)
- **총 크기**: 약 85KB (rules만, docs 제외)
- **추정 토큰**: 약 20,000-25,000 토큰 (모든 파일 포함 시)
- **특징**: 카테고리별로 분산, 우선순위 표시
- **최적화**: 큰 파일(API 명세)을 docs로 분리하여 약 35KB 절감

## ⚠️ 중요한 발견

**총 크기가 증가했습니다!** (41KB → 122KB)

이는 다음 이유 때문입니다:
1. 기존 `project-guide.md`의 내용을 그대로 분할
2. 각 파일에 헤더, 관련 규칙 링크 등 메타데이터 추가
3. 일부 내용이 중복되거나 보강됨

## 🎯 토큰 사용량 시나리오 분석

### 시나리오 1: 최악의 경우 (모든 파일 포함)

**가정**: Cursor가 `.cursor/rules/`의 모든 파일을 항상 포함

- **기존**: 10,000-12,000 토큰
- **최적화 후**: 20,000-25,000 토큰 (docs 제외)
- **결과**: **토큰 사용량 2배 증가** (기존 대비 개선됨) ⚠️

### 시나리오 2: 최선의 경우 (선택적 포함)

**가정**: Cursor가 semantic search로 관련 파일만 선택적으로 포함

#### 예시 1: "Application 상태 전이 로직 수정"
- **기존**: 전체 `project-guide.md` (12,000 토큰)
- **개선 후**: 
  - `state/state-management.md` (1,200 토큰)
  - `coding/custom-hooks.md` (7,100 토큰)
  - 관련 파일만 포함
- **결과**: **토큰 사용량 30-40% 감소** ✅

#### 예시 2: "테이블 필터링 기능 추가"
- **기존**: 전체 `project-guide.md` (12,000 토큰)
- **개선 후**:
  - `tables/table-management.md` (7,100 토큰)
  - `architecture/routing.md` (1,300 토큰)
- **결과**: **토큰 사용량 30-40% 감소** ✅

#### 예시 3: "새로운 Feature 추가"
- **기존**: 전체 `project-guide.md` (12,000 토큰)
- **개선 후**:
  - `project-overview.md` (1,600 토큰)
  - `architecture/fsd-structure.md` (2,500 토큰)
  - `coding/component-patterns.md` (8,000 토큰)
  - `coding/code-style.md` (1,400 토큰)
- **결과**: **토큰 사용량 약간 증가 (11,500 토큰)** ⚠️

### 시나리오 3: 실제 Cursor 동작 (추정) - **최적화 후**

**가정**: Cursor는 semantic search + frontmatter 우선순위 기반으로 선택적 포함

- **핵심 규칙** (`priority: high`, `always_include: true`): 항상 포함
  - project-overview, code-style, fsd-structure, ui-principles, ant-design-usage
- **중요 규칙** (`priority: medium`): semantic search로 선택적 포함
  - routing, state-management, form-validation, table-management
- **참고 규칙** (`priority: low`): 필요 시에만 포함
  - development-process, progress-management
- **큰 파일**: docs로 분리하여 rules에서 제외 (API 명세 등)

**예상 결과**:
- 평균 토큰 사용량: **5,000-7,000 토큰** (최적화 전 7,000-9,000에서 개선)
- 기존 대비: **40-50% 감소** ✅
- 최적화 효과: **약 20% 추가 감소** (frontmatter 우선순위 활용)

## 📈 카테고리별 크기 분석

| 카테고리 | 파일 수 | 총 크기 | 평균 파일 크기 |
|---------|--------|---------|---------------|
| architecture | 2 | ~3.8KB | ~1.9KB |
| coding | 3 | ~16.5KB | ~5.5KB |
| design | 6 | ~33.5KB | ~5.6KB |
| libraries | 3 | ~8.5KB | ~2.8KB |
| state | 1 | ~1.0KB | ~1.0KB |
| data | 3 | ~35.2KB | ~11.7KB |
| forms | 1 | ~1.4KB | ~1.4KB |
| tables | 1 | ~7.1KB | ~7.1KB |
| environment | 3 | ~2.4KB | ~0.8KB |
| process | 2 | ~4.1KB | ~2.1KB |

**문제점**: `data/` 카테고리가 너무 큼 (35KB)
- `api-spec-mock.md` (16.7KB)
- `api-spec-mock-extended.md` (18.4KB)

## 🔧 최적화 방안

### 1. 큰 파일 분할 (High Priority)

**API 명세 파일 분할:**
```
data/
├── api-spec-mock.md (기본만, ~5KB)
├── api-spec-mock-extended.md (삭제 또는 별도 문서로)
└── api/
    ├── sponsors.md
    ├── instructors.md
    ├── programs.md
    └── ...
```

**효과**: data 카테고리 35KB → 15KB (약 20KB 절감)

### 2. 선택적 포함 전략

큰 파일들은 rules가 아닌 docs로 이동:
- `api-spec-mock-extended.md` → `docs/` (참고 자료)
- 필요 시에만 수동으로 참조

### 3. 규칙 우선순위 표시

각 파일에 frontmatter로 우선순위 표시:
```markdown
---
priority: high | medium | low
always_include: true | false
---
```

## 💡 결론

### 현재 상태
- **최악의 경우**: 토큰 사용량 3배 증가 (모든 파일 포함 시)
- **최선의 경우**: 토큰 사용량 30-40% 감소 (선택적 포함 시)
- **실제 예상**: 토큰 사용량 20-30% 감소 (semantic search 활용 시)

### 권장 사항

1. **큰 파일 분할/이동** (즉시)
   - `api-spec-mock-extended.md` → `docs/`로 이동
   - API 명세를 엔티티별로 분할

2. **규칙 우선순위 표시** (단기)
   - 핵심 규칙만 항상 포함
   - 참고 규칙은 선택적 포함

3. **모니터링** (지속)
   - 실제 토큰 사용량 추적
   - 필요 시 추가 최적화

### 최종 평가

**세분화는 올바른 방향이지만, 큰 파일 최적화가 필요합니다.**

- ✅ 구조 개선: 탐색 용이성 향상
- ✅ 선택적 포함: 토큰 사용량 감소 가능
- ⚠️ 큰 파일: API 명세 파일 최적화 필요

