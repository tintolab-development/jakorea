import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
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
 * TableFilterGroup `rows` — `TableFilterGroup`이 CSS Grid로 처리:
 * 1행 `repeat(4,1fr)`, 2행은 상대 4칸에 맞춰 `1fr 1fr 2fr`(문의일 2칸 분량).
 * 칸 사이·행 사이 gap 12px는 `--table-filter-field-gap`.
 */
export function buildAdminInquiryFilterRows(
  categoryLabels: readonly string[]
): FilterFieldConfig[][] {
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
    [
      {
        key: 'status',
        type: 'select',
        label: '답변 현황',
        placeholder: '전체',
        options: statusOptions,
      },
      {
        key: 'category',
        type: 'select',
        label: '카테고리',
        placeholder: '전체',
        options: categoryOptions,
      },
      {
        key: 'programName',
        type: 'search',
        label: '프로그램명',
        placeholder: '프로그램명을 입력하세요',
      },
      {
        key: 'title',
        type: 'search',
        label: '제목',
        placeholder: '제목을 입력하세요',
      },
    ],
    [
      {
        key: 'memberName',
        type: 'search',
        label: '문의 회원명',
        placeholder: '회원명을 입력하세요',
      },
      {
        key: 'assigneeName',
        type: 'search',
        label: '담당자명',
        placeholder: '담당자명을 입력하세요',
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        label: '문의일',
        defaultValue: null,
      },
    ],
  ]
}
