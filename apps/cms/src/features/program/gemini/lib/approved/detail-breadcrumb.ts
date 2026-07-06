import type { DetailFullpageBreadcrumbItem } from '@/shared/ui/detail-fullpage-breadcrumb'
import { buildSearchParams, makeBreadcrumbItem } from '@/shared/lib/detail-fullpage-query-stack'
import { GEMINI_RECRUITMENT_ADD_PARAM } from '../recruitment/add-url'
import {
  GEMINI_RECRUITMENT_EDIT_PARAM,
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
} from '../recruitment/detail-url'
import {
  GEMINI_APPROVED_TRAINING_ID_PARAM,
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
  type GeminiApprovedTrainingDetailLnbKey,
} from './detail-url'

export const VISITING_TRAINING_TAB_PARAM = 'tab'
export const APPROVED_TAB_VALUE = 'approved'

export const APPROVED_DETAIL_QUERY_SWEEP = [
  GEMINI_APPROVED_TRAINING_ID_PARAM,
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
  GEMINI_RECRUITMENT_ADD_PARAM,
  GEMINI_RECRUITMENT_EDIT_PARAM,
  VISITING_TRAINING_TAB_PARAM,
] as const

const LNB_LABEL: Record<GeminiApprovedTrainingDetailLnbKey, string> = {
  info: '프로그램 정보',
  instructors: '강사 신청 목록',
  managers: '담당자 정보',
}

export function getGeminiApprovedTrainingLnbLabel(lnb: GeminiApprovedTrainingDetailLnbKey): string {
  return LNB_LABEL[lnb]
}

export function buildGeminiApprovedTrainingBreadcrumbItems(options: {
  pathname: string
  searchParams: URLSearchParams
  approvedTrainingId: string
  recruitmentTitle: string
  activeLnb: GeminiApprovedTrainingDetailLnbKey
}): DetailFullpageBreadcrumbItem[] {
  const { pathname, searchParams, approvedTrainingId, recruitmentTitle, activeLnb } = options
  const activeLnbLabel = getGeminiApprovedTrainingLnbLabel(activeLnb)

  const visitingTrainingParams = buildSearchParams(searchParams, {
    delete: [...APPROVED_DETAIL_QUERY_SWEEP],
  })
  const approvedListParams = buildSearchParams(searchParams, {
    delete: [...APPROVED_DETAIL_QUERY_SWEEP],
    set: { [VISITING_TRAINING_TAB_PARAM]: APPROVED_TAB_VALUE },
  })
  const detailParams = buildSearchParams(searchParams, {
    delete: [
      GEMINI_APPROVED_TRAINING_LNB_PARAM,
      GEMINI_RECRUITMENT_ID_PARAM,
      GEMINI_RECRUITMENT_LNB_PARAM,
      GEMINI_RECRUITMENT_ADD_PARAM,
      GEMINI_RECRUITMENT_EDIT_PARAM,
    ],
    set: {
      [VISITING_TRAINING_TAB_PARAM]: APPROVED_TAB_VALUE,
      [GEMINI_APPROVED_TRAINING_ID_PARAM]: approvedTrainingId,
    },
  })
  const items: DetailFullpageBreadcrumbItem[] = [
    makeBreadcrumbItem('찾아가는 연수', pathname, visitingTrainingParams),
    makeBreadcrumbItem('승인 연수', pathname, approvedListParams),
    activeLnb === 'info'
      ? { label: recruitmentTitle }
      : makeBreadcrumbItem(recruitmentTitle, pathname, detailParams),
    { label: activeLnbLabel },
  ]

  return items
}
