import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import type { CommissionPolicyV1 } from '@/types/commission.types'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'

export const commissionKeys = {
  root: ['commissionPolicy'] as const,
  byUser: (id: string) => ['commissionPolicy', id] as const,
}

export function useCommissionPolicy(userId?: string) {
  const toast = useToast()
  const q = useQuery<CommissionPolicyV1 | null, Error>({
    queryKey: userId ? commissionKeys.byUser(userId) : ['commissionPolicy', 'nil'],
    queryFn: () => usersService.getCommissionPolicy(userId as string),
    enabled: !!userId,
    retry: 0,
  })

  if (q.error) toast.error(getErrorMessage(q.error))
  return q
}

export function useUpdateCommissionPolicy(userId: string) {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (payload: CommissionPolicyV1) => usersService.updateCommissionPolicy(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commissionKeys.byUser(userId) })
      toast.success('Política actualizada')
    },
    onError: (e) => {
      toast.error(getErrorMessage(e))
    },
  })
}

