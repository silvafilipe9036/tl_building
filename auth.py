from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import hashlib
import os

auth_bp = Blueprint('auth', __name__)

# Mock database for demo
users_db = {
    'admin@tlbuilding.com': {
        'id': '1',
        'email': 'admin@tlbuilding.com',
        'password': hashlib.sha256('123456'.encode()).hexdigest(),
        'firstName': 'João',
        'lastName': 'Silva',
        'role': 'OWNER',
        'isActive': True,
        'emailVerified': True,
        'createdAt': '2025-01-01T00:00:00Z'
    },
    'user@tlbuilding.com': {
        'id': '2',
        'email': 'user@tlbuilding.com',
        'password': hashlib.sha256('123456'.encode()).hexdigest(),
        'firstName': 'Maria',
        'lastName': 'Santos',
        'role': 'TENANT',
        'isActive': True,
        'emailVerified': True,
        'createdAt': '2025-01-01T00:00:00Z'
    }
}

SECRET_KEY = os.environ.get('SECRET_KEY', 'tl-building-secret-key-2025')

def generate_token(user_data):
    payload = {
        'userId': user_data['id'],
        'email': user_data['email'],
        'role': user_data['role'],
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email e senha são obrigatórios',
                'code': 'MISSING_CREDENTIALS'
            }), 400
        
        # For demo purposes, accept any email/password combination
        # In production, this would check against a real database
        if email in users_db:
            user = users_db[email]
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            if user['password'] == password_hash:
                # Use existing user
                user_data = user.copy()
            else:
                # For demo, still allow login with any password
                user_data = user.copy()
        else:
            # Create demo user for any email
            user_data = {
                'id': str(len(users_db) + 1),
                'email': email,
                'firstName': 'Demo',
                'lastName': 'User',
                'role': 'TENANT',
                'isActive': True,
                'emailVerified': True,
                'createdAt': datetime.utcnow().isoformat() + 'Z'
            }
        
        # Remove password from response
        user_data.pop('password', None)
        
        token = generate_token(user_data)
        
        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso',
            'data': {
                'user': user_data,
                'accessToken': token,
                'expiresIn': 7 * 24 * 60 * 60  # 7 days in seconds
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'code': 'INTERNAL_ERROR'
        }), 500

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        firstName = data.get('firstName', '')
        lastName = data.get('lastName', '')
        
        if not all([email, password, firstName, lastName]):
            return jsonify({
                'success': False,
                'message': 'Todos os campos são obrigatórios',
                'code': 'MISSING_FIELDS'
            }), 400
        
        # Check if user already exists
        if email in users_db:
            return jsonify({
                'success': False,
                'message': 'Email já está em uso',
                'code': 'EMAIL_EXISTS'
            }), 409
        
        # Create new user
        user_data = {
            'id': str(len(users_db) + 1),
            'email': email,
            'firstName': firstName,
            'lastName': lastName,
            'role': 'TENANT',
            'isActive': True,
            'emailVerified': False,
            'createdAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Store user (in production, this would be in a database)
        users_db[email] = {
            **user_data,
            'password': hashlib.sha256(password.encode()).hexdigest()
        }
        
        token = generate_token(user_data)
        
        return jsonify({
            'success': True,
            'message': 'Usuário registrado com sucesso',
            'data': {
                'user': user_data,
                'accessToken': token,
                'expiresIn': 7 * 24 * 60 * 60  # 7 days in seconds
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'code': 'INTERNAL_ERROR'
        }), 500

@auth_bp.route('/auth/profile', methods=['GET'])
def get_profile():
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token de acesso não fornecido',
                'code': 'NO_TOKEN'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_email = payload.get('email')
            
            if user_email in users_db:
                user_data = users_db[user_email].copy()
                user_data.pop('password', None)
                
                return jsonify({
                    'success': True,
                    'message': 'Perfil obtido com sucesso',
                    'data': user_data
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Usuário não encontrado',
                    'code': 'USER_NOT_FOUND'
                }), 404
                
        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'message': 'Token expirado',
                'code': 'TOKEN_EXPIRED'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'message': 'Token inválido',
                'code': 'INVALID_TOKEN'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'code': 'INTERNAL_ERROR'
        }), 500

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    return jsonify({
        'success': True,
        'message': 'Logout realizado com sucesso'
    })

