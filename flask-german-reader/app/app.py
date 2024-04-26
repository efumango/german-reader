from flask import Flask
from app.config import DevelopmentConfig
from flask_cors import CORS
from app.extensions import db, login_manager, jwt
from dotenv import load_dotenv
load_dotenv() 

def create_app():

    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)
    
    CORS(app)

    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    jwt.init_app(app)

    from app.auth import auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/api/auth')

    from app.dict.routes import dictionary_bp
    app.register_blueprint(dictionary_bp, url_prefix='/api')

    from app.text.routes import text_bp 
    app.register_blueprint(text_bp, url_prefix='/api')

    from app.lookup.routes import lookup_bp 
    app.register_blueprint(lookup_bp, url_prefix='/api')
    
    from app.vocab.routes import vocab_bp
    app.register_blueprint(vocab_bp, url_prefix='/api/vocab')
    
    from app.logging.routes import logging_bp
    app.register_blueprint(logging_bp, url_prefix='/api')
    
    db.init_app(app)
    with app.app_context():
        db.create_all()

    return app

app = create_app()

@app.cli.command("populate-wikidict")
def populate_wikidict_command():
    with app.app_context():
        db.create_all()  # Ensure all tables are created.
        from app.dict.populate_wikidict import populate_wikidict
        populate_wikidict()

if __name__ == '__main__':
    app.run(debug=True)
