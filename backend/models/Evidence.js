const mongoose = require('mongoose');

// Schema cho signingProcess (thêm vào schema Evidence hiện có)
const signingProcessSchema = new mongoose.Schema({
    signers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        order: {
            type: Number,
            required: true
        },
        role: {
            type: String,
            enum: ['reviewer', 'approver'],
            default: 'approver'
        },
        status: {
            type: String,
            enum: ['pending', 'signed', 'rejected'],
            default: 'pending'
        },
        signedAt: Date,
        signingInfoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SigningInfo'
        },
        reason: String
    }],
    status: {
        type: String,
        enum: ['pending_signatures', 'signatures_inserted', 'in_progress', 'completed', 'rejected'],
        default: 'pending_signatures'
    },
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    reason: String,
    currentStep: {
        type: Number,
        default: 1
    },
    signaturePositions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    insertedAt: Date,
    insertedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Cập nhật schema Evidence chính (thêm vào schema hiện có)
const evidenceSchemaAddition = {
    // Thêm vào schema Evidence hiện có
    signingProcess: signingProcessSchema,

    // Cập nhật status enum để bao gồm các trạng thái workflow mới
    status: {
        type: String,
        enum: [
            'draft',               // Chưa trình ký
            'pending_approval',    // Chờ chèn chữ ký (sau khi chọn người ký)
            'signatures_inserted', // Đã chèn chữ ký vào PDF, sẵn sàng ký
            'in_progress',        // Đang ký duyệt
            'completed',          // Hoàn thành
            'rejected'            // Từ chối
        ],
        default: 'draft'
    },

    // Thêm các trường mới
    rejectedAt: Date,
    rejectionReason: String,
    completedAt: Date
};

// ===== INSTANCE METHODS =====

// Kiểm tra có thể khởi tạo trình ký không
evidenceSchema.methods.canInitiateSigning = function(userId) {
    return this.status === 'draft' &&
        (this.createdBy.toString() === userId.toString() ||
            this.assignedTo?.toString() === userId.toString());
};

// Kiểm tra user hiện tại có thể ký không
evidenceSchema.methods.canUserSign = function(userId) {
    if (!this.signingProcess || !['signatures_inserted', 'in_progress'].includes(this.status)) {
        return false;
    }

    const currentStep = this.signingProcess.currentStep || 1;
    const currentSigner = this.signingProcess.signers.find(signer =>
        signer.order === currentStep &&
        signer.status === 'pending'
    );

    return currentSigner && currentSigner.userId.toString() === userId.toString();
};

// Kiểm tra có thể hủy trình ký không
evidenceSchema.methods.canCancelSigning = function(userId, userRole) {
    if (!this.signingProcess || this.status === 'completed') {
        return false;
    }

    return this.signingProcess.initiatedBy.toString() === userId.toString() ||
        userRole === 'admin';
};

// Kiểm tra có thể cập nhật trình ký không
evidenceSchema.methods.canUpdateSigning = function(userId, userRole) {
    if (!this.signingProcess ||
        !['pending_approval', 'signatures_inserted'].includes(this.status)) {
        return false;
    }

    // Không thể cập nhật nếu đã có ai ký
    const hasSigned = this.signingProcess.signers.some(s => s.status === 'signed');
    if (hasSigned) return false;

    return this.signingProcess.initiatedBy.toString() === userId.toString() ||
        userRole === 'admin';
};

// Kiểm tra cần chèn chữ ký không
evidenceSchema.methods.requiresSignatureInsertion = function() {
    if (this.status !== 'pending_approval') return false;

    return this.files.some(file => file.mimeType === 'application/pdf');
};

// Lấy danh sách người ký tiếp theo
evidenceSchema.methods.getNextSigners = function() {
    if (!this.signingProcess || this.status !== 'in_progress') {
        return [];
    }

    const currentStep = this.signingProcess.currentStep || 1;
    return this.signingProcess.signers
        .filter(signer => signer.order >= currentStep && signer.status === 'pending')
        .sort((a, b) => a.order - b.order);
};

