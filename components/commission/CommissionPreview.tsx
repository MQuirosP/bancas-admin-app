import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { Button, Input, Select, DatePicker } from '@/components/ui'
import type { CommissionPolicyV1, BetType } from '@/types/commission.types'
import { formatCurrency } from '@/utils/formatters'
import { useLoterias } from '@/hooks/useLoterias'

type Props = {
  policy: CommissionPolicyV1 | null
}

export const CommissionPreview: React.FC<Props> = ({ policy }) => {
  const [amount, setAmount] = useState<string>('1000')
  const [betType, setBetType] = useState<BetType>('NUMERO')
  const [multiplier, setMultiplier] = useState<string>('90')
  const [loteriaId, setLoteriaId] = useState<string>('')
  const [nowDate, setNowDate] = useState<Date | null>(null)
  const { data: lotResp } = useLoterias({ page: 1, pageSize: 100 })

  const now = useMemo(() => (nowDate ? nowDate : new Date()), [nowDate])

  const result = useMemo(() => {
    const amt = Number(amount) || 0
    const mult = Number(multiplier)
    if (!policy || !loteriaId) {
      return { percent: 0, commissionAmount: 0, source: 'USER' as const }
    }

    // vigencia
    const effFromOk = !policy.effectiveFrom || now >= new Date(policy.effectiveFrom)
    const effToOk = !policy.effectiveTo || now <= new Date(policy.effectiveTo)
    const inWindow = effFromOk && effToOk

    let percent = policy.defaultPercent ?? 0
    if (inWindow) {
      const match = (policy.rules ?? []).find(r => {
        const loteriaOk = r.loteriaId == null || r.loteriaId === loteriaId
        const betOk = r.betType == null || r.betType === betType
        const range = r.multiplierRange || { min: -Infinity, max: Infinity }
        const rangeOk = mult >= range.min && mult <= range.max
        return loteriaOk && betOk && rangeOk
      })
      if (match) percent = match.percent
    }

    const commissionAmount = amt * (percent / 100)
    return { percent, commissionAmount, source: 'USER' as const }
  }, [policy, amount, betType, multiplier, loteriaId, now])

  return (
    <Card padding="$3" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600">Probar política (simulación local)</Text>
        <XStack gap="$2" flexWrap="wrap">
          <YStack minWidth={140} gap="$1">
            <Text fontSize="$3">Monto</Text>
            <Input value={amount} onChangeText={setAmount} keyboardType="number-pad" />
          </YStack>
          <YStack minWidth={160} gap="$1">
            <Text fontSize="$3">Tipo apuesta</Text>
            <Select value={betType} onValueChange={(v:any)=>setBetType(v)}>
              <Select.Trigger bw={1} bc="$borderColor" bg="$background" px="$3">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Viewport>
                  {(['NUMERO','REVENTADO'] as const).map((bt,idx)=> (
                    <Select.Item key={bt} value={bt} index={idx}><Select.ItemText>{bt}</Select.ItemText></Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select>
          </YStack>
          <YStack minWidth={160} gap="$1">
            <Text fontSize="$3">Multiplicador final (X)</Text>
            <Input value={multiplier} onChangeText={setMultiplier} keyboardType="number-pad" />
          </YStack>
          <YStack minWidth={220} gap="$1">
            <Text fontSize="$3">Lotería (obligatorio)</Text>
            <Select value={loteriaId} onValueChange={setLoteriaId}>
              <Select.Trigger bw={1} bc="$borderColor" bg="$background" px="$3">
                <Select.Value placeholder="Selecciona lotería" />
              </Select.Trigger>
              <Select.Content>
                <Select.Viewport>
                  {(lotResp?.data ?? []).map((l, idx) => (
                    <Select.Item key={l.id} value={l.id} index={idx}><Select.ItemText>{l.name}</Select.ItemText></Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select>
          </YStack>
          <YStack minWidth={220} gap="$1">
            <Text fontSize="$3">Fecha (opcional)</Text>
            <DatePicker value={nowDate} onChange={setNowDate} mode="datetime" placeholder="yyyy-mm-dd hh:mm" />
          </YStack>
        </XStack>

        <Card p="$3" bg="$background" bw={1} bc="$borderColor">
          <Text>Resultado simulado (local):</Text>
          <Text>Percent: {result.percent.toFixed(2)}%</Text>
          <Text>Comisión: {formatCurrency(result.commissionAmount)}</Text>
          <Text color="$textSecondary">Nota: Este resultado es una estimación para fines informativos.</Text>
        </Card>

        <Text color="$textSecondary">El cálculo real se aplicará automáticamente al registrar una jugada.</Text>
      </YStack>
    </Card>
  )
}

export default CommissionPreview


