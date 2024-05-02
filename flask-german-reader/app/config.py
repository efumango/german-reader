import os
import tempfile 
from dotenv import load_dotenv
load_dotenv()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Config(object):
    DEBUG = False
    TESTING = False
    SECRET_KEY = 'default_secret_key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///db.sqlite'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'default_jwt_secret_key'
    UPLOADED_DICT_FOLDER = os.path.join(BASE_DIR, 'uploaded_dict')
    UPLOADED_TEXT_FOLDER = os.path.join(BASE_DIR, 'uploaded_texts')
    WIKI_DICT_PATH = os.path.join(BASE_DIR, 'prepared_dict/wikidict.txt')
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024
    
class DevelopmentConfig(Config):
    DEBUG = True
    DB_PATH = "C:\\Users\\efuma\\Downloads\\german_reader\\flask-german-reader\\instance\\db.sqlite"

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:' 
    UPLOADED_DICT_FOLDER = tempfile.mkdtemp()
    UPLOADED_TEXT_FOLDER = tempfile.mkdtemp()  

class ProductionConfig(Config):
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_jwt_secret_key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://myuser:mypassword@localhost/mydatabase')    
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024
    UPLOADED_DICT_FOLDER = os.path.join(BASE_DIR, 'uploaded_dict')
    UPLOADED_TEXT_FOLDER = os.path.join(BASE_DIR, 'uploaded_texts')
    WIKI_DICT_PATH = os.path.join(BASE_DIR, 'prepared_dict/wikidict.txt')