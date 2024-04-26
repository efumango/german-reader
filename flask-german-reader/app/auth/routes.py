from . import auth_blueprint
from sqlite3 import IntegrityError
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models import User

@auth_blueprint.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify(user={'user_id': user.id, 'username': username, 'token': access_token}), 200

    return jsonify({"msg": "Invalid credentials"}), 401

@auth_blueprint.route('/signup', methods=['POST'])
def signup():
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

