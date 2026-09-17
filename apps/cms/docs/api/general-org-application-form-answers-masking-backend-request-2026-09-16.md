# BE 요청 — 일반 기관 신청 상세 form answers 마스킹으로 UI 빈칸

**작성일:** 2026-09-16  
**관련 FE:** `general-org-application-detail-form-seed-frontend-handoff-2026-09-16.md`  
**증상:** CMS 참여 기관 신청 상세에서 **관리자 코멘트는 표시**되나 교재명·학년·소재지·안내 4항·성범죄 등 form 기반 필드가 전부 `-`

---

## 재현 (Case4 부산 미래고)

1. `GET /api/admin/comments?targetType=ORGANIZATION_APPLICATION&targetId=1691183` → seed 코멘트 **정상**
2. `GET /api/admin/form-responses?programId=168004&contextType=ORGANIZATION_APPLICATION&contextId=1691183` → item 존재(추정)
3. `GET /api/admin/form-responses/{id}` → `answers[]`에 **questionKeySnapshot은 있으나** `answerDisplayText` / `answerValueJson` 이 **null**

FE는 answers를 hydrate 하나, 값이 null이면 `-`로 남는다. 코멘트만 채워진 화면과 일치.

---

## 원인 (BE 계약 불일치)

핸드오프는 일반 GET detail의 answers를 SoT로 안내한다.

실제 `FormResponseAdminService.getResponse` → `FormResponsePrivacyService.maskResponse` → `filterAnswers(..., access=null)`:

| `pii_category` (question 메타) | `mayReveal(access=null)` |
|---|---|
| `NONE` / `PUBLIC` / `NON_PII` | ✅ 노출 |
| `ADDRESS` 등 GENERAL | ❌ 숨김 (`privacy-detail` 필요) |
| **null / 미분류** | ❌ **RESTRICTED** 취급 → 숨김 |

Org nested seed `upsertFormAnswer`는 `question_id`를 넣지 않는다.

```sql
LEFT JOIN form_question q ON q.id = a.question_id ...
-- question_id NULL → pii_category NULL → RESTRICTED → 값 null
```

또한 seed `form_response` INSERT에 `template_version_id`가 없으면 question 조인이 실패한다.

`privacy-detail`로도 RESTRICTED는 `SENSITIVE_PII_READ`(또는 MASTER) 없으면 계속 null이다.  
신청 상세의 교재명·학년·안내 문구는 민감 PII가 아니므로 **일반 GET에서 보여야** 한다.

---

## 요청 (택1 이상)

### A. Seed 수정 (권장, QA 즉시)

`GeneralPrimaryOrganizationNestedSeedWriter.upsertFormAnswer`에서:

1. template version + `form_question`을 questionKey로 resolve해 **`question_id` 세팅**
2. 해당 질문 `pii_category`를 **`NON_PII` / `PUBLIC` / `NONE`** 로 두기  
   (textbookName, applicationGrade, organizationRegion, addressDetail, applicationReason, otherRequests, computerAvailability, waitingAreaGuide, mealGuide, otherNotes, sex-offense 제출 문구, desiredEducationDate 등 **신청 상세 표시용 키**)
3. `form_response.template_version_id` seed

### B. Admin GET 정책 조정 (신청 context)

`context_type IN (ORGANIZATION_APPLICATION, INSTRUCTOR_APPLICATION, VOLUNTEER_APPLICATION)` 이고  
표시용 NON_PII 키(또는 `pii_category` null이 아닌 PUBLIC류)는 **mask 없이** answers 값을 반환.

미분류(null)를 RESTRICTED로 올리는 기본값은 유지하되, **신청 템플릿 키 allowlist**는 PUBLIC 취급.

### C. (비권장) FE가 매번 privacy-detail

신청 상세 진입마다 사유·감사로그·`SENSITIVE_PII_READ`가 필요해 핸드오프·UX와 맞지 않음.

---

## FE 수용 기준 (BE 반영 후)

```text
GET .../form-responses/{id}
→ answers 중 textbookName 등의 answerDisplayText 가 non-null
→ CMS 기관 신청 상세 해당 필드 `-` 아님
```

코멘트 API는 현행 유지 (`GET /api/admin/comments`).

---

## 참고 코드

- `FormAnswerDisclosurePolicy.mayReveal` / `classify`
- `FormResponsePrivacyService.filterAnswers`
- `GeneralPrimaryOrganizationNestedSeedWriter.upsertFormAnswer` / `seedOrganizationApplicationForm`
