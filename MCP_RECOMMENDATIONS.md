# MCP 서버 추천 목록 (실제 사용 가능)

JaKorea 모노레포 프로젝트에 실제로 사용 가능한 MCP (Model Context Protocol) 서버 목록입니다.

> ✅ **이 문서는 실제로 존재하고 사용 가능한 MCP 서버만 포함합니다.**

---

## ✅ 실제 존재하는 공식 MCP 서버

### 1. **Filesystem MCP** ⭐ 필수

- **공식 패키지**: `@modelcontextprotocol/server-filesystem`
- **용도**: 파일 시스템 접근 및 조작
- **활용**:
  - 파일 읽기/쓰기
  - 디렉토리 탐색
  - 코드 생성 및 수정
  - 모노레포 구조에서 여러 앱/패키지 파일 동시 관리
- **특징**:
  - 모든 개발 작업의 기반
  - TypeScript/ESLint/Prettier 등은 Filesystem MCP로 파일을 읽고 Cursor 내장 기능 활용
- **설치**: `npm install -g @modelcontextprotocol/server-filesystem`

---

### 2. **Git MCP** ⭐ 권장

- **공식 패키지**: `@modelcontextprotocol/server-git`
- **용도**: Git 작업 자동화
- **활용**:
  - 커밋 메시지 생성
  - 브랜치 관리
  - 변경사항 추적
  - Git 히스토리 분석
- **특징**:
  - Husky와 연동하여 자동화 가능
  - 버전 관리 워크플로우 자동화
- **설치**: `npm install -g @modelcontextprotocol/server-git`

---

### 3. **GitHub MCP** (선택)

- **공식 패키지**: `@modelcontextprotocol/server-github`
- **용도**: GitHub API 연동
- **활용**:
  - PR 생성/관리
  - 이슈 관리
  - 코드 리뷰
  - GitHub Actions 트리거
- **특징**: GitHub 기반 프로젝트에 유용
- **설치**: `npm install -g @modelcontextprotocol/server-github`

---

### 4. **PostgreSQL MCP** (데이터베이스 사용 시)

- **공식 패키지**: `@modelcontextprotocol/server-postgres`
- **용도**: PostgreSQL 데이터베이스 접근
- **활용**:
  - 데이터베이스 쿼리
  - 스키마 관리
  - 데이터 조회/수정
- **특징**: 백엔드 개발 시 유용
- **설치**: `npm install -g @modelcontextprotocol/server-postgres`

---

### 5. **SQLite MCP** (로컬 데이터베이스 사용 시)

- **공식 패키지**: `@modelcontextprotocol/server-sqlite`
- **용도**: SQLite 데이터베이스 접근
- **활용**:
  - 로컬 데이터베이스 관리
  - 테스트 데이터 관리
- **특징**: 개발/테스트 환경에 유용
- **설치**: `npm install -g @modelcontextprotocol/server-sqlite`

---

### 6. **Brave Search MCP** (웹 검색 필요 시)

- **공식 패키지**: `@modelcontextprotocol/server-brave-search`
- **용도**: 웹 검색
- **활용**:
  - 최신 문서 검색
  - 라이브러리 정보 조회
  - 기술 자료 검색
- **특징**: 최신 정보가 필요한 경우 유용
- **설치**: `npm install -g @modelcontextprotocol/server-brave-search`

---

### 7. **Puppeteer MCP** (브라우저 자동화 필요 시)

- **공식 패키지**: `@modelcontextprotocol/server-puppeteer`
- **용도**: 브라우저 자동화
- **활용**:
  - 웹 스크래핑
  - E2E 테스트
  - 스크린샷 생성
- **특징**: 웹 자동화 작업에 유용
- **설치**: `npm install -g @modelcontextprotocol/server-puppeteer`

---

## 💡 존재하지 않는 MCP의 대안

다음 기능들은 공식 MCP가 없지만, **Filesystem MCP + Cursor 내장 기능**으로 대체 가능합니다:

### TypeScript/ESLint/Prettier

- **대안**: Filesystem MCP로 파일 읽기 → Cursor 내장 TypeScript/ESLint/Prettier 기능 활용
- **방법**: 파일을 읽고 Cursor가 자동으로 타입 체크 및 린팅 수행

### React/Zod/Zustand/Ant Design

- **대안**: Filesystem MCP로 기존 코드 읽기 → Cursor가 패턴 학습
- **방법**:
  - `apps/cms/src/` 디렉토리의 기존 코드를 읽어 패턴 학습
  - `.cursor/rules/` 문서 참조하여 일관된 코드 생성

### Turborepo/FSD 아키텍처

- **대안**: Filesystem MCP로 프로젝트 구조 탐색 → `.cursor/rules/` 문서 참조
- **방법**:
  - `turbo.json`, `pnpm-workspace.yaml` 등 설정 파일 읽기
  - `apps/cms/.cursor/rules/architecture/` 문서 참조

