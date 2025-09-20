import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import { ConfirmModal } from '../components/common/Modal'
import Modal from '../components/common/Modal'
import Pagination from '../components/common/Pagination'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
    FileSignature,
    Shield,
    Download,
    Search,
    Filter,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    Settings,
    User,
    Calendar,
    FileText,
    Plus
} from 'lucide-react'

export default function EvidenceSigningPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [evidences, setEvidences] = useState([])
    const [signingConfigs, setSigningConfigs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // Modal states
    const [showSignModal, setShowSignModal] = useState(false)
    const [showBulkSignModal, setShowBulkSignModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [selectedEvidences, setSelectedEvidences] = useState([])
    const [signingEvidence, setSigningEvidence] = useState(null)
    const [signingHistory, setSigningHistory] = useState([])

    // Signing form state
    const [signingForm, setSigningForm] = useState({
        signingConfigId: '',
        password: '',
        reason: '',
        position: { x: 100, y: 100 }
    })
    const [signing, setSigning] = useState(false)

    const itemsPerPage = 10

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchEvidences()
            fetchSigningConfigs()
        }
    }, [user, searchQuery, selectedStatus, currentPage])

    const breadcrumbItems = [
        { name: 'Ký số minh chứng', icon: FileSignature }
    ]

    const fetchEvidences = async () => {
        try {
            setLoading(true)
            // Mock API call - replace with actual service
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockEvidences = [
                {
                    id: '1',
                    code: 'H1.01.02.15',
                    name: 'Báo cáo kết quả học tập sinh viên K65',
                    status: 'pending_signature',
                    standardName: 'Chất lượng sinh viên đầu vào',
                    criteriaName: 'Kết quả học tập',
                    createdBy: 'Nguyễn Văn A',
                    createdAt: '2024-12-25T10:30:00Z',
                    files: [
                        { id: '1', name: 'bao-cao-hoc-tap.pdf', size: 2048000, isSigned: false }
                    ],
                    signingHistory: []
                },
                {
                    id: '2',
                    code: 'H1.01.02.16',
                    name: 'Danh sách sinh viên tốt nghiệp loại xuất sắc',
                    status: 'signed',
                    standardName: 'Chất lượng sinh viên đầu vào',
                    criteriaName: 'Kết quả học tập',
                    createdBy: 'Trần Thị B',
                    createdAt: '2024-12-24T09:15:00Z',
                    files: [
                        { id: '2', name: 'danh-sach-sv-xuat-sac.pdf', size: 1024000, isSigned: true }
                    ],
                    signingHistory: [
                        {
                            signerName: 'Phạm Văn C',
                            signedAt: '2024-12-24T15:30:00Z',
                            reason: 'Phê duyệt danh sách sinh viên xuất sắc'
                        }
                    ]
                }
            ]

            // Apply filters
            let filteredEvidences = mockEvidences
            if (searchQuery) {
                filteredEvidences = mockEvidences.filter(evidence =>
                    evidence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    evidence.code.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }
            if (selectedStatus) {
                filteredEvidences = filteredEvidences.filter(evidence => evidence.status === selectedStatus)
            }

            setEvidences(filteredEvidences)
            setTotalPages(Math.ceil(filteredEvidences.length / itemsPerPage))
            setTotalItems(filteredEvidences.length)
        } catch (error) {
            toast.error('Lỗi tải danh sách minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const fetchSigningConfigs = async () => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 300))

            const mockConfigs = [
                {
                    id: '1',
                    name: 'Chữ ký điện tử Trưởng phòng',
                    type: 'certificate',
                    signerName: 'Nguyễn Văn X',
                    validTo: '2025-12-31T23:59:59Z'
                },
                {
                    id: '2',
                    name: 'Chữ ký điện tử Phó Hiệu trưởng',
                    type: 'certificate',
                    signerName: 'Trần Thị Y',
                    validTo: '2025-12-31T23:59:59Z'
                }
            ]

            setSigningConfigs(mockConfigs)
        } catch (error) {
            toast.error('Lỗi tải cấu hình ký số')
        }
    }

    const handleSignEvidence = async (evidence) => {
        setSigningEvidence(evidence)
        setSigningForm({
            signingConfigId: '',
            password: '',
            reason: '',
            position: { x: 100, y: 100 }
        })
        setShowSignModal(true)
    }

    const handleBulkSign = () => {
        if (selectedEvidences.length === 0) {
            toast.error('Vui lòng chọn ít nhất một minh chứng')
            return
        }
        setShowBulkSignModal(true)
    }

    const performSigning = async (e) => {
        e.preventDefault()

        if (!signingForm.signingConfigId) {
            toast.error('Vui lòng chọn cấu hình ký số')
            return
        }

        if (!signingForm.password) {
            toast.error('Vui lòng nhập mật khẩu')
            return
        }

        try {
            setSigning(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            toast.success('Ký số minh chứng thành công')
            setShowSignModal(false)
            setShowBulkSignModal(false)
            setSelectedEvidences([])
            fetchEvidences()
        } catch (error) {
            toast.error('Lỗi ký số minh chứng')
        } finally {
            setSigning(false)
        }
    }

    const handleViewHistory = async (evidence) => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const mockHistory = [
                {
                    id: '1',
                    action: 'sign',
                    signerName: 'Nguyễn Văn A',
                    timestamp: '2024-12-25T10:30:00Z',
                    reason: 'Phê duyệt minh chứng',
                    status: 'success'
                }
            ]

            setSigningHistory(mockHistory)
            setShowHistoryModal(true)
        } catch (error) {
            toast.error('Lỗi tải lịch sử ký')
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending_signature: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ ký', icon: Clock },
            signed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã ký', icon: CheckCircle },
            signature_failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ký thất bại', icon: AlertCircle }
        }

        const config = statusConfig[status] || statusConfig.pending_signature
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </span>
        )
    }

    const formatFileSize = (bytes) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (bytes === 0) return '0 Bytes'
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title="Ký số minh chứng"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Ký số minh chứng</h1>
                        <p className="text-gray-600 mt-1">Ký số điện tử cho các minh chứng chất lượng</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {selectedEvidences.length > 0 && (
                            <button
                                onClick={handleBulkSign}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                                <FileSignature className="h-4 w-4 mr-2" />
                                Ký hàng loạt ({selectedEvidences.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm theo tên, mã minh chứng..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending_signature">Chờ ký</option>
                            <option value="signed">Đã ký</option>
                            <option value="signature_failed">Ký thất bại</option>
                        </select>
                    </div>
                </div>

                {/* Evidence List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Danh sách minh chứng ({totalItems})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    ) : evidences.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không có minh chứng nào
                            </h3>
                            <p className="text-gray-500">
                                Không tìm thấy minh chứng phù hợp với bộ lọc hiện tại
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {evidences.map(evidence => (
                                <div key={evidence.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedEvidences.includes(evidence.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedEvidences([...selectedEvidences, evidence.id])
                                                    } else {
                                                        setSelectedEvidences(selectedEvidences.filter(id => id !== evidence.id))
                                                    }
                                                }}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        {evidence.name}
                                                    </h4>
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        ({evidence.code})
                                                    </span>
                                                    {getStatusBadge(evidence.status)}
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <span>{evidence.standardName}</span>
                                                    <span>•</span>
                                                    <span>{evidence.criteriaName}</span>
                                                    <span>•</span>
                                                    <span>{evidence.files.length} file</span>
                                                    <span>•</span>
                                                    <span>{formatDate(evidence.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleViewHistory(evidence)}
                                                className="text-gray-600 hover:text-gray-800 p-2"
                                                title="Xem lịch sử ký"
                                            >
                                                <Clock className="h-4 w-4" />
                                            </button>
                                            {evidence.status === 'pending_signature' && (
                                                <button
                                                    onClick={() => handleSignEvidence(evidence)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <FileSignature className="h-3 w-3 mr-1" />
                                                    Ký số
                                                </button>
                                            )}
                                            {evidence.status === 'signed' && (
                                                <button
                                                    className="inline-flex items-center px-3 py-1 border border-green-300 text-xs font-medium rounded text-green-700 bg-green-50"
                                                >
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Đã ký
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Files */}
                                    <div className="mt-3 ml-8">
                                        {evidence.files.map(file => (
                                            <div key={file.id} className="flex items-center justify-between py-1">
                                                <div className="flex items-center space-x-2">
                                                    <FileText className="h-3 w-3 text-gray-400" />
                                                    <span className="text-xs text-gray-600">{file.name}</span>
                                                    <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                                                    {file.isSigned && (
                                                        <Shield className="h-3 w-3 text-green-500" title="Đã ký số" />
                                                    )}
                                                </div>
                                                <button className="text-blue-600 hover:text-blue-800 text-xs">
                                                    <Download className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>

                {/* Sign Modal */}
                <Modal
                    isOpen={showSignModal}
                    onClose={() => setShowSignModal(false)}
                    title="Ký số minh chứng"
                    size="large"
                >
                    {signingEvidence && (
                        <form onSubmit={performSigning} className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">{signingEvidence.name}</h4>
                                <p className="text-sm text-gray-600">Mã: {signingEvidence.code}</p>
                                <p className="text-sm text-gray-600">Số file: {signingEvidence.files.length}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cấu hình ký số *
                                </label>
                                <select
                                    value={signingForm.signingConfigId}
                                    onChange={(e) => setSigningForm({ ...signingForm, signingConfigId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Chọn cấu hình ký số</option>
                                    {signingConfigs.map(config => (
                                        <option key={config.id} value={config.id}>
                                            {config.name} - {config.signerName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu *
                                </label>
                                <input
                                    type="password"
                                    value={signingForm.password}
                                    onChange={(e) => setSigningForm({ ...signingForm, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lý do ký
                                </label>
                                <textarea
                                    value={signingForm.reason}
                                    onChange={(e) => setSigningForm({ ...signingForm, reason: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập lý do ký số..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSignModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={signing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {signing ? 'Đang ký...' : 'Ký số'}
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>

                {/* Bulk Sign Modal */}
                <Modal
                    isOpen={showBulkSignModal}
                    onClose={() => setShowBulkSignModal(false)}
                    title="Ký hàng loạt minh chứng"
                    size="large"
                >
                    <form onSubmit={performSigning} className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                                <p className="text-sm text-yellow-700">
                                    Bạn đang ký {selectedEvidences.length} minh chứng cùng lúc.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cấu hình ký số *
                            </label>
                            <select
                                value={signingForm.signingConfigId}
                                onChange={(e) => setSigningForm({ ...signingForm, signingConfigId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Chọn cấu hình ký số</option>
                                {signingConfigs.map(config => (
                                    <option key={config.id} value={config.id}>
                                        {config.name} - {config.signerName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu *
                            </label>
                            <input
                                type="password"
                                value={signingForm.password}
                                onChange={(e) => setSigningForm({ ...signingForm, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lý do ký hàng loạt
                            </label>
                            <textarea
                                value={signingForm.reason}
                                onChange={(e) => setSigningForm({ ...signingForm, reason: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập lý do ký số hàng loạt..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowBulkSignModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={signing}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {signing ? 'Đang ký...' : 'Ký hàng loạt'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* History Modal */}
                <Modal
                    isOpen={showHistoryModal}
                    onClose={() => setShowHistoryModal(false)}
                    title="Lịch sử ký số"
                    size="large"
                >
                    {signingHistory.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Chưa có lịch sử ký số</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {signingHistory.map(history => (
                                <div key={history.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">{history.signerName}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDate(history.timestamp, { format: 'datetime' })}</span>
                                        </div>
                                    </div>
                                    {history.reason && (
                                        <p className="text-sm text-gray-600 mt-2">{history.reason}</p>
                                    )}
                                    <div className="mt-2">
                                        {history.status === 'success' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Thành công
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                Thất bại
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    )
}