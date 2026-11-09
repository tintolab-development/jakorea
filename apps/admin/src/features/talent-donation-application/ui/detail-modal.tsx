/**
 * 재능기부 신청 상세 모달 (조회 전용)
 */

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { TalentDonationApplication } from '@/entities/talent-donation-application/model/types'
import { shouldUseTalentDonationApplicationRemoteApi } from '@/features/talent-donation-application/api/capabilities'
import { downloadTalentDonationApplicationAttachmentService } from '@/features/talent-donation-application/api/service'
import { homepageAttachmentDownloadErrorMessage } from '@/shared/lib/protected-attachment-download'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import { DEFAULT_CONFIRM_ACTOR } from '@/features/talent-donation-application/api/store'
import {
  formatDateDot,
  formatDateRangeDot,
  formatDateTimeDotWithKoreanWeekday,
} from '@/shared/lib/format-display'
import {
  CmsButton,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  PageContentLoading,
  useCmsAlert,
} from '@/shared/ui'

import fileDownloadBlack20Url from '@/shared/ui/icons/file-download-black-20.svg'

import './detail-modal.css'

dayjs.locale('ko')

type Props = {
  open: boolean
  data: TalentDonationApplication | null
  loading?: boolean
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
  onDelete: () => void
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


export function TalentDonationApplicationDetailModal({
  open,
  data,
  loading = false,
  confirmLoading = false,
  deleteLoading = false,
  onCancel,
  onConfirm,
  onDelete,
}: Props) {
  const { showAlert } = useCmsAlert()
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) setDeleteConfirmOpen(false)
  }, [open])

  const isConfirmed = data?.status === 'confirmed'
  const waiting = loading && !data
  const busy = confirmLoading || deleteLoading || waiting

  const confirmedView = (() => {
    if (!data?.confirmedAt) {
      return <span>-</span>
    }
    const name = data.confirmedByName?.trim() || DEFAULT_CONFIRM_ACTOR
    return (
      <span className="talent-app-detail-modal__confirmed">
        <span>{formatDateTimeDotWithKoreanWeekday(data.confirmedAt)}</span>
        <DetailInfoForm.TdDivider />
        <span>{name}</span>
      </span>
    )
  })()

  const genderDobView = (() => {
    if (!data) return <span>-</span>
    if (data.piiMasked) {
      // 마스킹 응답: 원문 gender·birthDate는 null — 서버 마스킹 값만 그대로 표시하고 나이는 계산하지 않는다
      return (
        <span className="talent-app-detail-modal__confirmed">
          <span>{data.maskedGender || '-'}</span>
          <DetailInfoForm.TdDivider />
          <span>{data.maskedBirthDate || '-'}</span>
        </span>
      )
    }
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
    data?.attachmentFileName && shouldUseTalentDonationApplicationRemoteApi() ? (
      <button
        type="button"
        className="talent-app-detail-modal__attachment"
        // 권한 설정 V1.2: 신청자 첨부는 개인정보(HOMEPAGE_PII_VIEW). Program Viewer는 클릭 시 접근 불가 안내.
        data-homepage-action="pii"
        onClick={() => {
          if (!data?.id) return
          runProtectedDownload({
            kind: 'HOMEPAGE_PII_ATTACHMENT',
            zIndex: 1400,
            download: async password => {
              try {
                await downloadTalentDonationApplicationAttachmentService(
                  data.id,
                  data.attachmentAssetId,
                  password,
                  data.attachmentFileName ?? 'download'
                )
              } catch (error) {
                showAlert({
                  title: '다운로드 실패',
                  content: homepageAttachmentDownloadErrorMessage(
                    error,
                    '첨부파일 다운로드에 실패했습니다.'
                  ),
                })
                throw error
              }
            },
          })
        }}
      >
        <img
          className="talent-app-detail-modal__file-icon"
          src={fileDownloadBlack20Url}
          alt=""
          width={20}
          height={20}
          aria-hidden
        />
        <span className="talent-app-detail-modal__file-name">{data.attachmentFileName}</span>
      </button>
    ) : (
      <span>{data?.attachmentFileName || '-'}</span>
    )

  const footer = (
    <>
      <CmsButton
        className={CONTENT_MODAL_FOOTER_START_CLASS}
        variant="delete"
        size="medium"
        type="button"
        loading={deleteLoading}
        disabled={busy}
        onClick={() => setDeleteConfirmOpen(true)} >
        신청 삭제
      </CmsButton>
      <CmsButton
        variant="secondary"
        size="medium"
        type="button"
        disabled={busy}
        onClick={onCancel} >
        닫기
      </CmsButton>
      <CmsButton
        variant="primary"
        size="medium"
        type="button"
        loading={confirmLoading}
        disabled={busy || isConfirmed || !data}
        onClick={onConfirm} >
        신청 확인
      </CmsButton>
    </>
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
        {waiting ? (
          <PageContentLoading />
        ) : data ? (
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
                    view={<span>{formatDateTimeDotWithKoreanWeekday(data.appliedAt)}</span>}
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
                    view={<span>{formatDateRangeDot(data.availableFrom, data.availableTo)}</span>}
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

      {filePasswordModal}
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
