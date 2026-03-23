/**
 * 게시글 상세 모달
 * 수강 프로그램 상세 > 게시글 탭 > 게시글 카드 클릭 시 노출
 */

import { useState, useMemo, useEffect } from 'react'
import { message, Popover } from 'antd'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui'
import type { ProgramPost, ProgramFile } from '@/types/domain'
import dayjs from 'dayjs'
import { ProfileAvatarIcon } from '@/shared/components/profile-avatar-icon'
import { getCommentsByPostId, markPostAsRead, createProgramPostComment, incrementPostCommentCount } from '@/data/mock'
import { downloadFile } from '@/shared/lib/file-download'
import './post-detail-modal.css'

function formatKoDate(date: string | Date): string {
  const d = dayjs(date)
  const ampm = d.hour() < 12 ? '오전' : '오후'
  const hour = d.hour() % 12 || 12
  return d.format(`YYYY년 M월 D일 ${ampm} ${hour}:mm`)
}

/** 인풋 문자열에 이모지가 포함되어 있는지 여부 */
function hasEmoji(str: string): boolean {
  return /\p{Extended_Pictographic}/u.test(str)
}

// ── 아이콘 ───────────────────────────────────────────

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <mask id="post-detail-modal-eye-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
        <rect width="22" height="22" fill="#D9D9D9" />
      </mask>
      <g mask="url(#post-detail-modal-eye-mask)">
        <path d="M13.6493 13.6513C14.375 12.9256 14.7379 12.0427 14.7379 11.0026C14.7379 9.96249 14.375 9.07959 13.6493 8.3539C12.9236 7.6282 12.0407 7.26535 11.0006 7.26535C9.96052 7.26535 9.07762 7.6282 8.35192 8.3539C7.62623 9.07959 7.26338 9.96249 7.26338 11.0026C7.26338 12.0427 7.62623 12.9256 8.35192 13.6513C9.07762 14.377 9.96052 14.7399 11.0006 14.7399C12.0407 14.7399 12.9236 14.377 13.6493 13.6513ZM9.24751 12.7557C8.76625 12.2745 8.52563 11.6901 8.52563 11.0026C8.52563 10.3151 8.76625 9.73073 9.24751 9.24948C9.72875 8.76823 10.3131 8.5276 11.0006 8.5276C11.6881 8.5276 12.2725 8.76823 12.7538 9.24948C13.235 9.73073 13.4756 10.3151 13.4756 11.0026C13.4756 11.6901 13.235 12.2745 12.7538 12.7557C12.2725 13.237 11.6881 13.4776 11.0006 13.4776C10.3131 13.4776 9.72875 13.237 9.24751 12.7557ZM5.70596 15.8749C4.10592 14.8455 2.82878 13.4911 1.87453 11.8118C1.79814 11.6801 1.7423 11.5476 1.70701 11.4142C1.67187 11.2808 1.6543 11.1436 1.6543 11.0026C1.6543 10.8616 1.67187 10.7244 1.70701 10.591C1.7423 10.4576 1.79814 10.3251 1.87453 10.1934C2.82878 8.51408 4.10592 7.15971 5.70596 6.13029C7.30601 5.10072 9.07089 4.58594 11.0006 4.58594C12.9304 4.58594 14.6953 5.10072 16.2953 6.13029C17.8953 7.15971 19.1725 8.51408 20.1267 10.1934C20.2031 10.3251 20.259 10.4576 20.2943 10.591C20.3294 10.7244 20.347 10.8616 20.347 11.0026C20.347 11.1436 20.3294 11.2808 20.2943 11.4142C20.259 11.5476 20.2031 11.6801 20.1267 11.8118C19.1725 13.4911 17.8953 14.8455 16.2953 15.8749C14.6953 16.9045 12.9304 17.4193 11.0006 17.4193C9.07089 17.4193 7.30601 16.9045 5.70596 15.8749ZM15.7558 14.6807C17.1996 13.7717 18.3034 12.5457 19.0673 11.0026C18.3034 9.45955 17.1996 8.23351 15.7558 7.32448C14.3121 6.41545 12.727 5.96094 11.0006 5.96094C9.27424 5.96094 7.68917 6.41545 6.24542 7.32448C4.80167 8.23351 3.69785 9.45955 2.93396 11.0026C3.69785 12.5457 4.80167 13.7717 6.24542 14.6807C7.68917 15.5898 9.27424 16.0443 11.0006 16.0443C12.727 16.0443 14.3121 15.5898 15.7558 14.6807Z" fill="currentColor" />
      </g>
    </svg>
  )
}

function EmoticonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M12.838 9.007C13.142 9.007 13.399 8.9 13.61 8.688C13.821 8.476 13.926 8.218 13.926 7.915C13.926 7.612 13.82 7.355 13.608 7.144C13.396 6.932 13.138 6.827 12.835 6.827C12.531 6.827 12.274 6.933 12.063 7.145C11.852 7.358 11.747 7.615 11.747 7.919C11.747 8.222 11.853 8.479 12.065 8.69C12.277 8.901 12.535 9.007 12.838 9.007ZM7.165 9.007C7.469 9.007 7.726 8.9 7.937 8.688C8.148 8.476 8.253 8.218 8.253 7.915C8.253 7.612 8.147 7.355 7.935 7.144C7.722 6.932 7.465 6.827 7.162 6.827C6.858 6.827 6.601 6.933 6.39 7.145C6.179 7.358 6.074 7.615 6.074 7.919C6.074 8.222 6.18 8.479 6.392 8.69C6.604 8.901 6.862 9.007 7.165 9.007ZM12.385 13.597C13.105 13.11 13.636 12.467 13.977 11.667H12.875C12.569 12.181 12.163 12.587 11.656 12.886C11.149 13.184 10.597 13.333 10 13.333C9.403 13.333 8.851 13.184 8.344 12.886C7.837 12.587 7.43 12.181 7.125 11.667H6.022C6.364 12.467 6.895 13.11 7.615 13.597C8.335 14.084 9.13 14.327 10 14.327C10.87 14.327 11.664 14.084 12.385 13.597ZM10 17.917C8.906 17.917 7.877 17.709 6.913 17.293C5.95 16.878 5.112 16.314 4.4 15.602C3.687 14.889 3.123 14.051 2.707 13.088C2.291 12.125 2.083 11.096 2.083 10.002C2.083 8.907 2.291 7.877 2.707 6.914C3.122 5.95 3.686 5.112 4.398 4.4C5.111 3.687 5.949 3.123 6.912 2.707C7.875 2.291 8.904 2.083 9.999 2.083C11.094 2.083 12.123 2.291 13.086 2.707C14.05 3.122 14.888 3.686 15.6 4.399C16.313 5.111 16.877 5.949 17.293 6.907C17.709 7.875 17.917 8.945 17.917 9.999C17.917 11.094 17.709 12.123 17.293 13.086C16.878 14.05 16.314 14.888 15.601 15.601C14.889 16.313 14.051 16.877 13.088 17.293C12.125 17.709 11.096 17.917 10 17.917ZM10 16.667C11.861 16.667 13.438 16.021 14.729 14.729C16.021 13.438 16.667 11.861 16.667 10C16.667 8.139 16.021 6.563 14.729 5.271C13.438 3.979 11.861 3.333 10 3.333C8.139 3.333 6.563 3.979 5.271 5.271C3.979 6.563 3.333 8.139 3.333 10C3.333 11.861 3.979 13.438 5.271 14.729C6.563 16.021 8.139 16.667 10 16.667Z" fill="currentColor"/>
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5.401 15.632L3.76 17.274C3.527 17.507 3.258 17.56 2.955 17.432C2.652 17.305 2.5 17.075 2.5 16.742V4.816C2.5 4.401 2.643 4.051 2.93 3.764C3.217 3.477 3.568 3.333 3.982 3.333H16.597C17.011 3.333 17.361 3.477 17.648 3.764C17.935 4.051 18.079 4.401 18.079 4.816V14.15C18.079 14.564 17.935 14.915 17.648 15.202C17.361 15.489 17.011 15.632 16.597 15.632H5.401ZM4.878 14.403H16.597C16.66 14.403 16.718 14.376 16.77 14.324C16.823 14.271 16.849 14.213 16.849 14.15V4.816C16.849 4.752 16.823 4.695 16.77 4.642C16.718 4.59 16.66 4.563 16.597 4.563H3.982C3.919 4.563 3.861 4.59 3.809 4.642C3.756 4.695 3.73 4.752 3.73 4.816V15.538L4.878 14.403ZM7.523 9.996C7.664 9.855 7.735 9.684 7.735 9.483C7.735 9.282 7.664 9.111 7.523 8.97C7.381 8.828 7.21 8.758 7.01 8.758C6.809 8.758 6.638 8.828 6.496 8.97C6.355 9.111 6.284 9.282 6.284 9.483C6.284 9.684 6.355 9.855 6.496 9.996C6.638 10.137 6.809 10.208 7.01 10.208C7.21 10.208 7.381 10.137 7.523 9.996ZM10.803 9.996C10.944 9.855 11.015 9.684 11.015 9.483C11.015 9.282 10.944 9.111 10.803 8.97C10.661 8.828 10.49 8.758 10.289 8.758C10.089 8.758 9.918 8.828 9.776 8.97C9.635 9.111 9.564 9.282 9.564 9.483C9.564 9.684 9.635 9.855 9.776 9.996C9.918 10.137 10.089 10.208 10.289 10.208C10.49 10.208 10.661 10.137 10.803 9.996ZM14.082 9.996C14.224 9.855 14.294 9.684 14.294 9.483C14.294 9.282 14.224 9.111 14.082 8.97C13.941 8.828 13.77 8.758 13.569 8.758C13.368 8.758 13.197 8.828 13.056 8.97C12.914 9.111 12.844 9.282 12.844 9.483C12.844 9.684 12.914 9.855 13.056 9.996C13.197 10.137 13.368 10.208 13.569 10.208C13.77 10.208 13.941 10.137 14.082 9.996Z" fill="currentColor"/>
    </svg>
  )
}

function ClipIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M12.189 15.421C11.454 16.472 10.463 17.11 9.216 17.336C7.969 17.562 6.823 17.309 5.776 16.577C4.725 15.842 4.091 14.85 3.874 13.599C3.656 12.349 3.915 11.199 4.65 10.148L8.718 4.332C9.24 3.585 9.943 3.132 10.827 2.972C11.711 2.812 12.526 2.993 13.272 3.515C14.019 4.038 14.469 4.741 14.621 5.626C14.774 6.511 14.59 7.327 14.068 8.074L10.217 13.579C9.911 14.017 9.496 14.284 8.974 14.379C8.452 14.476 7.972 14.37 7.534 14.064C7.096 13.758 6.83 13.342 6.735 12.818C6.641 12.294 6.748 11.81 7.057 11.369L11.03 5.689L12 6.368L8.027 12.047C7.906 12.221 7.862 12.407 7.896 12.607C7.929 12.808 8.033 12.968 8.206 13.09C8.379 13.211 8.566 13.253 8.765 13.216C8.965 13.179 9.125 13.073 9.247 12.9L13.102 7.389C13.429 6.906 13.546 6.385 13.452 5.826C13.357 5.267 13.071 4.82 12.594 4.486C12.116 4.152 11.596 4.036 11.033 4.139C10.471 4.242 10.023 4.533 9.689 5.01L5.62 10.827C5.066 11.604 4.872 12.458 5.036 13.389C5.2 14.321 5.672 15.06 6.455 15.607C7.226 16.146 8.073 16.33 8.995 16.159C9.917 15.987 10.658 15.515 11.219 14.743L15.409 8.752L16.379 9.431L12.189 15.421Z" fill="currentColor"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 13.333L6.25 9.583L7.188 8.625L9.375 10.812V3.333H10.625V10.812L12.812 8.625L13.75 9.583L10 13.333ZM5 16.667C4.655 16.667 4.36 16.545 4.115 16.302C3.872 16.057 3.75 15.762 3.75 15.417V12.917H5V15.417H15V12.917H16.25V15.417C16.25 15.762 16.128 16.057 15.885 16.302C15.64 16.545 15.345 16.667 15 16.667H5Z" fill="currentColor"/>
    </svg>
  )
}

