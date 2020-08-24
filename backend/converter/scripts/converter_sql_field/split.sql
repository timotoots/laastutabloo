UPDATE {tablename} SET "{fieldname}" = split_part("{fieldname}"::TEXT, ' ', 1);
