---
priority: high
always_include: true
category: architecture
---

# FSD 아키텍처 구조

Feature-Sliced Design (FSD) 아키텍처를 적용합니다.

## 디렉토리 구조

```
src/
├── app/              # 앱 초기화, 라우팅, 프로바이더
│   ├── providers/    # 전역 프로바이더 (ConfigProvider 등)
│   └── router/       # 라우팅 설정
├── widgets/          # 복합 UI 블록 (레이아웃, 헤더, 사이드바 등)
│   └── layout/       # 레이아웃 위젯
├── features/         # 비즈니스 기능 단위
│   ├── instructor/   # 강사 관리 기능
│   │   ├── ui/       # UI 컴포넌트
│   │   ├── model/    # 상태 관리 (Zustand)
│   │   ├── api/      # API 호출 (Mock 서비스)
│   │   └── lib/      # 유틸리티 함수
│   ├── program/      # 프로그램 관리 기능
│   ├── application/  # 신청 관리 기능
│   └── ...
├── entities/         # 비즈니스 엔티티 (도메인 모델)
│   ├── instructor/   # 강사 엔티티
│   │   ├── model/    # 타입 정의
│   │   └── api/      # 엔티티별 API
│   └── ...
├── shared/           # 공유 리소스
│   ├── ui/           # 공통 UI 컴포넌트
│   ├── lib/          # 유틸리티 함수
│   ├── hooks/        # 공통 훅
│   └── constants/    # 상수
└── pages/            # 페이지 컴포넌트 (라우트별)
    ├── Dashboard.tsx
    ├── instructors/
    └── ...
```

## 계층별 책임

### app
- 앱 초기화, 전역 설정, 라우팅
- 프로바이더 설정 (ConfigProvider 등)

### widgets
- 복합 UI 블록 (레이아웃, 헤더 등)
- 여러 Feature를 조합한 복합 컴포넌트

### features
- 비즈니스 기능 단위 (CRUD, 필터링 등)
- 각 Feature는 독립적으로 동작 가능

### entities
- 도메인 엔티티 (타입, API)
- 비즈니스 로직과 무관한 순수 데이터 모델

### shared
- 재사용 가능한 공통 리소스
- 프로젝트 전반에서 사용되는 유틸리티

### pages
- 라우트별 페이지 컴포넌트
- Feature와 Widget을 조합하여 페이지 구성

## 컴포넌트 구조 원칙

- 컴포넌트는 기능(Feature) 단위로 묶습니다.
- 레이아웃/틀은 `features/*/ui`에서 정의합니다.
- 공통 컴포넌트는 `shared/ui`에 배치합니다.

## 관련 규칙

- [라우팅](./routing.md)
- [컴포넌트 패턴](../coding/component-patterns.md)

