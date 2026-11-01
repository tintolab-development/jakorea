import type { EducationApplicationListItem } from '../model/types'

type ProgramImageFields = {
  thumbnailUrl?: string
  detailImageUrl?: string
}

/**
 * 내 신청 상세의 프로그램 이미지는 신청 응답 `thumbnailFileObjectId`만 쓴다.
 * 신청에 이미지가 없으면 공개 프로그램 상세 이미지로 채우지 않고 비운다.
 */
export function withApplicationThumbnail<T extends ProgramImageFields>(
  program: T,
  application: Pick<EducationApplicationListItem, 'thumbnailUrl'> | undefined,
): T {
  if (!application) return program
  return {
    ...program,
    thumbnailUrl: application.thumbnailUrl,
    detailImageUrl: application.thumbnailUrl,
  }
}
