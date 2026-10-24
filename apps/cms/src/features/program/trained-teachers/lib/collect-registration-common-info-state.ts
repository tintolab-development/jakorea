/**
 * TT 등록 공통정보 RHF → canonical common.
 * Overlay store를 읽지 않는다. sidecar 맵은 인메모리 projection으로만 nested 배열을 만든다.
 */
import { educationScheduleRangeFromPeriodLines } from '@/features/template/lib/format-education-schedule-line'
import { importLegacyOverlayToTrainedTeachersCanonical } from './import-legacy-registration-overlay'
import type { TrainedTeachersRegistrationCommonCanonical } from './registration-canonical-types'
import {
  projectTrainedTeachersRhfToOverlayRecord,
  trainedTeachersRhfToEditorMeta,
  type TrainedTeachersRegistrationRhfValues,
} from './registration-rhf-values'

export function collectTrainedTeachersCommonInfoState(
  values: TrainedTeachersRegistrationRhfValues
): TrainedTeachersRegistrationCommonCanonical {
  const editor = trainedTeachersRhfToEditorMeta(values)
  const projected = projectTrainedTeachersRhfToOverlayRecord(values)
  const imported = importLegacyOverlayToTrainedTeachersCanonical({
    id: 'trained-teachers-rhf-collect',
    editor,
    overlay: projected,
  })
  const isSchedule = values.educationStructure === 'schedule'
  return {
    ...imported.common,
    title: values.announcementTitle,
    mainTitle: values.mainTitle,
    titleEn: values.titleEn,
    announcementTitle: values.announcementTitle,
    detailedProgramId: values.detailedProgramId,
    detailedProgramName: values.detailedProgramName,
    textbookName: values.textbookName,
    businessArea: values.businessArea,
    educationProcess: values.educationProcess,
    ipOwned: values.ipOwned,
    courseDeliveredBy: values.courseDeliveredBy,
    partnerInvolvement: values.partnerInvolvement,
    sponsorManagementIds: [...values.sponsorManagementIds],
    sponsorManagerContactIds: [...values.sponsorManagerContactIds],
    venueKind: values.venueKind,
    venueDetail: values.venueDetail,
    startDate: values.startDate,
    endDate: values.endDate,
    educationStructure: values.educationStructure,
    sessionRound: values.sessionRound,
    teacherTrainingEnabled: values.teacherTrainingEnabled,
    educationJournalEnabled: values.educationJournalEnabled,
    curriculumSessions: isSchedule
      ? []
      : imported.common.curriculumSessions.length > 0
        ? imported.common.curriculumSessions
        : [...values.curriculumSessions],
    scheduleDetails: isSchedule
      ? imported.common.scheduleDetails.length > 0
        ? imported.common.scheduleDetails
        : [...values.scheduleDetails]
      : [],
    educationScheduleMode: values.educationScheduleMode,
    educationScheduleLines: [...values.educationScheduleLines],
    educationScheduleRange: educationScheduleRangeFromPeriodLines({
      mode: values.educationScheduleMode,
      lines: values.educationScheduleLines,
    }),
    generalSurveyMenuKeys: [...values.generalSurveyMenuKeys],
    ips: values.ips ?? imported.common.ips,
    programCategory: values.programCategory ?? imported.common.programCategory,
    programChannel: values.programChannel ?? imported.common.programChannel,
    educationForm: values.educationForm ?? imported.common.educationForm,
  }
}
