# Cursor prompt — UJAT 프로그램 목록 「진행년도」 옵션 API (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** |
| 관련 API | `GET /api/admin/programs?programType=UJAT&businessYear={year}` (목록, 기존) |
| 신규 요청 | 진행년도 옵션 목록 |
| 대상 화면 | CMS → 프로그램 관리 → **UJAT** 목록 상단 「진행년도」 셀렉트 |
| 프로그램 유형 | `UJAT` (일반·Gemini 재사용 가능하면 `programType` 파라미터로) |
| 우선순위 | **P3** (FE 임시 보정 적용됨) |
| 작성일 | 2026-10-02 |

---

## 한줄

진행년도 옵션을 내려주는 API가 없어 FE가 **불러온 목록 행의 연도**로 옵션을 만든다. 목록이 무한 스크롤(기본 20건)이라 첫 페이지에 없는 연도는 옵션에 안 나온다.

## FE 현황

- 2026-10-02 이전: 연도 필터 결과에서 옵션 생성 → 2026 조회 시 2025 옵션이 사라짐
- 현재(임시 보정): 「전체」 조회 캐시 + 현재 조회 연도로 옵션 생성 → 사라지는 문제는 해소, **첫 페이지 밖 연도 누락**은 남음
- 옵션 연도는 `startDate`의 연도, 조회 파라미터는 `businessYear` → 둘이 다를 수 있음

## 요구사항

`GET /api/admin/programs/business-years?programType=UJAT`

- 권한: `PROGRAM_READ` (목록과 동일)
- 응답: 삭제되지 않은 해당 유형 프로그램의 `business_year` distinct, **내림차순**

```json
{ "success": true, "data": { "years": [2026, 2025, 2024] } }
```

- `business_year`가 null인 프로그램은 제외
- 목록 `businessYear` 필터와 같은 기준 컬럼이어야 함 (옵션에서 고른 연도로 조회 시 0건이 나오지 않게)

## 검증

- [ ] 2개 이상 연도의 UJAT 프로그램이 있을 때 모두 반환
- [ ] 반환된 연도로 `GET /api/admin/programs?programType=UJAT&businessYear=…` 조회 시 1건 이상
- [ ] 다른 `programType` 프로그램 연도는 섞이지 않음
- [ ] OpenAPI 노출

## FE 참고

- 화면: `apps/cms/src/pages/programs/UJAT/page.tsx` (`progressYearFieldOptions`) — BE 반영 시 옵션을 신규 API로 교체, 「전체」 캐시 기반 보정 제거
- 목록 파라미터: `apps/cms/src/features/program/ujat/api/list-params.ts`