### Mock Data/API Spec

- **대안**: Filesystem MCP로 기존 Mock 데이터 및 API 명세 읽기
- **방법**:
  - `apps/cms/src/data/mock/` 디렉토리 읽기
  - `apps/cms/docs/api-spec-mock-*.md` 문서 참조

---

## 🎯 프로젝트별 추천 구성

### CMS 프로젝트 (권장)

1. **Filesystem MCP** ⭐ 필수
   - 모든 파일 작업의 기반
   - FSD 구조 탐색
   - 코드 생성/수정

2. **Git MCP** ⭐ 권장
   - 버전 관리 자동화
   - 커밋 메시지 생성

3. **GitHub MCP** (선택)
   - PR 관리
   - 이슈 추적

### LMS 프로젝트 (권장)

1. **Filesystem MCP** ⭐ 필수
2. **Git MCP** ⭐ 권장
3. **PostgreSQL MCP** (데이터베이스 사용 시)

### Platform 프로젝트 (권장)

1. **Filesystem MCP** ⭐ 필수
2. **Git MCP** ⭐ 권장

---

## 📊 토큰 사용량 최적화

### MCP 활용 시 토큰 절감 효과

**Anthropic 연구 결과**: MCP 활용 시 **최대 98.7% 토큰 절약** 가능

**예시**:

```
MCP 없이 코드 생성:
- 전체 코드 설명: 10,000 토큰
- 코드 생성: 5,000 토큰
- 총: 15,000 토큰

Filesystem MCP 사용:
- 파일 읽기 (MCP 호출): 500 토큰
- 코드 생성: 3,000 토큰 (기존 코드 참조)
- 총: 3,500 토큰 (76% 절감)
```

### 최적화 전략

1. **필요한 MCP만 활성화**
   - 필수: Filesystem MCP
   - 권장: Git MCP
   - 선택: 프로젝트 필요에 따라

2. **MCP 호출 최소화**
   - 캐시 활용
   - 배치 처리
   - 필요한 경우에만 호출

3. **Filesystem MCP 중심 활용**
   - 대부분의 작업은 Filesystem MCP로 가능
   - Cursor 내장 기능과 조합하여 활용

---

## 🚀 설치 및 설정

### 1. Filesystem MCP 설치

```bash
npm install -g @modelcontextprotocol/server-filesystem
```

### 2. Git MCP 설치

```bash
npm install -g @modelcontextprotocol/server-git
```

### 3. Cursor 설정

Cursor 설정 파일에 MCP 서버 추가:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "/path/to/repo"]
    }
  }
}
```

---

## 💡 활용 시나리오

### 시나리오 1: 새 Feature 개발

```
1. Filesystem MCP → 프로젝트 구조 탐색
2. Filesystem MCP → 기존 코드 패턴 읽기
3. Filesystem MCP → 새 파일 생성
4. Git MCP → 변경사항 커밋
```

### 시나리오 2: 코드 리팩토링

```
1. Filesystem MCP → 리팩토링 대상 파일 읽기
2. Filesystem MCP → 관련 파일 탐색
3. Filesystem MCP → 수정된 코드 작성
4. Git MCP → 변경사항 추적 및 커밋
```

### 시나리오 3: 문서 업데이트

```
1. Filesystem MCP → 기존 문서 읽기
2. Filesystem MCP → 문서 업데이트
3. Git MCP → 문서 변경사항 커밋
```

---

## 📚 참고 자료

- [공식 MCP 서버 목록](https://github.com/modelcontextprotocol/servers)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Cursor MCP 설정 가이드](https://docs.cursor.com/mcp)
- [MCP 공식 문서](https://modelcontextprotocol.io/)

---

## 🎓 결론

### 실제 사용 가능한 MCP

- ✅ **Filesystem MCP**: 필수, 모든 작업의 기반
- ✅ **Git MCP**: 권장, 버전 관리 자동화
- ✅ **GitHub MCP**: 선택, GitHub 연동
- ✅ **PostgreSQL/SQLite MCP**: 선택, 데이터베이스 작업
- ✅ **Brave Search MCP**: 선택, 웹 검색
- ✅ **Puppeteer MCP**: 선택, 브라우저 자동화

### 권장 구성

**최소 구성 (필수)**:

- Filesystem MCP

**권장 구성**:

- Filesystem MCP
- Git MCP

**확장 구성 (필요 시)**:

- Filesystem MCP
- Git MCP
- GitHub MCP
- 기타 프로젝트 필요에 따라

### 토큰 사용량

- ⚠️ MCP 서버 수 자체는 토큰에 큰 영향 없음 (활성화만으로는 소비 없음)
- ✅ MCP 활용 시 토큰 절감 (코드 실행 최적화)
- 🎯 최적 전략: Filesystem MCP 중심, 필요한 경우에만 추가 MCP 사용

---

**마지막 업데이트**: 2025-01-20
