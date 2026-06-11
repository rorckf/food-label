package com.example.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.entity.Additive;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AdditiveMapper extends BaseMapper<Additive> {

    @Select("SELECT * FROM additive_knowledge WHERE additive_name = #{additiveName} LIMIT 1")
    Additive selectByName(String additiveName);

    /**
     * 模糊匹配。GB 2760 中的名称常带括号别名（如"苯甲酸及其钠盐（苯甲酸，苯甲酸钠）"），
     * 用 LIKE 命中含别名的条目。
     */
    @Select("SELECT * FROM additive_knowledge WHERE additive_name LIKE CONCAT('%', #{keyword}, '%') ORDER BY CHAR_LENGTH(additive_name) ASC LIMIT 1")
    Additive selectByFuzzyName(String keyword);
}
