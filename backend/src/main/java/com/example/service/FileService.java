package com.example.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class FileService {

    private static final Set<String> ALLOWED_EXT = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final Set<String> ALLOWED_MIME = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp");
    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.base-url}")
    private String baseUrl;

    /**
     * 校验并保存上传图片到 uploads/images/。
     * 要求：JPG/PNG/WEBP，且 ≤ 5MB；不通过抛 IllegalArgumentException。
     */
    public String saveImage(MultipartFile file) throws IOException {
        validate(file);

        Path dir = Paths.get(uploadDir, "images");
        Files.createDirectories(dir);

        String ext = extractExt(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Files.write(dir.resolve(filename), file.getBytes());

        return baseUrl + "/images/" + filename;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("请选择要上传的图片");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("图片大小不能超过 5MB");
        }
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_MIME.contains(mime.toLowerCase())) {
            throw new IllegalArgumentException("仅支持 JPG / PNG / WEBP 格式");
        }
        String ext = extractExt(file.getOriginalFilename()).toLowerCase();
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("仅支持 JPG / PNG / WEBP 格式");
        }
    }

    private String extractExt(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
