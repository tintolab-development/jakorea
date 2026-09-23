# 프로그램 상세 정보 수정 후 목록 프로그램명 미반영 · BE 수정 요청

**작성일:** 2026-09-23  
**우선순위:** P1  
**요청 대상:** Programs API · `PATCH /api/admin/programs/{id}` · `GET /api/admin/programs` (목록) · `GET /api/admin/programs/{id}` (상세)  
**대상 유형:** 일반(`GENERAL_INDIVIDUAL` / `GENERAL_ORGANIZATION`). 동일 `title`/`mainTitle` 컬럼을 쓰는 UJAT · 1사1교 · 교육받은 교사도 같은 규칙으로 맞춰 주세요.  
**관측 프로그램:** `id=186020` (`GENERAL_INDIVIDUAL`)  
**이 문서만으로 구현·검수할 수 있다.**

---

## 1. 무엇을 바꾸는가

CMS **프로그램 상세 → 공통 정보 → 대표 프로그램명 (국문)** 을 수정해 저장하면, **상세 GET의 `mainTitle`은 바뀌는데 목록 GET의 프로그램명은 생성 당시 값이 그대로**입니다.

목록 「프로그램명」은 **대표 프로그램명 (국문)** 입니다. 상세에서 고친 그 값이 목록에도 나와야 합니다.

| CMS 라벨 | 1차 컬럼 | 등록 시 FE | 상세 수정 시 FE |
|----------|----------|------------|-----------------|
| 대표 프로그램명 (국문) | **`mainTitle`** | `mainTitle` + `title`에 동일 값 | **`mainTitle`만** PATCH |
| 대표 프로그램명 (영문) | `titleEn` | `titleEn` | `titleEn` PATCH |
| 공고용 프로그램명 | 1차 컬럼 없음 | `serviceDetailJson.generalCommonInfo.announcementTitle` | JSON `announcementTitle` |
| (내부) 관리/레거시 제목 | `title` | 등록 때 대표명과 같게 보냄 | **보내지 않음** |

FE 목록은 `title` → 없으면 `mainTitle` 순으로 표시합니다. 등록 직후에는 두 값이 같아서 목록이 맞습니다. **상세에서 대표명만 고치면 `mainTitle`만 갱신되고, 목록은 예전 `title`을 그대로 씁니다.**

---

## 2. 재현

1. CMS 일반 프로그램 등록. 대표 프로그램명 (국문)을 예: `세부프로그램명 경제리터러시기초`.
2. 상세 공통 정보에서 대표 프로그램명 (국문)을 `수정1`로 바꾸고 저장.
3. `PATCH /api/admin/programs/186020` → 200.
4. `GET /api/admin/programs/186020` (상세) 와 `GET /api/admin/programs` (목록) 비교.

**기대**

| 필드 | 상세 | 목록 |
|------|------|------|
| `mainTitle` | `수정1` | `수정1` |
| 목록 프로그램명으로 쓰는 값 | — | `수정1` |

**실제 (186020, 2026-09-23)**

| 필드 | 상세 GET | 목록 GET |
|------|----------|----------|
| `mainTitle` | `수정1` | `세부프로그램명 경제리터러시기초` |
| `title` | `세부프로그램명 경제리터러시기초` | `세부프로그램명 경제리터러시기초` |
| `titleEn` | `수정1` | `수정1` |

`titleEn`은 목록·상세가 같습니다. **`mainTitle`만 목록이 상세와 다릅니다.** 목록 `mainTitle`이 상세 `title`(생성값)과 같습니다. 목록 프로젝션이 갱신된 `mainTitle` 컬럼을 읽지 않고 `title`을 복사하는 것으로 보입니다.

---

## 3. API

| # | Method | Path | 화면 |
|---|--------|------|------|
| A | `PATCH` | `/api/admin/programs/{id}` | 상세 공통 정보 저장 |
| B | `GET` | `/api/admin/programs/{id}` | 상세 |
| C | `GET` | `/api/admin/programs` | 목록 |

권한: 관리자 · 프로그램 수정/조회.

---

## 4. FE PATCH 계약 (공통 정보 저장)

FE는 변경된 도메인 키만 보냅니다. 대표 국문을 고치면 **`mainTitle`은 있고 `title`은 없습니다.**

