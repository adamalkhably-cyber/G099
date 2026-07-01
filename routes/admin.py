from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models import User, ClothingItem, Outfit, PlannedOutfit, Favorite, db
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def check_admin_access(f):
    """Decorator to check if user is admin"""
    from functools import wraps
    
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


# ==================== DASHBOARD ====================

@admin_bp.route('/dashboard', methods=['GET'])
@check_admin_access
def get_dashboard():
    """Get dashboard analytics"""
    try:
        # Total counts
        total_users = User.query.count()
        total_items = ClothingItem.query.count()
        total_outfits = Outfit.query.count()
        total_planned = PlannedOutfit.query.count()
        
        # Active users (logged in last 30 days) - based on updated_at
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users = User.query.filter(
            User.updated_at >= thirty_days_ago
        ).count()
        
        # New users this month
        first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_this_month = User.query.filter(
            User.created_at >= first_of_month
        ).count()
        
        # Most popular outfit (by favorites)
        popular_outfit = db.session.query(
            Outfit.id,
            Outfit.name,
            func.count(Favorite.id).label('favorite_count')
        ).outerjoin(Favorite).group_by(Outfit.id).order_by(
            func.count(Favorite.id).desc()
        ).first()
        
        popular_outfit_data = None
        if popular_outfit:
            popular_outfit_data = {
                'id': popular_outfit.id,
                'name': popular_outfit.name,
                'favorites': popular_outfit.favorite_count
            }
        
        # Most popular clothing category
        top_category = db.session.query(
            ClothingItem.category,
            func.count(ClothingItem.id).label('count')
        ).group_by(ClothingItem.category).order_by(
            func.count(ClothingItem.id).desc()
        ).first()
        
        top_category_data = None
        if top_category:
            top_category_data = {
                'category': top_category.category,
                'count': top_category.count
            }
        
        # Most popular color
        top_color = db.session.query(
            ClothingItem.color,
            func.count(ClothingItem.id).label('count')
        ).filter(ClothingItem.color != None).group_by(
            ClothingItem.color
        ).order_by(
            func.count(ClothingItem.id).desc()
        ).first()
        
        top_color_data = None
        if top_color:
            top_color_data = {
                'color': top_color.color,
                'count': top_color.count
            }
        
        return jsonify({
            'summary': {
                'total_users': total_users,
                'active_users': active_users,
                'new_users_this_month': new_users_this_month,
                'total_wardrobe_items': total_items,
                'total_outfits': total_outfits,
                'total_planned_outfits': total_planned
            },
            'top_stats': {
                'most_popular_outfit': popular_outfit_data,
                'top_clothing_category': top_category_data,
                'top_clothing_color': top_color_data
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== USER MANAGEMENT ====================

@admin_bp.route('/users', methods=['GET'])
@check_admin_access
def get_all_users():
    """Get all users with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        
        query = User.query
        
        if search:
            query = query.filter(
                (User.username.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%'))
            )
        
        users = query.paginate(page=page, per_page=per_page, error_out=False)
        
        users_data = []
        for user in users.items:
            user_info = user.to_dict()
            user_info['is_admin'] = user.is_admin
            user_info['items_count'] = len(user.wardrobe_items)
            user_info['outfits_count'] = len(user.outfits)
            user_info['updated_at'] = user.updated_at.isoformat()
            users_data.append(user_info)
        
        return jsonify({
            'users': users_data,
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@check_admin_access
def get_user_details(user_id):
    """Get detailed info about a specific user"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user.to_dict()
        user_data['is_admin'] = user.is_admin
        user_data['updated_at'] = user.updated_at.isoformat()
        user_data['wardrobe_items'] = [item.to_dict() for item in user.wardrobe_items]
        user_data['outfits'] = [outfit.to_dict() for outfit in user.outfits]
        user_data['planned_outfits'] = [outfit.to_dict() for outfit in user.planned_outfits]
        user_data['favorites'] = [fav.to_dict() for fav in user.favorites]
        
        return jsonify(user_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['POST'])
@check_admin_access
def toggle_admin_status(user_id):
    """Toggle admin status for a user"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent disabling own admin status (optional, add this logic if needed)
        current_user_id = get_jwt_identity()
        if current_user_id == user_id:
            return jsonify({'error': 'Cannot modify your own admin status'}), 400
        
        user.is_admin = not user.is_admin
        db.session.commit()
        
        return jsonify({
            'message': f'User admin status updated',
            'is_admin': user.is_admin
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/delete', methods=['DELETE'])
@check_admin_access
def delete_user(user_id):
    """Delete a user and all their data"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deleting own account
        current_user_id = get_jwt_identity()
        if current_user_id == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        username = user.username
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': f'User {username} and all their data deleted'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@check_admin_access
def toggle_user_active(user_id):
    """Activate or deactivate a user account"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if get_jwt_identity() == user_id:
            return jsonify({'error': 'Cannot modify your own active status'}), 400

        user.is_active = not user.is_active
        db.session.commit()

        return jsonify({
            'message': 'User active status updated',
            'is_active': user.is_active
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@check_admin_access
def admin_reset_user_password(user_id):
    """Reset a user's password as an admin"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.json
        if not data or 'new_password' not in data:
            return jsonify({'error': 'Missing new_password'}), 400

        user.set_password(data['new_password'])
        db.session.commit()

        return jsonify({'message': 'User password reset successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/items', methods=['GET'])
@check_admin_access
def get_all_items():
    """Get all wardrobe items across all users"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category = request.args.get('category', type=str)
        color = request.args.get('color', type=str)
        brand = request.args.get('brand', type=str)
        search = request.args.get('search', type=str)

        query = ClothingItem.query
        if category:
            query = query.filter(ClothingItem.category.ilike(f'%{category}%'))
        if color:
            query = query.filter(ClothingItem.color.ilike(f'%{color}%'))
        if brand:
            query = query.filter(ClothingItem.brand.ilike(f'%{brand}%'))
        if search:
            query = query.filter(ClothingItem.name.ilike(f'%{search}%'))

        items = query.paginate(page=page, per_page=per_page, error_out=False)
        items_data = []
        for item in items.items:
            item_data = item.to_dict()
            item_data['username'] = item.user.username
            item_data['user_email'] = item.user.email
            items_data.append(item_data)

        return jsonify({
            'items': items_data,
            'total': items.total,
            'pages': items.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/items/<int:item_id>/delete', methods=['DELETE'])
@check_admin_access
def delete_item(item_id):
    """Delete a wardrobe item"""
    try:
        item = ClothingItem.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        db.session.delete(item)
        db.session.commit()

        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/outfits', methods=['GET'])
@check_admin_access
def get_all_outfits():
    """Get all outfits across all users"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', type=str)
        flagged = request.args.get('flagged', type=str)

        query = Outfit.query
        if search:
            query = query.filter(Outfit.name.ilike(f'%{search}%'))
        if flagged is not None:
            if flagged.lower() in ['true', '1', 'yes']:
                query = query.filter(Outfit.is_flagged.is_(True))
            elif flagged.lower() in ['false', '0', 'no']:
                query = query.filter(Outfit.is_flagged.is_(False))

        outfits = query.paginate(page=page, per_page=per_page, error_out=False)
        outfits_data = []
        for outfit in outfits.items:
            outfits_data.append({
                'id': outfit.id,
                'name': outfit.name,
                'description': outfit.description,
                'is_flagged': outfit.is_flagged,
                'flagged_reason': outfit.flagged_reason,
                'username': outfit.user.username,
                'user_email': outfit.user.email,
                'items': [item.to_dict() for item in outfit.items],
                'created_at': outfit.created_at.isoformat(),
                'updated_at': outfit.updated_at.isoformat() if outfit.updated_at else None
            })

        return jsonify({
            'outfits': outfits_data,
            'total': outfits.total,
            'pages': outfits.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/outfits/<int:outfit_id>/flag', methods=['POST'])
@check_admin_access
def flag_outfit(outfit_id):
    """Flag or unflag an outfit"""
    try:
        outfit = Outfit.query.get(outfit_id)
        if not outfit:
            return jsonify({'error': 'Outfit not found'}), 404

        data = request.json or {}
        if 'is_flagged' in data:
            outfit.is_flagged = bool(data['is_flagged'])
        else:
            outfit.is_flagged = True

        if 'flagged_reason' in data:
            outfit.flagged_reason = data['flagged_reason']

        db.session.commit()

        return jsonify({
            'message': 'Outfit flag status updated',
            'is_flagged': outfit.is_flagged,
            'flagged_reason': outfit.flagged_reason
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/outfits/<int:outfit_id>/delete', methods=['DELETE'])
@check_admin_access
def delete_outfit_admin(outfit_id):
    """Delete an outfit"""
    try:
        outfit = Outfit.query.get(outfit_id)
        if not outfit:
            return jsonify({'error': 'Outfit not found'}), 404

        db.session.delete(outfit)
        db.session.commit()

        return jsonify({'message': 'Outfit deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== SYSTEM STATS ====================

@admin_bp.route('/stats/users', methods=['GET'])
@check_admin_access
def get_user_stats():
    """Get user growth statistics"""
    try:
        # Users by month (last 12 months)
        months_ago = datetime.utcnow() - timedelta(days=365)
        
        # Count users created each month
        users_by_month = db.session.query(
            func.strftime('%Y-%m', User.created_at).label('month'),
            func.count(User.id).label('count')
        ).filter(User.created_at >= months_ago).group_by(
            func.strftime('%Y-%m', User.created_at)
        ).order_by(
            func.strftime('%Y-%m', User.created_at)
        ).all()
        
        monthly_data = [{'month': month, 'count': count} for month, count in users_by_month]
        
        return jsonify({
            'monthly_growth': monthly_data,
            'total_users': User.query.count()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/stats/wardrobe', methods=['GET'])
@check_admin_access
def get_wardrobe_stats():
    """Get wardrobe statistics across all users"""
    try:
        # Total stats
        total_items = ClothingItem.query.count()
        
        # Category breakdown
        categories = db.session.query(
            ClothingItem.category,
            func.count(ClothingItem.id).label('count')
        ).group_by(ClothingItem.category).all()
        
        category_data = [{'category': cat, 'count': count} for cat, count in categories]
        
        # Color breakdown
        colors = db.session.query(
            ClothingItem.color,
            func.count(ClothingItem.id).label('count')
        ).filter(ClothingItem.color != None).group_by(
            ClothingItem.color
        ).order_by(
            func.count(ClothingItem.id).desc()
        ).limit(10).all()
        
        color_data = [{'color': color, 'count': count} for color, count in colors]
        
        brands = db.session.query(
            ClothingItem.brand,
            func.count(ClothingItem.id).label('count')
        ).filter(ClothingItem.brand != None).group_by(
            ClothingItem.brand
        ).order_by(
            func.count(ClothingItem.id).desc()
        ).limit(10).all()
        
        brand_data = [{'brand': brand, 'count': count} for brand, count in brands]
        
        # Average items per user
        avg_items_per_user = db.session.query(
            func.avg(func.count(ClothingItem.id))
        ).select_entity_from(ClothingItem).group_by(ClothingItem.user_id).scalar() or 0
        
        return jsonify({
            'total_items': total_items,
            'avg_items_per_user': round(float(avg_items_per_user), 2),
            'categories': category_data,
            'top_colors': color_data,
            'top_brands': brand_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/stats/outfits', methods=['GET'])
@check_admin_access
def get_outfit_stats():
    """Get outfit statistics across all users"""
    try:
        total_outfits = Outfit.query.count()
        total_planned = PlannedOutfit.query.count()
        total_favorites = Favorite.query.count()
        
        # Average outfits per user
        avg_outfits_per_user = db.session.query(
            func.avg(func.count(Outfit.id))
        ).select_entity_from(Outfit).group_by(Outfit.user_id).scalar() or 0
        
        # Top 5 most favorited outfits
        top_outfits = db.session.query(
            Outfit.id,
            Outfit.name,
            func.count(Favorite.id).label('favorite_count')
        ).outerjoin(Favorite).group_by(Outfit.id).order_by(
            func.count(Favorite.id).desc()
        ).limit(5).all()
        
        top_outfits_data = [
            {'id': outfit.id, 'name': outfit.name, 'favorites': outfit.favorite_count}
            for outfit in top_outfits
        ]
        
        return jsonify({
            'total_outfits': total_outfits,
            'total_planned_outfits': total_planned,
            'total_favorites': total_favorites,
            'avg_outfits_per_user': round(float(avg_outfits_per_user), 2),
            'top_outfits': top_outfits_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== ACTIVITY ====================

@admin_bp.route('/activity/recent', methods=['GET'])
@check_admin_access
def get_recent_activity():
    """Get recent user activity"""
    try:
        limit = request.args.get('limit', 20, type=int)
        
        # Get recently active users
        active_users = User.query.order_by(User.updated_at.desc()).limit(limit).all()
        
        activity_data = []
        for user in active_users:
            activity_data.append({
                'username': user.username,
                'email': user.email,
                'last_active': user.updated_at.isoformat(),
                'created_at': user.created_at.isoformat()
            })
        
        return jsonify({'recent_activity': activity_data}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/health', methods=['GET'])
@check_admin_access
def admin_health():
    """Admin health check"""
    try:
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500
