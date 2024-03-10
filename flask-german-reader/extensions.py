from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_jwt_extended import JWTManager
from sqlalchemy import Engine, event

db = SQLAlchemy()
login_manager = LoginManager()
jwt = JWTManager()
