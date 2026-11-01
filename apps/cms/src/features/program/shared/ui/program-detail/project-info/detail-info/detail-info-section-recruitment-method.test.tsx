/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { DetailInfoSection } from './project-info-detail-info-section'

vi.mock('@/features/program/shared/api/program-media-target', () => ({
  fetchProgramMediaAttachments: async () => [],
  fetchProgramMediaThumbnail: async () => ({ fileObjectId: null, originalFileName: '' }),
  hasProgramMediaTarget: () => false,
  isUjatTypedRecruitmentDraftProgram: () => false,
  putProgramMediaAttachments: async () => undefined,
  putProgramMediaThumbnail: async () => undefined,
  resolveProgramMediaAttachmentUploadOwner: () => undefined,
  resolveProgramMediaThumbnailUploadOwner: () => undefined,
  usesRecruitmentRowMedia: () => false,
}))

vi.mock('@/shared/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()
  return {
    ...actual,
    useCmsAlert: () => ({ showAlert: vi.fn() }),
  }
})

const program = {
  id: '186531',
  title: '일반',
  type: 'offline',
  format: 'workshop',
  category: 'individual',
  status: 'pending',
  applicationMethod: '홈페이지에서 신청',
} as Program

describe('DetailInfoSection 지원 방법', () => {
  afterEach(() => {
    cleanup()
  })

  it('showRecruitmentMethod true이면 지원 방법 필드가 렌더된다', () => {
    render(
      <DetailInfoSection
        program={program}
        showRecruitmentMethod
        recruitmentMethodLabel="지원 방법"
        emptyReadDisplay="dash"
      />
    )
    expect(screen.getByText('지원 방법')).toBeTruthy()
    expect(screen.getByText('홈페이지에서 신청')).toBeTruthy()
  })

  it('기본값이면 지원 방법 필드가 없다', () => {
    render(<DetailInfoSection program={program} emptyReadDisplay="dash" />)
    expect(screen.queryByText('지원 방법')).toBeNull()
  })
})
