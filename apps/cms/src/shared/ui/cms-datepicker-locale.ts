/**
 * CMS 날짜 선택기 공통 한국어 로케일 (QA-0312).
 *
 * - antd ko_KR: 헤더(2026년 10월)·「오늘」·월/년 패널 문구
 * - dayjs `ko` 등록: 요일 헤더(일 월 화 …). 등록만 하고 전역 `dayjs.locale()`은 바꾸지 않는다
 *   (antd 피커는 인스턴스 단위로 locale을 적용한다 → 다른 날짜 포맷·캘린더 영향 없음).
 */
import 'dayjs/locale/ko'
import koKR from 'antd/es/date-picker/locale/ko_KR'

export const CMS_DATE_PICKER_LOCALE = koKR
