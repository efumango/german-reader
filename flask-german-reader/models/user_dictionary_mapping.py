from extensions import db

class UserDictionaryMapping(db.Model):
    __tablename__ = 'user_dictionary_mapping'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    entry_id = db.Column(db.Integer, db.ForeignKey('dictionary_entry.id'), primary_key=True)

    # Relationship to User and DictionaryEntry
    user = db.relationship('User', backref=db.backref('user_mappings', lazy='dynamic'))
    dictionary_entry = db.relationship('DictionaryEntry', backref=db.backref('entry_mappings', lazy='dynamic'))

    def __repr__(self):
        return f"<UserDictionaryMapping user_id={self.user_id}, entry_id={self.entry_id}>"
