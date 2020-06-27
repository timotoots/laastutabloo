
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Integer, ForeignKey, String, Column, Date, Text, Table, JSON


DecBase = declarative_base()


class Script(DecBase):
  __tablename__ = "script"
  id = Column(Text, primary_key=True)
  type = Column(Text)
  script = Column(Text)
  meta = Column(JSON)
