/** @vitest-environment node */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isEphemeralThumbPreviewUrl,
  readRecruitDetailMediaFromOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import { buildMediaSidecar } from './build-program-edit-snapshot'
import type { Program } from '@/types/domain'
import { overlayKvToIndependentMediaInput } from './overlay-kv-to-media-form-values'
import { buildIndependentMediaSidecar } from './build-independent-media'

const blobOverlay = {
  'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/preview',
  'recruit.detailInfo.thumbContentUrl': 'blob:http://localhost/preview',
}

const uploadedOverlay = {
  'recruit.detailInfo.thumbFileObjectId': 77,
  'recruit.detailInfo.thumbContentUrl': '/api/admin/files/77/content',
  'recruit.detailInfo.thumbFileName': 'poster.png',
  'recruit.detailInfo.attachmentFileObjectIds': [101],
  'recruit.detailInfo.attachmentFileNames': ['guide.pdf'],
}

const instructorOverlay = {
  'recruitInstructor.detailInfo.thumbFileObjectId': 42,
  'recruitInstructor.detailInfo.attachmentFileObjectIds': [8],
}

function independentFromOverlay(
  overlay: Record<string, unknown>,
  created?: Pick<Program, 'id' | 'programRecruitments'>
) {
  const adapted = overlayKvToIndependentMediaInput(overlay)
  return buildIndependentMediaSidecar({
    formValues: adapted.formValues,
    sidecars: { ...adapted.sidecars, created },
  })
}

describe('0. Independent Builder 금지 의존성', () => {
  it('Builder가 overlay store/PUT/RHF를 호출하지 않는다', () => {
    const dir = path.join(__dirname)
    const files = ['build-independent-media.ts', 'media-domain.ts', 'media-form-values.ts']
    const forbidden = [
      /(?:import|from).*readRecruitDetailMediaFromOverlay/,
      /(?:import|from).*bindRecruitDetailMediaAfterProgramCreate/,
      /(?:import|from).*bindGeneralRecruitDetailMediaToRows/,
      /(?:import|from).*putProgramThumbnail/,
      /(?:import|from).*putProgramAttachments/,
      /(?:import|from).*putProgramRecruitmentThumbnail/,
      /(?:import|from).*putProgramRecruitmentAttachments/,
      /getGeneralRecruitOverlayRecord/,
      /peek[A-Z]/,
      /from ['"]react['"]/,
      /from ['"]react-hook-form['"]/,
    ]
    for (const file of files) {
      const source = readFileSync(path.join(dir, file), 'utf8')
      for (const token of forbidden) {
        expect(token.test(source), `${file} matches ${token}`).toBe(false)
      }
    }
  })

  it('media-canonical-file-object-id known-diff를 유지한다', () => {
    expect(OVERLAY_PHASE0_KNOWN_DIFFS.some(item => item.id === 'media-canonical-file-object-id')).toBe(
      true
    )
  })
})

describe('1. blob / uploaded sidecar', () => {
  it('state가 buildMediaSidecar 및 overlay reader와 같다', () => {
    const blob = independentFromOverlay(blobOverlay)
    const uploaded = independentFromOverlay(uploadedOverlay)
    expect(blob.sidecar).toEqual(buildMediaSidecar({ overlay: blobOverlay }))
    expect(uploaded.sidecar).toEqual(buildMediaSidecar({ overlay: uploadedOverlay }))
    expect(blob.state.thumbObjectUrl).toBe(readRecruitDetailMediaFromOverlay(blobOverlay).thumbObjectUrl)
    expect(isEphemeralThumbPreviewUrl(blob.state.thumbObjectUrl)).toBe(true)
    expect(blob.state.origin).toBe('ephemeral-blob')
    expect(blob.state.keyVisualImage).toBeUndefined()
    expect(uploaded.state.origin).toBe('uploaded-object-id')
    expect(uploaded.state.thumbFileObjectId).toBe(77)
    expect(uploaded.state.keyVisualImage).toBe('/api/admin/files/77/content')
  })
})

describe('2. bind 의도', () => {
  it('행이 있으면 모집 행 PUT 의도가 같다', () => {
    const created = {
      id: '186234',
      programRecruitments: [{ id: 9, recruitmentType: 'PARTICIPANT' as const }],
    }
    const independent = independentFromOverlay(uploadedOverlay, created)
    expect(independent.bindCalls).toEqual(
      buildMediaSidecar({ overlay: uploadedOverlay, created }).bindCalls
    )
    expect(independent.bindCalls).toEqual([
      {
        kind: 'putProgramRecruitmentThumbnail',
        programId: 186234,
        recruitmentId: 9,
        fileObjectId: 77,
      },
      {
        kind: 'putProgramRecruitmentAttachments',
        programId: 186234,
        recruitmentId: 9,
        fileObjectIds: [101],
      },
    ])
  })

  it('행이 없으면 프로그램 단위 PUT 의도가 같다', () => {
    const created = { id: '186234', programRecruitments: [] }
    const independent = independentFromOverlay(uploadedOverlay, created)
    expect(independent.bindCalls).toEqual(
      buildMediaSidecar({ overlay: uploadedOverlay, created }).bindCalls
    )
    expect(independent.bindCalls).toEqual([
      { kind: 'putProgramThumbnail', programId: 186234, fileObjectId: 77 },
      { kind: 'putProgramAttachments', programId: 186234, fileObjectIds: [101] },
    ])
  })

  it('강사 prefix는 PARTICIPANT 행에 연결되지 않는다', () => {
    const created = {
      id: '186234',
      programRecruitments: [{ id: 9, recruitmentType: 'PARTICIPANT' as const }],
    }
    const independent = independentFromOverlay(instructorOverlay, created)
    expect(independent.bindCalls).toEqual(
      buildMediaSidecar({ overlay: instructorOverlay, created }).bindCalls
    )
    expect(independent.bindCalls).toEqual([])
  })

  it('강사 행이면 instructor prefix fileObjectId를 쓴다', () => {
    const created = {
      id: '186234',
      programRecruitments: [{ id: 11, recruitmentType: 'INSTRUCTOR' as const }],
    }
    const independent = independentFromOverlay(instructorOverlay, created)
    expect(independent.bindCalls).toEqual(
      buildMediaSidecar({ overlay: instructorOverlay, created }).bindCalls
    )
    expect(independent.bindCalls[0]).toMatchObject({
      kind: 'putProgramRecruitmentThumbnail',
      recruitmentId: 11,
      fileObjectId: 42,
    })
  })
})

describe('3. persist overlay 통과', () => {
  it('fileObjectId sidecar와 blob 키를 삭제하지 않는다', () => {
    const uploaded = independentFromOverlay(uploadedOverlay)
    const blob = independentFromOverlay(blobOverlay)
    expect(uploaded.persistOverlay).toEqual(uploadedOverlay)
    expect(blob.persistOverlay).toEqual(blobOverlay)
    expect(String(uploaded.state.keyVisualImage ?? '')).not.toMatch(/^blob:/)
    expect(String(blob.state.keyVisualImage ?? '')).not.toMatch(/^blob:/)
  })

  it('빈 overlay는 empty origin이고 bindCalls가 없다', () => {
    const independent = independentFromOverlay({}, { id: '186234', programRecruitments: [] })
    expect(independent.state.origin).toBe('empty')
    expect(independent.bindCalls).toEqual([])
    expect(independent.persistOverlay).toEqual({})
  })
})
