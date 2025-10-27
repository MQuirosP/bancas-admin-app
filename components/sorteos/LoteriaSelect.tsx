// components/sorteos/LoteriaSelect.tsx
import React, { useMemo } from 'react'
import { Select, Sheet, Adapt, Spinner, Text, YStack } from 'tamagui'
import { ChevronDown } from '@tamagui/lucide-icons'
import { useQuery } from '@tanstack/react-query'
import { LoteriasApi } from '@/lib/api.loterias'

type Props = {
  value: string
  onChange: (id: string) => void
}

export default function LoteriaSelect({ value, onChange }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['loterias', 'list', { page: 1, pageSize: 100 }],
    queryFn: () => LoteriasApi.list({ page: 1, pageSize: 100 }),
    // si quieres refetch al enfocar pantalla:
    // refetchOnWindowFocus: true,
    staleTime: 60_000,
  })

  const loterias = useMemo(() => data?.data ?? [], [data])
  const placeholder = isLoading ? 'Cargando…' : (isError ? 'Error' : (loterias.length ? 'Selecciona lotería' : 'Sin loterías'))

  return (
    <YStack gap="$2">
      <Select value={value} onValueChange={onChange}>
        <Select.Trigger
          bw={1}
          bc="$borderColor"
          backgroundColor="$background"
          px="$3"
          iconAfter={ChevronDown}
          disabled={isLoading || isError}
        >
          <Select.Value placeholder={placeholder} />
          {isLoading && <Spinner size="small" />}
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
            {loterias.map((l: any, i: number) => (
              <Select.Item key={l.id} index={i} value={l.id}>
                <Select.ItemText>{l.name}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton />
        </Select.Content>
      </Select>

      {isError && <Text color="$error" fontSize="$2">No se pudo cargar la lista.</Text>}
    </YStack>
  )
}
