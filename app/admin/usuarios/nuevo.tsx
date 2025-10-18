import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Card, Switch, ScrollView, Select } from 'tamagui';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiErrorClass } from '../../../lib/api.client';
import { Usuario, Ventana } from '../../../types/models.types';
import { Check, ChevronDown } from '@tamagui/lucide-icons';

export default function NuevoUsuarioScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [ventanaId, setVentanaId] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'VENTANA' | 'VENDEDOR'>('VENDEDOR');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar lista de ventanas para el select
  const { data: ventanasData } = useQuery({
    queryKey: ['ventanas'],
    queryFn: () => apiClient.get<{ data: Ventana[] }>('/ventanas'),
  });

  const ventanas = ventanasData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Usuario>) => apiClient.post<Usuario>('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.back();
    },
    onError: (error: ApiErrorClass) => {
      if (error.details) {
        const fieldErrors: Record<string, string> = {};
        error.details.forEach((detail) => {
          if (detail.field) {
            fieldErrors[detail.field] = detail.message;
          }
        });
        setErrors(fieldErrors);
      }
    },
  });

  const handleSubmit = () => {
    setErrors({});

    const payload: any = {
      username,
      name,
      password,
      role,
      isActive,
    };

    // ventanaId es opcional para ADMIN, requerido para otros
    if (ventanaId) payload.ventanaId = ventanaId;
    if (email) payload.email = email;

    createMutation.mutate(payload);
  };

  const requiresVentana = role !== 'ADMIN';

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Nuevo Usuario
        </Text>

        <Card padding="$4">
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Rol *
              </Text>
              <Select value={role} onValueChange={(value: string) => setRole(value as 'ADMIN' | 'VENTANA' | 'VENDEDOR')}>
                <Select.Trigger width="100%" iconAfter={ChevronDown}>
                  <Select.Value placeholder="Seleccione un rol" />
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Item index={0} value="ADMIN">
                        <Select.ItemText>ADMIN</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item index={1} value="VENTANA">
                        <Select.ItemText>VENTANA</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item index={2} value="VENDEDOR">
                        <Select.ItemText>VENDEDOR</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
              {errors.role && (
                <Text color="$error" fontSize="$2">
                  {errors.role}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Ventana {requiresVentana && '*'}
              </Text>
              <Select value={ventanaId} onValueChange={setVentanaId}>
                <Select.Trigger width="100%" iconAfter={ChevronDown}>
                  <Select.Value placeholder={requiresVentana ? "Seleccione una ventana" : "Opcional para ADMIN"} />
                </Select.Trigger>

                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      {!requiresVentana && (
                        <Select.Item index={0} value="">
                          <Select.ItemText>(Ninguna)</Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      )}
                      {ventanas.map((ventana, idx) => (
                        <Select.Item key={ventana.id} index={requiresVentana ? idx : idx + 1} value={ventana.id}>
                          <Select.ItemText>{ventana.name}</Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
              <Text fontSize="$2" color="$textSecondary">
                {requiresVentana ? 'Requerido para roles VENTANA y VENDEDOR' : 'Opcional para ADMIN'}
              </Text>
              {errors.ventanaId && (
                <Text color="$error" fontSize="$2">
                  {errors.ventanaId}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Nombre de Usuario *
              </Text>
              <Input
                size="$4"
                placeholder="usuario123"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <Text fontSize="$2" color="$textSecondary">
                3-50 caracteres
              </Text>
              {errors.username && (
                <Text color="$error" fontSize="$2">
                  {errors.username}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Nombre Completo *
              </Text>
              <Input
                size="$4"
                placeholder="Juan Pérez"
                value={name}
                onChangeText={setName}
              />
              {errors.name && (
                <Text color="$error" fontSize="$2">
                  {errors.name}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Email (opcional)
              </Text>
              <Input
                size="$4"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email && (
                <Text color="$error" fontSize="$2">
                  {errors.email}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500">
                Contraseña *
              </Text>
              <Input
                size="$4"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Text fontSize="$2" color="$textSecondary">
                Mínimo 6 caracteres
              </Text>
              {errors.password && (
                <Text color="$error" fontSize="$2">
                  {errors.password}
                </Text>
              )}
            </YStack>

            <XStack gap="$3" alignItems="center">
              <Switch size="$4" checked={isActive} onCheckedChange={setIsActive}>
                <Switch.Thumb animation="quick" />
              </Switch>
              <Text fontSize="$4">Activo</Text>
            </XStack>
          </YStack>
        </Card>

        <XStack gap="$3">
          <Button flex={1} backgroundColor="$red4" borderColor="$red8" borderWidth={1} onPress={() => router.back()}>
            Cancelar
          </Button>
          <Button
            flex={1}
            backgroundColor="$blue4" borderColor="$blue8" borderWidth={1}
            onPress={handleSubmit}
            disabled={createMutation.isPending || !username || !name || !password || (requiresVentana && !ventanaId)}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}