function EmojiIcon({ active }: { active?: boolean }) {
  if (active) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
        <mask id="mask-emoji-active" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
          <rect width="30" height="30" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask-emoji-active)">
          <path d="M19.2575 13.5097C19.7125 13.5097 20.0982 13.3504 20.4147 13.0319C20.7311 12.7135 20.8894 12.327 20.8894 11.8722C20.8894 11.4174 20.7302 11.0318 20.4119 10.7153C20.0935 10.3986 19.7069 10.2403 19.2519 10.2403C18.7971 10.2403 18.4115 10.3996 18.095 10.7181C17.7785 11.0365 17.6203 11.423 17.6203 11.8778C17.6203 12.3326 17.7795 12.7182 18.0978 13.0347C18.4161 13.3514 18.8027 13.5097 19.2575 13.5097ZM10.7481 13.5097C11.2029 13.5097 11.5885 13.3504 11.905 13.0319C12.2215 12.7135 12.3797 12.327 12.3797 11.8722C12.3797 11.4174 12.2205 11.0318 11.9022 10.7153C11.5839 10.3986 11.1973 10.2403 10.7425 10.2403C10.2875 10.2403 9.90177 10.3996 9.58531 10.7181C9.26886 11.0365 9.11063 11.423 9.11063 11.8778C9.11063 12.3326 9.26979 12.7182 9.58813 13.0347C9.90646 13.3514 10.2931 13.5097 10.7481 13.5097ZM18.5769 20.3953C19.6571 19.6653 20.4535 18.7002 20.9662 17.5H19.3125C18.8542 18.2708 18.2448 18.8802 17.4844 19.3281C16.724 19.776 15.8958 20 15 20C14.1042 20 13.276 19.776 12.5156 19.3281C11.7552 18.8802 11.1458 18.2708 10.6875 17.5H9.03375C9.54646 18.7002 10.3429 19.6653 11.4231 20.3953C12.5033 21.1253 13.6956 21.4903 15 21.4903C16.3044 21.4903 17.4967 21.1253 18.5769 20.3953ZM10.3706 25.94C8.92542 25.3167 7.66833 24.4707 6.59937 23.4022C5.53042 22.3336 4.68406 21.0771 4.06031 19.6325C3.43677 18.1879 3.125 16.6445 3.125 15.0022C3.125 13.3597 3.43667 11.8158 4.06 10.3706C4.68333 8.92542 5.52927 7.66833 6.59781 6.59937C7.66635 5.53042 8.92292 4.68406 10.3675 4.06031C11.8121 3.43677 13.3555 3.125 14.9978 3.125C16.6403 3.125 18.1842 3.43667 19.6294 4.06C21.0746 4.68333 22.3317 5.52927 23.4006 6.59781C24.4696 7.66635 25.3159 8.92292 25.9397 10.3675C26.5632 11.8121 26.875 13.3555 26.875 14.9978C26.875 16.6403 26.5633 18.1842 25.94 19.6294C25.3167 21.0746 24.4707 22.3317 23.4022 23.4006C22.3336 24.4696 21.0771 25.3159 19.6325 25.9397C18.1879 26.5632 16.6445 26.875 15.0022 26.875C13.3597 26.875 11.8158 26.5633 10.3706 25.94Z" fill="#01A1AF"/>
        </g>
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <g opacity="0.5">
        <mask id="mask-emoji-inactive" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
          <rect width="30" height="30" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask-emoji-inactive)">
          <path d="M19.2575 13.5097C19.7125 13.5097 20.0982 13.3504 20.4147 13.0319C20.7311 12.7135 20.8894 12.327 20.8894 11.8722C20.8894 11.4174 20.7302 11.0318 20.4119 10.7153C20.0935 10.3986 19.7069 10.2403 19.2519 10.2403C18.7971 10.2403 18.4115 10.3996 18.095 10.7181C17.7785 11.0365 17.6203 11.423 17.6203 11.8778C17.6203 12.3326 17.7795 12.7182 18.0978 13.0347C18.4161 13.3514 18.8027 13.5097 19.2575 13.5097ZM10.7481 13.5097C11.2029 13.5097 11.5885 13.3504 11.905 13.0319C12.2215 12.7135 12.3797 12.327 12.3797 11.8722C12.3797 11.4174 12.2205 11.0318 11.9022 10.7153C11.5839 10.3986 11.1973 10.2403 10.7425 10.2403C10.2875 10.2403 9.90177 10.3996 9.58531 10.7181C9.26886 11.0365 9.11063 11.423 9.11063 11.8778C9.11063 12.3326 9.26979 12.7182 9.58813 13.0347C9.90646 13.3514 10.2931 13.5097 10.7481 13.5097ZM18.5769 20.3953C19.6571 19.6653 20.4535 18.7002 20.9662 17.5H19.3125C18.8542 18.2708 18.2448 18.8802 17.4844 19.3281C16.724 19.776 15.8958 20 15 20C14.1042 20 13.276 19.776 12.5156 19.3281C11.7552 18.8802 11.1458 18.2708 10.6875 17.5H9.03375C9.54646 18.7002 10.3429 19.6653 11.4231 20.3953C12.5033 21.1253 13.6956 21.4903 15 21.4903C16.3044 21.4903 17.4967 21.1253 18.5769 20.3953ZM10.3706 25.94C8.92542 25.3167 7.66833 24.4707 6.59937 23.4022C5.53042 22.3336 4.68406 21.0771 4.06031 19.6325C3.43677 18.1879 3.125 16.6445 3.125 15.0022C3.125 13.3597 3.43667 11.8158 4.06 10.3706C4.68333 8.92542 5.52927 7.66833 6.59781 6.59937C7.66635 5.53042 8.92292 4.68406 10.3675 4.06031C11.8121 3.43677 13.3555 3.125 14.9978 3.125C16.6403 3.125 18.1842 3.43667 19.6294 4.06C21.0746 4.68333 22.3317 5.52927 23.4006 6.59781C24.4696 7.66635 25.3159 8.92292 25.9397 10.3675C26.5632 11.8121 26.875 13.3555 26.875 14.9978C26.875 16.6403 26.5633 18.1842 25.94 19.6294C25.3167 21.0746 24.4707 22.3317 23.4022 23.4006C22.3336 24.4696 21.0771 25.3159 19.6325 25.9397C18.1879 26.5632 16.6445 26.875 15.0022 26.875C13.3597 26.875 11.8158 26.5633 10.3706 25.94ZM22.0938 22.0938C24.0312 20.1562 25 17.7917 25 15C25 12.2083 24.0312 9.84375 22.0938 7.90625C20.1562 5.96875 17.7917 5 15 5C12.2083 5 9.84375 5.96875 7.90625 7.90625C5.96875 9.84375 5 12.2083 5 15C5 17.7917 5.96875 20.1562 7.90625 22.0938C9.84375 24.0312 12.2083 25 15 25C17.7917 25 20.1562 24.0312 22.0938 22.0938Z" fill="#3D3D3D"/>
        </g>
      </g>
    </svg>
  )
}

