package com.example.vo;

import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
public class RecognitionResultVO {
    private Long   id;
    private Long   userId;
    private String imageUrl;
    private String productName;
    /** 食品品类，模块六同品类对比依据 */
    private String category;
    private String netContent;

    /** ─── 厂商与合规信息（AI 抽取，缺失为 null） ─── */
    private String manufacturer;
    private String licenseNumber;
    private String standard;
    private String origin;
    private String productionDate;
    private String shelfLife;
    private String storage;
    private String contact;

    /** 营养成分（每 100g） */
    private NutritionInfo nutrition;

    /** 配料列表（原始字符串） */
    private List<String> ingredients;

    /** 添加剂详情 Map，key=名称，value=详情 */
    private Map<String, AdditiveInfoVO> additiveMap;

    /** 健康提示列表 */
    private List<HealthTip> healthTips;

    /**
     * 营养数据修正标记：key 为指标名（energy/protein/fat/carbohydrate/sodium），
     * value 取 "raw"（原始识别）/ "nrv"（NRV% 反推）/ "energyCalc"（能量估算）。
     */
    private Map<String, String> fixFlag;

    /** 保质期解析结果：状态 + 剩余天数 + 到期日 + 提示文案 */
    private ShelfLifeStatus shelfLifeStatus;

    /** 致敏原原文（LLM 抽取的"致敏物质提示"段落，可能为 null） */
    private String allergenText;

    /**
     * 致敏原结构化结果：
     * {@code contains} → 配料/原文中明确含；{@code mayContain} → 仅交叉污染提示。
     */
    private Map<String, Set<String>> allergens;

    /**
     * 通过执行标准代号反查得到的可信品类。
     * 命中时已覆盖 {@link #category}；为 null 表示标准码未命中（如企业标准 Q/*），
     * 此时 {@link #category} 仍为 LLM 给出的值。
     */
    private String categoryFromStandard;
}
