import { useRouter } from 'next/router'
import {
    BarChart3,
    FileText,
    Upload,
    Download,
    FolderTree,
    BookOpen,
    Settings,
    TrendingUp,
    User,
    ChevronDown
} from 'lucide-react'

export default function Sidebar({ open, onClose }) {
    const router = useRouter()

    const sidebarItems = [
        { name: 'Trang chủ', icon: BarChart3, path: '/dashboard', active: router.pathname === '/dashboard' },
        {
            name: 'Minh chứng',
            icon: FileText,
            path: '/evidence-management',
            hasSubmenu: true,
            active: router.pathname.includes('/evidence')
        },
        { name: 'Cây minh chứng', icon: FolderTree, path: '/evidence-tree' },
        { name: 'Import minh chứng', icon: Upload, path: '/import-evidence' },
        { name: 'Cấp đánh giá', icon: BookOpen, path: '/assessment-levels' },
        { name: 'Tổ chức', icon: Settings, path: '/organizations' },
        { name: 'Chương trình đánh giá', icon: BookOpen, path: '/program-management' },
        { name: 'Tiêu chuẩn', icon: BookOpen, path: '/standards' },
        { name: 'Tiêu chí', icon: BookOpen, path: '/criteria' },
        { name: 'Báo cáo tự đánh giá', icon: TrendingUp, path: '/reports' },
        { name: 'Chuyên gia đánh giá', icon: User, path: '/user-management' }
    ]

    const handleNavigation = (path) => {
        router.push(path)
        onClose && onClose()
    }

    return (
        <>
            {/* Overlay for mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`${
                open ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:transform-none`}>
                <div className="flex flex-col h-full">
                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {sidebarItems.map((item, index) => (
                            <div key={index}>
                                <button
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        item.active
                                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                    {item.hasSubmenu && <ChevronDown className="h-4 w-4 ml-auto" />}
                                </button>
                            </div>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            © 2025 CMC University
                        </p>
                    </div>
                </div>
            </aside>
        </>
    )
}