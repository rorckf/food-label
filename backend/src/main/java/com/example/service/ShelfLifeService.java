package com.example.service;

import com.example.vo.ShelfLifeStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 保质期解析与到期校验。
 *
 * <p>覆盖 35 张真实标签里出现的全部格式：</p>
 * <ul>
 *   <li>生产日期：{@code 2024年11月16日}、{@code 2024-05-09 9时}、{@code 2024/05/09}、
 *       {@code 2024.07.17}、{@code 2025-03-10}、{@code 见包装}</li>
 *   <li>保质期：{@code 2天}、{@code 21天}、{@code 12个月}、{@code 十个月}、
 *       {@code 保质期至 2024/05/12 1时}、{@code 至 2024/07/20}</li>
 *   <li>季节性保质期（如 {@code 3月-11月15天, 12月-2月45天}）→ UNKNOWN</li>
 * </ul>
 */
@Slf4j
@Service
public class ShelfLifeService {

    /** 7 天内到期视作 EXPIRING 警示 */
    private static final int EXPIRING_THRESHOLD = 7;

    /** 生产日期匹配：年月日 / 年-月-日 / 年/月/日 / 年.月.日 */
    private static final Pattern DATE_CN  = Pattern.compile("(\\d{4})\\s*[年./\\-]\\s*(\\d{1,2})\\s*[月./\\-]\\s*(\\d{1,2})");

    /** 保质期至 / 至：直接给出到期日 */
    private static final Pattern EXPIRY_DIRECT = Pattern.compile(
            "(?:保质期至|至|到期日|有效期至)\\s*[:：]?\\s*(\\d{4})\\s*[年./\\-]\\s*(\\d{1,2})\\s*[月./\\-]\\s*(\\d{1,2})");

    /** 保质期时长：N 天 / N 个月 / N 月 / N 年 */
    private static final Pattern DURATION = Pattern.compile(
            "(\\d{1,3})\\s*(天|日|个月|月|年)");

    /** 中文数字保质期：十二个月 / 十个月 / 三年 等 */
    private static final Pattern DURATION_CN = Pattern.compile(
            "([一二两三四五六七八九十]{1,3})\\s*(天|日|个月|月|年)");

    /** 季节性保质期等无法直接计算的格式（出现该模式时直接 UNKNOWN） */
    private static final Pattern SEASONAL = Pattern.compile(
            "\\d{1,2}\\s*月.*\\d{1,2}\\s*天.*\\d{1,2}\\s*月");

    private static final Map<Character, Integer> CN_DIGITS = Map.ofEntries(
            Map.entry('一', 1), Map.entry('二', 2), Map.entry('两', 2), Map.entry('三', 3),
            Map.entry('四', 4), Map.entry('五', 5), Map.entry('六', 6), Map.entry('七', 7),
            Map.entry('八', 8), Map.entry('九', 9), Map.entry('十', 10)
    );

    /**
     * 解析"生产日期 + 保质期"两段文本，结合当天计算状态。
     *
     * @param productionDate 标签 "生产日期" 字段原文
     * @param shelfLife      标签 "保质期" 字段原文（可能含到期日）
     * @return 解析结果，永不为 null
     */
    public ShelfLifeStatus evaluate(String productionDate, String shelfLife) {
        return evaluate(productionDate, shelfLife, LocalDate.now());
    }

