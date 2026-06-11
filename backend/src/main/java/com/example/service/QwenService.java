package com.example.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.example.config.QwenVLConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 通义千问多模态 API 服务
 * 接收图片访问 URL，内部转换为 Base64 后调用 Qwen-VL，
 * 返回结构化 JSON（productName / netContent / nutrition / ingredients）。
 *
 * 注意：生产环境请替换为公网可访问的图片 URL，以支持直接 URL 传参模式。
 */
@Service
public class QwenService {

    private static final Logger log = LoggerFactory.getLogger(QwenService.class);

    private static final String SYSTEM_PROMPT =
            "你是一个食品标签识别助手。请分析图片中的食品标签，严格按照以下 JSON 格式返回，" +
            "不要包含任何额外文字或代码块标记：\n" +
            "{\n" +
            "  \"productName\": \"产品名称\",\n" +
            "  \"category\": \"食品品类，从以下挑一个最贴切的：饮料/乳制品/烘焙/糖果零食/方便食品/肉制品/调味品/酒类/茶叶/其他\",\n" +
            "  \"netContent\": \"净含量（如 250g）\",\n" +
            "  \"manufacturer\": \"生产商或委托商名称\",\n" +
            "  \"licenseNumber\": \"生产许可证编号（如 SC11331021511234）\",\n" +
            "  \"standard\": \"执行标准编号（如 GB/T 20977）\",\n" +
            "  \"origin\": \"产地（省+市，或具体地址）\",\n" +
            "  \"productionDate\": \"生产日期（原文照抄，如 2024-05-12 或 见包装）\",\n" +
            "  \"shelfLife\": \"保质期（原文照抄，如 12个月 或 至2025-05-12）\",\n" +
            "  \"storage\": \"贮存条件（如 常温避光保存）\",\n" +
            "  \"contact\": \"厂家联系方式（电话/网址，如有多项用空格分隔）\",\n" +
            "  \"nutrition\": {\n" +
            "    \"energy\": 数值,\n" +
            "    \"energyNRV\": NRV%数值,\n" +
            "    \"protein\": 数值,\n" +
            "    \"proteinNRV\": NRV%数值,\n" +
            "    \"fat\": 数值,\n" +
            "    \"fatNRV\": NRV%数值,\n" +
            "    \"carbohydrate\": 数值,\n" +
            "    \"carbohydrateNRV\": NRV%数值,\n" +
            "    \"sodium\": 数值,\n" +
            "    \"sodiumNRV\": NRV%数值\n" +
            "  },\n" +
            "  \"ingredients\": [\"配料1\", \"配料2\"],\n" +
            "  \"allergenText\": \"标签上 致敏物质/致敏原信息/过敏原 段落原文，包括交叉污染提示，无则为 null\"\n" +
            "}\n" +
            "若某字段在标签中不存在，对应值设为 null。营养成分单位均为 g，能量单位为 kJ，钠单位为 mg。" +
            "NRV% 字段为标签上印的“营养素参考值百分比”，仅填数字（如 12 表示 12%），无则为 null。";

