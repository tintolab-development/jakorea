# 초상권 수집·이용 동의 — 부분 동의 상태 · 백엔드 전달

**작성일:** 2026-09-10  
**우선순위:** P1  
**요청 대상:** Members API · consent-records · pre-register · 회원 상세 PATCH · Portal/Platform(프로그램 참여 게이트)

이 문서만으로 구현·검수할 수 있다. 다른 핸드오프를 읽지 않아도 된다.

---

## 1. 무엇을 바꾸는가

초상권 수집·이용 동의(`termsType: "PORTRAIT_RIGHTS"`, 양식 코드 `agreement-portrait`)에만 **「부분 동의」**를 추가한다.  
지급조서·교육진행자·행정정보·성범죄·마케팅 등 **다른 약관에는 적용하지 않는다.**

| 상태 | 동의서 항목 조건 | 프로그램 참여 | 회원가입·CMS 등록 |
|------|------------------|---------------|-------------------|
| **전체 동의** (`FULL`) | 항목 1·2·3 **전부** `agree` | 가능 | 가능 |
| **부분 동의** (`PARTIAL`) · 참여 가능 | 항목 **1·2 둘 다** `agree`, 항목 3 `disagree` | 가능 | 가능 |
| **부분 동의** (`PARTIAL`) · 참여 불가 | 항목 **1 또는 2**가 `disagree` | **불가** | 가능 |
| **미동의** (`DISAGREED`) | 약관에서 미동의 · 동의서 미작성 | **불가** | 가능 |

초상권은 **선택 동의**다. 미동의·부분 동의해도 **가입·등록은 막지 않는다.**  
막아야 하는 것은 **프로그램 참여**뿐이다.

현재 API는 `agreed: boolean`만 있어 위 네 경우를 구분할 수 없다.  
아래 `consentStatus` · `programEligible` · (작성 시) `filledDocument`를 추가한다.

---

## 2. 동의서 항목 (고정)

양식 템플릿 코드: `agreement-portrait`  
회원 원장 타입: `PORTRAIT_RIGHTS`

항목은 표 하단 동의 라디오(`bottomConsent`) 3개다. 안내문(intro)은 항목에 넣지 않는다.

| # | 단락 id | 제목 | 값 |
|---|---------|------|-----|
| 1 | `agreement-portrait-personal-consent-table` | 개인정보 및 초상권 수집·이용 동의 | `bottomConsent`: `"agree"` \| `"disagree"` |
| 2 | `agreement-portrait-delegated-consent-table` | 개인정보처리위탁 제공 동의 | 동일 |
| 3 | `agreement-portrait-usage-table` | 초상권 제공·이용 동의 | 동일 |

작성·제출(`FULL` / `PARTIAL`) 시 추가로 필요한 사용자 입력:

| 항목 | 저장 위치 | 규칙 |
|------|-----------|------|
| 성명 | 1번 표 1행 `cells[0]` | 비어 있으면 안 됨 |
| 소속 | 1번 표 1행 `cells[1]` | 텍스트 **또는** 「소속 없음」(셀 값 `"소속 없음"` 등 FE 규약). 둘 다 없으면 안 됨 |

확인 문구·날짜·서명은 draft의 closing / system 단락에 포함해 통째로 저장한다.

---

## 3. 서버 판정 규칙 (SSOT)

저장·조회 시 `filledDocument.schemaJson`(WritingFormDraft)에서 위 3개 단락의 `bottomConsent`를 읽어 **서버가 다시 계산**한다.  
요청의 `consentStatus` / `programEligible`은 힌트다. 불일치 시 4xx 또는 서버값으로 덮어쓴다(§12에서 택1 회신).

```text
item1 = paragraphs[id=agreement-portrait-personal-consent-table].bottomConsent
item2 = paragraphs[id=agreement-portrait-delegated-consent-table].bottomConsent
item3 = paragraphs[id=agreement-portrait-usage-table].bottomConsent

programEligible = (item1 == "agree") AND (item2 == "agree")

consentStatus =
  DISAGREED  → agreed=false, filledDocument 없음 (미작성·약관 거부)
  FULL       → item1·item2·item3 모두 "agree" + 성명·소속 완료
  PARTIAL    → filledDocument 있음 + FULL이 아님
               (1·2·3 중 하나 이상 "disagree")
```

| 결과 `consentStatus` | `programEligible` | 의미 |
|----------------------|-------------------|------|
| `FULL` | `true` | 3항목 전부 동의 |
| `PARTIAL` | `true` | 예: 1·2 동의, 3 비동의 → **프로그램 참여 가능** |
| `PARTIAL` | `false` | 1 또는 2 비동의 → **프로그램 참여 불가** |
| `DISAGREED` | `false` | 미작성·거부 → 참여 불가 |

**프로그램 신청·참여 게이트:** `programEligible == true` 만 통과.  
`agreed == true` 만으로 열거나 막으면 안 된다.

