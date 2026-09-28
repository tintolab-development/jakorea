# Cursor prompt — Admin 메인 화면 list `altText` + 사용 상한·lock 에러 코드

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 맞춰라.  
질문이 필요하면 스키마가 값을 거부할 때(쿼리 타입·에러 envelope)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/main-admin-popup-alttext-error-codes-backend-cursor-prompt-2026-09-20.md`

---

## Goal

Admin FE(Homepage Admin) 메인 화면 5개는 OpenAPI로 이미 연동됐다.  
남은 **서버 갭**은 아래 둘이다.

1. `GET /api/admin/main/popups` 에 **`altText` query가 없다.**  
   FE UI·URL(`pu_alt`)은 있고, 지금은 응답 후 클라이언트에서만 거른다.  
   서버가 없는 필드는 FE 규칙상 클라이언트 보조 필터로 둔다. **BE가 query를 추가해야** 서버 조회로 옮긴다.
2. 팝업·띠배너 **동시 사용 상한**을 넘긴 POST/PATCH 가 4xx여도 **안정적인 `error.code`가 OpenAPI에 없다.**  
   FE는 mock에서만 `PopupActiveLimitError` / `StripBannerActiveLimitError`를 던진다.  
   Remote는 envelope `error.code` 또는 메시지 휴리스틱에 의존한다.

version 충돌은 FE가 이미 `OPTIMISTIC_LOCK_CONFLICT` 를 매핑한다.  
해당 코드가 메인 화면 mutation에 **실제로 나가는지 확인하고**, 안 나가면 맞춰라.

완료 조건:

1. `GET /api/admin/main/popups?altText=` 가 `popupName` 과 **같은 매칭**으로 서버에서 거른다.
2. 팝업 `enabled=true` 가 **4개**를 넘기면 4xx + 고정 `error.code`.
3. 띠배너 `enabled=true` 가 **2개**를 넘기면 4xx + 같은 계열의 고정 `error.code`.
4. stale `version` PUT/PATCH 는 `error.code = OPTIMISTIC_LOCK_CONFLICT`.
5. OpenAPI를 갱신한다.
6. 작업 후 **프론트용 Cursor 프롬프트**를 이 문서 템플릿으로 작성해 회신한다. FE가 그 프롬프트 없이 OpenAPI를 추측하지 않게 하라.

---

## Out of scope / 금지

- `GET /api/admin/main/popups/{id}` · `GET /…/strip-banners/{id}` · `GET /…/heroes/{id}` **신설 금지**
- list `page` / `size` / 페이지네이션 **신설 금지** (Admin 메인은 전체 목록)
- 히어로 list query 필터 신설 (`GET /api/admin/main/heroes` 는 필터 없음이 계약)
- 소셜 생성·삭제, 콘텐츠 리스트 CRUD
- `GET /api/public/main` 필드 변경, 시드 SQL, 에셋
- 띠배너 `backgroundColor` 컬럼
- prod 운영 데이터 삭제

---

## 1. 팝업 list query `altText`

엔드포인트: `GET /api/admin/main/popups` (`operationId: list_4`)

현재 query (유지):

| name | in | type | 의미 |
|------|----|------|------|
| `enabled` | query | boolean | 사용 여부 |
| `popupName` | query | string | 팝업명 부분 일치 |
| `periodStart` | query | date | 게시 기간 교집합 시작 |
| `periodEnd` | query | date | 게시 기간 교집합 종료 |

추가:

| name | in | required | type | 의미 |
|------|----|----------|------|------|
| `altText` | query | false | string | 대체 텍스트 **부분 일치** |

매칭 규칙 (필수):

- `popupName` 과 **동일**하게 구현하라. (대소문자 무시 contains / ILIKE. `popupName` 이 exact면 `altText` 도 exact — **둘을 다르게 하지 마라.**)
- 빈 문자열·공백만이면 무시 (필터 미적용).
- 다른 query와 **AND**.
- 응답 스키마(`PopupListResponse` / `PopupResponse`)는 바꾸지 마라. `altText` 필드는 이미 body에 있다.

OpenAPI `parameters` 에 `altText` 를 추가하라. Admin FE Orval `List4Params` 가 이 필드를 받아야 한다.

검수:

```text
GET /api/admin/main/popups?altText=캠프
→ 각 행 popup.altText 가 "캠프"를 포함 (popupName 매칭과 동일 규칙)
GET /api/admin/main/popups?popupName=모집&altText=안내
→ 두 조건 AND
GET /api/admin/main/popups
→ altText 생략 시 기존과 동일 전체 목록
```

---

## 2. 동시 사용 상한 에러 코드

상한은 FE mock과 같다. **숫자를 바꾸지 마라.**

| 리소스 | 상한 | 초과가 나는 API |
|--------|------|-----------------|
| 팝업 | `enabled=true` **최대 4** | `POST /api/admin/main/popups` (`enabled: true`), `PATCH /api/admin/main/popups/{id}/enabled` (`enabled: true`) |
| 띠배너 | `enabled=true` **최대 2** | `POST /api/admin/main/strip-banners` (`enabled: true`), `PATCH /api/admin/main/strip-banners/{id}/enabled` (`enabled: true`) |

이미 `enabled=true` 인 행을 다시 true로 PATCH 하는 것은 **상한 위반이 아니다.**  
`enabled: false` → `true` 로 바꿀 때 현재 true 개수가 상한이면 거절.

HTTP: **409** 권장 (400도 허용). FE는 status보다 `error.code` 를 본다.

envelope (FE가 이미 파싱함):

```json
{
  "message": "팝업은 최대 4개까지 동시 사용 가능합니다.",
  "error": {
    "code": "ENABLED_LIMIT",
    "message": "팝업은 최대 4개까지 동시 사용 가능합니다."
  }
}
```

`error.code` **필수, 고정 문자열.** 아래 중 **하나**를 골라 전 도메인에 써라. 매 요청마다 바꾸지 마라.

허용 (FE가 이미 매핑): `ENABLED_LIMIT` | `MAX_ACTIVE` | `ACTIVE_LIMIT` | `TOO_MANY_ENABLED`

**권장: `ENABLED_LIMIT`.**

`message` 한글 권장 (FE 폴백용):

- 팝업: `팝업은 최대 4개까지 동시 사용 가능합니다.`
- 띠배너: `배너는 최대 2개까지 동시 사용 가능합니다.`

히어로·소셜·콘텐츠는 동시 사용 상한이 없다. 만들지 마라.

---

## 3. Optimistic lock

FE `ToggleRequest` / update body 에 `version` 이 있다.  
아래 mutation에서 stale `version` 이면 **409** + `error.code = OPTIMISTIC_LOCK_CONFLICT`.

대상:

- `PUT /api/admin/main/popups/{id}`
- `PATCH /api/admin/main/popups/{id}/enabled`
- `PUT /api/admin/main/popups/order`
- `PUT /api/admin/main/strip-banners/{id}`
- `PATCH /api/admin/main/strip-banners/{id}/enabled`
- `PUT /api/admin/main/strip-banners/order`
- `PUT /api/admin/main/heroes/{id}`
- `PATCH /api/admin/main/heroes/{id}/enabled`
- `PUT /api/admin/main/heroes/order`
- `PUT /api/admin/main/social-links` (전체 저장)
- 메인 콘텐츠 섹션 PUT 4개 (`/content` 하위)

메시지에 `changed by another administrator` 또는 `optimistic lock` 이 있으면 FE 폴백이 동작한다.  
**코드 `OPTIMISTIC_LOCK_CONFLICT` 를 우선** 내려라.

이미 그렇게 내려가면 구현을 바꾸지 말고 회신에 “기존 유지”라고 적어라.

---

## 작업 후 회신

```text
- 변경 파일:
- GET /popups altText 매칭: (contains 대소문자무시 | exact | popupName과 동일 설명)
- 상한 error.code: (예: ENABLED_LIMIT)
- 상한 HTTP status:
- OPTIMISTIC_LOCK_CONFLICT 적용 API 목록: (이미 있었으면 "기존 유지")
- OpenAPI 갱신 여부: (yes/no, 스펙 파일 경로)
```

그리고 **프론트 변경이 필요하면** 아래 블록을 **그대로 채워** 회신하라.  
FE 레포(`jakorea`) Cursor에 붙여넣을 수 있게, 한국어 지시문으로 작성하라.  
프론트 변경이 전혀 없으면 `프론트 Cursor 프롬프트: 불필요` 한 줄.

`altText` query를 추가했다면 **프론트 프롬프트는 필수**다. (Orval 재생성 + `toPopupListParams` 한 줄 + `applyClientAltTextFilter` 제거)

---

## 프론트 Cursor 프롬프트 템플릿 (백엔드가 채워 회신)

````text
# Cursor prompt — Admin 메인 화면 (팝업 altText 서버 필터 · 에러 코드)

대상: 프론트 레포 `jakorea`, 앱 `apps/admin`.
백엔드 OpenAPI가 갱신됐다. **추측하지 말고 아래 계약만** 반영하라.

## 하지 마라

- 히어로 필터 UI, 소셜 C/D, 콘텐츠 리스트 CRUD
- `GET /{id}` · `page`/`size` 도입
- mock store 제거, Platform public main 변경

## 1. OpenAPI / Orval

백엔드 스펙 경로: {BE OpenAPI 파일}
추가·변경 요약:
- GET /api/admin/main/popups query `altText`: {string, optional, 매칭 규칙}
- 에러 코드: {ENABLED_LIMIT 등} HTTP {409?}
- 그 외 변경: {없으면 none}

Admin에서 해당 스펙으로 Orval을 재생성하라. (`main` subset)

## 2. 팝업 altText 서버 필터

파일:
- `apps/admin/src/features/popup/api/mappers.ts` (`toPopupListParams`)
- `apps/admin/src/features/popup/api/service.ts` (`listRemotePopups`)

할 일:
1. `toPopupListParams` 주석 처리된 `params.altText = filter.altText.trim()` 을 **켠다.**
2. `listRemotePopups` 의 `applyClientAltTextFilter` 호출을 **제거**한다. 서버가 없는 필드만 클라이언트 필터로 남기는 규칙이다.
3. DnD용 비필터 `listPopupsService()` 는 유지.

## 3. 에러 코드 (코드가 FE 기존 매핑과 다를 때만)

FE가 이미 인식하는 상한 코드: `ENABLED_LIMIT` | `MAX_ACTIVE` | `ACTIVE_LIMIT` | `TOO_MANY_ENABLED`
lock: `OPTIMISTIC_LOCK_CONFLICT`

백엔드가 실제로 내리는 코드: `{여기에 실제 코드}`
다르면 `apps/admin/src/shared/lib/api-error-message.ts` 의 `isEnabledLimitError` 에 **그 코드만** 추가하라. 메시지 휴리스틱을 지우지 마라.

샘플 4xx:

```json
{백엔드가 실제 응답 JSON을 붙여라}
```

## 4. 검증

- API 로그인 후 `/main/popups` 조회 → Network `altText=` 가 나가고, 목록이 서버 결과와 같다.
- 팝업 5번째 사용 ON / 띠배너 3번째 사용 ON → 한글 상한 알림 (팝업 4 / 배너 2).
- stale version 저장 → `다른 관리자가 내용을 수정했습니다.`
- Mock 로그인 localStorage 경로 유지.

## 작업 후 회신

- 변경 파일:
- List4Params.altText 생성 여부:
- applyClientAltTextFilter 제거 여부:
````

**Last updated:** 2026-09-20
