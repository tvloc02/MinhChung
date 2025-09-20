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

            // Get user from token
            const user = await User.findById(decoded.userId)
                .select('-password -resetPasswordToken -resetPasswordExpires');

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

            // Add user to request object
            req.user = {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
                standardAccess: user.standardAccess,
                criteriaAccess: user.criteriaAccess
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

// Check if user has access to specific standard
const checkStandardAccess = (req, res, next) => {
    try {
        const { standardId } = req.params;

        // Admin has access to everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user has access to this standard
        if (!req.user.standardAccess || !req.user.standardAccess.includes(standardId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tiêu chuẩn này'
            });
        }

        next();
    } catch (error) {
        console.error('Standard access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống kiểm tra quyền truy cập'
        });
    }
};

// Check if user has access to specific criteria
const checkCriteriaAccess = (req, res, next) => {
    try {
        const { criteriaId } = req.params;

        // Admin has access to everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user has access to this criteria
        if (!req.user.criteriaAccess || !req.user.criteriaAccess.includes(criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tiêu chí này'
            });
        }

        next();
    } catch (error) {
        console.error('Criteria access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống kiểm tra quyền truy cập'
        });
    }
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
                    .select('-password -resetPasswordToken -resetPasswordExpires');

                if (user && user.status === 'active') {
                    req.user = {
                        id: user._id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        status: user.status
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

module.exports = {
    protect,
    authorize,
    checkStandardAccess,
    checkCriteriaAccess,
    optionalAuth,
    userRateLimit
};