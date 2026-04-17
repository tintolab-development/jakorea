import type { TemplateAudience, TemplateStatus } from '@/types/template'

export {
  TEMPLATE_FORM_SEPARATOR_WIDTH_PX,
  FORM_INPUTS_2_WIDTHS,
  FORM_INPUTS_3_WIDTHS,
  FORM_INPUTS_4_WIDTHS,
  FORM_INPUTS_5_WIDTHS,
} from './constants/form-input-widths'

export const audienceOptions: Array<{ value: TemplateAudience; label: string }> = [
  { value: 'ADMIN_INTERNAL', label: '운영(내부)' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'INDIVIDUAL', label: '학생' },
]

export const statusOptions: Array<{ value: TemplateStatus; label: string }> = [
  { value: 'draft', label: '초안' },
  { value: 'review', label: '검토' },
  { value: 'published', label: '게시' },
  { value: 'archived', label: '아카이브' },
]

export const defaultSampleValues: Record<string, string> = {
  name: '홍길동',
  programTitle: '금융교육 봉사 프로그램',
  date: '2026-01-09',
  time: '10:00',
  location: '서울시 마포구 OO학교',
  link: 'https://example.com',
  startDate: '2026-01-09',
  endDate: '2026-02-27',
  message: '안내드립니다.',
}

export const commonVariables = [
  'name',
  'programTitle',
  'date',
  'time',
  'location',
  'startDate',
  'endDate',
  'link',
  'message',
]
