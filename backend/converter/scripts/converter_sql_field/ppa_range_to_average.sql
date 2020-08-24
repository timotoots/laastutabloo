UPDATE {tablename}  SET {fieldname} = split_part({fieldname}, '-', 1)::integer + (split_part({fieldname}, '-', 2)::integer - split_part({fieldname}, '-', 1)::integer) / 2 WHERE {fieldname} != ''
