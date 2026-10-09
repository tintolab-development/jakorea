# Platform 마이페이지 신청 내용·서류 합격 배너 — Portal 상세 필드 요청

**Date:** 2026-10-09  
**Status:** **BE 완료** — FE handoff:  
`JABACK/docs/frontend/mypage-application-content-interview-banner-frontend-handoff-2026-10-09.md`  
**App:** `apps/platform` 마이페이지 교육/봉사/강의 상세  
**시안:** Figma `tiDywBHEhTkruOHjh1ctuT` / `11005:340344`  
**기획:** Notion 교육/봉사현황 상세_신청 내용 · 교육현황 상세_공통(서류 합격 배너)

## 배경

FE는 신청 내용 탭·팝업을 `EducationApplicationContent`(자기소개 · 진행 희망 교육 일정)로 렌더한다.  
서류 합격 배너는 `displayStatus === 'document_passed'` 이고 `hasInterview` + 면접 시각 라벨이 있을 때만 노출한다.

## BE 확정 필드 (`MemberPortalApplicationDetail`)

| 필드 | 용도 | 비고 |
| --- | --- | --- |
| `answers` | 신청 내용 원문 | 없으면 `{}`. 문단 id 또는 단축 키(`selfIntro` / `scheduleChoice`) |
| `preferredScheduleBlocks` | 희망 일정 fallback | 없으면 `[]` |
| `assignedInterviewStartAt` / `EndAt` | 면접 배정 | 미배정 `null` |
| `hasInterview` | 배너 가드 | 항상 존재 |
| `interviewAtLabel` | 서버 포맷 문구 | 있으면 FE 포맷보다 우선. 미배정 `null` |
| `program.interviewEnabled` | 모집 면접 여부 | `null`/`false` + 배정 없음 → 배너 숨김 |

## FE 매핑

- `application-content-from-answers.ts`
- `mapPortalProgramApplicationDetail` — `interviewAtLabel` 우선, `hasInterview === false`면 배너 라벨 비부여
- 목록 API에는 본 필드 없음(상세만)
