const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Thông tin cơ bản
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(email) {
                return /^[a-zA-Z0-9._-]+(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?$/.test(email);
            },
            message: 'Email không hợp lệ'
        }
    },

    fullName: {
        type: String,
        required: [true, 'Họ và tên là bắt buộc'],
        maxlength: [100, 'Họ và tên không được quá 100 ký tự'],
        trim: true
    },

    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },

    phoneNumber: {
        type: String,
        validate: {
            validator: function(phone) {
                return !phone || /^[0-9]{10,11}$/.test(phone);
            },
            message: 'Số điện thoại không hợp lệ'
        }
    },

    // Thông tin cơ cấu tổ chức
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: [true, 'Khoa là bắt buộc']
    },

    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },

    // Nhiều chức vụ
    positions: [{
        title: {
            type: String,
            required: true,
            enum: [
                'giang_vien',           // Giảng viên
                'truong_khoa',          // Trưởng khoa
                'pho_truong_khoa',      // Phó trưởng khoa
                'truong_bo_mon',        // Trưởng bộ môn
                'pho_truong_bo_mon',    // Phó trưởng bộ môn
                'chu_nhiem_chuong_trinh', // Chủ nhiệm chương trình
                'giam_doc_trung_tam',   // Giám đốc trung tâm
                'pho_giam_doc',         // Phó giám đốc
                'thu_ky_khoa',          // Thư ký khoa
                'chuyen_vien',          // Chuyên viên
                'nhan_vien',            // Nhân viên
                'other'                 // Khác
            ]
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department'
        },
        isMain: {
            type: Boolean,
            default: false  // Chức vụ chính
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        isActive: {
            type: Boolean,
            default: true
        },
        description: String // Mô tả thêm nếu cần
    }],

    // Thông tin học vấn và chuyên môn
    academicLevel: {
        type: String,
        enum: ['cu_nhan', 'thac_si', 'tien_si', 'pho_giao_su', 'giao_su'],
        default: 'cu_nhan'
    },

    specializations: [String], // Chuyên ngành

    // Vai trò hệ thống
    role: {
        type: String,
        enum: ['admin', 'manager', 'staff', 'expert', 'guest'],
        default: 'staff'
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'pending'
    },

    // Thông tin chữ ký số
    digitalSignature: {
        // Chữ ký hình ảnh (base64 hoặc path)
        signatureImage: String,

        // Thông tin chứng chỉ số
        certificate: {
            serialNumber: String,
            issuer: String,
            subject: String,
            validFrom: Date,
            validTo: Date,
            thumbprint: String,
            algorithm: {
                type: String,
                default: 'RSA-SHA256'
            }
        },

        // Cài đặt chữ ký
        settings: {
            showDate: {
                type: Boolean,
                default: true
            },
            showReason: {
                type: Boolean,
                default: true
            },
            showLocation: {
                type: Boolean,
                default: true
            },
            defaultLocation: String,
            signatureFormat: {
                type: String,
                enum: ['image_only', 'text_only', 'image_and_text'],
                default: 'image_and_text'
            }
        },

        // Lịch sử sử dụng chữ ký
        usageStats: {
            totalSigned: {
                type: Number,
                default: 0
            },
            lastUsed: Date
        },

        isActive: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },

    // Nhóm người dùng
    userGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserGroup'
    }],

    // Quyền truy cập riêng lẻ (override group permissions)
    individualPermissions: [{
        module: {
            type: String,
            enum: [
                'so_trinh_ky', 'so_ky_duyet', 'tra_cuu_so', 'so_da_ban_hanh',
                'kiem_tra', 'dong_dau', 'bao_cao', 'danh_muc_so',
                'cau_hinh', 'du_lieu_don_vi'
            ]
        },
        actions: {
            view: { type: Boolean, default: false },    // Hiển thị
            create: { type: Boolean, default: false },  // Thêm
            edit: { type: Boolean, default: false },    // Sửa
            delete: { type: Boolean, default: false }   // Xóa
        },
        restrictions: [{
            type: String, // Ví dụ: 'own_faculty_only', 'own_department_only'
        }]
    }],

    // Quyền truy cập theo tiêu chuẩn (legacy)
    standardAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard'
    }],

    // Quyền truy cập theo tiêu chí (legacy)
    criteriaAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria'
    }],

    // Cài đặt cá nhân
    preferences: {
        language: {
            type: String,
            enum: ['vi', 'en'],
            default: 'vi'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        pageSize: {
            type: Number,
            default: 20,
            min: 10,
            max: 100
        },
        notifications: {
            email: { type: Boolean, default: true },
            system: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        }
    },

    // Thông tin đăng nhập
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,

    // Reset password
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Audit fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ facultyId: 1, status: 1 });
userSchema.index({ 'positions.title': 1, 'positions.isActive': 1 });

// Virtual fields
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('mainPosition').get(function() {
    return this.positions.find(p => p.isMain && p.isActive) ||
        this.positions.find(p => p.isActive) ||
        null;
});

userSchema.virtual('activePositions').get(function() {
    return this.positions.filter(p => p.isActive);
});

userSchema.virtual('hasDigitalSignature').get(function() {
    return !!(this.digitalSignature && this.digitalSignature.isActive);
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
    // Hash password if modified
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    // Ensure only one main position
    const mainPositions = this.positions.filter(p => p.isMain && p.isActive);
    if (mainPositions.length > 1) {
        // Keep the first one as main, set others to false
        for (let i = 1; i < mainPositions.length; i++) {
            const pos = this.positions.find(p => p._id.equals(mainPositions[i]._id));
            if (pos) pos.isMain = false;
        }
    }

    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getFullEmail = function(domain = 'cmc.edu.vn') {
    if (this.email.includes('@')) return this.email;
    return `${this.email}@${domain}`;
};

userSchema.methods.hasPermission = function(module, action) {
    // Check individual permissions first
    const individual = this.individualPermissions.find(p => p.module === module);
    if (individual && individual.actions[action] !== undefined) {
        return individual.actions[action];
    }

    // TODO: Check group permissions
    return false;
};

userSchema.methods.addPosition = function(positionData) {
    // If this is set as main, unset other main positions
    if (positionData.isMain) {
        this.positions.forEach(p => {
            if (p.isActive) p.isMain = false;
        });
    }

    this.positions.push(positionData);
};

userSchema.methods.removePosition = function(positionId) {
    this.positions = this.positions.filter(p => !p._id.equals(positionId));
};

userSchema.methods.updateSignatureUsage = function() {
    if (this.digitalSignature) {
        this.digitalSignature.usageStats.totalSigned += 1;
        this.digitalSignature.usageStats.lastUsed = new Date();
    }
};

userSchema.methods.canSignDocuments = function() {
    return this.hasDigitalSignature && this.status === 'active';
};

userSchema.methods.incrementLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // Lock after 5 attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }

    return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Static methods
userSchema.statics.generateDefaultPassword = function(email) {
    const username = email.split('@')[0];
    return `${username}123`;
};

userSchema.statics.findByEmailOrUsername = function(identifier) {
    const emailWithoutDomain = identifier.replace('@cmc.edu.vn', '');
    const emailWithDomain = emailWithoutDomain.includes('@') ?
        emailWithoutDomain : `${emailWithoutDomain}@cmc.edu.vn`;

    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { email: emailWithoutDomain.toLowerCase() },
            { email: emailWithDomain.toLowerCase() }
        ]
    });
};

// JSON transformation
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
    }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);