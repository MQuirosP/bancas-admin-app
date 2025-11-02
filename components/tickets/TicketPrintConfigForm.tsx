// components/tickets/TicketPrintConfigForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Switch, Card, TextArea } from 'tamagui'
import { Button, Input, Select } from '@/components/ui'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { formatPhoneCR } from '@/utils/format/phone'
import { z } from 'zod'
import { ChevronDown } from '@tamagui/lucide-icons'
import TicketReceipt from './TicketReceipt'

export type TicketPrintConfigValues = {
  printName?: string | null
  printPhone?: string | null
  printWidth?: number | null
  printFooter?: string | null
  printBarcode?: boolean | null
}

type Props = {
  value: TicketPrintConfigValues | null
  readOnly?: boolean
  loading?: boolean
  onSave?: (v: TicketPrintConfigValues) => void
  onCancel?: () => void
  onChange?: (v: TicketPrintConfigValues) => void
}

const configSchema = z.object({
  printName: z.string().trim().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')).transform(v => (v?.trim() ? v : null)),
  printPhone: z.string().trim().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')).transform(v => (v?.trim() ? v : null))
    .refine(v => !v || /^\(\d{3}\)\s?\d{4}-\d{4}$/.test(v), 'Formato de teléfono inválido'),
  printWidth: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return null
      const num = Number(v)
      return isNaN(num) ? null : num
    },
    z.union([z.literal(58), z.literal(88), z.null()]).optional()
  ),
  printFooter: z.string().trim().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')).transform(v => (v?.trim() ? v : null)),
  printBarcode: z.boolean().nullable().optional(),
})

