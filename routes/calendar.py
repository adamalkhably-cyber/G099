from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models import PlannedOutfit, Outfit, db

calendar_bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')


@calendar_bp.route('', methods=['GET'])
@jwt_required()
def get_calendar():
    """Get all planned outfits for authenticated user"""
    try:
        user_id = get_jwt_identity()
        planned = PlannedOutfit.query.filter_by(user_id=user_id).all()
        return jsonify([item.to_dict() for item in planned]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calendar_bp.route('/month/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
def get_month_calendar(year, month):
    """Get planned outfits for specific month"""
    try:
        user_id = get_jwt_identity()
        
        # Get first and last day of month
        first_day = datetime(year, month, 1).date()
        if month == 12:
            last_day = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            last_day = datetime(year, month + 1, 1).date() - timedelta(days=1)
        
        planned = PlannedOutfit.query.filter(
            PlannedOutfit.user_id == user_id,
            PlannedOutfit.date >= first_day,
            PlannedOutfit.date <= last_day
        ).all()
        
        return jsonify([item.to_dict() for item in planned]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calendar_bp.route('/<date_str>', methods=['GET'])
@jwt_required()
def get_date_outfit(date_str):
    """Get planned outfit for specific date (YYYY-MM-DD format)"""
    try:
        user_id = get_jwt_identity()
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        planned = PlannedOutfit.query.filter_by(
            user_id=user_id,
            date=date
        ).first()
        
        if not planned:
            return jsonify({'error': 'No outfit planned for this date'}), 404
        
        return jsonify(planned.to_dict()), 200
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calendar_bp.route('', methods=['POST'])
@jwt_required()
def plan_outfit():
    """Plan outfit for specific date"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        # Validate required fields
        if 'date' not in data:
            return jsonify({'error': 'Missing required field: date'}), 400
        
        # Parse date
        try:
            date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Check if outfit already exists for this date
        existing = PlannedOutfit.query.filter_by(user_id=user_id, date=date).first()
        if existing:
            return jsonify({'error': 'Outfit already planned for this date'}), 400
        
        # Validate outfit if provided
        outfit = None
        if 'outfit_id' in data:
            outfit = Outfit.query.filter_by(id=data['outfit_id'], user_id=user_id).first()
            if not outfit:
                return jsonify({'error': 'Outfit not found'}), 404
        
        # Create planned outfit
        planned = PlannedOutfit(
            user_id=user_id,
            outfit_id=outfit.id if outfit else None,
            date=date,
            notes=data.get('notes')
        )
        
        db.session.add(planned)
        db.session.commit()
        
        return jsonify({
            'message': 'Outfit planned for this date',
            'planned': planned.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@calendar_bp.route('/<date_str>', methods=['PUT'])
@jwt_required()
def update_planned_outfit(date_str):
    """Update planned outfit for specific date"""
    try:
        user_id = get_jwt_identity()
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        planned = PlannedOutfit.query.filter_by(user_id=user_id, date=date).first()
        
        if not planned:
            return jsonify({'error': 'No outfit planned for this date'}), 404
        
        data = request.json
        
        # Update outfit if provided
        if 'outfit_id' in data:
            if data['outfit_id'] is None:
                planned.outfit_id = None
            else:
                outfit = Outfit.query.filter_by(id=data['outfit_id'], user_id=user_id).first()
                if not outfit:
                    return jsonify({'error': 'Outfit not found'}), 404
                planned.outfit_id = data['outfit_id']
        
        # Update notes if provided
        if 'notes' in data:
            planned.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Planned outfit updated',
            'planned': planned.to_dict()
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@calendar_bp.route('/<date_str>', methods=['DELETE'])
@jwt_required()
def delete_planned_outfit(date_str):
    """Delete planned outfit for specific date"""
    try:
        user_id = get_jwt_identity()
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        planned = PlannedOutfit.query.filter_by(user_id=user_id, date=date).first()
        
        if not planned:
            return jsonify({'error': 'No outfit planned for this date'}), 404
        
        db.session.delete(planned)
        db.session.commit()
        
        return jsonify({'message': 'Planned outfit deleted'}), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@calendar_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_outfits():
    """Get upcoming planned outfits"""
    try:
        user_id = get_jwt_identity()
        today = datetime.utcnow().date()
        
        # Get next 7 days
        planned = PlannedOutfit.query.filter(
            PlannedOutfit.user_id == user_id,
            PlannedOutfit.date >= today,
            PlannedOutfit.date <= today + timedelta(days=7)
        ).order_by(PlannedOutfit.date).all()
        
        return jsonify([item.to_dict() for item in planned]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
