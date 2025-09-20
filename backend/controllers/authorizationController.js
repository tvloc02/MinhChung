const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const { validationResult } = require('express-validator');

// Get permissions
const getPermissions = async (req, res) => {
    try {
        const permissions = {
            modules: [
                'evidence', 'standards', 'criteria', 'experts',
                'reports', 'users', 'configuration'
            ],
            actions: [
                'create', 'read', 'update', 'delete',
                'approve', 'sign', 'publish'
            ],
            roles: [
                'admin', 'manager', 'staff', 'expert'
            ]
        };

        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách quyền'
        });
    }
};

// Update user permissions
const updateUserPermissions = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { standardAccess, criteriaAccess, permissions } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Update user permissions
        if (standardAccess) user.standardAccess = standardAccess;
        if (criteriaAccess) user.criteriaAccess = criteriaAccess;
        if (permissions) user.permissions = permissions;

        await user.save();

        res.json({
            success: true,
            message: 'Cập nhật quyền người dùng thành công',
            data: {
                userId,
                standardAccess: user.standardAccess,
                criteriaAccess: user.criteriaAccess
            }
        });
    } catch (error) {
        console.error('Update user permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật quyền người dùng'
        });
    }
};

// Update group permissions
const updateGroupPermissions = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { groupId } = req.params;
        const { permissions } = req.body;

        const group = await UserGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Nhóm người dùng không tồn tại'
            });
        }

        group.permissions = permissions;
        await group.save();

        res.json({
            success: true,
            message: 'Cập nhật quyền nhóm thành công',
            data: {
                groupId,
                permissions: group.permissions
            }
        });
    } catch (error) {
        console.error('Update group permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật quyền nhóm'
        });
    }
};

// Get permission matrix
const getPermissionMatrix = async (req, res) => {
    try {
        const { module, role } = req.query;

        // Mock permission matrix
        const matrix = {
            admin: {
                evidence: ['create', 'read', 'update', 'delete', 'approve', 'sign', 'publish'],
                standards: ['create', 'read', 'update', 'delete'],
                criteria: ['create', 'read', 'update', 'delete'],
                experts: ['create', 'read', 'update', 'delete'],
                reports: ['create', 'read', 'update', 'delete'],
                users: ['create', 'read', 'update', 'delete'],
                configuration: ['create', 'read', 'update', 'delete']
            },
            manager: {
                evidence: ['create', 'read', 'update', 'approve'],
                standards: ['read'],
                criteria: ['read'],
                experts: ['read'],
                reports: ['create', 'read'],
                users: ['read'],
                configuration: ['read']
            },
            staff: {
                evidence: ['create', 'read', 'update'],
                standards: ['read'],
                criteria: ['read'],
                experts: ['read'],
                reports: ['read'],
                users: [],
                configuration: []
            },
            expert: {
                evidence: ['read', 'approve'],
                standards: ['read'],
                criteria: ['read'],
                experts: ['read'],
                reports: ['read'],
                users: [],
                configuration: []
            }
        };

        let result = matrix;

        if (role && matrix[role]) {
            result = matrix[role];
            if (module && matrix[role][module]) {
                result = matrix[role][module];
            }
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get permission matrix error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy ma trận quyền'
        });
    }
};

// Create role
const createRole = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const roleData = {
            ...req.body,
            createdBy: req.user.id,
            createdAt: new Date()
        };

        res.status(201).json({
            success: true,
            message: 'Tạo vai trò thành công',
            data: {
                id: Date.now().toString(),
                ...roleData
            }
        });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo vai trò'
        });
    }
};

// Update role
const updateRole = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const updateData = {
            ...req.body,
            updatedBy: req.user.id,
            updatedAt: new Date()
        };

        res.json({
            success: true,
            message: 'Cập nhật vai trò thành công',
            data: { id, ...updateData }
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật vai trò'
        });
    }
};

// Delete role
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        res.json({
            success: true,
            message: 'Xóa vai trò thành công'
        });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa vai trò'
        });
    }
};

// Assign role
const assignRole = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { userId, roleId, scope, expiryDate } = req.body;

        res.json({
            success: true,
            message: 'Gán vai trò thành công',
            data: {
                userId,
                roleId,
                scope,
                expiryDate,
                assignedAt: new Date(),
                assignedBy: req.user.id
            }
        });
    } catch (error) {
        console.error('Assign role error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gán vai trò'
        });
    }
};

// Revoke role
const revokeRole = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { userId, roleId } = req.body;

        res.json({
            success: true,
            message: 'Thu hồi vai trò thành công',
            data: {
                userId,
                roleId,
                revokedAt: new Date(),
                revokedBy: req.user.id
            }
        });
    } catch (error) {
        console.error('Revoke role error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thu hồi vai trò'
        });
    }
};

module.exports = {
    getPermissions,
    updateUserPermissions,
    updateGroupPermissions,
    getPermissionMatrix,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    revokeRole
};