/**
 * 권한별 메뉴 구성 설정
 * Phase 4.2.1: 권한별 메뉴 구성
 * Phase 0.1.5: 역할별 메뉴 완전 분리 및 권한 기반 라우트 가드 완성
 */

import type { UserRole } from '@/types/user'
import type { MenuProps } from 'antd'
import { FolderOutlined, FileTextOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons'
import React from 'react'

/** LNB 카테고리 영역 아이콘 (20x20) */
const CategoryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    viewBox="0 0 19 14"
    fill="none"
    style={{ display: 'block' }}
  >
    <path
      d="M4.33333 11C5.01972 11 5.68785 11.0764 6.33771 11.2292C6.98757 11.3819 7.625 11.5972 8.25 11.875V2.41667C7.65278 2.09722 7.03104 1.86458 6.38479 1.71875C5.73868 1.57292 5.08549 1.5 4.42521 1.5C3.91951 1.5 3.41667 1.54167 2.91667 1.625C2.41667 1.70833 1.94444 1.86097 1.5 2.08292V11.5C1.94444 11.3056 2.40625 11.1736 2.88542 11.1042C3.36458 11.0347 3.84722 11 4.33333 11ZM9.75 11.875C10.375 11.5972 11.0124 11.3819 11.6623 11.2292C12.3122 11.0764 12.9803 11 13.6667 11C14.1528 11 14.6354 11.0347 15.1146 11.1042C15.5938 11.1736 16.0556 11.3056 16.5 11.5V2.08333C16.0139 1.90278 15.5105 1.76042 14.9898 1.65625C14.4691 1.55208 13.9447 1.5 13.4167 1.5C12.7778 1.5 12.1528 1.57986 11.5417 1.73958C10.9306 1.89931 10.3333 2.125 9.75 2.41667V11.875ZM8.51042 13.7292C8.36458 13.6458 8.21375 13.5625 8.05792 13.4792C7.50542 13.1597 6.92375 12.9167 6.31292 12.75C5.70194 12.5833 5.07681 12.5 4.4375 12.5C3.99306 12.5 3.54514 12.5278 3.09375 12.5833C2.64236 12.6389 2.20833 12.7569 1.79167 12.9375C1.36111 13.1319 0.954861 13.1562 0.572917 13.0104C0.190972 12.8646 0 12.6042 0 12.2292V1.75C0 1.55556 0.0555556 1.37847 0.166667 1.21875C0.277778 1.05903 0.416667 0.930556 0.583333 0.833333C1.16667 0.5 1.78042 0.277778 2.42458 0.166667C3.06875 0.0555556 3.72583 0 4.39583 0C5.20139 0 5.96875 0.0833333 6.69792 0.25C7.42708 0.416667 8.19444 0.708333 9 1.125C9.80556 0.708333 10.5729 0.416667 11.3021 0.25C12.0313 0.0833333 12.7986 0 13.6042 0C14.2218 0 14.8276 0.0520833 15.4217 0.15625C16.0156 0.260417 16.5833 0.4375 17.125 0.6875C17.3611 0.798611 17.5694 0.940972 17.75 1.11458C17.9306 1.28819 18.0208 1.5 18.0208 1.75V12.2292C18.0208 12.5625 17.8576 12.8056 17.5312 12.9583C17.2049 13.1111 16.8542 13.1181 16.4792 12.9792C15.9931 12.7986 15.4965 12.6736 14.9896 12.6042C14.4826 12.5347 13.9722 12.5 13.4583 12.5C12.8381 12.5 12.2316 12.5799 11.639 12.7396C11.0463 12.8993 10.4861 13.1458 9.95833 13.4792C9.80556 13.5764 9.65278 13.6632 9.5 13.7396C9.34722 13.816 9.18056 13.8542 9 13.8542C8.81944 13.8542 8.65625 13.8125 8.51042 13.7292ZM10.75 4.02083C10.75 3.82639 10.809 3.65278 10.9271 3.5C11.0451 3.34722 11.2014 3.25 11.3958 3.20833C11.7431 3.13889 12.0851 3.08333 12.4219 3.04167C12.7588 3 13.1131 2.97917 13.4848 2.97917C13.7172 2.97917 13.9571 2.99076 14.2046 3.01396C14.4521 3.03701 14.6964 3.06708 14.9375 3.10417C15.1042 3.13194 15.2396 3.21208 15.3438 3.34458C15.4479 3.47708 15.5 3.62611 15.5 3.79167C15.5 4.02778 15.4167 4.22222 15.25 4.375C15.0833 4.52778 14.8819 4.58826 14.6458 4.55646C14.4514 4.53271 14.2583 4.51042 14.0667 4.48958C13.875 4.46875 13.6802 4.45833 13.4823 4.45833C13.1608 4.45833 12.8507 4.47569 12.5521 4.51042C12.2535 4.54514 11.9522 4.60326 11.6483 4.68479C11.4106 4.75604 11.2014 4.72222 11.0208 4.58333C10.8403 4.44444 10.75 4.25694 10.75 4.02083ZM10.7917 8.91667C10.7917 8.72222 10.8507 8.54861 10.9688 8.39583C11.0868 8.24306 11.2431 8.14583 11.4375 8.10417C11.7847 8.03472 12.1267 7.97917 12.4635 7.9375C12.8005 7.89583 13.1548 7.875 13.5265 7.875C13.7588 7.875 13.9987 7.8866 14.2463 7.90979C14.4938 7.93285 14.7381 7.96292 14.9792 8C15.1458 8.02778 15.2812 8.10792 15.3854 8.24042C15.4896 8.37292 15.5417 8.52194 15.5417 8.6875C15.5417 8.92361 15.4583 9.11806 15.2917 9.27083C15.125 9.42361 14.9236 9.4841 14.6875 9.45229C14.4931 9.42854 14.3 9.40625 14.1083 9.38542C13.9167 9.36458 13.7219 9.35417 13.524 9.35417C13.2024 9.35417 12.8924 9.37153 12.5938 9.40625C12.2951 9.44097 11.9939 9.4991 11.69 9.58063C11.4522 9.65188 11.2431 9.61806 11.0625 9.47917C10.8819 9.34028 10.7917 9.15278 10.7917 8.91667ZM10.7917 6.47917C10.7917 6.28472 10.8507 6.11111 10.9688 5.95833C11.0868 5.80556 11.2431 5.70833 11.4375 5.66667C11.7847 5.59722 12.1267 5.54167 12.4635 5.5C12.8005 5.45833 13.1548 5.4375 13.5265 5.4375C13.7588 5.4375 13.9987 5.4491 14.2463 5.47229C14.4938 5.49535 14.7381 5.52542 14.9792 5.5625C15.1458 5.59028 15.2812 5.67042 15.3854 5.80292C15.4896 5.93542 15.5417 6.08444 15.5417 6.25C15.5417 6.48611 15.4583 6.68056 15.2917 6.83333C15.125 6.98611 14.9236 7.0466 14.6875 7.01479C14.4931 6.99104 14.3 6.96875 14.1083 6.94792C13.9167 6.92708 13.7219 6.91667 13.524 6.91667C13.2024 6.91667 12.8924 6.93403 12.5938 6.96875C12.2951 7.00347 11.9939 7.0616 11.69 7.14313C11.4522 7.21438 11.2431 7.18056 11.0625 7.04167C10.8819 6.90278 10.7917 6.71528 10.7917 6.47917Z"
      fill="currentColor"
    />
  </svg>
)

