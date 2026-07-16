# Wave 4 High — TealHeaderModal 이관 검토 게이트

> **상태: 카드형 이관 진행** · full 커스텀은 Teal 유지  
> 기준일: 2026-07-16 · ContentModal ≠ DetailFullPage (서로 대체 금지)

## 0. 셸 역할 · 안전 규칙

| 셸 | 쓰는 경우 | 이관 |
|----|-----------|------|
| **ContentModal** | `size="large"` / width≤1400 **카드형** | Teal 직접 → ContentModal **안전** |
| **DetailFullPageModal** | LNB형 풀페이지 상세 (표준 헤더) | 레이아웃이 맞을 때만 |
| **TealHeader 직접 / TemplateFullpage** | `size="full"` + `hideHeader` + **커스텀 topbar** | **이관하지 않음** (미리보기·템플릿 에디터·문서 뷰어) |

강제 DetailFullPage 스왑은 커스텀 크롬을 깨뜨리므로 **금지**.

## 1. 매핑 · 상태

| 그룹 | 대상 | 결정 | 상태 |
|------|------|------|------|
| 미리보기 6 | A4/인증서/모집 preview | Teal 유지 | 유지 |
| 학교 카드 3 | school/teacher/settlement detail | ContentModal | ✅ 완료 |
| **일반 프로그램 카드 4** | enrollment / instructor-recruitment / program school-detail / applicant-instructor | ContentModal (large) | ✅ **이번 이관** |
| 템플릿 풀페이지 3 | TemplateFullpage / crime-consent / form-template 내 preview | Teal·TemplateFullpage 유지 | 유지 (DetailFullPage 부적합) |
| UJAT 문서 뷰어 1 | assignment document viewer | Teal 유지 (full·hideHeader) | 유지 |

### 이번 이관 파일 (일반만 · 유형 isolation)

1. `features/program/general/ui/enrollment-status-detail-modal.tsx`
2. `features/program/general/ui/instructor-recruitment-detail-modal.tsx`
3. `features/program/general/ui/detail-modal/program-status/school-detail-modal.tsx`
4. `features/program/general/ui/applicant-instructor-detail-modal.tsx`

## 2. 회귀 체크리스트 (일반 프로그램)

- [ ] 수강 신청 학교 목록 모달 · 닫기 · 상세 바로가기
- [ ] 교육 신청 강사 목록 모달
- [ ] 진행 탭 학교 상세 · 탭 · 승인 취소
- [ ] 신청 강사 상세 · 기본/이력서 탭 · DeleteGuide
- [ ] UJAT/Gemini/1사1교 파일 미변경

## 3. 보류

- Critical CSS 룩 (Phase 5)
- MFA
- DetailFullPage로 템플릿/미리보기/UJAT 뷰어 맞추기 (위험 · 하지 않음)
