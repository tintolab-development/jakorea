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
 * TableFilterGroup `rows` — 문의내역 2행(고정 5열 그리드, `admin-inquiry-page__filter-layout` CSS):
 * 1행: 답변 현황·카테고리·프로그램명·제목·문의 회원명
 * 2행: 담당자명·문의일시 + 조회
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
      {
        key: 'memberName',
        type: 'search',
        label: '문의 회원명',
        placeholder: '문의 회원명을 입력하세요',
      },
    ],
    [
      {
        key: 'assigneeName',
        type: 'search',
        label: '담당자명',
        placeholder: '담당자명을 입력하세요',
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        label: '문의일시',
        defaultValue: null,
      },
    ],
  ]
}
