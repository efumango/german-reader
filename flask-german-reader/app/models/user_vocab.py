from app.extensions import db

class UserVocab(db.Model):
    __tablename__ = 'user_vocab'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    dictionary_entry_id = db.Column(db.Integer, db.ForeignKey('dictionary_entry.id'), nullable=False)
    dictionary_entry = db.relationship('DictionaryEntry', backref='user_vocab_entries')
    word = db.Column(db.Text)
    definition = db.Column(db.Text)
    inflection = db.Column(db.Text)
    sentence = db.Column(db.Text)
    filename = db.Column(db.Text)
    