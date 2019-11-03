select v_en.taxon_guid, v_fr.name as name_fr, v_en.name as name_en, v_fi.name as name_fi, v_ru.name as name_ru, v_lv.name as name_lv
into table catalogueoflife_vernacular_tmp
from (select distinct on (taxon_guid) taxon_guid, name from catalogueoflife_vernacular where lang='English' or lang='Eng' ) as v_en
left join (select distinct on (taxon_guid) taxon_guid, name from catalogueoflife_vernacular where lang='French') as v_fr on v_en.taxon_guid = v_fr.taxon_guid
left join (select distinct on (taxon_guid) taxon_guid, name from catalogueoflife_vernacular where lang='Finnish') as v_fi on v_en.taxon_guid = v_fi.taxon_guid
left join (select distinct on (taxon_guid) taxon_guid, name from catalogueoflife_vernacular where lang='Russian') as v_ru on v_en.taxon_guid = v_ru.taxon_guid
left join (select distinct on (taxon_guid) taxon_guid, name from catalogueoflife_vernacular where lang='Latvian') as v_lv on v_en.taxon_guid = v_lv.taxon_guid;
drop table catalogueoflife_vernacular;
alter table catalogueoflife_vernacular_tmp rename to catalogueoflife_vernacular;
