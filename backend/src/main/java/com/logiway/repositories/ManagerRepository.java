package com.logiway.repositories;

import com.logiway.entities.Manager;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManagerRepository extends JpaRepository<Manager, Long> {
	List<Manager> findByEntreprise_Id(Long entrepriseId);
}
