// components/usuarios/UserForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { YStack, XStack, Text, Switch, Spinner, Sheet, Adapt } from 'tamagui'
import { Button, Input, Card, Select } from '@/components/ui'
import { z } from 'zod'
import type { Usuario } from '@/types/models.types'
import { useToast } from '@/hooks/useToast'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { ChevronDown, X as XIcon, Eye, EyeOff } from '@tamagui/lucide-icons'
import { isDirty as isDirtyUtil } from '@/utils/forms/dirty'

// ---------------- Schemas ----------------

const createSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
    username: z
      .string()
      .trim()
      .min(3, 'El usuario debe tener al menos 3 caracteres')
      .max(100, 'Máximo 100 caracteres'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Correo inválido')
      .optional()
      .or(z.literal(''))
      .transform((v) => (v?.trim() ? v : undefined)),
    role: z.enum(['ADMIN', 'VENTANA', 'VENDEDOR']),
    ventanaId: z.string().trim().optional(),
    isActive: z.boolean().default(true),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  })
  .superRefine((val, ctx) => {
    if (val.role !== 'ADMIN') {
      if (!val.ventanaId || val.ventanaId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ventanaId'],
          message: 'Selecciona un listero',
        })
      }
    }
  })

const editSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre es requerido').max(100, 'Máximo 100 caracteres').optional(),
    username: z
      .string()
      .trim()
      .min(3, 'El usuario debe tener al menos 3 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Correo inválido')
      .optional()
      .or(z.literal(''))
      .transform((v) => (v?.trim() ? v : undefined)),
    // ⛔️ NO incluimos "code" en update porque el backend lo rechaza
    role: z.enum(['ADMIN', 'VENTANA', 'VENDEDOR']).optional(),
    // Para no-admin es requerida; para ADMIN debe ir null
    ventanaId: z.string().trim().nullable().optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role && val.role !== 'ADMIN') {
      if (!val.ventanaId || `${val.ventanaId}`.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ventanaId'],
          message: 'Selecciona un listero',
        })
      }
    }
  })

export type UserFormValues = z.input<typeof createSchema> | z.input<typeof editSchema>

// ---------------- UI Types ----------------

type UserFormUI = {
  name: string
  username: string
  email: string
  role: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
  ventanaId: string
  isActive: boolean
  password: string
  confirmPassword?: string
}

type VentanaLite = { id: string; name: string }

type Props = {
  mode: 'create' | 'edit'
  initial?: Partial<Usuario> | null
  submitting?: boolean
  onSubmit: (values: UserFormValues) => Promise<void> | void
  onCancel?: () => void
  onDelete?: () => void
  onRestore?: () => void
  ventanas?: VentanaLite[]
  loadingVentanas?: boolean
  errorVentanas?: boolean
  onRetryVentanas?: () => void
}

// función pura para normalizar antes de comparar (no usa hooks)
const normalizeUser = (v: UserFormUI) => ({
  name: (v.name ?? '').trim(),
  username: (v.username ?? '').trim(),
  email: (v.email ?? '').trim().toLowerCase(),
  role: v.role,
  ventanaId: v.role !== 'ADMIN' ? (v.ventanaId ?? '').trim() : '',
  isActive: !!v.isActive,
  _hasPasswordChanged: v.password.trim().length > 0 ? 'YES' : 'NO',
}) satisfies Record<string, any>;

// ---------------- Component ----------------

