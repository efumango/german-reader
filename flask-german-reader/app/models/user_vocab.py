from app.extensions import db

class UserVocab(db.Model):
    __tablename__ = 'user_vocab'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    word = db.Column(db.String(255), db.ForeignKey('dictionary_entry.word'), nullable=False)
    definition = db.Column(db.Text, db.ForeignKey('dictionary_entry.definition'), nullable=False)
    inflection = db.Column(db.Text, db.ForeignKey('dictionary_entry.inflection'))