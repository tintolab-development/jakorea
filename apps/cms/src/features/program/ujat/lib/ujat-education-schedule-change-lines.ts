import dayjs from 'dayjs'
import { parseEducationScheduleLineToChangeRange } from '@/features/program/shared/lib/education-schedule-change'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import {
  EMPTY_UJAT_HALF_EVENT_RANGE_SEAL,
  type UjatHalfEventRangeSeal,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'

/** 일정 변경 팝업이 파싱하는 일정 한 줄로 바꾼다. 기간이 없으면 빈 문자열. */
export function ujatEventRangeToScheduleLine(seal: UjatHalfEventRangeSeal): string {
  const start = seal.start ? dayjs(seal.start) : null
  const end = seal.end ? dayjs(seal.end) : null
  if (!start?.isValid() || !end?.isValid()) return ''
  return formatEducationScheduleLineFromRange([start, end])
}

/** 팝업에서 확정한 일정 한 줄을 상·하반기 행사 기간 seal로 되돌린다. */
export function ujatScheduleLineToEventRange(line: string): UjatHalfEventRangeSeal {
  const range = parseEducationScheduleLineToChangeRange(line)
  if (!range) return EMPTY_UJAT_HALF_EVENT_RANGE_SEAL
  return {
    start: range[0].format('YYYY-MM-DD'),
    end: range[1].format('YYYY-MM-DD'),
  }
}
