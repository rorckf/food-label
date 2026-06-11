package com.example;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@MapperScan("com.example.mapper")
@EnableAsync
public class FoodlabelApplication {

    public static void main(String[] args) {
        SpringApplication.run(FoodlabelApplication.class, args);
    }
}