    private final QwenVLConfig config;
    private final RestTemplate restTemplate;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.base-url}")
    private String baseUrl;

    public QwenService(QwenVLConfig config) {
        this.config = config;
        this.restTemplate = new RestTemplate();
    }

    /**
     * 调用 Qwen-VL 分析图片，返回结构化 JSON（使用 application.yml 中的默认配置）。
     *
     * @param imageUrl FileService 返回的图片访问 URL
     * @return 包含 productName / netContent / nutrition / ingredients 的 JSONObject
     */
    public JSONObject callVisionAPI(String imageUrl) {
        return callVisionAPI(imageUrl, null, null, null);
    }

    /**
     * 调用 Qwen-VL 分析图片，返回结构化 JSON。
     * 三个 override 参数允许调用方（如前端配置）临时覆盖 API Key / 模型 / 接口地址；
     * 为空时回退到 application.yml 中的默认值。
     *
     * @param imageUrl        FileService 返回的图片访问 URL
     * @param apiKeyOverride  覆盖用 API Key，空则用默认
     * @param modelOverride   覆盖用模型名，空则用默认
     * @param endpointOverride 覆盖用接口地址，空则用默认
     * @return 包含 productName / netContent / nutrition / ingredients 的 JSONObject
     */
    public JSONObject callVisionAPI(String imageUrl, String apiKeyOverride,
                                    String modelOverride, String endpointOverride) {
        try {
            String base64Image = toBase64(imageUrl);
            String rawResponse = callApi(base64Image, apiKeyOverride, modelOverride, endpointOverride);
            return parseResponse(rawResponse);
        } catch (Exception e) {
            log.error("Qwen-VL 调用失败，imageUrl={}", imageUrl, e);
            return buildFallback();
        }
    }

    /** 取首个非空值：override 优先，否则用默认 */
    private static String firstNonBlank(String override, String fallback) {
        return (override != null && !override.isBlank()) ? override.trim() : fallback;
    }

    // ─── 私有方法 ────────────────────────────────────────────────────────────

    /**
     * 将图片 URL 转换为 Base64 字符串。
     * 对 localhost URL 直接读取本地文件；其余情况通过 HTTP 下载。
     */
    private String toBase64(String imageUrl) throws IOException {
        byte[] bytes;
        if (imageUrl.startsWith(baseUrl)) {
            // 本地文件：uploadDir + URL 中 baseUrl 之后的路径
            String relativePath = imageUrl.substring(baseUrl.length());
            Path localPath = Paths.get(uploadDir + relativePath);
            bytes = Files.readAllBytes(localPath);
        } else {
            // 公网 URL：直接下载
            bytes = restTemplate.getForObject(imageUrl, byte[].class);
            if (bytes == null) throw new IOException("无法下载图片：" + imageUrl);
        }
        return Base64.getEncoder().encodeToString(bytes);
    }

    /** 向 DashScope 发送请求，返回原始响应文本（override 为空时回退默认配置） */
    private String callApi(String base64Image, String apiKeyOverride,
                           String modelOverride, String endpointOverride) {
        String apiKey   = firstNonBlank(apiKeyOverride, config.getApiKey());
        String model    = firstNonBlank(modelOverride, config.getModel());
        String endpoint = firstNonBlank(endpointOverride, config.getEndpoint());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = Map.of(
            "model", model,
            "input", Map.of(
                "messages", List.of(
                    Map.of("role", "user", "content", List.of(
                        Map.of("type", "text", "text", SYSTEM_PROMPT),
                        Map.of("type", "image", "image", "data:image/jpeg;base64," + base64Image)
                    ))
                )
            )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(
                endpoint, request, String.class);
        return response.getBody();
    }

    /** 从 DashScope 响应中提取模型输出文本，再解析为 JSONObject */
    private JSONObject parseResponse(String rawResponse) {
        if (rawResponse == null) return buildFallback();
        try {
            String text = extractText(rawResponse);
            if (text == null) return buildFallback();

            // 提取 JSON 块（模型有时会在 ```json ... ``` 里返回）
            Matcher m = Pattern.compile("\\{[\\s\\S]+\\}").matcher(text);
            if (m.find()) {
                return JSON.parseObject(m.group());
            }
            return buildFallback();
        } catch (Exception e) {
            log.warn("Qwen-VL 响应解析失败: {}", e.getMessage());
            return buildFallback();
        }
    }

    /** 从 DashScope 响应中提取模型纯文本输出（兼容 text / choices 两种结构） */
    private String extractText(String rawResponse) {
        if (rawResponse == null) return null;
        JSONObject root = JSON.parseObject(rawResponse);
        if (root.containsKey("output")) {
            JSONObject output = root.getJSONObject("output");
            if (output.containsKey("text")) {
                return output.getString("text");
            } else if (output.containsKey("choices")) {
                return output.getJSONArray("choices")
                             .getJSONObject(0)
                             .getJSONObject("message")
                             .getJSONArray("content")
                             .getJSONObject(0)
                             .getString("text");
            }
        }
        return null;
    }

    /**
     * 纯文本调用大模型（用于「配料翻译成人话」等文本生成场景）。
     * 复用与图片识别相同的 Key / 模型 / 接口（多模态模型支持纯文本输入），
     * 三个 override 为空时回退 application.yml 默认配置。
     *
     * @return 模型返回的纯文本；失败返回 null
     */
    public String callTextModel(String prompt, String apiKeyOverride,
                                String modelOverride, String endpointOverride) {
        try {
            String raw = postText(prompt, apiKeyOverride, modelOverride, endpointOverride);
            String text = extractText(raw);
            return text != null ? text.trim() : null;
        } catch (Exception e) {
            log.error("文本模型调用失败", e);
            return null;
        }
    }

    /** 向 DashScope 发送纯文本请求，返回原始响应文本 */
    private String postText(String prompt, String apiKeyOverride,
                            String modelOverride, String endpointOverride) {
        String apiKey   = firstNonBlank(apiKeyOverride, config.getApiKey());
        String model    = firstNonBlank(modelOverride, config.getModel());
        String endpoint = firstNonBlank(endpointOverride, config.getEndpoint());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = Map.of(
            "model", model,
            "input", Map.of(
                "messages", List.of(
                    Map.of("role", "user", "content", List.of(
                        Map.of("type", "text", "text", prompt)
                    ))
                )
            )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(endpoint, request, String.class);
        return response.getBody();
    }

    private JSONObject buildFallback() {
        JSONObject fallback = new JSONObject();
        fallback.put("productName", null);
        fallback.put("netContent", null);
        fallback.put("nutrition", new JSONObject());
        fallback.put("ingredients", List.of());
        return fallback;
    }
}
