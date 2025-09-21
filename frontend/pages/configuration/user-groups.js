import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Users,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    User,
    Settings,
    Shield,
    Eye,
    UserPlus,
    UserMinus
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function UserGroupsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [userGroups, setUserGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState(null)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchUserGroups()
        }
    }, [user, searchTerm, selectedStatus, currentPage])

    const breadcrumbItems = [
        { name: 'Cấu hình', icon: Settings },
        { name: 'Nhóm người dùng', icon: Users }
    ]

    const fetchUserGroups = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockGroups = [
                {
                    _id: '1',
                    name: 'Quản trị viên hệ thống',
                    code: 'ADMIN',
                    description: 'Nhóm quản trị viên có toàn quyền hệ thống',
                    status: 'active',
                    memberCount: 3,
                    permissions: [
                        { module: 'evidence', actions: ['create', 'read', 'update', 'delete', 'approve'] },
                        { module: 'users', actions: ['create', 'read', 'update', 'delete'] }
                    ],
                    createdAt: new Date(),
                    createdBy: { fullName: 'Admin' }
                },
                {
                    _id: '2',
                    name: 'Giảng viên khoa CNTT',
                    code: 'CNTT_FACULTY',
                    description: 'Nhóm giảng viên khoa Công nghệ thông tin',
                    status: 'active',
                    memberCount: 15,
                    permissions: [
                        { module: 'evidence', actions: ['create', 'read', 'update'] },
                        { module: 'standards', actions: ['read'] }
                    ],
                    createdAt: new Date(),
                    createdBy: { fullName: 'Nguyễn Văn A' }
                },
                {
                    _id: '3',
                    name: 'Nhân viên phòng ĐBCL',
                    code: 'QA_STAFF',
                    description: 'Nhóm nhân viên phòng Đảm bảo chất lượng',
                    status: 'active',
                    memberCount: 8,
                    permissions: [
                        { module: 'evidence', actions: ['create', 'read', 'update', 'approve'] },
                        { module: 'reports', actions: ['create', 'read'] }
                    ],
                    createdAt: new Date(),
                    createdBy: { fullName: 'Trần Thị B' }
                }
            ]

            setUserGroups(mockGroups)
            setTotalPages(1)
        } catch (error) {
            toast.error('Lỗi tải danh sách nhóm người dùng')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
            }`}>
                {status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
            </span>
        )
    }

    const handleViewDetail = (group) => {
        setSelectedGroup(group)
        setShowDetailModal(true)
    }

    const handleDeleteGroup = async (groupId) => {
        if (confirm('Bạn có chắc chắn muốn xóa nhóm này?')) {
            try {
                toast.success('Xóa nhóm người dùng thành công')
                fetchUserGroups()
            } catch (error) {
                toast.error('Lỗi khi xóa nhóm người dùng')
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <Layout
            title="Nhóm người dùng"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nhóm người dùng</h1>
                        <p className="text-gray-600">Quản lý nhóm người dùng và phân quyền theo nhóm</p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo nhóm mới
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhóm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Ngừng hoạt động</option>
                        </select>

                        <div></div>

                        <button
                            onClick={fetchUserGroups}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Lọc
                        </button>
                    </div>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : userGroups.length > 0 ? (
                        userGroups.map((group) => (
                            <div key={group._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Users className="h-5 w-5 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                                            <p className="text-sm text-gray-500">{group.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleViewDetail(group)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGroup(group._id)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">{group.description}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <User className="h-4 w-4 mr-1" />
                                            {group.memberCount} thành viên
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Shield className="h-4 w-4 mr-1" />
                                            {group.permissions.length} quyền
                                        </div>
                                    </div>
                                    {getStatusBadge(group.status)}
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                    <span>Tạo bởi {group.createdBy.fullName}</span>
                                    <span>{formatDate(group.createdAt, 'DD/MM/YYYY')}</span>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                                    <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Thêm thành viên
                                    </button>
                                    <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                        <Settings className="h-4 w-4 mr-1" />
                                        Cấu hình
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có nhóm người dùng</h3>
                            <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo nhóm người dùng mới.</p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tạo nhóm mới
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Trang {currentPage} / {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}

                {/* Group Detail Modal */}
                {showDetailModal && selectedGroup && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="flex items-center justify-between pb-3">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Chi tiết nhóm: {selectedGroup.name}
                                </h3>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Thông tin cơ bản</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Mã nhóm:</span>
                                            <span className="ml-2 font-medium">{selectedGroup.code}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Trạng thái:</span>
                                            <span className="ml-2">{getStatusBadge(selectedGroup.status)}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Mô tả:</span>
                                            <span className="ml-2">{selectedGroup.description}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Quyền hạn</h4>
                                    <div className="space-y-2">
                                        {selectedGroup.permissions.map((permission, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="font-medium text-sm">{permission.module}</span>
                                                <div className="flex space-x-1">
                                                    {permission.actions.map((action, actionIndex) => (
                                                        <span key={actionIndex} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {action}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end pt-4 space-x-2">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Đóng
                                </button>
                                <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                    Chỉnh sửa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}