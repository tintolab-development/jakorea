/**
 * 개인후원 — 성장 후원하기 버튼 (인라인 편집)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { DonateCta } from '@/entities/individual-donation/model/types'
import { useSaveDonateCta } from '@/features/individual-donation/api/hooks'
import { individualDonationSaveFailureAlert } from '@/features/individual-donation/lib/save-failure-alert'
import { CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'

import './section-shared.css'

type Row = DonateCta & { key: string }

type Props = {
  donateCta: DonateCta
}

export function DonateCtaSectionCard({ donateCta }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveDonateCta()
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(donateCta.buttonLabel)
  const [draftLink, setDraftLink] = useState(donateCta.linkUrl)

  useEffect(() => {
    if (isEditing) return
    setDraftLabel(donateCta.buttonLabel)
    setDraftLink(donateCta.linkUrl)
  }, [donateCta.buttonLabel, donateCta.linkUrl, isEditing])

  const rows = useMemo<Row[]>(
    () => [{ key: 'donate', ...donateCta }],
    [donateCta]
  )

  const handleEdit = useCallback(() => {
    setDraftLabel(donateCta.buttonLabel)
    setDraftLink(donateCta.linkUrl)
    setIsEditing(true)
  }, [donateCta.buttonLabel, donateCta.linkUrl])

  const handleCancel = useCallback(() => {
    setDraftLabel(donateCta.buttonLabel)
    setDraftLink(donateCta.linkUrl)
    setIsEditing(false)
  }, [donateCta.buttonLabel, donateCta.linkUrl])

  const handleSave = useCallback(async () => {
    const buttonLabel = draftLabel.trim()
    const linkUrl = draftLink.trim()
    if (!buttonLabel) {
      showAlert({ title: '입력 확인', content: '버튼명을 입력해 주세요.' })
      return
    }
    if (!linkUrl) {
      showAlert({ title: '입력 확인', content: '연결 링크를 입력해 주세요.' })
      return
    }
    try {
      await saveMutation.mutateAsync({ buttonLabel, linkUrl, version: donateCta.version })
      setIsEditing(false)
    } catch (err) {
      showAlert(
        individualDonationSaveFailureAlert(
          err,
          '개인후원 CTA 저장에 실패했습니다. 다시 시도해 주세요.'
        )
      )
    }
  }, [donateCta.version, draftLabel, draftLink, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<Row>>(
    () => [
      {
        title: '버튼명',
        key: 'buttonLabel',
        width: 320,
        align: 'center',
        className: 'individual-donation-col--button',
        render: (_value, record) =>
          isEditing ? (
            <CmsInput
              inputSize="medium"
              width="100%"
              value={draftLabel}
              onChange={e => setDraftLabel(e.target.value)}
              placeholder="버튼명을 입력하세요"
              aria-label="개인후원 CTA 버튼명"
            />
          ) : (
            record.buttonLabel
          ),
      },
      {
        title: '연결 링크',
        key: 'linkUrl',
        align: 'center',
        className: 'individual-donation-col--link',
        render: (_value, record) => {
          const value = isEditing ? draftLink : record.linkUrl
          if (isEditing) {
            return (
              <CmsInput
                inputSize="medium"
                width="100%"
                value={draftLink}
                onChange={e => setDraftLink(e.target.value)}
                placeholder="연결 링크를 입력하세요"
                aria-label="성장 후원하기 연결 링크"
              />
            )
          }
          return (
            <span className="individual-donation-url" title={value || undefined}>
              {value || '-'}
            </span>
          )
        },
      },
    ],
    [draftLabel, draftLink, isEditing]
  )

  return (
    <div className="individual-donation-section">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">■ {donateCta.buttonLabel || '성장 후원하기'}</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="large" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <CmsDataTable<Row>
        className="cms-data-table cms-data-table--skip-auto-no-col individual-donation-cta-table"
        columns={columns}
        dataSource={rows}
        pagination={false}
        rowKey="key"
        scroll={{ x: true }}
      />
    </div>
  )
}
