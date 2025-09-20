const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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

    role: {
        type: String,
        enum: ['admin', 'manager', 'staff', 'expert'],
        default: 'staff'
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },

    // Nhóm người dùng
    userGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserGroup'
    }],

    // Quyền truy cập theo tiêu chuẩn
    standardAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard'
    }],

    // Quyền truy cập theo tiêu chí
    criteriaAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria'
    }],

    // Thông tin cơ bản
    department: String,
    position: String,
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
    },

    // Thông tin chữ ký số
    digitalSignature: {
        certificateId: String,
        publicKey: String,
        validFrom: Date,
        validTo: Date,
        issuer: String
    },

    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.index({ email: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ role: 1 });

userSchema.pre('save', async function(next) {
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
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getFullEmail = function(domain = 'cmc.edu.vn') {
    if (this.email.includes('@')) return this.email;
    return `${this.email}@${domain}`;
};

userSchema.methods.hasStandardAccess = function(standardId) {
    if (this.role === 'admin') return true;
    return this.standardAccess.some(id => id.toString() === standardId.toString());
};

userSchema.methods.hasCriteriaAccess = function(criteriaId) {
    if (this.role === 'admin') return true;
    return this.criteriaAccess.some(id => id.toString() === criteriaId.toString());
};

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);