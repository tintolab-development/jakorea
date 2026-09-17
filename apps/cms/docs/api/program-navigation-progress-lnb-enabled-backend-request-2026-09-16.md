# BE 수정 요청 — 프로그램 상세 「프로그램 진행 현황」 navigation 활성 정책

**작성일:** 2026-09-16
**대상:** Admin CMS 프로그램 상세 풀페이지 LNB
**대상 API:** `GET /api/admin/programs/{programId}/navigation`
**적용 범위:** 일반 프로그램·교육받은 교사·1사1교의 프로그램 상세 navigation
**범위 제외:** UJAT·Gemini 전용 상세 navigation 구조 및 각 진행 현황 하위 기능 API

## 백엔드 전달용 프롬프트

아래 요구사항에 따라 프로그램 상세 풀페이지의 **「프로그램 진행 현황」 LNB 활성 정책과 navigation 응답을 점검·수정해 주세요.**

현재 CMS FE는 다음 API의 `lnb[].enabled`를 화면 LNB 노출의 SSOT로 사용합니다.

```http
GET /api/admin/programs/{programId}/navigation
Authorization: Bearer {adminJwt}
```

최근 FE가 OpenAPI의 SCREAMING_SNAKE 키를 정식으로 인식하도록 변경되면서 다음 키가 `enabled: false`이면 「프로그램 진행 현황」 카테고리가 숨겨집니다.

```text
PROGRAM_EXECUTION
```

FE에는 호환 목적으로 다음 하위 기능 키도 같은 진행 현황 그룹으로 매핑되어 있습니다.

```text
EDUCATION_JOURNAL
STUDENT_ROSTER
```

따라서 백엔드가 상위 카테고리와 하위 기능의 활성 의미를 구분하지 않거나 서로 모순된 값을 반환하면, 일부 하위 기능만 비활성인 프로그램에서도 「프로그램 진행 현황」 LNB 전체가 사라질 수 있습니다.

---

## 1. 현상과 확인할 응답

### 1.1 화면 현상

1. CMS에서 프로그램 상세 풀페이지를 연다.
2. 기존에 노출되던 「프로그램 진행 현황」 LNB 카테고리가 보이지 않는다.
3. FE는 프로그램 자체의 진행 데이터 유무만으로 해당 카테고리를 임의 노출하지 않고 navigation 응답을 따른다.

### 1.2 백엔드 확인 절차

현상이 발생한 프로그램 ID로 다음 두 API를 함께 확인해 주세요.

```http
GET /api/admin/programs/{programId}
GET /api/admin/programs/{programId}/navigation
```

navigation 응답에서 최소한 다음 항목을 확인해야 합니다.

```json
{
  "programId": 0,
  "rawProgramType": "PROGRAM_TYPE",
  "canonicalProgramType": "PROGRAM_TYPE",
  "lnb": [
    {
      "key": "PROGRAM_EXECUTION",
      "label": "프로그램 진행 현황",
      "enabled": false,
      "reason": "..."
    }
  ]
}
```

다음 조건이면 백엔드 navigation 정책 오류로 판정합니다.

- 참여 기관·참여자·참여 강사·참여 봉사자·출석·과제·게시글·교육일지·학생 명단 중 하나 이상 사용할 수 있는데 `PROGRAM_EXECUTION.enabled=false`
- `PROGRAM_EXECUTION.enabled=false`인데 진행 현황 하위 기능 키 중 하나 이상은 `enabled=true`
- 상세 GET의 프로그램 유형·참여자 유형·진행 구조상 진행 현황 대상인데 navigation만 비활성
- `enabled=false`의 `reason`이 실제 비활성 근거와 일치하지 않음

---

## 2. 기대 navigation 계약

### 2.1 상위 카테고리의 canonical 키

「프로그램 진행 현황」 상위 LNB의 canonical 키는 다음으로 고정해 주세요.

```text
PROGRAM_EXECUTION
```

`EDUCATION_JOURNAL`, `STUDENT_ROSTER`는 상위 카테고리 자체가 아니라 **하위 기능 capability**로 취급해 주세요. 해당 하위 기능 하나가 비활성이라는 이유만으로 `PROGRAM_EXECUTION`까지 비활성화하면 안 됩니다.

