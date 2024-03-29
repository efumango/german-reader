import os
import tempfile 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config(object):
    DEBUG = False
    TESTING = False
    SECRET_KEY = 'izaya'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///db.sqlite'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'shizuo'
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploaded_dict')
    UPLOADED_TEXT_FOLDER = os.path.join(BASE_DIR, 'uploaded_texts')
    WIKI_DICT_PATH = os.path.join(BASE_DIR, 'prepared_dict/wikidict.txt')
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024
    
class DevelopmentConfig(Config):
    DEBUG = True
    DB_PATH = "C:\\Users\\efuma\\Downloads\\german_reader\\flask-german-reader\\instance\\db.sqlite"

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:' 
    UPLOAD_FOLDER = tempfile.mkdtemp()
    UPLOADED_TEXT_FOLDER = tempfile.mkdtemp()  

class ProductionConfig(Config):
    SECRET_KEY = 'production_secret_key'
    JWT_SECRET_KEY = 'production_jwt_secret_key'
    