const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check for token in cookies (if using cookies)
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập. Vui lòng đăng nhập'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

            // Get user from token with full details
            const user = await User.findById(decoded.userId)
                .populate('facultyId', 'name code')
                .populate('departmentId', 'name code')
                .populate('userGroups', 'name code permissions signingPermissions')
                .populate('positions.department', 'name code')
                .select('-password -resetPasswordToken -resetPasswordExpires -loginAttempts -lockUntil');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ. Người dùng không tồn tại'
                });
            }

            if (user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
                });
            }

            // Check if user is locked
            if (user.isLocked) {
                return res.status(423).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần'
                });
            }

            // Calculate effective permissions
            const effectivePermissions = calculateEffectivePermissions(user);

            // Add user to request object with enriched data
            req.user = {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
                facultyId: user.facultyId,
                departmentId: user.departmentId,
                positions: user.positions,
                activePositions: user.activePositions,
                mainPosition: user.mainPosition,
                userGroups: user.userGroups,
                hasDigitalSignature: user.hasDigitalSignature,
                canSignDocuments: user.canSignDocuments(),
                effectivePermissions,
                // Helper methods
                hasPermission: (module, action) => checkPermission(effectivePermissions, module, action),
                hasAnyPermission: (module) => hasAnyModulePermission(effectivePermissions, module),
                canAccessModule: (module) => canAccessModule(effectivePermissions, module),
                isInFaculty: (facultyId) => user.facultyId && user.facultyId._id.toString() === facultyId,
                isInDepartment: (departmentId) => user.departmentId && user.departmentId._id.toString() === departmentId,
                hasPosition: (position) => user.activePositions.some(p => p.title === position)
            };

            next();

        } catch (tokenError) {
            console.error('Token verification error:', tokenError);
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống xác thực'
        });
    }
};

// Calculate effective permissions from groups and individual permissions
const calculateEffectivePermissions = (user) => {
    let effectivePermissions = {};

    // Start with group permissions
    if (user.userGroups && user.userGroups.length > 0) {
        user.userGroups.forEach(group => {
            if (group.permissions) {
                group.permissions.forEach(perm => {
                    if (!effectivePermissions[perm.module]) {
                        effectivePermissions[perm.module] = {
                            view: false,
                            create: false,
                            edit: false,
                            delete: false
                        };
                    }

                    // Merge permissions (OR operation - grant if any group grants)
                    Object.keys(perm.actions).forEach(action => {
                        if (perm.actions[action]) {
                            effectivePermissions[perm.module][action] = true;
                        }
                    });
                });
            }
        });
    }

    // Override with individual permissions (takes precedence)
    if (user.individualPermissions && user.individualPermissions.length > 0) {
        user.individualPermissions.forEach(perm => {
            if (!effectivePermissions[perm.module]) {
                effectivePermissions[perm.module] = {
                    view: false,
                    create: false,
                    edit: false,
                    delete: false
                };
            }

            // Individual permissions override group permissions
            Object.keys(perm.actions).forEach(action => {
                effectivePermissions[perm.module][action] = perm.actions[action];
            });
        });
    }

    return effectivePermissions;
};

// Check specific permission
const checkPermission = (permissions, module, action) => {
    return permissions[module] && permissions[module][action] === true;
};

// Check if user has any permission in a module
const hasAnyModulePermission = (permissions, module) => {
    if (!permissions[module]) return false;
    return Object.values(permissions[module]).some(Boolean);
};

// Check if user can access a module (at least view permission)
const canAccessModule = (permissions, module) => {
    return permissions[module] && permissions[module].view === true;
};

// Authorize specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Vai trò ${req.user.role} không có quyền truy cập tài nguyên này`
            });
        }

        next();
    };
};

// Check module permission
const requirePermission = (module, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        // Admin has all permissions
        if (req.user.role === 'admin') {
            return next();
        }

        if (!req.user.hasPermission(module, action)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền ${action} trong module ${module}`
            });
        }

        next();
    };
};

// Check module access (at least view permission)
const requireModuleAccess = (module) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        // Admin has all access
        if (req.user.role === 'admin') {
            return next();
        }

        if (!req.user.canAccessModule(module)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền truy cập module ${module}`
            });
        }

        next();
    };
};

