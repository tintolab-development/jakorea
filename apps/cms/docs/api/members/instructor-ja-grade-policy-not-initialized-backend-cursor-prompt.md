# Cursor prompt — JA 등급 정책 미초기화 (`INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED`)

> 작성: 2026-09-11 · FE(CMS)  
> **FE 반영 (2026-09-11):** BE 시드·계약 확정 후 CMS는 `policyReady=false` UX(완료 CTA 비활성+안내), D등급 카피 `0~49`, 409 `INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED` 매핑, remote 완료 시 서버 `currentGrade`/`totalScore`만 표시.  
> 대상: JA Korea CMS Java Backend (Instructors / JA evaluation · grade policy · OpenAPI · local seed)  
> FE: `apps/cms` 회원 상세·권한 승인 상세 → **JA 등급 평가지**  
> 재현: `http://localhost:3000/admin/permission-requests?pr_detail_user=member-172101&pr_detail_role=instructor`  
> FE API: `POST /api/admin/instructors/{instructorMemberId}/ja-evaluation`  
> 관련 OpenAPI: `apps/cms/openapi/members.openapi.json` → `submitJaEvaluation` / `currentJaEvaluation`  
> FE 구현: `ja-grade-evaluation-modal.tsx` · `mapJaGradeDraftToEvaluationInput` · `submitInstructorJaEvaluationRemote`

아래 **「프롬프트 (복사용)」** 코드펜스 안 전체를 백엔드 Cursor/담당자에게 그대로 전달하면 된다.

---

## FE에서 확인한 것 (2026-09-11)

| 항목 | 내용 |
|------|------|
| 증상 | JA 등급 평가 완료 시 실패 |
| HTTP | `POST /api/admin/instructors/172101/ja-evaluation` |
| 응답 | `success: false`, `error.code: INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED` |
| 메시지 | `JA 강사 등급 정책이 설정되지 않았습니다. 관리자에게 문의해 주세요.` |
| FE body | `InstructorJaEvaluationInput` 4항목(1~5) — OpenAPI와 일치. invent path 없음 |
| 결론 | **FE 페이로드 버그가 아님.** 전역 JA 등급 정책(시드/초기화) 부재로 서버 산정 불가 |

FE는 총점·등급을 서버 SSOT로 받는다. 응답 필드 `policyReady` / `policyVersion`이 OpenAPI에 이미 있다.

### FE UI 등급 구간 (정책 시드 기준 제안)

| 등급 | 최종 점수 구간 (행정 감점 반영 후) |
|------|-----------------------------------|
| A | 85~100 |
| B | 60~84 |
| C | 50~59 |
| D | **0~49** (≤49. C와 비겹침 — 「50점 이하」 폐기) |

- 문항 4개 × (선택 1~5점 × 5) = 고정 평가 **100점 만점**
- 행정 감점: 일정 취소/변경·강의보고서 미준수 등 — OpenAPI 응답의 `*AdjustmentScore` / 서버 산정

### 요청 body 예시 (FE 실제)

```json
{
  "contentExpertiseScore": 5,
  "deliveryImmersionScore": 4,
  "engagementInteractionScore": 4,
  "contentUseLessonDesignScore": 5,
  "comment": "optional"
}
```

---

## 프롬프트 (복사용)

