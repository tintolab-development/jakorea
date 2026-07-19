/** 현재 라우트·플로우를 사람이 읽을 수 있는 상황 라벨로 변환 */

export function describeE2eErrorSituation(pathname: string, search = ''): string {
  const path = pathname || '/'
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

  if (path.startsWith('/programs/general')) {
    if (params.get('new') === '1') {
      const step = params.get('generalStep') ?? ''
      if (step.startsWith('recruit')) return '일반 프로그램 등록 · 모집 정보'
      if (step.startsWith('application') || step.startsWith('apply')) {
        return '일반 프로그램 등록 · 신청 정보'
      }
      return '일반 프로그램 등록 · 공통 정보'
    }
    if (params.get('programId')) return '일반 프로그램 상세'
    return '일반 프로그램 목록'
  }

  if (path.startsWith('/programs/company-school')) return '1사1교 프로그램'
  if (path.startsWith('/programs/ujat')) return 'UJAT 프로그램'
  if (path.startsWith('/programs/gemini')) return 'Gemini 프로그램'
  if (path.startsWith('/auth/mfa') || path === '/auth/mfa') return 'MFA 인증'
  if (path.startsWith('/login')) return '로그인'
  if (path === '/' || path === '') return '대시보드 홈'

  return path
}

export function getCurrentRouteContext(): { situation: string; route: string } {
  if (typeof window === 'undefined') {
    return { situation: '(ssr)', route: '' }
  }
  const { pathname, search } = window.location
  return {
    situation: describeE2eErrorSituation(pathname, search),
    route: `${pathname}${search}`,
  }
}
