import api from './api'

export const profileService = {
    // Lấy thông tin profile hiện tại
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me')
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin người dùng')
        }
    },

    // Cập nhật thông tin profile
    updateProfile: async (data) => {
        try {
            const response = await api.put('/auth/profile', data)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin')
        }
    },

    // Đổi mật khẩu
    changePassword: async (passwordData) => {
        try {
            const response = await api.post('/auth/change-password', passwordData)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Lỗi khi đổi mật khẩu')
        }
    },

    // Cập nhật chữ ký số
    updateDigitalSignature: async (signatureData) => {
        try {
            const formData = new FormData()

            if (signatureData.signatureImage) {
                formData.append('signatureImage', signatureData.signatureImage)
            }

            if (signatureData.settings) {
                formData.append('settings', JSON.stringify(signatureData.settings))
            }

            const response = await api.put('/users/digital-signature', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật chữ ký số')
        }
    },

    // Upload file chữ ký
    uploadSignature: async (file) => {
        try {
            const formData = new FormData()
            formData.append('signature', file)

            const response = await api.post('/users/upload-signature', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Lỗi khi tải lên chữ ký')
        }
    }
}

// services/api.js
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor để thêm token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor để handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api