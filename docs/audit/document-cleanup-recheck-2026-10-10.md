# 문서 정리 재검수 보고서 (2026-10-10)

## 1. 검수 메타

| 항목 | 값 |
|---|---|
| 검수 일시 | 2026-10-10 (로컬) |
| HEAD | `86d1c68b79809ca93d9bec6d66d0429d65342dd7` |
| origin/keonhee | `86d1c68b79809ca93d9bec6d66d0429d65342dd7` (fetch 확인) |
| 기존 감사 SHA | `86d1c68b79809ca93d9bec6d66d0429d65342dd7` |
| SHA 차이 | **동일** (`HEAD_EQ_AUDIT`) |
| 로컬 dirty | 없음 (`keonhee...origin/keonhee` clean at start of audit) |
| 범위 | 부록 A **95개 전수** + 부록 C **샘플 40개** (나머지 642개는 `NOT_AUDITED_IN_THIS_PASS`) |
| 방법 | 파일 존재·본문 상태/계약 마커·대체 경로·repo 참조(basename)·요청서 기존 판정 대조. 코드는 고위험만 경량 교차 |
| 실행하지 않음 | 삭제·병합·이관·원문 수정 |
| 미확인 | 실서버·JABACK/Notion 본문·실제 운영 사용률 → 전 항목 `UNVERIFIED_RUNTIME` |
| 부록 데이터 | 첨부 `cursor-document-cleanup-recheck-request.md` (부록 B 파싱은 일부만 구조화됨 — 이관 항목은 본문/요청서 meta로 보완) |
| CSV | [document-cleanup-recheck-2026-10-10-files.csv](./document-cleanup-recheck-2026-10-10-files.csv) |

## 2. 건수 요약

| 재판정 | 건수 |
|---|---:|
| `DELETE_CANDIDATE` | 1 |
| `EXTRACT_THEN_DELETE` | 69 |
| `MERGE_CANDIDATE` | 4 |
| `KEEP_ACTIVE` | 1 |
| `KEEP_REFERENCE` | 20 |
| `REVIEW_REQUIRED` | 0 |
| `NOT_FOUND` | 0 |
| **합계** | **95** |

기존 부록 A 기대치: DELETE 24 / EXTRACT 67 / MERGE 4.

| 변화 | 건수 |
|---|---:|
| 기존 DELETE에서 판정 변경 | 23 |
| 기존 EXTRACT에서 판정 변경 | 2 |
| 즉시 삭제 후보로 재확인 | 1 |
| 부재(NOT_FOUND) | 0 |

**예상 순감소:** 이번 패스는 삭제 미실행. 즉시 삭제 승인에 가까운 것은 1건뿐이며, 이관/병합 대상이 많으므로 정리 실행 시 신설 대표 문서를 만들면 순감소는 더 줄어든다.

## 3. 핵심 결론

1. 기존 “삭제 후보 24”는 **문서상 완료 표기만으로 DELETE를 승인하기에 부적절**했다. 재검수 결과 대다수는 `KEEP_REFERENCE` 또는 `EXTRACT_THEN_DELETE`로 내려갔다.
2. Admin 시드 날짜 사본(09-23/09-25)은 09-26과 **바이트 동일 복사가 아니다**(`diff` 상이) → 즉시 삭제 불가.
3. `general-instructor-approve-preferred-schedule-not-osa-backend-request-2026-10-09.md`는 기존 DELETE였으나 **반영 완료·BE 핸드오프 SSOT·OSA 비필수 정책**이 본문에 남아 `KEEP_REFERENCE`.
4. CMS `.cursor/rules` 3개는 모노레포 루트 규칙 **위임 래퍼**이며 CMS `globs`가 있다 → `MERGE_CANDIDATE`(흡수 전 삭제 금지).
5. `be-handoff-program-dummy-seeds/*` 및 API gaps 계열은 부록 B “원문 표시”만으로 이관 완료로 볼 수 없다 → `EXTRACT_THEN_DELETE` 유지.
6. 부록 C 682개는 **전수 미검수**. 샘플 40개 존재 확인·역할 유지, 현행성은 `UNVERIFIED_RUNTIME`.

## 4. 기존 판정에서 바뀐 항목 (요약)

| 경로 | 기존 | 재판정 | 이유 |
|---|---|---|---|
| `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-23.md` | `DELETE_CANDIDATE` | `EXTRACT_THEN_DELETE` | 09-26 대표와 diff 상이(완전 동일 복사본 아님). 고유 시드/완료조건 이관 후 삭제 |
| `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-25.md` | `DELETE_CANDIDATE` | `EXTRACT_THEN_DELETE` | 09-26과 diff 상이. 재적용 프롬프트 고유분 이관 후 삭제 |
| `apps/admin/docs/api/site-management-seed-2026-09-23.md` | `DELETE_CANDIDATE` | `EXTRACT_THEN_DELETE` | 값 SSOT 표기 문서(149줄). 09-26 프롬프트(284줄)와 역할 다름 — 값 표·mock 비SSOT 고지 이관 필요 |
| `apps/cms/docs/api/gemini-organization-application-list-fields-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 부분 완료 이력·후속 preferred-schedule 링크·FE handoff 경로가 본문에 있음. 삭제 시 이력 추적 손실 |
| `apps/cms/docs/api/gemini-organization-application-list-preferred-schedule-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE 완료·FE 확인 및 preferenceRank/blocks 계약이 본문에 잔존. Git만으로 대체하기엔 계약 밀도가 높음 |
| `apps/cms/docs/api/gemini-recruitment-create-patch-toplevel-fields-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE/FE 반영 완료이나 top-level 필드 계약 표가 계약 참조로 유용 |
| `apps/cms/docs/api/gemini-recruitment-detail-field-roundtrip-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 왕복 재현·필드 계약 문서. 완료여도 계약 참조로 유지 |
| `apps/cms/docs/api/general-individual-volunteer-assignment-local-distance-km-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 상태 BE 완료(옵션 A) + enrich 계약·재현 ID. 연쇄 문서(region/seed) 인덱스 역할 |
| `apps/cms/docs/api/general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | FE 연동 완료 표기 + 후속 seed 링크. 계약 참조 유지 |
| `apps/cms/docs/api/general-individual-volunteer-assignment-schedule-location-seed-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 장소 시드·persist P0 계약. 완료 후에도 시드 규칙 참조 |
| `apps/cms/docs/api/general-instructor-approve-preferred-schedule-not-osa-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 기존 DELETE→재판정 KEEP_REFERENCE. 반영 완료·BE 핸드오프 SSOT·OSA 비필수 정책·재현 ID·Flyway V26 기록 |
| `apps/cms/docs/api/general-organization-application-guidance-fields-empty-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE 수정 완료·FORM_ONLY_NOT_PROJECTED 원인·재현 1691189. 즉시 삭제보다 장애 이력/계약 참조 |
| `apps/cms/docs/api/general-program-survey-management-remaining-backend-request-2026-10-02.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | FE 반영 완료·재오픈 금지 명시 + expectedRespondentCount/409 계약 |
| `apps/cms/docs/api/program-business-area-update-backend-prompt-2026-09-29.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE 반영·PATCH→GET 재검증 완료 기록. 사업 필드 계약 참조 |
| `apps/cms/docs/api/program-recruitment-form-remaining-fields-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 모집 잔여 필드 왕복 계약·draftStatus. 완료 후에도 필드 SSOT 참조 |
| `apps/cms/docs/api/settlement-item-settings-dummy-seed-backend-request.md` | `DELETE_CANDIDATE` | `EXTRACT_THEN_DELETE` | 현행 SSOT를 handoff 문서로 넘김을 본문이 명시. 페이지 URL·FE mock 경로 등 고유 표를 handoff에 흡수 후 삭제 |
| `apps/cms/docs/api/settlement-item-settings-seed.payload.json` | `DELETE_CANDIDATE` | `KEEP_ACTIVE` | 구조화 시드 자산. 문서와 별개로 전달·재시드에 사용 가능. 요청서의 "전달용 사본" 검증 전 삭제 금지 |
| `apps/cms/docs/api/trained-teachers-notion-fe-align-backend-request-2026-09-18.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE 회신·FE 재검증 체크리스트 완료 표. 실적 배타성 등 정책 참조 |
| `apps/cms/docs/requirements-specification/analysis/matching-management-analysis.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 요구사항 대비 구현 분석·수용 기준 표. "완료" 칸만으로 삭제 불가 — 분석 문서 역할 |
| `apps/cms/docs/status/DOCUMENT_VALIDITY_REVIEW_2026-04-20.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 문서 유효성 판정 인덱스(archive/redirect). progress.md로 대체되지 않는 메타 목록 |
| `apps/platform/docs/api/gemini-portal-platform-visibility-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | Portal programType=GEMINI_TRAINING SSOT·Flyway 언급. 완료 후 계약 참조 |
| `apps/platform/docs/api/individual-application-interview-schedule-required-backend-cursor-prompt-2026-10-06.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 면접 없는 프로그램 INTERVIEW_SCHEDULE_REQUIRED 예외 계약. BE 완료여도 정책 참조 |
| `apps/platform/docs/api/mypage-lecture-status-tabs-backend-cursor-prompt-2026-10-06.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 마이페이지 탭↔displayStatus 매핑 표(옵션 A). FE 탭 구현 SSOT에 가깝음 |
| `apps/cms/docs/api/general-volunteer-application-give-up-decision-conflict-backend-request-2026-10-09.md` | `EXTRACT_THEN_DELETE` | `KEEP_REFERENCE` | BE 완료·QA 재현 ID(1691348)·경로 혼동 금지 계약. 이관 전 삭제 부적절 → 참조 유지로 상향 |
| `apps/platform/docs/api/mypage-volunteer-assignment-status-backend-request-2026-10-09.md` | `EXTRACT_THEN_DELETE` | `KEEP_REFERENCE` | Platform 배정현황 assignments API 계약. 문서상 요청/연동 밀도가 높아 이관 완료 전 유지 |

