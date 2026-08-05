# JAKorea Homepage Admin

사용자 홈페이지(`apps/platform`) 콘텐츠·운영을 위한 어드민 앱입니다.  
기획: [홈페이지 어드민 기능정의서](https://app.notion.com/p/tintolab/399f3e2a77d08095a1dec4e26d9098f9)

디자인 시스템·스택은 **CMS(`apps/cms`)와 동일**합니다 (Ant Design 5 + Pretendard + CMS 토큰 미러).

## 실행

```bash
# 모노레포 루트
pnpm install
pnpm admin
# → http://localhost:3001
```

환경 변수: `.env.example`을 `.env` / `.env.local`로 복사 후 설정.

## 현재 상태

- **LNB·레이아웃 셸** + **상단 GNB**(CMS MainHeader 이식, mock 유저·알림)
- LNB **최대 3뎁스** (시안 기준) — 리프 경로는 Placeholder 라우트만 연결
- 기능 화면: 히어로 배너 관리 등 Phase별 구현
- **디자인 시스템 쇼케이스**: http://localhost:3001/design-system (Layout 밖, 이식된 `shared/ui` 카탈로그)

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | 환경구성 (Vite/antd/라우터/테마/API) | 완료 |
| 2 | 레이아웃·사이드메뉴 셸 | 완료 |
| 2.1 | 상단 GNB (타이틀·알림·계정) | 완료 |
| 2.2 | LNB 3뎁스 구조·라우터 연결 | 완료 |
| 3+ | LNB 화면별 기능 구현 | 진행 중 |

## 구조 (FSD)

```
src/
  app/          # providers, router
  pages/        # 라우트 페이지 (home · placeholder)
  widgets/      # 레이아웃·LNB
  features/     # 기능 단위 (화면 구현 시 추가)
  entities/     # 도메인 엔티티
  shared/       # 토큰, axios, 공통 UI·메뉴 설정
```
