from extensions import db

class DictionaryEntry(db.Model):
    __tablename__ = 'dictionary_entry'
    
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(255), nullable=False, index=True, unique=True)
    definition = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f"<DictionaryEntry {self.word}: {self.definition}>"
