export function isGuardianProfileValid(input: {
  name: string
  phone: string
  relationship: string
}) {
  return (
    input.name.trim().length > 0 &&
    input.phone.replace(/\D/g, '').length >= 10 &&
    input.relationship.trim().length > 0
  )
}
