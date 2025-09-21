import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Shield,
    Users,
    User,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Settings,
    Lock,
    Unlock,
    Eye,
    EyeOff
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function AuthorizationPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [activeTab, setActiveTab] = useState('users')
    const [permissions, setPermissions] = useState({})
    const [showPermissionModal, setShowPermissionModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchUsers()
            fetchPermissions()
        }
    }, [user, searchTerm, selectedRole])

    const breadcrumbItems = [
        { name: 'Cấu hình', icon: Settings },
        { name: 'Phân quyền', icon: Shield }
    ]

    const fetchUsers = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockUsers = [
                {
                    _id: '1',
                    fullName: 'Nguyễn Văn A',
                    email: 'nva@cmc.edu.vn',
                    role: 'admin',
                    status: 'active',
                    standardAccess: ['std1', 'std2'],
                    criteriaAccess: ['crt1', 'crt2'],
                    lastLogin: new Date(),
                    createdAt: new Date()
                },
                {
                    _id: '2',
                    fullName: 'Trần Thị B',
                    email: 'ttb@cmc.edu.vn',
                    role: 'manager',
                    status: 'active',
                    standardAccess: ['std1'],
                    criteriaAccess: ['crt1'],
                    lastLogin: new Date(Date.now() - 86400000),
                    createdAt: new Date()
                },
                {
                    _id: '3',
                    fullName: 'Lê Văn C',
                    email: 'lvc@cmc.edu.vn',
                    role: 'staff',
                    status: 'active',
                    standardAccess: [],
                    criteriaAccess: ['crt1'],
                    lastLogin: new Date(Date.now() - 172800000),
                    createdAt: new Date()
                }
            ]

            setUsers(mockUsers)
        } catch (error) {
            toast.error('Lỗi tải danh sách người dùng')
        } finally {
            setLoading(false)
        }
    }

    const fetchPermissions = async () => {
        try {
            const mockPermissions = {
                modules: ['evidence', 'standards', 'criteria', 'experts', 'reports', 'users', 'configuration'],
                actions: ['create', 'read', 'update', 'delete', 'approve', 'sign', 'publish'],
                roles: ['admin', 'manager', 'staff', 'expert']
            }
            setPermissions(mockPermissions)
        } catch (error) {
            console.error('Error fetching permissions:', error)
        }
    }

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-red-100 text-red-800',
            manager: 'bg-blue-100 text-blue-800',
            staff: 'bg-green-100 text-green-800',
            expert: 'bg-purple-100 text-purple-800'
        }
        const labels = {
            admin: 'Quản trị viên',
            manager: 'Quản lý',
            staff: 'Nhân viên',
            expert: 'Chuyên gia'
        }
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
                {labels[role]}
            </span>
        )
    }

    const getStatusIcon = (status) => {
        return status === 'active'
            ? <CheckCircle className="h-4 w-4 text-green-500" />
            : <XCircle className="h-4 w-4 text-red-500" />
    }

    const handleBulkAction = (action) => {
        if (selectedUsers.length === 0) {
            toast.error('Vui lòng chọn ít nhất một người dùng')
            return
        }

        switch (action) {
            case 'activate':
                toast.success(`Đã kích hoạt ${selectedUsers.length} người dùng`)
                break
            case 'deactivate':
                toast.success(`Đã vô hiệu hóa ${selectedUsers.length} người dùng`)
                break
            case 'delete':
                toast.success(`Đã xóa ${selectedUsers.length} người dùng`)
                break
            default:
                break
        }
        setSelectedUsers([])
    }

    const handleEditPermissions = (user) => {
        setSelectedUser(user)
        setShowPermissionModal(true)
    }

    const PermissionMatrix = () => {
        const matrix = {
            admin: {
                evidence: ['create', 'read', 'update', 'delete', 'approve', 'sign', 'publish'],
                standards: ['create', 'read', 'update', 'delete'],
                criteria: ['create', 'read', 'update', 'delete'],
                experts: ['create', 'read', 'update', 'delete'],
                reports: ['create', 'read', 'update', 'delete'],
                users: ['create', 'read', 'update', 'delete'],
                configuration: ['create', 'read', 'update', 'delete']
            },
            manager: {
                evidence: ['create', 'read', 'update', 'approve'],
                standards: ['read'],
                criteria: ['read'],
                experts: ['read'],
                reports: ['create', 'read'],
                users: ['read'],
                configuration: ['read']
            },
            staff: {
                evidence: ['create', 'read', 'update'],
                standards: ['read'],
                criteria: ['read'],
                experts: ['read'],
                reports: ['read'],
                users: [],
                configuration: []
            },
            expert: {
                evidence: ['read', 'approve'],
                standards: ['read'],
                criteria: ['read'],
                experts: ['read'],
                reports: ['read'],
                users: [],
                configuration: []
            }
        }

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ma trận phân quyền</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Vai trò / Module
                            </th>
                            {permissions.modules?.map(module => (
                                <th key={module} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    {module}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {Object.keys(matrix).map(role => (
                            <tr key={role}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getRoleBadge(role)}
                                </td>
                                {permissions.modules?.map(module => (
                                    <td key={module} className="px-6 py-4 text-center">
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {matrix[role][module]?.map(action => (
                                                <span key={action} className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {action}
                                                    </span>
                                            ))}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return (
            <Layout title="Không có quyền truy cập">
                <div className="text-center py-12">
                    <Lock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có quyền truy cập</h3>
                    <p className="mt-1 text-sm text-gray-500">Bạn không có quyền truy cập trang này.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Phân quyền"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý phân quyền</h1>
                    <p className="text-gray-600">Quản lý quyền truy cập người dùng và ma trận phân quyền</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'users'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Users className="h-4 w-4 inline mr-2" />
                            Người dùng
                        </button>
                        <button
                            onClick={() => setActiveTab('matrix')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'matrix'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Shield className="h-4 w-4 inline mr-2" />
                            Ma trận phân quyền
                        </button>
                    </nav>
                </div>

                {activeTab === 'users' ? (
                    <>
                        {/* Filters & Actions */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm người dùng..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả vai trò</option>
                                        <option value="admin">Quản trị viên</option>
                                        <option value="manager">Quản lý</option>
                                        <option value="staff">Nhân viên</option>
                                        <option value="expert">Chuyên gia</option>
                                    </select>

                                    <button
                                        onClick={fetchUsers}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        Lọc
                                    </button>
                                </div>

                                {selectedUsers.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">
                                            Đã chọn {selectedUsers.length} người dùng
                                        </span>
                                        <button
                                            onClick={() => handleBulkAction('activate')}
                                            className="inline-flex items-center px-3 py-1 border border-green-300 rounded text-sm text-green-700 bg-green-50 hover:bg-green-100"
                                        >
                                            <Unlock className="h-3 w-3 mr-1" />
                                            Kích hoạt
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('deactivate')}
                                            className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded text-sm text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                                        >
                                            <Lock className="h-3 w-3 mr-1" />
                                            Vô hiệu hóa
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('delete')}
                                            className="inline-flex items-center px-3 py-1 border border-red-300 rounded text-sm text-red-700 bg-red-50 hover:bg-red-100"
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Xóa
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedUsers(users.map(u => u._id))
                                                        } else {
                                                            setSelectedUsers([])
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Người dùng
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vai trò
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quyền truy cập
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Lần đăng nhập cuối
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thao tác
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((userData) => (
                                            <tr key={userData._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        checked={selectedUsers.includes(userData._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedUsers([...selectedUsers, userData._id])
                                                            } else {
                                                                setSelectedUsers(selectedUsers.filter(id => id !== userData._id))
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8">
                                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <User className="h-4 w-4 text-gray-600" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {userData.fullName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {userData.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getRoleBadge(userData.role)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        <div>Tiêu chuẩn: {userData.standardAccess.length}</div>
                                                        <div>Tiêu chí: {userData.criteriaAccess.length}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {getStatusIcon(userData.status)}
                                                        <span className="ml-2 text-sm text-gray-900">
                                                                {userData.status === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                            </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(userData.lastLogin, 'DD/MM/YYYY HH:mm')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEditPermissions(userData)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button className="text-gray-400 hover:text-gray-600">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <PermissionMatrix />
                )}
            </div>
        </Layout>
    )
}