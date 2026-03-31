# ADMIN 미사용 컴포넌트 정리 우선순위

기준 문서: [admin-unused-components.md](./admin-unused-components.md)

- 전체 미사용 후보: **86개**
- 분류 목적: 삭제/리팩토링 실행 순서 결정

---

## P0 (즉시 정리 권장, 5개)

정적 도달 기준 미사용 + `@/` 별칭 미참조이며, 상대 경로 묶임 가능성도 낮은 항목.

- `features/application/lib/application-helpers.tsx`
- `features/permission-request/ui/permission-request-review-modal.tsx`
- `shared/components/interview-status-badge.tsx`
- `shared/components/permission-button.tsx`
- `shared/components/program-lifecycle-status-cell.tsx`

---

## P1 (검증 후 정리, 6개)

`@/` 별칭 미참조이지만, 현재 코드상 **상대 경로로 묶여 있을 가능성이 높은** school/teacher 세트.
즉시 삭제보다 “연결 경로 확인 -> 실제 사용 여부 확정 -> 일괄 정리” 순서 권장.

- `features/school/ui/settlement-detail-modal.tsx`
- `features/school/ui/teacher-basic-info-tab.tsx`
- `features/school/ui/teacher-detail-modal.tsx`
- `features/school/ui/teacher-resume-tab.tsx`
- `features/school/ui/teacher-settlement-tab.tsx`
- `features/school/ui/teacher-teaching-history-tab.tsx`

---

## P2 (후순위 백로그, 75개)

미사용 후보이지만, 라우터 동적 import/향후 오픈 가능성/역할별 페이지 맥락 때문에
즉시 삭제 리스크가 상대적으로 큰 항목들.

- `features/auth` 1개
- `features/certificate-template` 3개
- `features/education-record` 1개
- `features/instructor` 3개
- `features/program` 1개
- `features/school` 3개 (P1 제외 나머지)
- `features/settlement` 4개
- `features/sponsor` 3개
- `features/template` 9개
- `pages/*` 계열 다수 (관리/마이페이지/게시판/정산/템플릿 등)
- `shared/components` 2개 (`program-category-badge`, `session-format-badge`)

상세 파일 목록은 [admin-unused-components.md](./admin-unused-components.md) 본문을 기준으로 관리합니다.

---

## 실행 순서 제안

1. **P0 일괄 제거 PR** (작은 단위, 빠른 회수)
2. **P1 묶음 검증 PR** (school detail 흐름 실제 진입 경로 확인 후 정리)
3. **P2는 도메인별 분할 정리** (예: templates -> sponsors -> notices 순)

검증 기본:

- 타입체크: `cd apps/cms && pnpm exec tsc -p tsconfig.app.json --noEmit`
- 라우터 주요 경로 수동 확인: `/programs/*`, `/instructor/*`, `/templates/*`, `/admin/*`
