---
priority: high
always_include: true
category: overview
---

# CMS 프로젝트 개요

JAKorea CMS (Automation) 프로젝트 개발 가이드입니다.

## 📋 프로젝트 소개

CMS 프로젝트는 교육 프로그램 운영, 매칭, 정산을 통합 관리하는 시스템입니다.

## 🎯 핵심 원칙

- **Feature-Sliced Design (FSD)** 아키텍처 적용
- **Ant Design 5** 기반 UI 컴포넌트
- **TypeScript** 엄격한 타입 체크
- **Zustand** 상태 관리
- **React Hook Form + Zod** 폼 검증

## 📚 규칙 구조

이 디렉토리의 규칙은 카테고리별로 분류되어 있습니다:

- **[아키텍처](./architecture/)** - FSD 구조, 라우팅
- **[코딩 표준](./coding/)** - 코드 스타일, 컴포넌트 패턴, Custom Hooks
- **[라이브러리](./libraries/)** - Ant Design, 공유 패키지, 필수 라이브러리
- **[상태 관리](./state/)** - Zustand 사용법
- **[데이터](./data/)** - Mock 데이터 관리
- **[폼](./forms/)** - 폼 검증
- **[테이블](./tables/)** - 테이블 관리 및 필터링
- **[환경](./environment/)** - 브라우저 지원, 패키지 관리, 기술 스택
- **[프로세스](./process/)** - 개발 프로세스, 진행 상황 관리

## 🚀 빠른 시작

### 개발 서버 실행

```bash
pnpm --filter cms dev
```

### 빌드

```bash
pnpm --filter cms build
```

### 타입 체크

```bash
pnpm --filter cms typecheck
```

### 린트

```bash
pnpm --filter cms lint
```

## 🔗 관련 문서

- [진행 상황](../../PROGRESS.md)
- [Phase 브리핑](../../PHASE_1_BRIEFING.md)
- [기획 요청사항](../../PLANNING_REQUESTS.md)

---

**마지막 업데이트**: 2024년

