# 프로그램관리 E2E — LNB 대메뉴별 테스트 스크립트

CMS Playwright 프로그램 관련 **실행 명령만** LNB 카테고리별로 정리한 목록입니다.  
상세 설명·시드·POM은 [`playwright-flows.md`](./playwright-flows.md)를 보세요.

공통:

```bash
pnpm --filter cms test:e2e:install   # 최초 1회
pnpm --filter cms test:e2e:programs  # 프로그램 flows 전체
```

---

## 공통 (전 카테고리)

| 용도 | 명령 |
|------|------|
| Phase 1 목록·셸 스모크 | `pnpm --filter cms test:e2e:programs:list` |
| UI | `pnpm --filter cms test:e2e:programs:list:ui` |
| headed | `pnpm --filter cms test:e2e:programs:list:headed` |

---

## 일반 프로그램 (`/programs/general`)

| 용도 | 명령 |
|------|------|
| 신규 등록 | `pnpm --filter cms test:e2e:programs:registration` |
| 등록 UI | `pnpm --filter cms test:e2e:programs:registration:ui` |
| 등록 headed | `pnpm --filter cms test:e2e:programs:registration:headed` |
| 수정 | `pnpm --filter cms test:e2e:programs:edit` |
| 수정 UI | `pnpm --filter cms test:e2e:programs:edit:ui` |
| 수정 headed | `pnpm --filter cms test:e2e:programs:edit:headed` |
| 상세 (LNB·신청·진행·설문) | `pnpm --filter cms test:e2e:programs:detail` |
| 상세 UI | `pnpm --filter cms test:e2e:programs:detail:ui` |
| 상세 headed | `pnpm --filter cms test:e2e:programs:detail:headed` |

상세 Phase 단위:

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-variant-lnb.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-applications.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-progress.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-survey-managers.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/detail/general-program-detail-smoke.spec.ts --project=chromium
```

---

## 1사1교 프로그램 (`/programs/company-school`)

| 용도 | 명령 |
|------|------|
| 신규 등록 | `pnpm --filter cms test:e2e:programs:company-school:registration` |
| 등록 UI | `pnpm --filter cms test:e2e:programs:company-school:registration:ui` |
| 등록 headed | `pnpm --filter cms test:e2e:programs:company-school:registration:headed` |
| 수정 | `pnpm --filter cms test:e2e:programs:company-school:edit` |
| 수정 UI | `pnpm --filter cms test:e2e:programs:company-school:edit:ui` |
| 수정 headed | `pnpm --filter cms test:e2e:programs:company-school:edit:headed` |
| Phase 2 상세 smoke · LNB 격리 | `pnpm --filter cms test:e2e:programs:company-school:detail` |
| 상세 UI | `pnpm --filter cms test:e2e:programs:company-school:detail:ui` |
| 상세 headed | `pnpm --filter cms test:e2e:programs:company-school:detail:headed` |

상세 단위:

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/company-school/detail/company-school-detail-smoke.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/company-school/detail/company-school-lnb-isolation.spec.ts --project=chromium
```

---

## UJAT 프로그램

### 프로그램 관리 (`/programs/ujat`)

| 용도 | 명령 |
|------|------|
| Phase 3 신규 등록 | `pnpm --filter cms test:e2e:programs:ujat:registration` |
| 등록 UI | `pnpm --filter cms test:e2e:programs:ujat:registration:ui` |
| 등록 headed | `pnpm --filter cms test:e2e:programs:ujat:registration:headed` |
| Phase 3 상세 smoke (+ Phase 4 전체 폴더) | `pnpm --filter cms test:e2e:programs:ujat:detail` |
| 상세 UI | `pnpm --filter cms test:e2e:programs:ujat:detail:ui` |
| 상세 headed | `pnpm --filter cms test:e2e:programs:ujat:detail:headed` |
| Phase 4 심화만 | `pnpm --filter cms test:e2e:programs:ujat:detail:deep` |
| 심화 UI | `pnpm --filter cms test:e2e:programs:ujat:detail:deep:ui` |
| 심화 headed | `pnpm --filter cms test:e2e:programs:ujat:detail:deep:headed` |
| 상세 수정 | `pnpm --filter cms test:e2e:programs:ujat:edit` |
| 수정 UI | `pnpm --filter cms test:e2e:programs:ujat:edit:ui` |
| 수정 headed | `pnpm --filter cms test:e2e:programs:ujat:edit:headed` |

상세 심화 단위:

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/ujat/detail/ujat-program-volunteer-screening.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/ujat/detail/ujat-program-education-progress.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/ujat/detail/ujat-program-survey-managers.spec.ts --project=chromium
```

### 교육 지역 관리 (`/programs/ujat/regions`)

| 용도 | 명령 |
|------|------|
| CRUD | `pnpm --filter cms test:e2e:programs:ujat:regions` |
| CRUD UI | `pnpm --filter cms test:e2e:programs:ujat:regions:ui` |
| CRUD headed | `pnpm --filter cms test:e2e:programs:ujat:regions:headed` |

---

## Gemini 프로그램

### 찾아가는 연수 (`/programs/gemini/visiting-training`)

| 용도 | 명령 |
|------|------|
| Phase 5 전체 | `pnpm --filter cms test:e2e:programs:gemini:visiting` |
| UI | `pnpm --filter cms test:e2e:programs:gemini:visiting:ui` |
| headed | `pnpm --filter cms test:e2e:programs:gemini:visiting:headed` |

단위:

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/gemini/visiting-training/list-tabs-smoke.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/gemini/visiting-training/recruitment-detail-smoke.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/gemini/visiting-training/approved-detail-smoke.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/gemini/visiting-training/lnb-isolation.spec.ts --project=chromium
```

### 실적 관리 (`/programs/gemini/performance`)

| 용도 | 명령 |
|------|------|
| Phase 6 전체 | `pnpm --filter cms test:e2e:programs:gemini:performance` |
| UI | `pnpm --filter cms test:e2e:programs:gemini:performance:ui` |
| headed | `pnpm --filter cms test:e2e:programs:gemini:performance:headed` |

단위:

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/gemini/performance/list-smoke.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/gemini/performance/filter-smoke.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/gemini/performance/isolation.spec.ts --project=chromium
```

---

## 교육받은 교사 프로그램 (`/programs/trained-teachers`)

| 용도 | 명령 |
|------|------|
| Phase 7 전체 | `pnpm --filter cms test:e2e:programs:trained-teachers` |
| UI | `pnpm --filter cms test:e2e:programs:trained-teachers:ui` |
| headed | `pnpm --filter cms test:e2e:programs:trained-teachers:headed` |
| Phase 8 심화만 | `pnpm --filter cms test:e2e:programs:trained-teachers:deep` |
| 심화 UI | `pnpm --filter cms test:e2e:programs:trained-teachers:deep:ui` |
| 심화 headed | `pnpm --filter cms test:e2e:programs:trained-teachers:deep:headed` |

단위:

```bash
pnpm --filter cms exec playwright test tests/e2e/flows/programs/trained-teachers/list-smoke.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/trained-teachers/detail --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/trained-teachers/detail/institution-applications-deep.spec.ts --project=chromium
pnpm --filter cms exec playwright test tests/e2e/flows/programs/trained-teachers/detail/education-journal-progress.spec.ts --project=chromium
```

---

**Last updated:** 2026-07-30
