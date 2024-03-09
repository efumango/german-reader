import os
import tempfile
import pytest
from app import create_app
from extensions import db as _db
from models import DictionaryEntry
from config import TestingConfig

@pytest.fixture
def app():
    # Setup temporary database
    db_fd, db_path = tempfile.mkstemp()
    app = create_app(TestingConfig)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path

    with app.app_context():
        _db.create_all()
    
    yield app
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

def test_upload_dictionary(client):
    # Path to a sample dictionary file
    dictionary_file_path = 'C:/Users/efuma/Downloads/dict_cc/dictcc.txt'
    data = {
        'dictionary': (open(dictionary_file_path, 'rb'), 'dictionary.txt')
    }
    
    response = client.post('/api/upload-dictionary', data=data, content_type='multipart/form-data')
    print(response.data)  # Temporarily added to debug
    assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.data}"

