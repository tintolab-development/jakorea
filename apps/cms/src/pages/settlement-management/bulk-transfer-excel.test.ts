import dayjs from 'dayjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  downloadExcel: vi.fn(),
}))

vi.mock('@/shared/utils/file-download', () => ({
  downloadExcel: mocks.downloadExcel,
}))

import { buildBulkTransferExcelFilename, exportBulkTransferExcel } from './bulk-transfer-excel'

/** 암호화된 xlsx는 OLE(CFB) 컨테이너, 일반 xlsx는 zip(PK) */
const OLE_SIGNATURE = 'd0cf11e0a1b11ae1'

function savedBufferHead(): string {
  const buffer = mocks.downloadExcel.mock.calls[0]?.[0]
  return Buffer.from(buffer).subarray(0, 8).toString('hex')
}

describe('buildBulkTransferExcelFilename', () => {
  it('uses CMS admin bulk transfer prefix and YYMMDD', () => {
    expect(buildBulkTransferExcelFilename(dayjs('2026-10-10'))).toBe(
      '[JA Korea] CMS 어드민_대량이체 양식_261010.xlsx'
    )
  })
})

describe('exportBulkTransferExcel', () => {
  beforeEach(() => {
    mocks.downloadExcel.mockReset()
  })

  it('입력한 암호로 암호화해 저장한다', async () => {
    await exportBulkTransferExcel([], { password: 'Jafile1!' })
    expect(savedBufferHead()).toBe(OLE_SIGNATURE)
  })

  it('client 이력에 정산 양식·이름·계좌번호를 남긴다', async () => {
    await exportBulkTransferExcel([])
    expect(mocks.downloadExcel.mock.calls[0]?.[2]).toEqual({
      accessLog: { downloadKind: 'SETTLEMENT_EXPORT', containedPiiTypes: ['NAME', 'ACCOUNT_NUMBER'] },
    })
  })

  it('암호가 없으면 일반 xlsx로 저장한다', async () => {
    await exportBulkTransferExcel([])
    expect(savedBufferHead()).not.toBe(OLE_SIGNATURE)
  })
})
