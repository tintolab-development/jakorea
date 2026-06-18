---
priority: high
category: ui-spec
---

# UJAT 교육 지역 관리

**Scope:** `/programs/ujat/regions`, `features/program/ujat/**` (교육 지역)

**관련:** [ujat-program-characteristics-spec.md](./ujat-program-characteristics-spec.md) · [ujat-program-list-page-spec.md](./ujat-program-list-page-spec.md)

---

## 메뉴

```
프로그램 관리
└ UJAT 프로그램
   ├ 프로그램 관리      → /programs/ujat
   └ 교육 지역 관리    → /programs/ujat/regions
```

---

## 필터

| 항목 | UI |
|------|-----|
| 사용 여부 | 라디오 — 사용 / 미사용 |
| 교육 지역명 | 텍스트 검색 |
| 조회 | 버튼 클릭 시 필터 적용 |

---

## 테이블

| 컬럼 | 스펙 |
|------|------|
| 순서 | 드래그 핸들 — DnD 순서 변경, No. 자동 갱신 |
| No. | 1부터 순번 |
| 사용 여부 | 사용 / 미사용 (변경은 **이후 생성 프로그램**부터 반영) |
| 교육 지역명 | |
| 등록자명 | |
| 등록일시 | `YYYY.MM.DD HH:mm:ss` |
| 관리 | 삭제 · 수정 |

- **행 클릭** — 별도 화면 없음.
- **수정** — 테이블 인라인(라디오 + 인풋), 저장/취소.
- **삭제** — 확인 모달. **사용 이력 있으면 삭제 불가** 안내 모달.
- 순서·라벨·사용 여부는 `listUjatInstitutionApplicationRegions()` 로 신청·상세 폼에 반영.

---

## 액션

| 버튼 | 동작 |
|------|------|
| 교육 지역 등록 | `UJAT 교육 지역 신규 등록` 모달 |
| 엑셀 다운로드 | `FilterTableLayout` 기본 |

---

## 데이터 (mock)

- localStorage: `cms.jakorea.ujatEducationRegions.v1`
- 시드 8지역 — 서울(사용 이력·삭제 불가 데모), 경기(남부), 인천, 대전, 대구, 부산, 광주, 전북(전주)

**Last updated:** 2026-06-18
