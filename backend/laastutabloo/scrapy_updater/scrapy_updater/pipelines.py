# -*- coding: utf-8 -*-

# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://doc.scrapy.org/en/latest/topics/item-pipeline.html

from laastutabloo.converter import converter

class DatasetConverterPipeline(object):
    def process_item(self, item, spider):
        converter.convert_and_insert_DB(item['dataset'], item['engine'], item['downloaded_files'].split(",")) 
        return item
