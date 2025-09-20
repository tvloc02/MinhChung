const mongoose = require('mongoose');

const userGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên nhóm người dùng là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên nhóm không được quá 100 ký tự']
    },

    code: {
        type: String,
        required: [true, 'Mã nhóm là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [20, 'Mã nhóm không được quá 20 ký tự']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    permissions: [{
        module: {
            type: String,
            enum: ['evidence', 'standards', 'criteria', 'experts', 'reports', 'users', 'configuration'],
            required: true
        },
        actions: [{
            type: String,
            enum: ['create', 'read', 'update', 'delete', 'approve', 'sign', 'publish']
        }]
    }],

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

userGroupSchema.index({ code: 1 });
userGroupSchema.index({ status: 1 });

userGroupSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('UserGroup', userGroupSchema);