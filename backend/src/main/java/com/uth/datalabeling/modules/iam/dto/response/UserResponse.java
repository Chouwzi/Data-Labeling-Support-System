package com.uth.datalabeling.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    UUID id;
    String email;
    @JsonProperty("full_name")
    String fullName;
    String role;
    boolean active;

    @JsonProperty("group_id")
    UUID groupId;

    @JsonProperty("group_name")
    String groupName;
}
