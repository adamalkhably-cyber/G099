from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import ClothingItem, User, db

wardrobe_bp = Blueprint('wardrobe', __name__, url_prefix='/api/wardrobe')


@wardrobe_bp.route('', methods=['GET'])
@jwt_required()
def get_wardrobe():
    """Get all wardrobe items for authenticated user"""
    try:
        user_id = get_jwt_identity()
        items = ClothingItem.query.filter_by(user_id=user_id).all()
        return jsonify([item.to_dict() for item in items]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@wardrobe_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_wardrobe_item(item_id):
    """Get specific wardrobe item"""
    try:
        user_id = get_jwt_identity()
        item = ClothingItem.query.filter_by(id=item_id, user_id=user_id).first()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        return jsonify(item.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@wardrobe_bp.route('', methods=['POST'])
@jwt_required()
def create_wardrobe_item():
    """Add new item to wardrobe"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        # Validate required fields
        if not all(k in data for k in ['name', 'category']):
            return jsonify({'error': 'Missing required fields: name, category'}), 400
        
        # Create new item
        item = ClothingItem(
            user_id=user_id,
            name=data['name'],
            category=data['category'],
            color=data.get('color'),
            size=data.get('size'),
            image_path=data.get('image_path'),
            description=data.get('description')
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Item added to wardrobe',
            'item': item.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wardrobe_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_wardrobe_item(item_id):
    """Update wardrobe item"""
    try:
        user_id = get_jwt_identity()
        item = ClothingItem.query.filter_by(id=item_id, user_id=user_id).first()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        data = request.json
        
        # Update fields
        if 'name' in data:
            item.name = data['name']
        if 'category' in data:
            item.category = data['category']
        if 'color' in data:
            item.color = data['color']
        if 'size' in data:
            item.size = data['size']
        if 'description' in data:
            item.description = data['description']
        if 'image_path' in data:
            item.image_path = data['image_path']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Item updated',
            'item': item.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wardrobe_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_wardrobe_item(item_id):
    """Delete wardrobe item"""
    try:
        user_id = get_jwt_identity()
        item = ClothingItem.query.filter_by(id=item_id, user_id=user_id).first()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Item deleted'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wardrobe_bp.route('/search', methods=['GET'])
@jwt_required()
def search_wardrobe():
    """Search wardrobe by category, color, or name"""
    try:
        user_id = get_jwt_identity()
        category = request.args.get('category')
        color = request.args.get('color')
        name = request.args.get('name')
        
        query = ClothingItem.query.filter_by(user_id=user_id)
        
        if category:
            query = query.filter_by(category=category)
        if color:
            query = query.filter_by(color=color)
        if name:
            query = query.filter(ClothingItem.name.ilike(f'%{name}%'))
        
        items = query.all()
        return jsonify([item.to_dict() for item in items]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@wardrobe_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_wardrobe_stats():
    """Get wardrobe statistics"""
    try:
        user_id = get_jwt_identity()
        items = ClothingItem.query.filter_by(user_id=user_id).all()
        
        # Count by category
        categories = {}
        colors = {}
        for item in items:
            categories[item.category] = categories.get(item.category, 0) + 1
            if item.color:
                colors[item.color] = colors.get(item.color, 0) + 1
        
        return jsonify({
            'total_items': len(items),
            'categories': categories,
            'colors': colors
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
