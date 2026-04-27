import { useCallback } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { HorizontalTableFormEditor } from '@/features/template/ui/form-set/horizontal-table-form-editor'

type NewHorizontalTableFormQuery = {
  mode?: string
  type?: string
  id?: string
}

export default function NewHorizontalTableForm() {
  const { setParams } = useQueryParams<NewHorizontalTableFormQuery>()

  const handleClose = useCallback(() => {
    setParams({ mode: undefined, type: undefined, id: undefined })
  }, [setParams])

  return <HorizontalTableFormEditor variant="fullpage-modal" onClose={handleClose} />
}