// Lấy thông tin tiến độ ký
evidenceSchema.methods.getSigningProgress = function() {
    if (!this.signingProcess) return null;

    const totalSigners = this.signingProcess.signers.length;
    const signedCount = this.signingProcess.signers.filter(s => s.status === 'signed').length;
    const rejectedCount = this.signingProcess.signers.filter(s => s.status === 'rejected').length;

    return {
        totalSigners,
        signedCount,
        rejectedCount,
        pendingCount: totalSigners - signedCount - rejectedCount,
        percentage: Math.round((signedCount / totalSigners) * 100),
        currentStep: this.signingProcess.currentStep || 1
    };
};

// Kiểm tra quá hạn
evidenceSchema.methods.isOverdue = function() {
    // Logic kiểm tra quá hạn dựa trên deadline
    if (!this.deadline) return false;

    return new Date() > new Date(this.deadline) &&
        !['completed', 'rejected'].includes(this.status);
};

// Lấy người ký hiện tại
evidenceSchema.methods.getCurrentSigner = function() {
    if (!this.signingProcess || this.status !== 'in_progress') {
        return null;
    }

    const currentStep = this.signingProcess.currentStep || 1;
    return this.signingProcess.signers.find(signer =>
        signer.order === currentStep && signer.status === 'pending'
    );
};

// Kiểm tra user có trong danh sách ký không
evidenceSchema.methods.isUserInSigningProcess = function(userId) {
    if (!this.signingProcess) return false;

    return this.signingProcess.signers.some(signer =>
        signer.userId.toString() === userId.toString()
    );
};

// Lấy thông tin ký của user
evidenceSchema.methods.getUserSigningInfo = function(userId) {
    if (!this.signingProcess) return null;

    return this.signingProcess.signers.find(signer =>
        signer.userId.toString() === userId.toString()
    );
};

// ===== STATIC METHODS =====

// Lấy danh sách cần ký duyệt của user
evidenceSchema.statics.getPendingApproval = function(userId) {
    return this.find({
        status: { $in: ['signatures_inserted', 'in_progress'] },
        'signingProcess.signers': {
            $elemMatch: {
                userId: mongoose.Types.ObjectId(userId),
                status: 'pending'
            }
        }
    })
        .populate('files', 'originalName size mimeType')
        .populate('createdBy', 'fullName position')
        .populate('standardId', 'name code')
        .populate('criteriaId', 'name code')
        .populate('signingProcess.signers.userId', 'fullName position')
        .sort({ 'signingProcess.initiatedAt': 1 });
};

// Lấy thống kê workflow
evidenceSchema.statics.getStatistics = function(options = {}) {
    const {
        userId,
        userRole,
        dateFrom,
        dateTo,
        standardId,
        criteriaId
    } = options;

    // Build match query
    let matchQuery = {};

    if (dateFrom || dateTo) {
        matchQuery.createdAt = {};
        if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
    }

    if (standardId) matchQuery.standardId = mongoose.Types.ObjectId(standardId);
    if (criteriaId) matchQuery.criteriaId = mongoose.Types.ObjectId(criteriaId);

    // Access control
    if (userRole !== 'admin') {
        matchQuery.$or = [
            { createdBy: mongoose.Types.ObjectId(userId) },
            { assignedTo: mongoose.Types.ObjectId(userId) },
            { 'signingProcess.signers.userId': mongoose.Types.ObjectId(userId) }
        ];
    }

    return this.aggregate([
        {
            $match: matchQuery
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgProcessingTime: {
                    $avg: {
                        $cond: [
                            { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$createdAt', null] }] },
                            { $subtract: ['$completedAt', '$createdAt'] },
                            null
                        ]
                    }
                }
            }
        }
    ]);
};

// Tìm minh chứng theo workflow status với filter
evidenceSchema.statics.findByWorkflowStatus = function(status, filters = {}) {
    let query = { status };

    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { code: { $regex: filters.search, $options: 'i' } }
        ];
    }

    if (filters.standardId) query.standardId = filters.standardId;
    if (filters.criteriaId) query.criteriaId = filters.criteriaId;

    // Access control
    if (filters.userId && filters.userRole !== 'admin') {
        query.$or = [
            { createdBy: filters.userId },
            { assignedTo: filters.userId },
            { 'signingProcess.signers.userId': filters.userId }
        ];
    }

    return this.find(query)
        .populate('files', 'originalName size mimeType')
        .populate('createdBy', 'fullName position')
        .populate('assignedTo', 'fullName position')
        .populate('signingProcess.signers.userId', 'fullName position')
        .populate('standardId', 'name code')
        .populate('criteriaId', 'name code')
        .sort({ updatedAt: -1 });
};

