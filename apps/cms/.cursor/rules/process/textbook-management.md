# 교재 관리 (CMS) — 기획 메모

## 사업 분야

교재 목록·필터·등록·상세의 **사업 분야**는 「사업 분야 관리」 마스터 API가 SSOT.

- API: `GET/POST /api/admin/textbook-business-areas`, `PATCH/DELETE …/{businessAreaId}`
- 초기 시드(원격 비활성 fallback): `TEXTBOOK_BUSINESS_AREAS` 4종
- **추가**: 하단 입력 행 → 등록 시 `POST` 즉시
- **수정**: `PATCH` 즉시 — 서버가 교재 명칭 cascade
- **삭제**: `deletable === false` 또는 409 → 불가 안내 팝업
- **사업 분야 설정**: FE 확인 팝업만 (배치 저장 API 없음)
- 모달 셸: width 600 · max-height 880 · padding 26/30/34 · gap 30 · radius 12 · shadow `0 0 25px rgba(0,0,0,0.35)`

## 교육 대상

목록·필터·등록에서 **교육 대상**은 아래 **순서·표기**를 따른다.

1. 유아
2. 초등학교
3. 중학교
4. 고등학교
5. 대학교

필터 셀렉트는 **전체** 다음에 위 순서대로 노출한다.

코드 상수: `features/textbook/model/textbook-education-targets.ts`의 `TEXTBOOK_EDUCATION_TARGETS` / `TEXTBOOK_EDUCATION_TARGET_SELECT_OPTIONS`.  
목(Mock)의 `educationTarget`·`normalizeEducationStages`의 `toEducationStageKey`와 동일한 문자열을 사용한다.
