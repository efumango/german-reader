from . import auth_blueprint
from sqlalchemy.exc import IntegrityError
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models import User
import logging

@auth_blueprint.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify(user={'user_id': user.id, 'username': username, 'token': access_token}), 200

    return jsonify({"msg": "Invalid credentials"}), 401

# Configure logging
logging.basicConfig(level=logging.DEBUG)

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
        logging.debug(f"User {username} registered successfully")
        return jsonify({'message': 'User registered successfully'}), 201
    except IntegrityError as e:
        db.session.rollback()
        logging.error(f"IntegrityError: {e}")
        return jsonify({'message': 'Failed to register user'}), 500
    except Exception as e:
        db.session.rollback()
        logging.error(f"Unexpected error: {e}")
        return jsonify({'message': 'Failed to register user'}), 500