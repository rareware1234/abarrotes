package com.abarrotes.efficient.inventory.waste.repository;

import com.abarrotes.efficient.inventory.waste.entity.WasteRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WasteRepository extends JpaRepository<WasteRecord, Long> {
}