// 3뎁스 메뉴용 닷 아이콘 (2뎁스 이상 아이콘 제거 정책으로 미사용, 유지)
const DotIcon = () => (
  <span
    style={{
      display: 'inline-block',
      width: 4,
      height: 4,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
      marginRight: 6,
      verticalAlign: 'middle',
    }}
  />
)

/**
 * 메뉴 아이템 타입 정의
 */
export interface MenuItemConfig {
  key: string
  label?: string // divider인 경우 label 생략
  icon?: React.ReactNode
  children?: MenuItemConfig[]
  type?: 'divider'
  // 권한별 접근 제어
  allowedRoles?: UserRole[] // 허용된 권한 목록 (없으면 모든 권한 허용)
  hidden?: boolean // 숨김 여부
  enabled?: boolean // 활성화/비활성화 여부 (기본값: true)
}

/**
 * 전체 메뉴 아이템 정의
 * IA 순서에 맞게 정리됨
 */
const allMenuItems: MenuItemConfig[] = [
  // 관리자 전용 홈
  {
    key: '/',
    label: '관리자 홈',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
  },

  /* 1뎁스 프로그램 관리 (ADMIN): 2뎁스 [교육 프로그램(→프로그램 목록), 수강 신청 현황, 강의 신청 현황, 봉사 프로그램] */
  {
    key: 'programs-group',
    label: '프로그램 관리',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      {
        key: '/programs/education',
        label: '교육 프로그램',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      // {
      //   key: '/applications',
      //   label: '수강 신청 현황',
      //   icon: <DotIcon />,
      //   enabled: true,
      //   allowedRoles: ['ADMIN'],
      // },
      // {
      //   key: '/instructor-applications',
      //   label: '강의 신청 현황',
      //   icon: <DotIcon />,
      //   enabled: true,
      //   allowedRoles: ['ADMIN'],
      // },
      {
        key: '/programs/volunteer',
        label: '봉사 프로그램',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },

  { key: 'divider-user', type: 'divider', enabled: true },

  // ============================================
  // 사용자(INSTRUCTOR, INDIVIDUAL, SCHOOL) 공통 1뎁스 메뉴
  // ============================================

  // 1. 내 학습 관리 (1뎁스)
  {
    key: '/my-learning',
    label: '내 학습 관리',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
  },

  // 2. 교육 프로그램 (1뎁스)
  {
    key: '/programs',
    label: '교육 프로그램',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
  },

  // 3. 봉사 프로그램 (1뎁스)
  {
    key: '/programs/volunteer',
    label: '봉사 프로그램',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
  },

  // 4. 마이페이지 (1뎁스) - 2뎁스 구조
  {
    key: 'mypage-group',
    label: '마이페이지',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
    children: [
      // 개인정보 관리 (2뎁스) - 3뎁스 확장 가능
      {
        key: 'personal-info-group',
        label: '개인정보 관리',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
        children: [
          {
            key: '/mypage/profile',
            label: '내 정보',
            icon: <DotIcon />,
            enabled: true,
            allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
          },
          // 학교(교사) 인증 / 교사 정보 (SCHOOL 권한에서만, 인증 상태에 따라 라벨 변경)
          {
            key: '/mypage/school-auth',
            label: '학교(교사) 인증',
            icon: <DotIcon />,
            enabled: true,
            allowedRoles: ['SCHOOL'],
          },
          // 강사 인증 / 강사 정보 (INSTRUCTOR, INDIVIDUAL 권한에서만, 인증 상태에 따라 라벨 변경)
          {
            key: '/mypage/instructor-auth',
            label: '강사 인증',
            icon: <DotIcon />,
            enabled: true,
            allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL'],
          },
        ],
      },
      // 내 프로그램 일정 (2뎁스)
      {
        key: '/mypage/program-schedule',
        label: '내 프로그램 일정',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
      // 강의료 정산 (2뎁스) - 강사(INSTRUCTOR) 권한에서만
      {
        key: '/settlements/my',
        label: '강의료 정산',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
      },
      // 서류 발급 이력 (2뎁스)
      {
        key: '/mypage/documents',
        label: '서류 발급 이력',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
      // 내 문의 내역 (2뎁스)
      {
        key: '/notices/inquiries/my',
        label: '내 문의 내역',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
    ],
  },

  // 5. 공지사항 (1뎁스)
  {
    key: '/notices',
    label: '공지사항',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
  },

  // 6. FAQ (1뎁스)
  {
    key: '/notices/faq',
    label: 'FAQ',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
  },

  // 7. 문의하기 (1뎁스)
  {
    key: '/notices/inquiries',
    label: '문의하기',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
  },

  // ============================================
  // 주석 처리된 메뉴 (일반 사용자용)
  // ============================================

  /* 
  // 1. 내 학습 관리 (권한별로 다른 페이지로 연결) - 주석 처리
  {
    key: 'my-learning-group',
    label: '내 학습 관리',
    icon: <FileTextOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
    children: [
      {
        key: '/instructor/schedule',
        label: '교육 일정',
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
      },
      {
        key: '/schedules/my',
        label: '내 일정',
        enabled: true,
        allowedRoles: ['INDIVIDUAL'],
      },
      {
        key: '/school/my-learning',
        label: '내 학습 관리',
        enabled: true,
        allowedRoles: ['SCHOOL'],
      },
    ],
  },
  
  // 2. 교육 프로그램 (하위 메뉴) - 주석 처리
  {
    key: 'education-programs-group',
    label: '교육 프로그램',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
    children: [
      {
        key: '/programs',
        label: '프로그램 리스트',
        enabled: true,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
    ],
  },
  
  // 3. 봉사 프로그램 (하위 메뉴) - 주석 처리
  {
    key: 'volunteer-programs-group',
    label: '봉사 프로그램',
    icon: <HeartOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
    children: [
      {
        key: '/programs/volunteer',
        label: '봉사 프로그램',
        enabled: true,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
    ],
  },
  
  // 강사 마이페이지 (하위 메뉴) - 주석 처리
  {
    key: 'instructor-mypage-group',
    label: '마이페이지',
    icon: <UserSwitchOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR'],
    children: [
      {
        key: 'instructor-personal-info-group',
        label: '개인정보 관리',
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
        children: [
          {
            key: '/mypage/profile',
            label: '내 정보',
            enabled: true,
            allowedRoles: ['INSTRUCTOR'],
          },
          {
            key: '/mypage/school-auth',
            label: '학교(교사) 인증',
            enabled: true,
            allowedRoles: ['INSTRUCTOR'],
          },
          {
            key: '/mypage/instructor-auth',
            label: '강사 인증',
            enabled: true,
            allowedRoles: ['INSTRUCTOR'],
          },
        ],
      },
      {
        key: '/mypage/program-schedule',
        label: '내 프로그램 일정',
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
      },
      {
        key: '/settlements/my',
        label: '강의료 정산',
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
      },
      {
        key: '/mypage/documents',
        label: '서류 발급 이력',
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
      },
      {
        key: '/notices/inquiries/my',
        label: '내 문의 내역',
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
      },
    ],
  },
  */

  // ============================================
  // 주석 처리된 메뉴 (역할별 전용 메뉴)
  // ============================================

  /* 
  { key: 'divider-mypage', type: 'divider', enabled: true },
  
  // 학생(INDIVIDUAL) 전용 - 봉사단
  {
    key: 'individual-volunteers-group',
    label: '봉사단',
    icon: <HeartOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['INDIVIDUAL'],
    children: [
      {
        key: '/interviews/apply',
        label: '봉사자 신청',
        enabled: true,
        allowedRoles: ['INDIVIDUAL'],
      },
      {
        key: 'volunteer-info-group',
        label: '봉사 정보',
        enabled: true,
        allowedRoles: ['INDIVIDUAL'],
        children: [
          {
            key: '/volunteers/my/schedules',
            label: '진행 상세정보',
            enabled: true,
            allowedRoles: ['INDIVIDUAL'],
          },
          {
            key: '/volunteers/education-plan',
            label: '교육 계획서 작성',
            enabled: true,
            allowedRoles: ['INDIVIDUAL'],
          },
        ],
      },
    ],
  },
  
  // 학생(INDIVIDUAL) 전용 - 마이페이지 (하위 메뉴)
  {
    key: 'individual-mypage-group',
    label: '마이페이지',
    icon: <UserSwitchOutlined />,
    enabled: true,
    allowedRoles: ['INDIVIDUAL'],
    children: [
      {
        key: 'individual-personal-info-group',
        label: '개인정보 관리',
        enabled: true,
        allowedRoles: ['INDIVIDUAL'],
        children: [
          {
            key: '/mypage/profile',
            label: '내 정보',
            enabled: true,
            allowedRoles: ['INDIVIDUAL'],
          },
          {
            key: '/mypage/instructor-auth',
            label: '강사 인증',
            enabled: true,
            allowedRoles: ['INDIVIDUAL'],
          },
        ],
      },
      {
        key: '/mypage/program-schedule',
        label: '내 프로그램 일정',
        enabled: true,
        allowedRoles: ['INDIVIDUAL'],
      },
      {
        key: '/mypage/documents',
        label: '서류 발급 이력',
        enabled: true,
        allowedRoles: ['INDIVIDUAL'],
      },
      {
        key: '/notices/inquiries/my',
        label: '내 문의 내역',
        enabled: true,
        allowedRoles: ['INDIVIDUAL'],
      },
    ],
  },
  
  // 학생(INDIVIDUAL) 전용 - 추가 메뉴
  {
    key: '/assignments',
    label: '과제',
    icon: <FileTextOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['INDIVIDUAL'],
  },
  {
    key: '/certificates',
    label: '수료증',
    icon: <FileOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['INDIVIDUAL'],
  },
  
  // 학교(SCHOOL) 전용 - 마이페이지 (하위 메뉴)
  {
    key: 'school-mypage-group',
    label: '마이페이지',
    icon: <UserSwitchOutlined />,
    enabled: true,
    allowedRoles: ['SCHOOL'],
    children: [
      {
        key: 'school-personal-info-group',
        label: '개인정보 관리',
        enabled: true,
        allowedRoles: ['SCHOOL'],
        children: [
          {
            key: '/mypage/profile',
            label: '내 정보',
            enabled: true,
            allowedRoles: ['SCHOOL'],
          },
          {
            key: '/mypage/school-auth',
            label: '학교(교사) 인증',
            enabled: true,
            allowedRoles: ['SCHOOL'],
          },
        ],
      },
      {
        key: '/mypage/program-schedule',
        label: '내 프로그램 일정',
        enabled: true,
        allowedRoles: ['SCHOOL'],
      },
      {
        key: '/mypage/documents',
        label: '서류 발급 이력',
        enabled: true,
        allowedRoles: ['SCHOOL'],
      },
      {
        key: '/notices/inquiries/my',
        label: '내 문의 내역',
        enabled: true,
        allowedRoles: ['SCHOOL'],
      },
    ],
  },
  {
    key: '/school/my-learning',
    label: '만족도설문',
    icon: <FileTextOutlined />,
    enabled: true,
    allowedRoles: ['SCHOOL'],
  },
  
  // 교사(SCHOOL) 전용 - 추가 메뉴
  {
    key: '/community',
    label: '커뮤니티',
    icon: <TeamOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['SCHOOL'],
  },
  {
    key: '/certificates-school',
    label: '수료증',
    icon: <FileOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['SCHOOL'],
  },
  
  // 강사(INSTRUCTOR) 전용 - 추가 메뉴
  {
    key: '/instructor/reports',
    label: '강의보고서',
    icon: <FileTextOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['INSTRUCTOR'],
  },
  {
    key: '/instructor/settlements',
    label: '강사비신청',
    icon: <FileTextOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['INSTRUCTOR'],
    children: [
      {
        key: '/settlements/my',
        label: '강사비 신청',
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
      },
    ],
  },
  {
    key: '/community-instructor',
    label: '커뮤니티',
    icon: <TeamOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['INSTRUCTOR'],
  },
  {
    key: '/instructor/certificates',
    label: '경력증명서',
    icon: <FileOutlined />,
    enabled: false,
    hidden: true,
    allowedRoles: ['INSTRUCTOR'],
  },
  */

  // legacy support paths (호환/리다이렉트 용도 - 메뉴에는 노출하지 않음)
  { key: '/posts', enabled: false, allowedRoles: ['ADMIN', 'INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'] },
  {
    key: '/posts/faq',
    enabled: false,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
  },
  {
    key: '/posts/inquiries',
    enabled: false,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
  },
  { key: '/posts/categories', enabled: false, allowedRoles: ['ADMIN'] },
  { key: '/posts/notices', enabled: false, allowedRoles: ['ADMIN'] },
  { key: 'divider-admin', type: 'divider', enabled: true, allowedRoles: ['ADMIN'] },

  // 관리자 영역
  {
    key: 'members-group',
    label: '회원 관리',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/users', label: '전체 회원', icon: <FolderOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/schools', label: '학교(교사) 회원', icon: <FolderOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/instructors', label: '강사단 관리', icon: <FolderOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
      {
        key: 'admin-group',
        label: '관리자',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['ADMIN'],
        children: [
          { key: '/admin/members', label: '관리자 회원', icon: <DotIcon />, enabled: true, allowedRoles: ['ADMIN'] },
          { key: '/admin/settings/permissions', label: '관리 권한 설정', icon: <DotIcon />, enabled: true, allowedRoles: ['ADMIN'] },
        ],
      },
    ],
  },
  // {
  //   key: 'applications-group',
  //   label: '신청 관리',
  //   icon: <FileTextOutlined />,
  //   enabled: true,
  //   allowedRoles: ['ADMIN'],
  //   children: [
  //     { key: '/applications', label: '신청 승인/반려', enabled: true, allowedRoles: ['ADMIN'] },
  //   ],
  // },
  // {
  //   key: 'instructors-group',
  //   label: '강사단 관리',
  //   icon: <UserOutlined />,
  //   enabled: true,
  //   allowedRoles: ['ADMIN'],
  //   children: [
  //     { key: '/instructors', label: '강사진', enabled: true, allowedRoles: ['ADMIN'] },
  //     { key: '/instructor-applications', label: '강의 신청 관리', enabled: true, allowedRoles: ['ADMIN'] },
  //     { key: '/matchings', label: '매칭 관리', enabled: true, allowedRoles: ['ADMIN'] },
  //     { key: '/settlements', label: '정산', enabled: true, allowedRoles: ['ADMIN'] },
  //     { key: '/settlements/payment-statements', label: '지급조서/이체리스트', enabled: true, allowedRoles: ['ADMIN'] },
  //   ],
  // },
  // {
  //   key: 'volunteers-group',
  //   label: '봉사단 관리',
  //   icon: <HeartOutlined />,
  //   enabled: true,
  //   allowedRoles: ['ADMIN'],
  //   children: [
  //     { key: '/volunteers', label: '봉사자', enabled: true, allowedRoles: ['ADMIN'] },
  //     { key: '/volunteers/programs', label: '봉사 프로그램', enabled: true, allowedRoles: ['ADMIN'] },
  //   ],
  // },
  // {
  //   key: 'admin-system-group',
  //   label: '시스템 관리',
  //   icon: <DatabaseOutlined />,
  //   enabled: true,
  //   allowedRoles: ['ADMIN'],
  //   children: [
  //     { key: '/admin/permission-requests', label: '권한 요청 관리', enabled: true, allowedRoles: ['ADMIN'] },
  //   ],
  // },
  {
    key: 'templates-group',
    label: '템플릿 관리',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      {
        key: 'program-forms-group',
        label: '프로그램 양식',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['ADMIN'],
        children: [
          {
            key: '/templates/program-forms/application',
            label: '신청 기본 폼',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/templates/program-forms/survey',
            label: '설문 조사',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/templates/program-forms/satisfaction',
            label: '만족도조사',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/templates/program-forms/assignment',
            label: '과제 제출 폼',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
        ],
      },
      {
        key: '/templates/file-forms',
        label: '파일 양식',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/templates/sms',
        label: '문자 양식',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/templates/email',
        label: '메일 관리',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/templates/banner',
        label: '배너 관리',
        icon: <FolderOutlined />,
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    key: 'posts-group',
    label: '게시글 관리',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/admin/posts/notices', label: '공지사항', icon: <FolderOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/admin/posts/faq', label: 'FAQ', icon: <FolderOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/admin/posts/inquiries', label: '문의하기', icon: <FolderOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
    ],
  },
  {
    key: '/sponsors',
    label: '후원사 관리',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
  },
  // { key: '/surveys', label: '설문 관리', icon: <FileTextOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  {
    key: '/education-records',
    label: '실적 관리',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
  },
  // { key: '/education-records-v2', label: '실적 통계 (v2)', icon: <BarChartOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  // { key: '/performance', label: '실적 통계', icon: <BarChartOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  {
    key: 'logs-group',
    label: '보안 설정(로그 관리)',
    icon: <FolderOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/logs/bug', label: '버그', icon: <FolderOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/logs/issue', label: '이슈', icon: <FolderOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
    ],
  },
  // {
  //   key: '/admin/settings/permissions',
  //   label: '시스템 설정',
  //   icon: <SettingOutlined />,
  //   enabled: true,
  //   allowedRoles: ['ADMIN'],
  //   // P2: 마스터 관리자만 접근 가능 (ProtectedRoute에서 체크)
  // },
  { key: 'divider-bottom', type: 'divider', enabled: true, allowedRoles: ['ADMIN'] },

  // 기타 (비활성)
  {
    key: '/application-paths',
    label: '신청 경로 관리',
    icon: <FileTextOutlined />,
    enabled: false,
    allowedRoles: ['ADMIN'],
  },
  {
    key: 'schedules-group',
    label: '일정 관리',
    icon: <CalendarOutlined />,
    enabled: false,
    children: [
      { key: '/schedules', label: '일정 캘린더', enabled: false },
      {
        key: '/schedules/my',
        label: '본인 일정 목록',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
      {
        key: '/schedules/my/calendar',
        label: '본인 일정 캘린더',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
      {
        key: '/schedule-negotiations',
        label: '일정 협의 관리',
        enabled: false,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    key: 'interviews-group',
    label: '면접 관리',
    icon: <TeamOutlined />,
    enabled: false,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
    children: [
      { key: '/interviews', label: '면접 관리', enabled: false, allowedRoles: ['ADMIN'] },
      {
        key: '/interviews/apply',
        label: '강사 신청',
        enabled: false,
        allowedRoles: ['INSTRUCTOR'],
      },
      {
        key: '/interviews/my',
        label: '내 면접 일정',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
    ],
  },
  {
    key: 'reports-group',
    label: '보고서',
    icon: <FileTextOutlined />,
    enabled: false,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
    children: [
      { key: '/reports', label: '보고서 관리', enabled: false, allowedRoles: ['ADMIN'] },
      {
        key: '/reports/new',
        label: '보고서 작성',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'],
      },
    ],
  },
]

/**
 * 권한별 메뉴 필터링
 *
 * 참고사항:
 * - 각 권한(INSTRUCTOR/INDIVIDUAL/SCHOOL)별로 완전히 분리된 메뉴 구조
 * - 공통 메뉴 없이 권한별로 독립적으로 관리
 * - allowedRoles로 접근 가능한 메뉴만 필터링하여 표시
 * - 인증 상태에 따라 메뉴 라벨이 동적으로 변경됨
 *
 * @param userRole 사용자 권한
 * @param items 메뉴 아이템 목록
 * @param user 사용자 정보 (인증 상태 확인용, 선택적)
 * @returns 필터링된 메뉴 아이템 목록
 */
export function filterMenuByRole(
  userRole: UserRole | null,
  items: MenuItemConfig[] = allMenuItems,
  user?: Omit<import('@/types/user').User, 'password'> | null,
  depth: number = 0
): MenuProps['items'] {
  if (!userRole) {
    // 로그인하지 않은 경우 빈 메뉴 반환
    return []
  }

  return items
    .filter(item => {
      if (item.type === 'divider') {
        return true
      }
      // Phase 0.1.5: hidden 처리된 메뉴는 완전히 제외
      if (item.hidden === true) {
        return false
      }
      // 비활성화된 메뉴는 제외
      if (item.enabled === false) {
        return false
      }
      // allowedRoles가 없으면 모든 권한 허용
      if (!item.allowedRoles || item.allowedRoles.length === 0) {
        return true
      }
      // allowedRoles에 사용자 권한이 포함되어 있는지 확인
      return item.allowedRoles.includes(userRole)
    })
    .map(item => {
      if (item.type === 'divider') {
        return { type: 'divider' as const }
      }

      // 1뎁스만 카테고리 아이콘 표시, 2뎁스 이상은 아이콘 제거
      const showIcon = depth === 0 && item.icon != null
      const menuItem: any = {
        key: item.key,
        label: item.label,
        icon: showIcon ? <CategoryIcon /> : undefined,
      }

      // 인증 상태에 따른 동적 메뉴 라벨 변경 (재귀적으로 모든 뎁스에서 적용)
      // 권한별 렌더링 확실히: 인증 상태에 따라 메뉴 라벨과 경로 동적 변경
      if (user) {
        // 학교(교사) 인증 / 교사 정보 (SCHOOL 권한에서만)
        // 케이스 1: 교사 인증이 안 되어있으면 "교사 인증"으로 메뉴 노출 + 진입 시 교사 인증 프로세스
        // 케이스 2: 인증된 교사인 경우, "교사 정보"로 메뉴 노출 + 진입 시 교사 정보 노출
        if (item.key === '/mypage/school-auth' || item.key === '/mypage/school-info') {
          if (user.schoolInfo) {
            // 인증된 교사: "교사 정보"로 표시
            menuItem.label = '교사 정보'
            menuItem.key = '/mypage/school-info'
          } else {
            // 인증 안 된 교사: "학교(교사) 인증"으로 표시
            menuItem.label = '학교(교사) 인증'
            menuItem.key = '/mypage/school-auth'
          }
        }

        // 강사 인증 / 강사 정보 (INSTRUCTOR, INDIVIDUAL 권한에서만)
        // 케이스 1: 강사 인증이 안 되어있으면 "강사 인증"으로 메뉴 노출 + 진입 시 강사 인증 프로세스
        // 케이스 2: 인증된 강사인 경우, "강사 정보"로 메뉴 노출 + 진입 시 강사 정보 노출
        if (item.key === '/mypage/instructor-auth' || item.key === '/mypage/instructor-info') {
          if (user.instructorId) {
            // 인증된 강사: "강사 정보"로 표시
            menuItem.label = '강사 정보'
            menuItem.key = '/mypage/instructor-info'
          } else {
            // 인증 안 된 강사: "강사 인증"으로 표시
            menuItem.label = '강사 인증'
            menuItem.key = '/mypage/instructor-auth'
          }
        }
      }

      // Phase 0.1.5: 자식 메뉴가 있는 경우 재귀적으로 필터링 (강화)
      // 재귀 호출 시 동적 라벨 변경도 함께 적용됨 (2뎁스 이상 아이콘 제거를 위해 depth 전달)
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByRole(userRole, item.children, user, depth + 1)
        if (filteredChildren && filteredChildren.length > 0) {
          menuItem.children = filteredChildren
        } else {
          // 자식 메뉴가 모두 필터링된 경우 부모 메뉴도 제거
          return null
        }
      }

      return menuItem
    })
    .filter(item => item !== null)
}

/**
 * 사용자 권한에 따라 필터링된 메뉴 아이템 반환
 * @param userRole 사용자 권한
 * @param user 사용자 정보 (인증 상태 확인용, 선택적)
 * @returns 필터링된 메뉴 아이템 목록
 */
export function getMenuItemsByRole(
  userRole: UserRole | null,
  user?: Omit<import('@/types/user').User, 'password'> | null
): MenuProps['items'] {
  return filterMenuByRole(userRole, allMenuItems, user)
}

/**
 * 메뉴 아이템에서 경로 찾기 (내부 유틸리티)
 * 특정 경로에 해당하는 모든 메뉴 설정 반환
 */
function findAllMenuItemsByPath(items: MenuItemConfig[], targetPath: string): MenuItemConfig[] {
  const matches: MenuItemConfig[] = []

  for (const item of items) {
    if (item.key === targetPath) {
      matches.push(item)
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.key === targetPath) {
          matches.push(child)
        }
        if (child.children) {
          for (const grandchild of child.children) {
            if (grandchild.key === targetPath) {
              matches.push(grandchild)
            }
          }
        }
      }
    }
  }
  return matches
}

/**
 * 특정 경로에 대한 접근 권한 확인
 * @param path 경로
 * @param userRole 사용자 권한
 * @returns 접근 가능 여부
 */
export function canAccessPath(path: string, userRole: UserRole | null): boolean {
  if (!userRole) {
    return false
  }

  // 경로 정규화 (끝에 있는 / 제거)
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '')

  // Phase 0.1.5: 관리자 레벨별 접근 제어
  if (userRole === 'ADMIN') {
    // MASTER 관리자는 모든 경로 접근 가능
    // 일반 관리자는 프로그램 ACL로 제어됨
    // 여기서는 기본적으로 접근 허용 (프로그램 ACL은 protected-route에서 체크)
    return true
  }

  // 역할별 내 학습 관리 경로는 항상 허용 (index 라우팅용)
  if (
    (userRole === 'INSTRUCTOR' && normalizedPath.startsWith('/instructor/schedule')) ||
    (userRole === 'INDIVIDUAL' && normalizedPath.startsWith('/schedules/my')) ||
    (userRole === 'SCHOOL' && normalizedPath === '/school/my-learning')
  ) {
    return true
  }

  // Phase 0.1.5: 개인(참여자) 및 학교는 정산 관련 경로 접근 불가
  if (
    (userRole === 'INDIVIDUAL' || userRole === 'SCHOOL') &&
    normalizedPath.startsWith('/settlements') &&
    !normalizedPath.startsWith('/settlements/my')
  ) {
    return false
  }

  const matches = findAllMenuItemsByPath(allMenuItems, normalizedPath)
  if (matches.length === 0) {
    // 메뉴에 없는 경로는 기본적으로 접근 가능 (기타 페이지)
    return true
  }

  // Phase 0.1.5: 매칭된 메뉴 중 하나라도 권한이 허용되면 접근 가능 (강화)
  return matches.some(menuItem => {
    // hidden 처리된 메뉴는 접근 불가
    if (menuItem.hidden === true) {
      return false
    }
    // 비활성화된 메뉴는 접근 불가
    if (menuItem.enabled === false) {
      return false
    }
    // allowedRoles가 없으면 모든 권한 허용
    if (!menuItem.allowedRoles || menuItem.allowedRoles.length === 0) {
      return true
    }
    // allowedRoles에 사용자 권한이 포함되어 있는지 확인
    return menuItem.allowedRoles.includes(userRole)
  })
}

/**
 * 현재 경로에 해당하는 카테고리명 가져오기
 * @param path 경로
 * @param depth 가져올 뎁스 (1: 1뎁스, 2: 2뎁스, 3: 3뎁스, 기본값: 자동 감지 - 가장 구체적인 뎁스)
 * @param userRole 사용자 권한 (선택적, 권한별 필터링용)
 * @param user 사용자 정보 (선택적, 동적 라벨 변경용)
 * @returns 카테고리명 (없으면 null)
 */
export function getCategoryNameByPath(
  path: string,
  depth?: number,
  userRole?: UserRole | null,
  user?: Omit<import('@/types/user').User, 'password'> | null
): string | null {
  // 경로 정규화
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '')

  // 내 학습 관리 리다이렉트 경로 특수 처리 (권한별 렌더링 확실히)
  // /my-learning은 역할별로 다른 경로로 리다이렉트되지만, 헤더 타이틀은 "내 학습 관리"로 통일
  // 모든 depth에서 우선적으로 처리하여 권한별 렌더링 확실히 보장
  if (userRole && userRole !== 'ADMIN') {
    if (
      (userRole === 'INSTRUCTOR' && normalizedPath.startsWith('/instructor/schedule')) ||
      (userRole === 'INDIVIDUAL' && normalizedPath.startsWith('/schedules/my')) ||
      (userRole === 'SCHOOL' && normalizedPath === '/school/my-learning')
    ) {
      // depth가 1뎁스로 요청된 경우 또는 depth가 없는 경우 "내 학습 관리" 반환
      // depth가 2뎁스 이상인 경우도 "내 학습 관리"를 반환하여 일관성 유지
      if (depth === 1 || depth === undefined) {
        return '내 학습 관리'
      }
      // depth가 2뎁스 이상인 경우도 "내 학습 관리" 반환 (권한별 렌더링 확실히)
      if (depth === 2 || depth === 3) {
        return '내 학습 관리'
      }
    }
  }

  // 사용자 권한이 제공된 경우, 권한별로 필터링된 메뉴에서 찾기
  const itemsToSearch = userRole
    ? filterMenuByRole(userRole, allMenuItems, user) || []
    : allMenuItems

  // 필터링된 메뉴 아이템을 MenuItemConfig 형태로 변환
  const filteredItems: MenuItemConfig[] = itemsToSearch
    .filter((item): item is MenuItemConfig => item !== null && 'key' in item)
    .map(item => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      children: item.children as MenuItemConfig[] | undefined,
      type: item.type as 'divider' | undefined,
      allowedRoles: undefined, // 이미 필터링됨
      hidden: false, // 이미 필터링됨
      enabled: true, // 이미 필터링됨
    }))

  // 모든 매칭 항목 찾기 (부모 정보 포함을 위해 로직 직접 구현)
  const matches: Array<{
    item: MenuItemConfig
    parent?: MenuItemConfig
    grandparent?: MenuItemConfig
    depth: number
  }> = []

  // 필터링된 메뉴에서 검색
  for (const item of filteredItems) {
    if (item.key === normalizedPath) {
      matches.push({ item, depth: 1 })
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.key === normalizedPath) {
          matches.push({ item: child, parent: item, depth: 2 })
        }
        if (child.children) {
          for (const grandchild of child.children) {
            if (grandchild.key === normalizedPath) {
              matches.push({ item: grandchild, parent: child, grandparent: item, depth: 3 })
            }
          }
        }
      }
    }
  }

  // 필터링된 메뉴에서 찾지 못한 경우, 원본 메뉴에서도 검색 (하위 호환성)
  if (matches.length === 0) {
    for (const item of allMenuItems) {
      if (item.key === normalizedPath) {
        matches.push({ item, depth: 1 })
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.key === normalizedPath) {
            matches.push({ item: child, parent: item, depth: 2 })
          }
          if (child.children) {
            for (const grandchild of child.children) {
              if (grandchild.key === normalizedPath) {
                matches.push({ item: grandchild, parent: child, grandparent: item, depth: 3 })
              }
            }
          }
        }
      }
    }
  }

  if (matches.length === 0) {
    return null
  }

  // 가장 구체적인 뎁스의 매칭 항목 사용 (3뎁스 > 2뎁스 > 1뎁스 순)
  const result = matches.sort((a, b) => b.depth - a.depth)[0]

  // depth가 지정되지 않았으면 해당 뎁스의 카테고리명 반환 (가장 구체적인 뎁스)
  if (depth === undefined) {
    return result.item.label || null
  }

  // depth에 따라 카테고리명 반환
  if (depth === 1) {
    // 1뎁스: 최상위 카테고리
    if (result.depth === 1) {
      return result.item.label || null
    } else if (result.depth === 2 && result.parent) {
      // 2뎁스 아이템의 경우, 1뎁스는 부모
      return result.parent.label || null
    } else if (result.depth === 3 && result.parent) {
      // 3뎁스 아이템의 경우, 1뎁스는 부모의 부모를 찾아야 함
      const searchItems = filteredItems.length > 0 ? filteredItems : allMenuItems
      for (const topLevel of searchItems) {
        if (
          topLevel.children?.some(child =>
            child.children?.some(grandchild => grandchild.key === result.item.key)
          )
        ) {
          return topLevel.label || null
        }
      }
    }
  } else if (depth === 2) {
    // 2뎁스: 중간 카테고리
    if (result.depth === 2) {
      // 2뎁스 아이템은 자기 자신이 2뎁스
      return result.item.label || null
    } else if (result.depth === 3 && result.parent) {
      // 3뎁스 아이템의 경우, 2뎁스는 부모
      return result.parent.label || null
    } else if (result.depth === 1) {
      // 1뎁스 아이템은 2뎁스가 없으므로 자기 자신 반환
      return result.item.label || null
    }
  } else if (depth === 3) {
    // 3뎁스: 최하위 카테고리
    if (result.depth === 3) {
      return result.item.label || null
    } else if (result.depth === 2) {
      // 2뎁스 아이템은 3뎁스가 없으므로 자기 자신 반환
      return result.item.label || null
    } else if (result.depth === 1) {
      // 1뎁스 아이템은 3뎁스가 없으므로 자기 자신 반환
      return result.item.label || null
    }
  }

  return result.item.label || null
}

