// components/loterias/LoteriaRulesInline.tsx
import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  YStack, XStack, Text, Input, Button, Card, Separator, Label, Checkbox, Select,
} from 'tamagui'
import { ChevronDown, Check } from '@tamagui/lucide-icons'
import type { LoteriaRulesJson, Weekday } from '@/types/loteriaRules'
import { toWeekdays } from '@/types/loteriaRules'
import TimeInput from '@/components/loterias/TimeInput'
import TimeListEditor from '@/components/loterias/TimeListEditor'
import WeekdaySelector from '@/components/loterias/WeekdaySelector'
import VisualPicker from '@/components/loterias/VisualPicker'
import FilterSwitch from '@/components/ui/FilterSwitch'
import { useMultipliersQuery } from '@/hooks/useMultipliersCrud'

const RulesJsonSchema = z.object({
  closingTimeBeforeDraw: z.coerce.number().min(0).max(180).optional(),
  minBetAmount: z.coerce.number().min(0).optional(),
  maxBetAmount: z.coerce.number().min(0).optional(),
  maxNumbersPerTicket: z.coerce.number().min(1).max(999).optional(),
  numberRange: z.object({
    min: z.coerce.number().min(0),
    max: z.coerce.number().min(0),
  }).refine(v => v.max >= v.min, { message: 'max debe ser >= min' }).optional(),
  allowedBetTypes: z.array(z.enum(['NUMERO','REVENTADO'])).optional(),
  reventadoConfig: z.object({
    enabled: z.boolean(),
    allowedMultiplierIds: z.array(z.string()).optional(),
  }).optional(),
  drawSchedule: z.object({
    frequency: z.enum(['diario','semanal','personalizado']),
    times: z.array(z.string()).optional(),
    daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).optional(),
  }).optional(),
  autoCreateSorteos: z.boolean().optional(),
  display: z.object({
    color: z.string().optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    featured: z.boolean().optional(),
  }).optional(),
  baseMultiplierX: z.coerce.number().positive().optional(),
  salesHours: z.any().optional(),
}).partial().passthrough()

type FormShape = z.infer<typeof RulesJsonSchema>

const dayDefs = [
  { key:'sunday', label:'Domingo' },
  { key:'monday', label:'Lunes' },
  { key:'tuesday', label:'Martes' },
  { key:'wednesday', label:'Miércoles' },
  { key:'thursday', label:'Jueves' },
  { key:'friday', label:'Viernes' },
  { key:'saturday', label:'Sábado' },
] as const

