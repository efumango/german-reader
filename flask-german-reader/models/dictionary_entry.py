from extensions import db

class DictionaryEntry(db.Model):
    __tablename__ = 'dictionary_entry'
    
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(255), nullable=False, index=True)
    definition = db.Column(db.Text, nullable=False, index=True)

    # A composite unique constraint ensuring that each word-definition pair is unique
    __table_args__ = (db.UniqueConstraint('word', 'definition', name='_word_definition_uc'),)

    def __repr__(self):
        return f"<DictionaryEntry {self.word}: {self.definition}>"
