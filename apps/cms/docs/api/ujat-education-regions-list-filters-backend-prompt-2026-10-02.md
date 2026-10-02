# Cursor prompt — UJAT 교육 지역 관리 목록 필터 쿼리 파라미터 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** |
| 주 API | `GET /api/admin/ujat/education-regions` |
| 스키마 | `UjatEducationRegionListResponse` · `UjatEducationRegionResponse` |
| 대상 화면 | CMS → UJAT → **교육 지역 관리** 상단 필터 (사용 여부 · 교육 지역명) |
| 프로그램 유형 | UJAT 만 |
| 우선순위 | **P2** (마스터 데이터라 건수가 적어 FE 보정으로 결과는 정확함) |
| 작성일 | 2026-10-02 |

---

## 한줄

관리자 교육 지역 목록 GET은 현재 `includeInactive`(기본 `true`)만 받는다 (`UjatEducationRegionController.adminRegions`).  
CMS 필터 중 「사용」만 서버에서 거를 수 있고, 「미사용」·교육 지역명은 서버 필터가 없다.

## FE 현황 (이미 반영)

FE는 조회 버튼 클릭 시 아래 쿼리 파라미터를 **이미 전송**한다. 응답에도 같은 필터를 한 번 더 적용하므로 BE 반영 전에도 결과는 정확하다.

| 쿼리 | 타입 | CMS 필터 | 의미 |
|---|---|---|---|
| `includeInactive` | boolean | 사용 여부 | 기존. 「사용」 선택 시 `false`, 「미사용」 선택 시 `true` |
| `activeYn` | boolean | 사용 여부 | **신규**. `true` = 사용만, `false` = 미사용만. 미전송 = `includeInactive` 기준 |
| `keyword` | string | 교육 지역명 | **신규**. 교육 지역명(`name_ko` / `display_name`) 부분 일치, 대소문자 무시. 빈 값·미전송 = 전체 |

## 요구사항

1. `activeYn` · `keyword`를 컨트롤러·OpenAPI에 추가하고 서버에서 필터링한다.
2. `activeYn`이 오면 `includeInactive`보다 우선한다 (`activeYn=false` → `active_yn = false`만).
3. 정렬은 기존과 동일하게 `display_order` 오름차순.
4. 파라미터 미전송 시 기존 응답과 동일 (공개 API `/api/portal/public/ujat/education-regions`는 변경 없음).

## 검증

- [ ] `activeYn=true` → 사용 지역만, `activeYn=false` → 미사용 지역만
- [ ] `keyword=서울` → 이름에 「서울」 포함 지역만
- [ ] `activeYn` + `keyword` 조합 시 두 조건 모두 만족
- [ ] 파라미터 없이 호출 시 기존과 동일
- [ ] OpenAPI에 `activeYn` · `keyword` 노출

## FE 참고

- 클라이언트: `apps/cms/src/features/program/ujat/api/education-regions/client.ts` (`fetchAdminUjatEducationRegionsRemote`)
- 서비스: `apps/cms/src/features/program/ujat/api/education-regions/service.ts` (`listUjatEducationRegionsFilteredService` — BE 반영 후 응답 재필터 제거 가능)
- 화면: `apps/cms/src/pages/programs/UJAT/education-regions-page.tsx`
