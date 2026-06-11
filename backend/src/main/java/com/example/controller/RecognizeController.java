package com.example.controller;

import com.example.vo.ExplainRequest;
import com.example.vo.Result;
import com.example.service.RecognizeService;
import com.example.vo.RecognitionResultVO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/recognize")
@RequiredArgsConstructor
public class RecognizeController {

    private final RecognizeService recognizeService;

    /**
     * POST /api/recognize/upload
     * 前端可通过请求头覆盖大模型配置（每人用自己的 Key）：
     *   X-LLM-Api-Key  / X-LLM-Model / X-LLM-Endpoint
     * 三者皆为可选，未传则回退到后端 application.yml 默认配置。
     */
    @PostMapping("/upload")
    public Result<RecognitionResultVO> upload(
            @RequestParam MultipartFile file,
            @RequestHeader(value = "X-LLM-Api-Key", required = false) String llmApiKey,
            @RequestHeader(value = "X-LLM-Model", required = false) String llmModel,
            @RequestHeader(value = "X-LLM-Endpoint", required = false) String llmEndpoint,
            HttpServletRequest request) {
        if (file == null || file.isEmpty()) {
            return Result.error(400, "请选择要上传的图片");
        }

        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) userId = 1L; // TODO: 调试期回退；上线后改为 401

        try {
            RecognitionResultVO result =
                    recognizeService.analyzeLabel(file, userId, llmApiKey, llmModel, llmEndpoint);
            return Result.success(result);
        } catch (Exception e) {
            log.error("识别失败，userId={}", userId, e);
            return Result.error(500, "识别失败：" + e.getMessage());
        }
    }

    /**
     * POST /api/recognize/explain
     * 「配料表翻译成人话」：把识别结果发来，调大模型生成大白话点评。
     * 同样支持 X-LLM-* 请求头覆盖大模型配置（复用识别用的同一套 Key/模型/接口）。
     */
    @PostMapping("/explain")
    public Result<String> explain(
            @RequestBody ExplainRequest req,
            @RequestHeader(value = "X-LLM-Api-Key", required = false) String llmApiKey,
            @RequestHeader(value = "X-LLM-Model", required = false) String llmModel,
            @RequestHeader(value = "X-LLM-Endpoint", required = false) String llmEndpoint) {
        try {
            String text = recognizeService.explainIngredients(req, llmApiKey, llmModel, llmEndpoint);
            if (text == null || text.isBlank()) {
                return Result.error(500, "大模型未返回内容，请稍后重试");
            }
            return Result.success(text);
        } catch (Exception e) {
            log.error("配料翻译失败", e);
            return Result.error(500, "翻译失败：" + e.getMessage());
        }
    }
}
