package com.zipai.repository;
import com.zipai.domain.VerificationCode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface VerificationCodeRepository extends JpaRepository<VerificationCode,Long>{
 Optional<VerificationCode> findFirstByPurposeAndChannelAndDestinationOrderByIdDesc(String purpose,String channel,String destination);
 long countByChannelAndDestinationAndCreatedAtAfter(String channel,String destination,java.time.LocalDateTime after);
 long countByChannelAndCreatedAtAfter(String channel,java.time.LocalDateTime after);
}
