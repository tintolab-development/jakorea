import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import {
  resolveInstructorPortalAvailableScheduleEnabledForHidden,
  resolveVolunteerPortalActivityScheduleEnabledForHidden,
  resolveVolunteerPortalInterviewEnabledForHidden,
} from './portal-volunteer-interview-visibility.ts'

const interviewId = PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule
const activityId = PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule

assert.equal(
  resolveVolunteerPortalInterviewEnabledForHidden({
    formBinding: {
      runtimeContext: {
        audienceApplication: {
          hiddenQuestionKeys: [interviewId],
        },
      },
      paragraphs: [{ id: interviewId, items: [{ id: 'interview-option:x', label: 'x' }] }],
    },
  }),
  false,
)

assert.equal(
  resolveVolunteerPortalInterviewEnabledForHidden({
    formBinding: {
      runtimeContext: {
        audienceApplication: {
          dynamicQuestions: {
            [interviewId]: { optionCount: 2 },
          },
        },
      },
      paragraphs: [{ id: interviewId, runtimeInputMode: 'dynamic_interview_slots' }],
    },
  }),
  true,
)

assert.equal(
  resolveVolunteerPortalInterviewEnabledForHidden({
    formBinding: {
      runtimeContext: {
        audienceApplication: {
          dynamicQuestions: {
            [interviewId]: { optionCount: 0 },
          },
        },
      },
      paragraphs: [{ id: interviewId }],
    },
  }),
  false,
)

assert.equal(
  resolveVolunteerPortalInterviewEnabledForHidden({
    formBinding: {
      form: {
        runtimeContext: {
          audienceApplication: {
            dynamicQuestions: {
              [interviewId]: { optionCount: 8, inputMode: 'dynamic_interview_slots' },
              [activityId]: { optionCount: 1, inputMode: 'dynamic_schedule_options' },
            },
            hiddenQuestionKeys: [],
          },
        },
        paragraphs: [
          { id: interviewId, runtimeInputMode: 'dynamic_interview_slots' },
          { id: activityId, runtimeInputMode: 'dynamic_schedule_options' },
        ],
      },
    },
  }),
  true,
)

assert.equal(
  resolveVolunteerPortalActivityScheduleEnabledForHidden({
    formBinding: {
      form: {
        runtimeContext: {
          audienceApplication: {
            dynamicQuestions: {
              [interviewId]: { optionCount: 0 },
              [activityId]: { optionCount: 1 },
            },
          },
        },
        paragraphs: [{ id: activityId }],
      },
    },
  }),
  true,
)

const instructorScheduleId = PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule
assert.equal(
  resolveInstructorPortalAvailableScheduleEnabledForHidden({
    formBinding: {
      runtimeContext: {
        audienceApplication: {
          hiddenQuestionKeys: [instructorScheduleId],
          dynamicQuestions: { [instructorScheduleId]: { optionCount: 0 } },
        },
      },
      paragraphs: [{ id: instructorScheduleId, runtimeHidden: true }],
    },
  }),
  false,
)
assert.equal(
  resolveInstructorPortalAvailableScheduleEnabledForHidden({
    formBinding: {
      runtimeContext: {
        audienceApplication: {
          dynamicQuestions: { [instructorScheduleId]: { optionCount: 2 } },
        },
      },
      paragraphs: [{ id: instructorScheduleId, runtimeResolved: true }],
    },
  }),
  true,
)

console.log('portal-volunteer-interview-visibility.selfcheck: ok')
