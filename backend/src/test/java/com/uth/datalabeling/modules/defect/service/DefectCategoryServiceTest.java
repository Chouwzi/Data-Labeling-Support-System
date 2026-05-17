package com.uth.datalabeling.modules.defect.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.defect.dto.request.DefectCategoryRequest;
import com.uth.datalabeling.modules.defect.dto.response.DefectCategoryResponse;
import com.uth.datalabeling.modules.defect.entity.DefectCategory;
import com.uth.datalabeling.modules.defect.repository.DefectCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DefectCategoryServiceTest {

    @Mock
    private DefectCategoryRepository defectCategoryRepository;

    @InjectMocks
    private DefectCategoryService defectCategoryService;

    private DefectCategory category;
    private DefectCategoryRequest request;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        categoryId = UUID.randomUUID();
        category = DefectCategory.builder()
                .id(categoryId)
                .name("Blurry Image")
                .description("Image is too blurry")
                .build();
        
        request = DefectCategoryRequest.builder()
                .name("Incorrect Box")
                .description("Bounding box is incorrect")
                .build();
    }

    @Test
    void getAllDefectCategories_Success() {
        when(defectCategoryRepository.findAll()).thenReturn(List.of(category));

        List<DefectCategoryResponse> responses = defectCategoryService.getAllDefectCategories();

        assertEquals(1, responses.size());
        assertEquals(category.getId(), responses.get(0).getId());
        assertEquals(category.getName(), responses.get(0).getName());
        assertEquals(category.getDescription(), responses.get(0).getDescription());
    }

    @Test
    void getDefectCategoryById_Success() {
        when(defectCategoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

        DefectCategoryResponse response = defectCategoryService.getDefectCategoryById(categoryId);

        assertEquals(category.getId(), response.getId());
        assertEquals(category.getName(), response.getName());
    }

    @Test
    void getDefectCategoryById_NotFound() {
        when(defectCategoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> defectCategoryService.getDefectCategoryById(categoryId));
        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void createDefectCategory_Success() {
        DefectCategory newCategory = DefectCategory.builder()
                .id(UUID.randomUUID())
                .name(request.getName())
                .description(request.getDescription())
                .build();

        when(defectCategoryRepository.save(any(DefectCategory.class))).thenReturn(newCategory);

        DefectCategoryResponse response = defectCategoryService.createDefectCategory(request);

        assertNotNull(response.getId());
        assertEquals(request.getName(), response.getName());
        assertEquals(request.getDescription(), response.getDescription());
        
        verify(defectCategoryRepository).save(any(DefectCategory.class));
    }

    @Test
    void updateDefectCategory_Success() {
        when(defectCategoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(defectCategoryRepository.save(any(DefectCategory.class))).thenAnswer(i -> i.getArgument(0));

        DefectCategoryResponse response = defectCategoryService.updateDefectCategory(categoryId, request);

        assertEquals(categoryId, response.getId());
        assertEquals(request.getName(), response.getName());
        assertEquals(request.getDescription(), response.getDescription());
    }

    @Test
    void updateDefectCategory_NotFound() {
        when(defectCategoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> defectCategoryService.updateDefectCategory(categoryId, request));
        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
        
        verify(defectCategoryRepository, never()).save(any());
    }

    @Test
    void deleteDefectCategory_Success() {
        when(defectCategoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

        defectCategoryService.deleteDefectCategory(categoryId);

        verify(defectCategoryRepository).delete(category);
    }

    @Test
    void deleteDefectCategory_NotFound() {
        when(defectCategoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> defectCategoryService.deleteDefectCategory(categoryId));
        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
        
        verify(defectCategoryRepository, never()).delete(any());
    }
}
