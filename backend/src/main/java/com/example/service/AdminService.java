package com.example.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.entity.User;
import com.example.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import com.example.vo.AdminUserVO;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 后台管理服务（UC-8）：用户列表 / 启停 / 删除
 * 所有写操作需在调用层确保 "操作者非自身"
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserMapper userMapper;

    /**
     * 分页查询用户列表
     * @param page         第几页（1 起）
     * @param size         每页大小
     * @param keyword      用户名模糊关键字，可空
     * @param statusFilter "all" / "enabled" / "disabled"
     */
    public Map<String, Object> listUsers(int page, int size, String keyword, String statusFilter) {
        LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            qw.like(User::getUsername, keyword.trim());
        }
        if ("enabled".equals(statusFilter)) {
            qw.eq(User::getStatus, 1);
        } else if ("disabled".equals(statusFilter)) {
            qw.eq(User::getStatus, 0);
        }
        qw.orderByDesc(User::getCreateTime);

        Page<User> pageObj = new Page<>(page, size);
        Page<User> result = userMapper.selectPage(pageObj, qw);

        List<AdminUserVO> records = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());

        return Map.of(
                "records", records,
                "total",   result.getTotal(),
                "page",    page,
                "size",    size
        );
    }

    /** 切换启停。返回新状态（1/0）；找不到记录或自身操作时抛业务异常 */
    public int toggleStatus(Long targetId, Long operatorId) {
        if (targetId.equals(operatorId)) {
            throw new IllegalStateException("不能禁用自己的账号");
        }
        User user = userMapper.selectById(targetId);
        if (user == null) throw new IllegalArgumentException("用户不存在");

        int next = (user.getStatus() != null && user.getStatus() == 1) ? 0 : 1;
        user.setStatus(next);
        userMapper.updateById(user);
        return next;
    }

    /** 删除账号；自身或不存在时抛业务异常 */
    public void deleteUser(Long targetId, Long operatorId) {
        if (targetId.equals(operatorId)) {
            throw new IllegalStateException("不能删除自己的账号");
        }
        User user = userMapper.selectById(targetId);
        if (user == null) throw new IllegalArgumentException("用户不存在");
        userMapper.deleteById(targetId);
    }

    private AdminUserVO toVO(User u) {
        AdminUserVO vo = new AdminUserVO();
        // password 字段不出现在 VO 上，无法被复制过去 —— 天然脱敏
        BeanUtils.copyProperties(u, vo);
        return vo;
    }
}
