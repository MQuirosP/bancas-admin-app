import { z } from 'zod'
import type { CommissionPolicyV1 } from '@/types/commission.types'

const isoOrNull = z.string().datetime().or(z.null())

export const CommissionRuleSchema = z.object({
  id: z.string().trim().min(1).optional(),
  loteriaId: z.string().uuid().or(z.null()),
  betType: z.enum(['NUMERO', 'REVENTADO']).or(z.null()),
  multiplierRange: z.object({
    min: z.number(),
    max: z.number()
  }).refine(v => v.min <= v.max, { message: 'min debe ser <= max', path: ['min'] }),
  percent: z.number().min(0).max(100),
})

export const CommissionPolicyV1Schema = z.object({
  version: z.literal(1),
  effectiveFrom: isoOrNull,
  effectiveTo: isoOrNull,
  defaultPercent: z.number().min(0).max(100),
  rules: z.array(CommissionRuleSchema)
}).refine(
  (v) => {
    if (v.effectiveFrom && v.effectiveTo) {
      return new Date(v.effectiveFrom) <= new Date(v.effectiveTo)
    }
    return true
  },
  { message: 'effectiveFrom debe ser <= effectiveTo', path: ['effectiveFrom'] }
)

export type CommissionPolicyV1Input = z.input<typeof CommissionPolicyV1Schema>
export type CommissionPolicyV1Output = z.output<typeof CommissionPolicyV1Schema>

export const EmptyPolicy: CommissionPolicyV1 = {
  version: 1,
  effectiveFrom: null,
  effectiveTo: null,
  defaultPercent: 0,
  rules: [],
}
