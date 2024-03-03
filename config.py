
class Config(object):
    DEBUG = False
    TESTING = False
    SECRET_KEY = 'izaya'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///db.sqlite'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'shizuo'

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True

class ProductionConfig(Config):
    SECRET_KEY = 'production_secret_key'
    JWT_SECRET_KEY = 'production_jwt_secret_key'
