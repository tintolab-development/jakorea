/**
 * 단락/공유 날짜·시간 팝오버 기본 z-index.
 * 일반 프로그램 상세 풀페이지(1100)·템플릿 풀페이지(1100)보다 위여야
 * 모달 안 폼 라벨이 캘린더 클릭을 가로채지 않는다.
 * 더 높은 중첩 모달(권한/면접 등)은 호출부에서 parentZ + 100 으로 넘긴다.
 */
export const CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX = 1200

/** 풀페이지·중첩 ContentModal(권한/면접 등 ~2500) 위에 단일 확인 Alert를 항상 노출 */
export const CMS_ALERT_MODAL_Z_INDEX = 10000