function SendIcon({ active }: { active?: boolean }) {
  if (active) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
        <mask id="mask-send-active" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
          <rect width="30" height="30" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask-send-active)">
          <path d="M4.375 24.0625V17.0913L13.0288 15L4.375 12.9088V5.9375L25.8894 15L4.375 24.0625Z" fill="#01A1AF"/>
        </g>
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <g opacity="0.5">
        <mask id="mask-send-inactive" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
          <rect width="30" height="30" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask-send-inactive)">
          <path d="M4.375 24.0625V5.9375L25.8894 15L4.375 24.0625ZM6.25 21.25L21.0625 15L6.25 8.75V13.3653L13.0288 15L6.25 16.6347V21.25Z" fill="#3D3D3D"/>
        </g>
      </g>
    </svg>
  )
}

// ── 컴포넌트 ─────────────────────────────────────────

export interface PostDetailModalProps {
  open: boolean
  onCancel: () => void
  post: ProgramPost | null
  files: ProgramFile[]
  /** 댓글 등록 시 표시할 작성자명 (미입력 시 '나') */
  commentAuthorName?: string
}

export function PostDetailModal({ open, onCancel, post, files, commentAuthorName }: PostDetailModalProps) {
  const [commentInput, setCommentInput] = useState('')
  const [emojiActive, setEmojiActive] = useState(false)
  const [commentsVersion, setCommentsVersion] = useState(0)
  const sendActive = commentInput.trim().length > 0

  const comments = useMemo(
    () => (post ? getCommentsByPostId(post.id) : []),
    [post?.id, commentsVersion]
  )
  useEffect(() => {
    if (open && post) markPostAsRead(post.id)
  }, [open, post?.id])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setCommentInput(prev => prev + emojiData.emoji)
  }

  const handleSubmitComment = () => {
    if (!post) return
    const trimmed = commentInput.trim()
    if (!trimmed) {
      message.warning('댓글 내용을 입력해 주세요.')
      return
    }
    createProgramPostComment(post.id, commentAuthorName ?? '나', trimmed)
    incrementPostCommentCount(post.id)
    setCommentsVersion(v => v + 1)
    setCommentInput('')
    message.success('댓글이 등록되었습니다.')
  }

  if (!post) return null

  const dateStr = formatKoDate(post.publishedAt)
  const postTypeLabel =
    post.postType === 'notice' ? '[공지사항]' :
    post.postType === 'schedule' ? '[일정 알림]' :
    null

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="게시글 상세"
      width={800}
      className="post-detail-modal"
      footer={
        <AppButton variant="cancel" size="large" onClick={onCancel}>
          닫기
        </AppButton>
      }
    >
      <div className="post-detail-modal__body">
        {/* 7:3 레이아웃: 좌 게시글 본문, 우 첨부파일 */}
        <div className="post-detail-modal__main-row">
          <div className="post-detail-modal__main-left">
            {/* ── 게시글 카드 (본문만) ── */}
            <div className="post-detail-modal__card">
              <div className="post-detail-modal__card-header">
                <ProfileAvatarIcon className="post-detail-modal__avatar" />
                <div className="post-detail-modal__author-info">
                  <span className="post-detail-modal__author-name">{post.authorName}</span>
                  <div className="post-detail-modal__author-meta">
                    <span className="post-detail-modal__date">{dateStr}</span>
                    <span className="post-detail-modal__meta-divider">|</span>
                    <span className="post-detail-modal__meta-item">
                      <EyeIcon /> {post.viewCount}
                    </span>
                    <span className="post-detail-modal__meta-item">
                      <EmoticonIcon /> {post.reactionCount}
                    </span>
                    <span className="post-detail-modal__meta-item">
                      <CommentIcon /> {post.commentCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="post-detail-modal__content">
                {postTypeLabel && (
                  <span className="post-detail-modal__type-tag">{postTypeLabel}</span>
                )}
                {post.content}
              </div>

              {/* 첨부파일: 본문 카드 하단, 스크린샷 스펙 */}
              {files.length > 0 && (
                <div className="post-detail-modal__attachments">
                  <div className="post-detail-modal__attachments-header">
                    <span className="post-detail-modal__attachments-icon">
                      <ClipIcon />
                    </span>
                    <span>{files.length}개의 첨부파일</span>
                  </div>
                  <div className="post-detail-modal__file-list">
                    {files.map(file => (
                      <button
                        key={file.id}
                        type="button"
                        className="post-detail-modal__file-item"
                        onClick={() => downloadFile(file.fileName, file.fileUrl)}
                      >
                        <span className="post-detail-modal__file-item-icon">
                          <DownloadIcon />
                        </span>
                        <span className="post-detail-modal__file-item-name">{file.fileName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 댓글 카드 (전체 너비) ── */}
        <div className="post-detail-modal__comments-card">
          {comments.map(comment => (
            <div key={comment.id} className="post-detail-modal__comment">
              <ProfileAvatarIcon className="post-detail-modal__avatar" />
              <div className="post-detail-modal__comment-body">
                <div className="post-detail-modal__comment-header">
                  <span className="post-detail-modal__comment-author">{comment.authorName}</span>
                  <span className="post-detail-modal__comment-date">
                    {formatKoDate(comment.createdAt)}
                  </span>
                </div>
                <p className="post-detail-modal__comment-content">{comment.content}</p>
              </div>
            </div>
          ))}

          <div className="post-detail-modal__comment-input-row">
            <ProfileAvatarIcon className="post-detail-modal__avatar" />
            <input
              className="post-detail-modal__comment-input"
              placeholder="댓글을 남겨보세요"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
            />
            <Popover
              trigger="click"
              open={emojiActive}
              onOpenChange={setEmojiActive}
              overlayClassName="post-detail-modal__emoji-popover"
              content={
                <div className="post-detail-modal__emoji-picker-wrap">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width="100%"
                    height={360}
                    searchPlaceHolder="이모지 검색"
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              }
              placement="topRight"
            >
              <button
                type="button"
                className="post-detail-modal__comment-btn"
                aria-label="이모티콘"
              >
                <EmojiIcon active={emojiActive || hasEmoji(commentInput)} />
              </button>
            </Popover>
            <button
              type="button"
              className="post-detail-modal__comment-btn"
              aria-label="댓글 전송"
              onClick={handleSubmitComment}
            >
              <SendIcon active={sendActive} />
            </button>
          </div>
        </div>

      </div>
    </ContentModal>
  )
}
