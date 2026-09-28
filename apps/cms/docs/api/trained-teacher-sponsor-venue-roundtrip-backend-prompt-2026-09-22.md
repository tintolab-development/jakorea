# BE 전달 프롬프트 — 교육받은 교사 후원사·담당자 복수 저장, 교육 장소 선택이 GET에서 사라진다

**작성일:** 2026-09-22  
**문서 성격:** 이 파일만 보고 수정·검수. 변명·우회 금지.  
**우선순위:** P0. 화면에서 고른 담당자와 교육 장소가 저장 후 조회에 없다.  
**대상:** `programType=TRAINED_TEACHER`  
**비범위:** GENERAL / 1사1교 / UJAT / Gemini 의 RFC-7396 merge 는 건드리지 말 것.

선행으로 `generalCommonInfo` 를 일지·연수·일정만 남기고 지우는 문제가 있으면 그것도 같이 고쳐야 한다.  
그 문서는 `trained-teacher-common-info-json-replace-wipes-fields-backend-prompt-2026-09-22.md`.  
이 문서의 `venueKind` / `venueDetail` / `sponsorManagementIds` / `sponsorManagerContactIds` 가 그 삭제에 걸리면 아래 수락은 실패다.

FE는 이미 복수 담당자 행을 보내고, nested `venueKind` 가 있으면 그 값을 화면에 쓴다.  
서버가 행을 합치거나 `venueKind` 를 지우면 화면은 다시 한 명, 기관 안으로 돌아간다.

---

## 한줄

1. `sponsors[]` 는 후원사 여러 개, 그리고 **같은 후원사의 담당자 여러 명**을 모두 저장하고 GET 에서 모두 돌려준다. 후원사당 contact 1개로 접지 말 것.
2. 교육 장소 선택 `inside` / `outside` / `other` 와 상세 문구는 저장 후 GET 에 그대로 있다. `institutionType=inside_school` 이 남아 있다고 장소 선택을 기관 안으로 바꾸지 말 것.

---

## 1. 후원사·담당자 복수

### FE가 보내는 A `PATCH /api/admin/programs/{id}`

후원사 `163302` 에 담당자 두 명, 후원사 `1627251` 에 담당자 한 명:

```json
{
  "sponsorId": "163302",
  "sponsors": [
    { "sponsorId": "163302", "sponsorContactId": "111" },
    { "sponsorId": "163302", "sponsorContactId": "222" },
    { "sponsorId": "1627251", "sponsorContactId": "1627253" }
  ],
  "serviceDetailJson": {
    "schemaVersion": 1,
    "program": {
      "generalCommonInfo": {
        "sponsorManagementIds": ["163302", "1627251"],
        "sponsorManagerContactIds": [
          "163302::111",
          "163302::222",
          "1627251::1627253"
        ]
      }
    }
  }
}
```

`sponsorId` 컬럼은 대표 1명이다. 목록 전체가 아니다.  
`sponsors[]` 와 nested id 배열이 전체다.

같은 `sponsorId` 가 두 행인 것은 오류가 아니다. 담당자가 두 명이라는 뜻이다.

### 실패

- `sponsors` 를 후원사 id 기준으로 접어서 contact 를 마지막 1명만 남김
- `GET /api/admin/programs/{id}/sponsors` 가 담당자 1명만 반환
- nested `sponsorManagementIds` / `sponsorManagerContactIds` 를 미러로 보고 삭제
- B `PATCH …/trained-teacher/detail` 가 A가 쓴 후원 id 를 삭제
- 담당자가 없는 후원사 행 `{ "sponsorId": "163302" }` 를 버림

### 성공

`GET /api/admin/programs/{id}/sponsors` 가 요청한 3행을 그대로 반환한다.

```json
[
  { "sponsorId": "163302", "sponsorContactId": "111", "sponsorContactName": "…" },
  { "sponsorId": "163302", "sponsorContactId": "222", "sponsorContactName": "…" },
  { "sponsorId": "1627251", "sponsorContactId": "1627253", "sponsorContactName": "…" }
]
```

`GET /api/admin/programs/{id}` nested:

