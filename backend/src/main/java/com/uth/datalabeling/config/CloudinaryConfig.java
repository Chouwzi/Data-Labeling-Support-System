package com.uth.datalabeling.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @org.springframework.beans.factory.annotation.Value("${CLOUDINARY_URL:cloudinary://key:secret@cloudname}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        // Use the injected CLOUDINARY_URL which defaults to a dummy value if missing (for tests)
        return new Cloudinary(cloudinaryUrl);
    }
}
