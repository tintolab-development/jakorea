import assert from 'node:assert/strict'
import { createUjatProgramApplicationFormInstitutionDraft } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import {
  createUjatProgramApplicationFormVolunteerDraft,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
} from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import { preparePortalUjatApplicationDraft } from './ujat-application-fill-placeholders.ts'

const now = new Date('2026-04-03T00:00:00+09:00')

const institution = preparePortalUjatApplicationDraft(
  createUjatProgramApplicationFormInstitutionDraft(),
  now,
)
const institutionConfirm = institution.paragraphs.find(
  paragraph => paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation,
)
assert.equal(institutionConfirm?.kind, 'single_item')
if (institutionConfirm?.kind === 'single_item' && institutionConfirm.variant === 'multiple_choice') {
  assert.match(institutionConfirm.items[0]?.label ?? '', /2026년/)
  assert.equal(institutionConfirm.items[0]?.label.includes('2NNN'), false)
}

const volunteer = preparePortalUjatApplicationDraft(
  createUjatProgramApplicationFormVolunteerDraft(),
  now,
  { activityTerm: '8' },
)
const volunteerConfirm = volunteer.paragraphs.find(
  paragraph => paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation,
)
assert.equal(volunteerConfirm?.kind, 'single_item')
if (volunteerConfirm?.kind === 'single_item' && volunteerConfirm.variant === 'multiple_choice') {
  assert.match(volunteerConfirm.items[0]?.label ?? '', /UJAT 8기/)
}
const volunteerBasic = volunteer.paragraphs.find(
  paragraph => paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo,
)
assert.equal((volunteerBasic?.paragraphDescription ?? '').includes('202N'), false)

console.log('ujat-application-fill-placeholders: ok')
