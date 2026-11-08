import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import type { InquiryCategoryRow } from '@/features/posts/model/admin-inquiry-management.types'

const INQUIRY_CATEGORY_SEED_NAMES = [
  '계정',
  '프로그램',
  '결제',
  '활동',
  '봉사시간',
  '시스템',
  '정산',
  '안내',
  '기타',
] as const

/** 카테고리 관리 모달 초기 행 */
export function createInitialInquiryCategoryRows(): InquiryCategoryRow[] {
  return INQUIRY_CATEGORY_SEED_NAMES.map((name, i) => ({
    id: `inq-cat-${i}`,
    name,
  }))
}

/**
 * TableFilterGroup `fields` — FAQ·공지와 동일 픽셀 폭 + FilterTableLayout `filterResponsiveWrap`(4개 이상 시 flex-wrap).
 */
export function buildAdminInquiryManagementFilterFields(
  categoryLabels: readonly string[]
): FilterFieldConfig[] {
  const categoryOptions = [
    { label: '전체', value: 'ALL' },
    ...categoryLabels.map(label => ({ label, value: label })),
  ]

  const statusOptions = [
    { label: '전체', value: 'ALL' },
    { label: '답변 대기', value: 'PENDING' },
    { label: '답변 완료', value: 'ANSWERED' },
  ]

  return [
    {
      key: 'status',
      type: 'select',
      label: '답변 현황',
      placeholder: '전체',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
      options: statusOptions,
    },
    {
      key: 'category',
      type: 'select',
      label: '카테고리',
      placeholder: '전체',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
      options: categoryOptions,
    },
    {
      key: 'programName',
      type: 'search',
      label: '프로그램명',
      placeholder: '프로그램명을 입력해 주세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'title',
      type: 'search',
      label: '제목',
      placeholder: '제목을 입력해 주세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'memberName',
      type: 'search',
      label: '문의 회원',
      placeholder: '문의 회원명을 입력해 주세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'assigneeName',
      type: 'search',
      label: '담당자',
      placeholder: '담당자명을 입력해 주세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'dateRange',
      type: 'dateRange',
      label: '문의일',
      defaultValue: null,
      width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    },
  ]
}

/** @deprecated `buildAdminInquiryManagementFilterFields` 사용 */
export function buildAdminInquiryFilterRows(
  categoryLabels: readonly string[]
): FilterFieldConfig[][] {
  const fields = buildAdminInquiryManagementFilterFields(categoryLabels)
  return [fields.slice(0, 5), fields.slice(5)]
}
