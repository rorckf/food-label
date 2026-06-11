package com.example.service;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.entity.HistoryRecord;
import com.example.mapper.HistoryMapper;
import com.example.vo.RecognitionResultVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 启动时一次性回填：
 *   把 history_record 里 health_score 为 NULL 的老数据重新算分写回。
 *   只动 health_score 列，不触碰 result_json / 收藏状态等。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HealthScoreBackfillRunner implements ApplicationRunner {

    private final HistoryMapper historyMapper;

    @Override
    public void run(org.springframework.boot.ApplicationArguments args) {
        QueryWrapper<HistoryRecord> qw = new QueryWrapper<>();
        qw.isNull("health_score");
        List<HistoryRecord> rows = historyMapper.selectList(qw);
        if (rows.isEmpty()) return;

        int ok = 0;
        for (HistoryRecord r : rows) {
            if (r.getResultJson() == null) continue;
            try {
                RecognitionResultVO vo = JSON.parseObject(r.getResultJson(), RecognitionResultVO.class);
                r.setHealthScore(HealthScoreCalculator.calc(vo));
                historyMapper.updateById(r);
                ok++;
            } catch (Exception e) {
                log.warn("健康评分回填失败 id={}: {}", r.getId(), e.getMessage());
            }
        }
        log.info("健康评分回填完成：扫描 {} 条，成功 {} 条", rows.size(), ok);
    }
}
