package com.uth.datalabeling.modules.defect.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.defect.dto.request.DefectCategoryRequest;
import com.uth.datalabeling.modules.defect.dto.response.DefectCategoryResponse;
import com.uth.datalabeling.modules.defect.entity.DefectCategory;
import com.uth.datalabeling.modules.defect.repository.DefectCategoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DefectCategoryService {

    DefectCategoryRepository defectCategoryRepository;

    @Transactional(readOnly = true)
    public List<DefectCategoryResponse> getAllDefectCategories() {
        return defectCategoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DefectCategoryResponse getDefectCategoryById(UUID id) {
        DefectCategory category = defectCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Defect category not found"));
        return mapToResponse(category);
    }

    @Transactional
    public DefectCategoryResponse createDefectCategory(DefectCategoryRequest request) {
        DefectCategory category = DefectCategory.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        
        category = defectCategoryRepository.save(category);
        return mapToResponse(category);
    }

    @Transactional
    public DefectCategoryResponse updateDefectCategory(UUID id, DefectCategoryRequest request) {
        DefectCategory category = defectCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Defect category not found"));

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        category = defectCategoryRepository.save(category);
        return mapToResponse(category);
    }

    @Transactional
    public void deleteDefectCategory(UUID id) {
        DefectCategory category = defectCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Defect category not found"));
        defectCategoryRepository.delete(category);
    }

    private DefectCategoryResponse mapToResponse(DefectCategory category) {
        return DefectCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }
}