### 2.2 활성 계산

`PROGRAM_EXECUTION.enabled`는 다음 규칙을 따라야 합니다.

```text
프로그램 진행 현황에서 사용할 수 있는 하위 기능이 하나 이상 존재
AND 현재 관리자가 해당 프로그램 상세를 조회할 수 있음
→ PROGRAM_EXECUTION.enabled = true
```

하위 기능 예시는 프로그램 유형에 따라 다음과 같습니다.

- 참여 기관 또는 참여자
- 참여 강사
- 참여 봉사자
- 출석 관리
- 과제 관리
- 게시글
- 교육일지
- 학생 명단

프로그램 유형상 적용되지 않는 하위 기능은 개별적으로 `enabled=false`일 수 있습니다. 그러나 다른 하위 기능이 하나라도 사용 가능하면 상위 `PROGRAM_EXECUTION`은 `enabled=true`여야 합니다.

### 2.3 비활성 계산

다음과 같이 진행 현황에 속한 기능을 **전부 사용할 수 없을 때만** 상위 카테고리를 비활성화해 주세요.

```text
모든 진행 현황 하위 기능 사용 불가
→ PROGRAM_EXECUTION.enabled = false
```

이 경우 `reason`에는 실제 사유를 반환해 주세요.

```json
{
  "key": "PROGRAM_EXECUTION",
  "label": "프로그램 진행 현황",
  "enabled": false,
  "reason": "현재 프로그램 유형에서 사용할 수 있는 진행 현황 기능이 없습니다."
}
```

권한 문제로 비활성화하는 정책이라면 프로그램 정책 문제와 구분되는 reason 또는 구조화된 reason code를 사용해 주세요. 단, 프로그램 상세 조회 자체가 허용된 관리자에게 단순히 쓰기 권한이 없다는 이유로 조회용 진행 현황 LNB까지 숨기지 마세요.

### 2.4 응답 일관성

상위와 하위 키를 함께 반환한다면 다음 불변식을 지켜 주세요.

```text
하위 기능 중 enabled=true가 하나 이상
→ PROGRAM_EXECUTION.enabled=true

PROGRAM_EXECUTION.enabled=false
→ 모든 진행 현황 하위 기능 enabled=false
```

권장 응답:

```json
{
  "programId": 170000,
  "rawProgramType": "GENERAL_ORGANIZATION",
  "canonicalProgramType": "GENERAL_ORGANIZATION",
  "lnb": [
    {
      "key": "PROGRAM_EXECUTION",
      "label": "프로그램 진행 현황",
      "enabled": true
    },
    {
      "key": "EDUCATION_JOURNAL",
      "label": "교육일지",
      "enabled": true
    },
    {
      "key": "STUDENT_ROSTER",
      "label": "학생 명단",
      "enabled": false,
      "reason": "현재 프로그램 유형에서는 학생 명단을 사용하지 않습니다."
    }
  ]
}
```

위 응답에서는 `STUDENT_ROSTER`가 비활성이어도 `PROGRAM_EXECUTION`과 교육일지가 활성 상태이므로 상위 LNB가 노출되어야 합니다.

---

## 3. 프로그램 유형별 회귀 방지

navigation 정책을 수정할 때 한 유형의 기준을 다른 유형에 일괄 적용하지 마세요.

### 일반 프로그램

- 상세에 영속된 참여자 유형과 프로그램 대분류를 기준으로 진행 현황 하위 기능을 계산
- 기관형과 개인형의 진행 현황 구성이 다를 수 있음
- 적용 가능한 참여 대상이 하나 이상이면 상위 진행 현황을 활성화

### 교육받은 교사

- 기관 신청 승인 후 참여 기관 및 교육일지 조회 흐름이 존재하면 상위 진행 현황을 활성화
- 학생 명단 등 일부 하위 기능이 없더라도 전체 진행 현황을 비활성화하지 않음

### 1사1교

- 참여 기관·참여 강사 진행 현황을 기준으로 활성화
- 1사1교에 존재하지 않는 봉사자·과제 기능을 활성 조건으로 요구하지 않음

### UJAT·Gemini

