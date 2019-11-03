import time

def ppa_timestamp(data):
        # convert two fields to 2016-06-22 19:10:25
        timestamp = str(data["ToimKpv"]) + " " + str(data["ToimKell"]) + ":00"
        return timestamp
