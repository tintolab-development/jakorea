# BE 수정 요청 (2026-09-30) — 단독 문서

**작성일:** 2026-09-30  
**우선순위:** P0  
**문서 성격:** **이 파일만** 보고 구현·검수 가능.  
**대상 API:** `PATCH /api/admin/programs/{programId}` (수정만 깨짐) · `GET /api/admin/programs/{programId}` · `GET /api/portal/programs/{programId}`  
**정상:** `POST /api/admin/programs` 신규 등록 — `targetLevels` 1개 이상이 컬럼·GET에 그대로 남음  
**재현 ID:** `186037` (`GENERAL_INDIVIDUAL`, 일정 복수2). 이전 관측 `186023` 도 동일 PATCH persist  
**비대상:** portal FE 매퍼. platform은 Portal `educationTargets` 배열을 그대로 표시한다.

---

## 적용 범위 (유형)

**이 문서의 실측·검수 ID는 일반 프로그램만이다.** `186037` / `186023` = `GENERAL_INDIVIDUAL`.

같은 Admin API (`PATCH /api/admin/programs/{id}` body `targetLevels` → 컬럼) 를 쓴다. persist 가 `programType` 과 무관한 공통 핸들러라면 **컬럼을 쓰는 다른 유형도 같은 구멍**이다. 아래는 유형별 상태.

| 유형 | 이 문서 실측 | `targetLevels` PATCH | 비고 |
|---|---|---|---|
| **일반** (`GENERAL_*`) | **있음** | 보냄 | CMS는 모집 라벨, Platform은 Portal `educationTargets`(컬럼). 증상 확정 |
| **교육받은 교사** | 없음 | 보냄 | 같은 컬럼. 모집 교육 대상 수정 있음. GET 대조는 이 문서에 없음 |
| **1사1교** | 없음 | 보냄 | 같은 컬럼. GET 대조 없음 |
| **UJAT** | 없음 | 보냄 (기관 모집 overlay + top-level) | 같은 컬럼. GET 대조 없음. 봉사자 대상은 `volunteerTargets` 별도 |
| **Gemini** | 없음 (이 문서) | 보냄 | **별도 관측:** `stampTargetLevels(첫 값만)` 로 복수가 1개로 줄어듦 — `gemini-recruitment-patch-invalid-value-instant-backend-prompt-2026-09-30.md` |

**BE 구현:** `PATCH` 가 body `targetLevels` 를 컬럼에 쓰는 수정은 **일반만 특수 분기하지 말 것.** 공통 persist 를 `POST` 와 같게 맞추면 된다.  
**검수 최소:** 일반 `186037` (이 문서). 다른 유형은 같은 PATCH 후 GET `targetLevels` 가 body 와 같은지만 확인하면 된다. Gemini 는 위 별도 문서의 복수 유지 검수도 볼 것.

---

## 핵심 요구 (한 줄)

**수정 PATCH** body `targetLevels` 배열을 신규 등록과 같이 **그대로 컬럼에 저장**하고, Admin GET `targetLevels` · Portal GET `educationTargets` 에 **같은 배열**을 내려라.  
CMS 모집 라벨만 바뀌고 컬럼이 생성 당시 값에 남으면 Platform 이 옛 대상을 보여 준다.  
신규 등록(`POST`)은 이미 1개 이상이 정상 저장된다. 그 경로를 깨지 말고 **PATCH만** 맞춰라.

---

## 현재 장애 (실측 2026-09-30 · 186037)

**신규 등록은 정상.** `POST` 시 `targetLevels` 가 1개 이상이면 컬럼에 그대로 남는다.  
186037 생성 값: 대학(원)생 + 초등학교 → `["university", "elementary"]`.

**수정만 실패.** 교육 대상을 **초등학교만** 으로 줄여 저장했다.

| 위치 | 값 | 화면 |
|---|---|---|
| `participantRecruitmentInfo.educationTarget` | `"초등학교"` | **CMS는 초등학교만** |
| Admin GET `targetLevels` | `["university", "elementary"]` | |
| Admin GET `targetLevel` | `"university"` | |
| `serviceDetailJson` 루트·`program.targetLevels` | `["university", "elementary"]` | |
| overlay `recruit.targetLevels` / `recruit.individual.targetLevels` | `["university", "elementary"]` | |
| Portal `educationTargets` (컬럼 복사) | 생성 당시 2개 | **Platform은 대학(원)생 + 초등학교** |

Admin GET 발췌 (186037):

```json
{
  "targetLevel": "university",
  "targetLevels": ["university", "elementary"]
}
```

