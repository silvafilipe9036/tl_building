from flask import Blueprint, request, jsonify
from datetime import datetime
import jwt
import os

properties_bp = Blueprint('properties', __name__)

SECRET_KEY = os.environ.get('SECRET_KEY', 'tl-building-secret-key-2025')

# Mock properties database
properties_db = [
    {
        'id': '1',
        'title': 'Apartamento 2 quartos - Centro',
        'description': 'Apartamento moderno no centro da cidade com vista panorâmica',
        'type': 'APARTMENT',
        'status': 'AVAILABLE',
        'address': 'Rua das Flores, 123',
        'city': 'São Paulo',
        'state': 'SP',
        'zipCode': '01234-567',
        'monthlyRent': 2500.00,
        'bedrooms': 2,
        'bathrooms': 1,
        'area': 65.5,
        'parking': 1,
        'furnished': True,
        'petAllowed': False,
        'images': [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
        ],
        'amenities': ['Piscina', 'Academia', 'Portaria 24h', 'Elevador'],
        'ownerId': '1',
        'createdAt': '2025-01-01T00:00:00Z',
        'updatedAt': '2025-01-15T00:00:00Z'
    },
    {
        'id': '2',
        'title': 'Casa 3 quartos - Jardins',
        'description': 'Casa espaçosa com quintal e área gourmet',
        'type': 'HOUSE',
        'status': 'RENTED',
        'address': 'Rua dos Pinheiros, 456',
        'city': 'São Paulo',
        'state': 'SP',
        'zipCode': '01234-890',
        'monthlyRent': 4500.00,
        'bedrooms': 3,
        'bathrooms': 2,
        'area': 120.0,
        'parking': 2,
        'furnished': False,
        'petAllowed': True,
        'images': [
            'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
        ],
        'amenities': ['Quintal', 'Área Gourmet', 'Garagem Coberta'],
        'ownerId': '1',
        'tenantId': '2',
        'createdAt': '2024-12-01T00:00:00Z',
        'updatedAt': '2025-01-10T00:00:00Z'
    },
    {
        'id': '3',
        'title': 'Studio - Vila Madalena',
        'description': 'Studio moderno e compacto em localização privilegiada',
        'type': 'STUDIO',
        'status': 'MAINTENANCE',
        'address': 'Rua Harmonia, 789',
        'city': 'São Paulo',
        'state': 'SP',
        'zipCode': '05435-000',
        'monthlyRent': 1800.00,
        'bedrooms': 0,
        'bathrooms': 1,
        'area': 35.0,
        'parking': 0,
        'furnished': True,
        'petAllowed': False,
        'images': [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
        ],
        'amenities': ['Internet', 'Mobiliado'],
        'ownerId': '1',
        'createdAt': '2024-11-15T00:00:00Z',
        'updatedAt': '2025-01-20T00:00:00Z'
    }
]

def verify_token():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except:
        return None

