import { describe, expect, it } from 'vitest'
import { mapEducationJournalResponseToEntry } from './education-journals-adapters'

describe('mapEducationJournalResponseToEntry', () => {
  it('maps journal list fields', () => {
    const entry = mapEducationJournalResponseToEntry(
      {
        journalId: 9,
        journalTitle: '1회차',
        originalFilename: 'journal.pdf',
        submittedAt: '2026-01-05T11:32:15Z',
      },
      0
    )
    expect(entry.id).toBe('9')
    expect(entry.fileName).toBe('journal.pdf')
    expect(entry.roundOrScheduleLabel).toBe('1회차')
    expect(entry.date).toMatch(/2026/)
  })
})
