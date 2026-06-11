package com.example.config;

import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationParam;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DashScopeConfig {

    @Value("${dashscope.api-key}")
    private String apiKey;

    @Value("${dashscope.base-url}")
    private String baseUrl;

    @Bean
    public Generation generation() {
        return new Generation();
    }

    @Bean
    public GenerationParam generationParam() {
        return GenerationParam.builder()
                .apiKey(apiKey)
                .model("qwen-turbo")
                .build();
    }
}
