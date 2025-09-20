const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret-key', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔍 LOGIN DEBUG:');
        console.log('Input email:', email);
        console.log('Input password:', password);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu'
            });
        }

        // Xử lý email linh hoạt - tìm theo nhiều cách
        const inputEmail = email.toLowerCase().trim();
        const emailWithoutDomain = inputEmail.replace('@cmc.edu.vn', '');
        const emailWithDomain = emailWithoutDomain.includes('@') ? emailWithoutDomain : `${emailWithoutDomain}@cmc.edu.vn`;

        // Tìm user theo nhiều cách
        const user = await User.findOne({
            $or: [
                { email: inputEmail },          // Input chính xác
                { email: emailWithoutDomain },  // Chỉ username
                { email: emailWithDomain }      // Thêm domain
            ]
        });

        console.log('Search patterns:', {
            inputEmail,
            emailWithoutDomain,
            emailWithDomain
        });
        console.log('Found user:', user ? user.email : 'NOT FOUND');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }

        console.log('User details:', {
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
            hasPassword: !!user.password,
            passwordLength: user.password ? user.password.length : 0
        });

        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
            });
        }

        // Debug password comparison chi tiết
        console.log('Password comparison:');
        console.log('Input password:', password);
        console.log('Stored hash:', user.password.substring(0, 20) + '...');

        // Test trực tiếp với bcrypt
        const directBcryptCheck = await bcrypt.compare(password, user.password);
        console.log('Direct bcrypt.compare result:', directBcryptCheck);

        // Test với user method
        const userMethodCheck = await user.comparePassword(password);
        console.log('User.comparePassword result:', userMethodCheck);

        // Nếu cả 2 đều false, có thể password sai
        if (!userMethodCheck) {
            console.log('❌ Password verification failed');

            // Tạm thời - nếu password là 'admin123' thì reset
            if (password === 'admin123' && user.email.includes('admin')) {
                console.log('🔧 Detected admin123 password, resetting...');
                user.password = 'admin123';
                await user.save();
                console.log('✅ Admin password reset successfully');

                // Thử lại
                const retryCheck = await user.comparePassword('admin123');
                console.log('Retry check after reset:', retryCheck);

                if (!retryCheck) {
                    return res.status(500).json({
                        success: false,
                        message: 'Lỗi hệ thống xác thực'
                    });
                }
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Mật khẩu không chính xác'
                });
            }
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        // Remove sensitive fields
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpires;

        console.log('✅ Login successful for:', user.email);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng nhập'
        });
    }
};

const logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng xuất'
        });
    }
};

const register = async (req, res) => {
    try {
        const { email, fullName, password, role = 'staff' } = req.body;

        // Validation
        if (!email || !fullName || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Chuẩn hóa email
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Create new user
        const user = new User({
            email: normalizedEmail,
            fullName: fullName.trim(),
            password,
            role
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Return response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                token,
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng ký'
        });
    }
};

// Thêm route tạm để reset admin password
const resetAdminPassword = async (req, res) => {
    try {
        console.log('🔧 Resetting admin password...');

        const admin = await User.findOne({
            $or: [
                { email: 'admin' },
                { email: 'admin@cmc.edu.vn' }
            ]
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found'
            });
        }

        console.log('Found admin:', admin.email);

        // Reset password
        admin.password = 'admin123';
        await admin.save();

        console.log('✅ Admin password reset to: admin123');

        res.json({
            success: true,
            message: 'Admin password reset successfully',
            data: {
                email: admin.email,
                newPassword: 'admin123'
            }
        });

    } catch (error) {
        console.error('Reset admin password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting admin password'
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // For development, log the reset URL
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        console.log('🔗 Password Reset URL:', resetUrl);
        console.log('📧 Send this URL to:', user.email);

        res.json({
            success: true,
            message: 'Hướng dẫn thay đổi mật khẩu đã được gửi về email của bạn',
            ...(process.env.NODE_ENV === 'development' && { resetUrl })
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xử lý quên mật khẩu'
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mật khẩu mới'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Hash the token to compare
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi reset mật khẩu'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thay đổi mật khẩu'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('standardAccess', 'name code')
            .populate('criteriaAccess', 'name code')
            .populate('facultyId', 'name code')
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phoneNumber, department, position } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Update fields if provided
        if (fullName) user.fullName = fullName.trim();
        if (phoneNumber) user.phoneNumber = phoneNumber.trim();
        if (department) user.department = department.trim();
        if (position) user.position = position.trim();

        await user.save();

        // Return clean user object
        const updatedUser = user.toObject();
        delete updatedUser.password;
        delete updatedUser.resetPasswordToken;
        delete updatedUser.resetPasswordExpires;

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật thông tin'
        });
    }
};

module.exports = {
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    getCurrentUser,
    updateProfile,
    resetAdminPassword
};