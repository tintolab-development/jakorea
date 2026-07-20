# 1c-1s (1사1교 / company-school)

경제·금융 교육(economy) 프로그램 전용 코드는 현재 `general/`에 `economy` / `company-school` 분기로 포함되어 있습니다.

## API

- `api/` — 코어 CRUD (gate: `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED`)
- `lib/use-company-school-surface-remote.ts` — 목록 URL 기준 applications/progress/reads 게이트
- 상세 Phase SSOT: `docs/api/programs-company-school-detail-api-conversion-status.md`

## 추후 추출 예정

- `general/ui/table/program-list-filter-fields.ts`의 economy 필터
- `general/ui/constants/program-list-constants.ts`의 economy 옵션
- `general/ui/detail-modal/program-detail-fullpage-modal`의 economy 스타일 분기
