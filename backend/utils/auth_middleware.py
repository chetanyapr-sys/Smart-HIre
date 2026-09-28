from functools import wraps
from flask import request, jsonify
import jwt
import os


def token_required(f):
    """
    Ye decorator kisi bhi route ko lagao to us route ko sirf valid
    JWT token ke saath hi hit kiya ja sakega. Bina token / expired
    token / galat token pe 401 return hoga.

    Usage:
        @jobs_bp.route('/create', methods=['POST'])
        @token_required
        def create_job(current_user_id):
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Token missing. Please login again.'}), 401

        token = auth_header.split(' ', 1)[1].strip()

        try:
            payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired. Please login again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token.'}), 401

        # current_user_id ko route function me pehle argument ke through pass karo
        return f(payload.get('user_id'), *args, **kwargs)

    return decorated