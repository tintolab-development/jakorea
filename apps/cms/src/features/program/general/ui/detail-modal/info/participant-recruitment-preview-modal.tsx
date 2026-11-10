/**
 * 모집 정보 사용자 미리보기 (참여자 / 강사 / 봉사자) — Platform 실제 상세 화면
 */

import { useMemo } from 'react'
import type { Program } from '@/types/domain'
import { PlatformPreviewModal } from '@/features/program/shared/ui/platform-preview/platform-preview-modal'
import {
  buildPlatformPreviewMessage,
  toPreviewAttachments,
} from '@/features/program/shared/lib/platform-preview/build-message'
import {
  resolveAudiencePreviewAttachmentNames,
  usePreviewPosterUrl,
} from '@/features/program/shared/lib/platform-preview/poster-url'
import {
  buildGeneralProgramPortalPreview,
  type ProgramPreviewAudience,
} from '@/features/program/general/lib/platform-preview-payload'
import { buildUjatProgramPortalPreview } from '@/features/program/ujat/lib/platform-preview-payload'
import { PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX } from '@/features/program/general/lib/general-program-modal-z-index'

export type RecruitmentUserPreviewAudience = ProgramPreviewAudience

export function recruitmentUserPreviewHeaderTitle(audience: RecruitmentUserPreviewAudience): string {
  switch (audience) {
    case 'instructors':
      return '강사 모집 폼 미리보기'
    case 'volunteers':
      return '봉사자 모집 폼 미리보기'
    case 'individuals':
      return '참여자 모집 폼 미리보기'
    default:
      return '참여 기관 모집 폼 미리보기'
  }
}

export function ParticipantRecruitmentPreviewModal({
  open,
  onClose,
  program,
  sponsorName,
  audience = 'institutions',
  programKind = 'general',
  extraOverlay,
  title,
}: {
  open: boolean
  onClose: () => void
  program: Program
  sponsorName?: string
  audience?: RecruitmentUserPreviewAudience
  /** UJAT 등록·상세는 `ujat` — 학교/봉사단 모집 매핑 */
  programKind?: 'general' | 'ujat'
  /** 상세 수정 미리보기 — 폼 overlay. 저장본·peek보다 나중에 덮는다. */
  extraOverlay?: Record<string, unknown>
  /** 상단 제목 — 생략 시 대상별 「… 모집 폼 미리보기」 */
  title?: string
}) {
  const posterUrl = usePreviewPosterUrl(program, open, audience, extraOverlay)

  const message = useMemo(() => {
    if (!open) return null
    const detail =
      programKind === 'ujat'
        ? buildUjatProgramPortalPreview({
            program,
            sponsorName,
            audience: audience === 'volunteers' ? 'volunteers' : 'institutions',
          })
        : buildGeneralProgramPortalPreview({
            program,
            sponsorName,
            audience,
            extraOverlay,
          })
    return buildPlatformPreviewMessage(detail, {
      thumbnailUrl: posterUrl,
      attachments: toPreviewAttachments(
        resolveAudiencePreviewAttachmentNames({ program, audience, overlay: extraOverlay })
      ),
    })
  }, [open, program, sponsorName, audience, programKind, posterUrl, extraOverlay])

  return (
    <PlatformPreviewModal
      open={open}
      onClose={onClose}
      title={title ?? recruitmentUserPreviewHeaderTitle(audience)}
      message={message}
      zIndex={PARTICIPANT_RECRUITMENT_PREVIEW_MODAL_Z_INDEX}
    />
  )
}