@properties_bp.route('/properties', methods=['GET'])
def get_properties():
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        status = request.args.get('status')
        property_type = request.args.get('type')
        city = request.args.get('city')
        min_rent = request.args.get('minRent')
        max_rent = request.args.get('maxRent')
        
        # Filter properties
        filtered_properties = properties_db.copy()
        
        if status:
            filtered_properties = [p for p in filtered_properties if p['status'] == status.upper()]
        
        if property_type:
            filtered_properties = [p for p in filtered_properties if p['type'] == property_type.upper()]
        
        if city:
            filtered_properties = [p for p in filtered_properties if city.lower() in p['city'].lower()]
        
        if min_rent:
            filtered_properties = [p for p in filtered_properties if p['monthlyRent'] >= float(min_rent)]
        
        if max_rent:
            filtered_properties = [p for p in filtered_properties if p['monthlyRent'] <= float(max_rent)]
        
        # Pagination
        total = len(filtered_properties)
        start = (page - 1) * limit
        end = start + limit
        paginated_properties = filtered_properties[start:end]
        
        return jsonify({
            'success': True,
            'message': 'Imóveis obtidos com sucesso',
            'data': {
                'properties': paginated_properties,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'totalPages': (total + limit - 1) // limit
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'code': 'INTERNAL_ERROR'
        }), 500

@properties_bp.route('/properties/<property_id>', methods=['GET'])
def get_property(property_id):
    try:
        property_data = next((p for p in properties_db if p['id'] == property_id), None)
        
        if not property_data:
            return jsonify({
                'success': False,
                'message': 'Imóvel não encontrado',
                'code': 'PROPERTY_NOT_FOUND'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Imóvel obtido com sucesso',
            'data': property_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'code': 'INTERNAL_ERROR'
        }), 500

@properties_bp.route('/properties', methods=['POST'])
def create_property():
    try:
        user = verify_token()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Token de acesso inválido',
                'code': 'INVALID_TOKEN'
            }), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'type', 'address', 'city', 'state', 'monthlyRent']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Campo {field} é obrigatório',
                    'code': 'MISSING_FIELD'
                }), 400
        
        # Create new property
        new_property = {
            'id': str(len(properties_db) + 1),
            'title': data['title'],
            'description': data['description'],
            'type': data['type'].upper(),
            'status': 'AVAILABLE',
            'address': data['address'],
            'city': data['city'],
            'state': data['state'],
            'zipCode': data.get('zipCode', ''),
            'monthlyRent': float(data['monthlyRent']),
            'bedrooms': int(data.get('bedrooms', 0)),
            'bathrooms': int(data.get('bathrooms', 1)),
            'area': float(data.get('area', 0)),
            'parking': int(data.get('parking', 0)),
            'furnished': bool(data.get('furnished', False)),
            'petAllowed': bool(data.get('petAllowed', False)),
            'images': data.get('images', []),
            'amenities': data.get('amenities', []),
            'ownerId': user['userId'],
            'createdAt': datetime.utcnow().isoformat() + 'Z',
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        properties_db.append(new_property)
        
        return jsonify({
            'success': True,
            'message': 'Imóvel criado com sucesso',
            'data': new_property
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'code': 'INTERNAL_ERROR'
        }), 500

@properties_bp.route('/properties/<property_id>', methods=['PUT'])
def update_property(property_id):
    try:
        user = verify_token()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Token de acesso inválido',
                'code': 'INVALID_TOKEN'
            }), 401
        
        property_index = next((i for i, p in enumerate(properties_db) if p['id'] == property_id), None)
        
        if property_index is None:
            return jsonify({
                'success': False,
                'message': 'Imóvel não encontrado',
                'code': 'PROPERTY_NOT_FOUND'
            }), 404
        
        property_data = properties_db[property_index]
        
        # Check ownership
        if property_data['ownerId'] != user['userId'] and user['role'] != 'ADMIN':
            return jsonify({
                'success': False,
                'message': 'Sem permissão para editar este imóvel',
                'code': 'PERMISSION_DENIED'
            }), 403
        
        data = request.get_json()
        
        # Update property
        updatable_fields = [
            'title', 'description', 'type', 'status', 'address', 'city', 'state', 
            'zipCode', 'monthlyRent', 'bedrooms', 'bathrooms', 'area', 'parking',
            'furnished', 'petAllowed', 'images', 'amenities'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field in ['monthlyRent', 'area']:
                    property_data[field] = float(data[field])
                elif field in ['bedrooms', 'bathrooms', 'parking']:
                    property_data[field] = int(data[field])
                elif field in ['furnished', 'petAllowed']:
                    property_data[field] = bool(data[field])
                else:
                    property_data[field] = data[field]
        
        property_data['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
        
        return jsonify({
            'success': True,
            'message': 'Imóvel atualizado com sucesso',
            'data': property_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'code': 'INTERNAL_ERROR'
        }), 500

@properties_bp.route('/properties/<property_id>', methods=['DELETE'])
def delete_property(property_id):
    try:
        user = verify_token()
        if not user:
            return jsonify({
                'success': False,
                'message': 'Token de acesso inválido',
                'code': 'INVALID_TOKEN'
            }), 401
        
        property_index = next((i for i, p in enumerate(properties_db) if p['id'] == property_id), None)
        
        if property_index is None:
            return jsonify({
                'success': False,
                'message': 'Imóvel não encontrado',
                'code': 'PROPERTY_NOT_FOUND'
            }), 404
        
        property_data = properties_db[property_index]
        
        # Check ownership
        if property_data['ownerId'] != user['userId'] and user['role'] != 'ADMIN':
            return jsonify({
                'success': False,
                'message': 'Sem permissão para deletar este imóvel',
                'code': 'PERMISSION_DENIED'
            }), 403
        
        # Remove property
        properties_db.pop(property_index)
        
        return jsonify({
            'success': True,
            'message': 'Imóvel deletado com sucesso'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'code': 'INTERNAL_ERROR'
        }), 500

