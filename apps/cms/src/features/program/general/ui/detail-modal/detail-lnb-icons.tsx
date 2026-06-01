/** 일반 프로그램 상세 LNB 아이콘 (20×20, currentColor) */

import type { SVGProps } from 'react'
import { useId } from 'react'

const iconClass = 'detail-fullpage-modal__lnb-icon'

export { LnbIconProjectInfo, LnbIconProgress, LnbIconManagers } from './program-detail-lnb-icons'
export { UjatLnbInstitutionApplicationIcon as GeneralLnbInstitutionApplicationIcon } from '@/features/program/ujat/ui/detail-modal/application-institution/lnb-icon'
export { UjatLnbVolunteerHandshakeIcon as GeneralLnbVolunteerHandshakeIcon } from '@/features/program/ujat/ui/detail-modal/application-volunteer/ujat-lnb-volunteer-handshake-icon'
export { UjatLnbSurveyManagementIcon as GeneralLnbSurveyManagementIcon } from '@/features/program/ujat/ui/detail-modal/survey-management/ujat-lnb-survey-management-icon'

/** 강사 신청 목록 — 사용자 + 배지 */
export function GeneralLnbInstructorApplicationIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, '_')
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={iconClass}
      aria-hidden
      {...props}
    >
      <mask
        id={`general_instructor_mask_${id}`}
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <rect width="20" height="20" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#general_instructor_mask_${id})`}>
        <path
          d="M7.5 12.5C6.25 12.5 5.20833 12.0833 4.375 11.25C3.54167 10.4167 3.125 9.375 3.125 8.125C3.125 6.875 3.54167 5.83333 4.375 5C5.20833 4.16667 6.25 3.75 7.5 3.75C8.75 3.75 9.79167 4.16667 10.625 5C11.4583 5.83333 11.875 6.875 11.875 8.125C11.875 9.375 11.4583 10.4167 10.625 11.25C9.79167 12.0833 8.75 12.5 7.5 12.5ZM7.5 11.25C8.33333 11.25 9.02778 10.9583 9.58333 10.375C10.1389 9.79167 10.4167 9.09722 10.4167 8.29167C10.4167 7.48611 10.1389 6.79167 9.58333 6.20833C9.02778 5.625 8.33333 5.33333 7.5 5.33333C6.66667 5.33333 5.97222 5.625 5.41667 6.20833C4.86111 6.79167 4.58333 7.48611 4.58333 8.29167C4.58333 9.09722 4.86111 9.79167 5.41667 10.375C5.97222 10.9583 6.66667 11.25 7.5 11.25ZM2.5 16.25V15.2083C2.5 14.6528 2.63889 14.1458 2.91667 13.6875C3.19444 13.2292 3.5625 12.8819 4.02083 12.6458C4.89583 12.1875 5.79861 11.8403 6.72917 11.6042C7.65972 11.3681 8.61111 11.25 9.58333 11.25C10.5556 11.25 11.5069 11.3681 12.4375 11.6042C13.3681 11.8403 14.2708 12.1875 15.1458 12.6458C15.6042 12.8819 15.9722 13.2292 16.25 13.6875C16.5278 14.1458 16.6667 14.6528 16.6667 15.2083V16.25H2.5ZM14.5833 8.95833C14.3403 8.95833 14.1319 8.87153 13.9583 8.69792C13.7847 8.52431 13.6979 8.31597 13.6979 8.07292C13.6979 7.82986 13.7847 7.62153 13.9583 7.44792C14.1319 7.27431 14.3403 7.1875 14.5833 7.1875H15.4167C15.6597 7.1875 15.8681 7.27431 16.0417 7.44792C16.2153 7.62153 16.3021 7.82986 16.3021 8.07292C16.3021 8.31597 16.2153 8.52431 16.0417 8.69792C15.8681 8.87153 15.6597 8.95833 15.4167 8.95833H14.5833ZM14.1667 6.45833L15.2083 5.41667C15.3819 5.24306 15.5903 5.15625 15.8333 5.15625C16.0764 5.15625 16.2847 5.24306 16.4583 5.41667C16.6319 5.59028 16.7188 5.79861 16.7188 6.04167C16.7188 6.28472 16.6319 6.49306 16.4583 6.66667L15.4167 7.70833C15.2431 7.88194 15.0347 7.96875 14.7917 7.96875C14.5486 7.96875 14.3403 7.88194 14.1667 7.70833C13.9931 7.53472 13.9062 7.32639 13.9062 7.08333C13.9062 6.84028 13.9931 6.63194 14.1667 6.45833Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
