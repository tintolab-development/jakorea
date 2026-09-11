# Cursor prompt — 강사 승인 취소 409 (`INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM`)

> 작성: 2026-09-11 · FE(CMS)  
> 대상: JA Korea CMS Java Backend (Instructor role requests · cancel-approval · revoke guard · seed)  
> FE: `apps/cms` **권한 승인** → 강사 상세 → **승인 취소**  
> 재현 API: `POST /api/admin/instructor-role-requests/163243/cancel-approval`  
> OpenAPI: `apps/cms/openapi/members.openapi.json` → `cancelApproval`  
> FE: `cancelInstructorRoleApprovalRemote` · `use-instructor-role-request-mutations.ts` · `get-member-api-error.ts`

아래 **「프롬프트 (복사용)」** 코드펜스 안 전체를 백엔드 Cursor/담당자에게 그대로 전달하면 된다.

---

## FE에서 확인한 것 (2026-09-11)

| 항목 | 내용 |
|------|------|
| 증상 | 권한 승인(강사) 상세에서 **승인 취소** 실패 |
| HTTP | `POST /api/admin/instructor-role-requests/163243/cancel-approval` |
| 응답 | `success: false`, `error.code: INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM` |
| 서버 message | `현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.` (공통 409) |
| traceId | `193461940c27478c832dae02145dd2ba` |
| FE body | `ApprovalResetRequest` — `{ "reason": "…" }` (OpenAPI와 일치) |
| 결론 | **FE 페이로드/path 버그 아님.** cancel-approval이 revoke와 동일 가드로 막힘. 활성/배정 프로그램 판정이 맞는지·시드 오염인지·에러 메시지/details 보강이 필요한지 BE 확인 필요 |

FE 코드 매핑(공통 409 문구일 때):

> 참여 중인 프로그램이 있어 권한을 취소할 수 없습니다.

참고: 동일 코드는 `POST /api/admin/instructors/{memberId}/revoke` 에도 쓰임. cancel-approval OpenAPI 요약은 「강사 승인 취소 및 권한 박탈」.

### 요청 body 예시 (FE 실제)

```json
{
  "reason": "CMS 강사 권한 승인 취소"
}
```

---

## 프롬프트 (복사용)

