# -*- coding: utf-8 -*-
"""把 MySQL 数据导出为前端本地模式(BYOK 单机版)用的 JSON 包。
输出到 frontend/src/local/data/ 。运行: python db/_export_json.py
"""
import json
import subprocess
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "local", "data")
MYSQL = ["mysql", "-uroot", "-p123123", "--default-character-set=utf8mb4", "-B", "-N", "health_food"]


def query(sql):
    """执行 SQL,返回行列表(每行是字段列表)。字段内的制表符/换行已在 SQL 层清洗。"""
    r = subprocess.run(MYSQL + ["-e", sql], capture_output=True)
    text = r.stdout.decode("utf-8", errors="replace")
    rows = []
    for line in text.splitlines():
        if line.strip():
            rows.append(line.split("\t"))
    return rows


def clean(col):
    """SQL 端把 NULL/换行/制表符洗掉"""
    return f"REPLACE(REPLACE(COALESCE({col}, ''), '\\t', ' '), '\\n', ' ')"


def export_additives():
    sql = f"""SELECT id, {clean('additive_name')}, {clean('english_name')},
        {clean('cns_no')}, {clean('ins_no')}, {clean('function_category')},
        {clean('safety_desc')}, {clean('usage_scope')}, {clean('max_dosage')},
        {clean('disease_contraindication')} FROM additive_knowledge ORDER BY id"""
    rows = query(sql)
    data = [
        {
            "id": int(r[0]), "name": r[1], "en": r[2], "cns": r[3], "ins": r[4],
            "func": r[5], "safety": r[6], "scope": r[7], "dosage": r[8], "disease": r[9],
        }
        for r in rows
    ]
    return "additives.json", data


def export_limits():
    # 只保留单机版速查需要的字段,体积可控
    sql = f"""SELECT additive_id, {clean('food_category_code')}, {clean('food_category_name')},
        {clean('max_dosage')}, {clean('function_in_use')} FROM additive_food_limit ORDER BY id"""
    rows = query(sql)
    data = [
        {"a": int(r[0]), "c": r[1], "n": r[2], "d": r[3], "f": r[4]}
        for r in rows
    ]
    return "additiveLimits.json", data


def export_food_library():
    sql = f"""SELECT id, {clean('name')}, {clean('category')}, {clean('brand')},
        COALESCE(energy,''), COALESCE(protein,''), COALESCE(fat,''), COALESCE(carb,''),
        COALESCE(sodium,''), {clean('additives')}, {clean('tags')},
        COALESCE(health_score,'') FROM food_library ORDER BY id"""
    rows = query(sql)

    def num(v):
        try:
            return float(v) if "." in v else int(v)
        except ValueError:
            return None

    data = [
        {
            "id": int(r[0]), "name": r[1], "category": r[2], "brand": r[3],
            "energy": num(r[4]), "protein": num(r[5]), "fat": num(r[6]),
            "carb": num(r[7]), "sodium": num(r[8]),
            "additives": r[9], "tags": r[10], "healthScore": num(r[11]),
        }
        for r in rows
    ]
    return "foodLibrary.json", data


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for fname, data in [export_additives(), export_limits(), export_food_library()]:
        path = os.path.join(OUT_DIR, fname)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        size_kb = os.path.getsize(path) / 1024
        print(f"{fname}: {len(data)} 条, {size_kb:.0f} KB")


if __name__ == "__main__":
    main()