export default function LoteriaRulesInline({
  loteriaId,
  value,
  onChange,
  submitLabel = 'Aplicar',
  persistHint,
}: {
  loteriaId?: string
  value: LoteriaRulesJson
  onChange: (rules: LoteriaRulesJson) => void
  submitLabel?: string
  /** Texto debajo del botón (ej: "Se guardan al actualizar la lotería") */
  persistHint?: string
}) {
  const defaultValues: FormShape = {
    ...value,
    drawSchedule: {
      frequency: value?.drawSchedule?.frequency ?? 'diario',
      times: value?.drawSchedule?.times ?? [],
      daysOfWeek: (value?.drawSchedule?.daysOfWeek as number[] | undefined) ?? [1,2,3,4,5,6,0],
    },
  }

  const { control, handleSubmit, watch, reset } = useForm<FormShape>({
    resolver: zodResolver(RulesJsonSchema),
    defaultValues,
    mode: 'onBlur',
  })

  // Resetear formulario cuando value cambia (cargar datos de lotería existente)
  useEffect(() => {
    reset(defaultValues)
  }, [value, reset])

  // Cargar multiplicadores de la lotería
  const { data: multipliersData } = useMultipliersQuery({
    loteriaId,
    isActive: true,
  })

  const submit = handleSubmit((values) => {
    const reventadoConfig =
      values.reventadoConfig && typeof values.reventadoConfig.enabled !== 'undefined'
        ? {
            enabled: !!values.reventadoConfig.enabled,
            allowedMultiplierIds: values.reventadoConfig.allowedMultiplierIds || [],
          }
        : undefined

    const nr = values.numberRange
    const numberRange =
      nr && typeof nr.min === 'number' && typeof nr.max === 'number'
        ? { min: nr.min, max: nr.max }
        : undefined

    const rules: LoteriaRulesJson = {
      ...values,
      reventadoConfig,
      numberRange,
      drawSchedule: values.drawSchedule
        ? {
            frequency: values.drawSchedule.frequency!,
            times: values.drawSchedule.times ?? [],
            daysOfWeek: toWeekdays(values.drawSchedule.daysOfWeek as number[] | undefined) as Weekday[] | undefined,
          }
        : undefined,
    }

    onChange(rules)
  })

  const reventadoEnabled =
    (watch('reventadoConfig.enabled') as boolean | undefined) ??
    value?.reventadoConfig?.enabled ?? false

  return (
    <Card p="$4" bw={1} bc="$borderColor">
      <YStack gap="$4">
        <Text fontSize="$7" fontWeight="700">Lotería · Reglas</Text>
        <Separator />

        {/* Límites */}
        <YStack gap="$2">
          <Text fontWeight="700">Límites y Rangos</Text>
          <XStack gap="$2" fw="wrap">
            <Controller
              control={control}
              name="minBetAmount"
              render={({ field }) => (
                <YStack w={160}>
                  <Text>Min Bet</Text>
                  <Input value={field.value?.toString() ?? ''} onChangeText={t => field.onChange(t)} keyboardType="decimal-pad" />
                </YStack>
              )}
            />
            <Controller
              control={control}
              name="maxBetAmount"
              render={({ field }) => (
                <YStack w={160}>
                  <Text>Max Bet</Text>
                  <Input value={field.value?.toString() ?? ''} onChangeText={t => field.onChange(t)} keyboardType="decimal-pad" />
                </YStack>
              )}
            />
            <Controller
              control={control}
              name="maxNumbersPerTicket"
              render={({ field }) => (
                <YStack w={200}>
                  <Text>Máx. Números por Ticket</Text>
                  <Input value={field.value?.toString() ?? ''} onChangeText={t => field.onChange(t)} keyboardType="number-pad" />
                </YStack>
              )}
            />
          </XStack>

          <XStack gap="$2" fw="wrap">
            <Controller
              control={control}
              name="numberRange.min"
              render={({ field }) => (
                <YStack w={140}>
                  <Text>Rango · Min</Text>
                  <Input value={field.value?.toString() ?? ''} onChangeText={t => field.onChange(t)} keyboardType="number-pad" />
                </YStack>
              )}
            />
            <Controller
              control={control}
              name="numberRange.max"
              render={({ field }) => (
                <YStack w={140}>
                  <Text>Rango · Max</Text>
                  <Input value={field.value?.toString() ?? ''} onChangeText={t => field.onChange(t)} keyboardType="number-pad" />
                </YStack>
              )}
            />
          </XStack>
        </YStack>

        <Separator />

        {/* Tipos de apuesta */}
        <YStack gap="$2">
          <Text fontWeight="700">Tipos de Apuesta</Text>

          <XStack ai="center" gap="$4" fw="wrap">
            <Controller
              control={control}
              name="allowedBetTypes"
              render={({ field }) => {
                const current = new Set<string>(field.value ?? [])
                const toggle = (opt: 'NUMERO'|'REVENTADO') => {
                  if (current.has(opt)) current.delete(opt); else current.add(opt)
                  field.onChange(Array.from(current))
                }
                return (
                  <XStack gap="$4" ai="center">
                    <Label>NUMERO</Label>
                    <Checkbox
                      checked={current.has('NUMERO')}
                      onCheckedChange={() => toggle('NUMERO')}
                    ><Checkbox.Indicator><Check size={14}/></Checkbox.Indicator></Checkbox>

                    <Label>EXTRA</Label>
                    <Checkbox
                      checked={current.has('REVENTADO')}
                      onCheckedChange={() => toggle('REVENTADO')}
                    ><Checkbox.Indicator><Check size={14}/></Checkbox.Indicator></Checkbox>
                  </XStack>
                )
              }}
            />

            {/* Reemplazo de Switch -> FilterSwitch */}
            <Controller
              control={control}
              name="reventadoConfig.enabled"
              render={({ field }) => (
                <FilterSwitch
                  label="Extra habilitado"
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(v)}
                />
              )}
            />
          </XStack>

          {reventadoEnabled && loteriaId && multipliersData && multipliersData.data.length > 0 && (
            <YStack gap="$2">
              <Text fontWeight="600">Multiplicadores EXTRA habilitados</Text>
              <Text color="$gray10" fontSize="$2">
                Selecciona qué multiplicadores EXTRA estarán disponibles para apuestas
              </Text>
              <Controller
                control={control}
                name="reventadoConfig.allowedMultiplierIds"
                render={({ field }) => {
                  const currentIds = new Set<string>(field.value ?? [])
                  const extraMultipliers = multipliersData.data.filter(m => m.kind === 'REVENTADO')

                  const toggle = (id: string) => {
                    if (currentIds.has(id)) currentIds.delete(id)
                    else currentIds.add(id)
                    field.onChange(Array.from(currentIds))
                  }

                  return (
                    <YStack gap="$2">
                      {extraMultipliers.length === 0 ? (
                        <Text color="$orange10" fontSize="$3">
                          No hay multiplicadores EXTRA configurados para esta lotería
                        </Text>
                      ) : (
                        extraMultipliers.map((mult) => (
                          <XStack key={mult.id} gap="$2" ai="center" p="$2" br="$2" bg="$gray2" bw={1} bc="$borderColor">
                            <Checkbox
                              checked={currentIds.has(mult.id)}
                              onCheckedChange={() => toggle(mult.id)}
                            >
                              <Checkbox.Indicator>
                                <Check size={16} />
                              </Checkbox.Indicator>
                            </Checkbox>
                            <Text flex={1}>{mult.name}</Text>
                            <Text fontWeight="700" color="$green10">{mult.valueX}x</Text>
                          </XStack>
                        ))
                      )}
                    </YStack>
                  )
                }}
              />
            </YStack>
          )}
        </YStack>

        {/* Multiplicadores disponibles para esta lotería */}
        {loteriaId && multipliersData && multipliersData.data.length > 0 && (
          <YStack gap="$2">
            <Text fontWeight="700">Multiplicadores Disponibles</Text>
            <YStack gap="$2">
              {multipliersData.data
                .filter((m) => m.kind === 'NUMERO')
                .map((mult) => (
                  <XStack key={mult.id} gap="$3" ai="center" p="$2" br="$2" bg="$blue2" bw={1} bc="$blue6">
                    <Text color="$blue11" fontWeight="600" fontSize="$2" w={60}>
                      NÚMERO
                    </Text>
                    <XStack gap="$2" ai="center" flex={1}>
                      <Text flex={1}>{mult.name}</Text>
                      <Text fontWeight="700" color="$green10" fontSize="$5">
                        {mult.valueX}x
                      </Text>
                    </XStack>
                  </XStack>
                ))}
              {multipliersData.data
                .filter((m) => m.kind === 'REVENTADO')
                .map((mult) => (
                  <XStack key={mult.id} gap="$3" ai="center" p="$2" br="$2" bg="$purple2" bw={1} bc="$purple6">
                    <Text color="$purple11" fontWeight="600" fontSize="$2" w={60}>
                      EXTRA
                    </Text>
                    <XStack gap="$2" ai="center" flex={1}>
                      <Text flex={1}>{mult.name}</Text>
                      <Text fontWeight="700" color="$green10" fontSize="$5">
                        {mult.valueX}x
                      </Text>
                    </XStack>
                  </XStack>
                ))}
            </YStack>
          </YStack>
        )}

        <Separator />

        {/* Horarios de Venta (Sales Hours) */}
        <YStack gap="$2">
          <Text fontWeight="700">Horarios de Venta</Text>
          <Text color="$gray10" fontSize="$2">
            Rango hábil de venta por día (desde–hasta). Deja vacío para permitir 24 h.
          </Text>

          <YStack gap="$2">
            {dayDefs.map(({ key, label }) => (
              <XStack key={key} gap="$1" fw="wrap" ai="center">
                <Text w={80}>{label}</Text>
                <Controller
                  control={control}
                  name={`salesHours.${key}.start` as any}
                  render={({ field }) => (
                    <TimeInput
                      value={String(field.value ?? '')}
                      onChange={field.onChange}
                      format="24h"
                      w={90}
                    />
                  )}
                />
                <Text>—</Text>
                <Controller
                  control={control}
                  name={`salesHours.${key}.end` as any}
                  render={({ field }) => (
                    <TimeInput
                      value={String(field.value ?? '')}
                      onChange={field.onChange}
                      format="24h"
                      w={90}
                    />
                  )}
                />
              </XStack>
            ))}
          </YStack>
        </YStack>

        <Separator />

        {/* Sorteos */}
        <YStack gap="$2">
          <Text fontWeight="700">Sorteos</Text>

          <XStack gap="$2" fw="wrap" ai="center">
            <Controller
              control={control}
              name="drawSchedule.frequency"
              render={({ field }) => (
                <YStack w={200} gap="$1">
                  <Text>Frecuencia</Text>
                  <Select value={field.value ?? 'diario'} onValueChange={field.onChange}>
                    <Select.Trigger iconAfter={ChevronDown} height={34} bw={1} bc="$borderColor">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content zIndex={1_000_000}>
                      <Select.Viewport>
                        {['diario','semanal','personalizado'].map((opt, i) => (
                          <Select.Item key={opt} value={opt} index={i}>
                            <Select.ItemText>{opt}</Select.ItemText>
                            <Select.ItemIndicator ml="auto"><Check size={16}/></Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </YStack>
              )}
            />

            <Controller
              control={control}
              name="drawSchedule.times"
              render={({ field }) => (
                <YStack w="100%" gap="$2">
                  <Text>Horas de sorteo (múltiples por día)</Text>
                  <TimeListEditor
                    value={(field.value as string[]|undefined) ?? []}
                    onChange={field.onChange}
                    format="24h"
                  />
                </YStack>
              )}
            />
          </XStack>

          <Controller
            control={control}
            name="drawSchedule.daysOfWeek"
            render={({ field }) => (
              <WeekdaySelector value={field.value as any} onChange={field.onChange} />
            )}
          />

          {/* Reemplazo de Switch -> FilterSwitch */}
          <Controller
            control={control}
            name="autoCreateSorteos"
            render={({ field }) => (
              <FilterSwitch
                label="Auto-crear sorteos"
                checked={!!field.value}
                onCheckedChange={(v) => field.onChange(v)}
              />
            )}
          />
        </YStack>

        <Separator />

        {/* Visual centralizado */}
        <Controller
          control={control}
          name="display"
          render={({ field }) => (
            <VisualPicker value={field.value as any} onChange={field.onChange} />
          )}
        />

        <Separator />

        {/* Base Multiplier fallback */}
        <YStack gap="$2">
          <Text fontWeight="700">Multiplicador Base (fallback)</Text>
          <Text color="$gray10" fontSize="$2">
            Se usa solo si no hay override de vendedor, ni override de listero, ni setting de banca.
          </Text>
          <Controller
            control={control}
            name="baseMultiplierX"
            render={({ field }) => (
              <YStack w={220}>
                <Text>baseMultiplierX</Text>
                <Input value={field.value?.toString() ?? ''} onChangeText={field.onChange} keyboardType="decimal-pad" />
              </YStack>
            )}
          />
        </YStack>

        <YStack gap="$2">
          <XStack jc="flex-end">
            <Button
              onPress={submit}
              bg="$green4"
              borderColor="$green8"
              borderWidth={1}
              hoverStyle={{ bg: '$green5' }}
              pressStyle={{ scale: 0.98 }}
            >
              {submitLabel}
            </Button>
          </XStack>
          {!!persistHint && (
            <Text color="$gray10" fontSize="$2" ta="right">
              {persistHint}
            </Text>
          )}
        </YStack>
      </YStack>
    </Card>
  )
}
