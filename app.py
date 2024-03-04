from sqlite3 import IntegrityError
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from werkzeug.security import generate_password_hash, check_password_hash
import os
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from config import DevelopmentConfig
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object(DevelopmentConfig)
CORS(app)
jwt = JWTManager(app)
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

from models import User

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Database initialization function
def init_db():
    if not os.path.exists('db.sqlite'):
        db.create_all()
        print("Database initialized!")
    else:
        print("Database already exists.")

# Call the database initialization function
with app.app_context():
    init_db()

@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user:
        return jsonify({'message': 'Username already exists.'}), 409

    try:
        new_user = User(username=username, password=generate_password_hash(password))
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Failed to register user'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.username)
        return jsonify(user={'username': user.username, 'token': access_token}), 200

    return jsonify({"msg": "Bad username or password"}), 401

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

if __name__ == '__main__':
    app.run(debug=True)
