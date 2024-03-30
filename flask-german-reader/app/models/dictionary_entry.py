from app.extensions import db

class DictionaryEntry(db.Model):
    __tablename__ = 'dictionary_entry'
    
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(255), nullable=False, index=True, unique=True)
    original_form = db.Column(db.String)
    definition = db.Column(db.Text, nullable=False)
    inflection = db.Column(db.Text)
    source = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f"<DictionaryEntry {self.word}: {self.definition}>"
