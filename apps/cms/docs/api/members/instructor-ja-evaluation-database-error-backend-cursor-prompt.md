# Cursor prompt — JA 등급 평가 POST `DATABASE_ERROR` (`memberId=171003`)

> 작성: 2026-09-11 · FE(CMS)  
> 대상: JA Korea CMS Java Backend (Instructors / JA evaluation · DB · seed · OpenAPI)  
> FE: `apps/cms` 회원/권한 상세 → **JA 등급 평가지** → 완료  
> 재현: `POST /api/admin/instructors/171003/ja-evaluation`  
> OpenAPI: `submitJaEvaluation` / `InstructorJaEvaluationInput`  
> 관련(이전): `instructor-ja-grade-policy-not-initialized-backend-cursor-prompt.md`  
>   — 이번 건은 `INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED`가 **아님**. `DATABASE_ERROR`.

아래 **「프롬프트 (복사용)」** 코드펜스 안 전체를 백엔드 Cursor/담당자에게 그대로 전달하면 된다.

---

## FE에서 확인한 것 (2026-09-11)

| 항목 | 내용 |
|------|------|
| 증상 | JA 등급 평가 완료 시 실패 |
| HTTP | `POST /api/admin/instructors/171003/ja-evaluation` |
| Body | OpenAPI `InstructorJaEvaluationInput` 4항목(1~5) — FE 스키마와 일치 |
| 응답 | `success: false`, `error.code: DATABASE_ERROR` |
| message | `데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.` |
| traceId | `eee3a9a18bb34da68aa8c353686b03f2` |
| field / details | `null` |
| 결론 | **FE 페이로드 버그 아님.** 서버 내부 DB/persist 실패를 공통 `DATABASE_ERROR`로 래핑한 상태 |

### 요청 body (FE 실측)

```json
{
  "contentExpertiseScore": 2,
  "deliveryImmersionScore": 3,
  "engagementInteractionScore": 3,
  "contentUseLessonDesignScore": 2
}
```

### 응답 (FE 실측)

```json
{
  "success": false,
  "data": null,
  "message": "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "error": {
    "code": "DATABASE_ERROR",
    "message": "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    "field": null,
    "traceId": "eee3a9a18bb34da68aa8c353686b03f2",
    "details": null
  }
}
```

참고: 동일 플로우에서 과거에는 `INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED`도 재현됨.  
정책 시드 후에도 persist 단계에서 DB 예외가 나면 이번처럼 `DATABASE_ERROR`가 난다.

---

## 프롬프트 (복사용)

