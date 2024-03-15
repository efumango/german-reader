import os 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config(object):
    DEBUG = False
    TESTING = False
    SECRET_KEY = 'izaya'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///db.sqlite'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'shizuo'
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    broker_url = 'redis://localhost:6379/0'  
    result_backend = 'redis://localhost:6379/0'

class DevelopmentConfig(Config):
    DEBUG = True
    broker_url = 'redis://localhost:6379/0'
    result_backend = 'redis://localhost:6379/0'
    
class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    

class ProductionConfig(Config):
    SECRET_KEY = 'production_secret_key'
    JWT_SECRET_KEY = 'production_jwt_secret_key'
    