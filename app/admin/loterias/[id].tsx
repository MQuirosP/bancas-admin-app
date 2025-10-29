// app/admin/loterias/[id].tsx
import React, { useMemo, useState, useEffect } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner, useTheme } from 'tamagui'
import { Button } from '@/components/ui'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useToast } from '@/hooks/useToast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import LoteriaForm from '@/components/loterias/LoteriaForm'
import LoteriaRulesInline from '@/components/loterias/LoteriaRulesInline'
import { DEFAULT_RULES, LoteriaRulesJson } from '@/types/loteriaRules'

export default function EditLoteriaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['loterias', 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/loterias/${id}`)
      return Array.isArray(res) ? res[0] : res?.data ?? res
    }
  })

  const initialRules: LoteriaRulesJson = useMemo(() => {
    const r = (data?.rulesJson ?? {}) as LoteriaRulesJson
    return { ...DEFAULT_RULES, ...r }
  }, [data])

  const [rules, setRules] = useState<LoteriaRulesJson>(initialRules)

  useEffect(() => {
  setRules(initialRules)
}, [initialRules])

const rulesDirty = useMemo(
  () => JSON.stringify(rules) !== JSON.stringify(initialRules),
  [rules, initialRules]
)

  const update = useMutation({
    mutationFn: (body: any) => apiClient.patch(`/loterias/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loterias'] })
      toast.success('Lotería actualizada')
      router.replace('/admin/loterias')
    },
    onError: (e: any) => toast.error(e?.message || 'No fue posible actualizar'),
  })

  const goBackSafe = () => {
    // @ts-ignore (expo-router may not expose canGoBack typed)
    if (typeof router.canGoBack === 'function' && router.canGoBack()) router.back()
    else router.replace('/admin/loterias')
  }

  if (isLoading) return <YStack f={1} ai="center" jc="center"><Spinner /></YStack>
  if (isError || !data) return <YStack f={1} ai="center" jc="center"><Text>No se pudo cargar</Text></YStack>

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={900} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p: any) => <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => router.push('/admin/loterias')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Text fontSize="$8" fontWeight="bold">Editar Lotería</Text>
        </XStack>

        <LoteriaForm
          mode="edit"
          initial={{ id: data.id, name: data.name, isActive: (data.isActive ?? true) }}
          submitting={update.isPending}
          onSubmit={(values) => update.mutate({ ...values, rulesJson: rules })}
          onCancel={goBackSafe}
          externalDirty={rulesDirty}
        />

        <LoteriaRulesInline
          loteriaId={id}
          value={rules}
          onChange={setRules}
          submitLabel="Aplicar"
          persistHint="Se guardan al actualizar la lotería."
        />

      </YStack>
    </ScrollView>
  )
}
