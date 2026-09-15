# 일반 프로그램 Primary 8 — CMS 상세 UI 어댑터 (2026-09-15)

Backend SoT: `168001`–`168008` / `LocalDemoGeneralPrimaryCaseSeedContributor`  
BE 핸드오프: JABACK `docs/frontend/general-primary-case-seed-handoff-2026-09.md`

## FE 변경 요약

- `parseGeneralProgramServiceDetailJson` — TT alias·root flatten 키를 `generalCommonInfo.*RecruitmentInfo`로 정규화, `studentListRequired`·면접 플래그 hydrate
- 모집 3섹션 display — `*Label` 우선, `false`/`not_required`를 "-"가 아닌 라벨로, Tel/Email/비고 nested fallback
- `settlementPolicy.wagePolicies` / `paymentItems` → 공통정보 임금·지급항목 표시
- LNB — `instructorRecruitmentInfo` / `volunteerRecruitmentInfo` 존재 시에도 섹션 노출, nested 봉사 면접 플래그 반영
- 단위 테스트: `general-primary-case-detail-adapter.test.ts` (Case1·3·5)

## 수동 스모크

1. bootRun(local) 재시작 후 CMS에서 `168001` 상세 → 참여 기관 모집 정보 공고/명단/사전안내/최대강사/학급/Tel/Email/비고
2. `168003` 강사 탭 숨김·봉사 노출, `168005` 강사·봉사·설문 숨김
3. 임금 1~3급·지급항목이 settlementPolicy 기준인지 확인
