/**
 * 도메인별 색상 상수
 * 브랜드 컬러 기반 색상 시스템
 * 메인 컬러: #01A1AF, 서브 컬러: #296075, #22404B
 */

// 브랜드 컬러 (CSS 변수)
export const brandColors = {
  primary: 'var(--color-brand-primary)', // #01A1AF
  secondary1: 'var(--color-brand-secondary-1)', // #296075
  secondary2: 'var(--color-brand-secondary-2)', // #22404B
} as const

// 브랜드 컬러 (Hex 값 - Ant Design 컴포넌트용)
export const brandColorsHex = {
  primary: '#01a1af',
  secondary1: '#296075',
  secondary2: '#22404b',
} as const

// 도메인별 색상 (CSS 변수)
export const domainColors = {
  program: {
    primary: 'var(--color-program)', // #01A1AF (메인 컬러)
    light: 'var(--color-program-light)', // #E6F7F9
    dark: 'var(--color-program-dark)', // #296075 (서브 컬러 1)
  },
  school: {
    primary: 'var(--color-school)', // #13C2C2
    light: 'var(--color-school-light)', // #E6FFFB
    dark: 'var(--color-school-dark)', // #08979C
  },
  instructor: {
    primary: 'var(--color-instructor)', // #722ED1
    light: 'var(--color-instructor-light)', // #F9F0FF
    dark: 'var(--color-instructor-dark)', // #531DAB
  },
  sponsor: {
    primary: 'var(--color-sponsor)', // #FA8C16
    light: 'var(--color-sponsor-light)', // #FFF7E6
    dark: 'var(--color-sponsor-dark)', // #D46B08
  },
  application: {
    primary: 'var(--color-application)', // #EB2F96
    light: 'var(--color-application-light)', // #FFF0F6
    dark: 'var(--color-application-dark)', // #C41D7F
  },
  schedule: {
    primary: 'var(--color-schedule)', // #FADB14
    light: 'var(--color-schedule-light)', // #FFFBE6
    dark: 'var(--color-schedule-dark)', // #D4B106
  },
  matching: {
    primary: 'var(--color-matching)', // #52C41A
    light: 'var(--color-matching-light)', // #F6FFED
    dark: 'var(--color-matching-dark)', // #389E0D
  },
  settlement: {
    primary: 'var(--color-settlement)', // #FF4D4F
    light: 'var(--color-settlement-light)', // #FFF1F0
    dark: 'var(--color-settlement-dark)', // #CF1322
  },
} as const

// 도메인별 색상 (Hex 값 - Ant Design 컴포넌트용)
export const domainColorsHex = {
  program: {
    primary: '#01a1af',
    light: '#e6f7f9',
    dark: '#296075',
  },
  school: {
    primary: '#13c2c2',
    light: '#e6fffb',
    dark: '#08979c',
  },
  instructor: {
    primary: '#722ed1',
    light: '#f9f0ff',
    dark: '#531dab',
  },
  sponsor: {
    primary: '#fa8c16',
    light: '#fff7e6',
    dark: '#d46b08',
  },
  application: {
    primary: '#eb2f96',
    light: '#fff0f6',
    dark: '#c41d7f',
  },
  schedule: {
    primary: '#fadb14',
    light: '#fffbe6',
    dark: '#d4b106',
  },
  matching: {
    primary: '#52c41a',
    light: '#f6ffed',
    dark: '#389e0d',
  },
  settlement: {
    primary: '#ff4d4f',
    light: '#fff1f0',
    dark: '#cf1322',
  },
} as const

// 텍스트 색상
export const textColors = {
  heading: 'var(--color-text-heading)', // #22404B
  body: 'var(--color-text-body)', // #595959
  secondary: 'var(--color-text-secondary)', // #8C8C8C
  link: 'var(--color-link)', // #01A1AF
  linkHover: 'var(--color-link-hover)', // #296075
} as const

// 배경 색상
export const bgColors = {
  base: 'var(--color-bg-base)', // #FFFFFF
  secondary: 'var(--color-bg-secondary)', // #FAFAFA
  accent: 'var(--color-bg-accent)', // #E6F7F9
  hover: 'var(--color-bg-hover)', // #F0F0F0
} as const




