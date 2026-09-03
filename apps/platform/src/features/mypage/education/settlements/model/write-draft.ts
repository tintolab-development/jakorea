export type SettlementTripType = 'one_way' | 'round_trip'

export type SettlementTripLegDraft = {
  transit: string
  amount: string
  fileNames: string[]
}

export type SettlementWriteDraft = {
  meta: {
    applicationId: string
    sessionId: string
    isInstructor: boolean
    programTitle?: string
  }
  basic: {
    name: string
    residentFront: string
    residentBack: string
    homeAddress: string
    homeAddressDetail: string
    bank: string
    accountNumber: string
    accountHolder: string
  }
  transport: {
    tripType: SettlementTripType
    depart: SettlementTripLegDraft
    return: SettlementTripLegDraft
  }
  meal: {
    amount: string
    fileNames: string[]
  }
  activity: {
    amount: string
    fileNames: string[]
  }
}

export type SettlementWriteDraftLocationState = {
  draft?: SettlementWriteDraft
}
