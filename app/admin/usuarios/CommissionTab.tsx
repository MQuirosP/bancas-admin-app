// app/admin/usuarios/CommissionTab.tsx
import React from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { Toolbar, Button } from '@/components/ui'
import { RefreshCw, HelpCircle } from '@tamagui/lucide-icons'
import { useCommissionPolicy, useUpdateCommissionPolicy } from '@/hooks/useCommissionPolicy'
import { CommissionForm } from '@/components/commission/CommissionForm'
import { CommissionPreview } from '@/components/commission/CommissionPreview'
import { CommissionPolicyV1Schema, EmptyPolicy } from '@/validators/commission.schema'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/components/ui/Confirm'
import { getErrorMessage } from '@/lib/errors'

type Props = {
  userId: string
  targetRole: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
  viewerRole: 'ADMIN' | 'VENTANA' | 'VENDEDOR'
}

export default function CommissionTab({ userId, targetRole, viewerRole }: Props) {
  const toast = useToast()
  const { confirm, ConfirmRoot } = useConfirm()
  const { data: policy, isFetching, refetch } = useCommissionPolicy(userId)
  const update = useUpdateCommissionPolicy(userId)

  const readOnly = viewerRole !== 'ADMIN' || !(targetRole === 'VENTANA' || targetRole === 'VENDEDOR')

  const handleSave = async (v: any) => {
    const parsed = CommissionPolicyV1Schema.safeParse(v)
    if (!parsed.success) {
      toast.error('Revisa el JSON: datos inválidos')
      return
    }
    try {
      await update.mutateAsync(parsed.data)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Restablecer a vacío',
      description: 'Esto establecerá la política en default 0% y sin reglas. ¿Continuar?',
      okText: 'Sí, restablecer',
      cancelText: 'Cancelar',
    })
    if (!ok) return
    try { await update.mutateAsync(EmptyPolicy) } catch (e) { toast.error(getErrorMessage(e)) }
  }

  return (
    <YStack gap="$3">
      {/* Toolbar estándar: distribución horizontal */}
      <Toolbar fd="row" jc="space-between" ai="center">
        <XStack gap="$2" ai="center">
          <Text fontSize="$6" fontWeight="700">Comisiones</Text>
          <Text fontSize="$2" color="$textSecondary">Política por usuario (v1)</Text>
        </XStack>
        <XStack gap="$2" ai="center">
          <Button variant="primary" icon={RefreshCw} onPress={() => refetch()} loading={isFetching || update.isPending}>Refrescar</Button>
          <Button variant="secondary" icon={HelpCircle} onPress={() => toast.info('Consulta la documentación interna de comisiones')}>Ayuda</Button>
        </XStack>
      </Toolbar>

      {!(targetRole === 'VENTANA' || targetRole === 'VENDEDOR') && (
        <Text color="$textSecondary">No aplica política por usuario para ADMIN</Text>
      )}

      <YStack gap="$3">
        <CommissionForm
          value={policy ?? null}
          readOnly={readOnly}
          loading={update.isPending}
          onSave={handleSave}
          onCancel={() => refetch()}
          onReset={readOnly ? undefined : handleReset}
        />

        <CommissionPreview policy={policy ?? null} />
      </YStack>
      <ConfirmRoot />
    </YStack>
  )
}
