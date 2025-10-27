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

        {/* Montos - Uno al lado del otro, ancho limitado */}
        <XStack gap="$2" jc="center" flexWrap="wrap">
          <YStack width={140} gap="$1">
            <Text fontSize="$3" fontWeight="500">Apuesta Numero</Text>
            <Input
              value={amountNumero}
              onChangeText={setAmountNumero}
              keyboardType="decimal-pad"
              placeholder="0"
              ta="center"
              height={56}
              fontSize="$6"
            />
          </YStack>
          <YStack width={140} gap="$1">
            <Text fontSize="$3" fontWeight="500">Apuesta Reventado</Text>
            <Input
              value={amountReventado}
              onChangeText={setAmountReventado}
              keyboardType="decimal-pad"
              placeholder="0"
              ta="center"
              height={56}
              fontSize="$6"
              editable={!!amountNumero}
              opacity={amountNumero ? 1 : 0.5}
            />
          </YStack>
        </XStack>

        {/* Captura de números - Limpio */}
        <YStack gap="$2">
          <XStack gap="$2" ai="flex-end" jc="center">
            <YStack width={140}>
              <Text fontSize="$3" fontWeight="500" mb="$1">Números</Text>
              <Input
                value={numInput}
                onChangeText={(v) => {
                  const s = sanitizeNumber2(v)
                  setNumInput(s)
                  if (s.length === 2) {
                    setErrors('')
                    setNumbers((prev) => (prev.includes(s) ? prev : [...prev, s]))
                    setNumInput('')
                  }
                }}
                placeholder="00-99"
                maxLength={2}
                keyboardType="number-pad"
                height={56}
                fontSize="$6"
                ta="center"
                editable={!!amountNumero}
                opacity={amountNumero ? 1 : 0.5}
                onKeyPress={(e: any) => {
                  if (e?.nativeEvent?.key === 'Enter' && numInput.length === 2) addNumber()
                }}
              />
            </YStack>
            <Button size="$3" variant="ghost" onPress={() => setNumbers([])} disabled={numbers.length === 0}>Limpiar</Button>
          </XStack>
          {errors ? <Text color="$error" fontSize="$2">{errors}</Text> : null}

          {/* Lista de números - Sin X, solo click para eliminar */}
          {numbers.length > 0 && (
            <XStack gap="$2" flexWrap="wrap" mt="$2" jc="center">
              {numbers.map((n) => (
                <Card
                  key={n}
                  px="$3"
                  py="$2"
                  br="$2"
                  bw={1}
                  bc="$borderColor"
                  bg="$backgroundHover"
                  cursor="pointer"
                  hoverStyle={{ backgroundColor: '$primary', borderColor: '$primary' }}
                  onPress={() => removeNumber(n)}
                >
                  <Text fontWeight="700" fontSize="$4">{n}</Text>
                </Card>
              ))}
            </XStack>
          )}
        </YStack>

        <XStack jc="center">
          <Button onPress={commit} disabled={!canCommit} size="$4" width={280}>
            Agregar al ticket
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
