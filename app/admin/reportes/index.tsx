import React from 'react';
import { YStack, XStack, Text, ScrollView, Card } from 'tamagui';
import { useRouter } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { Button } from '@/components/ui'
import { useTheme } from 'tamagui'
import { Trophy, TrendingUp, Users, Store, FileText } from '@tamagui/lucide-icons'

type ReportCard = { title: string; description: string; icon: any; href: string; color: string }

const reports: ReportCard[] = [
  { title: 'Ventas (KPI y Serie)', description: 'Resumen ejecutivo y series', icon: TrendingUp, href: '/admin/reportes/ventas', color: '$purple10' },
  { title: 'Tickets (Próx.)', description: 'Volumen y estados', icon: FileText, href: '/admin/reportes/tickets', color: '$cyan10' },
  { title: 'Loterías (Próx.)', description: 'Rendimiento por lotería', icon: Trophy, href: '/admin/reportes/loterias', color: '$yellow10' },
  { title: 'Listeros (Próx.)', description: 'Top listeros y márgenes', icon: Store, href: '/admin/reportes/ventanas', color: '$green10' },
  { title: 'Vendedores (Próx.)', description: 'Productividad y ventas', icon: Users, href: '/admin/reportes/vendedores', color: '$indigo10' },
]

export default function ReportesHub() {
  const router = useRouter()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2" jc="space-between" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Button
              size="$3"
              icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
              onPress={()=> router.push('/admin')}
              backgroundColor="transparent"
              borderWidth={0}
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ scale: 0.98 }}
            />
            <Text fontSize="$8" fontWeight="bold">Reportes</Text>
          </XStack>
        </XStack>

        <YStack gap="$3">
          {reports.reduce((rows: ReportCard[][], r, i) => {
            if (i % 4 === 0) rows.push([r]); else rows[rows.length-1].push(r); return rows
          }, []).map((row, idx) => (
            <XStack key={idx} gap="$3" flexWrap="wrap">
              {row.map((c) => (
                <Card
                  key={c.title}
                  flex={1}
                  minWidth={220}
                  maxWidth="24%"
                  $md={{ maxWidth: '32%' }}
                  $sm={{ maxWidth: '48%' }}
                  $xs={{ maxWidth: '100%' }}
                  padding="$3"
                  backgroundColor="$backgroundStrong"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  pressStyle={{ scale: 0.98 }}
                  hoverStyle={{ borderColor: c.color, elevation: 4, shadowColor: c.color, shadowOpacity: 0.2, shadowRadius: 8, scale: 1.01 }}
                  animation="quick"
                  cursor="pointer"
                  onPress={() => router.push(c.href as any)}
                >
                  <YStack gap="$2">
                    <YStack width={40} height={40} backgroundColor={String(c.color).replace('10','4') as any} borderRadius="$3" ai="center" jc="center">
                      <c.icon size={20} color={c.color} />
                    </YStack>
                    <Text fontSize="$5" fontWeight="700">{c.title}</Text>
                    <Text fontSize="$3" color="$textSecondary">{c.description}</Text>
                  </YStack>
                </Card>
              ))}
            </XStack>
          ))}
        </YStack>
      </YStack>
    </ScrollView>
  )
}
