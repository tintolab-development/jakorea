# CMS 프로그램 관리 — 더미 시드 생성용 백엔드 전달 패키지

JaKorea **CMS 프로그램 관리** 화면을 FE mock과 동일하게 검증할 수 있도록,  
**이미 존재하는 FE mock 데이터**를 기준으로 스테이징/로컬 DB 더미를 만들어 달라는 요청 묶음입니다.

백엔드는 monorepo를 보지 않아도 됩니다. **이 폴더 전체를 zip** 해서 전달하면 됩니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **목적** | FE mock → BE 더미 시드 생성 |
| **범위** | 일반 · 1사1교 · UJAT · 교육받은 교사 · Gemini · 하위(신청/진행) 행 |
| **압축** | 폴더 `be-handoff-program-dummy-seeds/` 를 zip |

---

## 읽는 순서 (권장)

| 순서 | 파일 | 역할 |
|------|------|------|
| **1** | [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md) | **필수** · FE mock id ↔ BE 시드 id · 공통 규칙 · title 접두어 |
| **2** | [`programs-seed-case-api-coverage-backend-handoff-2026-07-30.md`](./programs-seed-case-api-coverage-backend-handoff-2026-07-30.md) | **필수** · 카테고리/CASE별 API 적용률 · **아직 더미인 갭** |
| **3** | 유형별 시드 레시피 (아래) | **구현용** · CASE별 필드·JSON |
| **4** | [`05-nested-child-data-dummy-seed.md`](./05-nested-child-data-dummy-seed.md) | 신청·참여자·출석 등 **하위 행** |
| **5** | [`programs-api-backend-gaps-consolidated.md`](./programs-api-backend-gaps-consolidated.md) | (참고) API path 부재·계약 미비 — 시드만으로는 안 열리는 화면 |

### 유형별 시드 레시피

| 파일 | 대상 | FE mock SSOT |
|------|------|----------------|
| [`01-general-program-dummy-seed.md`](./01-general-program-dummy-seed.md) | 일반 CASE | `general-programs.ts` |
| [`02-company-school-dummy-seed.md`](./02-company-school-dummy-seed.md) | 1사1교 | `economy-programs.ts` |
| [`03-ujat-program-dummy-seed.md`](./03-ujat-program-dummy-seed.md) | UJAT | `ujat-programs-list-mock.ts` 등 |
| [`04-trained-teachers-dummy-seed.md`](./04-trained-teachers-dummy-seed.md) | 교육받은 교사 | `trained-teachers-programs.ts` |
| [`06-gemini-dummy-seed.md`](./06-gemini-dummy-seed.md) | Gemini 모집·승인·실적 | `gemini/model/*/mock.ts` |

---

## 한 줄 요청 (BE용)

> FE CMS mock에 이미 있는 프로그램·신청·진행 케이스를 **동일 분기·동일 화면**이 열리도록 스테이징에 시드해 주세요.  
> 우선순위는 각 문서의 **P0 → P1 → P2** 입니다.  
> 시드만으로 부족한 **API mutation 갭**은 `programs-seed-case-api-coverage-…` §3·§4 및 `programs-api-backend-gaps-consolidated` 를 참고하세요.

---

## 금지 (공통)

- E2E 전용 title(`[수정 가능] …`)과 충돌·덮어쓰기 금지
- 유형 간 시드 복제 금지 (일반 8종 매트릭스를 1사1교/UJAT에 그대로 넣지 말 것)
- 1사1교에 **봉사자·합반·과제** 시드 금지
- UJAT에서 일반 「강사」 용어/리소스를 그대로 쓰지 말 것 (봉사자 = 강사)

---

## zip 만드는 법 (FE)

```bash
cd apps/cms/docs/api
zip -r be-handoff-program-dummy-seeds-2026-07-30.zip be-handoff-program-dummy-seeds
```

전달물: `be-handoff-program-dummy-seeds-2026-07-30.zip` 하나만내면 됩니다.

**Last updated:** 2026-07-30
