from flask import Flask
from app.config import DevelopmentConfig, ProductionConfig
from flask_cors import CORS
from app.extensions import db, login_manager, jwt, migrate
from dotenv import load_dotenv
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
load_dotenv() 

def create_app(config_class=None):

    app = Flask(__name__)

    # Determine configuration class from environment variable or default to DevelopmentConfig
    if config_class is None:
        env = os.getenv('FLASK_ENV', 'development')
        config_class = ProductionConfig if env == 'production' else DevelopmentConfig

    app.config.from_object(config_class)
    
    CORS(app)

    # Initialize db, migrate, login_manager, jwt
    db.init_app(app)
    migrate.init_app(app, db) 

    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    jwt.init_app(app)

    # Register blueprints
    from app.auth import auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/german-reader/api/auth')

    from app.dict.routes import dictionary_bp
    app.register_blueprint(dictionary_bp, url_prefix='/german-reader/api')

    from app.text.routes import text_bp 
    app.register_blueprint(text_bp, url_prefix='/german-reader/api')

    from app.lookup.routes import lookup_bp 
    app.register_blueprint(lookup_bp, url_prefix='/german-reader/api')
    
    from app.vocab.routes import vocab_bp
    app.register_blueprint(vocab_bp, url_prefix='/german-reader/api/vocab')
    
    from app.log.routes import logging_bp
    app.register_blueprint(logging_bp, url_prefix='/german-reader/api')

    return app

app = create_app()

@app.cli.command("populate-wikidict")
def populate_wikidict_command():
    with app.app_context():
        from app.dict.populate_wikidict import populate_wikidict
        populate_wikidict()

if __name__ == '__main__':
    app.run(debug=False)
