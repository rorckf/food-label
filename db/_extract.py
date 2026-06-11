import re, csv

with open('db/health_food_db.sql','r',encoding='utf-8') as f:
    text = f.read()

# Tokenize a single tuple body (between '(' and ')') splitting on commas not inside ' '
def split_fields(body):
    toks = []
    cur = ''
    in_str = False
    i = 0
    while i < len(body):
        ch = body[i]
        if ch == "'":
            # Handle escaped '' inside string
            if in_str and i+1 < len(body) and body[i+1] == "'":
                cur += "''"
                i += 2
                continue
            in_str = not in_str
            cur += ch
        elif ch == ',' and not in_str:
            toks.append(cur)
            cur = ''
        else:
            cur += ch
        i += 1
    toks.append(cur)
    return toks

def unq(x):
    x = x.strip()
    if x == 'NULL':
        return ''
    if x.startswith("'") and x.endswith("'"):
        return x[1:-1].replace("''","'")
    return x

# Find each tuple of additive_knowledge rows; they live in INSERT blocks for that table
# Strategy: locate INSERT INTO `additive_knowledge` ... VALUES then read tuples until the terminating ;
nulls = []
filled = []
pos = 0
key = "INSERT INTO `additive_knowledge`"
while True:
    p = text.find(key, pos)
    if p < 0:
        break
    v = text.find('VALUES', p)
    end = text.find(';', v)
    body = text[v+6:end]
    pos = end + 1
    # Split tuples on '),\n(' boundary using a stateful scan
    tuples = []
    depth = 0
    in_str = False
    cur = ''
    i = 0
    while i < len(body):
        ch = body[i]
        if ch == "'":
            if in_str and i+1 < len(body) and body[i+1] == "'":
                cur += "''"
                i += 2
                continue
            in_str = not in_str
            cur += ch
        elif ch == '(' and not in_str:
            if depth == 0:
                cur = ''
            else:
                cur += ch
            depth += 1
        elif ch == ')' and not in_str:
            depth -= 1
            if depth == 0:
                tuples.append(cur)
            else:
                cur += ch
        else:
            if depth > 0:
                cur += ch
        i += 1
    for t in tuples:
        toks = split_fields(t)
        if len(toks) != 10:
            continue
        safety = toks[6].strip()
        if safety == 'NULL':
            nulls.append(toks)
        else:
            filled.append(toks)

print(f"NULL safety_desc: {len(nulls)}, filled: {len(filled)}, total: {len(nulls)+len(filled)}")

with open('db/_additives_to_fill.tsv','w',encoding='utf-8',newline='') as f:
    w = csv.writer(f, delimiter='\t')
    w.writerow(['id','name','english','cns','ins','func','usage_scope','max_dosage'])
    for t in nulls:
        w.writerow([unq(t[0]), unq(t[1]), unq(t[2]), unq(t[3]),
                    unq(t[4]), unq(t[5]), unq(t[7]), unq(t[8])])
print("wrote db/_additives_to_fill.tsv")
