/**
 * API 문구는 한 줄이어도 시안은 PC/모바일 소프트 브레이크가 있다.
 * 응답 문자열이 시드와 같을 때만 적용하고, 관리자가 고치면 자연 줄바꿈으로 둔다.
 */

export type SoftBreakLines = {
  pc: readonly string[]
  mobile: readonly string[]
}

/** 시안 줄은 공백 없이 끊고, API 본문은 줄 사이 공백이 있다. */
function joined(lines: readonly string[]): string {
  return lines.join(' ')
}

/** API 개행이 있으면 그대로. 없으면 시안 소프트 브레이크를 조건부로 쓴다. */
export function resolveSoftBreaks(
  text: string,
  soft: SoftBreakLines | undefined,
): SoftBreakLines {
  if (text.includes('\n')) {
    const lines = text.split('\n')
    return { pc: lines, mobile: lines }
  }
  if (soft && joined(soft.pc) === text && joined(soft.mobile) === text) {
    return soft
  }
  return { pc: [text], mobile: [text] }
}

export const PHILOSOPHY_CARD_SOFT_BREAKS: Record<string, SoftBreakLines> = {
  practice: {
    pc: ['실제 환경과 유사한 체험 활동으로', '새로운 기술과 문제 해결 방법을 배웁니다.'],
    mobile: ['실제 환경과 유사한 체험 활동으로', '새로운 기술과 문제 해결 방법을 배웁니다.'],
  },
  'role-model': {
    pc: ['교사, 기업인, 봉사자,', '멘토의 경험을 통해 자신의 미래를', '구체적으로 상상합니다.'],
    mobile: ['교사, 기업인, 봉사자, 멘토의 경험을 통해', '자신의 미래를 구체적으로 상상합니다.'],
  },
  mindset: {
    pc: ['부정적인 생각에 머무르지 않고,', '다음 도전으로 이어갈 수 있는', '회복력을 기릅니다.'],
    mobile: ['부정적인 생각에 머무르지 않고, 다음 도전으로', '이어갈 수 있는 회복력을 기릅니다.'],
  },
  support: {
    pc: ['자신의 가능성을 믿어주는 사람들의 응원 속에서 더 큰 도전을 시작합니다.'],
    mobile: ['자신의 가능성을 믿어주는 사람들의 응원 속에서', '더 큰 도전을 시작합니다.'],
  },
}

export const THRIVE_CARD_SOFT_BREAKS: Record<string, SoftBreakLines> = {
  empower: {
    pc: ['더 많은 지역의 청소년에게 배움의 기회를 전합니다.'],
    mobile: ['더 많은 지역의 청소년에게', '배움의 기회를 전합니다.'],
  },
  digital: {
    pc: ['AI와 디지털 기술을 활용해 새로운', '교육 경험을 만듭니다.'],
    mobile: ['AI와 디지털 기술을 활용해', '새로운 교육 경험을 만듭니다.'],
  },
  partner: {
    pc: ['학교, 기업, 정부, 지역사회가 협력해', '지속가능한 변화를 만듭니다.'],
    mobile: ['학교, 기업, 정부, 지역사회가 협력해', '지속가능한 변화를 만듭니다.'],
  },
  enablers: {
    pc: [
      '데이터 기반 의사결정, 이해관계자 참여 및 AI 자동화 활용, 회원국 성장 단계별 지원을 통해 청소년 교육의 기반을 강화합니다.',
    ],
    mobile: [
      '데이터 기반 의사결정, 이해관계자',
      '참여 및 AI 자동화 활용, 회원국 성장',
      '단계별 지원을 통해 청소년 교육의',
      '기반을 강화합니다.',
    ],
  },
}
