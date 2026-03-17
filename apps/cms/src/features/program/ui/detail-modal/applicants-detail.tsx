import type { ApplicantChildKey } from './detail-modal-sidebar'

export interface ApplicantDetailsProps {
  menu: ApplicantChildKey | ''
}

export function ApplicantDetails({ menu }: ApplicantDetailsProps) {
  return (
    <>
      {menu === 'institutions' && <div>institutions</div>}
      {menu === 'instructors' && <div>instructors</div>}
      {menu === 'volunteers' && <div>volunteers</div>}
    </>
  )
}
