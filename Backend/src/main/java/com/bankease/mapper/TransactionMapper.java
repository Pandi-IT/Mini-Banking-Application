package com.bankease.mapper;

import com.bankease.dto.TransactionDto;
import com.bankease.model.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface TransactionMapper {
    TransactionMapper INSTANCE = Mappers.getMapper(TransactionMapper.class);

    @Mapping(source = "account.accountNumber", target = "accountNumber")
    TransactionDto toDto(Transaction transaction);
}
