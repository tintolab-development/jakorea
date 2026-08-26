/**
 * 재능기부 신청 상세 모달 (조회 전용)
 */

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { TalentDonationApplication } from '@/entities/talent-donation-application/model/types'
import { DEFAULT_CONFIRM_ACTOR } from '@/features/talent-donation-application/api/store'
import { formatDateDot, formatDateRangeDot } from '@/shared/lib/format-display'
import { CmsButton, ConfirmModal, ContentModal } from '@/shared/ui'

import './detail-modal.css'

dayjs.locale('ko')

type Props = {
  open: boolean
  data: TalentDonationApplication | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
  onDelete: () => void
}

function formatDateTimeWithWeekday(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return d.format('YYYY.MM.DD(ddd) HH:mm')
}

function statusLabel(status: TalentDonationApplication['status']): string {
  return status === 'confirmed' ? '확인 완료' : '확인 대기'
}

function genderLabel(gender: TalentDonationApplication['gender']): string {
  return gender === 'female' ? '여성' : '남성'
}

function internationalAge(isoDate: string): number | null {
  const dob = dayjs(isoDate)
  if (!dob.isValid()) return null
  const now = dayjs()
  let age = now.year() - dob.year()
  if (now.format('MMDD') < dob.format('MMDD')) age -= 1
  return age
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5.5 2.5h6.2L14.5 5.3V16.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 2.5V5.8H14.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TalentDonationApplicationDetailModal({
  open,
  data,
  confirmLoading = false,
  deleteLoading = false,
  onCancel,
  onConfirm,
  onDelete,
}: Props) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) setDeleteConfirmOpen(false)
  }, [open])

  const isConfirmed = data?.status === 'confirmed'
  const busy = confirmLoading || deleteLoading

  const confirmedView = (() => {
    if (!data?.confirmedAt) {
      return <span>-</span>
    }
    const name = data.confirmedByName?.trim() || DEFAULT_CONFIRM_ACTOR
    return (
      <span className="talent-app-detail-modal__confirmed">
        <span>{formatDateTimeWithWeekday(data.confirmedAt)}</span>
        <DetailInfoForm.TdDivider />
        <span>{name}</span>
      </span>
    )
  })()

  const genderDobView = (() => {
    if (!data) return <span>-</span>
    const age = internationalAge(data.birthDate)
    const dob = formatDateDot(data.birthDate)
    return (
      <span className="talent-app-detail-modal__confirmed">
        <span>{genderLabel(data.gender)}</span>
        <DetailInfoForm.TdDivider />
        <span>
          {dob}
          {age != null ? ` (만 ${age}세)` : ''}
        </span>
      </span>
    )
  })()

  const attachmentView =
    data?.attachmentFileName ? (
      data.attachmentUrl ? (
        <a
          className="talent-app-detail-modal__attachment"
          href={data.attachmentUrl}
          download={data.attachmentFileName}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FileIcon className="talent-app-detail-modal__file-icon" />
          <span>{data.attachmentFileName}</span>
        </a>
      ) : (
        <span>{data.attachmentFileName}</span>
      )
    ) : (
      <span>-</span>
    )

  const footer = (
    <div className="talent-app-detail-modal__footer">
      <CmsButton
        variant="delete"
        size="large"
        type="button"
        loading={deleteLoading}
        disabled={busy}
        onClick={() => setDeleteConfirmOpen(true)}
      >
        신청 삭제
      </CmsButton>
      <div className="talent-app-detail-modal__footer-end">
        <CmsButton
          variant="secondary"
          size="large"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          닫기
        </CmsButton>
        <CmsButton
          variant="primary"
          size="large"
          type="button"
          loading={confirmLoading}
          disabled={busy || isConfirmed || !data}
          onClick={onConfirm}
        >
          신청 확인
        </CmsButton>
      </div>
    </div>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="재능기부 신청 상세"
        size="large"
        className="talent-app-detail-modal"
        footer={footer}
      >
        {data ? (
          <div className="talent-app-detail-modal__scroll">
            <section
              className="talent-app-detail-modal__section"
              aria-labelledby="talent-app-basic-heading"
            >
              <h3 id="talent-app-basic-heading" className="talent-app-detail-modal__section-title">
                기본 정보
              </h3>
              <DetailInfoForm
                title="기본 정보"
                hideHeader
                mode="view"
                className="talent-app-detail-modal__table"
              >
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="신청일시"
                    view={<span>{formatDateTimeWithWeekday(data.appliedAt)}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                  <DetailInfoForm.Field
                    label="확인일시"
                    view={confirmedView}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="처리 상태"
                    view={
                      <span
                        className={
                          data.status === 'pending'
                            ? 'talent-app-detail-modal__status talent-app-detail-modal__status--pending'
                            : 'talent-app-detail-modal__status talent-app-detail-modal__status--confirmed'
                        }
                      >
                        {statusLabel(data.status)}
                      </span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                  <DetailInfoForm.Field
                    label="개인정보 수집·이용 동의"
                    view={<span>{data.privacyConsent ? '동의' : '-'}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="신청자명"
                    view={<span>{data.applicantName || '-'}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                  <DetailInfoForm.Field
                    label="성별 및 생년월일"
                    view={genderDobView}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="연락처"
                    view={<span>{data.phone || '-'}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                  <DetailInfoForm.Field
                    label="이메일"
                    view={<span>{data.email || '-'}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="소속"
                    view={<span>{data.affiliation || '-'}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                  <DetailInfoForm.Field
                    label="자택 주소"
                    view={<span>{data.homeAddress || '-'}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="재능 기부 가능 기간"
                    view={
                      <span>{formatDateRangeDot(data.availableFrom, data.availableTo)}</span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>

            <section
              className="talent-app-detail-modal__section"
              aria-labelledby="talent-app-extra-heading"
            >
              <h3 id="talent-app-extra-heading" className="talent-app-detail-modal__section-title">
                추가 정보
              </h3>
              <DetailInfoForm
                title="추가 정보"
                hideHeader
                mode="view"
                className="talent-app-detail-modal__table talent-app-detail-modal__table--extra"
              >
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="간단한 약력 소개"
                    view={
                      <span className="talent-app-detail-modal__content">
                        {data.bio?.trim() || '-'}
                      </span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="기부 가능한 재능 소개"
                    view={
                      <span className="talent-app-detail-modal__content">
                        {data.talentIntro?.trim() || '-'}
                      </span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="참여 동기"
                    view={
                      <span className="talent-app-detail-modal__content">
                        {data.motivation?.trim() || '-'}
                      </span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="JA 프로그램 참여 이력"
                    view={<span>{data.jaProgramHistory ? '있음' : '없음'}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="자유 제출 파일"
                    view={attachmentView}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>
          </div>
        ) : null}
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="신청 삭제"
        content={'선택한 신청을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete()
        }}
      />
    </>
  )
}