- `sponsorManagementIds` = `["163302", "1627251"]`
- `sponsorManagerContactIds` = `["163302::111", "163302::222", "1627251::1627253"]`

같은 저장을 한 번 더 해도 행 수가 줄지 않는다.

---

## 2. 교육 장소

화면 값:

| 화면 | `venueKind` | `institutionType` | `venue` 컬럼 |
|---|---|---|---|
| 기관 안 | `inside` | `inside_school` | 상세 문구 |
| 기관 밖 | `outside` | `outside_school` | 상세 문구 |
| 기타(직접입력) | `other` | 컬럼에 해당 값 없음 | 상세 문구 |

### FE가 보내는 예 (기타)

```json
{
  "venue": "별관 301호",
  "serviceDetailJson": {
    "schemaVersion": 1,
    "program": {
      "generalCommonInfo": {
        "venueKind": "other",
        "venueDetail": "별관 301호"
      }
    }
  }
}
```

기타는 `institutionType` 을 보내지 않는다. 예전에 저장된 `inside_school` 을 그대로 두면, nested `venueKind` 가 지워진 GET 은 기관 안이 된다.  
기타 저장 시 `institutionType` 을 비우거나, nested `venueKind=other` 를 반드시 남길 것. 둘 중 하나만 하면 실패다. **둘 다 할 것.**

기관 밖은 `institutionType=outside_school` 과 `venueKind=outside` 를 같이 남긴다.

### 실패

- `venueKind` / `venueDetail` 이 요청에 있었는데 GET nested 에 없음
- `institutionType` 이 `inside_school` 이라는 이유만으로 `venueKind=other` 또는 `outside` 를 `inside` 로 바꿈
- `venue` 컬럼이 `null` 인데 요청 `venue` / `venueDetail` 은 있었음
- `venueKind=other` 인데 GET 이 기관 안
- B overlay 가 `venueKind` / `venueDetail` 을 삭제

### 성공

기타로 저장한 뒤 `GET /api/admin/programs/{id}`:

- top-level `venue` = `별관 301호`
- nested `venueKind` = `other`
- nested `venueDetail` = `별관 301호`
- `institutionType` 은 `inside_school` / `outside_school` 이 아님

기관 밖으로 저장한 뒤:

- `institutionType` = `outside_school`
- nested `venueKind` = `outside`
- `venue` 와 nested `venueDetail` 이 마지막 상세 문구

같은 저장을 한 번 더 해도 종류와 문구가 줄거나 기관 안으로 바뀌지 않는다.

---

## 하면 안 되는 것

| 실패 | 요구 |
|---|---|
| 후원사당 담당자 1명만 저장 | `sponsors[]` 행 전부 저장·GET |
| `sponsorId` 컬럼 1개만 배정으로 취급 | 컬럼은 대표. 전체는 `sponsors[]` 와 nested id |
| `venueKind` 를 미러로 삭제 | `inside` / `outside` / `other` 유지 |
| 남은 `inside_school` 로 장소 선택을 덮음 | nested `venueKind` 가 선택의 SSOT |
| 기타 저장 후 `institutionType=inside_school` 유지 + `venueKind` 삭제 | 기타면 컬럼을 비우고 `venueKind=other` 유지 |

---

## 수락 (이거 아니면 미완)

1. 후원사 2곳, 그중 한 곳에 담당자 2명을 저장한다.
2. `GET /api/admin/programs/{id}/sponsors` 행이 3개다. 같은 `sponsorId` 에 `sponsorContactId` 가 서로 다르다.
3. `GET /api/admin/programs/{id}` nested `sponsorManagerContactIds` 가 3개다.
4. 교육 장소를 기타, 상세 `별관 301호` 로 저장한다.
5. GET `venue` = `별관 301호`, nested `venueKind` = `other`, nested `venueDetail` = `별관 301호`.
6. 교육 장소를 기관 밖으로 바꿔 저장하면 `institutionType=outside_school`, nested `venueKind=outside`.
7. 1번과 4번을 한 프로그램에 같이 저장하고 한 번 더 저장해도 담당자 수와 장소 종류가 줄지 않는다.
8. GENERAL 프로그램 공통 정보 저장은 회귀 없음.

**Last updated:** 2026-09-22