**가입·등록:** `PORTRAIT_RIGHTS`는 `required: false`.  
`DISAGREED` / `PARTIAL` / `FULL` 모두 등록 허용.  
(필수 약관은 서비스 이용약관·개인정보 수집·이용 등 기존 규칙 그대로. 이 문서 범위 밖.)

---

## 4. 현재 → 변경 후 `agreed` 의미 (`PORTRAIT_RIGHTS`만)

| | `agreed` |
|--|----------|
| **이전** | `true` ≈ 항목 전부 동의(사실상 FULL만) |
| **이후** | `true` = 동의서 **작성·제출 완료** (`FULL` **또는** `PARTIAL`) |
| | `false` = `DISAGREED` (미작성·거부) |

다른 `termsType`의 `agreed`는 바꾸지 않는다.

---

## 5. API 필드

### 5.1 요청 바디 — `termsAgreements[]` 원소 (`TermsAgreementRequest`)

`PORTRAIT_RIGHTS`일 때:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `termsType` | `"PORTRAIT_RIGHTS"` | Y | |
| `version` | string | Y | 약관 버전 |
| `required` | boolean | N | 클라이언트 힌트. 서버가 선택 항목으로 재판정 |
| `agreed` | boolean | Y | §4. 작성 제출 완료면 true |
| `consentStatus` | `"FULL"` \| `"PARTIAL"` \| `"DISAGREED"` | Y | 힌트. 서버 재검증 |
| `programEligible` | boolean | Y | 힌트. 서버 재계산 |
| `filledDocument` | object | `FULL`/`PARTIAL` **필수**, `DISAGREED` **생략** | 아래 §5.3 |

다른 `termsType`에 `consentStatus` / `programEligible`이 오면 **무시**하거나 null 취급.

### 5.2 응답 — 회원 상세 `termsAgreements[]` · `consent-records`

요청과 동일한 의미의 필드를 내려준다.

| 필드 | 설명 |
|------|------|
| `agreed` | §4 |
| `agreedAt` | 작성 제출 시각 (`FULL`/`PARTIAL`). `DISAGREED`면 없거나 null |
| `consentStatus` | `FULL` \| `PARTIAL` \| `DISAGREED` |
| `programEligible` | boolean |
| 작성본 조회 | 기존 filledDocument / reveal 방식 유지. `schemaJson`에 제출 시점 WritingFormDraft 전체 |

UI 라벨 매핑:

| `consentStatus` | 화면 |
|-----------------|------|
| `FULL` | 동의 |
| `PARTIAL` | 부분 동의 |
| `DISAGREED` | 미동의 |

부분 동의 시 선택적으로 `programEligible`에 따라 「프로그램 참여 가능/불가」 보조 문구.

### 5.3 `filledDocument` 구조

```json
{
  "templateCode": "agreement-portrait",
  "schemaJson": {
    "schemaVersion": 1,
    "formSettings": {},
    "paragraphs": [ /* WritingFormDraft 전체. 아래 3개 단락의 bottomConsent 필수 */ ]
  }
}
```

- `schemaJson`은 **object**로 주고, DB 저장 시 JSON 문자열로 직렬화한다(이중 stringify 금지).
- answers map만 저장하지 말고, 보기 복원이 되도록 **작성 완료 시점 draft 전체**를 권장한다.
- 최소 검증에 필요한 것은 §2의 세 단락 `id` + `bottomConsent` + 성명·소속 셀이다.

### 5.4 적용 API

| Method | Path |
|--------|------|
| `POST` | `/api/admin/users/pre-register/individual` |
| `POST` | `/api/admin/users/pre-register/instructor` |
| `PATCH` | 회원 기본정보 (`termsAgreements` 포함 시) |
| `GET` | `/api/admin/users/{id}` 및 consent-records (응답에 신필드) |
| Portal 등 | 가입·마이페이지·프로그램 신청 시 동의 조회 → `programEligible`로 게이트 |

---

## 6. 요청 예시

### 6.1 전체 동의

```json
{
  "termsType": "PORTRAIT_RIGHTS",
  "version": "2026-01",
  "required": false,
  "agreed": true,
  "consentStatus": "FULL",
  "programEligible": true,
  "filledDocument": {
    "templateCode": "agreement-portrait",
    "schemaJson": {
      "schemaVersion": 1,
      "formSettings": {},
      "paragraphs": [
        {
          "id": "agreement-portrait-personal-consent-table",
          "bottomConsent": "agree"
        },
        {
          "id": "agreement-portrait-delegated-consent-table",
          "bottomConsent": "agree"
        },
        {
          "id": "agreement-portrait-usage-table",
          "bottomConsent": "agree"
        }
      ]
    }
  }
}
```

### 6.2 부분 동의 — 프로그램 참여 가능 (1·2 동의, 3 비동의)

