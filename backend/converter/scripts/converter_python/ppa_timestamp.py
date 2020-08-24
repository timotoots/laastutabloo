import time

def ppa_timestamp(data):
        # convert two fields to 2016-06-22 19:10:25
        if len(data["ToimKell"])==5:
                timestamp = str(data["ToimKpv"]) + " " + str(data["ToimKell"]) + ":00"
        else:
                timestamp = str(data["ToimKpv"]) + " 00:00:00"
        return timestamp


