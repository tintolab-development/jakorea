import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { updateSponsorBasicInfo } from '@/features/sponsor/api/admin-sponsors-service'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { useSponsorDetailQuery } from '@/features/sponsor/hooks/use-sponsor-detail-query'
import type {
  SponsorContactRow,
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorProgramHistoryRow,
} from '@/features/sponsor/model/sponsor-management.types'
import type { BasicInfoEditState } from '@/features/sponsor/ui/sponsor-detail-basic-info'
import { normalizeSponsorContactsSingleLead } from '@/features/sponsor/utils/normalize-sponsor-contacts-single-lead'
import { splitAddress } from '@/features/sponsor/utils/split-address'

export interface UseSponsorDetailReturn {
  detail: SponsorManagementDetailView
  basicInfo: BasicInfoEditState | null
  setBasicInfo: React.Dispatch<React.SetStateAction<BasicInfoEditState | null>>
  contacts: SponsorContactRow[]
  setContacts: React.Dispatch<React.SetStateAction<SponsorContactRow[]>>
  programHistories: SponsorProgramHistoryRow[]
  removeProgramHistoryRows: (ids: string[]) => void
  isEditingBasicInfo: boolean
  handleBasicInfoChange: (updater: (prev: BasicInfoEditState) => BasicInfoEditState) => void
  handleToggleBasicInfoEdit: (canWrite: boolean) => void
  programHistoryDeleteDisabled: boolean
  refetchDetail: () => Promise<unknown>
}

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

function sponsorRowToPlaceholderDetail(sponsor: SponsorManagementRow): SponsorManagementDetailView {
  return {
    ...sponsor,
    nameDisplayKo: sponsor.name,
    nameDisplayEn: sponsor.nameEn ?? '',
    businessNumber: '',
    executives: '',
    address: '',
    contacts: [],
    programHistories: [],
  }
}

export function useSponsorDetail(sponsor: SponsorManagementRow): UseSponsorDetailReturn {
  const detailQuery = useSponsorDetailQuery(sponsor.id, true)

  const detail = useMemo((): SponsorManagementDetailView => {
    if (detailQuery.data) return detailQuery.data
    return sponsorRowToPlaceholderDetail(sponsor)
  }, [detailQuery.data, sponsor])

  const [contacts, setContacts] = useState<SponsorContactRow[]>([])
  const [programHistories, setProgramHistories] = useState<SponsorProgramHistoryRow[]>([])
  const [basicInfo, setBasicInfo] = useState<BasicInfoEditState | null>(null)
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- detail 스냅샷으로 편집용 로컬 상태 동기화 */
  useEffect(() => {
    setContacts(normalizeSponsorContactsSingleLead(detail.contacts.map(contact => ({ ...contact }))))
    setProgramHistories(detail.programHistories.map(row => ({ ...row })))
    setBasicInfo(buildBasicInfoEditStateFromDetail(detail))
    setIsEditingBasicInfo(false)
  }, [detail])
  /* eslint-enable react-hooks/set-state-in-effect */

  const removeProgramHistoryRows = useCallback((_ids: string[]): void => {
    // API에 삭제 엔드포인트 없음 — no-op
  }, [])

  const handleBasicInfoChange = useCallback(
    (updater: (prev: BasicInfoEditState) => BasicInfoEditState): void => {
      setBasicInfo(prev => (prev ? updater(prev) : prev))
    },
    []
  )

  const handleToggleBasicInfoEdit = useCallback(
    async (canWrite: boolean): Promise<void> => {
      if (!canWrite || !basicInfo) return
      if (isEditingBasicInfo) {
        try {
          await updateSponsorBasicInfo(sponsor.id, basicInfo, detail)
          await detailQuery.refetch()
        } catch (error) {
          console.debug(
            'sponsorDetail basicInfo save failed',
            getDataManagementApiErrorMessage(error, '기본 정보 저장에 실패했습니다.')
          )
          return
        }
        setIsEditingBasicInfo(false)
        return
      }
      setBasicInfo(buildBasicInfoEditStateFromDetail(detail))
      setIsEditingBasicInfo(true)
    },
    [basicInfo, detail, detailQuery, isEditingBasicInfo, sponsor.id]
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
    programHistoryDeleteDisabled: true,
    refetchDetail: () => detailQuery.refetch(),
  }
}