// Lấy minh chứng sắp quá hạn
evidenceSchema.statics.getUpcomingDeadlines = function(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.find({
        status: { $in: ['pending_approval', 'signatures_inserted', 'in_progress'] },
        deadline: {
            $gte: new Date(),
            $lte: futureDate
        }
    })
        .populate('createdBy', 'fullName')
        .populate('signingProcess.signers.userId', 'fullName position')
        .sort({ deadline: 1 });
};

// Lấy minh chứng bị stuck (quá lâu không có hoạt động)
evidenceSchema.statics.getStuckEvidences = function(days = 30) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    return this.find({
        status: { $in: ['pending_approval', 'signatures_inserted', 'in_progress'] },
        updatedAt: { $lt: pastDate }
    })
        .populate('createdBy', 'fullName')
        .populate('signingProcess.signers.userId', 'fullName position')
        .sort({ updatedAt: 1 });
};

// ===== MIDDLEWARE =====

// Pre-save middleware để tự động cập nhật timestamps
evidenceSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.updatedAt = new Date();

        // Tự động set completedAt khi status chuyển thành completed
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        }

        // Tự động set rejectedAt khi status chuyển thành rejected
        if (this.status === 'rejected' && !this.rejectedAt) {
            this.rejectedAt = new Date();
        }
    }

    next();
});

// Post-save middleware để ghi log
evidenceSchema.post('save', async function(doc, next) {
    try {
        // Chỉ log khi status thay đổi
        if (this.isModified('status')) {
            const History = require('./History');

            await History.create({
                userId: doc.updatedBy || doc.createdBy,
                action: 'status_change',
                module: 'evidence_workflow',
                targetType: 'Evidence',
                targetId: doc._id,
                description: `Trạng thái minh chứng chuyển thành: ${doc.status}`,
                details: {
                    oldStatus: this._original?.status,
                    newStatus: doc.status,
                    hasSigningProcess: !!doc.signingProcess
                },
                status: 'success'
            });
        }
    } catch (error) {
        console.error('Post-save logging error:', error);
    }

    next();
});

// Virtual để tính toán workflow metadata
evidenceSchema.virtual('workflowMetadata').get(function() {
    if (!this.signingProcess) return null;

    return {
        totalSteps: this.signingProcess.signers.length,
        currentStep: this.signingProcess.currentStep || 1,
        completedSteps: this.signingProcess.signers.filter(s => s.status === 'signed').length,
        isStuck: this.updatedAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days
        estimatedCompletionTime: this.getEstimatedCompletionTime(),
        riskLevel: this.getRiskLevel()
    };
});

// Tính thời gian hoàn thành ước tính
evidenceSchema.methods.getEstimatedCompletionTime = function() {
    if (!this.signingProcess) return null;

    const avgSigningTime = 2 * 24 * 60 * 60 * 1000; // 2 days per step
    const remainingSteps = this.signingProcess.signers.filter(s => s.status === 'pending').length;

    return new Date(Date.now() + (remainingSteps * avgSigningTime));
};

// Tính mức độ rủi ro
evidenceSchema.methods.getRiskLevel = function() {
    if (this.status === 'completed') return 'none';
    if (this.status === 'rejected') return 'high';

    const daysSinceUpdate = Math.floor((Date.now() - this.updatedAt) / (24 * 60 * 60 * 1000));

    if (daysSinceUpdate > 14) return 'high';
    if (daysSinceUpdate > 7) return 'medium';
    if (daysSinceUpdate > 3) return 'low';

    return 'none';
};

// Index cho performance
evidenceSchema.index({ status: 1, updatedAt: -1 });
evidenceSchema.index({ 'signingProcess.signers.userId': 1, 'signingProcess.signers.status': 1 });
evidenceSchema.index({ standardId: 1, criteriaId: 1 });
evidenceSchema.index({ deadline: 1, status: 1 });
evidenceSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model('Evidence', evidenceSchema);