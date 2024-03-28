import pytest
from app.app import create_app
from app.extensions import db
from app.models import User
from werkzeug.security import generate_password_hash
from app.config import TestingConfig

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app()
    app.config.from_object(TestingConfig)
    with app.app_context():
        db.create_all()
        yield app 
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def new_user(app):
    """Fixture to add a new user to the database."""
    with app.app_context():
        user = User(username='testuser', password=generate_password_hash('testpassword'))
        db.session.add(user)
        db.session.commit()
    return user
