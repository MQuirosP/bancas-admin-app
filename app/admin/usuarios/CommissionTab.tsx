// app/admin/usuarios/CommissionTab.tsx
import React from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { Toolbar, Button, Card } from '@/components/ui'
import { RefreshCw, HelpCircle } from '@tamagui/lucide-icons'
import { useTheme } from 'tamagui'
import { useCommissionPolicy, useUpdateCommissionPolicy } from '@/hooks/useCommissionPolicy'
import { CommissionForm } from '@/components/commission/CommissionForm'
import { CommissionPreview } from '@/components/commission/CommissionPreview'
import { EmptyPolicy } from '@/validators/commission.schema'
import type { CommissionPolicyV1 } from '@/types/commission.types'
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
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const [techError, setTechError] = React.useState<{ code?: string; traceId?: string; details?: any[] } | null>(null)
  const [previewPolicy, setPreviewPolicy] = React.useState<CommissionPolicyV1 | null>(null)

  const readOnly = viewerRole !== 'ADMIN' || !(targetRole === 'VENTANA' || targetRole === 'VENDEDOR')

  const handleSave = async (v: CommissionPolicyV1) => {
    try {
      await update.mutateAsync(v)
      setTechError(null)
    } catch (e) {
      const anyErr = e as any
      const msg = getErrorMessage(e)
      const traceId = anyErr?.traceId || anyErr?.trace_id
      const code = anyErr?.code
      const details = anyErr?.details
      setTechError({ code, traceId, details })
      toast.error(traceId ? `${msg} (traceId: ${traceId})` : msg)
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
    try { await update.mutateAsync(EmptyPolicy); setTechError(null) } catch (e) {
      const anyErr = e as any
      const msg = getErrorMessage(e)
      const traceId = anyErr?.traceId || anyErr?.trace_id
      const code = anyErr?.code
      const details = anyErr?.details
      setTechError({ code, traceId, details })
      toast.error(traceId ? `${msg} (traceId: ${traceId})` : msg)
    }
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
          <Button
            icon={(p:any)=> <RefreshCw {...p} color={iconColor} />}
            onPress={() => refetch()}
            loading={isFetching || update.isPending}
            backgroundColor="$green4"
            borderColor="$green8"
            borderWidth={1}
            hoverStyle={{ backgroundColor: '$green5' }}
            pressStyle={{ backgroundColor: '$green6', scale: 0.98 }}
          >
            Refrescar
          </Button>
          <Button variant="secondary" icon={(p:any)=> <HelpCircle {...p} color={iconColor} />} onPress={() => toast.info('Consulta la documentación interna de comisiones')}>Ayuda</Button>
        </XStack>
      </Toolbar>

      {!(targetRole === 'VENTANA' || targetRole === 'VENDEDOR') && (
        <Text color="$textSecondary">No aplica política por usuario para ADMIN</Text>
      )}

      {techError?.traceId && (
        <Card p="$2" bw={1} bc="$borderColor" bg="$backgroundHover">
          <Text fontSize="$2" color="$textSecondary">Detalles técnicos:</Text>
          <Text fontSize="$2">traceId: {techError.traceId}</Text>
          {techError.code && <Text fontSize="$2">code: {techError.code}</Text>}
        </Card>
      )}

      <YStack gap="$3">
        <CommissionForm
          value={policy ?? null}
          readOnly={readOnly}
          loading={update.isPending}
          onSave={handleSave}
          onCancel={() => refetch()}
          onReset={readOnly ? undefined : handleReset}
          onChangePolicy={setPreviewPolicy}
        />

        <CommissionPreview policy={previewPolicy ?? policy ?? null} />
      </YStack>
      <ConfirmRoot />
    </YStack>
  )
}
