import time

def ppa_timestamp(data):
	
	# convert two fields to 2016-06-22 19:10:25
	timestamp = data["toimKpv"] + " " + data["toimKell"] + ":00"
	print timestamp
	return timestamp