/**
 * 브레드크럼 아이템 타입
 * path가 있으면 링크(클릭 시 이동), 없으면 현재 페이지 또는 그룹
 */
export interface BreadcrumbItem {
  label: string
  path?: string
}

type MatchResult = {
  item: MenuItemConfig
  parent?: MenuItemConfig
  grandparent?: MenuItemConfig
  depth: 1 | 2 | 3
}

/**
 * 권한별 필터링된 메뉴에서 경로 매칭 찾기
 * @param path 경로
 * @param items 검색할 메뉴 아이템 목록 (권한별 필터링된 메뉴)
 * @returns 매칭 결과 또는 null
 */
function findMenuMatchInItems(path: string, items: MenuItemConfig[]): MatchResult | null {
  const n = path === '/' ? path : path.replace(/\/$/, '')
  for (const item of items) {
    if (item.type === 'divider' || !item.label) continue
    if (item.key === n) return { item, depth: 1 }
    if (!item.children) continue
    for (const child of item.children) {
      if (child.type === 'divider' || !child.label) continue
      if (child.key === n) return { item: child, parent: item, depth: 2 }
      if (!child.children) continue
      for (const grandchild of child.children) {
        if (grandchild.type === 'divider' || !grandchild.label) continue
        if (grandchild.key === n)
          return { item: grandchild, parent: child, grandparent: item, depth: 3 }
      }
    }
  }
  return null
}