```text
당신은 JA Korea CMS Java 백엔드(Members / Instructors · JA 등급 평가)를 점검·수정한다.
프론트 레포는 없다. Controller / Service / Repository / Entity / Flyway·seed / Exception handler / OpenAPI를 찾아 맞춰라.
질문은 계약이 코드·노션과 충돌할 때만 하라.
invent-ban: path·필드명을 임의로 만들지 마라. 기존
  GET  /api/admin/instructors/{instructorMemberId}/ja-evaluation
  POST /api/admin/instructors/{instructorMemberId}/ja-evaluation
  InstructorJaEvaluationInput / InstructorJaEvaluationResponse
  error.code DATABASE_ERROR
  (관련) INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED
를 재사용한다.

════════════════════════════════════════════════════════════════
A. 배경 / 재현 (FE 2026-09-11)
════════════════════════════════════════════════════════════════
CMS Admin → 강사 회원/권한 상세 → JA 등급 평가지 → 「JA 등급 평가 완료하기」

1) FE는 POST /api/admin/instructors/{instructorMemberId}/ja-evaluation 에
   InstructorJaEvaluationInput(4항목 각 1~5)만 보낸다. invent path 없음.
2) 로컬 재현 memberId = 171003
3) Request body (실측):
   {
     "contentExpertiseScore": 2,
     "deliveryImmersionScore": 3,
     "engagementInteractionScore": 3,
     "contentUseLessonDesignScore": 2
   }
4) BE 응답 (실측):
   {
     "success": false,
     "data": null,
     "message": "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
     "error": {
       "code": "DATABASE_ERROR",
       "message": "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
       "field": null,
       "traceId": "eee3a9a18bb34da68aa8c353686b03f2",
       "details": null
     }
   }
5) FE 페이로드·Orval 스키마는 정상. 서버 persist/트랜잭션에서 DB 예외가 난 뒤
   공통 DATABASE_ERROR로 래핑된 상태로 본다.

주의: 본건은 cancel-approval / INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM 과 무관.
JA 평가 API만 다룬다.

════════════════════════════════════════════════════════════════
B. 목표
════════════════════════════════════════════════════════════════
1) traceId eee3a9a18bb34da68aa8c353686b03f2 (및 동일 재현)의
   root cause SQLException / constraint / missing table·column / FK / NPE-to-DB
   를 로그에서 찾아 수정한다.
2) local에서 POST …/instructors/171003/ja-evaluation 이 200 +
   InstructorJaEvaluationResponse(currentGrade, totalScore, policyReady=true) 반환.
3) 정책 미초기화면 DATABASE_ERROR가 아니라
   INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED (기존 계약)로 내려가게 한다.
   (정책 없음 → DB 예외로 새지 말 것)
4) 도메인 충돌(중복 평가·상태 불가 등)은 구체 error.code로.
   진짜 infra DB 실패만 DATABASE_ERROR.
5) OpenAPI/Resolver: submitJaEvaluation 500/409 description 정리.

【In scope】
1) submitJaEvaluation 서비스 스택에서 DATABASE_ERROR로 감싸기 직전 원인 예외 확인
2) JA 평가 저장 테이블/엔티티/마이그레이션 존재·컬럼 타입·FK(memberId) 확인
3) memberId 171003이 instructor로 유효한지·시드 누락이면 seed 보강
4) grade policy / criteria / evaluation history insert 중 어느 실패하는지 분리
5) local 스모크: GET + POST 171003 성공
6) 회귀: 정책 없을 때 POLICY_NOT_INITIALIZED (DATABASE_ERROR로 위장 금지)
7) 서버 로그에 root cause가 traceId와 함께 남는지 확인

【Out of scope】
- FE 평가지 UI/문항 카피
- invent 신규 path
- 권한 승인 cancel-approval / revoke
- 관리자 계정 API

════════════════════════════════════════════════════════════════
C. 구현 체크리스트
════════════════════════════════════════════════════════════════
[ ] traceId eee3a9a18bb34da68aa8c353686b03f2 로그에서 root cause 확보
[ ] 실패한 SQL/constraint/entity 수정 또는 seed 보완
[ ] POST /api/admin/instructors/171003/ja-evaluation 200
[ ] 응답 currentGrade / totalScore / policyReady 채움
   (currentGrade wire: A|B|C|D vs JA_A — FE는 JA_ prefix strip)
[ ] 정책 없음 → INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED (DB 예외 X)
[ ] DATABASE_ERROR는 실제 infra 실패에만 유지
[ ] 통합 테스트: 정상 POST / 정책없음 / (가능하면) constraint 실패 경로

════════════════════════════════════════════════════════════════
D. 스모크 (로컬)
════════════════════════════════════════════════════════════════
로그인: 기존 CMS admin

1) (선택) GET /api/admin/instructors/171003/ja-evaluation
   → 200, policyReady=true 권장
2) POST /api/admin/instructors/171003/ja-evaluation
   body:
   {
     "contentExpertiseScore": 2,
     "deliveryImmersionScore": 3,
     "engagementInteractionScore": 3,
     "contentUseLessonDesignScore": 2
   }
   → 200, totalScore·currentGrade 존재, policyReady=true
3) CMS UI: 해당 강사 → JA 등급 평가 완료 → 성공 반영

════════════════════════════════════════════════════════════════
E. FE에 회신할 것
════════════════════════════════════════════════════════════════
1) root cause (예: missing table X, FK to member, null policy_id, unique violation …)
2) 수정 PR / Flyway id / seed 변경 요약
3) 171003 POST 200 여부 + 샘플 성공 응답 JSON
4) currentGrade canonical (A vs JA_A)
5) DATABASE_ERROR vs POLICY_NOT_INITIALIZED 구분 정책 한 줄

완료 기준: local에서 171003 JA 평가 POST 200 + CMS UI 평가 완료 가능.
```

---

## FE 참고 파일

| 파일 | 역할 |
|------|------|
| `ja-grade-evaluation-modal.tsx` | 평가 모달 · remote POST |
| `ja-grade-evaluation-api.ts` | draft → `InstructorJaEvaluationInput` |
| `members-api-client.ts` | `submitInstructorJaEvaluationRemote` |
| `openapi/members.openapi.json` | `submitJaEvaluation` |

**Last updated:** 2026-09-11
