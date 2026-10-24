import { expect, test } from '@playwright/test'
import { assertIsolatedNetwork, installTtIsolatedNetwork } from './install-tt-isolated-network'
import {
  assertCreatePayloadParity,
  assertFormVersionSplit,
  assertPutBeforePublish,
  clickDevAutofill,
  fillUniqueTitles,
  selectAutofillCase,
  setEducationJournalOff,
  setTeacherTraining,
  TT_P4B_VARIANTS,
  uncheckAllSurveys,
  uniqueVariantTitles,
  waitWizard,
  walkToComplete,
} from './tt-isolated-helpers'

test.describe('TT P4-B 8조합 브라우저 등록', () => {
  for (const variant of TT_P4B_VARIANTS) {
    test(`${variant.id} ${variant.educationStructure}/${variant.sessionRound}/연수${variant.teacherTrainingEnabled ? 'ON' : 'OFF'}`, async ({
      page,
    }) => {
      const log = await installTtIsolatedNetwork(page)
      await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
      await waitWizard(page)
      await selectAutofillCase(page, variant.autofillCase)
      await clickDevAutofill(page)
      await setTeacherTraining(page, variant.teacherTrainingEnabled)
      await setEducationJournalOff(page)
      await fillUniqueTitles(page, variant.id)
      if (variant.emptySurvey) {
        await uncheckAllSurveys(page)
      }
      await walkToComplete(page)
      const applicationNote = page.getByPlaceholder(/신청|설명|소개/).first()
      if (await applicationNote.isVisible().catch(() => false)) {
        await applicationNote.fill(uniqueVariantTitles(variant.id).applicationNote)
      }
      await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
      await expect
        .poll(() => log.createProgram, { timeout: 60_000 })
        .not.toBeNull()
      assertIsolatedNetwork(log)
      assertCreatePayloadParity(log.createProgram?.body, variant)
      assertFormVersionSplit(log)
      assertPutBeforePublish(log)
    })
  }
})
