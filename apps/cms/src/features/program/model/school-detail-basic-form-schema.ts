/**
 * 학교 상세 기본 정보 수정 폼 스키마 (수정 가능 필드만)
 * 수정 가능: 진행 장소, 대기실 여부 및 위치, 식사 제공 여부 및 안내, 담당 교사
 * 명세: docs/design/school-detail-basic-edit-mode-spec.md
 */

import { z } from 'zod'
import type { SchoolDetailForModal } from './school-detail-types'

export const schoolDetailBasicFormSchema = z
  .object({
    venue: z.string().optional(),
    waitingRoomAvailable: z.boolean(),
    waitingRoomLocation: z.string().optional(),
    mealProvided: z.boolean(),
    mealNotice: z.string().optional(),
    teacherName: z.string().optional(),
    teacherPhone: z.string().optional(),
    teacherEmail: z.string().optional(),
  })
  .refine(
    data => !data.waitingRoomAvailable || (data.waitingRoomLocation ?? '').trim().length > 0,
    { message: '대기실 위치를 입력해주세요', path: ['waitingRoomLocation'] }
  )

export type SchoolDetailBasicFormValues = z.infer<typeof schoolDetailBasicFormSchema>

export const EMPTY_BASIC_FORM_VALUES: SchoolDetailBasicFormValues = {
  venue: '',
  waitingRoomAvailable: false,
  waitingRoomLocation: '',
  mealProvided: false,
  mealNotice: '',
  teacherName: '',
  teacherPhone: '',
  teacherEmail: '',
}

export function detailToBasicFormValues(detail: SchoolDetailForModal): SchoolDetailBasicFormValues {
  return {
    venue: detail.venue ?? '',
    waitingRoomAvailable: detail.waitingRoomAvailable ?? false,
    waitingRoomLocation: detail.waitingRoomLocation ?? '',
    mealProvided: detail.mealProvided ?? false,
    mealNotice: detail.mealNotice ?? '',
    teacherName: detail.teacherName ?? '',
    teacherPhone: detail.teacherPhone ?? '',
    teacherEmail: detail.teacherEmail ?? '',
  }
}

export function basicFormValuesToDetailPatch(
  values: SchoolDetailBasicFormValues
): Partial<SchoolDetailForModal> {
  return {
    venue: values.venue?.trim() || undefined,
    waitingRoomAvailable: values.waitingRoomAvailable,
    waitingRoomLocation: values.waitingRoomAvailable
      ? values.waitingRoomLocation?.trim() || undefined
      : undefined,
    mealProvided: values.mealProvided,
    mealNotice: values.mealProvided ? values.mealNotice?.trim() || undefined : undefined,
    teacherName: values.teacherName?.trim() || undefined,
    teacherPhone: values.teacherPhone?.trim() || undefined,
    teacherEmail: values.teacherEmail?.trim() || undefined,
  }
}
