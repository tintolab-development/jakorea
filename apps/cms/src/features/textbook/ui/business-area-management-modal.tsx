import type { ColumnsType } from 'antd/es/table'
import {
  ActionResultModal,
  ContentModal,
  CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS,
  CmsButton,
} from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { useBusinessAreaManagementModal } from '@/features/textbook/hooks/use-business-area-management-modal'
import type { TextbookBusinessAreaRow } from '@/features/textbook/model/business-area.types'
import { BusinessAreaDeleteBlockedModal } from '@/features/textbook/ui/business-area-delete-blocked-modal'
import { BusinessAreaDuplicateAlertModal } from '@/features/textbook/ui/business-area-duplicate-alert-modal'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

/** 모달 가로 패딩 30×2 제외한 테이블 영역 (600 − 60) */
const TABLE_INNER_WIDTH = 540
const NAME_COL_WIDTH = 324
const ACTIONS_COL_WIDTH = TABLE_INNER_WIDTH - NAME_COL_WIDTH
const MODAL_Z = 1000
const SUB_MODAL_Z = 1100

export type BusinessAreaManagementModalProps = {
  open: boolean
  onCancel: () => void
  onSaved?: () => void
}

export function BusinessAreaManagementModal({
  open,
  onCancel,
  onSaved,
}: BusinessAreaManagementModalProps) {
  const ctrl = useBusinessAreaManagementModal({
    open,
    onClose: onCancel,
    onSaved,
  })

  const {
    editingId,
    editDraft,
    setEditDraft,
    editInputRef,
    startEdit,
    cancelEdit,
    submitEdit,
    requestDelete,
  } = ctrl

  const columns: ColumnsType<TextbookBusinessAreaRow> = [
    {
      title: '사업 분야명',
      dataIndex: 'name',
      key: 'name',
      width: NAME_COL_WIDTH,
      align: 'center',
      render: (_: string, row) =>
        editingId === row.id ? (
          <CmsInput
            ref={editInputRef}
            inputSize="medium"
            width="100%"
            value={editDraft}
            onChange={e => setEditDraft(e.target.value)}
            onPressEnter={() => {
              void submitEdit()
            }}
            aria-label="사업 분야명 편집"
          />
        ) : (
          <span>{row.name}</span>
        ),
    },
    {
      title: '관리',
      key: 'actions',
      width: ACTIONS_COL_WIDTH,
      align: 'center',
      render: (_: unknown, row) =>
        editingId === row.id ? (
          <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
            <CmsButton type="button" variant="default" size="h32" onClick={cancelEdit}>
              취소
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="h32"
              onClick={() => {
                void submitEdit()
              }} >
              등록
            </CmsButton>
          </div>
        ) : (
          <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
            <CmsButton
              type="button"
              variant="default"
              size="h32"
              onClick={() => startEdit(row)} >
              수정
            </CmsButton>
            <CmsButton
              type="button"
              variant="delete"
              size="h32"
              onClick={() => {
                void requestDelete(row)
              }} >
              삭제
            </CmsButton>
          </div>
        ),
    },
  ]

  const footer = (
    <>
      <CmsButton
        variant="default"
        size="h40"
        type="button"
        onClick={ctrl.handleClose}
        disabled={ctrl.saving || ctrl.loading} >
        닫기
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="h40"
        type="button"
        onClick={ctrl.openCompose}
        disabled={ctrl.saving || ctrl.loading} >
        항목 추가
      </CmsButton>
      <CmsButton
        variant="primary"
        size="h40"
        type="button"
        onClick={ctrl.applySettings}
        disabled={ctrl.saving || ctrl.loading} >
        저장
      </CmsButton>
    </>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={ctrl.handleClose}
        title="사업 분야 관리"
        width={600}
        titleBodyGap="list-settings"
        footer={footer}
        zIndex={MODAL_Z}
      >
        <div>
          <div>
            <CmsDataTable<TextbookBusinessAreaRow>
              rowKey="id"
              className="cms-data-table cms-data-table--skip-auto-no-col"
              tableLayout="fixed"
              pagination={false}
              columns={columns}
              dataSource={ctrl.rows}
              loading={ctrl.loading}
              locale={{ emptyText: '등록된 사업 분야가 없습니다.' }}
              summary={
                ctrl.composeOpen
                  ? () => (
                      <CmsDataTable.Summary>
                        <CmsDataTable.Summary.Row>
                          <CmsDataTable.Summary.Cell index={0} align="center">
                            <CmsInput
                              ref={ctrl.newInputRef}
                              inputSize="medium"
                              width="100%"
                              placeholder="사업 분야명을 입력해주세요"
                              value={ctrl.newDraft}
                              onChange={e => ctrl.setNewDraft(e.target.value)}
                              onPressEnter={() => {
                                void ctrl.submitNew()
                              }}
                              aria-label="새 사업 분야명"
                            />
                          </CmsDataTable.Summary.Cell>
                          <CmsDataTable.Summary.Cell index={1} align="center">
                            <div className={CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS}>
                              <CmsButton
                                type="button"
                                variant="default"
                                size="h32"
                                onClick={ctrl.cancelNew} >
                                취소
                              </CmsButton>
                              <CmsButton
                                type="button"
                                variant="secondary"
                                size="h32"
                                onClick={() => {
                                  void ctrl.submitNew()
                                }} >
                                등록
                              </CmsButton>
                            </div>
                          </CmsDataTable.Summary.Cell>
                        </CmsDataTable.Summary.Row>
                      </CmsDataTable.Summary>
                    )
                  : undefined
              }
            />
          </div>
          {ctrl.saveError ? <p role="alert">{ctrl.saveError}</p> : null}
        </div>
      </ContentModal>

      <BusinessAreaDeleteBlockedModal
        open={ctrl.deleteBlockedOpen}
        onClose={ctrl.closeDeleteBlocked}
        zIndex={SUB_MODAL_Z}
      />
      <BusinessAreaDuplicateAlertModal
        open={ctrl.duplicateAlertOpen}
        onClose={ctrl.closeDuplicateAlert}
        zIndex={SUB_MODAL_Z}
      />
      <ActionResultModal
        open={ctrl.settingsCompleteOpen}
        title="사업 분야 설정 완료"
        body="사업 분야 설정이 완료되었습니다."
        onClose={ctrl.closeSettingsComplete}
        zIndex={SUB_MODAL_Z}
      />
    </>
  )
}