```text
당신은 JA Korea CMS Java 백엔드(Members / Instructors · JA 등급 평가)를 점검·보강한다.
프론트 레포는 없다. Controllers / Services / Policy entity·repository / Flyway·seed / OpenAPI / error code resolver를 찾아 맞춰라.
질문은 계약이 코드·노션과 충돌할 때만 하라.
invent-ban: path·필드명을 임의로 만들지 마라. 기존
  GET  /api/admin/instructors/{instructorMemberId}/ja-evaluation
  POST /api/admin/instructors/{instructorMemberId}/ja-evaluation
  InstructorJaEvaluationInput / InstructorJaEvaluationResponse
  error.code INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED
를 재사용한다.

════════════════════════════════════════════════════════════════
A. 배경 / 재현 (FE 2026-09-11)
════════════════════════════════════════════════════════════════
CMS Admin 「권한 승인」강사 상세(또는 회원 상세) → JA 등급 평가지 → 「JA 등급 평가 완료하기」

1) FE는 POST /api/admin/instructors/{instructorMemberId}/ja-evaluation 에
   InstructorJaEvaluationInput(4항목 각 1~5)만 보낸다.
2) 로컬 재현 memberId = 172101 (권한승인 seed IR-PENDING-PORTAL-FULL / member-172101)
3) BE 응답:
   {
     "success": false,
     "data": null,
     "message": "JA 강사 등급 정책이 설정되지 않았습니다. 관리자에게 문의해 주세요.",
     "error": {
       "code": "INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED",
       "message": "JA 강사 등급 정책이 설정되지 않았습니다. 관리자에게 문의해 주세요."
     }
   }
4) FE 페이로드·Orval 스키마는 정상. 전역 JA 등급 정책이 없어 서버가 총점/등급을
   산정하지 못하는 상태다.

OpenAPI 응답에 이미 있음:
- policyReady: boolean
- policyVersion: string
- currentGrade, totalScore, fixedEvaluationScore, *AdjustmentScore, criteria[]

════════════════════════════════════════════════════════════════
B. 목표
════════════════════════════════════════════════════════════════
1) local / staging 에서 JA 등급 정책이 항상 초기화되어 있도록 시드(또는 부트스트랩) 고정
2) policyReady=true 일 때 POST ja-evaluation 이 200 + 등급 산정 결과를 반환
3) 정책 없을 때 에러 계약(코드·메시지·field)을 OpenAPI/Resolver에 명시
4) GET ja-evaluation 은 정책 미초기화 시에도 FE가 평가지를 열 수 있게
   - 권장: 200 + policyReady=false (현재 GET 실패는 FE가 swallow)
   - POST만 INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED

【In scope】
1) JA 등급 정책 저장소(테이블/엔티티) 위치 확인
   - 코드에서 INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED 를 throw 하는 지점 추적
   - “정책이 없다”의 판정 조건(행 0건 / active version 없음 / criteria 미등록 등) 문서화
2) local profile seed (필수)
   - 활성 정책 1건 + 등급 구간 + (필요 시) criteria 메타데이터
   - FE UI 카피와 맞출 등급 구간(행정 감점 반영 후 최종 점수):
       A: 85~100
       B: 60~84
       C: 50~59
       D: ≤49 (또는 제품 카피 「50점 이하」와 BE 경계 일치 여부 Notion 확인 후 고정)
   - 문항 환산: 항목당 선택 1~5 → ×5 = 25점, 4문항 고정 합 100점
   - criteriaCode 권장(FE hydrate 매핑 호환):
       CONTENT_EXPERTISE
       DELIVERY_IMMERSION
       ENGAGEMENT_INTERACTION
       CONTENT_USE_LESSON_DESIGN
3) staging/demo seed에도 동일 정책 포함 (권한승인 seed 172101 스모크 가능)
4) OpenAPI 보강
   - submitJaEvaluation 400/409 description에
     INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED 명시
   - InstructorJaEvaluationResponse.policyReady description:
     "false면 전역 JA 등급 정책 미초기화. POST 평가 완료 불가"
5) 통합 테스트
   - 정책 시드 있음 + POST 4항목 → 200, currentGrade/totalScore/policyReady=true
   - 정책 삭제/비활성 + POST → INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED
   - GET: policyReady 플래그 일관성

【Out of scope】
- FE 평가지 UI/문항 카피 변경
- invent 신규 path (예: /ja-grade-policies CRUD) — 관리 UI가 이미 있으면 그걸 쓰고,
  없으면 이번 작업은 seed·부트스트랩만. CRUD 화면은 별도 티켓
- 권한승인 approve body(feeGrade GRADE_N) — 별건 Hotfix 완료

════════════════════════════════════════════════════════════════
C. 구현 체크리스트
════════════════════════════════════════════════════════════════
[ ] INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED throw 위치·조건 확인
[ ] Flyway/local seed: 활성 JA 등급 정책 + 등급 밴드 + criteria
[ ] local: POST /api/admin/instructors/172101/ja-evaluation 200
[ ] 응답 currentGrade 형식 고정 문서화 (JA_A vs A — FE는 JA_ prefix strip 후 A|B|C|D 표시)
[ ] policyReady / policyVersion 응답 채움
[ ] OpenAPI error code·policyReady description 반영
[ ] ClientErrorMessageResolver 메시지 유지 또는 FE와 동일 문구 확인
[ ] staging seed에도 정책 포함

════════════════════════════════════════════════════════════════
D. 스모크 (로컬)
════════════════════════════════════════════════════════════════
로그인: 기존 CMS admin (예: admin1@jakorea.org / MFA 환경 정책 따름)

1) (선택) GET /api/admin/instructors/172101/ja-evaluation
   → 200, policyReady=true (시드 후) 또는 policyReady=false (시드 전, 권장)
2) POST /api/admin/instructors/172101/ja-evaluation
   body:
   {
     "contentExpertiseScore": 5,
     "deliveryImmersionScore": 5,
     "engagementInteractionScore": 5,
     "contentUseLessonDesignScore": 5
   }
   → 시드 후: 200, totalScore≈100, currentGrade=A 또는 JA_A, policyReady=true
   → 시드 전: INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED (현재 재현)
3) CMS UI: 권한 승인 상세 member-172101 → JA 등급 평가 완료 → 성공 토스트/등급 반영

════════════════════════════════════════════════════════════════
E. FE에 회신할 것
════════════════════════════════════════════════════════════════
1) 정책 테이블/엔티티명, seed 클래스·Flyway id
2) currentGrade wire 값 canonical (A|B|C|D vs JA_A|…)
3) D등급 경계: ≤49 vs ≤50 최종 결정
4) GET이 정책 없을 때 200+policyReady=false 인지, 에러인지
5) staging 반영 여부 / 배포 후 스모크 결과

완료 기준: local에서 172101 JA 평가 POST 200 + CMS UI 평가 완료 가능.
```

---

## FE 참고 파일

| 파일 | 역할 |
|------|------|
| `apps/cms/src/features/user/detail/ui/modal/ja-grade-evaluation-modal.tsx` | 평가 모달 · remote POST |
| `apps/cms/src/features/user/detail/lib/ja-grade-evaluation-api.ts` | draft → `InstructorJaEvaluationInput` |
| `apps/cms/src/features/user/detail/lib/ja-grade-evaluation-draft.ts` | UI 등급 구간 카피 |
| `apps/cms/src/features/user/api/members-api-client.ts` | `submitInstructorJaEvaluationRemote` |
| `apps/cms/openapi/members.openapi.json` | `submitJaEvaluation` / schemas |

**Last updated:** 2026-09-11
