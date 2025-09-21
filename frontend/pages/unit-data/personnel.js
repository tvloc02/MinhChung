import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import { formatDate, formatNumber } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
    Users,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    User,
    Building,
    Calendar,
    Mail,
    Phone,
    GraduationCap,
    Award,
    BookOpen,
    Download,
    Upload,
    MoreVertical,
    UserCheck,
    UserX,
    Star,
    Briefcase
} from 'lucide-react'

export default function PersonnelPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    // State management
    const [personnel, setPersonnel] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedPersonnel, setSelectedPersonnel] = useState([])

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [currentPerson, setCurrentPerson] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        employeeId: '',
        email: '',
        phoneNumber: '',
        position: '',
        facultyId: '',
        departmentId: '',
        qualifications: [],
        specializations: [],
        workingYears: '',
        dateOfBirth: '',
        dateJoined: '',
        isExpert: false
    })

    // Search and filter
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({
        facultyId: '',
        departmentId: '',
        position: '',
        status: '',
        isExpert: ''
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const itemsPerPage = 10

    // Options
    const [facultyOptions, setFacultyOptions] = useState([])
    const [departmentOptions, setDepartmentOptions] = useState([])

    const positions = [
        { value: 'lecturer', label: 'Giảng viên' },
        { value: 'senior_lecturer', label: 'Giảng viên chính' },
        { value: 'associate_professor', label: 'Phó Giáo sư' },
        { value: 'professor', label: 'Giáo sư' },
        { value: 'staff', label: 'Nhân viên' },
        { value: 'researcher', label: 'Nghiên cứu viên' }
    ]

    const qualificationOptions = [
        'Tiến sĩ',
        'Thạc sĩ',
        'Cử nhân',
        'Kỹ sư',
        'Cao đẳng',
        'Trung cấp'
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchPersonnel()
            fetchFacultyOptions()
        }
    }, [user, currentPage, searchQuery, filters])

    useEffect(() => {
        if (formData.facultyId) {
            fetchDepartmentOptions(formData.facultyId)
        } else {
            setDepartmentOptions([])
            setFormData(prev => ({ ...prev, departmentId: '' }))
        }
    }, [formData.facultyId])

    const breadcrumbItems = [
        { name: 'Dữ liệu đơn vị', href: '/unit-data' },
        { name: 'Nhân sự', icon: Users }
    ]

    const fetchPersonnel = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockPersonnel = [
                {
                    id: '1',
                    fullName: 'TS. Nguyễn Văn A',
                    employeeId: 'GV001',
                    email: 'nguyenvana@cmcu.edu.vn',
                    phoneNumber: '0123456789',
                    position: 'associate_professor',
                    faculty: {
                        id: '1',
                        name: 'Khoa Công nghệ Thông tin',
                        code: 'CNTT'
                    },
                    department: {
                        id: '1',
                        name: 'Bộ môn Khoa học Máy tính',
                        code: 'KHMT'
                    },
                    qualifications: ['Tiến sĩ', 'Thạc sĩ'],
                    specializations: ['Trí tuệ nhân tạo', 'Học máy', 'Xử lý ngôn ngữ tự nhiên'],
                    workingYears: 15,
                    dateOfBirth: '1980-05-15T00:00:00Z',
                    dateJoined: '2010-09-01T00:00:00Z',
                    isExpert: true,
                    status: 'active',
                    createdAt: '2023-01-15T10:00:00Z'
                },
                {
                    id: '2',
                    fullName: 'ThS. Trần Thị B',
                    employeeId: 'GV002',
                    email: 'tranthib@cmcu.edu.vn',
                    phoneNumber: '0987654321',
                    position: 'senior_lecturer',
                    faculty: {
                        id: '1',
                        name: 'Khoa Công nghệ Thông tin',
                        code: 'CNTT'
                    },
                    department: {
                        id: '2',
                        name: 'Bộ môn Kỹ thuật Phần mềm',
                        code: 'KTPM'
                    },
                    qualifications: ['Thạc sĩ'],
                    specializations: ['Kỹ thuật phần mềm', 'Phát triển web', 'Cơ sở dữ liệu'],
                    workingYears: 8,
                    dateOfBirth: '1985-03-20T00:00:00Z',
                    dateJoined: '2015-08-15T00:00:00Z',
                    isExpert: true,
                    status: 'active',
                    createdAt: '2023-01-20T14:30:00Z'
                },
                {
                    id: '3',
                    fullName: 'PGS.TS. Lê Văn C',
                    employeeId: 'GV003',
                    email: 'levanc@cmcu.edu.vn',
                    phoneNumber: '0123987456',
                    position: 'professor',
                    faculty: {
                        id: '2',
                        name: 'Khoa Cơ khí',
                        code: 'CK'
                    },
                    department: {
                        id: '4',
                        name: 'Bộ môn Cơ khí Chế tạo',
                        code: 'CKCT'
                    },
                    qualifications: ['Tiến sĩ', 'Thạc sĩ'],
                    specializations: ['Cơ khí chế tạo máy', 'CAD/CAM', 'Công nghệ gia công'],
                    workingYears: 20,
                    dateOfBirth: '1975-07-10T00:00:00Z',
                    dateJoined: '2005-03-01T00:00:00Z',
                    isExpert: true,
                    status: 'active',
                    createdAt: '2023-01-10T09:00:00Z'
                },
                {
                    id: '4',
                    fullName: 'TS. Phạm Thị D',
                    employeeId: 'GV004',
                    email: 'phamthid@cmcu.edu.vn',
                    phoneNumber: '0987123456',
                    position: 'lecturer',
                    faculty: {
                        id: '3',
                        name: 'Khoa Kinh tế',
                        code: 'KT'
                    },
                    department: null,
                    qualifications: ['Tiến sĩ'],
                    specializations: ['Kinh tế học', 'Quản trị kinh doanh'],
                    workingYears: 6,
                    dateOfBirth: '1988-12-05T00:00:00Z',
                    dateJoined: '2018-01-15T00:00:00Z',
                    isExpert: false,
                    status: 'active',
                    createdAt: '2023-02-01T16:45:00Z'
                },
                {
                    id: '5',
                    fullName: 'Hoàng Văn E',
                    employeeId: 'NV001',
                    email: 'hoangvane@cmcu.edu.vn',
                    phoneNumber: '0123456987',
                    position: 'staff',
                    faculty: {
                        id: '1',
                        name: 'Khoa Công nghệ Thông tin',
                        code: 'CNTT'
                    },
                    department: null,
                    qualifications: ['Cử nhân'],
                    specializations: ['Quản trị hệ thống', 'Mạng máy tính'],
                    workingYears: 3,
                    dateOfBirth: '1990-09-12T00:00:00Z',
                    dateJoined: '2021-06-01T00:00:00Z',
                    isExpert: false,
                    status: 'active',
                    createdAt: '2023-03-01T11:20:00Z'
                }
            ]

            setPersonnel(mockPersonnel)
            setTotalItems(mockPersonnel.length)
            setTotalPages(Math.ceil(mockPersonnel.length / itemsPerPage))

        } catch (error) {
            toast.error('Lỗi tải danh sách nhân sự')
        } finally {
            setLoading(false)
        }
    }

    const fetchFacultyOptions = async () => {
        try {
            // Mock API call
            const mockFaculties = [
                { id: '1', name: 'Khoa Công nghệ Thông tin', code: 'CNTT' },
                { id: '2', name: 'Khoa Cơ khí', code: 'CK' },
                { id: '3', name: 'Khoa Kinh tế', code: 'KT' }
            ]
            setFacultyOptions(mockFaculties)
        } catch (error) {
            console.error('Lỗi tải danh sách khoa:', error)
        }
    }

    const fetchDepartmentOptions = async (facultyId) => {
        try {
            // Mock API call
            const mockDepartments = {
                '1': [
                    { id: '1', name: 'Bộ môn Khoa học Máy tính', code: 'KHMT' },
                    { id: '2', name: 'Bộ môn Kỹ thuật Phần mềm', code: 'KTPM' }
                ],
                '2': [
                    { id: '4', name: 'Bộ môn Cơ khí Chế tạo', code: 'CKCT' },
                    { id: '5', name: 'Bộ môn Cơ khí Động lực', code: 'CKDL' }
                ],
                '3': []
            }
            setDepartmentOptions(mockDepartments[facultyId] || [])
        } catch (error) {
            console.error('Lỗi tải danh sách bộ môn:', error)
        }
    }

    const handleCreate = () => {
        setFormData({
            fullName: '',
            employeeId: '',
            email: '',
            phoneNumber: '',
            position: '',
            facultyId: '',
            departmentId: '',
            qualifications: [],
            specializations: [],
            workingYears: '',
            dateOfBirth: '',
            dateJoined: '',
            isExpert: false
        })
        setShowCreateModal(true)
    }

    const handleEdit = (person) => {
        setCurrentPerson(person)
        setFormData({
            fullName: person.fullName,
            employeeId: person.employeeId,
            email: person.email,
            phoneNumber: person.phoneNumber,
            position: person.position,
            facultyId: person.faculty.id,
            departmentId: person.department?.id || '',
            qualifications: person.qualifications,
            specializations: person.specializations,
            workingYears: person.workingYears,
            dateOfBirth: person.dateOfBirth ? person.dateOfBirth.split('T')[0] : '',
            dateJoined: person.dateJoined ? person.dateJoined.split('T')[0] : '',
            isExpert: person.isExpert
        })
        setShowEditModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            if (currentPerson) {
                toast.success('Cập nhật nhân sự thành công')
                setShowEditModal(false)
            } else {
                toast.success('Tạo nhân sự thành công')
                setShowCreateModal(false)
            }

            fetchPersonnel()
            setCurrentPerson(null)
        } catch (error) {
            toast.error('Lỗi lưu thông tin nhân sự')
        }
    }

    const handleDelete = async () => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500))

            toast.success('Xóa nhân sự thành công')
            setShowDeleteModal(false)
            setCurrentPerson(null)
            fetchPersonnel()
        } catch (error) {
            toast.error('Lỗi xóa nhân sự')
        }
    }

    const handleViewDetail = async (person) => {
        try {
            // Mock API call to get full details
            await new Promise(resolve => setTimeout(resolve, 300))

            setCurrentPerson(person)
            setShowDetailModal(true)
        } catch (error) {
            toast.error('Lỗi tải chi tiết nhân sự')
        }
    }

    const filteredPersonnel = personnel.filter(person => {
        const matchesSearch = !searchQuery ||
            person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            person.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            person.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFaculty = !filters.facultyId || person.faculty.id === filters.facultyId
        const matchesDepartment = !filters.departmentId || person.department?.id === filters.departmentId
        const matchesPosition = !filters.position || person.position === filters.position
        const matchesStatus = !filters.status || person.status === filters.status
        const matchesIsExpert = !filters.isExpert ||
            (filters.isExpert === 'true' ? person.isExpert : !person.isExpert)

        return matchesSearch && matchesFaculty && matchesDepartment && matchesPosition && matchesStatus && matchesIsExpert
    })

    const addQualification = () => {
        setFormData({
            ...formData,
            qualifications: [...formData.qualifications, '']
        })
    }

    const updateQualification = (index, value) => {
        const newQualifications = [...formData.qualifications]
        newQualifications[index] = value
        setFormData({
            ...formData,
            qualifications: newQualifications
        })
    }

    const removeQualification = (index) => {
        setFormData({
            ...formData,
            qualifications: formData.qualifications.filter((_, i) => i !== index)
        })
    }

    const addSpecialization = () => {
        setFormData({
            ...formData,
            specializations: [...formData.specializations, '']
        })
    }

    const updateSpecialization = (index, value) => {
        const newSpecializations = [...formData.specializations]
        newSpecializations[index] = value
        setFormData({
            ...formData,
            specializations: newSpecializations
        })
    }

    const removeSpecialization = (index) => {
        setFormData({
            ...formData,
            specializations: formData.specializations.filter((_, i) => i !== index)
        })
    }

    const PersonnelForm = ({ onSubmit, onClose }) => (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên *
                    </label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập họ và tên..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã nhân viên *
                    </label>
                    <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập mã nhân viên..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@cmcu.edu.vn"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                    </label>
                    <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0123456789"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chức vụ *
                    </label>
                    <select
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Chọn chức vụ...</option>
                        {positions.map(position => (
                            <option key={position.value} value={position.value}>
                                {position.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Khoa *
                    </label>
                    <select
                        value={formData.facultyId}
                        onChange={(e) => setFormData({...formData, facultyId: e.target.value, departmentId: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Chọn khoa...</option>
                        {facultyOptions.map(faculty => (
                            <option key={faculty.id} value={faculty.id}>
                                {faculty.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bộ môn/Ngành
                    </label>
                    <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.facultyId}
                    >
                        <option value="">Chọn bộ môn/ngành...</option>
                        {departmentOptions.map(dept => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số năm kinh nghiệm
                    </label>
                    <input
                        type="number"
                        value={formData.workingYears}
                        onChange={(e) => setFormData({...formData, workingYears: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày sinh
                    </label>
                    <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày vào làm
                    </label>
                    <input
                        type="date"
                        value={formData.dateJoined}
                        onChange={(e) => setFormData({...formData, dateJoined: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Qualifications */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Trình độ chuyên môn
                    </label>
                    <button
                        type="button"
                        onClick={addQualification}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Thêm trình độ
                    </button>
                </div>
                <div className="space-y-2">
                    {formData.qualifications.map((qualification, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <select
                                value={qualification}
                                onChange={(e) => updateQualification(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Chọn trình độ...</option>
                                {qualificationOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => removeQualification(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Specializations */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Chuyên môn
                    </label>
                    <button
                        type="button"
                        onClick={addSpecialization}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Thêm chuyên môn
                    </button>
                </div>
                <div className="space-y-2">
                    {formData.specializations.map((specialization, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={specialization}
                                onChange={(e) => updateSpecialization(index, e.target.value)}
                                placeholder="Nhập chuyên môn..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => removeSpecialization(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expert status */}
            <div>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={formData.isExpert}
                        onChange={(e) => setFormData({...formData, isExpert: e.target.checked})}
                        className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Là chuyên gia</span>
                </label>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                    {currentPerson ? 'Cập nhật' : 'Tạo mới'}
                </button>
            </div>
        </form>
    )

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
            title="Quản lý Nhân sự"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân sự</h1>
                        <p className="text-gray-600 mt-1">Quản lý thông tin nhân sự của trường</p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Download className="h-4 w-4 mr-2" />
                            Xuất Excel
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Upload className="h-4 w-4 mr-2" />
                            Nhập Excel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm nhân sự
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm nhân sự..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={filters.facultyId}
                                onChange={(e) => {
                                    setFilters({...filters, facultyId: e.target.value, departmentId: ''})
                                    if (e.target.value) {
                                        fetchDepartmentOptions(e.target.value)
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả khoa</option>
                                {facultyOptions.map(faculty => (
                                    <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.departmentId}
                                onChange={(e) => setFilters({...filters, departmentId: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!filters.facultyId}
                            >
                                <option value="">Tất cả bộ môn</option>
                                {departmentOptions.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.position}
                                onChange={(e) => setFilters({...filters, position: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả chức vụ</option>
                                {positions.map(position => (
                                    <option key={position.value} value={position.value}>{position.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.isExpert}
                                onChange={(e) => setFilters({...filters, isExpert: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="true">Chuyên gia</option>
                                <option value="false">Không phải chuyên gia</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng nhân sự</p>
                                <p className="text-2xl font-semibold text-gray-900">{personnel.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <GraduationCap className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Giảng viên</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {personnel.filter(p => ['lecturer', 'senior_lecturer', 'associate_professor', 'professor'].includes(p.position)).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Star className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Chuyên gia</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {personnel.filter(p => p.isExpert).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Award className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tiến sĩ</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {personnel.filter(p => p.qualifications.includes('Tiến sĩ')).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Briefcase className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Nhân viên</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {personnel.filter(p => p.position === 'staff').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personnel Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nhân sự
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Đơn vị
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Chức vụ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trình độ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Liên hệ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPersonnel.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                filteredPersonnel.map(person => (
                                    <tr key={person.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                    <User className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {person.fullName}
                                                        </div>
                                                        {person.isExpert && (
                                                            <Star className="h-4 w-4 text-yellow-500 ml-2" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {person.employeeId}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {person.faculty.name}
                                                </div>
                                                {person.department && (
                                                    <div className="text-sm text-gray-500">
                                                        {person.department.name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    person.position === 'professor' ? 'bg-purple-100 text-purple-800' :
                                                        person.position === 'associate_professor' ? 'bg-blue-100 text-blue-800' :
                                                            person.position === 'senior_lecturer' ? 'bg-green-100 text-green-800' :
                                                                person.position === 'lecturer' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {positions.find(p => p.value === person.position)?.label}
                                                </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {person.qualifications.slice(0, 2).map(qualification => (
                                                    <span
                                                        key={qualification}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                                    >
                                                            {qualification}
                                                        </span>
                                                ))}
                                                {person.qualifications.length > 2 && (
                                                    <span className="text-xs text-gray-500">
                                                            +{person.qualifications.length - 2}
                                                        </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    {person.email}
                                                </div>
                                                {person.phoneNumber && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone className="h-3 w-3 mr-1" />
                                                        {person.phoneNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    person.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {person.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'}
                                                </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetail(person)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(person)}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCurrentPerson(person)
                                                        setShowDeleteModal(true)
                                                    }}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-gray-200 px-6 py-3">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Create Personnel Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Thêm nhân sự mới"
                    size="large"
                >
                    <PersonnelForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowCreateModal(false)}
                    />
                </Modal>

                {/* Edit Personnel Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa nhân sự"
                    size="large"
                >
                    <PersonnelForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowEditModal(false)}
                    />
                </Modal>

                {/* Personnel Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết nhân sự"
                    size="large"
                >
                    {currentPerson && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        {currentPerson.fullName}
                                        {currentPerson.isExpert && (
                                            <Star className="inline h-5 w-5 text-yellow-500 ml-2" />
                                        )}
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Mã nhân viên:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.employeeId}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Email:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Số điện thoại:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.phoneNumber || 'Chưa có'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Chức vụ:</span>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {positions.find(p => p.value === currentPerson.position)?.label}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Đơn vị công tác</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Khoa:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.faculty.name}</p>
                                        </div>
                                        {currentPerson.department && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Bộ môn/Ngành:</span>
                                                <p className="mt-1 text-sm text-gray-900">{currentPerson.department.name}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Số năm kinh nghiệm:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentPerson.workingYears} năm</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Ngày vào làm:</span>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {formatDate(currentPerson.dateJoined)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Qualifications */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Trình độ chuyên môn</h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentPerson.qualifications.map(qualification => (
                                        <span
                                            key={qualification}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                        >
                                            {qualification}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Specializations */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Lĩnh vực chuyên môn</h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentPerson.specializations.map((specialization, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                        >
                                            {specialization}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Ngày sinh:</span>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {formatDate(currentPerson.dateOfBirth)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Trạng thái chuyên gia:</span>
                                        <p className="mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                currentPerson.isExpert
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {currentPerson.isExpert ? 'Là chuyên gia' : 'Không phải chuyên gia'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Xác nhận xóa"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Bạn có chắc chắn muốn xóa nhân sự <strong>{currentPerson?.fullName}</strong>?
                        </p>
                        <p className="text-sm text-red-600">
                            Hành động này không thể hoàn tác.
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    )
}