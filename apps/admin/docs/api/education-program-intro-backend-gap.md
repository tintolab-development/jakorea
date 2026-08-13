# 교육 소개 · 프로그램 소개 — BE write API 갭

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **FE 화면** | `/education/programs` (`education-program-intro`) |
| **현재 FE** | localStorage mock — 탭(진로·취업 / 경제·금융 / 디지털 리터러시) × 프로그램 슬롯 편집 |
| **현재 BE** | `GET /api/admin/education/programs` 만 존재 (CMS `public.program` **읽기 전용**) |

## 왜 remote 미연동인가

OpenAPI Priority 07에는 카테고리별 `mainText`·프로그램 유형·대표 프로그램·스폰서·이미지 슬롯을 **저장하는 Admin write API가 없습니다.**  
Homepage는 CMS 프로그램 목록을 SELECT만 하며, FE mock 스키마와 1:1로 매핑할 엔드포인트가 없습니다.

## FE mock 스키마 (write 필요 시 참고)

`ProgramIntroCategoryDocument` / `ProgramIntroSaveInput`:

- `categoryKey`: `career` | `economy` | `digital`
- `mainText`
- `programs[]` (슬롯 3 고정): `programType`, `typeDescription`, `images[]`, `representativeProgram`, `sponsorName`, `representativeDescription`

## 로컬 CMS 프로그램 시드 (읽기 전용 QA)

메인 콘텐츠·프로그램 프리뷰용:

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_public_program_local.sql
```

→ `public.program` id 9001–9005 stub (`JAHOMEADMINBACK/scripts/seed_public_program_local.sql`)

## 후속

프로그램 소개 편집을 Admin에서 영속화하려면 BE에 전용 설정 테이블 + `GET/PUT` (또는 CMS 연동 write) 스펙이 필요합니다.  
스펙 확정 후 별도 phase로 FE remote 전환.

**Last updated:** 2026-08-13
