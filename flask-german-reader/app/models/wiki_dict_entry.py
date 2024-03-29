from app.extensions import db

class WikiDictEntry(db.Model):
    __tablename__ = 'wiki_dict_entry'

    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String, nullable=False, index=True, unique=True)
    original_form = db.Column(db.String)
    definition = db.Column(db.Text, nullable=False)
    inflection = db.Column(db.Text)
   
