// components/usuarios/UserForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  YStack, XStack, Text, Button, Input, Card, Switch, Spinner,
  Select, Sheet, Adapt
} from 'tamagui'
import { z } from 'zod'
import type { Usuario } from '@/types/models.types'
import { useToast } from '@/hooks/useToast'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { ChevronDown, X as XIcon } from '@tamagui/lucide-icons'
import { isDirty as isDirtyUtil } from "../../utils/forms/dirty";

const createSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido'),
  username: z.string().trim().min(3, 'El usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Correo inválido').optional(),
  code: z.string().trim().min(2, 'Código muy corto').optional(),
  role: z.enum(['ADMIN', 'VENTANA', 'VENDEDOR']),
  ventanaId: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
}).superRefine((val, ctx) => {
  if (val.role !== 'ADMIN') {
    if (!val.ventanaId || val.ventanaId.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ventanaId'], message: 'Selecciona una ventana' })
    }
  }
})

const editSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido').optional(),
  username: z.string().trim().min(3, 'El usuario debe tener al menos 3 caracteres').optional(),
  email: z.string().email('Correo inválido').optional(),
  // ⛔️ NO incluimos "code" en update porque el backend lo rechaza
  role: z.enum(['ADMIN', 'VENTANA', 'VENDEDOR']).optional(),
  ventanaId: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
}).superRefine((val, ctx) => {
  if (val.role && val.role !== 'ADMIN') {
    if (!val.ventanaId || `${val.ventanaId}`.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ventanaId'], message: 'Selecciona una ventana' })
    }
  }
})

export type UserFormValues = z.input<typeof createSchema> | z.input<typeof editSchema>

type UserFormUI = {
  name: string
  username: string
  email?: string
  code?: string
  role: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
  ventanaId?: string
  isActive?: boolean
  password?: string
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
  email: (v.email ?? '').trim(),
  code: (v.code ?? '').trim(),
  role: v.role,
  ventanaId: v.role !== 'ADMIN' ? (v.ventanaId ?? '').trim() : '',
  isActive: !!v.isActive,
  // password no participa en dirty-check
})

const UserForm: React.FC<Props> = ({
  mode, initial, submitting, onSubmit, onCancel, onDelete, onRestore,
  ventanas = [], loadingVentanas, errorVentanas, onRetryVentanas,
}) => {
  const toast = useToast()

  const initialUI: UserFormUI = useMemo(() => ({
    name: initial?.name ?? '',
    username: initial?.username ?? '',
    email: initial?.email ?? '',
    code: initial?.code ?? '',
    role: (initial?.role as any) ?? 'VENDEDOR',
    ventanaId: initial?.ventanaId ?? '',
    isActive: initial?.isActive ?? true,
    password: '',
  }), [initial])

  const [values, setValues] = useState<UserFormUI>(initialUI)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { setValues(initialUI); setErrors({}) }, [initialUI])

  const setField = <K extends keyof UserFormUI>(key: K, v: UserFormUI[K]) =>
    setValues((s) => ({ ...s, [key]: v }))

  // ✅ AHORA sí dentro del componente
  const isDirty = useMemo(() => {
    if (mode === 'create') return true
    return isDirtyUtil(values, initialUI, normalizeUser)
  }, [mode, values, initialUI])

  const handleSubmit = async () => {
    setErrors({})

    if (mode === 'create') {
      const raw = {
        name: values.name,
        username: values.username,
        email: values.email?.trim() || undefined,
        code: values.code?.trim() || undefined,
        role: values.role,
        ventanaId: values.role !== 'ADMIN' ? (values.ventanaId?.trim() || undefined) : undefined,
        isActive: values.isActive,
        password: values.password || '',
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
      return
    }

    // EDIT
    const raw = {
      name: values.name || undefined,
      username: values.username || undefined,
      email: values.email?.trim() || undefined,
      // ⛔️ NO enviar code en update
      role: values.role || undefined,
      ventanaId: values.role !== 'ADMIN' ? (values.ventanaId?.trim() || undefined) : null,
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

    if (!isDirty) { toast.info('No hay cambios para guardar'); return }
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

          <XStack gap="$2" flexWrap="wrap">
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

            <FieldGroup flex={1} minWidth={260}>
              <FieldLabel>Código (opcional)</FieldLabel>
              <Input
                value={values.code}
                onChangeText={(v) => setField('code', v)}
                placeholder="Código interno"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.code} />
            </FieldGroup>
          </XStack>

          <XStack gap="$3" ai="center" flexWrap="wrap">
            <YStack>
              <FieldLabel>Rol</FieldLabel>
              <Select
                value={values.role}
                onValueChange={(val) => setField('role', val as any)}
              >
                <Select.Trigger bw={1} bc="$borderColor" px="$3" iconAfter={ChevronDown}>
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
                    {(['ADMIN', 'VENTANA', 'VENDEDOR'] as const).map((r, i) => (
                      <Select.Item key={r} index={i} value={r}>
                        <Select.ItemText>{r}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
              <FieldError message={errors.role} />
            </YStack>

            {values.role !== 'ADMIN' && (
              <YStack minWidth={240}>
                <FieldLabel>Ventana</FieldLabel>
                <Select
                  value={values.ventanaId || ''}
                  onValueChange={(val) => setField('ventanaId', val)}
                >
                  <Select.Trigger
                    bw={1}
                    bc="$borderColor"
                    bg="$background"
                    px="$3"
                    iconAfter={ChevronDown}
                    disabled={!!loadingVentanas || !!errorVentanas}
                  >
                    <Select.Value
                      placeholder={loadingVentanas ? 'Cargando…' : (errorVentanas ? 'Error' : 'Selecciona ventana')}
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

            <XStack gap="$3" ai="center">
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

          <XStack gap="$2">
            <FieldGroup flex={1} minWidth={260}>
              <FieldLabel hint={mode === 'edit' ? 'Deja en blanco para no cambiar' : undefined}>
                Contraseña
              </FieldLabel>
              <Input
                value={values.password || ''}
                onChangeText={(v) => setField('password', v)}
                placeholder="******"
                secureTextEntry
                autoCapitalize="none"
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.password} />
            </FieldGroup>
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
          borderWidth={1}
          hoverStyle={{ scale: 1.02 }}
          pressStyle={{ scale: 0.98 }}
        >
          Cancelar
        </Button>

        <Button
          minWidth={120}
          px="$4"
          onPress={handleSubmit}
          disabled={!!submitting}
          backgroundColor="$blue4"
          borderColor="$blue8"
          borderWidth={1}
          hoverStyle={{ scale: 1.02 }}
          pressStyle={{ scale: 0.98 }}
        >
          {submitting ? <Spinner size="small" /> : 'Guardar'}
        </Button>
      </XStack>
    </YStack>
  )
}

export default UserForm
