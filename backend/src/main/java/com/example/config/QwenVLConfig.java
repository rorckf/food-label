package com.example.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "qwen-vl")
public class QwenVLConfig {

    private String apiKey;

    private String endpoint = "https://api.qwen-vl.com/v1/chat/completions";

    private String model = "Qwen-VL";

    private Integer timeout = 30000;
}
