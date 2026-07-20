export type UjatHalfSemesterKey = 'h1' | 'h2'

export type UjatEducationDelivery = 'online' | 'offline' | 'hybrid'

export type UjatTextbookEducationMode = 'ja' | 'instructor_outsource'

export type UjatHalfMultiScheduleBundle = {
  rowIds: number[]
  regionByRow: Record<string, string[]>
  dateByRow: Record<string, string | null>
}

export type UjatHalfEventRangeSeal = { start: string | null; end: string | null }

export const EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE: UjatHalfMultiScheduleBundle = {
  rowIds: [0],
  regionByRow: { '0': [] },
  dateByRow: { '0': null },
}

export const EMPTY_UJAT_HALF_EVENT_RANGE_SEAL: UjatHalfEventRangeSeal = {
  start: null,
  end: null,
}

export function ujatHalfScheduleOverlayKeys(half: UjatHalfSemesterKey) {
  const prefix = `ujat.${half}`
  return {
    preName: `${prefix}.pre.name`,
    preMulti: `${prefix}.pre.multi`,
    preDelivery: `${prefix}.pre.delivery`,
    preTextbookMode: `${prefix}.pre.textbookMode`,
    preTextbookInstructorId: `${prefix}.pre.textbookInstructorId`,
    eventName: `${prefix}.event.name`,
    eventRange: `${prefix}.event.range`,
    eventDelivery: `${prefix}.event.delivery`,
    closingName: `${prefix}.closing.name`,
    closingMulti: `${prefix}.closing.multi`,
    closingDelivery: `${prefix}.closing.delivery`,
    delivery: (section: 'pre' | 'event' | 'closing') => `${prefix}.${section}.delivery`,
    multi: (section: 'pre' | 'closing') => `${prefix}.${section}.multi`,
  } as const
}

export const UJAT_HALF_SEMESTER_TITLE: Record<UjatHalfSemesterKey, string> = {
  h1: '상반기 교육 일정',
  h2: '하반기 교육 일정',
}

export const UJAT_EDUCATION_DELIVERY_LABEL: Record<UjatEducationDelivery, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
}
