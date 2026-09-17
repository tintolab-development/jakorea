# BE 수정 요청 — 일반 기관형 프로그램 「기관 신청 목록」 navigation 활성 불일치

**작성일:** 2026-09-17  
**우선순위:** P0  
**대상:** Admin CMS 일반 프로그램 상세 풀페이지 LNB  
**대상 API:** `GET /api/admin/programs/{programId}/navigation`  
**적용 범위:** `GENERAL_ORGANIZATION` 및 기관 신청이 허용된 `GENERAL` 프로그램  
**범위 제외:** 일반 개인형·교육받은 교사·1사1교·UJAT·Gemini navigation 정책

## 백엔드 전달용 프롬프트

아래 요구사항에 따라 일반 기관형 프로그램의 **「기관 신청 목록」 navigation 활성 판정과 로컬 Primary seed 데이터를 수정해 주세요.**

현재 CMS FE는 다음 API의 `lnb[].enabled`를 프로그램 상세 LNB 노출의 SSOT로 사용합니다.

```http
GET /api/admin/programs/{programId}/navigation
Authorization: Bearer {adminJwt}
```

백엔드가 `ORGANIZATION_APPLICATIONS.enabled=false`를 반환하면 FE는 「기관 신청 목록」을 숨깁니다. FE가 해당 값을 임의로 무시하지 않으므로, 프로그램 상세의 참여자 유형·모집 설정과 navigation 응답이 반드시 일치해야 합니다.

---

## 1. 실측 현상

### 1.1 대상 프로그램

```text
programId=168001
canonicalProgramType=GENERAL_ORGANIZATION
```

`168001`은 일반 프로그램 Primary Case 1로, 기관과 강사를 모집하는 기관형 프로그램입니다.

상세 seed 및 FE 어댑터 테스트에 정의된 참여자 유형:

```json
{
  "generalProgramAudience": "organization",
  "generalParticipantTypes": [
    "school_institution",
    "teacher_instructor"
  ]
}
```

### 1.2 navigation 실측 응답

2026-09-16 로컬 백엔드와 관리자 JWT로 다음 응답을 확인했습니다.

```json
{
  "programId": 168001,
  "rawProgramType": "GENERAL_ORGANIZATION",
  "canonicalProgramType": "GENERAL_ORGANIZATION",
  "allowedApplicationTargets": [
    "INSTRUCTOR"
  ],
  "disabledApplicationTargets": [
    "VOLUNTEER"
  ],
  "lnb": [
    {
      "key": "ORGANIZATION_APPLICATIONS",
      "label": "참여 기관 신청 정보",
      "enabled": false,
      "reason": "참여자 유형에 포함되지 않아 해당 메뉴를 사용할 수 없습니다."
    },
    {
      "key": "INSTRUCTOR_APPLICATIONS",
      "label": "강사 신청 정보",
      "enabled": true,
      "reason": null
    }
  ]
}
```

### 1.3 불일치

- 프로그램 유형은 `GENERAL_ORGANIZATION`
- 상세의 `generalParticipantTypes`에는 `school_institution` 포함
- Primary Case 1 요구사항은 기관·강사 모집
- 하지만 `allowedApplicationTargets`에는 `ORGANIZATION` 누락
- `ORGANIZATION_APPLICATIONS.enabled=false`
- 비활성 reason도 실제 상세 데이터와 반대
- 결과적으로 CMS 상세에서 「기관 신청 목록」 LNB가 사라짐

**판정:** FE 렌더링 문제가 아니라 백엔드의 navigation 활성 판정 또는 Primary seed의 canonical 모집 데이터 불일치입니다.

---

## 2. 기대 계약

### 2.1 필수 불변식

일반 프로그램에서 기관 신청이 허용되면 다음 값은 항상 함께 일치해야 합니다.

```text
상세 참여자 유형에 school_institution 포함
또는 canonical 기관 모집 설정이 활성

→ allowedApplicationTargets에 ORGANIZATION 포함
→ ORGANIZATION_APPLICATIONS.enabled=true
→ reason=null
```

기관 신청이 실제로 허용되지 않을 때만 다음 응답을 반환해 주세요.

```text
allowedApplicationTargets에 ORGANIZATION 없음
ORGANIZATION_APPLICATIONS.enabled=false
reason에 실제 비활성 근거 포함
```

### 2.2 `168001` 기대 응답

```json
{
  "programId": 168001,
  "rawProgramType": "GENERAL_ORGANIZATION",
  "canonicalProgramType": "GENERAL_ORGANIZATION",
  "allowedApplicationTargets": [
    "ORGANIZATION",
    "INSTRUCTOR"
  ],
  "lnb": [
    {
      "key": "ORGANIZATION_APPLICATIONS",
      "label": "참여 기관 신청 정보",
      "enabled": true,
      "reason": null
    },
    {
      "key": "INSTRUCTOR_APPLICATIONS",
      "label": "강사 신청 정보",
      "enabled": true,
      "reason": null
    },
    {
      "key": "VOLUNTEER_APPLICATIONS",
      "label": "봉사자 신청 정보",
      "enabled": false,
      "reason": "참여자 유형에 포함되지 않아 해당 메뉴를 사용할 수 없습니다."
    }
  ]
}
```

---

## 3. 원인 확인 요청

