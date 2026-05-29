package com.connecthub.connecthub.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateGroupRequest {
    private String name;
    private String image;
    private Long createdBy;
    private List<Long> memberIds;
}
