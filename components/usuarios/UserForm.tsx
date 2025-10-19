// components/usuarios/UserForm.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Button, Input, Card, Switch, Spinner } from 'tamagui'
import { z } from 'zod'
import type { Usuario } from '@/types/models.types'
import { useToast } from '@/hooks/useToast'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'

const createSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido'),
  username: z.string().trim().min(3, 'El usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Correo inválido').optional(),
  code: z.string().trim().min(2, 'Código muy corto').optional(),
  role: z.enum(['ADMIN','VENTANA','VENDEDOR']),
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
  code: z.string().trim().min(2, 'Código muy corto').optional(),
  role: z.enum(['ADMIN','VENTANA','VENDEDOR']).optional(),
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

type Props = {
  mode: 'create' | 'edit'
  initial?: Partial<Usuario> | null
  submitting?: boolean
  onSubmit: (values: UserFormValues) => Promise<void> | void
  onCancel?: () => void
  onDelete?: () => void
  onRestore?: () => void
}

export const UserForm: React.FC<Props> = ({ mode, initial, submitting, onSubmit, onCancel, onDelete, onRestore }) => {
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

  const setField = <K extends keyof UserFormUI>(key: K, v: UserFormUI[K]) => setValues((s) => ({ ...s, [key]: v }))

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
        parsed.error.issues.forEach((i) => { const k = i.path[0]?.toString?.(); if (k) fieldErrors[k] = i.message })
        setErrors(fieldErrors); toast.error('Revisa los campos marcados'); return
      }
      await onSubmit(parsed.data); return
    }
    const raw = {
      name: values.name || undefined,
      username: values.username || undefined,
      email: values.email?.trim() || undefined,
      code: values.code?.trim() || undefined,
      role: values.role || undefined,
      ventanaId: values.role !== 'ADMIN' ? (values.ventanaId?.trim() || undefined) : null,
      isActive: values.isActive,
      password: values.password?.trim() ? values.password : undefined,
    }
    const parsed = editSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((i) => { const k = i.path[0]?.toString?.(); if (k) fieldErrors[k] = i.message })
      setErrors(fieldErrors); toast.error('Revisa los campos marcados'); return
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
              <select
                value={values.role}
                onChange={(e) => setField('role', e.target.value as any)}
                style={{ padding: 8, borderRadius: 8, minWidth: 160 }}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="VENTANA">VENTANA</option>
                <option value="VENDEDOR">VENDEDOR</option>
              </select>
              <FieldError message={errors.role} />
            </YStack>

            {values.role !== 'ADMIN' && (
              <YStack minWidth={220}>
                <FieldLabel>Ventana</FieldLabel>
                <Input
                  value={values.ventanaId}
                  onChangeText={(v) => setField('ventanaId', v)}
                  placeholder="ventanaId"
                  focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
                />
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
                <Switch.Thumb animation="quick" bg="$color12" shadowColor="$shadowColor" shadowRadius={6} shadowOffset={{ width: 0, height: 2 }} />
              </Switch>
              <Text fontSize="$4">Activa</Text>
            </XStack>
          </XStack>

          <XStack gap="$2">
            <FieldGroup flex={1} minWidth={260}>
              <FieldLabel hint={mode === 'edit' ? 'Deja en blanco para no cambiar' : undefined}>Contraseña</FieldLabel>
              <Input
                value={values.password || ''}
                onChangeText={(v) => setField('password', v)}
                placeholder="******"
                secureTextEntry
                focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
              />
              <FieldError message={errors.password} />
            </FieldGroup>
          </XStack>
        </YStack>
      </Card>

      <XStack gap="$2" jc="flex-end" flexWrap="wrap">
        {onDelete && <Button onPress={onDelete} hoverStyle={{ scale: 1.02 }} pressStyle={{ scale: 0.98 }}>Eliminar</Button>}
        {onRestore && <Button onPress={onRestore}>Restaurar</Button>}
        <Button onPress={onCancel}>Cancelar</Button>
        <Button
          onPress={handleSubmit}
          disabled={!!submitting}
          bg="$primary"
          color="$background"
          hoverStyle={{ bg: '$primaryHover', scale: 1.02 }}
          pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
        >
          {submitting ? <Spinner size="small" /> : 'Guardar'}
        </Button>
      </XStack>
    </YStack>
  )
}
