export function isGeminiTrainingProgramType(programType?: string | null): boolean {
  const type = (programType ?? '').trim().toUpperCase()
  return type === 'GEMINI_TRAINING' || type === 'GEMINI' || type === 'VISITING_TRAINING'
}

export function isGeminiTrainingProgram(program?: {
  programType?: string | null
  detailCase?: string | null
} | null): boolean {
  if (!program) return false
  if (program.detailCase === 'gemini') return true
  return isGeminiTrainingProgramType(program.programType)
}
