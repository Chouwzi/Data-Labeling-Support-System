package com.uth.datalabeling.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserGroupResponse {
  UUID id;
  String name;

  @JsonProperty("manager_id")
  UUID managerId;

  @JsonProperty("manager_name")
  String managerName;

  @JsonProperty("member_count")
  long memberCount;
}
