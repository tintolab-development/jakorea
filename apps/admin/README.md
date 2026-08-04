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

## Phase

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | 환경구성 (Vite/antd/라우터/테마/API) | 완료 |
| 2 | 레이아웃·사이드메뉴 셸 | 완료 |
| 3 | 메인 히어로 배너 (목록·등록/수정) | 완료 |
| 4 | 메인 팝업 관리 (목록·등록/수정) | 완료 |
| 5 | 메인 상단 띠배너 관리 | 완료 |
| 6 | 메인 소셜 링크 관리 | 완료 |
| 7 | 메인 콘텐츠 관리 | 완료 |
| 8 | JA Korea 소개 관리 | 완료 |
| 9 | JA Global Value 관리 | 완료 |
| 10 | JA Worldwide 관리 | 완료 |
| 11 | 연혁 관리 | 완료 |
| 12 | 수상 관리 | 완료 |
| 13+ | 인증 → BI → 투명경영 → … | 대기 |

## 구조 (FSD)

```
src/
  app/          # providers, router
  pages/        # 라우트 페이지
  widgets/      # 레이아웃 등
  features/     # 기능 단위
  entities/     # 도메인 엔티티
  shared/       # 토큰, axios, 공통 UI
```