```json
{
  "termsType": "PORTRAIT_RIGHTS",
  "version": "2026-01",
  "required": false,
  "agreed": true,
  "consentStatus": "PARTIAL",
  "programEligible": true,
  "filledDocument": {
    "templateCode": "agreement-portrait",
    "schemaJson": {
      "schemaVersion": 1,
      "formSettings": {},
      "paragraphs": [
        {
          "id": "agreement-portrait-personal-consent-table",
          "bottomConsent": "agree"
        },
        {
          "id": "agreement-portrait-delegated-consent-table",
          "bottomConsent": "agree"
        },
        {
          "id": "agreement-portrait-usage-table",
          "bottomConsent": "disagree"
        }
      ]
    }
  }
}
```

### 6.3 부분 동의 — 프로그램 참여 불가 (1 비동의)

```json
{
  "termsType": "PORTRAIT_RIGHTS",
  "version": "2026-01",
  "required": false,
  "agreed": true,
  "consentStatus": "PARTIAL",
  "programEligible": false,
  "filledDocument": {
    "templateCode": "agreement-portrait",
    "schemaJson": {
      "schemaVersion": 1,
      "formSettings": {},
      "paragraphs": [
        {
          "id": "agreement-portrait-personal-consent-table",
          "bottomConsent": "disagree"
        },
        {
          "id": "agreement-portrait-delegated-consent-table",
          "bottomConsent": "agree"
        },
        {
          "id": "agreement-portrait-usage-table",
          "bottomConsent": "agree"
        }
      ]
    }
  }
}
```

### 6.4 미동의

```json
{
  "termsType": "PORTRAIT_RIGHTS",
  "version": "2026-01",
  "required": false,
  "agreed": false,
  "consentStatus": "DISAGREED",
  "programEligible": false
}
```

---

## 7. 검증 · 오류

| 조건 | 기대 |
|------|------|
| `FULL` 또는 `PARTIAL`인데 `filledDocument` 없음 | 4xx |
| `DISAGREED`인데 `filledDocument` 있음 | 무시 또는 4xx (§12 택1) |
| schema로 계산한 status ≠ 요청 `consentStatus` | 4xx 또는 서버 덮어쓰기 (§12 택1) |
| `FULL`인데 item3 ≠ `"agree"` | 4xx |
| `programEligible: true`인데 item1 또는 item2 ≠ `"agree"` | 4xx |
| item1·2·3 모두 `"agree"`인데 `PARTIAL`로 옴 | `FULL`로 정규화 권장 |
| `FULL`/`PARTIAL`인데 성명 또는 소속(소속 없음) 미완 | 4xx |

---

## 8. 기존 데이터 마이그레이션

| 기존 행 | 정규화 |
|---------|--------|
| `agreed: true` + filledDocument + 3항목 모두 agree | `FULL`, `programEligible: true` |
| `agreed: true` + filledDocument + 1·2 agree · 3 disagree | `PARTIAL`, `programEligible: true` |
| `agreed: true` + filledDocument + 1 또는 2 disagree | `PARTIAL`, `programEligible: false` |
| `agreed: false`, filledDocument 없음 | `DISAGREED`, `programEligible: false` |
| `agreed: true`, filledDocument **없음**(구 등록) | §12에서 택1 회신. 후보: `FULL`+eligible true / 또는 불명 처리 |

OpenAPI에는 필드를 optional로 넣고, 배포 후 FE가 전송·표시한다.

---

## 9. 하지 말 것

- `agreed` boolean만으로 부분 동의 표현
- 항목 1·2·3을 별도 `termsType` 세 개로 분리
- `PARTIAL`을 `filledDocument` 없이 상태만 저장
- 프로그램 게이트를 `agreed == true`에만 연결
- 다른 동의 유형에 `consentStatus` 확장

---

## 10. FE에서 할 일 (BE 범위 밖 · 참고)

- 동의서 작성: 3항목 중 일부 `disagree`여도 제출 가능(성명·소속·각 항목 선택 완료 시)
- 등록·상세·가입 UI: `FULL` / `PARTIAL` / `DISAGREED` 표시
- 프로그램 신청: `programEligible`로 참여 제한

---

## 11. 수락 기준 (BE)

- [ ] OpenAPI에 `consentStatus`, `programEligible` 추가 (`PORTRAIT_RIGHTS`)
- [ ] §6 네 케이스 pre-register · 상세 PATCH 저장 성공
- [ ] GET `termsAgreements` / consent-records에 동일 필드 반환
- [ ] 서버가 `schemaJson`의 `bottomConsent`로 status·eligible 재검증
- [ ] 프로그램 참여 판정이 `programEligible`(또는 동등 서버 로직) 사용
- [ ] 기존 `agreed: true` 데이터 읽기 시 정규화(또는 마이그레이션)
- [ ] 다른 `termsType` 회귀 없음

---

## 12. 회신 요청

1. 필드명·enum(`FULL` / `PARTIAL` / `DISAGREED`) 확정 여부  
2. FE 힌트와 서버 재계산 불일치 시 **4xx** vs **덮어쓰기**  
3. `DISAGREED` + `filledDocument` 동시 전송 시 처리  
4. filledDocument 없는 구 `agreed: true` 행 정규화 정책  
5. 반영 브랜치·예상 일정  

**Last updated:** 2026-09-10