export default function TicketPrintConfigForm({ value, readOnly, loading, onSave, onCancel, onChange }: Props) {
  const initial = useMemo(() => value ?? {
    printName: null,
    printPhone: null,
    printWidth: null,
    printFooter: null,
    printBarcode: null,
  }, [
    value?.printName,
    value?.printPhone,
    value?.printWidth,
    value?.printFooter,
    value?.printBarcode,
  ])

  const [values, setValues] = useState<{
    printName: string
    printPhone: string
    printWidth: string
    printFooter: string
    printBarcode: boolean
  }>(() => ({
    printName: initial.printName ?? '',
    printPhone: initial.printPhone ?? '',
    printWidth: initial.printWidth != null ? String(initial.printWidth) : '',
    printFooter: initial.printFooter ?? '',
    printBarcode: initial.printBarcode ?? false,
  }))

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setValues({
      printName: initial.printName ?? '',
      printPhone: initial.printPhone ?? '',
      printWidth: initial.printWidth != null ? String(initial.printWidth) : '',
      printFooter: initial.printFooter ?? '',
      printBarcode: initial.printBarcode ?? false,
    })
    setErrors({})
  }, [initial])

  const setField = <K extends keyof typeof values>(key: K, val: typeof values[K]) =>
    setValues((s) => ({ ...s, [key]: val }))

  const dirty = useMemo(() => {
    return JSON.stringify({
      printName: values.printName || null,
      printPhone: values.printPhone || null,
      printWidth: values.printWidth ? Number(values.printWidth) : null,
      printFooter: values.printFooter || null,
      printBarcode: values.printBarcode,
    }) !== JSON.stringify(initial)
  }, [values, initial])

  const handleSave = () => {
    setErrors({})

    const raw = {
      printName: values.printName,
      printPhone: values.printPhone,
      printWidth: values.printWidth,
      printFooter: values.printFooter,
      printBarcode: values.printBarcode,
    }

    const parsed = configSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((i) => {
        const k = i.path[0]?.toString?.()
        if (k) fieldErrors[k] = i.message
      })
      setErrors(fieldErrors)
      return
    }

    const payload: TicketPrintConfigValues = {
      printName: parsed.data.printName ?? null,
      printPhone: parsed.data.printPhone ?? null,
      printWidth: parsed.data.printWidth ?? null,
      printFooter: parsed.data.printFooter ?? null,
      printBarcode: parsed.data.printBarcode ?? null,
    }

    onSave?.(payload)
  }

  const handleCancel = () => {
    setValues({
      printName: initial.printName ?? '',
      printPhone: initial.printPhone ?? '',
      printWidth: initial.printWidth != null ? String(initial.printWidth) : '',
      printFooter: initial.printFooter ?? '',
      printBarcode: initial.printBarcode ?? false,
    })
    setErrors({})
    onCancel?.()
  }

  // Notificar cambios al padre
  useEffect(() => {
    const raw = {
      printName: values.printName,
      printPhone: values.printPhone,
      printWidth: values.printWidth,
      printFooter: values.printFooter,
      printBarcode: values.printBarcode,
    }
    const parsed = configSchema.safeParse(raw)
    if (parsed.success && onChange) {
      onChange({
        printName: parsed.data.printName ?? null,
        printPhone: parsed.data.printPhone ?? null,
        printWidth: parsed.data.printWidth ?? null,
        printFooter: parsed.data.printFooter ?? null,
        printBarcode: parsed.data.printBarcode ?? null,
      })
    }
  }, [values, onChange])

  return (
    <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
      <YStack gap="$4">
        <Text fontSize="$5" fontWeight="600">Configuración de Impresión de Tiquetes</Text>

        <XStack gap="$4" ai="flex-start" $sm={{ flexDirection: 'column', ai: 'stretch' }}>
          {/* Formulario */}
          <YStack flex={1} minWidth={380} maxWidth={480} gap="$3" $sm={{ minWidth: 'auto', maxWidth: 'none', width: '100%' }}>
            <FieldGroup>
              <FieldLabel>Nombre Tiempos</FieldLabel>
              <Input
                disabled={!!readOnly}
                value={values.printName}
                onChangeText={(t) => setField('printName', t)}
                placeholder="Nombre para mostrar en tiquete"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.printName} />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Teléfono</FieldLabel>
              <Input
                disabled={!!readOnly}
                value={values.printPhone}
                onChangeText={(t) => setField('printPhone', formatPhoneCR(t))}
                placeholder="(506) 8888-8888"
                keyboardType="phone-pad"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.printPhone} />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Ancho de Papel</FieldLabel>
              <Select
                value={values.printWidth}
                onValueChange={(val) => setField('printWidth', val)}
                disabled={!!readOnly}
              >
                <Select.Trigger
                  bw={1}
                  bc="$borderColor"
                  backgroundColor="$background"
                  px="$3"
                  iconAfter={ChevronDown}
                  disabled={!!readOnly}
                >
                  <Select.Value placeholder="Selecciona ancho de papel" />
                </Select.Trigger>
                <Select.Content zIndex={1_000_000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Item index={0} value="58" pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                      <Select.ItemText>58mm</Select.ItemText>
                    </Select.Item>
                    <Select.Item index={1} value="88" pressStyle={{ bg: '$backgroundHover' }} bw={0} px="$3">
                      <Select.ItemText>88mm</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
              <FieldError message={errors.printWidth} />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Pie de Ticket</FieldLabel>
              <TextArea
                disabled={!!readOnly}
                value={values.printFooter}
                onChangeText={(t) => setField('printFooter', t)}
                placeholder="Texto adicional para mostrar en el ticket"
                rows={5}
                maxLength={200}
                bw={1}
                bc={errors.printFooter ? '$red8' : '$borderColor'}
                backgroundColor="$background"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.printFooter} />
            </FieldGroup>

            <XStack ai="center" gap="$3">
              <Text fontSize="$4">Imprimir código de barras</Text>
              <Switch
                size="$2"
                checked={values.printBarcode}
                onCheckedChange={(val) => setField('printBarcode', !!val)}
                disabled={!!readOnly || loading}
                bw={1}
                bc="$borderColor"
                bg={values.printBarcode ? '$color10' : '$background'}
                hoverStyle={{ bg: values.printBarcode ? '$color10' : '$backgroundHover' }}
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
              >
                <Switch.Thumb
                  animation="quick"
                  bg="$color12"
                  shadowColor="$shadowColor"
                  shadowRadius={6}
                  shadowOffset={{ width: 0, height: 2 }}
                />
              </Switch>
            </XStack>
          </YStack>

          {/* Vista previa del ticket */}
          <YStack flex={1} minWidth={280} maxWidth={360} gap="$2" $sm={{ minWidth: 'auto', maxWidth: 'none', width: '100%' }}>
            <Text fontSize="$4" fontWeight="600">Vista Previa del Ticket</Text>
            <Card padding="$2" bg="$background" borderColor="$borderColor" borderWidth={1}>
              <YStack ai="center" gap="$2">
                {useMemo(() => {
                  // Generar número de tiquete de ejemplo: T251031-00001R-63
                  const now = new Date()
                  const year = String(now.getFullYear()).slice(-2)
                  const month = String(now.getMonth() + 1).padStart(2, '0')
                  const day = String(now.getDate()).padStart(2, '0')
                  const datePart = `${year}${month}${day}`
                  const sequence = '00001'.padStart(5, '0')
                  const verifier = '63'
                  const ticketNumber = `T${datePart}-${sequence}R-${verifier}`

                  const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0)

                  return (
                    <TicketReceipt
                      ticket={{
                        id: 'preview',
                        ticketNumber: ticketNumber,
                        loteria: { 
                          name: 'TICA',
                          rulesJson: { baseMultiplierX: 85 }
                        },
                        sorteo: {
                          name: 'TICA 7:00 PM',
                          scheduledAt: scheduledTime.toISOString(),
                        },
                        vendedor: {
                          name: values.printName || '<Vendedor>',
                          code: 'YV-698',
                          phone: values.printPhone || '8888-8888',
                          printName: values.printName || null,
                          printPhone: values.printPhone || null,
                          printWidth: values.printWidth ? Number(values.printWidth) : null,
                          printFooter: values.printFooter || null,
                          printBarcode: values.printBarcode ?? true,
                        },
                        clienteNombre: 'Nombre Cliente',
                        createdAt: now.toISOString(),
                        jugadas: [
                          { type: 'NUMERO' as const, number: '34', amount: 200000 },
                          { type: 'NUMERO' as const, number: '38', amount: 50800 },
                          { type: 'NUMERO' as const, number: '32', amount: 8400 },
                          { type: 'NUMERO' as const, number: '74', amount: 1100 },
                          { type: 'NUMERO' as const, number: '99', amount: 200 },
                          { type: 'NUMERO' as const, number: '55', amount: 200 },
                          { type: 'NUMERO' as const, number: '44', amount: 200 },
                          { type: 'REVENTADO' as const, reventadoNumber: '74', amount: 600 },
                        ],
                        totalAmount: 261500,
                      }}
                      widthPx={values.printWidth ? (Number(values.printWidth) === 88 ? 340 : 220) : 220}
                    />
                  )
                }, [values.printName, values.printPhone, values.printWidth, values.printFooter, values.printBarcode])}
              </YStack>
            </Card>
          </YStack>
        </XStack>

        <XStack gap="$2" jc="flex-end" flexWrap="wrap">
          <Button variant="secondary" onPress={handleCancel} disabled={loading || !dirty}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={!!readOnly || loading || !dirty}
            loading={!!loading}
          >
            Guardar
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}

