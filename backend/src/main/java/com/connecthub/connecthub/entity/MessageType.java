package com.connecthub.connecthub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "message_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String name;
}