## 5. 즉시 삭제 후보 (재확인)

| 경로 | 이유 | 대체 | 근거 |
|---|---|---|---|
| `apps/admin/docs/api/site-shell-public-api-frontend-cursor-prompt-2026-09-23.md` | Platform 동명 문서가 존재하고 Admin 사본은 FE 전달용 중복. 링크를 Platform 경로로 교체 후 삭제 가능(런타임 미검증) | `apps/platform/docs/api/site-shell-public-api-frontend-cursor-prompt-2026-09-23.md` | `apps/admin/docs/api/site-shell-public-api-frontend-cursor-prompt-2026-09-23.md:24:완료 조건:` |

> 삭제 실행은 별도 PR. 참조 링크를 Platform 경로로 바꾼 뒤에만 제거한다.

## 6. 병합 후보 4

| 경로 | 대표(canonical) | 이관할 고유분 | 근거 |
|---|---|---|---|
| `apps/cms/.cursor/rules/coding/react-component-render-as-jsx.mdc` | `.cursor/rules/react-component-render-as-jsx.mdc` | CMS globs·요약 금지 조항 | `apps/cms/.cursor/rules/coding/react-component-render-as-jsx.mdc:1:(상태 마커 없음 — 존재` |
| `apps/cms/.cursor/rules/coding/react-hooks-after-early-return.mdc` | `.cursor/rules/react-hooks-after-early-return.mdc` | CMS globs·요약 금지 조항 | `apps/cms/.cursor/rules/coding/react-hooks-after-early-return.mdc:1:(상태 마커 없음 — 존` |
| `apps/cms/.cursor/rules/coding/rich-text-compose-input-perf.mdc` | `.cursor/rules/rich-text-compose-input-perf.mdc` | CMS globs·요약 금지 조항 | `apps/cms/.cursor/rules/coding/rich-text-compose-input-perf.mdc:11:# Rich text co` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-seed-case-api-coverage-backend-handoff-2026-07-30.md` | `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-api-backend-gaps-consolidated.md` | 시드 케이스 커버리지 표 | `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-seed-case-api-coverage` |

## 7. KEEP_REFERENCE / KEEP_ACTIVE (계약·자산 유지)

총 21건. 완료 요청이라도 계약·재현·핸드오프·JSON 자산이 있으면 유지.

| 경로 | 재판정 | 이유 | 근거 |
|---|---|---|---|
| `apps/cms/docs/api/gemini-organization-application-list-fields-backend-prompt-2026-09-30.md` | `KEEP_REFERENCE` | 부분 완료 이력·후속 preferred-schedule 링크·FE handoff 경로가 본문에 있음. 삭제 시 이력 추적 손실 | `apps/cms/docs/api/gemini-organization-application-list-fields-backend-prompt-2026-09-30.md` |
| `apps/cms/docs/api/gemini-organization-application-list-preferred-schedule-backend-prompt-2026-09-30.md` | `KEEP_REFERENCE` | BE 완료·FE 확인 및 preferenceRank/blocks 계약이 본문에 잔존. Git만으로 대체하기엔 계약 밀도가 높음 | `apps/cms/docs/api/gemini-organization-application-list-preferred-schedule-backend-prompt-2` |
| `apps/cms/docs/api/gemini-recruitment-create-patch-toplevel-fields-backend-prompt-2026-09-30.md` | `KEEP_REFERENCE` | BE/FE 반영 완료이나 top-level 필드 계약 표가 계약 참조로 유용 | `apps/cms/docs/api/gemini-recruitment-create-patch-toplevel-fields-backend-prompt-2026-09-3` |
| `apps/cms/docs/api/gemini-recruitment-detail-field-roundtrip-backend-prompt-2026-09-30.md` | `KEEP_REFERENCE` | 왕복 재현·필드 계약 문서. 완료여도 계약 참조로 유지 | `apps/cms/docs/api/gemini-recruitment-detail-field-roundtrip-backend-prompt-2026-09-30.md:9` |
| `apps/cms/docs/api/general-individual-volunteer-assignment-local-distance-km-backend-request-2026-10-09.md` | `KEEP_REFERENCE` | 상태 BE 완료(옵션 A) + enrich 계약·재현 ID. 연쇄 문서(region/seed) 인덱스 역할 | `apps/cms/docs/api/general-individual-volunteer-assignment-local-distance-km-backend-reques` |
| `apps/cms/docs/api/general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md` | `KEEP_REFERENCE` | FE 연동 완료 표기 + 후속 seed 링크. 계약 참조 유지 | `apps/cms/docs/api/general-individual-volunteer-assignment-region-distance-backend-request-` |
| `apps/cms/docs/api/general-individual-volunteer-assignment-schedule-location-seed-backend-request-2026-10-09.md` | `KEEP_REFERENCE` | 장소 시드·persist P0 계약. 완료 후에도 시드 규칙 참조 | `apps/cms/docs/api/general-individual-volunteer-assignment-schedule-location-seed-backend-r` |
| `apps/cms/docs/api/general-instructor-approve-preferred-schedule-not-osa-backend-request-2026-10-09.md` | `KEEP_REFERENCE` | 기존 DELETE→재판정 KEEP_REFERENCE. 반영 완료·BE 핸드오프 SSOT·OSA 비필수 정책·재현 ID·Flyway V26 기록 | `apps/cms/docs/api/general-instructor-approve-preferred-schedule-not-osa-backend-request-20` |
| `apps/cms/docs/api/general-organization-application-guidance-fields-empty-backend-request-2026-10-09.md` | `KEEP_REFERENCE` | BE 수정 완료·FORM_ONLY_NOT_PROJECTED 원인·재현 1691189. 즉시 삭제보다 장애 이력/계약 참조 | `apps/cms/docs/api/general-organization-application-guidance-fields-empty-backend-request-2` |
| `apps/cms/docs/api/general-program-survey-management-remaining-backend-request-2026-10-02.md` | `KEEP_REFERENCE` | FE 반영 완료·재오픈 금지 명시 + expectedRespondentCount/409 계약 | `apps/cms/docs/api/general-program-survey-management-remaining-backend-request-2026-10-02.m` |
| `apps/cms/docs/api/program-business-area-update-backend-prompt-2026-09-29.md` | `KEEP_REFERENCE` | BE 반영·PATCH→GET 재검증 완료 기록. 사업 필드 계약 참조 | `apps/cms/docs/api/program-business-area-update-backend-prompt-2026-09-29.md:9:| 상태 | BE 반영` |
| `apps/cms/docs/api/program-recruitment-form-remaining-fields-backend-prompt-2026-09-30.md` | `KEEP_REFERENCE` | 모집 잔여 필드 왕복 계약·draftStatus. 완료 후에도 필드 SSOT 참조 | `apps/cms/docs/api/program-recruitment-form-remaining-fields-backend-prompt-2026-09-30.md:1` |
| `apps/cms/docs/api/trained-teachers-notion-fe-align-backend-request-2026-09-18.md` | `KEEP_REFERENCE` | BE 회신·FE 재검증 체크리스트 완료 표. 실적 배타성 등 정책 참조 | `apps/cms/docs/api/trained-teachers-notion-fe-align-backend-request-2026-09-18.md:4:**상태:**` |
| `apps/cms/docs/requirements-specification/analysis/matching-management-analysis.md` | `KEEP_REFERENCE` | 요구사항 대비 구현 분석·수용 기준 표. "완료" 칸만으로 삭제 불가 — 분석 문서 역할 | `apps/cms/docs/requirements-specification/analysis/matching-management-analysis.md:9:## 📋 요` |
| `apps/cms/docs/status/DOCUMENT_VALIDITY_REVIEW_2026-04-20.md` | `KEEP_REFERENCE` | 문서 유효성 판정 인덱스(archive/redirect). progress.md로 대체되지 않는 메타 목록 | `apps/cms/docs/status/DOCUMENT_VALIDITY_REVIEW_2026-04-20.md:7:- `archive`: 과거 단계의 완료/검증 기록` |
| `apps/platform/docs/api/gemini-portal-platform-visibility-backend-prompt-2026-09-30.md` | `KEEP_REFERENCE` | Portal programType=GEMINI_TRAINING SSOT·Flyway 언급. 완료 후 계약 참조 | `apps/platform/docs/api/gemini-portal-platform-visibility-backend-prompt-2026-09-30.md:10:|` |
| `apps/platform/docs/api/individual-application-interview-schedule-required-backend-cursor-prompt-2026-10-06.md` | `KEEP_REFERENCE` | 면접 없는 프로그램 INTERVIEW_SCHEDULE_REQUIRED 예외 계약. BE 완료여도 정책 참조 | `apps/platform/docs/api/individual-application-interview-schedule-required-backend-cursor-p` |
| `apps/platform/docs/api/mypage-lecture-status-tabs-backend-cursor-prompt-2026-10-06.md` | `KEEP_REFERENCE` | 마이페이지 탭↔displayStatus 매핑 표(옵션 A). FE 탭 구현 SSOT에 가깝음 | `apps/platform/docs/api/mypage-lecture-status-tabs-backend-cursor-prompt-2026-10-06.md:3:> ` |
| `apps/cms/docs/api/general-volunteer-application-give-up-decision-conflict-backend-request-2026-10-09.md` | `KEEP_REFERENCE` | BE 완료·QA 재현 ID(1691348)·경로 혼동 금지 계약. 이관 전 삭제 부적절 → 참조 유지로 상향 | `apps/cms/docs/api/general-volunteer-application-give-up-decision-conflict-backend-request-` |
| `apps/platform/docs/api/mypage-volunteer-assignment-status-backend-request-2026-10-09.md` | `KEEP_REFERENCE` | Platform 배정현황 assignments API 계약. 문서상 요청/연동 밀도가 높아 이관 완료 전 유지 | `apps/platform/docs/api/mypage-volunteer-assignment-status-backend-request-2026-10-09.md:13` |
| `apps/cms/docs/api/settlement-item-settings-seed.payload.json` | `KEEP_ACTIVE` | 구조화 시드 자산. 문서와 별개로 전달·재시드에 사용 가능. 요청서의 "전달용 사본" 검증 전 삭제 금지 | `apps/cms/docs/api/settlement-item-settings-seed.payload.json:1:(상태 마커 없음 — 존재=True)` |

