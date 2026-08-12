/** POST /api/portal/me/instructor-role-requests — InstructorRoleRequestCreateRequest */
export type InstructorRoleRequestCreateRequest = {
  requestedActivityType: string
  nameSnapshot: string
  genderSnapshot: string
  /** API `YYYY-MM-DD` */
  birthDateSnapshot: string
  phoneSnapshot: string
  emailSnapshot: string
  homeAddressSnapshot: string
  bankAccountSnapshotJson: string
  educationLevelSnapshot?: string
  careerTextSnapshot?: string
  businessIncomeYn: boolean
  selfIntroductionSnapshot?: string
  youthEconomyEducationOpinionSnapshot?: string
  youthCommunicationOpinionSnapshot?: string
  unexpectedSituationResponseSnapshot?: string
  oneLineIntroSnapshot?: string
  agreementSnapshotJson: string
}

/** POST 응답 — InstructorRoleWorkflowResponse */
export type InstructorRoleWorkflowResponse = {
  requestId?: number
  memberId?: number
  instructorProfileId?: number
  status?: string
  message?: string
}

/** GET /api/portal/me/instructor-role-requests/current */
export type InstructorRoleRequestSummary = {
  status?: string
  requestId?: number
  requestedAt?: string
  decidedAt?: string
  rejectedReason?: string
  canRequest?: boolean
  canReapply?: boolean
}
