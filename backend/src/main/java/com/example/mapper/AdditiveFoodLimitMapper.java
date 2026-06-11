package com.example.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.entity.AdditiveFoodLimit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AdditiveFoodLimitMapper extends BaseMapper<AdditiveFoodLimit> {

    /**
     * 按 additive_id 查询所有限量条目，按食品分类号排序
     */
    @Select("SELECT * FROM additive_food_limit WHERE additive_id = #{additiveId} " +
            "ORDER BY food_category_code ASC")
    List<AdditiveFoodLimit> selectByAdditiveId(Long additiveId);
}
