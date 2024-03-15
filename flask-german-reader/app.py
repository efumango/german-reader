import logging
from flask import Flask
from config import DevelopmentConfig
from flask_cors import CORS
from extensions import db, login_manager, jwt
from celery_utils import init_celery, celery

def create_app(config_class=DevelopmentConfig):

    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)

    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    jwt.init_app(app)

    from auth import auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')

    from dict.routes import dictionary_bp
    app.register_blueprint(dictionary_bp, url_prefix='/api')

    db.init_app(app)
    with app.app_context():
        db.create_all()

    #init_celery(celery, app)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
