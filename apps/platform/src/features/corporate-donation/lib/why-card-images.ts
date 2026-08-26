import type { WhyCardId } from './constants'
import whyImage01Url from '../image/why-image-01.png'
import whyImage02Url from '../image/why-image-02.png'
import whyImage03Url from '../image/why-image-03.png'

export const WHY_CARD_IMAGE_URLS: Record<WhyCardId, string> = {
  global_expansion: whyImage01Url,
  transparent_ops: whyImage02Url,
  verified_impact: whyImage03Url,
}
