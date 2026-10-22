/**
 * 채용 안내 저장 실패 알림 매핑
 */

import {
  isOptimisticLockConflictError,
  readApiErrorCode,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'

const VERSION_CONFLICT_ALERT = {
  title: '저장 실패',
  content: '다른 사용자가 먼저 수정했습니다. 최신 정보를 다시 불러와 주세요.',
} as const

function recruitGuideErrorCode(error: unknown): string {
  return readApiErrorCode(error) ?? (error instanceof Error ? error.message : '')
}

function readErrorMeta(error: unknown): { field?: string; traceId?: string } {
  if (!error || typeof error !== 'object') return {}
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return {}
  const record = data as { field?: unknown; traceId?: unknown }
  return {
    field:
      typeof record.field === 'string' && record.field.trim() ? record.field.trim() : undefined,
    traceId:
      typeof record.traceId === 'string' && record.traceId.trim()
        ? record.traceId.trim()
        : undefined,
  }
}

export function isRecruitGuideVersionConflict(error: unknown): boolean {
  const code = recruitGuideErrorCode(error)
  return (
    code === 'VERSION_CONFLICT' ||
    code === 'CAREER_GUIDE_INTERVIEW_VERSION_CONFLICT' ||
    isOptimisticLockConflictError(error) ||
    /VERSION_CONFLICT|CAREER_GUIDE_.*CONFLICT/i.test(code)
  )
}

function mapRecruitGuideSaveFailureAlert(
  error: unknown,
  fallbackContent: string
): { title: string; content: string } {
  const code = recruitGuideErrorCode(error)
  const { field } = readErrorMeta(error)

  if (code === 'BANNER_IMAGE_REQUIRED') {
    return { title: '입력 확인', content: '배너 이미지를 등록해 주세요.' }
  }
  if (code === 'BANNER_MAIN_TEXT_REQUIRED') {
    return { title: '입력 확인', content: '메인 텍스트를 입력해 주세요.' }
  }
  if (code === 'BANNER_SUB_TEXT_01_REQUIRED') {
    return { title: '입력 확인', content: '서브 텍스트 01을 입력해 주세요.' }
  }
  if (code === 'BANNER_SUB_TEXT_02_REQUIRED') {
    return { title: '입력 확인', content: '서브 텍스트 02를 입력해 주세요.' }
  }
  if (code === 'BANNER_MAIN_TEXT_TOO_LONG') {
    return { title: '입력 확인', content: '메인 텍스트는 1,000자 이내로 입력해 주세요.' }
  }
  if (code === 'BANNER_SUB_TEXT_01_TOO_LONG') {
    return { title: '입력 확인', content: '서브 텍스트 01은 2,000자 이내로 입력해 주세요.' }
  }
  if (code === 'BANNER_SUB_TEXT_02_TOO_LONG') {
    return { title: '입력 확인', content: '서브 텍스트 02는 2,000자 이내로 입력해 주세요.' }
  }
  if (code === 'CULTURE_TITLE_REQUIRED') {
    return { title: '입력 확인', content: '타이틀을 입력해 주세요.' }
  }
  if (code === 'CULTURE_DESCRIPTION_REQUIRED') {
    return { title: '입력 확인', content: '설명 텍스트를 입력해 주세요.' }
  }
  if (code === 'CULTURE_TITLE_TOO_LONG') {
    return { title: '입력 확인', content: '조직문화 타이틀은 500자 이내로 입력해 주세요.' }
  }
  if (code === 'CULTURE_DESCRIPTION_TOO_LONG') {
    return { title: '입력 확인', content: '조직문화 설명은 2,000자 이내로 입력해 주세요.' }
  }
  if (
    code === 'CULTURE_ITEMS_INVALID' ||
    code === 'CAREER_GUIDE_CULTURE_RESPONSE_INVALID' ||
    code === 'INVALID_CAREER_GUIDE_CULTURE_ITEMS'
  ) {
    return {
      title: '저장 실패',
      content: '조직문화 4개 항목 정보를 확인한 후 다시 시도해 주세요.',
    }
  }
  if (
    code === 'INTERVIEW_SLOT_INVALID' ||
    code === 'INTERVIEW_ID_INVALID' ||
    code === 'CAREER_GUIDE_INTERVIEW_RESPONSE_INVALID' ||
    code === 'INVALID_CAREER_GUIDE_INTERVIEW_SLOT'
  ) {
    return {
      title: '저장 실패',
      content: '직무 인터뷰 정보를 확인한 후 다시 시도해 주세요.',
    }
  }
  if (code === 'INTERVIEW_DUPLICATE' || code === 'CAREER_GUIDE_INTERVIEW_DUPLICATE') {
    return {
      title: '중복 게시글',
      content: '이미 등록된 임팩트 스토리입니다. 다른 임팩트 스토리를 선택해주세요.',
    }
  }
  if (code === 'INTERVIEW_LIMIT_EXCEEDED' || code === 'CAREER_GUIDE_INTERVIEW_LIMIT_EXCEEDED') {
    return { title: '등록 한도 초과', content: '직무 인터뷰는 최대 9개까지 등록할 수 있습니다.' }
  }
  if (code === 'CAREER_GUIDE_INTERVIEW_IMPACT_STORY_NOT_FOUND') {
    return { title: '등록 실패', content: '선택한 임팩트 스토리를 찾을 수 없습니다.' }
  }
  if (code === 'CAREER_GUIDE_INTERVIEW_IMPACT_STORY_NOT_PUBLIC') {
    return { title: '등록 실패', content: '공개된 임팩트 스토리만 등록할 수 있습니다.' }
  }
  if (code === 'INTERVIEW_NOT_FOUND' || code === 'CAREER_GUIDE_INTERVIEW_NOT_FOUND') {
    return { title: '수정 실패', content: '직무 인터뷰를 찾을 수 없습니다.' }
  }
  if (code === 'INTERVIEW_NONE_SELECTED') {
    return { title: '항목 선택', content: '선택된 항목이 없습니다.' }
  }
  if (code === 'INTERVIEW_TITLE_REQUIRED') {
    return { title: '입력 확인', content: '게시글 제목을 입력해 주세요.' }
  }
  if (code === 'INTERVIEW_TITLE_TOO_LONG') {
    return { title: '입력 확인', content: '게시글 제목은 300자 이내로 입력해 주세요.' }
  }
  if (code === 'INTERVIEW_YEAR_INVALID' || code === 'INVALID_CAREER_GUIDE_INTERVIEW_YEAR') {
    return { title: '입력 확인', content: '게시 연도를 확인해 주세요.' }
  }
  if (code === 'INVALID_CAREER_GUIDE_INTERVIEW_TITLE') {
    return { title: '입력 확인', content: '인터뷰 제목을 확인해 주세요.' }
  }
  if (code === 'INTERVIEW_IMPACT_STORY_ID_INVALID') {
    return { title: '입력 확인', content: '선택한 임팩트 스토리를 확인해 주세요.' }
  }

  if (isRecruitGuideVersionConflict(error)) {
    return { ...VERSION_CONFLICT_ALERT }
  }

  if (/CAREER_GUIDE_NOT_FOUND/i.test(code)) {
    return {
      title: '조회 실패',
      content: '채용 안내 정보를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.',
    }
  }
  if (/FILE_VALIDATION_ERROR/i.test(code)) {
    return { title: '파일 확인', content: '배너 이미지 파일을 확인한 후 다시 시도해 주세요.' }
  }
  if (/VALIDATION_ERROR/i.test(code)) {
    if (field === 'title') {
      return { title: '입력 확인', content: '인터뷰 제목을 확인해 주세요.' }
    }
    if (field === 'year') {
      return { title: '입력 확인', content: '게시 연도를 확인해 주세요.' }
    }
    if (field === 'impactStoryId') {
      return { title: '입력 확인', content: '선택한 임팩트 스토리를 확인해 주세요.' }
    }
    if (field === 'version') {
      return { ...VERSION_CONFLICT_ALERT }
    }
    return { title: '입력 확인', content: '입력값을 확인해주세요.' }
  }

  const message = readApiErrorMessage(error) ?? ''
  if (code === 'FORBIDDEN' || /FORBIDDEN/i.test(code) || /Permission is denied|FORBIDDEN/i.test(message)) {
    return {
      title: '저장 실패',
      content: '저장 권한이 없습니다.',
    }
  }

  return { title: '저장 실패', content: message || fallbackContent }
}

export function recruitGuideSaveFailureAlert(
  error: unknown,
  fallbackContent: string
): { title: string; content: string } {
  const alert = mapRecruitGuideSaveFailureAlert(error, fallbackContent)
  const { traceId } = readErrorMeta(error)
  if (!traceId) return alert
  return { ...alert, content: `${alert.content}\n추적번호: ${traceId}` }
}
