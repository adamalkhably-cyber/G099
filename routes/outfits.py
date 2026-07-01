from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Outfit, ClothingItem, Favorite, db

outfits_bp = Blueprint('outfits', __name__, url_prefix='/api/outfits')


@outfits_bp.route('', methods=['GET'])
@jwt_required()
def get_outfits():
    """Get all outfits for authenticated user"""
    try:
        user_id = get_jwt_identity()
        outfits = Outfit.query.filter_by(user_id=user_id).all()
        return jsonify([outfit.to_dict() for outfit in outfits]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@outfits_bp.route('/<int:outfit_id>', methods=['GET'])
@jwt_required()
def get_outfit(outfit_id):
    """Get specific outfit"""
    try:
        user_id = get_jwt_identity()
        outfit = Outfit.query.filter_by(id=outfit_id, user_id=user_id).first()
        
        if not outfit:
            return jsonify({'error': 'Outfit not found'}), 404
        
        return jsonify(outfit.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@outfits_bp.route('', methods=['POST'])
@jwt_required()
def create_outfit():
    """Create new outfit"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        # Validate required fields
        if not all(k in data for k in ['name']):
            return jsonify({'error': 'Missing required field: name'}), 400
        
        # Create outfit
        outfit = Outfit(
            user_id=user_id,
            name=data['name'],
            description=data.get('description')
        )
        
        # Add items to outfit
        if 'item_ids' in data and data['item_ids']:
            items = ClothingItem.query.filter(
                ClothingItem.id.in_(data['item_ids']),
                ClothingItem.user_id == user_id
            ).all()
            
            if len(items) != len(data['item_ids']):
                return jsonify({'error': 'Some items not found or do not belong to user'}), 400
            
            outfit.items = items
        
        db.session.add(outfit)
        db.session.commit()
        
        return jsonify({
            'message': 'Outfit created',
            'outfit': outfit.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@outfits_bp.route('/<int:outfit_id>', methods=['PUT'])
@jwt_required()
def update_outfit(outfit_id):
    """Update outfit"""
    try:
        user_id = get_jwt_identity()
        outfit = Outfit.query.filter_by(id=outfit_id, user_id=user_id).first()
        
        if not outfit:
            return jsonify({'error': 'Outfit not found'}), 404
        
        data = request.json
        
        # Update fields
        if 'name' in data:
            outfit.name = data['name']
        if 'description' in data:
            outfit.description = data['description']
        
        # Update items
        if 'item_ids' in data:
            items = ClothingItem.query.filter(
                ClothingItem.id.in_(data['item_ids']),
                ClothingItem.user_id == user_id
            ).all()
            
            if len(items) != len(data['item_ids']):
                return jsonify({'error': 'Some items not found or do not belong to user'}), 400
            
            outfit.items = items
        
        db.session.commit()
        
        return jsonify({
            'message': 'Outfit updated',
            'outfit': outfit.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@outfits_bp.route('/<int:outfit_id>', methods=['DELETE'])
@jwt_required()
def delete_outfit(outfit_id):
    """Delete outfit"""
    try:
        user_id = get_jwt_identity()
        outfit = Outfit.query.filter_by(id=outfit_id, user_id=user_id).first()
        
        if not outfit:
            return jsonify({'error': 'Outfit not found'}), 404
        
        db.session.delete(outfit)
        db.session.commit()
        
        return jsonify({'message': 'Outfit deleted'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@outfits_bp.route('/<int:outfit_id>/items/<int:item_id>', methods=['POST'])
@jwt_required()
def add_item_to_outfit(outfit_id, item_id):
    """Add item to outfit"""
    try:
        user_id = get_jwt_identity()
        outfit = Outfit.query.filter_by(id=outfit_id, user_id=user_id).first()
        
        if not outfit:
            return jsonify({'error': 'Outfit not found'}), 404
        
        item = ClothingItem.query.filter_by(id=item_id, user_id=user_id).first()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item not in outfit.items:
            outfit.items.append(item)
            db.session.commit()
        
        return jsonify({
            'message': 'Item added to outfit',
            'outfit': outfit.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@outfits_bp.route('/<int:outfit_id>/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_item_from_outfit(outfit_id, item_id):
    """Remove item from outfit"""
    try:
        user_id = get_jwt_identity()
        outfit = Outfit.query.filter_by(id=outfit_id, user_id=user_id).first()
        
        if not outfit:
            return jsonify({'error': 'Outfit not found'}), 404
        
        item = ClothingItem.query.filter_by(id=item_id, user_id=user_id).first()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item in outfit.items:
            outfit.items.remove(item)
            db.session.commit()
        
        return jsonify({
            'message': 'Item removed from outfit',
            'outfit': outfit.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