// Check position requirement
const requirePosition = (...positions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        // Admin bypasses position check
        if (req.user.role === 'admin') {
            return next();
        }

        const hasRequiredPosition = positions.some(position => req.user.hasPosition(position));

        if (!hasRequiredPosition) {
            return res.status(403).json({
                success: false,
                message: `Chức vụ của bạn không có quyền thực hiện thao tác này`
            });
        }

        next();
    };
};

// Check faculty access
const requireFacultyAccess = (req, res, next) => {
    try {
        const { facultyId } = req.params;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        // Admin has access to all faculties
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user belongs to the faculty
        if (!req.user.isInFaculty(facultyId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập khoa này'
            });
        }

        next();
    } catch (error) {
        console.error('Faculty access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống kiểm tra quyền truy cập'
        });
    }
};

// Check department access
const requireDepartmentAccess = (req, res, next) => {
    try {
        const { departmentId } = req.params;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        // Admin has access to all departments
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user belongs to the department
        if (!req.user.isInDepartment(departmentId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập bộ môn này'
            });
        }

        next();
    } catch (error) {
        console.error('Department access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống kiểm tra quyền truy cập'
        });
    }
};

// Check signing permission
const requireSigningPermission = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Không có quyền truy cập'
        });
    }

    if (!req.user.canSignDocuments) {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền ký tài liệu'
        });
    }

    // Check if user has signing permission from groups
    const hasSigningPermission = req.user.userGroups.some(group =>
        group.signingPermissions && group.signingPermissions.canSign
    );

    if (!hasSigningPermission) {
        return res.status(403).json({
            success: false,
            message: 'Nhóm của bạn không có quyền ký tài liệu'
        });
    }

    next();
};

// Optional auth - don't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
                const user = await User.findById(decoded.userId)
                    .populate('facultyId', 'name code')
                    .populate('departmentId', 'name code')
                    .populate('userGroups', 'name code permissions')
                    .select('-password -resetPasswordToken -resetPasswordExpires -loginAttempts -lockUntil');

                if (user && user.status === 'active' && !user.isLocked) {
                    const effectivePermissions = calculateEffectivePermissions(user);

                    req.user = {
                        id: user._id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        effectivePermissions,
                        hasPermission: (module, action) => checkPermission(effectivePermissions, module, action)
                    };
                }
            } catch (tokenError) {
                // Token invalid, but don't fail - just continue without user
                console.log('Optional auth: Invalid token, continuing without user');
            }
        }

        next();
    } catch (error) {
        // Don't fail on optional auth
        next();
    }
};

// Rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get user's requests
        const userRequests = requests.get(userId) || [];

        // Filter requests within window
        const recentRequests = userRequests.filter(time => time > windowStart);

        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau'
            });
        }

        // Add current request
        recentRequests.push(now);
        requests.set(userId, recentRequests);

        // Clean up old entries periodically
        if (Math.random() < 0.01) { // 1% chance
            for (const [userId, times] of requests.entries()) {
                const filtered = times.filter(time => time > windowStart);
                if (filtered.length === 0) {
                    requests.delete(userId);
                } else {
                    requests.set(userId, filtered);
                }
            }
        }

        next();
    };
};

// Admin only access
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có quyền truy cập'
        });
    }
    next();
};

// Manager or admin access
const requireManagerOrAdmin = (req, res, next) => {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin hoặc manager mới có quyền truy cập'
        });
    }
    next();
};

// Check ownership or admin
const requireOwnershipOrAdmin = (userIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        const resourceUserId = req.params[userIdField] || req.body[userIdField];

        if (req.user.role === 'admin' || req.user.id === resourceUserId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Bạn chỉ có thể truy cập tài nguyên của chính mình'
        });
    };
};

module.exports = {
    protect,
    authorize,
    requirePermission,
    requireModuleAccess,
    requirePosition,
    requireFacultyAccess,
    requireDepartmentAccess,
    requireSigningPermission,
    optionalAuth,
    userRateLimit,
    requireAdmin,
    requireManagerOrAdmin,
    requireOwnershipOrAdmin,
    // Legacy exports for backward compatibility
    checkStandardAccess: requireModuleAccess,
    checkCriteriaAccess: requireModuleAccess
};