import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

if (typeof window !== 'undefined') {
    axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
}
axios.defaults.headers.common['Content-Type'] = 'application/json'

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [token, setToken] = useState(null)
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedToken = localStorage.getItem('token')
            if (savedToken) {
                setToken(savedToken)
                axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
            }
        }
    }, [])

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
            delete axios.defaults.headers.common['Authorization']
        }
    }, [token])

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        if (typeof window === 'undefined') {
            setIsLoading(false)
            return
        }

        const savedToken = localStorage.getItem('token')
        if (!savedToken) {
            setIsLoading(false)
            return
        }

        try {
            setToken(savedToken)
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`

            const response = await axios.get('/api/auth/me')
            if (response.data.success) {
                setUser(response.data.data)
            } else {
                localStorage.removeItem('token')
                setToken(null)
                delete axios.defaults.headers.common['Authorization']
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
            }
            setToken(null)
            delete axios.defaults.headers.common['Authorization']
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            setIsLoading(true)

            const response = await axios.post('/api/auth/login', {
                email,
                password
            })

            if (response.data.success) {
                const { token: newToken, user: userData } = response.data.data

                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', newToken)
                }
                setToken(newToken)
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
                setUser(userData)

                toast.success('Đăng nhập thành công!')
                return { success: true }
            } else {
                toast.error(response.data.message || 'Đăng nhập thất bại')
                return { success: false, message: response.data.message }
            }
        } catch (error) {
            console.error('Login error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi kết nối mạng'
            toast.error(errorMessage)
            return { success: false, message: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout')
        } catch (error) {
            console.error('Logout API error:', error)
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token')
            }
            setToken(null)
            setUser(null)
            delete axios.defaults.headers.common['Authorization']
            toast.success('Đã đăng xuất')
            router.push('/login')
        }
    }

    const value = {
        user,
        token,
        isLoading,
        login,
        logout,
        checkAuth
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}