현재 OpenAPI 설명상 일반 프로그램 navigation은 역할별 canonical `program_recruitment`를 우선 사용하고, 구데이터는 `serviceDetailJson.generalParticipantTypes`를 fallback으로 사용할 수 있습니다.

다음 가능성을 확인해 주세요.

1. `168001`에 강사 모집 row만 있고 기관 모집 row가 누락됨
2. 기관 모집 row는 있으나 역할 또는 대상 enum이 잘못 저장됨
3. 일부 canonical 모집 row가 존재하면 `serviceDetailJson` fallback 전체를 건너뛰는 조기 반환이 있음
4. `GENERAL_ORGANIZATION`을 기관 신청 활성 근거로 사용하지 않음
5. `school_institution`과 `ORGANIZATION` 변환 매핑이 누락되거나 다른 enum으로 비교됨

canonical 모집 row가 SSOT라면 `168001` Primary seed에 기관 모집 row를 반드시 추가해 주세요. Resolver 문제라면 한 역할의 모집 row 존재가 다른 참여자 유형의 fallback을 차단하지 않도록 역할별로 판정해 주세요.

FE가 기대하는 핵심은 특정 저장소 구현이 아니라 다음 응답 불변식입니다.

```text
기관 모집 가능 프로그램
→ ORGANIZATION target와 ORGANIZATION_APPLICATIONS LNB가 모두 활성
```

---

## 4. 구현 요구사항

1. `168001`의 프로그램 상세, `program_recruitment`, navigation 계산 입력값을 함께 확인해 주세요.
2. 기관 모집 가능 여부를 역할별로 독립 계산해 주세요.
3. 강사 모집 row가 있다는 이유로 기관 참여자 유형 fallback을 건너뛰지 마세요.
4. canonical 기관 모집 데이터가 필수라면 Primary 8 로컬 seed에 누락 없이 생성해 주세요.
5. `allowedApplicationTargets`와 `lnb[].enabled`가 같은 판정 결과를 사용하게 해 주세요.
6. `enabled=false`의 reason은 실제 비활성 근거와 일치시켜 주세요.
7. 프로그램 공통정보에서 참여자 유형 또는 모집 설정을 수정한 후 navigation 재조회에 즉시 반영해 주세요.
8. 기존 적용 마이그레이션을 수정하지 말고 필요한 경우 additive migration 또는 seed contributor 수정으로 반영해 주세요.
9. 일반 기관형 수정으로 개인형·교육받은 교사·1사1교·UJAT·Gemini 정책을 변경하지 마세요.

---

## 5. 필수 테스트

- [ ] `168001`: `allowedApplicationTargets`에 `ORGANIZATION`, `INSTRUCTOR` 포함
- [ ] `168001`: `ORGANIZATION_APPLICATIONS.enabled=true`
- [ ] `168001`: CMS 상세에서 「기관 신청 목록」 LNB 노출
- [ ] `school_institution`만 있는 일반 기관형 → 기관 신청 활성, 강사·봉사 신청 비활성
- [ ] `school_institution + teacher_instructor` → 기관·강사 신청 활성
- [ ] `school_institution + volunteer` → 기관·봉사 신청 활성
- [ ] 기관 참여자 유형이 없는 일반 개인형 → 기관 신청 비활성 유지
- [ ] 역할별 canonical 모집 row가 일부만 존재해도 다른 역할의 상세 fallback을 잘못 차단하지 않음
- [ ] 참여자 유형 수정 후 navigation 재조회 → target와 LNB 즉시 갱신
- [ ] `allowedApplicationTargets`와 각 신청 LNB의 활성값이 서로 모순되지 않음
- [ ] 교육받은 교사·1사1교·UJAT·Gemini navigation 회귀 없음

---

## 6. 완료 조건

1. 수정 전 `168001`의 상세·모집 row·navigation 계산 입력을 작업 기록에 남깁니다.
2. 수정 후 동일 ID에서 `ORGANIZATION_APPLICATIONS.enabled=true`가 반환됩니다.
3. `allowedApplicationTargets`에 `ORGANIZATION`이 포함됩니다.
4. 비활성 reason이 제거되어 `null`로 반환됩니다.
5. CMS 상세 새로고침 후 「기관 신청 목록」이 노출되고 목록 API에 진입할 수 있습니다.
6. 일반 기관형 참여자 유형 조합별 단위·통합 테스트가 통과합니다.
7. OpenAPI 예시 또는 필드 설명이 실제 역할별 판정 정책과 일치합니다.

---

## 7. FE 참고

CMS FE는 다음 순서로 「기관 신청 목록」을 노출합니다.

```text
상세 프로그램의 참여자 유형에 school_institution 포함
AND navigation의 ORGANIZATION_APPLICATIONS.enabled가 false가 아님
→ 기관 신청 목록 노출
```

관련 FE:

- `apps/cms/src/features/program/general/hooks/use-general-program-navigation.ts`
- `apps/cms/src/features/program/general/ui/detail-modal/detail-fullpage-modal.tsx`
- `apps/cms/src/features/program/general/lib/detail-meta.ts`

백엔드 수정 후 FE는 기존 navigation query invalidation/refetch 경로로 최신 응답을 반영합니다. 백엔드 불일치를 가리기 위해 `ORGANIZATION_APPLICATIONS.enabled=false`를 무시하는 예외 처리는 추가하지 않습니다.

**Last updated:** 2026-09-17
