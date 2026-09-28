# Cursor prompt — public main 띠배너·팝업 기간 필드

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
질문은 스키마가 날짜 타입을 거부할 때만 하라. prod 운영 데이터를 지우지 마라.

---

## Goal

`GET /api/public/main` 의 `stripBanners[]` · `popups[]` 각 행에 **게시 기간**을 내려라.

Platform은 홈 쿼리를 최대 5분 캐시하고, 홈이 열려 있으면 1분마다 다시 친다.  
기간이 응답에 없으면 만료 직후 캐시된 띠배너가 최대 1–5분 남을 수 있다.  
기간이 있으면 FE가 로컬 시각으로 숨긴다.

Admin 관리 API(`StripResponse` / `PopupResponse`)에는 이미 있다:

- `displayStartDate`
- `displayEndDate`

공개 매퍼에 같은 값을 실어라. **필터 로직(지금 시각에 노출되는 행만 배열에 넣기)은 유지**하라.

---

## Out of scope

- `backgroundColor` 컬럼 추가
- `GET /api/public/main` 에 `at` / `preview` / `lang` 쿼리 파라미터 추가
- 히어로·후원사·소셜·콘텐츠 필드 변경
- Platform 팝업 UI
- 시드 카피·에셋 교체 (별도 시드 프롬프트)

---

## 계약

`PublicStripResponse` / `PublicPopupResponse`에 추가:

| JSON 필드 | 타입 | 의미 |
|-----------|------|------|
| `displayStartDate` | string | 게시 시작. Admin과 동일 포맷 (`YYYY-MM-DD` 또는 기존 ISO) |
| `displayEndDate` | string | 게시 종료. **해당 일자 포함**(그날 23:59:59까지 노출) |

둘 다 공개 응답에서 **생략하지 마라.** 서버가 이미 기간으로 걸렀어도 FE 캐시 만료 판정용으로 내려라.

기존 필드(`id`, `displayOrder`, `bannerText`/`imageUrl`/`altText`, `linkUrl`)는 그대로.

OpenAPI `PublicStripResponse` · `PublicPopupResponse` 를 갱신하고 Admin orval 스펙에도 반영하라.

---

## 완료 기준

1. `GET /api/public/main` (인증 없음) 활성 띠배너 각 원소에 `displayStartDate`, `displayEndDate` 가 있다.
2. 기간이 지난 행은 **배열에 포함하지 않는다** (기존과 동일).
3. 포함된 행의 기간은 “오늘”을 덮는다.
4. 팝업 원소도 동일 두 필드.
5. Admin `/main/strip-banners` 저장 포맷과 public 포맷이 같다.

검수 예:

```text
GET /api/public/main
stripBanners[0].displayStartDate 존재
stripBanners[0].displayEndDate 존재
popups[] 가 비어 있지 않으면 각 행에 동일 필드
```

---

## 작업 후 회신

```text
- 변경 파일:
- public JSON 날짜 포맷: (YYYY-MM-DD | ISO)
- GET /api/public/main stripBanners 샘플 1건:
```

**Last updated:** 2026-09-20