/**
 * 전체 메뉴에서 경로 매칭 찾기 (하위 호환성)
 * @param path 경로
 * @returns 매칭 결과 또는 null
 */
function findMenuMatch(path: string): MatchResult | null {
  return findMenuMatchInItems(path, allMenuItems)
}

function toBreadcrumbItem(menuItem: MenuItemConfig): BreadcrumbItem {
  const label = menuItem.label || ''
  const path =
    typeof menuItem.key === 'string' && menuItem.key.startsWith('/') ? menuItem.key : undefined
  return { label, path }
}

/**
 * 경로·역할에 따른 브레드크럼 체인 반환
 * 사이드바 메뉴 뎁스(1·2·3)를 브레드크럼으로 표현할 때 사용
 * 권한별 필터링된 메뉴에서 검색하여 올바른 breadcrumb 생성
 *
 * @param pathname 경로
 * @param userRole 사용자 권한
 * @param user 사용자 정보 (동적 라벨 변경용, 선택적)
 * @returns 브레드크럼 아이템 배열
 */
export function getBreadcrumbByPath(
  pathname: string,
  userRole: UserRole | null,
  user?: Omit<import('@/types/user').User, 'password'> | null
): BreadcrumbItem[] {
  const n = pathname === '/' ? pathname : pathname.replace(/\/$/, '')

  if (n === '/') {
    const label = userRole === 'ADMIN' ? '관리자 홈' : '메인 홈'
    return [{ label }]
  }

  // 내 학습 관리 리다이렉트 경로 특수 처리
  // /my-learning은 역할별로 다른 경로로 리다이렉트되지만, breadcrumb은 "내 학습 관리"로 통일
  if (userRole && userRole !== 'ADMIN') {
    if (
      (userRole === 'INSTRUCTOR' && n.startsWith('/instructor/schedule')) ||
      (userRole === 'INDIVIDUAL' && n.startsWith('/schedules/my')) ||
      (userRole === 'SCHOOL' && n === '/school/my-learning')
    ) {
      // 1뎁스 메뉴이므로 breadcrumb은 표시하지 않음 (AppBreadcrumb에서 length <= 1이면 null 반환)
      // 하지만 명시적으로 "내 학습 관리"만 반환하여 일관성 유지
      return [{ label: '내 학습 관리' }]
    }
  }

  // 권한별로 필터링된 메뉴에서 검색 (권한에 맞는 메뉴 구조 반영)
  const filteredMenuItems = userRole
    ? filterMenuByRole(userRole, allMenuItems, user) || []
    : allMenuItems

  // 필터링된 메뉴 아이템을 MenuItemConfig 형태로 변환
  const filteredItems: MenuItemConfig[] = filteredMenuItems
    .filter((item): item is MenuItemConfig => item !== null && 'key' in item)
    .map(item => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      children: item.children as MenuItemConfig[] | undefined,
      type: item.type as 'divider' | undefined,
      allowedRoles: undefined, // 이미 필터링됨
      hidden: false, // 이미 필터링됨
      enabled: true, // 이미 필터링됨
    }))

  // 권한별 필터링된 메뉴에서 매칭 찾기
  let match = findMenuMatchInItems(n, filteredItems)

  // 필터링된 메뉴에서 찾지 못한 경우, 원본 메뉴에서도 검색 (하위 호환성)
  if (!match) {
    match = findMenuMatch(n)
  }

  // 관리자: 교육 프로그램 하위 경로 (전체 프로그램 / 수강자 모집 / 수강 신청 현황) 브레드크럼
  if (!match && userRole === 'ADMIN' && (n === '/programs/education' || n.startsWith('/programs/education/'))) {
    const listMatch =
      findMenuMatchInItems('/programs/education', filteredItems) ||
      findMenuMatch('/programs/education')
    if (listMatch && listMatch.parent) {
      let thirdLabel: string
      if (n === '/programs/education' || n === '/programs/education/') {
        thirdLabel = '전체 프로그램'
      } else if (n === '/programs/education/student-recruitment') {
        thirdLabel = '수강자 모집'
      } else if (n === '/programs/education/instructor-recruitment') {
        thirdLabel = '강의 신청 현황'
      } else if (n === '/programs/education/enrollment') {
        thirdLabel = '수강 신청 현황'
      } else if (n === '/programs/education/schedule') {
        thirdLabel = '프로그램 일정'
      } else {
        thirdLabel = typeof listMatch.item.label === 'string' ? listMatch.item.label : '교육 프로그램'
      }
      return [
        toBreadcrumbItem(listMatch.parent),
        toBreadcrumbItem(listMatch.item),
        { label: thirdLabel },
      ]
    }
  }

  // 관리자: 프로그램 상세(/programs/:id) 또는 수정(/programs/:id/edit) 접근 시 브레드크럼 연동
  const programsReserved = ['my', 'favorites', 'volunteer', 'education', 'new', 'satisfaction']
  if (!match && userRole === 'ADMIN' && n.startsWith('/programs/')) {
    const rest = n.slice('/programs/'.length)
    const segments = rest.split('/').filter(Boolean)
    const firstSegment = segments[0]
    if (firstSegment && !programsReserved.includes(firstSegment)) {
      const listMatch =
        findMenuMatchInItems('/programs/education', filteredItems) ||
        findMenuMatch('/programs/education')
      if (listMatch && listMatch.depth === 3 && listMatch.parent && listMatch.grandparent) {
        const detailChain: BreadcrumbItem[] = [
          toBreadcrumbItem(listMatch.grandparent),
          toBreadcrumbItem(listMatch.parent),
          toBreadcrumbItem(listMatch.item),
        ]
        const isEdit = segments[1] === 'edit'
        detailChain.push({ label: isEdit ? '프로그램 수정' : '프로그램 상세' })
        return detailChain
      }
    }
  }

  if (!match) return []

  const chain: BreadcrumbItem[] = []
  if (match.depth === 1) {
    chain.push(toBreadcrumbItem(match.item))
  } else if (match.depth === 2 && match.parent) {
    chain.push(toBreadcrumbItem(match.parent))
    chain.push(toBreadcrumbItem(match.item))
  } else if (match.depth === 3 && match.parent && match.grandparent) {
    chain.push(toBreadcrumbItem(match.grandparent))
    chain.push(toBreadcrumbItem(match.parent))
    chain.push(toBreadcrumbItem(match.item))
  }
  // 현재 페이지(마지막 항목)는 링크 제거
  if (chain.length > 0) {
    const last = chain[chain.length - 1]
    chain[chain.length - 1] = { label: last.label }
  }
  return chain
}
