# FE 수용 — 일반 기관·강사·봉사 신청 상세 form/코멘트 seed

**작성일:** 2026-09-16  
**BE 핸드오프:** `JABACK/docs/frontend/general-org-application-detail-form-seed-frontend-handoff-2026-09-16.md`  
**대상:** CMS 일반 프로그램 · 신청 상세 (기관 / 강사 / 봉사)

---

## 배경

목록 DTO만으로는 교재명·학년·소재지·안내 4항·성범죄·관리자 코멘트 등이 `-`로 비었다.  
SoT는 `form_response`(contextType + contextId) + `GET /api/admin/comments`.

---

## FE 구현 요약

| 항목 | 위치 |
|------|------|
| form list/get | `form-responses-api-client.ts` |
| admin comments | `admin-comments-api-client.ts` |
| 기관 hydrate | `organization-application-form-adapters.ts` |
| 강사·봉사 hydrate | `application-form-detail-adapters.ts` |
| TanStack Query hook | `use-application-form-detail-enrichment.ts` |
| 기관·강사 상세 wire | `applicants-detail-contents.tsx` (general + remote ON) |
| 봉사 상세 wire | `volunteer-screening/detail-view.tsx` |
| 기관 코멘트 저장 | remote 시 `POST /api/admin/comments` (`ORGANIZATION_APPLICATION`) |

목록 매퍼(`mapOrganizationApplicationToApplicantSchoolRow` 등)는 이름·인원·교사·승인상태 유지.  
상세 진입 시 form/comments로만 빈 칸을 채운다.

---

## 매핑 (기관)

| UI | form / comment key |
|----|-------------------|
| 교재명 | `textbookName` |
| 신청 학년 | `applicationGrade` / `grade` |
| 기관 소재지 | `organizationRegion` |
| 상세 주소 | `addressDetail` / `organizationAddress` |
| 신청 사유·기타 요청 | `applicationReason` / `otherRequests` |
| 안내 4항 | flat keys 또는 guidance 배열 |
| 성범죄 조회서 요청 | `program-application-institution-seed-sex-offense-consent-submission` |
| 희망 교육 일자 | `desiredEducationDate` → `sessions` fallback |
| 관리자 코멘트 | `GET /api/admin/comments?targetType=ORGANIZATION_APPLICATION&targetId=` |

강사: `INSTRUCTOR_APPLICATION` → `oneLineIntro` / schedule memo + admin comment  
봉사: `VOLUNTEER_APPLICATION` → essay·JA 경험 텍스트

---

## 활동 포기

신청 상세에 **활동 포기 없음** — 참여 기관 give-up 핸드오프 유지.

---

## 수용 기준

- [x] remote ON 시 기관 신청 상세 form/comment hydrate (FE wiring)
- [x] 관리자 코멘트 seed 표시 + remote 저장
- [x] 강사/봉사 신청 상세 form hydrate (FE wiring)
- [x] 단위 테스트: `organization-application-form-adapters.test.ts`
- [ ] 168001–168004 시드 QA — **블로커:** 일반 `GET /form-responses/{id}` answers 값이 privacy mask로 null  
      → [form-answers-masking-backend-request](./general-org-application-form-answers-masking-backend-request-2026-09-16.md)  
      (코멘트만 보이고 교재/학년/안내 등이 `-`인 증상)