- 전용 상세와 LNB 계약이 분리되어 있으므로 이번 수정으로 기존 navigation 키·활성 정책을 변경하지 않음

---

## 4. 구현 요구사항

1. `PROGRAM_EXECUTION` 활성 계산 위치와 입력값을 확인해 주세요.
2. 하위 기능 중 하나의 비활성 값을 상위 카테고리 비활성으로 그대로 전파하는 `AND` 조건 또는 조기 반환이 있으면 제거해 주세요.
3. 프로그램 유형별 적용 가능한 하위 기능 목록을 먼저 계산한 뒤, 그중 하나 이상 사용 가능하면 상위를 활성화해 주세요.
4. 상위 `PROGRAM_EXECUTION`과 하위 capability 응답이 모순되지 않도록 단위 테스트를 추가해 주세요.
5. 프로그램 상세 수정 후 navigation을 다시 조회하면 최신 프로그램 유형·참여자 유형·진행 설정이 반영되도록 해 주세요.
6. OpenAPI의 `MenuItem.key`, `enabled`, `reason` 설명에 상위 카테고리와 하위 capability의 의미를 명시해 주세요.
7. 기존 적용 마이그레이션이나 운영 데이터를 임의 변경하지 말고 정책 계산 로직을 수정해 주세요.

---

## 5. 필수 테스트

- [ ] 진행 현황 하위 기능이 하나 이상 활성인 일반 기관형 프로그램 → `PROGRAM_EXECUTION.enabled=true`
- [ ] 진행 현황 하위 기능이 하나 이상 활성인 일반 개인형 프로그램 → `PROGRAM_EXECUTION.enabled=true`
- [ ] 교육일지는 활성, 학생 명단은 비활성 → `PROGRAM_EXECUTION.enabled=true`
- [ ] 학생 명단은 활성, 교육일지는 비활성 → `PROGRAM_EXECUTION.enabled=true`
- [ ] 모든 진행 현황 하위 기능이 비활성 → `PROGRAM_EXECUTION.enabled=false`와 정확한 `reason`
- [ ] 교육받은 교사에서 참여 기관 또는 교육일지 사용 가능 → `PROGRAM_EXECUTION.enabled=true`
- [ ] 1사1교에서 참여 기관 또는 참여 강사 사용 가능 → `PROGRAM_EXECUTION.enabled=true`
- [ ] 쓰기 권한만 없는 조회 가능 관리자 → 조회용 `PROGRAM_EXECUTION`은 숨기지 않음
- [ ] 프로그램 유형 또는 참여자 유형 수정 후 navigation 재조회 → 최신 활성 정책 반영
- [ ] UJAT·Gemini 전용 LNB 응답 및 화면에 회귀 없음

---

## 6. 완료 조건

1. 현상이 발생한 실제 프로그램 ID의 수정 전 navigation 응답을 테스트 또는 작업 기록에 남긴다.
2. 수정 후 동일 프로그램에서 `PROGRAM_EXECUTION.enabled=true`가 반환된다.
3. CMS 상세 새로고침 후 「프로그램 진행 현황」 LNB가 다시 노출된다.
4. 일부 하위 기능이 비활성이어도 사용 가능한 다른 진행 현황 기능으로 진입할 수 있다.
5. 진행 현황 전체가 실제로 적용되지 않는 프로그램에서만 LNB가 숨겨진다.
6. 프로그램 유형별 단위·통합 테스트와 OpenAPI 계약이 함께 반영된다.

---

## 7. FE 참고

CMS FE는 navigation 응답을 다음과 같이 소비합니다.

- `PROGRAM_EXECUTION` → `progress`
- `enabled=false` → 해당 LNB 비노출
- 일반 프로그램 상세는 진행 현황의 하위 메뉴가 모두 제거되면 상위 「프로그램 진행 현황」도 렌더하지 않음

백엔드가 위 계약을 만족한 뒤에도 동일 현상이 남으면 FE에서 여러 navigation 키를 하나의 LNB로 집계하는 로직을 별도로 보강할 예정입니다. 백엔드 오류를 가리기 위해 FE가 `enabled=false`를 무조건 무시하도록 변경하지는 않습니다.

**Last updated:** 2026-09-16
