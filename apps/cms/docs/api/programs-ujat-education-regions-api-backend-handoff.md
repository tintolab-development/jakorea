# UJAT 교육 지역 API — 백엔드 핸드오프

CMS `/programs/ujat/regions`의 FE 도메인과 OpenAPI 계약을 맞추기 위한 BE 핸드오프입니다.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-07-16 |
| 로드맵 | [programs-api-conversion-roadmap.md](./programs-api-conversion-roadmap.md) — **Cat 3** |
| FE SSOT | [programs-ujat-education-regions-api-conversion-status.md](./programs-ujat-education-regions-api-conversion-status.md) |
| 현재 | FE remote GET/PATCH/reorder/create/delete · OpenAPI는 GET/PATCH/reorder만 공식 · POST/DELETE는 FE Option A(런타임 호출) |

---

## 1. 현재 OpenAPI 경로

| Method | Path | FE 사용 |
|--------|------|---------|
| `GET` | `/api/admin/ujat/education-regions` | 사용 |
| `POST` | `/api/admin/ujat/education-regions` | **FE Option A** · OpenAPI 스키마 미반영 가능 |
| `PATCH` | `/api/admin/ujat/education-regions/{regionId}` | 사용 |
| `DELETE` | `/api/admin/ujat/education-regions/{regionId}` | **FE Option A** · OpenAPI 스키마 미반영 가능 |
| `PUT` | `/api/admin/ujat/education-regions/reorder` | 사용 |
| `GET` | `/api/ujat/education-regions` | Platform/사용자 · CMS 비범위 |

---

## 2. FE ↔ DTO 매핑 (합의 필요)

| FE | OpenAPI | 비고 |
|----|---------|------|
| `id` (string) | `id` (number) | FE는 string으로 정규화 가능 |
| `regionKey` | `code` | 신청·진행 탭 식별자 SSOT. 시드 8종 + `custom_*` |
| `name` | `nameKo` (우선) / `displayName` | 표시명 |
| `sortOrder` | `displayOrder` | reorder body와 일치 |
| `active` | `activeYn` | |
| `createdAt` / `updatedAt` | 동일 | |
| `createdByName` | **없음** | 추가 또는 FE 비표시 |
| `hasUsageHistory` | **없음** | 삭제 불가 UX에 필수 — 추가 또는 삭제 API 409 계약 |

기본 8개 시드 라벨(서울, 경기(남부), 인천, 대전, 대구, 부산, 광주, 전북(전주))과 서버 초기 데이터가 **동일 code**를 쓰는지 확인이 필요합니다.

---

## 3. P0 — create / delete 갭

FE UI는 **신규 등록·삭제**를 지원합니다. OpenAPI generated 스키마에는 해당 method가 없을 수 있습니다.

**FE 확정 (2026-07-16): Option A** — remote ON에서도 등록/삭제 버튼 노출.  
`POST /api/admin/ujat/education-regions`, `DELETE …/{regionId}`를 직접 호출합니다. BE 미지원 시 실패 alert.

BE가 OpenAPI에 POST/DELETE를 추가·스테이징 검증하면 codegen 반영을 권장합니다.

---

## 4. reorder 계약

`PUT /api/admin/ujat/education-regions/reorder`  
body: `UjatEducationRegionReorderRequest` — `items[]` of `{ id, displayOrder }` (generated `UjatEducationRegionOrderItem`).

FE DnD 완료 시 전체 순서 스냅샷을 보내고, 성공 후 list invalidate.

---

## 5. migration · 소비처

- localStorage key: `cms.jakorea.ujatEducationRegions.v1`
- 원격 ON 시: 서버 list를 SSOT로 하고 local은 폐기 또는 one-time import(충돌 정책 BE/FE 합의)
- 신청·진행·봉사자 필터는 현재 `regionKey` 문자열에 의존 → 서버 `code`와 **안정 매핑** 필수

---

## 6. FE gate 제안

```env
VITE_REAL_API_MODULES=...,ujatEducationRegions
```

`ujatPrograms`와 독립. Cat2 CRUD ON만으로 regions가 서버화되면 안 됩니다.

---

## 7. BE 체크리스트

- [ ] GET list가 활성/비활성·정렬 순서로 반환
- [ ] PATCH nameKo/activeYn round-trip
- [ ] PUT reorder 후 GET 순서 일치
- [ ] create/delete **OpenAPI 반영** · 스테이징 round-trip (FE Option A 이미 호출)
- [ ] `hasUsageHistory` 또는 409 삭제 정책
- [ ] `code` 안정성 (신청 데이터 참조 깨짐 방지)
- [ ] 감사로그·권한(PROGRAM_WRITE 등) 문서화

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-16 | 초안 |
