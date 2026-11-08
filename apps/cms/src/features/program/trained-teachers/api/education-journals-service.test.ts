import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TrainedTeachersEducationJournalEntry } from '@/features/program/trained-teachers/model/institution-detail'
import { downloadFile } from '@/shared/lib/file-download'
import { downloadBlob } from '@/shared/utils/file-download'
import {
  fetchTrainedTeacherEducationJournalDownloadRemote,
  fetchTrainedTeacherEducationJournalFileBlob,
} from './education-journals-client'
import { downloadTrainedTeacherEducationJournal } from './education-journals-service'

vi.mock('./capabilities', () => ({
  shouldUseTrainedTeacherProgramsRemoteApi: () => true,
}))
vi.mock('./education-journals-client', () => ({
  fetchTrainedTeacherEducationJournalDownloadRemote: vi.fn(),
  fetchTrainedTeacherEducationJournalFileBlob: vi.fn(),
}))
vi.mock('@/shared/utils/file-download', () => ({ downloadBlob: vi.fn() }))
vi.mock('@/shared/lib/file-download', () => ({ downloadFile: vi.fn() }))

const entry = { id: '7', fileName: '교육일지.pdf' } as TrainedTeachersEducationJournalEntry

describe('downloadTrainedTeacherEducationJournal (downloadEndpoint)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchTrainedTeacherEducationJournalDownloadRemote).mockResolvedValue({
      downloadEndpoint: '/api/admin/files/7/content',
    } as never)
    vi.mocked(fetchTrainedTeacherEducationJournalFileBlob).mockResolvedValue(new Blob(['x']))
  })

  it('다운로드 이력 기록이 끝날 때까지 기다린다', async () => {
    await downloadTrainedTeacherEducationJournal('1', entry)
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), '교육일지.pdf')
  })

  it('이력 기록 실패를 호출부로 던지고 다른 경로로 재시도하지 않는다', async () => {
    vi.mocked(downloadBlob).mockRejectedValue(new Error('AUDIT_LOG_UNAVAILABLE'))
    await expect(downloadTrainedTeacherEducationJournal('1', entry)).rejects.toThrow(
      'AUDIT_LOG_UNAVAILABLE'
    )
    expect(downloadFile).not.toHaveBeenCalled()
  })

  it('파일 수신 실패 시에만 downloadFile로 넘어간다', async () => {
    vi.mocked(fetchTrainedTeacherEducationJournalFileBlob).mockRejectedValue(new Error('net'))
    await downloadTrainedTeacherEducationJournal('1', entry)
    expect(downloadFile).toHaveBeenCalledWith('교육일지.pdf', '/api/admin/files/7/content')
    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
