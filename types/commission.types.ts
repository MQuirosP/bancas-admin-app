export type BetType = 'NUMERO' | 'REVENTADO'

export interface CommissionRule {
  id?: string
  loteriaId: string | null
  betType: BetType | null
  multiplierRange: { min: number; max: number }
  percent: number
}

export interface CommissionPolicyV1 {
  version: 1
  effectiveFrom: string | null
  effectiveTo: string | null
  defaultPercent: number
  rules: CommissionRule[]
}

export type CommissionPolicy = CommissionPolicyV1 | null

