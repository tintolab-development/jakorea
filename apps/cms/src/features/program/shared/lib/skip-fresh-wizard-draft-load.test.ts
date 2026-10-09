import { describe, expect, it } from 'vitest'
import { shouldSkipFreshWizardDraftLoad } from './skip-fresh-wizard-draft-load'

describe('shouldSkipFreshWizardDraftLoad', () => {
  it('skips leftover restore on fresh wizard first hydrate', () => {
    expect(
      shouldSkipFreshWizardDraftLoad({ skipDraftRestore: true, wizardDraftRevision: 0 })
    ).toBe(true)
  })

  it('loads the persisted template after a wizard template change', () => {
    expect(
      shouldSkipFreshWizardDraftLoad({ skipDraftRestore: true, wizardDraftRevision: 1 })
    ).toBe(false)
  })

  it('loads drafts when skipDraftRestore is off', () => {
    expect(
      shouldSkipFreshWizardDraftLoad({ skipDraftRestore: false, wizardDraftRevision: 0 })
    ).toBe(false)
  })
})
