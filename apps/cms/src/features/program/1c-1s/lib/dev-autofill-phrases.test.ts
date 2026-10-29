import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  buildEconomyAutofillDatePlan,
  buildEconomyAutofillPreferredScheduleBlocks,
  selectEconomyRegistrationAutofillPhrases,
} from './dev-autofill-phrases'

const ALLOWED_TITLES = [
  '1사1교 경제금융교육',
  '1사1교 현명한 소비와 저축',
  '1사1교 우리 동네 경제 탐험',
  '1사1교 용돈 관리 교실',
]

const FORBIDDEN = ['디지털 리터러시', '진로 설계', '기업가정신', '봉사단']

describe('selectEconomyRegistrationAutofillPhrases', () => {
  it('1사1교 기획에 맞는 제목·2차시 쌍·모집 문구만 고른다', () => {
    const seenTitles = new Set<string>()
    for (let index = 0; index < 24; index += 1) {
      const picked = selectEconomyRegistrationAutofillPhrases({
        year: 2026,
        random: () => (index * 17 + 3) % 100 / 100,
      })
      seenTitles.add(picked.program.titleKo)
      expect(ALLOWED_TITLES).toContain(picked.program.titleKo)
      expect(picked.program.titleEn.length).toBeGreaterThan(0)
      expect(picked.program.publicTitle).toContain('2026')
      expect(picked.program.publicTitle).toContain('모집')
      expect(picked.units).toHaveLength(2)
      expect(picked.units[0].name).not.toBe(picked.units[1].name)
      expect(picked.units[0].content.length).toBeGreaterThan(0)
      expect(picked.units[1].content.length).toBeGreaterThan(0)
      expect(picked.targetLevels.every(level => ['elementary', 'middle', 'high'].includes(level))).toBe(
        true
      )
      expect(picked.targetLevels).not.toContain('university')
      expect(picked.targetLevelDetail.length).toBeGreaterThan(0)

      const blob = [
        picked.program.titleKo,
        picked.program.publicTitle,
        picked.recruit.programDescription,
        picked.recruit.recruitmentGuide,
        picked.recruit.applicationMethod,
        picked.recruit.learningSupportContent,
        picked.recruit.otherNotes,
        picked.recruit.additionalContentHtml,
        picked.recruit.notes,
        ...picked.units.flatMap(unit => [unit.name, unit.content]),
      ].join('\n')
      for (const word of FORBIDDEN) {
        expect(blob).not.toContain(word)
      }
      expect(picked.recruit.programDescription).toContain('학교')
      expect(picked.recruit.programDescription).toContain('강사')
      expect(picked.recruit.programDescription).toContain('봉사자는 모집하지 않습니다')
      expect(picked.recruit.recruitmentGuide).toContain('합반 신청은 받지 않으며')
      expect(picked.recruit.recruitmentGuide).toContain('학생 명단은 제출하지 않습니다')
      expect(picked.recruit.recruitmentGuide).toContain('사전 안내 사항')
      expect(picked.recruit.applicationMethod).toContain('2차시')
      expect(picked.recruit.applicationMethod).toContain('2개')
    }
    expect(seenTitles.size).toBeGreaterThan(1)
  })
})

describe('buildEconomyAutofillDatePlan', () => {
  it('사업 기간을 약 1년으로 두고 모집·교육 기간을 그 안에 둔다', () => {
    const plan = buildEconomyAutofillDatePlan(dayjs('2026-10-02'))
    const businessStart = dayjs(plan.business.start)
    const businessEnd = dayjs(plan.business.end)
    expect(businessEnd.diff(businessStart, 'day')).toBeGreaterThanOrEqual(360)
    expect(businessEnd.diff(businessStart, 'day')).toBeLessThanOrEqual(366)
    expect(dayjs(plan.recruit.start).isBefore(dayjs(plan.recruit.end))).toBe(true)
    expect(dayjs(plan.recruit.end).isBefore(businessEnd)).toBe(true)
    expect(dayjs(plan.educationPeriod.start).isAfter(businessStart)).toBe(true)
    expect(dayjs(plan.educationPeriod.end).isBefore(businessEnd)).toBe(true)
    expect(dayjs(plan.interview.start).isBefore(dayjs(plan.interview.end))).toBe(true)
    expect(dayjs(plan.interview.end).isBefore(dayjs(plan.recruit.end))).toBe(true)
  })

  it('1·2지망 희망일을 교육 기간 안에서 만들고 사업 기간 밖으로 내보내지 않는다', () => {
    const plan = buildEconomyAutofillDatePlan(dayjs('2026-10-02'))
    const schedules = buildEconomyAutofillPreferredScheduleBlocks(plan.educationPeriod)
    const businessStart = dayjs(plan.business.start)
    const businessEnd = dayjs(plan.business.end)
    const educationStart = dayjs(plan.educationPeriod.start)
    const educationEnd = dayjs(plan.educationPeriod.end)

    for (const schedule of [schedules.first, schedules.second]) {
      const date = dayjs(schedule.date)
      expect(!date.isBefore(educationStart, 'day')).toBe(true)
      expect(!date.isAfter(educationEnd, 'day')).toBe(true)
      expect(!date.isBefore(businessStart, 'day')).toBe(true)
      expect(!date.isAfter(businessEnd, 'day')).toBe(true)
    }
    expect(schedules.first.session).toBe('1')
    expect(schedules.second.session).toBe('2')
  })
})
