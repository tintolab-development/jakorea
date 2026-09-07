import type { NavigateFunction } from 'react-router-dom'
import type { MypageLnbItemKey } from '../model/types'
import {
  MYPAGE_EDUCATION_PATH,
  MYPAGE_INQUIRIES_PATH,
  MYPAGE_PATH,
  MYPAGE_VOLUNTEER_PATH,
} from './constants'

export function navigateMypageLnb(navigate: NavigateFunction, key: MypageLnbItemKey) {
  switch (key) {
    case 'home':
      navigate(MYPAGE_PATH)
      return
    case 'education':
      navigate(MYPAGE_EDUCATION_PATH)
      return
    case 'volunteer':
      navigate(MYPAGE_VOLUNTEER_PATH)
      return
    case 'inquiries':
      navigate(MYPAGE_INQUIRIES_PATH)
      return
    default:
      return
  }
}
