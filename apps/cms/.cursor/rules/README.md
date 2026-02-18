# CMS 프로젝트 규칙

JAKorea CMS (Automation) 프로젝트 개발 규칙입니다.

## 🎯 핵심 규칙 (필수 읽기)

- [프로젝트 개요](./project-overview.md) - 프로젝트 전체 이해
- [FSD 구조](./architecture/fsd-structure.md) - 아키텍처 기반

## 📐 아키텍처

- [FSD 구조](./architecture/fsd-structure.md) - Feature-Sliced Design 아키텍처
- [라우팅](./architecture/routing.md) - React Router 설정 및 라우트 네이밍

## 💻 코딩 표준

- [코드 스타일](./coding/code-style.md) - ESLint, Prettier, TypeScript, 파일 명명 규칙
- [컴포넌트 패턴](./coding/component-patterns.md) - 컴포넌트 관심사 분리 및 패턴
- [Custom Hooks](./coding/custom-hooks.md) - Custom Hooks 작성 가이드
- [타입 안전성 및 일관성](./coding/type-safety-and-consistency.md) - Deprecated 코드 사용 금지, 타입 일관성 유지
- [리팩토링 원칙](./coding/refactoring-principles.md) - 코드 품질 원칙

## 🎨 UI/UX

- [UI 원칙](./design/ui-principles.md) - 상태 표시 원칙 등
- [이벤트 처리](./design/event-handling.md) - 이벤트 버블링 및 전파 방지
- [색상 시스템](./design/color-system.md) - 색상 시스템 가이드
- [색상 팔레트](./design/color-palette.md) - 색상 팔레트
- [스타일링 토큰](./design/styling-tokens.md) - CSS 디자인 토큰 사용 규칙
- [캘린더 UX](./design/schedule-calendar-ux.md) - 캘린더 UX 가이드
- [디자인 요청](./design/design-requests.md) - 디자인 요청사항

## 📚 라이브러리

- [Ant Design 사용법](./libraries/ant-design-usage.md) - Ant Design 기본 사용법
- [공유 패키지](./libraries/shared-packages.md) - @jakorea/ui, @jakorea/utils
- [필수 라이브러리](./libraries/required-libraries.md) - 필수 라이브러리 목록

## 🔄 상태 관리

- [상태 관리](./state/state-management.md) - Zustand 사용법

## 📊 데이터

- [Mock 데이터 관리](./data/mock-data.md) - Mock 데이터 구조 및 관리
- [API 명세 (Mock)](./data/api-spec-mock.md) - Mock 기반 API 명세 요약
- [상세 API 명세](../../docs/api-spec-mock-detailed.md) - 상세 API 스펙 (docs)
- [확장 API 명세](../../docs/api-spec-mock-extended.md) - 확장 API 스펙 (docs)

## 📝 폼

- [폼 검증](./forms/form-validation.md) - React Hook Form + Zod

## 📋 테이블

- [테이블 구현 컨텍스트](./tables/table-implementation.md) - Ant Design Table 컬럼·CSS·필터 패턴 (새 테이블 구현 시 참고)
- [테이블 관리](./tables/table-management.md) - @tanstack/react-table 및 Query Parameter 동기화

## 🌐 환경

- [브라우저 지원](./environment/browser-support.md) - 지원 브라우저 및 반응형 디자인
- [패키지 관리](./environment/package-management.md) - pnpm Workspace
- [기술 스택](./environment/tech-stack.md) - 핵심 기술 및 개발 도구

## 🔄 프로세스

- [개발 프로세스](./process/development-process.md) - Phase별 개발 프로세스
- [진행 상황 관리](./process/progress-management.md) - PROGRESS.md 기록 규칙
- [역할별 Persona](./process/persona.md) - 시니어 PM, 기획자, UX/UI 디자이너, 개발자 역할 정의

---

**마지막 업데이트**: 2024년
