/**
 * UJAT 편집값 → Portal 상세 응답 형태. 학교 모집 = 기관 참여자, 봉사단(상·하반기) = VOLUNTEER.
 */

import type { PortalProgramDetail } from '@jakorea/domain/portal/program-detail'
import type { Program } from '@/types/domain'
import { buildProgramPortalPreviewDetail } from '@/features/program/general/lib/platform-preview-payload'

export type UjatPreviewAudience = 'institutions' | 'volunteers'

export function buildUjatProgramPortalPreview(input: {
  program: Program
  sponsorName?: string
  audience: UjatPreviewAudience
}): PortalProgramDetail {
  const detail = buildProgramPortalPreviewDetail({
    program: { ...input.program, generalProgramAudience: 'organization' },
    sponsorName: input.sponsorName,
    audience: input.audience,
    programType: 'UJAT',
    portalCategories:
      input.audience === 'institutions' ? ['ORGANIZATION'] : ['YOUTH_YOUNG'],
  })
  return { ...detail, applicationTargetMode: 'ORGANIZATION', participationMethod: undefined }
}
