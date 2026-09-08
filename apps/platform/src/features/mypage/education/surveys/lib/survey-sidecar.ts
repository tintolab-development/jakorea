export type SurveySidecarState = {
  dateValues: Record<string, string>
  timeValues: Record<string, string>
  fileNames: Record<string, string | null>
  userInfoAnswers: Record<string, Record<string, string>>
}

export const EMPTY_SURVEY_SIDECAR: SurveySidecarState = {
  dateValues: {},
  timeValues: {},
  fileNames: {},
  userInfoAnswers: {},
}
