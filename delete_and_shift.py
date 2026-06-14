# -*- coding: utf-8 -*-
import re

insert_sql = r"c:\IE103\Đồ án IE103\nighthub-react\insert_data_new.sql"

with open(insert_sql, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def parse_values(val_str):
    vals = []
    in_str = False
    curr_val = []
    i = 0
    while i < len(val_str):
        c = val_str[i]
        if c == "'" and (i == 0 or val_str[i-1] != "\\"):
            in_str = not in_str
        if c == "," and not in_str:
            vals.append("".join(curr_val).strip())
            curr_val = []
        else:
            curr_val.append(c)
        i += 1
    vals.append("".join(curr_val).strip())
    return vals

deleted_vp = set()
deleted_pb = set()
deleted_lsx = set()

# Pass 1: Identify deleted IDs
for line in lines:
    if line.startswith("INSERT INTO VIDEO_PHAT"):
        m = re.search(r"VALUES \((.+)\);", line)
        if m:
            vals = parse_values(m.group(1))
            if len(vals) >= 6 and vals[5].strip("'") == "Phim052":
                deleted_vp.add(vals[0].strip("'"))
for line in lines:
    if line.startswith("INSERT INTO PHIEN_BAN_VIDEO"):
        m = re.search(r"VALUES \((.+)\);", line)
        if m:
            vals = parse_values(m.group(1))
            if len(vals) >= 5 and vals[4].strip("'") in deleted_vp:
                deleted_pb.add(vals[0].strip("'"))
    elif line.startswith("INSERT INTO LICH_SU_XEM"):
        m = re.search(r"VALUES \((.+)\);", line)
        if m:
            vals = parse_values(m.group(1))
            if len(vals) >= 5 and vals[4].strip("'") in deleted_vp:
                deleted_lsx.add(vals[0].strip("'"))

deleted_vp_sorted = sorted([int(x[2:]) for x in deleted_vp])
deleted_pb_sorted = sorted([int(x[2:]) for x in deleted_pb])
deleted_lsx_sorted = sorted([int(x[3:]) for x in deleted_lsx])

def get_shifted_id(prefix, num, deleted_sorted):
    shift = 0
    for d in deleted_sorted:
        if num > d:
            shift += 1
        else:
            break
    return f"{prefix}{str(num - shift).zfill(len(str(num)))}" # Wait, zfill needs original length.
    
def replacer(match):
    full_str = match.group(0)
    if full_str.startswith("Phim"):
        num = int(match.group(1))
        if num > 52:
            return f"Phim{str(num-1).zfill(3)}"
        return full_str
    elif full_str.startswith("VP"):
        num = int(match.group(1))
        shift = sum(1 for d in deleted_vp_sorted if num > d)
        return f"VP{str(num-shift).zfill(4)}"
    elif full_str.startswith("PB"):
        num = int(match.group(1))
        shift = sum(1 for d in deleted_pb_sorted if num > d)
        return f"PB{str(num-shift).zfill(5)}"
    elif full_str.startswith("LSX"):
        num = int(match.group(1))
        shift = sum(1 for d in deleted_lsx_sorted if num > d)
        return f"LSX{str(num-shift).zfill(3)}"
    return full_str

new_lines = []
for line in lines:
    # Check if line should be deleted
    is_deleted = False
    m = re.search(r"VALUES \((.+)\);", line)
    if m:
        vals = [v.strip("'") for v in parse_values(m.group(1))]
        if "Phim052" in vals:
            is_deleted = True
        if line.startswith("INSERT INTO VIDEO_PHAT") and vals[0] in deleted_vp:
            is_deleted = True
        if line.startswith("INSERT INTO PHIEN_BAN_VIDEO") and vals[0] in deleted_pb:
            is_deleted = True
        if line.startswith("INSERT INTO LICH_SU_XEM") and vals[0] in deleted_lsx:
            is_deleted = True
            
    if not is_deleted:
        # Perform replacements on the whole line to catch references inside strings or tuples
        line = re.sub(r"Phim(\d{3})", replacer, line)
        line = re.sub(r"VP(\d{4})", replacer, line)
        line = re.sub(r"PB(\d{5})", replacer, line)
        line = re.sub(r"LSX(\d{3})", replacer, line)
        new_lines.append(line)

with open(insert_sql, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Deleted Phim052. VP deleted: {len(deleted_vp)}, PB deleted: {len(deleted_pb)}, LSX deleted: {len(deleted_lsx)}")
