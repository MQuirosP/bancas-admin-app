// app/admin/index.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Card, Button, ScrollView } from 'tamagui';
import {
  Users,
  Store,
  Trophy,
  Ticket,
  FileText,
  Settings,
  Shield,
  BarChart3,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '@/store/auth.store';

interface DashboardCard {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Bancas',
    description: 'Gestionar bancas del sistema',
    icon: Store,
    href: '/admin/bancas',
    color: '$blue10',
  },
  {
    title: 'Ventanas',
    description: 'Administrar puntos de venta',
    icon: Users,
    href: '/admin/ventanas',
    color: '$green10',
  },
  {
    title: 'Usuarios',
    description: 'Gestionar usuarios y vendedores',
    icon: Users,
    href: '/admin/usuarios',
    color: '$purple10',
  },
  {
    title: 'Loterías',
    description: 'Configurar loterías disponibles',
    icon: Trophy,
    href: '/admin/loterias',
    color: '$orange10',
  },
  {
    title: 'Sorteos',
    description: 'Gestionar y evaluar sorteos',
    icon: Trophy,
    href: '/admin/sorteos',
    color: '$red10',
  },
  {
    title: 'Multipliers',
    description: 'Configurar multiplicadores',
    icon: BarChart3,
    href: '/admin/multipliers',
    color: '$yellow10',
  },
  {
    title: 'Restricciones',
    description: 'Reglas y límites del sistema',
    icon: Shield,
    href: '/admin/restrictions',
    color: '$pink10',
  },
  {
    title: 'Tickets',
    description: 'Consultar todos los tickets',
    icon: Ticket,
    href: '/admin/tickets',
    color: '$cyan10',
  },
  {
    title: 'Reportes',
    description: 'Análisis y estadísticas',
    icon: FileText,
    href: '/admin/reportes',
    color: '$indigo10',
  },
  {
    title: 'Configuración',
    description: 'Variables globales del sistema',
    icon: Settings,
    href: '/admin/configuracion',
    color: '$gray10',
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleCardPress = (href: string) => {
    router.push(href as any);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" color="$textPrimary">
            Panel de Administración
          </Text>
          <Text fontSize="$4" color="$textSecondary">
            Bienvenido, {user?.name || 'Administrador'}
          </Text>
        </YStack>

        {/* 🔥 CARDS EN 2 COLUMNAS - Grid Responsivo ARREGLADO */}
        <YStack gap="$3">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;
            const isOdd = index % 2 === 0;
            
            // Crear filas de 2 cards
            if (isOdd) {
              const nextCard = dashboardCards[index + 1];
              
              return (
                <XStack key={index} gap="$3" flexWrap="wrap">
                  {/* Primera Card */}
                  <YStack flex={1} minWidth={280}>
                    <Card
                      padding="$4"
                      backgroundColor="$backgroundStrong"
                      borderRadius="$4"
                      borderWidth={1}
                      borderColor="$borderColor"
                      pressStyle={{ scale: 0.98 }}
                      hoverStyle={{
                        borderColor: card.color,
                        elevation: 4,
                        shadowColor: card.color,
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                      }}
                      cursor="pointer"
                      onPress={() => handleCardPress(card.href)}
                      animation="quick"
                      height="100%"
                    >
                      <YStack gap="$3">
                        {/* Icon */}
                        <YStack
                          width={56}
                          height={56}
                          backgroundColor={`${card.color.replace('10', '3')}`}
                          borderRadius="$3"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon size={28} color={card.color} />
                        </YStack>

                        {/* Content */}
                        <YStack gap="$2">
                          <Text fontSize="$6" fontWeight="600" color="$textPrimary">
                            {card.title}
                          </Text>
                          <Text fontSize="$3" color="$textSecondary" lineHeight="$1">
                            {card.description}
                          </Text>
                        </YStack>

                        {/* Action Hint */}
                        <Text fontSize="$2" color={card.color} fontWeight="500">
                          Ver más →
                        </Text>
                      </YStack>
                    </Card>
                  </YStack>

                  {/* Segunda Card (si existe) */}
                  {nextCard && (
                    <YStack flex={1} minWidth={280}>
                      <Card
                        padding="$4"
                        backgroundColor="$backgroundStrong"
                        borderRadius="$4"
                        borderWidth={1}
                        borderColor="$borderColor"
                        pressStyle={{ scale: 0.98 }}
                        hoverStyle={{
                          borderColor: nextCard.color,
                          elevation: 4,
                          shadowColor: nextCard.color,
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                        }}
                        cursor="pointer"
                        onPress={() => handleCardPress(nextCard.href)}
                        animation="quick"
                        height="100%"
                      >
                        <YStack gap="$3">
                          {/* Icon */}
                          <YStack
                            width={56}
                            height={56}
                            backgroundColor={`${nextCard.color.replace('10', '3')}`}
                            borderRadius="$3"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <nextCard.icon size={28} color={nextCard.color} />
                          </YStack>

                          {/* Content */}
                          <YStack gap="$2">
                            <Text fontSize="$6" fontWeight="600" color="$textPrimary">
                              {nextCard.title}
                            </Text>
                            <Text fontSize="$3" color="$textSecondary" lineHeight="$1">
                              {nextCard.description}
                            </Text>
                          </YStack>

                          {/* Action Hint */}
                          <Text fontSize="$2" color={nextCard.color} fontWeight="500">
                            Ver más →
                          </Text>
                        </YStack>
                      </Card>
                    </YStack>
                  )}
                </XStack>
              );
            }
            
            // Skip odd indices since they're handled in pairs
            return null;
          })}
        </YStack>

        {/* Quick Stats (opcional) */}
        <XStack gap="$3" flexWrap="wrap" marginTop="$4">
          <Card
            flex={1}
            minWidth={150}
            padding="$3"
            backgroundColor="$blue3"
            borderRadius="$3"
          >
            <YStack gap="$1">
              <Text fontSize="$2" color="$blue11" fontWeight="500">
                Bancas Activas
              </Text>
              <Text fontSize="$7" fontWeight="bold" color="$blue11">
                12
              </Text>
            </YStack>
          </Card>

          <Card
            flex={1}
            minWidth={150}
            padding="$3"
            backgroundColor="$green3"
            borderRadius="$3"
          >
            <YStack gap="$1">
              <Text fontSize="$2" color="$green11" fontWeight="500">
                Ventanas Activas
              </Text>
              <Text fontSize="$7" fontWeight="bold" color="$green11">
                45
              </Text>
            </YStack>
          </Card>

          <Card
            flex={1}
            minWidth={150}
            padding="$3"
            backgroundColor="$purple3"
            borderRadius="$3"
          >
            <YStack gap="$1">
              <Text fontSize="$2" color="$purple11" fontWeight="500">
                Tickets Hoy
              </Text>
              <Text fontSize="$7" fontWeight="bold" color="$purple11">
                1,234
              </Text>
            </YStack>
          </Card>

          <Card
            flex={1}
            minWidth={150}
            padding="$3"
            backgroundColor="$orange3"
            borderRadius="$3"
          >
            <YStack gap="$1">
              <Text fontSize="$2" color="$orange11" fontWeight="500">
                Sorteos Activos
              </Text>
              <Text fontSize="$7" fontWeight="bold" color="$orange11">
                8
              </Text>
            </YStack>
          </Card>
        </XStack>
      </YStack>
    </ScrollView>
  );
}