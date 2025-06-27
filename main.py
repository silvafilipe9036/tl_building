import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from datetime import datetime
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.properties import properties_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'tl-building-secret-key-2025')

# Configure CORS
CORS(app, origins=[
    'http://localhost:3000',
    'http://localhost:5173',
    'https://fohzwuik.manus.space',
    'https://tlbuilding.com',
    '*'  # For development
])

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(properties_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'success': True,
        'message': 'TL Building System API is healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'version': '1.0.0',
        'service': 'Flask Backend'
    })

# API documentation endpoint
@app.route('/api')
def api_docs():
    return jsonify({
        'success': True,
        'message': 'TL Building System API',
        'version': '1.0.0',
        'documentation': '/api',
        'health': '/health',
        'endpoints': {
            'auth': {
                'login': 'POST /api/auth/login',
                'register': 'POST /api/auth/register',
                'profile': 'GET /api/auth/profile',
                'logout': 'POST /api/auth/logout'
            },
            'properties': {
                'list': 'GET /api/properties',
                'get': 'GET /api/properties/{id}',
                'create': 'POST /api/properties',
                'update': 'PUT /api/properties/{id}',
                'delete': 'DELETE /api/properties/{id}'
            },
            'users': {
                'list': 'GET /api/users',
                'get': 'GET /api/users/{id}',
                'create': 'POST /api/users',
                'update': 'PUT /api/users/{id}',
                'delete': 'DELETE /api/users/{id}'
            }
        },
        'demo': {
            'login': {
                'email': 'admin@tlbuilding.com',
                'password': '123456'
            },
            'note': 'Use any email and password for demo access'
        }
    })

# Serve frontend files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return jsonify({
            'success': False,
            'message': 'Static folder not configured',
            'code': 'NO_STATIC_FOLDER'
        }), 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return jsonify({
                'success': False,
                'message': 'Frontend not found. Please build and deploy the frontend first.',
                'code': 'FRONTEND_NOT_FOUND',
                'api_docs': '/api'
            }), 404

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint não encontrado',
        'code': 'NOT_FOUND',
        'available_endpoints': '/api'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Erro interno do servidor',
        'code': 'INTERNAL_ERROR'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

