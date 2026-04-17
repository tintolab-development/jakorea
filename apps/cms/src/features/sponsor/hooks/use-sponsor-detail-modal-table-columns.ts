import { useCallback, useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type {
  SponsorContactRow,
  SponsorProgramHistoryRow,
} from '@/features/sponsor/model/sponsor-management.types'
import { buildContactColumns } from '@/features/sponsor/columns/sponsor-contact-columns'
import { buildProgramHistoryColumns } from '@/features/sponsor/columns/sponsor-program-history-columns'
import type { UseSponsorContactsReturn } from '@/features/sponsor/hooks/use-sponsor-contacts'

export interface UseSponsorDetailModalTableColumnsParams {
  contacts: SponsorContactRow[]
  canWrite: boolean
  sponsorContacts: UseSponsorContactsReturn
  filteredProgramHistoryRowCount: number
}

export interface UseSponsorDetailModalTableColumnsResult {
  contactColumns: ColumnsType<SponsorContactRow>
  programHistoryColumns: ColumnsType<SponsorProgramHistoryRow>
}

/**
 * 후원사 상세 모달의 담당자·프로그램 이력 테이블 컬럼을 조립합니다 (컬럼 정의는 columns/ 빌더에만 존재).
 */
export function useSponsorDetailModalTableColumns({
  contacts,
  canWrite,
  sponsorContacts,
  filteredProgramHistoryRowCount,
}: UseSponsorDetailModalTableColumnsParams): UseSponsorDetailModalTableColumnsResult {
  const { openDropdownId, setOpenDropdownId, handleTypeChange } = sponsorContacts

  const handleContactTypeDropdownOpenChange = useCallback(
    (contactId: string, open: boolean): void => {
      setOpenDropdownId(open ? contactId : null)
    },
    [setOpenDropdownId]
  )

  const contactColumns = useMemo((): ColumnsType<SponsorContactRow> => {
    return buildContactColumns({
      contactCount: contacts.length,
      canWrite,
      openDropdownId,
      onTypeChange: handleTypeChange,
      onDropdownOpenChange: handleContactTypeDropdownOpenChange,
    })
  }, [canWrite, contacts.length, handleContactTypeDropdownOpenChange, handleTypeChange, openDropdownId])

  const programHistoryColumns = useMemo((): ColumnsType<SponsorProgramHistoryRow> => {
    return buildProgramHistoryColumns(filteredProgramHistoryRowCount)
  }, [filteredProgramHistoryRowCount])

  return { contactColumns, programHistoryColumns }
}