const UserForm: React.FC<Props> = ({
  mode,
  initial,
  submitting,
  onSubmit,
  onCancel,
  onDelete,
  onRestore,
  ventanas = [],
  loadingVentanas,
  errorVentanas,
  onRetryVentanas,
}) => {
  const toast = useToast()

  const initialUI: UserFormUI = useMemo(
    () => ({
      name: initial?.name ?? '',
      username: initial?.username ?? '',
      email: (initial?.email as string) ?? '',
      role: (initial?.role as any) ?? 'VENDEDOR',
      ventanaId: (initial?.ventanaId as string) ?? '',
      isActive: initial?.isActive ?? true,
      password: '',
      confirmPassword: '',
    }),
    [initial],
  )

  const [values, setValues] = useState<UserFormUI>(initialUI)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    setValues(initialUI)
    setErrors({})
  }, [initialUI])

  const setField = <K extends keyof UserFormUI>(key: K, v: UserFormUI[K]) =>
    setValues((s) => ({ ...s, [key]: v }))

  // Dirty solo para edición (pero NO deshabilita el botón; se chequea en submit)
  const isDirty = useMemo(() => {
    if (mode === 'create') return true
    return isDirtyUtil(values, initialUI, normalizeUser)
  }, [mode, values, initialUI])

  // Validación mínima para habilitar botón (alineado con Banca/Ventana)
  const canSubmit = useMemo(() => {
    if (!values.name || values.name.trim().length < 2) return false
    if (!values.username || values.username.trim().length < 3) return false
    if (values.role !== 'ADMIN' && !values.ventanaId?.trim()) return false

    // Email opcional: si viene, formato básico (la validación exacta la hace Zod)
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return false

    if (mode === 'create') {
      if (!values.password || values.password.trim().length < 8) return false
      if ((values.confirmPassword ?? '').trim().length < 8) return false
      if (values.password.trim() !== (values.confirmPassword ?? '').trim()) return false
    }
    return true
  }, [values, mode])

  const handleSubmit = async () => {
    setErrors({})

    if (mode === 'create') {
      const raw = {
        name: values.name,
        username: values.username,
        email: values.email?.trim().toLowerCase() || undefined,
        role: values.role,
        ventanaId: values.role !== 'ADMIN' ? values.ventanaId?.trim() || undefined : undefined,
        isActive: values.isActive,
        password: values.password || '',
      }

      if (values.password.trim() !== (values.confirmPassword ?? '').trim()) {
        setErrors((e) => ({ ...e, confirmPassword: 'Las contraseñas no coinciden' }))
        toast.error('Las contraseñas no coinciden')
        return
      }

      const parsed = createSchema.safeParse(raw)
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        parsed.error.issues.forEach((i) => {
          const k = i.path[0]?.toString?.()
          if (k) fieldErrors[k] = i.message
        })
        setErrors(fieldErrors)
        toast.error('Revisa los campos marcados')
        return
      }

      await onSubmit(parsed.data)
      setValues((s) => ({ ...s, password: '', confirmPassword: '' })) // limpia contraseña tras submit
      return
    }

    // EDIT
    const raw = {
      name: values.name || undefined,
      username: values.username || undefined,
      email: values.email?.trim().toLowerCase() || undefined,
      // ⛔️ NO enviar code en update
      role: values.role || undefined,
      ventanaId: values.role !== 'ADMIN' ? values.ventanaId?.trim() || undefined : null,
      isActive: values.isActive,
      password: values.password?.trim() ? values.password : undefined,
    }

    const parsed = editSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((i) => {
        const k = i.path[0]?.toString?.()
        if (k) fieldErrors[k] = i.message
      })
      setErrors(fieldErrors)
      toast.error('Revisa los campos marcados')
      return
    }

    // Bloqueo por no-dirty solo AQUÍ (el botón permanece habilitado)
    if (!isDirty) {
      toast.info?.('No hay cambios para guardar')
      return
    }

    await onSubmit(parsed.data)
  }

  return (
    <YStack gap="$4">
      <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} elevate>
        <YStack gap="$3">
          <XStack gap="$2" flexWrap="wrap">
            <FieldGroup flex={1} minWidth={260}>
              <FieldLabel>Nombre</FieldLabel>
              <Input
                value={values.name}
                onChangeText={(v) => setField('name', v)}
                placeholder="Nombre completo"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.name} />
            </FieldGroup>

            <FieldGroup flex={1} minWidth={260}>
              <FieldLabel>Usuario</FieldLabel>
              <Input
                value={values.username}
                onChangeText={(v) => setField('username', v)}
                placeholder="Nombre de usuario"
                autoCapitalize="none"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.username} />
            </FieldGroup>
          </XStack>

          <XStack gap="$4" flexWrap="wrap" ai="center">
            <FieldGroup flex={1} minWidth={260}>
              <FieldLabel>Correo (opcional)</FieldLabel>
              <Input
                value={values.email}
                onChangeText={(v) => setField('email', v)}
                placeholder="correo@ejemplo.com"
                inputMode="email"
                autoCapitalize="none"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.email} />
            </FieldGroup>

            <XStack gap="$3" ai="center" jc="center" alignSelf="center">
              <Switch
                size="$2"
                checked={!!values.isActive}
                onCheckedChange={(val) => setField('isActive', !!val)}
                bw={1}
                bc="$borderColor"
                bg={values.isActive ? '$color10' : '$background'}
                hoverStyle={{ bg: values.isActive ? '$color10' : '$backgroundHover' }}
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
                aria-label="Activo"
              >
                <Switch.Thumb animation="quick" bg="$color12" />
              </Switch>
              <Text fontSize="$4">Activo</Text>
            </XStack>
          </XStack>

          <XStack gap="$3" ai="flex-start" flexWrap="wrap">
            <YStack minWidth={160} flexShrink={0}>
              <FieldLabel>Rol</FieldLabel>
              <Select
                value={values.role}
                onValueChange={(val) => {
                  setField('role', val as any)
                  // Limpia ventana si pasa a ADMIN para evitar falsos dirty
                  if (val === 'ADMIN') setField('ventanaId', '')
                }}
              >
                <Select.Trigger bw={1} bc="$borderColor" px="$3" iconAfter={ChevronDown} width={160} flexShrink={0}>
                  <Select.Value placeholder="Selecciona rol" />
                </Select.Trigger>

                <Adapt when="sm">
                  <Sheet modal snapPoints={[50]} dismissOnSnapToBottom>
                    <Sheet.Frame ai="center" jc="center">
                      <Adapt.Contents />
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>

                <Select.Content zIndex={1_000_000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    {(['ADMIN', 'VENTANA', 'VENDEDOR'] as const).map((r, i) => {
                      const roleLabels = { ADMIN: 'ADMIN', VENTANA: 'LISTERO', VENDEDOR: 'VENDEDOR' }
                      return (
                        <Select.Item key={r} index={i} value={r}>
                          <Select.ItemText>{roleLabels[r]}</Select.ItemText>
                        </Select.Item>
                      )
                    })}
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
              <FieldError message={errors.role} />
            </YStack>

            {values.role !== 'ADMIN' && (
              <YStack minWidth={240} flexShrink={0}>
                <FieldLabel>Listero</FieldLabel>
                <Select
                  value={values.ventanaId || ''}
                  onValueChange={(val) => setField('ventanaId', val)}
                >
                  <Select.Trigger
                    bw={1}
                    bc="$borderColor"
                    backgroundColor="$background"
                    px="$3"
                    iconAfter={ChevronDown}
                    width={240}
                    flexShrink={0}
                    disabled={!!loadingVentanas || !!errorVentanas}
                  >
                    <Select.Value
                      placeholder={
                        loadingVentanas ? 'Cargando…' : errorVentanas ? 'Error' : 'Selecciona listero'
                      }
                    />
                  </Select.Trigger>

                  <Adapt when="sm">
                    <Sheet modal snapPoints={[50]} dismissOnSnapToBottom>
                      <Sheet.Frame ai="center" jc="center">
                        <Adapt.Contents />
                      </Sheet.Frame>
                      <Sheet.Overlay />
                    </Sheet>
                  </Adapt>

                  <Select.Content zIndex={1_000_000}>
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      {ventanas.map((v, index) => (
                        <Select.Item
                          key={v.id}
                          index={index}
                          value={v.id}
                          pressStyle={{ bg: '$backgroundHover' }}
                          bw={0}
                          px="$3"
                        >
                          <Select.ItemText>{v.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>

                {errorVentanas && (
                  <Button size="$2" onPress={onRetryVentanas} icon={XIcon} mt="$2">
                    <Text>Reintentar</Text>
                  </Button>
                )}

                <FieldError message={errors.ventanaId} />
              </YStack>
            )}
          </XStack>

          <XStack gap="$2" flexWrap="wrap">
            <FieldGroup flex={1} minWidth={260}>
              <FieldLabel hint={mode === 'edit' ? 'Deja en blanco para no cambiar' : undefined}>
                Contraseña
              </FieldLabel>
              <XStack position="relative" ai="center">
                <Input
                  value={values.password}
                  onChangeText={(v) => setField('password', v)}
                  placeholder="******"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  flex={1}
                  pr="$8"
                  focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                />
                <Pressable
                  style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#000" />
                  ) : (
                    <Eye size={18} color="#000" />
                  )}
                </Pressable>
              </XStack>
              <FieldError message={errors.password} />
            </FieldGroup>

            {mode === 'create' && (
              <FieldGroup flex={1} minWidth={260}>
                <FieldLabel>Confirmar contraseña</FieldLabel>
                <XStack position="relative" ai="center">
                  <Input
                    value={values.confirmPassword}
                    onChangeText={(v) => setField('confirmPassword', v)}
                    placeholder="******"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    flex={1}
                    pr="$8"
                    focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                  />
                  <Pressable
                    style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="#000" />
                    ) : (
                      <Eye size={18} color="#000" />
                    )}
                  </Pressable>
                </XStack>
                <FieldError message={errors.confirmPassword} />
              </FieldGroup>
            )}
          </XStack>
        </YStack>
      </Card>

      <XStack gap="$3" jc="flex-end" flexWrap="wrap" mt="$2">
        {/* Eliminar: solo si activo */}
        {onDelete && values.isActive === true && (
          <Button
            minWidth={120}
            px="$4"
            backgroundColor="$red4"
            borderColor="$red8"
            borderWidth={1}
            onPress={onDelete}
            disabled={!!submitting}
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            Eliminar
          </Button>
        )}

        {/* Restaurar: solo si inactivo */}
        {onRestore && values.isActive === false && (
          <Button
            minWidth={120}
            px="$4"
            backgroundColor="$green4"
            borderColor="$green8"
            borderWidth={1}
            onPress={onRestore}
            disabled={!!submitting}
            hoverStyle={{ scale: 1.02 }}
            pressStyle={{ scale: 0.98 }}
          >
            Restaurar
          </Button>
        )}

        <Button
          minWidth={120}
          px="$4"
          onPress={onCancel}
          disabled={!!submitting}
          backgroundColor="$gray4"
          borderColor="$gray8"
          color="$background"
          borderWidth={1}
          hoverStyle={{ scale: 1.02 }}
          pressStyle={{ scale: 0.98 }}
        >
          <Text>Cancelar</Text>
        </Button>

        <Button
          minWidth={120}
          px="$4"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={!!submitting}
          backgroundColor="$blue4"
          borderColor="$blue8"
          borderWidth={1}
          color="$background"
          hoverStyle={{ scale: 1.02 }}
          pressStyle={{ scale: 0.98 }}
        >
          <Text>Guardar</Text>
        </Button>
      </XStack>
    </YStack>
  )
}

export default UserForm
