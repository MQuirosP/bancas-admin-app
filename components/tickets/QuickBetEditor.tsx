import React, { useCallback, useMemo, useState } from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { Button, Input } from '@/components/ui'

export type QuickGroup = {
  numbers: string[]
  amountNumero: number
  amountReventado?: number
}

export type QuickBetEditorProps = {
  onCommit: (group: QuickGroup) => void
  minAmount?: number
  maxAmount?: number
}

const sanitizeNumber2 = (val: string) => val.replace(/\D/g, '').slice(0, 2)

export default function QuickBetEditor({ onCommit, minAmount = 1, maxAmount = 10_000_000 }: QuickBetEditorProps) {
  const [amountNumero, setAmountNumero] = useState('')
  const [amountReventado, setAmountReventado] = useState('')
  const [numInput, setNumInput] = useState('')
  const [numbers, setNumbers] = useState<string[]>([])
  const [errors, setErrors] = useState<string>('')

  const canCommit = useMemo(() => {
    const aN = Number(amountNumero)
    const aR = amountReventado ? Number(amountReventado) : 0
    if (!Number.isFinite(aN) || aN < minAmount || aN > maxAmount) return false
    if (aR) {
      if (!Number.isFinite(aR) || aR < minAmount || aR > maxAmount) return false
    }
    return numbers.length > 0
  }, [amountNumero, amountReventado, numbers, minAmount, maxAmount])

  const addNumber = useCallback(() => {
    const s = sanitizeNumber2(numInput)
    if (s.length !== 2) {
      setErrors('Ingresa un número de dos dígitos')
      return
    }
    setErrors('')
    setNumbers((prev) => (prev.includes(s) ? prev : [...prev, s]))
    setNumInput('')
  }, [numInput])

  const removeNumber = useCallback((n: string) => {
    setNumbers((prev) => prev.filter((x) => x !== n))
  }, [])

  const commit = useCallback(() => {
    const aN = Number(amountNumero)
    const aR = amountReventado ? Number(amountReventado) : undefined
    if (!canCommit) return
    onCommit({ numbers, amountNumero: aN, amountReventado: aR })
    // limpiar para siguiente serie
    setNumbers([])
    setAmountNumero('')
    setAmountReventado('')
    setErrors('')
  }, [numbers, amountNumero, amountReventado, onCommit, canCommit])

  return (
    <Card padding="$4" backgroundColor="$background" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$3">
        <Text fontSize="$5" fontWeight="600">Ingreso rápido</Text>

        {/* Montos - Responsive: centrado y juntos en mobile */}
        <XStack gap="$2" flexWrap="wrap" $sm={{ gap: '$2', jc: 'center' }} jc="flex-start">
          <YStack flex={1} minWidth={140} maxWidth={180} gap="$1">
            <Text fontSize="$3" ta="center">Apuesta Numero</Text>
            <Input
              value={amountNumero}
              onChangeText={setAmountNumero}
              keyboardType="decimal-pad"
              placeholder="0"
              ta="center"
            />
          </YStack>
          <YStack flex={1} minWidth={140} maxWidth={180} gap="$1">
            <Text fontSize="$3" ta="center">Apuesta Reventado</Text>
            <Input
              value={amountReventado}
              onChangeText={setAmountReventado}
              keyboardType="decimal-pad"
              placeholder="0"
              ta="center"
            />
          </YStack>
        </XStack>

        {/* Captura de números */}
        <YStack gap="$2">
          <Text fontSize="$3">Números (dos dígitos). Se agregan automáticamente al completar 2 dígitos.</Text>
          <XStack gap="$2" ai="center" flexWrap="wrap">
            <Input
              value={numInput}
              onChangeText={(v) => {
                const s = sanitizeNumber2(v)
                setNumInput(s)
                if (s.length === 2) {
                  // auto-agregar al completar 2 dígitos
                  setErrors('')
                  setNumbers((prev) => (prev.includes(s) ? prev : [...prev, s]))
                  setNumInput('')
                }
              }}
              placeholder="00-99"
              maxLength={2}
              keyboardType="number-pad"
              width={110}
              onKeyPress={(e: any) => {
                if (e?.nativeEvent?.key === 'Enter' && numInput.length === 2) addNumber()
              }}
            />
            <Button size="$3" variant="ghost" onPress={() => setNumbers([])}>Limpiar lista</Button>
          </XStack>
          {errors ? <Text color="$error" fontSize="$2">{errors}</Text> : null}

          {/* Lista de números */}
          {numbers.length > 0 && (
            <XStack gap="$2" flexWrap="wrap">
              {numbers.map((n) => (
                <Card key={n} px="$2" py="$1" br="$2" bw={1} bc="$borderColor" bg="$backgroundHover">
                  <XStack ai="center" gap="$2">
                    <Text fontWeight="700">{n}</Text>
                    <Button size="$2" variant="ghost" onPress={() => removeNumber(n)}>x</Button>
                  </XStack>
                </Card>
              ))}
            </XStack>
          )}
        </YStack>

        <XStack gap="$2">
          <Button onPress={commit} disabled={!canCommit}>Agregar al ticket</Button>
        </XStack>
      </YStack>
    </Card>
  )
}
