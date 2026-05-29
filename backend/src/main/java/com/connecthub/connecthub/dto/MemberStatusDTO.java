package com.connecthub.connecthub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberStatusDTO {
    private Long userId;
    private Long lastReadId;
    private Long lastDeliveredId;
}
