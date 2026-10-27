import { describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'

vi.mock(
  '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync',
  () => ({
    getApplicantRecruitInstitutionOverlayRecord: () => ({}),
  })
)

vi.mock(
  '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync',
  () => ({
    peekGeneralRecruitOverlayRecord: () => ({}),
  })
)

import {
  fileObjectIdFromAdminFileUrl,
  readablePosterUrl,
  resolveAudiencePreviewAttachmentNames,
  resolveAudiencePreviewPosterSeed,
  resolvePreviewPosterSeed,
} from './poster-url'

describe('resolvePreviewPosterSeed', () => {
  it('prefers overlay thumbFileObjectId over program admin content url', () => {
    const seed = resolvePreviewPosterSeed({
      thumbObjectUrl: 'blob:http://localhost/revoked',
      thumbFileObjectId: 99,
      programKeyVisualImage: '/api/admin/files/12/content',
    })
    expect(seed.fileObjectId).toBe(99)
    expect(seed.displayUrl).toBeUndefined()
  })

  it('rejects admin content paths as direct img src', () => {
    expect(readablePosterUrl('/api/admin/files/55/content')).toBeUndefined()
    expect(fileObjectIdFromAdminFileUrl('/api/admin/files/55/content')).toBe(55)
  })

  it('falls back to the overlay key visual file id', () => {
    const seed = resolvePreviewPosterSeed({
      overlayKeyVisualImage: '/api/admin/files/7/content',
    })
    expect(seed.fileObjectId).toBe(7)
    expect(seed.displayUrl).toBeUndefined()
  })

  it('keeps http(s) display urls when no file object id', () => {
    const seed = resolvePreviewPosterSeed({
      programKeyVisualImage: 'https://cdn.example/poster.png',
    })
    expect(seed.displayUrl).toBe('https://cdn.example/poster.png')
    expect(seed.fileObjectId).toBeUndefined()
  })
})

describe('resolveAudiencePreviewPosterSeed', () => {
  const program = {
    id: '186408',
    keyVisualImage: '/api/admin/files/1/content',
    posterImage: '/api/admin/files/1/content',
    attachmentFileNames: ['program.pdf'],
    programRecruitments: [
      {
        id: 11,
        recruitmentType: 'PARTICIPANT',
        thumbnailFileObjectId: 301,
        attachments: [{ originalFileName: 'participant.pdf' }],
      },
      {
        id: 22,
        recruitmentType: 'INSTRUCTOR',
        thumbnailFileObjectId: 302,
        attachments: [{ originalFileName: 'instructor.pdf' }],
      },
    ],
  } as unknown as Program

  it('uses the instructor row thumbnail, not the participant or program image', () => {
    const seed = resolveAudiencePreviewPosterSeed({
      program,
      audience: 'instructors',
      overlay: {
        'recruit.detailInfo.thumbFileObjectId': 301,
        'recruitInstructor.detailInfo.thumbFileObjectId': 302,
      },
    })
    expect(seed.fileObjectId).toBe(302)
    expect(seed.displayUrl).toBeUndefined()
  })

  it('does not fill an empty instructor tab with the program thumbnail', () => {
    const seed = resolveAudiencePreviewPosterSeed({
      program: {
        ...program,
        programRecruitments: [{ id: 22, recruitmentType: 'INSTRUCTOR' }],
      },
      audience: 'instructors',
      overlay: { 'recruit.detailInfo.thumbFileObjectId': 301 },
    })
    expect(seed.fileObjectId).toBeUndefined()
    expect(seed.displayUrl).toBeUndefined()
  })

  it('uses the instructor recruitment row when overlay has no instructor thumb', () => {
    const seed = resolveAudiencePreviewPosterSeed({
      program,
      audience: 'instructors',
      overlay: {},
    })
    expect(seed.fileObjectId).toBe(302)
  })

  it('uses participant overlay even when instructor overlay also exists', () => {
    const seed = resolveAudiencePreviewPosterSeed({
      program,
      audience: 'institutions',
      overlay: {
        'recruit.detailInfo.thumbFileObjectId': 301,
        'recruitInstructor.detailInfo.thumbFileObjectId': 302,
      },
    })
    expect(seed.fileObjectId).toBe(301)
  })
})

describe('resolveAudiencePreviewAttachmentNames', () => {
  it('lists attachments for the current tab only', () => {
    const program = {
      id: '186408',
      attachmentFileNames: ['program.pdf'],
      programRecruitments: [
        {
          id: 11,
          recruitmentType: 'PARTICIPANT',
          attachments: [{ originalFileName: 'participant.pdf' }],
        },
        {
          id: 22,
          recruitmentType: 'INSTRUCTOR',
          attachments: [{ originalFileName: 'instructor.pdf' }],
        },
      ],
    } as unknown as Program

    expect(
      resolveAudiencePreviewAttachmentNames({ program, audience: 'instructors' })
    ).toEqual(['instructor.pdf'])
    expect(
      resolveAudiencePreviewAttachmentNames({ program, audience: 'institutions' })
    ).toEqual(['participant.pdf'])
  })
})
