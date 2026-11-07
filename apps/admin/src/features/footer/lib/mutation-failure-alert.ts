/**
 * 푸터 기관정보·유관기관 저장 실패 — VALIDATION_ERROR field 매핑
 */

import { HTTP_LINK_URL_FORMAT_ALERT } from '@/shared/lib/http-link-url'
import {
  type AdminMutationAlert,
  isOptimisticLockConflictError,
  readApiErrorCode,
  readApiErrorField,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'
import { mapAdminMutationAlert, REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'

const ORG_FIELD_LABEL: Record<string, string> = {
  organizationName: '기관명',
  address: '기관 소재지',
  postalCode: '우편번호',
  representativeName: '대표',
  businessRegistrationNumber: '사업자번호',
  phone: '대표전화',
  fax: '팩스',
  email: '이메일',
  logoAssetId: '로고 이미지',
}

const VERSION_CONFLICT_ALERT: AdminMutationAlert = {
  title: '저장 실패',
  content: '다른 관리자가 내용을 수정했습니다.\n새로고침 후 다시 시도해 주세요.',
}

export function footerOrgSaveFailureAlert(error: unknown): AdminMutationAlert {
  const mapped = mapAdminMutationAlert(error)
  if (mapped) return mapped
  if (isOptimisticLockConflictError(error)) return VERSION_CONFLICT_ALERT
  const code = readApiErrorCode(error) ?? (error instanceof Error ? error.message : '')
  const field = readApiErrorField(error)
  if (code === 'VERSION_CONFLICT') return VERSION_CONFLICT_ALERT
  if (code === 'LOGO_REQUIRED' || field === 'logoAssetId') {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }
  if (code === 'VALIDATION_ERROR' && field === 'email') {
    return {
      title: '입력 확인',
      content: '올바른 이메일 주소 형식으로 입력해 주세요.',
    }
  }
  if (code === 'VALIDATION_ERROR' && field && ORG_FIELD_LABEL[field]) {
    return {
      title: '입력 확인',
      content: `${ORG_FIELD_LABEL[field]} 입력을 확인해 주세요.`,
    }
  }
  const message = readApiErrorMessage(error)
  return {
    title: '저장 실패',
    content: message || '기관 정보 저장에 실패했습니다. 다시 시도해 주세요.',
  }
}

export function footerRelatedLogoSaveFailureAlert(error: unknown): AdminMutationAlert {
  if (isOptimisticLockConflictError(error)) return VERSION_CONFLICT_ALERT
  const code = readApiErrorCode(error) ?? (error instanceof Error ? error.message : '')
  const field = readApiErrorField(error)
  if (code === 'VERSION_CONFLICT') return VERSION_CONFLICT_ALERT
  if (field === 'externalUrl' || /externalUrl/i.test(code)) {
    return HTTP_LINK_URL_FORMAT_ALERT
  }
  const message = readApiErrorMessage(error)
  return {
    title: '저장 실패',
    content: message || '유관기관 로고 저장에 실패했습니다. 다시 시도해 주세요.',
  }
}
