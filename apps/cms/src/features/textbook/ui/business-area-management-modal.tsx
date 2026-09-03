import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ActionResultModal, ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { useBusinessAreaManagementModal } from '@/features/textbook/hooks/use-business-area-management-modal'
import type { TextbookBusinessAreaRow } from '@/features/textbook/model/business-area.types'
import { BusinessAreaDeleteBlockedModal } from '@/features/textbook/ui/business-area-delete-blocked-modal'
import { BusinessAreaDuplicateAlertModal } from '@/features/textbook/ui/business-area-duplicate-alert-modal'
import './business-area-management-modal.css'

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

  const columns: ColumnsType<TextbookBusinessAreaRow> = [
    {
      title: '사업 분야명',
      dataIndex: 'name',
      key: 'name',
      width: NAME_COL_WIDTH,
      align: 'center',
      render: (_: string, row) =>
        ctrl.editingId === row.id ? (
          <CmsInput
            ref={ctrl.editInputRef}
            inputSize="medium"
            width="100%"
            value={ctrl.editDraft}
            onChange={e => ctrl.setEditDraft(e.target.value)}
            onPressEnter={() => {
              void ctrl.submitEdit()
            }}
            aria-label="사업 분야명 편집"
          />
        ) : (
          <span className="business-area-management-modal__name-text">{row.name}</span>
        ),
    },
    {
      title: '관리',
      key: 'actions',
      width: ACTIONS_COL_WIDTH,
      align: 'center',
      render: (_: unknown, row) =>
        ctrl.editingId === row.id ? (
          <div className="business-area-management-modal__actions">
            <CmsButton
              type="button"
              variant="default"
              size="medium"
              width={80}
              className="business-area-management-modal__action-btn"
              onClick={ctrl.cancelEdit}
            >
              취소
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={80}
              className="business-area-management-modal__action-btn"
              onClick={() => {
                void ctrl.submitEdit()
              }}
            >
              등록
            </CmsButton>
          </div>
        ) : (
          <div className="business-area-management-modal__actions">
            <CmsButton
              type="button"
              variant="default"
              size="medium"
              width={80}
              className="business-area-management-modal__action-btn"
              onClick={() => ctrl.startEdit(row)}
            >
              수정
            </CmsButton>
            <CmsButton
              type="button"
              variant="delete"
              size="medium"
              width={80}
              className="business-area-management-modal__action-btn"
              onClick={() => {
                void ctrl.requestDelete(row)
              }}
            >
              삭제
            </CmsButton>
          </div>
        ),
    },
  ]

  return (
    <>
      <ContentModal
        open={open}
        onCancel={ctrl.handleClose}
        title="사업 분야 관리"
        width={600}
        zIndex={MODAL_Z}
        titleBodyGap="none"
        className="business-area-management-modal"
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              onClick={ctrl.handleClose}
              disabled={ctrl.saving || ctrl.loading}
            >
              닫기
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              onClick={ctrl.openCompose}
              disabled={ctrl.saving || ctrl.loading}
            >
              사업 분야 추가
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              onClick={ctrl.applySettings}
              disabled={ctrl.saving || ctrl.loading}
            >
              사업 분야 저장
            </CmsButton>
          </>
        }
      >
        <div className="business-area-management-modal__table-wrap">
          <div className="business-area-management-modal__table-scroll">
            <Table<TextbookBusinessAreaRow>
              rowKey="id"
              bordered
              className="cms-data-table cms-data-table--skip-auto-no-col business-area-management-modal__table"
              tableLayout="fixed"
              pagination={false}
              columns={columns}
              dataSource={ctrl.rows}
              locale={{ emptyText: '등록된 사업 분야가 없습니다.' }}
              summary={
                ctrl.composeOpen
                  ? () => (
                      <Table.Summary>
                        <Table.Summary.Row className="business-area-management-modal__summary">
                          <Table.Summary.Cell index={0} align="center">
                            <div className="business-area-management-modal__compose">
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
                            </div>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="center">
                            <div className="business-area-management-modal__actions">
                              <CmsButton
                                type="button"
                                variant="default"
                                size="medium"
                                width={80}
                                className="business-area-management-modal__action-btn"
                                onClick={ctrl.cancelNew}
                              >
                                취소
                              </CmsButton>
                              <CmsButton
                                type="button"
                                variant="secondary"
                                size="medium"
                                width={80}
                                className="business-area-management-modal__action-btn"
                                onClick={() => {
                                  void ctrl.submitNew()
                                }}
                              >
                                등록
                              </CmsButton>
                            </div>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )
                  : undefined
              }
            />
          </div>
          {ctrl.saveError ? (
            <p className="business-area-management-modal__error">{ctrl.saveError}</p>
          ) : null}
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
