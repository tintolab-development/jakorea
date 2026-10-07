import { describe, expect, it } from 'vitest'
import { readVolunteerApplicationAttachments } from './volunteer-application-evidence'

describe('readVolunteerApplicationAttachments', () => {
  it('reads attachment rows and drops incomplete ones', () => {
    expect(
      readVolunteerApplicationAttachments({
        attachments: [
          {
            submissionFileId: 123,
            questionKey: 'program-volunteer-application-seed-previous-ja-program',
            fileObjectId: 9001,
            originalFileName: 'ja-certificate.pdf',
            contentType: 'application/pdf',
            fileSize: 204800,
            downloadPolicyPath: '/api/admin/form-submission-files/123/download',
          },
          { originalFileName: 'missing-ids.pdf' },
        ],
      }),
    ).toEqual([
      {
        submissionFileId: 123,
        questionKey: 'program-volunteer-application-seed-previous-ja-program',
        fileObjectId: 9001,
        originalFileName: 'ja-certificate.pdf',
        contentType: 'application/pdf',
        fileSize: 204800,
        downloadPolicyPath: '/api/admin/form-submission-files/123/download',
      },
    ])
  })

  it('returns an empty list when attachments are missing', () => {
    expect(readVolunteerApplicationAttachments(null)).toEqual([])
    expect(readVolunteerApplicationAttachments({})).toEqual([])
  })
})
