import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildSponsorManagementDetailView } from '@/data/mock/sponsor-management-detail'
import type {
  SponsorContactRow,
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorProgramHistoryRow,
} from '@/features/sponsor/model/sponsor-management.types'
import type { BasicInfoEditState } from '@/features/sponsor/ui/sponsor-detail-basic-info'
import { splitAddress } from '@/features/sponsor/utils/split-address'

export interface UseSponsorDetailReturn {
  detail: SponsorManagementDetailView
  basicInfo: BasicInfoEditState | null
  setBasicInfo: React.Dispatch<React.SetStateAction<BasicInfoEditState | null>>
  contacts: SponsorContactRow[]
  setContacts: React.Dispatch<React.SetStateAction<SponsorContactRow[]>>
  /** 상세 내 편집 가능한 프로그램 진행 이력(목 데이터 로컬 복사본) */
  programHistories: SponsorProgramHistoryRow[]
  removeProgramHistoryRows: (ids: string[]) => void
  isEditingBasicInfo: boolean
  handleBasicInfoChange: (updater: (prev: BasicInfoEditState) => BasicInfoEditState) => void
  handleToggleBasicInfoEdit: (canWrite: boolean) => void
}

/**
 * Builds editable basic-info state from a sponsor detail view (uses {@link splitAddress}).
 */
export function buildBasicInfoEditStateFromDetail(
  detail: SponsorManagementDetailView
): BasicInfoEditState {
  const parsedAddress = splitAddress(detail.address)
  return {
    nameDisplayKo: detail.nameDisplayKo,
    nameDisplayEn: detail.nameDisplayEn,
    organizationKind: detail.organizationKind ?? 'corporate',
    businessNumber: detail.businessNumber,
    executives: detail.executives,
    district: parsedAddress.district,
    detailAddress: parsedAddress.detailAddress,
    sponsorshipStartDate: detail.sponsorshipStartDate,
    sponsorshipStatus: detail.sponsorshipStatus ?? 'active',
  }
}

/**
 * Derives mock detail from `sponsor` and keeps `basicInfo` / `contacts` in sync with that snapshot.
 */
export function useSponsorDetail(sponsor: SponsorManagementRow): UseSponsorDetailReturn {
  const detail = useMemo(() => buildSponsorManagementDetailView(sponsor), [sponsor])

  const [contacts, setContacts] = useState<SponsorContactRow[]>([])
  const [programHistories, setProgramHistories] = useState<SponsorProgramHistoryRow[]>([])
  const [basicInfo, setBasicInfo] = useState<BasicInfoEditState | null>(null)
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- `detail` 스냅샷으로 편집용 로컬 상태 동기화(목 데이터) */
  useEffect(() => {
    setContacts(detail.contacts.map(contact => ({ ...contact })))
    setProgramHistories(detail.programHistories.map(row => ({ ...row })))
    setBasicInfo(buildBasicInfoEditStateFromDetail(detail))
    setIsEditingBasicInfo(false)
  }, [detail])
  /* eslint-enable react-hooks/set-state-in-effect */

  const removeProgramHistoryRows = useCallback((ids: string[]): void => {
    const idSet = new Set(ids)
    setProgramHistories(prev => prev.filter(row => !idSet.has(row.id)))
  }, [])

  const handleBasicInfoChange = useCallback(
    (updater: (prev: BasicInfoEditState) => BasicInfoEditState): void => {
      setBasicInfo(prev => (prev ? updater(prev) : prev))
    },
    []
  )

  const handleToggleBasicInfoEdit = useCallback(
    (canWrite: boolean): void => {
      if (!canWrite || !basicInfo) return
      if (isEditingBasicInfo) {
        setIsEditingBasicInfo(false)
        return
      }
      setBasicInfo(buildBasicInfoEditStateFromDetail(detail))
      setIsEditingBasicInfo(true)
    },
    [basicInfo, detail, isEditingBasicInfo]
  )

  return {
    detail,
    basicInfo,
    setBasicInfo,
    contacts,
    setContacts,
    programHistories,
    removeProgramHistoryRows,
    isEditingBasicInfo,
    handleBasicInfoChange,
    handleToggleBasicInfoEdit,
  }
}
