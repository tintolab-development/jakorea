import type { SettlementWriteDraft } from '../model/write-draft'

const MOCK_RESIDENT_FRONT = '000915'
const MOCK_RESIDENT_BACK = '1234567'

type BuildSettlementWriteDraftInput = {
  applicationId: string
  sessionId: string
  isInstructor: boolean
  programTitle?: string
  name: string
  homeAddress: string
  homeAddressDetail: string
  bank: string
  accountNumber: string
  accountHolder: string
  tripType: SettlementWriteDraft['transport']['tripType']
  departTransit: string
  departAmount: string
  departFiles: string[]
  returnTransit: string
  returnAmount: string
  returnFiles: string[]
  mealAmount: string
  mealFiles: string[]
  activityAmount: string
  activityFiles: string[]
}

export function buildSettlementWriteDraft(
  input: BuildSettlementWriteDraftInput
): SettlementWriteDraft {
  return {
    meta: {
      applicationId: input.applicationId,
      sessionId: input.sessionId,
      isInstructor: input.isInstructor,
      programTitle: input.programTitle,
    },
    basic: {
      name: input.name,
      residentFront: MOCK_RESIDENT_FRONT,
      residentBack: MOCK_RESIDENT_BACK,
      homeAddress: input.homeAddress,
      homeAddressDetail: input.homeAddressDetail,
      bank: input.bank,
      accountNumber: input.accountNumber,
      accountHolder: input.accountHolder,
    },
    transport: {
      tripType: input.tripType,
      depart: {
        transit: input.departTransit,
        amount: input.departAmount,
        fileNames: input.departFiles,
      },
      return: {
        transit: input.returnTransit,
        amount: input.returnAmount,
        fileNames: input.returnFiles,
      },
    },
    meal: {
      amount: input.mealAmount,
      fileNames: input.mealFiles,
    },
    activity: {
      amount: input.activityAmount,
      fileNames: input.activityFiles,
    },
  }
}

export function hydrateSettlementWriteFormState(draft: SettlementWriteDraft) {
  return {
    bank: draft.basic.bank,
    accountNumber: draft.basic.accountNumber,
    accountHolder: draft.basic.accountHolder,
    tripType: draft.transport.tripType,
    departTransit: draft.transport.depart.transit,
    departAmount: draft.transport.depart.amount,
    departFiles: draft.transport.depart.fileNames,
    returnTransit: draft.transport.return.transit,
    returnAmount: draft.transport.return.amount,
    returnFiles: draft.transport.return.fileNames,
    mealAmount: draft.meal.amount,
    mealFiles: draft.meal.fileNames,
    activityAmount: draft.activity.amount,
    activityFiles: draft.activity.fileNames,
  }
}
