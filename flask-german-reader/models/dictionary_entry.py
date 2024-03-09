from extensions import db

class DictionaryEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  
    word = db.Column(db.String(255), nullable=False)
    definition = db.Column(db.Text, nullable=False)
    pos = db.Column(db.String(50), nullable=True)  # Part of Speech
    additional_info = db.Column(db.Text, nullable=True)

    # Define a relationship 
    user = db.relationship('User', backref=db.backref('dictionary_entries', lazy=True))

    def __repr__(self):
        return f"<DictionaryEntry {self.word}>"