```text
당신은 JA Korea CMS Java 백엔드(Members / Instructor role requests · 승인 취소·권한 박탈)를 점검·보강한다.
프론트 레포는 없다. Controllers / Services / “active program” 판정 쿼리 / Seed / OpenAPI / error code resolver를 찾아 맞춰라.
질문은 계약이 코드·노션과 충돌할 때만 하라.
invent-ban: path·필드명을 임의로 만들지 마라. 기존
  POST /api/admin/instructor-role-requests/{requestId}/cancel-approval
  POST /api/admin/instructors/{memberId}/revoke
  ApprovalResetRequest
  error.code INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM
를 재사용한다.

════════════════════════════════════════════════════════════════
A. 배경 / 재현 (FE 2026-09-11)
════════════════════════════════════════════════════════════════
CMS Admin 「권한 승인」강사 탭 → 승인 완료(APPROVED) 상세 → 「승인 취소」

1) FE는 POST /api/admin/instructor-role-requests/{requestId}/cancel-approval 에
   ApprovalResetRequest(reason)만 보낸다. invent path 없음.
2) 로컬 재현 requestId = 163243
3) BE 응답 (실측):
   {
     "success": false,
     "data": null,
     "message": "현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.",
     "error": {
       "code": "INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM",
       "message": "현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.",
       "field": null,
       "traceId": "193461940c27478c832dae02145dd2ba",
       "details": null
     }
   }
4) FE는 code만으로 UX 문구를 띄운다:
   「참여 중인 프로그램이 있어 권한을 취소할 수 없습니다.」
5) FE 페이로드·Orval 스키마는 정상. 서버가 cancel-approval을
   활성/배정 프로그램 가드로 409 처리한 상태다.

OpenAPI: operationId cancelApproval
- 요약: 강사 승인 취소 및 권한 박탈
- 필요 권한: INSTRUCTOR_REVOKE
- body: ApprovalResetRequest

════════════════════════════════════════════════════════════════
B. 목표
════════════════════════════════════════════════════════════════
1) 「활성 프로그램」판정 조건을 코드·문서로 고정한다.
   - 어떤 enrollment/assignment/status가 차단 대상인지
   - 완료·취소·철회 건은 제외하는지
   - revoke API와 cancel-approval이 동일 가드를 쓰는지(의도면 OK, 문서화)
2) requestId=163243 (및 동일 시드 계정)에 대해:
   - 실제로 차단해야 할 활성 프로그램이 있으면 → 정책 OK.
     단, 공통 409 문구만 쓰지 말고 ClientErrorMessageResolver에
     구체 메시지(및 가능하면 details에 programId/title 목록)를 채운다.
   - 시드/데모에 가짜·만료·고아 배정이 남아 오탐이면 → seed/데이터 정리 후
     cancel-approval이 200이 되게 한다.
3) QA/로컬에서 「프로그램 없는 승인 강사」스모크 계정을 보장한다
   (승인 취소 E2E가 항상 409로 막히지 않게).
4) OpenAPI 409 description에
   INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM 명시.
5) (선택) GET detail 또는 list에
   “승인 취소 가능 여부 / blockReason” 플래그가 있으면 FE가 버튼을 선제 비활성할 수 있음.
   없으면 이번 범위에서 invent하지 말고, 에러 계약·시드만 정리.

【In scope】
1) INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM throw 위치·조건 추적
2) cancel-approval vs revoke 가드 공유 여부 확인·문서화
3) requestId 163243이 왜 막히는지: 실제 활성 프로그램 row 조회·목록을 FE 회신
4) 오탐이면 local/staging seed 정리
5) Resolver 메시지: FE와 동일 취지
   「참여 중인 프로그램이 있어 권한을 취소할 수 없습니다.」
6) details(권장): blocking programIds / titles / status
7) 통합 테스트
   - 활성 프로그램 있음 → cancel-approval 409 + 위 code
   - 활성 프로그램 없음 → cancel-approval 200 (권한 박탈·신청 상태 전이 SSOT)

【Out of scope】
- FE 승인 취소 모달 UI 카피 변경(이미 code 매핑 있음)
- invent 신규 path
- JA 등급평가(ja-evaluation) — 본건과 무관. 혼동 금지
- 관리자 cancel-approval (admin-approval-requests) — 별건

════════════════════════════════════════════════════════════════
C. 구현 체크리스트
════════════════════════════════════════════════════════════════
[ ] throw 위치·“active program” SQL/조건 문서화
[ ] 163243 차단 원인 program 목록 FE에 회신
[ ] 오탐 시 seed 정리 + cancel-approval 200 스모크 계정 확보
[ ] ClientErrorMessageResolver: 공통 409 문구 대신 구체 메시지
[ ] (권장) error.details에 blocking programs
[ ] OpenAPI 409 + error code description
[ ] revoke / cancel-approval 동일·상이 정책 명시
[ ] 테스트: blocked / allowed 두 케이스

════════════════════════════════════════════════════════════════
D. 스모크 (로컬)
════════════════════════════════════════════════════════════════
로그인: 기존 CMS admin (예: admin1@jakorea.org / MFA 환경 정책 따름)

1) POST /api/admin/instructor-role-requests/163243/cancel-approval
   body: { "reason": "CMS 강사 권한 승인 취소" }
   → 활성 프로그램 실재 시: 409 + INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM
     + 구체 message (± details)
   → 오탐 수정 후 / 프로그램 없는 승인 강사: 200

2) CMS UI: 권한 승인 → 해당 강사 상세 → 승인 취소
   → 차단 시 FE 안내 「참여 중인 프로그램이 있어…」
   → 허용 시 목록/상세 상태 갱신

3) (대조) POST /api/admin/instructors/{memberId}/revoke
   동일 가드면 동일 code/메시지인지 확인

════════════════════════════════════════════════════════════════
E. FE에 회신할 것
════════════════════════════════════════════════════════════════
1) active program 판정 조건 (status enum / 테이블)
2) requestId 163243을 막은 programId·title·status 목록
3) 오탐 여부 · seed 수정 여부 · 스모크용 “취소 가능” requestId
4) error.message canonical 문구 · details 스키마(있으면)
5) cancel-approval과 revoke 가드 동일 여부
6) (선택) detail에 cancelAllowed 플래그 추가 계획 유무

완료 기준:
- 정책상 차단이 맞으면: 구체 메시지(+details)로 FE/운영이 원인을 알 수 있음
- 오탐이면: 163243(또는 대체 스모크 ID) cancel-approval 200 + CMS UI 승인 취소 성공
```

---

## FE 참고 파일

| 파일 | 역할 |
|------|------|
| `apps/cms/src/features/user/api/members-api-client.ts` | `cancelInstructorRoleApprovalRemote` |
| `apps/cms/src/features/user/api/hooks/use-instructor-role-request-mutations.ts` | 승인 취소 mutation |
| `apps/cms/src/pages/admin/permission-request-list-page.tsx` | 승인 취소 UI 호출 |
| `apps/cms/src/features/user/api/get-member-api-error.ts` | `INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM` 문구 매핑 |
| `apps/cms/openapi/members.openapi.json` | `cancelApproval` |

**Last updated:** 2026-09-11
