import { useMutation } from '@tanstack/react-query'

import { endpoints } from '@/config/endpoints.js'
import { api } from '@/lib/api.js'
import { useAuth } from './AuthContext.js'

export const useRegister = () => useMutation({ mutationFn: (values) => api.post(endpoints.client.auth.register, values) })

export const useForgotPassword = () => {
  const { realm } = useAuth()
  return useMutation({ mutationFn: ({ email }) => api.post(realm.auth.forgotPassword, { email }) })
}

export const useResetPassword = () => {
  const { realm } = useAuth()
  return useMutation({ mutationFn: ({ token, newPassword }) => api.post(realm.auth.resetPassword, { token, newPassword }) })
}

// Returns the fresh token, because changing a password ends every older session
export const useChangePassword = () => {
  const { realm, acceptNewToken } = useAuth()
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) => api.post(realm.auth.changePassword, { currentPassword, newPassword }),
    onSuccess: (body) => acceptNewToken(body.token),
  })
}