## 8. 이관 후 삭제 (EXTRACT_THEN_DELETE)

총 69건. **이관 완료 전 삭제 금지.** 대표 문서가 “신설 제안”이면 아직 이관되지 않은 것이다.

상세는 CSV 전체 행을 본다. 그룹별 권장 대표:

| 그룹 | 예시 경로 | 이관 방향 |
|---|---|---|
| Admin 시드 날짜 사본 | `site-management-*-2026-09-23/25.md` | `...-2026-09-26.md`에 고유 값·절차 흡수 |
| Program dummy seeds | `be-handoff-program-dummy-seeds/*` | `README-BE.md` 인덱스 + **미작성** 통합 SSOT |
| API gaps / conversion | `*-api-backend-gaps*.md`, `programs-*-conversion-status.md` | 도메인별 잔여 목록(신설)에 DTO·금지·수용 기준 이전 |
| 알림 QA | `notification-*-qa-2026-09-11.md` | 알림 QA 통합 런북(신설) |
| CMS FE auto-send prompts | `CMS_FE_PROMPT_*` | `.cursor/rules/cms-platform-auto-send.mdc` 및 현행 handoff |
| MVP / roadmap | `requirements-specification/MVP/*`, `MVP_ROADMAP_*` | `progress.md` + 현행 로드맵(역할 재확인 후) |
| admin-platform-kit 중간검증 | `docs/admin-platform-kit/05,08,11,13,15,17` | kit README·최종 합의 문서 체인 |
| claude 가이드 | `docs/claude/*` | `.cursor/rules` / CMS QA docs |

### EXTRACT 전량 목록 (경로 · 이관 힌트)

