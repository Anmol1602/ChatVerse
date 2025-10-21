import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../utils/api'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      login: async (email, password) => {
        set({ loading: true })
        try {
          const response = await api.post('/auth', {
            action: 'login',
            email,
            password
          })
          
          const { user, token } = response.data
          
          set({ 
            user, 
            token, 
            loading: false 
          })
          
          toast.success('Welcome back!')
          return { success: true }
        } catch (error) {
          set({ loading: false })
          const message = error.response?.data?.error || 'Login failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      register: async (name, email, password) => {
        set({ loading: true })
        try {
          const response = await api.post('/auth', {
            action: 'register',
            name,
            email,
            password
          })
          
          const { user, token } = response.data
          
          set({ 
            user, 
            token, 
            loading: false 
          })
          
          toast.success('Account created successfully!')
          return { success: true }
        } catch (error) {
          set({ loading: false })
          const message = error.response?.data?.error || 'Registration failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      logout: async () => {
        set({ loading: true })
        try {
          await api.post('/auth', { action: 'logout' })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ 
            user: null, 
            token: null, 
            loading: false 
          })
          toast.success('Logged out successfully')
        }
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ loading: false })
          return
        }

        set({ loading: true })
        try {
          const response = await api.get('/users')
          set({ 
            user: response.data.user, 
            loading: false 
          })
        } catch (error) {
          set({ 
            user: null, 
            token: null, 
            loading: false 
          })
        }
      },

      updateProfile: async (updates) => {
        set({ loading: true })
        try {
          const response = await api.put('/users', updates)
          set({ 
            user: response.data.user, 
            loading: false 
          })
          toast.success('Profile updated successfully!')
          return { success: true }
        } catch (error) {
          set({ loading: false })
          const message = error.response?.data?.error || 'Update failed'
          toast.error(message)
          return { success: false, error: message }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      })
    }
  )
)