```json
{
  "mainTitle": "수정1",
  "titleEn": "수정1",
  "serviceDetailJson": "{ ... generalCommonInfo.announcementTitle, registration.overlay ... }"
}
```

매퍼: `mapProgramPatchFieldsToRequest`  
`has('mainTitle')` → `body.mainTitle = merged.mainTitle`  
`has('title')`가 아니면 `title`을 보내지 않습니다.

상세 저장 후 FE는 목록을 다시 GET 합니다. 클라가 목록 캐시에 대표명을 직접 쓰지 않습니다. **목록 응답이 맞아야 화면이 맞습니다.**

---

## 5. 서버가 할 일

### 5.1 목록 `mainTitle` = 상세 `mainTitle`

`PATCH`로 `mainTitle`이 오면 1차 컬럼 `mainTitle`을 갱신하고, **목록 쿼리가 그 컬럼을 그대로** 내려야 합니다.  
목록 `mainTitle`을 `title`에서 복사하지 마세요.

### 5.2 목록 프로그램명

목록 「프로그램명」= **대표 프로그램명 (국문)** = `mainTitle`.

지금 FE는 목록 DTO의 `title`을 먼저 그립니다. 등록 때 `title`과 `mainTitle`을 같게 보내서 그동안 맞아 보였습니다.

아래 **하나만** 하면 됩니다. 둘 다 하면 더 안전합니다.

| 선택 | 내용 |
|------|------|
| **A (권장)** | `PATCH mainTitle` 시 목록이 읽는 `title`도 같은 값으로 갱신. 일반 프로그램에서 `title`은 대표명과 같이 시작함 |
| **B** | 목록 `mainTitle`만 정확히 내리고, FE가 `mainTitle` 우선 표시로 바꿈. 이 경우 회신에 B를 적어 주세요 |

`title`을 관리용 고정값으로 둘 계획이면 **반드시 B**이고, 목록 `mainTitle`은 상세와 같아야 합니다. 지금처럼 목록 `mainTitle`까지 `title`로 덮으면 안 됩니다.

### 5.3 검색

목록 검색 `title` 쿼리가 있으면 **갱신된 대표명(`mainTitle`)** 으로도 찾아야 합니다.

---

## 6. 검수

프로그램 하나에서 대표 국문을 A → B로 수정한 뒤:

- [ ] 상세 GET `mainTitle` === `B`
- [ ] 목록 GET 해당 row `mainTitle` === `B`
- [ ] 목록 화면 프로그램명 === `B`
- [ ] 목록 GET `titleEn`이 상세와 같음 (이미 됨. 깨지지 말 것)
- [ ] 대표명을 B로 검색하면 해당 행이 나옴
- [ ] 공고용명만 바꾼 경우 목록 프로그램명은 대표명 유지 (공고용 ≠ 목록명)

---

## 7. 같은 응답에서 같이 보이는 공고용명 (참고)

`186020` 상세 `serviceDetailJson`에는 공고용명이 세 곳에 있습니다.

| 위치 | 값 | 의미 |
|------|-----|------|
| `generalCommonInfo.announcementTitle` | `수정1` | 상세 공통 정보 공고용 (이 건에서는 대표명과 동일) |
| `registration.overlay["generalRegistration.basicInfo.publicProgramTitle"]` | `수정1` | 등록 폼 공고용 |
| **루트** `serviceDetailJson.announcementTitle` | `세부프로그램명 경제리터러시기초` | **생성 시 `title`과 같음. 공고용 아님** |

루트 `announcementTitle`을 `title`로 채우지 마세요. 공고용 SSOT는 `generalCommonInfo.announcementTitle` (및 overlay `publicProgramTitle`) 입니다.  
이번 요청의 필수 수정은 **§5 목록 프로그램명** 입니다.

---

## 8. 회신 부탁

1. 목록 프로그램명을 **A(`title` 동기화)** / **B(목록 `mainTitle` SSOT)** 중 무엇으로 할지  
2. 수정 대상 API (`PATCH` persist / 목록 쿼리 / 둘 다)  
3. UJAT · 1사1교 · 교육받은 교사 동일 적용 여부  