    /** 测试可注入 today，便于单元测试覆盖 */
    public ShelfLifeStatus evaluate(String productionDate, String shelfLife, LocalDate today) {
        ShelfLifeStatus vo = new ShelfLifeStatus();
        vo.setStatus("UNKNOWN");

        LocalDate prod   = parseDate(productionDate);
        LocalDate expiry = parseExpiryDate(shelfLife);
        vo.setProductionDate(prod);

        // 优先使用直接到期日，其次"生产日期 + 时长"
        if (expiry == null && prod != null) {
            expiry = applyDuration(prod, shelfLife);
        }

        if (expiry == null) {
            vo.setMessage("无法解析保质期");
            return vo;
        }

        vo.setExpiryDate(expiry);
        long days = ChronoUnit.DAYS.between(today, expiry);
        vo.setDaysRemaining((int) days);

        if (days < 0) {
            vo.setStatus("EXPIRED");
            vo.setMessage(String.format("已过期 %d 天", -days));
        } else if (days <= EXPIRING_THRESHOLD) {
            vo.setStatus("EXPIRING");
            vo.setMessage(String.format("还有 %d 天到期", days));
        } else {
            vo.setStatus("VALID");
            vo.setMessage(String.format("还有 %d 天到期", days));
        }
        return vo;
    }

    // ─── 内部解析 ────────────────────────────────────────────────────────────

    /** 从任意文本中提取首个 yyyy-MM-dd 日期；找不到返回 null */
    private LocalDate parseDate(String text) {
        if (text == null || text.isBlank()) return null;
        // "见包装" / "见包装背面" 类无法解析
        if (text.contains("见包装") || text.contains("见标签") || text.contains("见喷码")) return null;
        Matcher m = DATE_CN.matcher(text);
        if (m.find()) return safeBuild(m.group(1), m.group(2), m.group(3));
        return null;
    }

    /** 仅当文本含 "保质期至/至/到期日" 等关键词时才提取直接到期日 */
    private LocalDate parseExpiryDate(String shelfLife) {
        if (shelfLife == null) return null;
        Matcher m = EXPIRY_DIRECT.matcher(shelfLife);
        if (m.find()) return safeBuild(m.group(1), m.group(2), m.group(3));
        return null;
    }

    /** 在生产日期上叠加 "N 天/月/年" 时长。SEASONAL 格式直接放弃。 */
    private LocalDate applyDuration(LocalDate prod, String shelfLife) {
        if (shelfLife == null) return null;
        if (SEASONAL.matcher(shelfLife).find()) {
            log.debug("命中季节性保质期，跳过计算：{}", shelfLife);
            return null;
        }

        Matcher m = DURATION.matcher(shelfLife);
        if (m.find()) {
            return addDuration(prod, Integer.parseInt(m.group(1)), m.group(2));
        }
        Matcher cn = DURATION_CN.matcher(shelfLife);
        if (cn.find()) {
            int n = parseChineseNumber(cn.group(1));
            if (n > 0) return addDuration(prod, n, cn.group(2));
        }
        return null;
    }

    private LocalDate addDuration(LocalDate prod, int n, String unit) {
        return switch (unit) {
            case "天", "日" -> prod.plusDays(n);
            case "月", "个月" -> prod.plusMonths(n);
            case "年" -> prod.plusYears(n);
            default -> null;
        };
    }

    /** 简单中文数字：一-九 / 十 / 十N / N十 / N十N，覆盖 1~99 */
    private int parseChineseNumber(String s) {
        if (s == null || s.isEmpty()) return 0;
        // 单字
        if (s.length() == 1) return CN_DIGITS.getOrDefault(s.charAt(0), 0);
        // 含 "十"
        int idx = s.indexOf('十');
        if (idx >= 0) {
            int tens = idx == 0 ? 1 : CN_DIGITS.getOrDefault(s.charAt(idx - 1), 0);
            int ones = idx == s.length() - 1 ? 0 :
                       CN_DIGITS.getOrDefault(s.charAt(idx + 1), 0);
            return tens * 10 + ones;
        }
        return 0;
    }

    private LocalDate safeBuild(String y, String mo, String d) {
        try {
            return LocalDate.of(Integer.parseInt(y), Integer.parseInt(mo), Integer.parseInt(d));
        } catch (Exception e) {
            return null;
        }
    }

    // 保留 formatter 以备将来需要把 LocalDate 转回 yyyy-MM-dd 字符串
    @SuppressWarnings("unused")
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;
    @SuppressWarnings("unused")
    private static final List<String> RESERVED_KEYWORDS = List.of("常温", "冷藏", "冷冻");
}