같은 GET `serviceDetailJson.generalCommonInfo.participantRecruitmentInfo`:

```json
{
  "educationTarget": "초등학교",
  "recruitmentTarget": "초등학교",
  "educationTargetDetail": "대학교 1~2학년, 초등학교 4~6학년"
}
```

**결론:** 생성 배열은 컬럼에 남고, 수정은 모집 한글 라벨만 바뀐다. Platform 은 컬럼을 읽으므로 초기값(대학+초등)이 그대로다. CMS 는 라벨을 읽으므로 초등학교만 보인다. `POST` 와 `PATCH` persist 가 다르다.

이전 `186023` 은 반대로 PATCH 에 3개를 보냈는데 GET 컬럼이 1개로 줄어든 관측이다. 방향만 다르고 **PATCH 가 body `targetLevels` 를 컬럼 SSOT 로 쓰지 않는다** 는 점은 같다.

---

## 원인으로 보이는 동작

생성 `POST` 는 body `targetLevels` 를 컬럼에 쓴다. **PATCH 만** 아래 중 하나로 새 배열을 버린다.

1. body `targetLevels` 를 무시하고 기존 컬럼(또는 `targetLevel` 단수)을 유지한다.  
2. 또는 `serviceDetailJson.generalCommonInfo.targetLevels` / 모집 라벨과 다른 위치의 옛 배열을 우선한다.  
3. 모집 라벨(`educationTarget`)만 갱신하고 컬럼·Portal 은 생성 값을 그대로 둔다.

OpenAPI 계약: `targetLevels` 가 있으면 `targetLevel` 은 **첫 값 미러**일 뿐. `POST` 와 `PATCH` 의 `targetLevels` persist 는 같아야 한다.

---

## BE가 할 일

1. `PATCH` (필수)  
   - body `targetLevels` 가 있으면 **그 배열을 컬럼 SSOT** 로 저장. `POST` 신규 등록과 동일.  
   - 축소(`[elementary]`)·확대(`[elementary","middle","high"]`) 모두 컬럼을 **요청 배열로 교체**.  
   - `targetLevel` = `targetLevels[0]`.  
   - 빈 배열만 교육 대상 삭제.  
   - `serviceDetailJson` 어디에 옛 `targetLevels` 가 있어도 body 배열을 덮지 마라.

2. `POST`  
   - 현재처럼 1개 이상 배열 persist 를 **유지**. PATCH 수정이 POST 동작을 깨면 안 된다.

3. Admin GET  
   - top-level `targetLevels` 길이와 원소가 **방금 PATCH 한 배열**과 같아야 한다.  
   - JSON 루트 / `program.targetLevels` / overlay `recruit.*targetLevels` 도 컬럼과 맞출 것.

4. Portal GET  
   - `educationTargets` = Admin `targetLevels` 와 동일 배열.  
   - `educationTarget` = 첫 값(호환). 생성 당시 배열을 다시 합성하지 마라.

---

## 검수 (186037 또는 동일 재현)

생성은 이미 통과해야 한다.

```http
POST /api/admin/programs
{ "targetLevels": ["university", "elementary"], "targetLevel": "university", … }

GET /api/admin/programs/{newId}
→ targetLevels == ["university", "elementary"]
```

수정이 검수 본건이다. 대학+초등 → 초등만.

```http
PATCH /api/admin/programs/186037
{ "targetLevels": ["elementary"], "targetLevel": "elementary" }

GET /api/admin/programs/186037
→ targetLevels == ["elementary"]
→ targetLevel == "elementary"

GET /api/portal/programs/186037
→ educationTargets == ["elementary"]
```

CMS 모집 라벨 `educationTarget` 과 Platform `educationTargets` 가 **같아야** 한다.  
실패: PATCH 직후 Admin `targetLevels` 가 생성 값 `["university","elementary"]` 이거나, Portal 만 옛 배열이면 persist 미구현.  
회귀: PATCH 고친 뒤 `POST` 1개 이상 등록이 1개로 줄면 실패.

---

## 금지

- `targetLevel` 만 저장하고 `targetLevels` 를 첫 값으로 재생성  
- 생성 당시 컬럼을 유지한 채 모집 라벨만 갱신  
- JSON `generalCommonInfo.targetLevels` 옛 배열로 컬럼을 덮기  
- portal 이 생성 값 또는 `educationTarget` 단수로 `educationTargets` 를 합성  
- FE 매퍼·CMS 화면만 고치라고 되돌리기  
- 생성 `POST` persist 를 바꿔서 신규 복수 등록을 깨기
