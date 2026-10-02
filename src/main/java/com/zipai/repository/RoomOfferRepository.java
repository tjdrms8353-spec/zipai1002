package com.zipai.repository;

import com.zipai.domain.RoomOffer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomOfferRepository extends JpaRepository<RoomOffer, Long> {
    List<RoomOffer> findByOwnerIdOrderByIdDesc(Long ownerId);
}
