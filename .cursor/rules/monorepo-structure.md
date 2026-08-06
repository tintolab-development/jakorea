# 모노레포 구조

Turborepo + pnpm 기반의 JaKorea 모노레포입니다.

## 📁 프로젝트 구조

```
jakorea/
├── apps/              # 애플리케이션
│   ├── admin/         # 관리 콘솔
│   ├── cms/           # CMS (Automation)
│   ├── lms/           # 학습 관리 시스템
│   └── platform/      # 사용자용 플랫폼
├── packages/           # 공유 패키지
│   ├── ui/            # 공유 UI 컴포넌트
│   └── utils/          # 공유 유틸리티
└── .cursor/
    └── rules/          # 모노레포 공통 규칙
```

## 🛠 기술 스택

- **Node.js**: 18 이상
- **pnpm**: 9.12.3 (packageManager로 고정)
- **Turborepo**: 모노레포 빌드 시스템
- **Vite**: 빌드 도구
- **React**: UI 라이브러리
- **TypeScript**: 타입 안정성

## 📦 패키지 관리

### 설치
```bash
pnpm install
```

### 워크스페이스별 실행
```bash
# CMS 개발 서버
pnpm --filter cms dev

# LMS 개발 서버
pnpm --filter lms dev

# Admin 개발 서버
pnpm --filter admin dev

# Platform 개발 서버
pnpm --filter platform dev
```

### 공통 스크립트
```bash
pnpm dev          # 모든 앱 watch 모드
pnpm build        # 모든 앱 빌드
pnpm lint         # ESLint 검사
pnpm typecheck    # TypeScript 타입 검사
pnpm format       # Prettier 포맷팅
```

## 🔗 공유 패키지

- `@jakorea/ui`: 공유 UI 컴포넌트
- `@jakorea/utils`: 공유 유틸리티 함수

## 📝 규칙 구조

| 위치 | 역할 |
|------|------|
| `.cursor/rules/` | 모노레포 공통 |
| **`.cursor/rules/cms-admin-ui/`** | **CMS · Admin 공유 UI SSOT** (필터 치수·URL 동기화 의도·테이블 셸 등) |
| `apps/cms/.cursor/rules/` | CMS 전용 (스택·도메인 process/*) |
| `apps/admin/.cursor/rules/` | Admin 전용 (스택 어댑터 · CMS import 금지) |
| `apps/lms/.cursor/rules/` | LMS 전용 |

공유 UI 스펙 변경 시 **cms-admin-ui 폴더만** 수정하고, 앱 룰은 구현 path·훅 이름(어댑터)만 유지한다.

인덱스: [cms-admin-ui/README.md](./cms-admin-ui/README.md)







