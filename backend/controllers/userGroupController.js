const UserGroup = require('../models/UserGroup');
const User = require('../models/User');

const getUserGroups = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [userGroups, total] = await Promise.all([
            UserGroup.find(query)
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            UserGroup.countDocuments(query)
        ]);

        // Get member count for each group
        const groupsWithMemberCount = await Promise.all(
            userGroups.map(async (group) => {
                const memberCount = await User.countDocuments({
                    userGroups: group._id
                });
                return {
                    ...group.toObject(),
                    memberCount
                };
            })
        );

        res.json({
            success: true,
            data: {
                userGroups: groupsWithMemberCount,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhóm người dùng'
        });
    }
};

const getAllUserGroups = async (req, res) => {
    try {
        const userGroups = await UserGroup.find({ status: 'active' })
            .select('name code description')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: userGroups
        });

    } catch (error) {
        console.error('Get all user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhóm người dùng'
        });
    }
};

const getUserGroupById = async (req, res) => {
    try {
        const { id } = req.params;

        const userGroup = await UserGroup.findById(id)
            .populate('createdBy', 'fullName email');

        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Get members of this group
        const members = await User.find({
            userGroups: id,
            status: 'active'
        }).select('fullName email role');

        res.json({
            success: true,
            data: {
                ...userGroup.toObject(),
                members
            }
        });

    } catch (error) {
        console.error('Get user group by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin nhóm người dùng'
        });
    }
};

const createUserGroup = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            permissions
        } = req.body;

        // Check if code already exists
        const existingGroup = await UserGroup.findOne({ code: code.toUpperCase() });
        if (existingGroup) {
            return res.status(400).json({
                success: false,
                message: `Mã nhóm ${code} đã tồn tại`
            });
        }

        // Validate permissions structure
        if (permissions && !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Permissions phải là một mảng'
            });
        }

        const validModules = ['evidence', 'standards', 'criteria', 'experts', 'reports', 'users', 'configuration'];
        const validActions = ['create', 'read', 'update', 'delete', 'approve', 'sign', 'publish'];

        if (permissions) {
            for (const permission of permissions) {
                if (!validModules.includes(permission.module)) {
                    return res.status(400).json({
                        success: false,
                        message: `Module ${permission.module} không hợp lệ`
                    });
                }
                if (permission.actions && !permission.actions.every(action => validActions.includes(action))) {
                    return res.status(400).json({
                        success: false,
                        message: 'Một số action không hợp lệ'
                    });
                }
            }
        }

        const userGroup = new UserGroup({
            name: name.trim(),
            code: code.toUpperCase().trim(),
            description: description?.trim(),
            permissions: permissions || [],
            createdBy: req.user.id
        });

        await userGroup.save();

        await userGroup.populate('createdBy', 'fullName email');

        res.status(201).json({
            success: true,
            message: 'Tạo nhóm người dùng thành công',
            data: userGroup
        });

    } catch (error) {
        console.error('Create user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo nhóm người dùng'
        });
    }
};

const updateUserGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Check code uniqueness if being updated
        if (updateData.code && updateData.code.toUpperCase() !== userGroup.code) {
            const existingGroup = await UserGroup.findOne({
                code: updateData.code.toUpperCase(),
                _id: { $ne: id }
            });
            if (existingGroup) {
                return res.status(400).json({
                    success: false,
                    message: `Mã nhóm ${updateData.code} đã tồn tại`
                });
            }
        }

        // Validate permissions if being updated
        if (updateData.permissions) {
            const validModules = ['evidence', 'standards', 'criteria', 'experts', 'reports', 'users', 'configuration'];
            const validActions = ['create', 'read', 'update', 'delete', 'approve', 'sign', 'publish'];

            for (const permission of updateData.permissions) {
                if (!validModules.includes(permission.module)) {
                    return res.status(400).json({
                        success: false,
                        message: `Module ${permission.module} không hợp lệ`
                    });
                }
                if (permission.actions && !permission.actions.every(action => validActions.includes(action))) {
                    return res.status(400).json({
                        success: false,
                        message: 'Một số action không hợp lệ'
                    });
                }
            }
        }

        // Update fields
        Object.assign(userGroup, updateData);
        if (updateData.code) {
            userGroup.code = updateData.code.toUpperCase();
        }

        await userGroup.save();

        await userGroup.populate('createdBy', 'fullName email');

        res.json({
            success: true,
            message: 'Cập nhật nhóm người dùng thành công',
            data: userGroup
        });

    } catch (error) {
        console.error('Update user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật nhóm người dùng'
        });
    }
};

const deleteUserGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Check if group has members
        const memberCount = await User.countDocuments({ userGroups: id });
        if (memberCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa nhóm đang có thành viên'
            });
        }

        await UserGroup.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa nhóm người dùng thành công'
        });

    } catch (error) {
        console.error('Delete user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa nhóm người dùng'
        });
    }
};

const addMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người dùng không hợp lệ'
            });
        }

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Check if users exist
        const users = await User.find({ _id: { $in: userIds } });
        if (users.length !== userIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một số người dùng không tồn tại'
            });
        }

        // Add group to users
        await User.updateMany(
            { _id: { $in: userIds } },
            { $addToSet: { userGroups: id } }
        );

        res.json({
            success: true,
            message: `Thêm ${users.length} thành viên vào nhóm thành công`
        });

    } catch (error) {
        console.error('Add members error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thêm thành viên'
        });
    }
};

const removeMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người dùng không hợp lệ'
            });
        }

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Remove group from users
        await User.updateMany(
            { _id: { $in: userIds } },
            { $pull: { userGroups: id } }
        );

        res.json({
            success: true,
            message: `Loại bỏ ${userIds.length} thành viên khỏi nhóm thành công`
        });

    } catch (error) {
        console.error('Remove members error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi loại bỏ thành viên'
        });
    }
};

const getGroupMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [members, total] = await Promise.all([
            User.find({ userGroups: id })
                .select('fullName email role status lastLogin')
                .sort({ fullName: 1 })
                .skip(skip)
                .limit(limitNum),
            User.countDocuments({ userGroups: id })
        ]);

        res.json({
            success: true,
            data: {
                members,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách thành viên'
        });
    }
};

const getPermissionMatrix = async (req, res) => {
    try {
        const modules = ['evidence', 'standards', 'criteria', 'experts', 'reports', 'users', 'configuration'];
        const actions = ['create', 'read', 'update', 'delete', 'approve', 'sign', 'publish'];

        const userGroups = await UserGroup.find({ status: 'active' })
            .select('name code permissions')
            .sort({ name: 1 });

        const matrix = modules.map(module => {
            const modulePermissions = {
                module,
                groups: {}
            };

            userGroups.forEach(group => {
                const groupPermission = group.permissions.find(p => p.module === module);
                modulePermissions.groups[group.code] = {
                    groupName: group.name,
                    actions: groupPermission ? groupPermission.actions : []
                };
            });

            return modulePermissions;
        });

        res.json({
            success: true,
            data: {
                matrix,
                modules,
                actions,
                groups: userGroups.map(g => ({ code: g.code, name: g.name }))
            }
        });

    } catch (error) {
        console.error('Get permission matrix error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy ma trận phân quyền'
        });
    }
};

module.exports = {
    getUserGroups,
    getAllUserGroups,
    getUserGroupById,
    createUserGroup,
    updateUserGroup,
    deleteUserGroup,
    addMembers,
    removeMembers,
    getGroupMembers,
    getPermissionMatrix
};