/**
 * 개인정보 수정 모달 컴포넌트
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from 'antd'
import { useEffect, useId, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import {
  AdminProfileApiError,
  shouldAttemptRemoteProfileUpdate,
  updateMyProfile,
} from '@/features/auth/api/admin-profile-service'
import {
  profileEditSchema,
  type ProfileEditFormData,
} from '@/features/auth/model/profile-edit-schema'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton, CmsInput, ContentModal, useCmsAlert } from '@/shared/ui'
import type { User } from '@/types/user'
import './profile-edit-modal.css'
import { fieldValidationHelp } from '@/shared/utils/error-handler'

interface ProfileEditModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

function ProfileAvatarGraphic() {
  const clipId = useId().replace(/:/g, '')

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
      <g clipPath={`url(#${clipId})`}>
        <rect width="120" height="120" rx="60" fill="#296075" />
        <circle opacity="0.7" cx="60" cy="48.75" r="22.5" fill="white" />
        <circle opacity="0.7" cx="60" cy="120" r="45" fill="white" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="120" height="120" rx="60" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function AvatarCameraIcon() {
  const maskId = useId().replace(/:/g, '')

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <rect width="36" height="36" rx="18" fill="white" />
      <rect width="36" height="36" rx="18" fill="#3D3D3D" fillOpacity="0.1" />
      <rect x="0.5" y="0.5" width="35" height="35" rx="17.5" stroke="#3D3D3D" strokeOpacity="0.1" />
      <mask id={maskId} maskUnits="userSpaceOnUse" x="8" y="8" width="20" height="20">
        <rect x="8" y="8" width="20" height="20" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M10.4999 25.5C10.0416 25.5 9.64922 25.3368 9.32284 25.0104C8.99645 24.684 8.83325 24.2917 8.83325 23.8333V13.8333C8.83325 13.375 8.99645 12.9826 9.32284 12.6563C9.64922 12.3299 10.0416 12.1667 10.4999 12.1667H13.1249L14.1666 11.0417C14.3194 10.875 14.5034 10.7431 14.7187 10.6458C14.9339 10.5486 15.1596 10.5 15.3958 10.5H18.8333C19.0694 10.5 19.2673 10.5799 19.427 10.7396C19.5867 10.8993 19.6666 11.0972 19.6666 11.3333C19.6666 11.5694 19.5867 11.7674 19.427 11.9271C19.2673 12.0868 19.0694 12.1667 18.8333 12.1667H15.3958L13.8749 13.8333H10.4999V23.8333H23.8333V17.1667C23.8333 16.9306 23.9131 16.7326 24.0728 16.5729C24.2326 16.4132 24.4305 16.3333 24.6666 16.3333C24.9027 16.3333 25.1006 16.4132 25.2603 16.5729C25.4201 16.7326 25.4999 16.9306 25.4999 17.1667V23.8333C25.4999 24.2917 25.3367 24.684 25.0103 25.0104C24.6839 25.3368 24.2916 25.5 23.8333 25.5H10.4999ZM23.8333 12.1667H22.9999C22.7638 12.1667 22.5659 12.0868 22.4062 11.9271C22.2464 11.7674 22.1666 11.5694 22.1666 11.3333C22.1666 11.0972 22.2464 10.8993 22.4062 10.7396C22.5659 10.5799 22.7638 10.5 22.9999 10.5H23.8333V9.66667C23.8333 9.43056 23.9131 9.23264 24.0728 9.07292C24.2326 8.9132 24.4305 8.83334 24.6666 8.83334C24.9027 8.83334 25.1006 8.9132 25.2603 9.07292C25.4201 9.23264 25.4999 9.43056 25.4999 9.66667V10.5H26.3333C26.5694 10.5 26.7673 10.5799 26.927 10.7396C27.0867 10.8993 27.1666 11.0972 27.1666 11.3333C27.1666 11.5694 27.0867 11.7674 26.927 11.9271C26.7673 12.0868 26.5694 12.1667 26.3333 12.1667H25.4999V13C25.4999 13.2361 25.4201 13.434 25.2603 13.5938C25.1006 13.7535 24.9027 13.8333 24.6666 13.8333C24.4305 13.8333 24.2326 13.7535 24.0728 13.5938C23.9131 13.434 23.8333 13.2361 23.8333 13V12.1667ZM17.1666 22.5833C18.2083 22.5833 19.0937 22.2188 19.8228 21.4896C20.552 20.7604 20.9166 19.875 20.9166 18.8333C20.9166 17.7917 20.552 16.9063 19.8228 16.1771C19.0937 15.4479 18.2083 15.0833 17.1666 15.0833C16.1249 15.0833 15.2395 15.4479 14.5103 16.1771C13.7812 16.9063 13.4166 17.7917 13.4166 18.8333C13.4166 19.875 13.7812 20.7604 14.5103 21.4896C15.2395 22.2188 16.1249 22.5833 17.1666 22.5833ZM17.1666 20.9167C16.5833 20.9167 16.0902 20.7153 15.6874 20.3125C15.2846 19.9097 15.0833 19.4167 15.0833 18.8333C15.0833 18.25 15.2846 17.7569 15.6874 17.3542C16.0902 16.9514 16.5833 16.75 17.1666 16.75C17.7499 16.75 18.243 16.9514 18.6458 17.3542C19.0485 17.7569 19.2499 18.25 19.2499 18.8333C19.2499 19.4167 19.0485 19.9097 18.6458 20.3125C18.243 20.7153 17.7499 20.9167 17.1666 20.9167Z"
          fill="#3D3D3D"
          fillOpacity="0.5"
        />
      </g>
    </svg>
  )
}

export function ProfileEditModal({ open, onCancel, onSuccess }: ProfileEditModalProps) {
  const { user, updateUser, logout } = useAuthStore()
  const { showAlert } = useCmsAlert()
  const [saving, setSaving] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawKeyword, setWithdrawKeyword] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
    },
  })

  useEffect(() => {
    if (!open || !user) return
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
    })
  }, [open, user, reset])

  const onFormSubmit = async (values: ProfileEditFormData) => {
    if (!user) return

    const normalizedPhone = values.phone?.trim() || ''
    const normalizedEmail = values.email.trim()
    const currentPhone = user.phone?.trim() || ''
    const currentEmail = user.email.trim()

    if (normalizedPhone === currentPhone && normalizedEmail === currentEmail) {
      showAlert({
        title: '변경 사항 없음',
        content: '수정된 내용이 없습니다.',
      })
      return
    }

    setSaving(true)
    try {
      const saved = await updateMyProfile({
        phone: normalizedPhone || undefined,
        email: normalizedEmail,
      })

      const updateData: Partial<Omit<User, 'password'>> = {
        phone: saved.phone,
        email: saved.email,
        updatedAt: new Date().toISOString(),
      }

      updateUser(updateData)
      onSuccess?.()
      onCancel()

      const savedMessage = shouldAttemptRemoteProfileUpdate()
        ? '내 정보가 저장되었습니다.'
        : hasRemoteAdminJwt()
          ? '내 정보가 로컬 세션에 저장되었습니다. 서버 프로필 수정 API가 준비되면 동기화됩니다.'
          : '내 정보가 저장되었습니다.'

      showAlert({
        title: '저장 완료',
        content: savedMessage,
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
      const message =
        error instanceof AdminProfileApiError
          ? error.message
          : '내 정보 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      showAlert({
        title: '저장 실패',
        content: message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      })
    }
    onCancel()
  }

  const handleOpenWithdrawModal = () => {
    setWithdrawKeyword('')
    setWithdrawModalOpen(true)
  }

  const handleCloseWithdrawModal = () => {
    if (withdrawing) return
    setWithdrawModalOpen(false)
    setWithdrawKeyword('')
  }

  const handleWithdraw = async () => {
    if (!user || withdrawKeyword.trim() !== '탈퇴') {
      return
    }

    setWithdrawing(true)
    try {
      updateUser({ isActive: false })
      setWithdrawModalOpen(false)
      onCancel()
      logout()
    } catch (error) {
      console.error('Failed to withdraw account:', error)
      } finally {
      setWithdrawing(false)
      setWithdrawKeyword('')
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showAlert({
        title: '업로드 불가',
        content: 'JPG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.',
      })
      event.target.value = ''
      return
    }

    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      showAlert({
        title: '업로드 불가',
        content: '프로필 이미지는 2MB 이하만 업로드할 수 있습니다.',
      })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) {
        return
      }

      updateUser({ profileImageUrl: result })
    }
    reader.onerror = () => {
      showAlert({
        title: '업로드 실패',
        content: '이미지를 읽는 중 오류가 발생했습니다. 다시 시도해 주세요.',
      })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  if (!user) return null

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={handleCancel}>
        닫기
      </CmsButton>
      <CmsButton variant="primary" size="large" type="submit" form="profile-edit-form" loading={saving}>
        저장
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="내 정보 수정"
      width={800}
      className="profile-edit-modal"
      footer={footer}
    >
      <form id="profile-edit-form" onSubmit={handleSubmit(onFormSubmit)} className="profile-edit-modal__form">
        <div className="profile-edit-modal__content">
          <div className="profile-edit-modal__avatar-column">
            <div className="profile-edit-modal__avatar-wrap">
              <div className="profile-edit-modal__avatar-button" aria-hidden>
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={`${user.name} 프로필 이미지`} className="profile-edit-modal__avatar-image" />
                ) : (
                  <ProfileAvatarGraphic />
                )}
              </div>
              <button
                type="button"
                className="profile-edit-modal__camera-icon-button"
                aria-label="프로필 사진 업로드"
                onClick={handleCameraClick}
              >
                <AvatarCameraIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="profile-edit-modal__file-input"
                aria-label="프로필 이미지 파일 선택"
                onChange={handleAvatarUpload}
              />
            </div>
            <button type="button" className="profile-edit-modal__withdraw-button" onClick={handleOpenWithdrawModal}>
              회원탈퇴
            </button>
          </div>

          <div className="profile-edit-modal__fields">
            <div className="profile-edit-modal__field-row">
              <label className="profile-edit-modal__field-label" htmlFor="profile-edit-name">이름</label>
              <Form.Item validateStatus={errors.name ? 'error' : ''} help={fieldValidationHelp(errors.name)}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <CmsInput
                      inputSize="large"
                      width="100%"
                      disabled
                      placeholder="홍길동"
                      value={field.value}
                      id="profile-edit-name"
                    />
                  )}
                />
              </Form.Item>
            </div>

            <div className="profile-edit-modal__field-row">
              <label className="profile-edit-modal__field-label" htmlFor="profile-edit-phone">연락처</label>
              <Form.Item validateStatus={errors.phone ? 'error' : ''} help={fieldValidationHelp(errors.phone)}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <CmsInput inputSize="large" width="100%" placeholder="010-1234-5678" {...field} id="profile-edit-phone" />
                  )}
                />
              </Form.Item>
            </div>

            <div className="profile-edit-modal__field-row">
              <label className="profile-edit-modal__field-label" htmlFor="profile-edit-email">이메일</label>
              <Form.Item validateStatus={errors.email ? 'error' : ''} help={fieldValidationHelp(errors.email)}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <CmsInput
                      inputSize="large"
                      width="100%"
                      placeholder="gilldong@naver.com"
                      {...field}
                      id="profile-edit-email"
                    />
                  )}
                />
              </Form.Item>
            </div>
          </div>
        </div>
      </form>

      <ContentModal
        open={withdrawModalOpen}
        onCancel={handleCloseWithdrawModal}
        title="회원 탈퇴 안내"
        width={600}
        className="profile-withdraw-modal"
        footer={
          <>
            <CmsButton variant="secondary" onClick={handleCloseWithdrawModal}>
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              onClick={handleWithdraw}
              loading={withdrawing}
              disabled={withdrawKeyword.trim() !== '탈퇴'}
            >
              회원 탈퇴
            </CmsButton>
          </>
        }
      >
        <div className="profile-withdraw-modal__content">
          <p className="profile-withdraw-modal__description">
            JA KOREA 서비스에서 탈퇴하시겠습니까?
            <br />
            탈퇴 시 회원님의 계정 정보, 이용 내역 및 저장된 데이터가 모두 영구 삭제됩니다.
            <br />
            삭제된 정보는 복구가 불가능합니다. 정말 탈퇴하시겠습니까?
          </p>

          <CmsInput
            inputSize="large"
            width="100%"
            placeholder="탈퇴하시려면 해당란에 [탈퇴]를 입력해 주세요."
            value={withdrawKeyword}
            onChange={event => setWithdrawKeyword(event.target.value)}
          />
        </div>
      </ContentModal>
    </ContentModal>
  )
}
