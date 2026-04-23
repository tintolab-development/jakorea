# 교재 관리 (CMS) — 기획 메모

## 사업 분야

교재 목록·필터·등록·상세 수정에서 **사업 분야**는 아래 **4가지만** 허용한다. 표기·철자를 바꾸면 필터·목 데이터·API 계약을 함께 맞춘다.

1. 기업가정신
2. 경제금융
3. 진로취업
4. 디지털 리터러시

코드 상수: `features/textbook/model/textbook-business-areas.ts`의 `TEXTBOOK_BUSINESS_AREAS` / `TEXTBOOK_BUSINESS_AREA_SELECT_OPTIONS`.

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
