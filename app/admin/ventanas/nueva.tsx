// app/admin/ventanas/nueva.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Button, Card, ScrollView, Spinner } from 'tamagui'
import { useRouter } from 'expo-router'
import { ArrowLeft, Save, RefreshCw } from '@tamagui/lucide-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { Toolbar } from '@/components/ui/Toolbar'
import { useConfirm } from '@/components/ui/Confirm'
import VentanaForm, { VentanaFormValues } from '@/components/ventanas/VentanaForm'
import { createVentana, listBancasLite } from '@/services/ventanas.service'

export default function NuevaVentanaScreen() {
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()

  const { data: bancas, isLoading: loadingBancas, isError: errorBancas, refetch: refetchBancas, isFetching } = useQuery({
    queryKey: ['bancas', 'lite'],
    queryFn: listBancasLite,
    staleTime: 60_000,
  })

  const firstBancaId = useMemo(() => (bancas?.[0]?.id ?? ''), [bancas])

  const [values, setValues] = useState<VentanaFormValues>({
    bancaId: '',
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    commissionMarginX: null,
    isActive: true,
  })

  useEffect(() => {
    if (!values.bancaId && firstBancaId) {
      setValues((prev) => ({ ...prev, bancaId: firstBancaId }))
    }
  }, [firstBancaId])

  const setField: typeof setValues extends (arg: infer _T) => any
    ? <K extends keyof VentanaFormValues>(key: K, val: VentanaFormValues[K]) => void
    : never = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const isDirty = useMemo(() => JSON.stringify(values) !== JSON.stringify({
    bancaId: '',
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    commissionMarginX: null,
    isActive: true,
  }), [values])

  const creating = useMutation({
    mutationFn: () => createVentana({
      bancaId: values.bancaId,
      name: values.name.trim(),
      code: values.code.trim() || null,
      email: values.email.trim() || null,
      phone: values.phone.trim() || null,
      address: values.address.trim() || null,
      commissionMarginX: values.commissionMarginX == null ? null : Number(values.commissionMarginX),
      isActive: !!values.isActive,
    }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['ventanas'] })
      toast.success('Ventana creada')
      const createdId = res?.data?.id ?? res?.id
      if (createdId) router.replace(`/admin/ventanas/${createdId}` as any)
      else router.back()
    },
    onError: (e: any) => toast.error(e?.message || 'No fue posible crear la ventana'),
  })

  const onSave = () => {
    if (!values.bancaId) return toast.error('Selecciona una banca')
    if (!values.name || values.name.trim().length < 2) return toast.error('El nombre es obligatorio')
    creating.mutate()
  }

  const onCancel = async () => {
    if (!isDirty) return router.back()
    const ok = await confirm({
      title: 'Cancelar creación',
      description: 'Hay cambios sin guardar. ¿Deseas salir de todos modos?',
      okText: 'Salir',
    })
    if (ok) router.back()
  }

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Button
              icon={ArrowLeft}
              onPress={onCancel}
              bg="$background"
              hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }}
              pressStyle={{ scale: 0.98 }}
            >
              <Text>Cancelar</Text>
            </Button>

            <XStack ai="center" gap="$2">
              <Text fontSize="$8" fontWeight="bold">Nueva Ventana</Text>
              {(isFetching || loadingBancas) && <Spinner size="small" />}
            </XStack>
          </XStack>

          <XStack gap="$2" flexWrap="wrap">
            <Button icon={RefreshCw} onPress={() => refetchBancas()}><Text>Refrescar</Text></Button>
            <Button
              icon={Save}
              onPress={onSave}
              bg="$primary"
              color="$background"
              hoverStyle={{ bg: '$primaryHover', scale: 1.02 }}
              pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
              disabled={creating.isPending}
            >
              {creating.isPending ? <Spinner size="small" /> : <Text>Guardar</Text>}
            </Button>
          </XStack>
        </XStack>

        {/* Form */}
        <Toolbar>
          <VentanaForm
            values={values}
            setField={setField}
            bancas={bancas ?? []}
            loadingBancas={loadingBancas}
            errorBancas={errorBancas}
            onRetryBancas={() => refetchBancas()}
          />
        </Toolbar>

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
