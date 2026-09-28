from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import os
import bcrypt
import jwt
import datetime
from utils.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__)

# MongoDB connect karo
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['smarthire']
users = db['users']

# Signup route
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    team_param = data.get('team')  # Invite link se aaya hua team_id (optional)

    if users.find_one({'email': email}):
        return jsonify({'message': 'User already exists'}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    if team_param:
        # Invite link se signup - check karo ye team_id valid hai
        team_exists = users.find_one({'team_id': team_param})
        if not team_exists:
            return jsonify({'message': 'Invalid invite link'}), 400
        team_id = team_param
        role = 'recruiter'
    else:
        # Naya signup - iski apni nayi team banegi, ye khud admin hoga
        team_id = str(ObjectId())
        role = 'admin'

    users.insert_one({
        'name': name,
        'email': email,
        'password': hashed,
        'team_id': team_id,
        'role': role,
        'created_at': datetime.datetime.utcnow()
    })

    return jsonify({'message': 'User created successfully'}), 201

# Login route
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users.find_one({'email': email})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'message': 'Wrong password'}), 401

    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, os.getenv('SECRET_KEY'), algorithm='HS256')

    return jsonify({'token': token, 'name': user['name']}), 200


# Logged-in user ki apni profile info (Settings page ke liye)
@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user_id):
    user = users.find_one({'_id': ObjectId(current_user_id)})

    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        'name': user['name'],
        'email': user['email'],
        'role': user.get('role', 'admin'),
        'team_id': user.get('team_id'),
        'created_at': user.get('created_at')
    }), 200


# Apni team ke saare members dikhao (Settings > Team ke liye)
@auth_bp.route('/team', methods=['GET'])
@token_required
def get_team(current_user_id):
    user = users.find_one({'_id': ObjectId(current_user_id)})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    team_id = user.get('team_id')
    teammates = list(users.find({'team_id': team_id}))

    result = [{
        'name': t['name'],
        'email': t['email'],
        'role': t.get('role', 'recruiter')
    } for t in teammates]

    return jsonify(result), 200