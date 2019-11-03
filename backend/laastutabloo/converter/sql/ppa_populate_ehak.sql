alter table {tablename} add column {fieldname} integer;
alter table {tablename} add column ehak_animi text;

UPDATE {tablename} SET {fieldname} = (SELECT akood FROM ehak WHERE st_within({tablename}.point, ehak.geom))::integer;
UPDATE {tablename} SET ehak_animi = (SELECT animi FROM ehak WHERE st_within({tablename}.point, ehak.geom));
