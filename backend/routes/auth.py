from flask import Blueprint, request, jsonify
from pymongo import MongoClient
import os
import bcrypt
import jwt
import datetime

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

    # Check karo user pehle se hai ya nahi
    if users.find_one({'email': email}):
        return jsonify({'message': 'User already exists'}), 400

    # Password encrypt karo
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # User save karo
    users.insert_one({
        'name': name,
        'email': email,
        'password': hashed,
        'created_at': datetime.datetime.utcnow()
    })

    return jsonify({'message': 'User created successfully'}), 201

# Login route
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # User dhundo
    user = users.find_one({'email': email})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Password check karo
    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'message': 'Wrong password'}), 401

    # JWT token banao
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, os.getenv('SECRET_KEY'), algorithm='HS256')

    return jsonify({'token': token, 'name': user['name']}), 200