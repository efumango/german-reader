from extensions import db

class DictionaryEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)  
    word = db.Column(db.String(255), nullable=False)
    definition = db.Column(db.Text, nullable=False)
    pos = db.Column(db.String(50), nullable=True)  # Part of Speech
    additional_info = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<DictionaryEntry {self.word}>"
