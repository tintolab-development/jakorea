import { describe, expect, it } from 'vitest'
import {
  buildLogoFileIdsForPatch,
  mapDtoLogoFiles,
  sponsorLogosChanged,
} from '@/features/sponsor/lib/sponsor-logo-patch'

describe('mapDtoLogoFiles', () => {
  it('prefers logoFiles over legacy logoFileId', () => {
    expect(
      mapDtoLogoFiles({
        logoFileId: '1',
        logoFiles: [{ fileObjectId: 2, originalFileName: 'b.png', sortOrder: 0 }],
      })
    ).toEqual([{ id: '2', fileName: 'b.png' }])
  })

  it('returns empty array when logoFiles is empty', () => {
    expect(mapDtoLogoFiles({ logoFileId: '1', logoFiles: [] })).toEqual([])
  })
})

describe('sponsorLogosChanged', () => {
  it('detects pending uploads', () => {
    expect(
      sponsorLogosChanged([{ id: '1', fileName: 'a.png' }], {
        logos: [{ id: '1', fileName: 'a.png' }],
        pendingLogoFiles: [new File(['x'], 'b.png')],
      })
    ).toBe(true)
  })

  it('detects retained logo removal', () => {
    expect(
      sponsorLogosChanged(
        [{ id: '1', fileName: 'a.png' }, { id: '2', fileName: 'b.png' }],
        { logos: [{ id: '1', fileName: 'a.png' }], pendingLogoFiles: [] }
      )
    ).toBe(true)
  })
})

describe('buildLogoFileIdsForPatch', () => {
  it('concatenates kept and uploaded ids', () => {
    expect(
      buildLogoFileIdsForPatch([{ id: '10', fileName: 'a.png' }], [11, 12])
    ).toEqual([10, 11, 12])
  })
})
