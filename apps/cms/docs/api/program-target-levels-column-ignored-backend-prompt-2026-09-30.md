# BE 수정 요청 (2026-09-30) — 단독 문서

**작성일:** 2026-09-30  
**우선순위:** P0  
**문서 성격:** **이 파일만** 보고 구현·검수 가능.  
**대상 API:** `PATCH /api/admin/programs/{programId}` · `GET /api/admin/programs/{programId}` · `GET /api/portal/programs/{programId}`  
**재현 ID:** `186023` (`GENERAL_INDIVIDUAL`)  
**비대상:** portal FE 매퍼. portal은 `educationTargets` 배열을 그대로 표시한다.

---

## 핵심 요구 (한 줄)

`PATCH` body `targetLevels` 배열을 **그대로 컬럼에 저장**하고, Admin GET `targetLevels` · Portal GET `educationTargets` 에 **같은 배열**을 내려라.  
`targetLevel` / `educationTarget` 단수·JSON 안 다른 위치의 1개짜리 배열로 덮지 마라.

---

## 현재 장애 (실측 2026-09-30)

CMS가 보낸 PATCH (발췌):

```json
{
  "targetLevels": ["elementary", "middle", "high"],
  "targetLevel": "elementary"
}
```

같은 요청 `serviceDetailJson` 루트도 3개다.

```json
{
  "targetLevels": ["elementary", "middle", "high"],
  "program": { "targetLevels": ["elementary", "middle", "high"] }
}
```

저장 직후 Admin GET `186023`:

```json
{
  "targetLevel": "elementary",
  "targetLevels": ["elementary"]
}
```

Portal GET `186023`:

```json
{
  "educationTarget": "elementary",
  "educationTargets": ["elementary"]
}
```

모집 라벨은 이미 복수로 저장돼 있다.

```json
{
  "participantRecruitmentInfo": {
    "educationTarget": "초등학교, 중학교, 고등학교"
  }
}
```

**결론:** FE는 3개를 보냈다. BE가 컬럼·portal을 1개로 줄였다.

---

## 원인으로 보이는 동작

1. body `targetLevels` 를 무시하고 `targetLevel` 단수만 persist 한다.  
2. 또는 `serviceDetailJson.generalCommonInfo.targetLevels` (`["elementary"]`, BE echo 잔재) 를 우선한다.  
3. persist 후 JSON 루트 `targetLevels` / `program.targetLevels` 까지 1개로 되쓴다.

OpenAPI 계약: `targetLevels` 가 있으면 `targetLevel` 은 **첫 값 미러**일 뿐, 배열을 1개로 줄이면 안 된다.

---

## BE가 할 일

1. `PATCH` / `POST`  
   - body `targetLevels` 가 있으면 **그 배열을 컬럼 SSOT** 로 저장.  
   - `targetLevel` = `targetLevels[0]`.  
   - 빈 배열만 교육 대상 삭제.  
   - `serviceDetailJson` 어디에 1개짜리 `targetLevels` 가 있어도 body 배열을 덮지 마라.

2. Admin GET  
   - top-level `targetLevels` 길이가 PATCH 와 같아야 한다.  
   - JSON을 되쓸 때도 컬럼 배열과 맞출 것.

3. Portal GET  
   - `educationTargets` = Admin `targetLevels` 와 동일 배열.  
   - `educationTarget` = 첫 값(호환). 배열을 만들지 말고 컬럼을 복사하라.

---

## 검수 (186023 또는 동일 재현)

```http
PATCH /api/admin/programs/186023
{ "targetLevels": ["elementary", "middle", "high"], "targetLevel": "elementary" }

GET /api/admin/programs/186023
→ targetLevels == ["elementary", "middle", "high"]

GET /api/portal/programs/186023
→ educationTargets == ["elementary", "middle", "high"]
```

실패: GET 이 `["elementary"]` 만 오면 persist 미구현이다. 스키마에 필드만 있는 것과 같다.

---

## 금지

- `targetLevel` 만 저장하고 `targetLevels` 를 첫 값으로 재생성  
- JSON `generalCommonInfo.targetLevels` 1개로 컬럼을 덮기  
- portal 이 `educationTarget` 단수만 채우고 `educationTargets` 를 `[educationTarget]` 으로 합성  
- FE 매퍼·CMS 화면만 고치라고 되돌리기
