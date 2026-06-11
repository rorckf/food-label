package com.example.service;

import com.alibaba.fastjson2.JSON;
import com.example.entity.HistoryRecord;
import com.example.mapper.HistoryMapper;
import com.example.vo.HistoryRecordDetailVO;
import com.example.vo.HistoryRecordVO;
import com.example.vo.RecognitionResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final HistoryMapper historyMapper;

    // ─── 查询列表 ───────────────────────────────────────────────────────────

    public List<HistoryRecordVO> getHistoryList(Long userId) {
        return historyMapper.selectByUserId(userId)
                .stream()
                .map(this::toVO)
                .collect(Collectors.toList());
    }

    // ─── 查询详情 ───────────────────────────────────────────────────────────

    public HistoryRecordDetailVO getHistoryDetail(Long recordId, Long userId) {
        HistoryRecord record = historyMapper.selectById(recordId);
        if (record == null) {
            throw new RuntimeException("记录不存在");
        }
        if (!record.getUserId().equals(userId)) {
            throw new SecurityException("无权访问此记录");
        }

        HistoryRecordDetailVO detail = new HistoryRecordDetailVO();
        copyBase(record, detail);

        // 解析 result_json → RecognitionResultVO
        if (record.getResultJson() != null) {
            try {
                detail.setDetail(JSON.parseObject(record.getResultJson(), RecognitionResultVO.class));
            } catch (Exception ignored) { /* JSON 格式异常时 detail 为 null */ }
        }
        return detail;
    }

    // ─── 删除（物理删除） ───────────────────────────────────────────────────

    public boolean deleteRecord(Long recordId, Long userId) {
        HistoryRecord record = historyMapper.selectById(recordId);
        if (record == null) throw new RuntimeException("记录不存在");
        if (!record.getUserId().equals(userId)) throw new SecurityException("无权删除此记录");
        return historyMapper.deleteById(recordId) > 0;
    }

    // ─── 保存记录 ───────────────────────────────────────────────────────────

    public HistoryRecord saveHistory(Long userId, String productName, String category,
                                      String imageUrl, String resultJson, Integer healthScore) {
        HistoryRecord record = new HistoryRecord();
        record.setUserId(userId);
        record.setProductName(productName != null ? productName : "未知产品");
        record.setCategory(category);
        record.setImageUrl(imageUrl);
        record.setResultJson(resultJson);
        record.setIsFavorite(0);
        record.setHealthScore(healthScore);
        historyMapper.insert(record);
        return record;
    }

    // ─── 收藏切换 ───────────────────────────────────────────────────────────

    public boolean toggleFavorite(Long recordId, Long userId) {
        HistoryRecord record = historyMapper.selectById(recordId);
        if (record == null) throw new RuntimeException("记录不存在");
        if (!record.getUserId().equals(userId)) throw new SecurityException("无权操作此记录");

        int newVal = (record.getIsFavorite() != null && record.getIsFavorite() == 1) ? 0 : 1;
        record.setIsFavorite(newVal);
        historyMapper.updateById(record);
        return newVal == 1;
    }

    // ─── 私有辅助 ───────────────────────────────────────────────────────────

    private HistoryRecordVO toVO(HistoryRecord r) {
        HistoryRecordVO vo = new HistoryRecordVO();
        copyBase(r, vo);
        return vo;
    }

    private void copyBase(HistoryRecord r, HistoryRecordVO vo) {
        vo.setId(r.getId());
        vo.setProductName(r.getProductName() != null ? r.getProductName() : "未知产品");
        vo.setImageUrl(r.getImageUrl());
        vo.setIsFavorite(r.getIsFavorite() != null ? r.getIsFavorite() : 0);
        vo.setHealthScore(r.getHealthScore());
        vo.setCreateTime(r.getCreateTime());
    }
}
