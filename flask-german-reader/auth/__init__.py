from flask import Blueprint
auth_blueprint = Blueprint('auth', __name__)

from . import routes
from extensions import login_manager
from models import User

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
    