- `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-23.md` → apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-26.md — 09-26 대표와 diff 상이(완전 동일 복사본 아님). 고유 시드/완료조건 이관 후 삭제
- `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-25.md` → apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-26.md — 09-26과 diff 상이. 재적용 프롬프트 고유분 이관 후 삭제
- `apps/admin/docs/api/site-management-seed-2026-09-23.md` → apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-26.md — 값 SSOT 표기 문서(149줄). 09-26 프롬프트(284줄)와 역할 다름 — 값 표·mock 비SSOT 고지 이관 필요
- `apps/cms/docs/api/settlement-item-settings-dummy-seed-backend-request.md` → apps/cms/docs/api/settlement-item-settings-backend-seed-handoff-2026-08-27.md — 현행 SSOT를 handoff 문서로 넘김을 본문이 명시. 페이지 URL·FE mock 경로 등 고유 표를 handoff에 흡수 후 삭제
- `apps/admin/docs/api/directions-dummy-seed-backend-request.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-20.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/admin/docs/api/people-dummy-seed-backend-request.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/admin/docs/api/site-management-seed-ready-frontend-cursor-prompt-2026-09-25.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/.cursor/rules/data/api-spec-mock.md` → apps/cms/docs/api/api-spec-mock-detailed.md (+ extended) — mock 계약 통합 문서 신설/이관 전 유지 — 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지
- `apps/cms/.cursor/rules/process/styling-token-refactor-delegation.md` → apps/cms/.cursor/rules/design/ 또는 monorepo design tokens — 위임 경로 확인 후 통합 — 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지
- `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md` → 부록 B 보존 항목 → 기능별 대표 문서(미확정 시 신설) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md` → 부록 B 보존 항목 → 기능별 대표 문서(미확정 시 신설) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md` → 부록 B 보존 항목 → 기능별 대표 문서(미확정 시 신설) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/api-spec-mock-detailed.md` → 부록 B 보존 항목 → 기능별 대표 문서(미확정 시 신설) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/api-spec-mock-extended.md` → 부록 B 보존 항목 → 기능별 대표 문서(미확정 시 신설) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/00-fe-mock-id-map-and-rules.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/01-general-program-dummy-seed.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/02-company-school-dummy-seed.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/05-nested-child-data-dummy-seed.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-api-backend-gaps-consolidated.md` → apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md (인덱스) + 신규 통합 SSOT 제안(미작성) — 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료)
- `apps/cms/docs/api/data-management-api-backend-gaps.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/forms-surveys-api-backend-gaps.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/gemini-recruitment-patch-invalid-value-instant-backend-prompt-2026-09-30.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/logs-api-backend-gaps.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/logs-api-conversion-status-backend-handoff.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/notification-send-selectable-not-success-qa-2026-09-11.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/notification-sms-nhn-catalog-crud-qa-2026-09-11.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/posts-api-backend-gaps.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-api-backend-gaps-consolidated.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-api-backend-gaps.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-api-conversion-roadmap.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-api-remaining-work.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-company-school-detail-api-conversion-status.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-detail-api-conversion-status.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-gemini-performance-api-conversion-status.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-gemini-visiting-training-api-conversion-status.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-trained-teachers-api-conversion-status.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-ujat-detail-api-conversion-status.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/programs-ujat-education-regions-api-conversion-status.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/settlement-api-backend-gaps.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/templates-api-conversion-status-backend-handoff.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/api/trained-teacher-registration-flow-backend-prompt-2026-09-18.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/design/dashboard-program-progress-improvement.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md` → .cursor/rules/rich-text-compose-input-perf.mdc + packages/rich-text/README.md — 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지
- `apps/cms/docs/implementation/template-form-draft-local-save.md` → apps/cms form-set scoped overlay / registration local save 코드 주석·규칙으로 이관 — 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지
- `apps/cms/docs/qa/form-template-fe-gap-report.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/requirements-specification/MVP/README.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/requirements-specification/MVP/phases-frontend-mock.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/requirements-specification/MVP/v0.1-foundation.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/requirements-specification/MVP/v0.2-front-core.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/requirements-specification/MVP/v0.3-admin-ops.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/requirements-specification/MVP/v0.4-settlement-report.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/requirements-specification/MVP/v0.5-security-compliance.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/requirements-specification/progress.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/cms/docs/roadmap/MVP_ROADMAP_V4_DETAILED.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `apps/platform/docs/api/instructor-schedule-options-program-186048-verification-backend-cursor-prompt-2026-10-06.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `docs/admin-platform-kit/05-frontend-architecture-cursor-crosscheck.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `docs/admin-platform-kit/08-gpt-handoff-generic-cms-new-project.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `docs/admin-platform-kit/11-review-gpt-impl-plan-10.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `docs/admin-platform-kit/13-revalidate-doc-12.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `docs/admin-platform-kit/15-consensus-doc-14.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `docs/admin-platform-kit/17-accept-doc-16-and-10r1.md` → (신설 제안/기능별 잔여 목록 — 미작성) — 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님
- `docs/claude/CMS_QA_CHECKLIST.md` → apps/cms docs/qa 또는 e2e 체크리스트로 이관 — 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지
- `docs/claude/CURSOR_REFACTORING_GUIDE.md` → .cursor/rules + apps/cms/.cursor/rules 코딩 규칙으로 흡수 — 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지

## 9. 파일별 상세 (95)

CSV와 동일. 아래는 압축 표.

