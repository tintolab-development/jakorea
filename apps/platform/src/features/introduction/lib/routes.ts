import { INTRODUCTION_PATH } from './constants'

export function isIntroductionPath(pathname: string) {
  return pathname === INTRODUCTION_PATH || pathname.startsWith(`${INTRODUCTION_PATH}/`)
}