| 경로 | 기존 | 재판정 | 이유(요약) | 근거 |
|---|---|---|---|---|
| `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-23.md` | `DELETE_CANDIDATE` | `EXTRACT_THEN_DELETE` | 09-26 대표와 diff 상이(완전 동일 복사본 아님). 고유 시드/완료조건 이관 후 삭제 | `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-` |
| `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-25.md` | `DELETE_CANDIDATE` | `EXTRACT_THEN_DELETE` | 09-26과 diff 상이. 재적용 프롬프트 고유분 이관 후 삭제 | `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-` |
| `apps/admin/docs/api/site-management-seed-2026-09-23.md` | `DELETE_CANDIDATE` | `EXTRACT_THEN_DELETE` | 값 SSOT 표기 문서(149줄). 09-26 프롬프트(284줄)와 역할 다름 — 값 표·mock 비SSOT 고지 이관 필요 | `apps/admin/docs/api/site-management-seed-2026-09-23.md:1:# 사이트 관리 시드 (Platform S` |
| `apps/admin/docs/api/site-shell-public-api-frontend-cursor-prompt-2026-09-23.md` | `DELETE_CANDIDATE` | `DELETE_CANDIDATE` | Platform 동명 문서가 존재하고 Admin 사본은 FE 전달용 중복. 링크를 Platform 경로로 교체 후 삭제 가능(런타임 미검증) | `apps/admin/docs/api/site-shell-public-api-frontend-cursor-prompt-2026-09-23.md:2` |
| `apps/cms/docs/api/gemini-organization-application-list-fields-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 부분 완료 이력·후속 preferred-schedule 링크·FE handoff 경로가 본문에 있음. 삭제 시 이력 추적 손실 | `apps/cms/docs/api/gemini-organization-application-list-fields-backend-prompt-202` |
| `apps/cms/docs/api/gemini-organization-application-list-preferred-schedule-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE 완료·FE 확인 및 preferenceRank/blocks 계약이 본문에 잔존. Git만으로 대체하기엔 계약 밀도가 높음 | `apps/cms/docs/api/gemini-organization-application-list-preferred-schedule-backen` |
| `apps/cms/docs/api/gemini-recruitment-create-patch-toplevel-fields-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE/FE 반영 완료이나 top-level 필드 계약 표가 계약 참조로 유용 | `apps/cms/docs/api/gemini-recruitment-create-patch-toplevel-fields-backend-prompt` |
| `apps/cms/docs/api/gemini-recruitment-detail-field-roundtrip-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 왕복 재현·필드 계약 문서. 완료여도 계약 참조로 유지 | `apps/cms/docs/api/gemini-recruitment-detail-field-roundtrip-backend-prompt-2026-` |
| `apps/cms/docs/api/general-individual-volunteer-assignment-local-distance-km-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 상태 BE 완료(옵션 A) + enrich 계약·재현 ID. 연쇄 문서(region/seed) 인덱스 역할 | `apps/cms/docs/api/general-individual-volunteer-assignment-local-distance-km-back` |
| `apps/cms/docs/api/general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | FE 연동 완료 표기 + 후속 seed 링크. 계약 참조 유지 | `apps/cms/docs/api/general-individual-volunteer-assignment-region-distance-backen` |
| `apps/cms/docs/api/general-individual-volunteer-assignment-schedule-location-seed-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 장소 시드·persist P0 계약. 완료 후에도 시드 규칙 참조 | `apps/cms/docs/api/general-individual-volunteer-assignment-schedule-location-seed` |
| `apps/cms/docs/api/general-instructor-approve-preferred-schedule-not-osa-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 기존 DELETE→재판정 KEEP_REFERENCE. 반영 완료·BE 핸드오프 SSOT·OSA 비필수 정책·재현 ID·Flyway V26 기록 | `apps/cms/docs/api/general-instructor-approve-preferred-schedule-not-osa-backend-` |
| `apps/cms/docs/api/general-organization-application-guidance-fields-empty-backend-request-2026-10-09.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE 수정 완료·FORM_ONLY_NOT_PROJECTED 원인·재현 1691189. 즉시 삭제보다 장애 이력/계약 참조 | `apps/cms/docs/api/general-organization-application-guidance-fields-empty-backend` |
| `apps/cms/docs/api/general-program-survey-management-remaining-backend-request-2026-10-02.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | FE 반영 완료·재오픈 금지 명시 + expectedRespondentCount/409 계약 | `apps/cms/docs/api/general-program-survey-management-remaining-backend-request-20` |
| `apps/cms/docs/api/program-business-area-update-backend-prompt-2026-09-29.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE 반영·PATCH→GET 재검증 완료 기록. 사업 필드 계약 참조 | `apps/cms/docs/api/program-business-area-update-backend-prompt-2026-09-29.md:9:| ` |
| `apps/cms/docs/api/program-recruitment-form-remaining-fields-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 모집 잔여 필드 왕복 계약·draftStatus. 완료 후에도 필드 SSOT 참조 | `apps/cms/docs/api/program-recruitment-form-remaining-fields-backend-prompt-2026-` |
| `apps/cms/docs/api/settlement-item-settings-dummy-seed-backend-request.md` | `DELETE_CANDIDATE` | `EXTRACT_THEN_DELETE` | 현행 SSOT를 handoff 문서로 넘김을 본문이 명시. 페이지 URL·FE mock 경로 등 고유 표를 handoff에 흡수 후 삭제 | `apps/cms/docs/api/settlement-item-settings-dummy-seed-backend-request.md:5:> **현` |
| `apps/cms/docs/api/settlement-item-settings-seed.payload.json` | `DELETE_CANDIDATE` | `KEEP_ACTIVE` | 구조화 시드 자산. 문서와 별개로 전달·재시드에 사용 가능. 요청서의 "전달용 사본" 검증 전 삭제 금지 | `apps/cms/docs/api/settlement-item-settings-seed.payload.json:1:(상태 마커 없음 — 존재=Tr` |
| `apps/cms/docs/api/trained-teachers-notion-fe-align-backend-request-2026-09-18.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | BE 회신·FE 재검증 체크리스트 완료 표. 실적 배타성 등 정책 참조 | `apps/cms/docs/api/trained-teachers-notion-fe-align-backend-request-2026-09-18.md` |
| `apps/cms/docs/requirements-specification/analysis/matching-management-analysis.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 요구사항 대비 구현 분석·수용 기준 표. "완료" 칸만으로 삭제 불가 — 분석 문서 역할 | `apps/cms/docs/requirements-specification/analysis/matching-management-analysis.m` |
| `apps/cms/docs/status/DOCUMENT_VALIDITY_REVIEW_2026-04-20.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 문서 유효성 판정 인덱스(archive/redirect). progress.md로 대체되지 않는 메타 목록 | `apps/cms/docs/status/DOCUMENT_VALIDITY_REVIEW_2026-04-20.md:7:- `archive`: 과거 단계` |
| `apps/platform/docs/api/gemini-portal-platform-visibility-backend-prompt-2026-09-30.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | Portal programType=GEMINI_TRAINING SSOT·Flyway 언급. 완료 후 계약 참조 | `apps/platform/docs/api/gemini-portal-platform-visibility-backend-prompt-2026-09-` |
| `apps/platform/docs/api/individual-application-interview-schedule-required-backend-cursor-prompt-2026-10-06.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 면접 없는 프로그램 INTERVIEW_SCHEDULE_REQUIRED 예외 계약. BE 완료여도 정책 참조 | `apps/platform/docs/api/individual-application-interview-schedule-required-backen` |
| `apps/platform/docs/api/mypage-lecture-status-tabs-backend-cursor-prompt-2026-10-06.md` | `DELETE_CANDIDATE` | `KEEP_REFERENCE` | 마이페이지 탭↔displayStatus 매핑 표(옵션 A). FE 탭 구현 SSOT에 가깝음 | `apps/platform/docs/api/mypage-lecture-status-tabs-backend-cursor-prompt-2026-10-` |
| `apps/admin/docs/api/directions-dummy-seed-backend-request.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/admin/docs/api/directions-dummy-seed-backend-request.md:7:| **FE SSOT** | [` |
| `apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-20.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-20.md:` |
| `apps/admin/docs/api/people-dummy-seed-backend-request.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/admin/docs/api/people-dummy-seed-backend-request.md:3:> **내용 SSOT는 이 문서가 아니` |
| `apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25` |
| `apps/admin/docs/api/site-management-seed-ready-frontend-cursor-prompt-2026-09-25.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/admin/docs/api/site-management-seed-ready-frontend-cursor-prompt-2026-09-25` |
| `apps/cms/.cursor/rules/data/api-spec-mock.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지 | `apps/cms/.cursor/rules/data/api-spec-mock.md:36:**Misc endpoints:** todos, mypag` |
| `apps/cms/.cursor/rules/process/styling-token-refactor-delegation.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지 | `apps/cms/.cursor/rules/process/styling-token-refactor-delegation.md:18:- **P0** ` |
| `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_CASE_PRIORITY_2026-09-10.md:4:> 시트 SSO` |
| `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/CMS_FE_PROMPT_AUTO_SEND_WAVES_1_13_2026-09-10.md:3:> 원본 BE SSO` |
| `apps/cms/docs/api/CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/CMS_FE_PROMPT_TEMPLATE_VARIABLES_ENABLED_ENRICH_2026-09-09.md:` |
| `apps/cms/docs/api/api-spec-mock-detailed.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/api-spec-mock-detailed.md:1:(상태 마커 없음 — 존재=True)` |
| `apps/cms/docs/api/api-spec-mock-extended.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/api-spec-mock-extended.md:16:### 0.1 상태/역할 관련 공통 원칙 (사용자 화면 프롬` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/00-fe-mock-id-map-and-rules.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/00-fe-mock-id-map-and-rules.md:` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/01-general-program-dummy-seed.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/01-general-program-dummy-seed.m` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/02-company-school-dummy-seed.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/02-company-school-dummy-seed.md` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md:9` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/04-trained-teachers-dummy-seed.` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/05-nested-child-data-dummy-seed.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/05-nested-child-data-dummy-seed` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md:14:| **` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/README-BE.md:7:**단, 양식(schema) ` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-api-backend-gaps-consolidated.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 시드 레시피·ID 맵·갭 문서. 대표 통합본 신설/이관 완료 전 삭제 금지(부록 B 인벤토리≠이관 완료) | `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-api-backend-gaps-conso` |
| `apps/cms/docs/api/data-management-api-backend-gaps.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/data-management-api-backend-gaps.md:7:**후원사 관리 API 수정(2026-09-` |
| `apps/cms/docs/api/forms-surveys-api-backend-gaps.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/forms-surveys-api-backend-gaps.md:1:# 템플릿 양식 API — 백엔드 핸드오프 (갭` |
| `apps/cms/docs/api/gemini-recruitment-patch-invalid-value-instant-backend-prompt-2026-09-30.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/gemini-recruitment-patch-invalid-value-instant-backend-prompt-` |
| `apps/cms/docs/api/general-volunteer-application-give-up-decision-conflict-backend-request-2026-10-09.md` | `EXTRACT_THEN_DELETE` | `KEEP_REFERENCE` | BE 완료·QA 재현 ID(1691348)·경로 혼동 금지 계약. 이관 전 삭제 부적절 → 참조 유지로 상향 | `apps/cms/docs/api/general-volunteer-application-give-up-decision-conflict-backen` |
| `apps/cms/docs/api/logs-api-backend-gaps.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/logs-api-backend-gaps.md:3:> **2026-08-26 SSOT**: 백엔드 Cursor 실` |
| `apps/cms/docs/api/logs-api-conversion-status-backend-handoff.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/logs-api-conversion-status-backend-handoff.md:1:# 보안 설정(로그 관리)` |
| `apps/cms/docs/api/notification-send-selectable-not-success-qa-2026-09-11.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/notification-send-selectable-not-success-qa-2026-09-11.md:5:> ` |
| `apps/cms/docs/api/notification-sms-nhn-catalog-crud-qa-2026-09-11.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/notification-sms-nhn-catalog-crud-qa-2026-09-11.md:4:> SSOT: `` |
| `apps/cms/docs/api/posts-api-backend-gaps.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/posts-api-backend-gaps.md:1:(상태 마커 없음 — 존재=True)` |
| `apps/cms/docs/api/programs-api-backend-gaps-consolidated.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-api-backend-gaps-consolidated.md:1:# 프로그램 관리 API — 백엔` |
| `apps/cms/docs/api/programs-api-backend-gaps.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-api-backend-gaps.md:1:# 일반 프로그램 API — 백엔드 핸드오프 (갭·미구현` |
| `apps/cms/docs/api/programs-api-conversion-roadmap.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-api-conversion-roadmap.md:7:> 일반 프로그램(`/programs/gene` |
| `apps/cms/docs/api/programs-api-remaining-work.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-api-remaining-work.md:4:**갱신**: 2026-07-15 (§0·코드 기준 ` |
| `apps/cms/docs/api/programs-company-school-detail-api-conversion-status.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-company-school-detail-api-conversion-status.md:1:# 1사` |
| `apps/cms/docs/api/programs-detail-api-conversion-status.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-detail-api-conversion-status.md:1:# 일반 프로그램 상세 — API ` |
| `apps/cms/docs/api/programs-gemini-performance-api-conversion-status.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-gemini-performance-api-conversion-status.md:1:# Gemin` |
| `apps/cms/docs/api/programs-gemini-visiting-training-api-conversion-status.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-gemini-visiting-training-api-conversion-status.md:1:#` |
| `apps/cms/docs/api/programs-trained-teachers-api-conversion-status.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-trained-teachers-api-conversion-status.md:1:# 교육받은 교사` |
| `apps/cms/docs/api/programs-ujat-detail-api-conversion-status.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-ujat-detail-api-conversion-status.md:1:# UJAT 프로그램 상세` |
| `apps/cms/docs/api/programs-ujat-education-regions-api-conversion-status.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/programs-ujat-education-regions-api-conversion-status.md:1:# U` |
| `apps/cms/docs/api/settlement-api-backend-gaps.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/settlement-api-backend-gaps.md:1:# 정산 관리 API — 백엔드 핸드오프 (갭·스펙 ` |
| `apps/cms/docs/api/templates-api-conversion-status-backend-handoff.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/templates-api-conversion-status-backend-handoff.md:1:# 템플릿 관리 ` |
| `apps/cms/docs/api/trained-teacher-registration-flow-backend-prompt-2026-09-18.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/api/trained-teacher-registration-flow-backend-prompt-2026-09-18.md` |
| `apps/cms/docs/design/dashboard-program-progress-improvement.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/design/dashboard-program-progress-improvement.md:9:## 📋 현재 상태 분석` |
| `apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지 | `apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md:4:**상태**: **마이` |
| `apps/cms/docs/implementation/template-form-draft-local-save.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지 | `apps/cms/docs/implementation/template-form-draft-local-save.md:4:**상태**: 구현 설계` |
| `apps/cms/docs/qa/form-template-fe-gap-report.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/qa/form-template-fe-gap-report.md:9:| 구분 | FE 검증 완료 | BE 대기 | Fail` |
| `apps/cms/docs/requirements-specification/MVP/README.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/requirements-specification/MVP/README.md:4:> 모든 기능 ID, 상태값, 역할 체계,` |
| `apps/cms/docs/requirements-specification/MVP/phases-frontend-mock.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/requirements-specification/MVP/phases-frontend-mock.md:10:| MVP | ` |
| `apps/cms/docs/requirements-specification/MVP/v0.1-foundation.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/requirements-specification/MVP/v0.1-foundation.md:5:> **전체 진행률**: ` |
| `apps/cms/docs/requirements-specification/MVP/v0.2-front-core.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/requirements-specification/MVP/v0.2-front-core.md:5:> **전체 진행률**: ` |
| `apps/cms/docs/requirements-specification/MVP/v0.3-admin-ops.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/requirements-specification/MVP/v0.3-admin-ops.md:5:> **전체 진행률**: 약` |
| `apps/cms/docs/requirements-specification/MVP/v0.4-settlement-report.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/requirements-specification/MVP/v0.4-settlement-report.md:5:> **전체 ` |
| `apps/cms/docs/requirements-specification/MVP/v0.5-security-compliance.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/requirements-specification/MVP/v0.5-security-compliance.md:5:> **전` |
| `apps/cms/docs/requirements-specification/progress.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/requirements-specification/progress.md:11:| 카테고리 | 완료 | 부분 완료 | 미구` |
| `apps/cms/docs/roadmap/MVP_ROADMAP_V4_DETAILED.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/cms/docs/roadmap/MVP_ROADMAP_V4_DETAILED.md:7:> **현행 UI 기준 (2026-07-15)**: ` |
| `apps/platform/docs/api/instructor-schedule-options-program-186048-verification-backend-cursor-prompt-2026-10-06.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `apps/platform/docs/api/instructor-schedule-options-program-186048-verification-b` |
| `apps/platform/docs/api/mypage-volunteer-assignment-status-backend-request-2026-10-09.md` | `EXTRACT_THEN_DELETE` | `KEEP_REFERENCE` | Platform 배정현황 assignments API 계약. 문서상 요청/연동 밀도가 높아 이관 완료 전 유지 | `apps/platform/docs/api/mypage-volunteer-assignment-status-backend-request-2026-1` |
| `docs/admin-platform-kit/05-frontend-architecture-cursor-crosscheck.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `docs/admin-platform-kit/05-frontend-architecture-cursor-crosscheck.md:28:5. §19 ` |
| `docs/admin-platform-kit/08-gpt-handoff-generic-cms-new-project.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `docs/admin-platform-kit/08-gpt-handoff-generic-cms-new-project.md:1:# GPT 핸드오프 —` |
| `docs/admin-platform-kit/11-review-gpt-impl-plan-10.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `docs/admin-platform-kit/11-review-gpt-impl-plan-10.md:4:> **대조 기준:** 05 v2 · 06 ` |
| `docs/admin-platform-kit/13-revalidate-doc-12.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `docs/admin-platform-kit/13-revalidate-doc-12.md:1:# 13 — 문서 12 재검증 (focused evid` |
| `docs/admin-platform-kit/15-consensus-doc-14.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `docs/admin-platform-kit/15-consensus-doc-14.md:3:> **상태:** **CONDITIONAL PASS / ` |
| `docs/admin-platform-kit/17-accept-doc-16-and-10r1.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 고유/잔여 가능 — 대표 문서에 이관 후 삭제. 신설 제안만으로는 삭제 승인 아님 | `docs/admin-platform-kit/17-accept-doc-16-and-10r1.md:1:# 17 — 문서 16 수용 · 10r1 생성` |
| `docs/claude/CMS_QA_CHECKLIST.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지 | `docs/claude/CMS_QA_CHECKLIST.md:63:| ID | 테스트 항목 | 예상 결과 | 상태 | 비고 |` |
| `docs/claude/CURSOR_REFACTORING_GUIDE.md` | `EXTRACT_THEN_DELETE` | `EXTRACT_THEN_DELETE` | 이관 대상 지정됨. 실제 섹션 복사 전 삭제 금지 | `docs/claude/CURSOR_REFACTORING_GUIDE.md:18:| `apps/cms/src/features/auth/model/a` |
| `apps/cms/.cursor/rules/coding/react-component-render-as-jsx.mdc` | `MERGE_CANDIDATE` | `MERGE_CANDIDATE` | CMS 파일은 모노레포 규칙 위임 래퍼. 고유 globs(apps/cms/src) 유지 필요 — 삭제 전 루트 규칙에 CMS globs·요약이 흡수됐는지 확인 | `apps/cms/.cursor/rules/coding/react-component-render-as-jsx.mdc:1:(상태 마커 없음 — 존재` |
| `apps/cms/.cursor/rules/coding/react-hooks-after-early-return.mdc` | `MERGE_CANDIDATE` | `MERGE_CANDIDATE` | 동일 — CMS globs 위임 래퍼. 루트에 흡수 후 CMS 래퍼 제거 가능하나 현재는 로딩 경로 중복 | `apps/cms/.cursor/rules/coding/react-hooks-after-early-return.mdc:1:(상태 마커 없음 — 존` |
| `apps/cms/.cursor/rules/coding/rich-text-compose-input-perf.mdc` | `MERGE_CANDIDATE` | `MERGE_CANDIDATE` | CMS 전용 globs(메일 템플릿·rich-text)가 본문에 요약됨. 루트 규칙과 병합 시 globs·금지 조항 이전 필수 | `apps/cms/.cursor/rules/coding/rich-text-compose-input-perf.mdc:11:# Rich text co` |
| `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-seed-case-api-coverage-backend-handoff-2026-07-30.md` | `MERGE_CANDIDATE` | `MERGE_CANDIDATE` | 시드 케이스 API 커버리지 — consolidated gaps·README-BE와 병합 후보. 케이스표 고유행 이관 전 삭제 금지 | `apps/cms/docs/api/be-handoff-program-dummy-seeds/programs-seed-case-api-coverage` |

## 10. 부록 C 샘플 (40) — 전수 아님

요청서 후속 우선순위에 따라 BE 요청 25 + 시드 지침 10 + 규칙 5를 스팟 체크했다. **나머지 642개는 `NOT_AUDITED_IN_THIS_PASS`.**

| 종류 | 경로 | 존재 | 상태 히트 |
|---|---|---|---|
| BE | `apps/admin/docs/api/education-program-intro-backend-gap.md` | Y | `apps/admin/docs/api/education-program-intro-backend-gap.md:1:# 교육 소개 · 프로그램 소개 — BE write API 갭` |
| BE | `apps/admin/docs/api/ja-history-page-backend-cursor-prompt-2026-09-25.md` | Y | `apps/admin/docs/api/ja-history-page-backend-cursor-prompt-2026-09-25.md:19:## 현재 FE 스냅샷 갭 (2026-09-2` |
| BE | `apps/admin/docs/api/logs-backend-gap.md` | Y | `apps/admin/docs/api/logs-backend-gap.md:1:# 로그 관리 — BE 갭 / 요청 문서 인덱스` |
| BE | `apps/admin/docs/api/logs-homepage-admin-api-backend-request.md` | Y | `apps/admin/docs/api/logs-homepage-admin-api-backend-request.md:9:| **우선순위** | 높음 — FE 화면·필터·mock 완료,` |
| BE | `apps/admin/docs/api/main-admin-popup-alttext-error-codes-backend-cursor-prompt-2026-09-20.md` | Y | `apps/admin/docs/api/main-admin-popup-alttext-error-codes-backend-cursor-prompt-2026-09-20.md:16:남은 *` |
| BE | `apps/admin/docs/api/notice-inline-media-backend-gap.md` | Y | `apps/admin/docs/api/notice-inline-media-backend-gap.md:9:| **목적** | Homepage Admin 리치텍스트 **삽입**(이미지·` |
| BE | `apps/admin/docs/api/notice-story-inline-media-backend-cursor-prompt-2026-09-20.md` | Y | `apps/admin/docs/api/notice-story-inline-media-backend-cursor-prompt-2026-09-20.md:11:관련(구 갭, 2026-08` |
| BE | `apps/admin/docs/api/platform-home-featured-story-cover-backend-cursor-prompt-2026-09-20.md` | Y | `apps/admin/docs/api/platform-home-featured-story-cover-backend-cursor-prompt-2026-09-20.md:36:완료 조건:` |
| BE | `apps/admin/docs/api/platform-home-public-main-backend-cursor-prompt-2026-09-20.md` | Y | `apps/admin/docs/api/platform-home-public-main-backend-cursor-prompt-2026-09-20.md:19:완료 조건:` |
| BE | `apps/admin/docs/api/platform-home-public-main-period-backend-cursor-prompt-2026-09-20.md` | Y | `` |
| BE | `apps/admin/docs/api/public-analytics-metric-catalog-backend-cursor-prompt-2026-09-26.md` | Y | `` |
| BE | `apps/admin/docs/api/public-careers-postings-list-search-backend-cursor-prompt-2026-09-26.md` | Y | `` |
| BE | `apps/admin/docs/api/public-education-introduction-api-backend-cursor-prompt-2026-09-26.md` | Y | `` |
| BE | `apps/admin/docs/api/public-impact-stories-list-search-backend-cursor-prompt-2026-09-26.md` | Y | `` |
| BE | `apps/admin/docs/api/public-notices-list-search-backend-cursor-prompt-2026-09-26.md` | Y | `` |
| BE | `apps/admin/docs/api/public-organization-introduction-api-backend-cursor-prompt-2026-09-26.md` | Y | `` |
| BE | `apps/admin/docs/api/public-site-management-api-backend-cursor-prompt-2026-09-26.md` | Y | `` |
| BE | `apps/admin/docs/api/public-transparency-reports-list-search-backend-cursor-prompt-2026-09-26.md` | Y | `` |
| BE | `apps/admin/docs/api/recruit-postings-create-update-backend-cursor-prompt-2026-09-26.md` | Y | `apps/admin/docs/api/recruit-postings-create-update-backend-cursor-prompt-2026-09-26.md:18:| Method |` |
| BE | `apps/admin/docs/api/recruit-postings-public-detail-backend-cursor-prompt-2026-09-26.md` | Y | `apps/admin/docs/api/recruit-postings-public-detail-backend-cursor-prompt-2026-09-26.md:20:| Method |` |
| BE | `apps/admin/docs/api/recruit-talent-application-attachment-backend-cursor-prompt-2026-09-26.md` | Y | `apps/admin/docs/api/recruit-talent-application-attachment-backend-cursor-prompt-2026-09-26.md:14:| M` |
| BE | `apps/admin/docs/api/recruit-talent-application-detail-backend-cursor-prompt-2026-09-26.md` | Y | `apps/admin/docs/api/recruit-talent-application-detail-backend-cursor-prompt-2026-09-26.md:14:| Metho` |
| BE | `apps/admin/docs/api/recruit-talent-applications-list-filter-backend-cursor-prompt-2026-09-26.md` | Y | `apps/admin/docs/api/recruit-talent-applications-list-filter-backend-cursor-prompt-2026-09-26.md:34:완` |
| BE | `apps/admin/docs/api/sponsorship-page-links-backend-cursor-prompt-2026-09-25.md` | Y | `` |
| BE | `apps/admin/docs/api/sponsorship-talent-backend-cursor-prompt-2026-09-25.md` | Y | `apps/admin/docs/api/sponsorship-talent-backend-cursor-prompt-2026-09-25.md:16:예: `TalentApplicationS` |
| RULE | `.cursor/rules/backend-response-cache-policy.mdc` | Y | `.cursor/rules/backend-response-cache-policy.mdc:15:| App | Status | Query key root |` |
| RULE | `.cursor/rules/cms-admin-ui/cms-button-action-sizes.mdc` | Y | `` |
| RULE | `.cursor/rules/cms-admin-ui/cms-data-table.mdc` | Y | `` |
| RULE | `.cursor/rules/cms-admin-ui/file-select-detail-form.mdc` | Y | `` |
| RULE | `.cursor/rules/cms-admin-ui/filter-area-dimensions.mdc` | Y | `.cursor/rules/cms-admin-ui/filter-area-dimensions.mdc:26:- 단일 검색·셀렉트를 행 fill 로 늘림 (`flex: 1 1 0`, `w` |
| SEED | `apps/admin/docs/api/directions-kakao-roughmap-seed-backend-cursor-prompt-2026-09-26.md` | Y | `apps/admin/docs/api/directions-kakao-roughmap-seed-backend-cursor-prompt-2026-09-26.md:20:Admin·Plat` |
| SEED | `apps/admin/docs/api/education-business-catalog-dummy-seed-backend-request.md` | Y | `apps/admin/docs/api/education-business-catalog-dummy-seed-backend-request.md:7:| **FE SSOT** | `educ` |
| SEED | `apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-26.md` | Y | `apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-26.md:1:# Cursor prompt — ` |
| SEED | `apps/admin/docs/api/education-targets-dummy-seed-backend-request.md` | Y | `apps/admin/docs/api/education-targets-dummy-seed-backend-request.md:6:| **FE SSOT** | `education-tar` |
| SEED | `apps/admin/docs/api/education-textbooks-dummy-seed-backend-request.md` | Y | `apps/admin/docs/api/education-textbooks-dummy-seed-backend-request.md:6:| **FE SSOT** | `education-t` |
| SEED | `apps/admin/docs/api/footer-dummy-seed-backend-request.md` | Y | `apps/admin/docs/api/footer-dummy-seed-backend-request.md:7:| **FE SSOT** | [`apps/admin/src/features` |
| SEED | `apps/admin/docs/api/gnb-menu-dummy-seed-backend-request.md` | Y | `apps/admin/docs/api/gnb-menu-dummy-seed-backend-request.md:7:| **FE SSOT** | [`apps/admin/src/featur` |
| SEED | `apps/admin/docs/api/hero-banner-dummy-seed-backend-request.md` | Y | `apps/admin/docs/api/hero-banner-dummy-seed-backend-request.md:6:| **갱신** | 2026-09-20 — FE SSOT를 Pla` |
| SEED | `apps/admin/docs/api/impact-stories-dummy-seed-backend-request.md` | Y | `apps/admin/docs/api/impact-stories-dummy-seed-backend-request.md:7:| **FE SSOT** | Platform `apps/pl` |
| SEED | `apps/admin/docs/api/impact-story-categories-dummy-seed-backend-request.md` | Y | `apps/admin/docs/api/impact-story-categories-dummy-seed-backend-request.md:7:| **FE SSOT** | Platform` |

샘플 결론: 40/40 존재. 역할 라벨(BE 요청/시드/규칙)은 요청서와 충돌하지 않음. 완료·현행 API 정합은 미검증.

## 11. 유지해야 할 핵심 계약·정책·규칙·시드 (이번 재검수에서 확인)

- GENERAL 강사 배정: 승인 기관 **희망 일정** SSOT, OSA 선배정 비필수 (`general-instructor-approve-preferred-schedule-not-osa-...` + FE `instructor-organization-schedule-scope.ts`)
- 기관 안내 사항: `FORM_ONLY_NOT_PROJECTED` / guidance snapshot 프로젝션
- 봉사 give-up: `volunteer-applications/{id}/give-up` vs 진행현황 participants give-up 혼동 금지
- Platform 마이페이지 lecture tabs / Gemini Portal `GEMINI_TRAINING`
- CMS React 훅·JSX·rich-text 성능 규칙 (루트 + CMS globs 래퍼)
- Program dummy seed ID 맵·유형별 시드 레시피 (`be-handoff-program-dummy-seeds/`)
- Settlement item settings JSON payload (`settlement-item-settings-seed.payload.json`)

## 12. 권장 실행 순서 (이번 패스에서 실행하지 않음)

1. 대표 문서 확정(기존 09-26·README-BE·루트 규칙·도메인 잔여 목록 신설 여부)
2. 고유 내용·잔여 작업·QA 재현·수용 기준 이관
3. 문서/규칙 참조 링크·`globs` 로딩 경로 갱신
4. 관련 검증(시드 dry-run·규칙 로딩·링크 깨짐)
5. 별도 정리 PR에서만 삭제/병합

## 13. 추가 정리 후보 (이번 95 밖, 관찰)

- 부록 C의 BE 요청 217개: 완료/대체 여부 전수 확인 후 기능별 잔여 목록으로 묶기
- Admin `*-dummy-seed-backend-request.md` vs `*-2026-09-26.md` 날짜 사본 패턴 반복
- `docs/claude/*`와 `.cursor/rules` 중복 가이드

---

*이 보고서는 읽기 전용 재검수 결과이며, 첨부 요청서의 기존 판정을 정답으로 가정하지 않았다.*

## 14. 이관 실행 결과 (2026-10-10)

JSON 시드는 삭제 대상에서 제외했다.

| 항목 | 수 |
|---|---:|
| 이관 후 삭제한 md/mdc (이번 배치) | 72 |
| 이전에 삭제한 중복 (site-shell Admin 사본) | 1 |
| **삭제 합계 (JSON 제외)** | **73** |
| 원본 95 중 유지 | 22 (`KEEP_REFERENCE` 20 + JSON 1 + `progress.md` 1) |
| 이관 SSOT | [`docs/audit/extracted-ssot-2026-10-10/`](./extracted-ssot-2026-10-10/README.md) |

이관 방식: 그룹별 발췌 SSOT에 상태표·계약 마커 요약을 옮긴 뒤 원문 md/mdc 삭제.  
`settlement-item-settings-seed.payload.json` 유지. CMS coding 규칙 래퍼는 루트 규칙으로 위임 정리.

