from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Mail, Message
from datetime import datetime, timedelta
import secrets
import string
from models import User, db

auth_bp = Blueprint("auth", __name__)
mail = None  # Will be initialized in app.py

def init_mail(app):
    """Initialize mail with app context"""
    global mail
    mail = Mail(app)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        
        # Validate required fields
        if not all(k in data for k in ['username', 'email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            last_login=datetime.utcnow()
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create JWT token
        # NOTE: identity must be a string - flask-jwt-extended 4.x rejects
        # a raw int "sub" claim on decode with a 422 error.
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            "user": {
                   "id": user.id,
                   "username": user.username,
                   "email": user.email,
                   "is_admin": user.is_admin
                    }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        
        if not all(k in data for k in ['email', 'password']):
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        if not user.is_active:
            return jsonify({'error': 'User account is deactivated'}), 403
       
        # Update last activity
        user.updated_at = datetime.utcnow()
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create JWT token
        # NOTE: identity must be a string - flask-jwt-extended 4.x rejects
        # a raw int "sub" claim on decode with a 422 error.
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
    "message": "Login successful",
    "access_token": access_token,
    "user": {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin
    }
}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
    "id": user.id,
    "username": user.username,
    "email": user.email,
    "is_admin": user.is_admin
     }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password for the currently authenticated user.

    Requires the current password to verify it's really the account
    owner making the change (a valid JWT alone isn't enough - if a
    session token ever leaked, this stops someone from silently
    locking the real owner out).
    """
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.json or {}

        if not all(k in data for k in ['current_password', 'new_password']):
            return jsonify({'error': 'Missing current or new password'}), 400

        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401

        new_password = data['new_password']
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400

        user.set_password(new_password)
        db.session.commit()

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email"""
    try:
        data = request.json
        
        if 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            # Return success even if user doesn't exist (security best practice)
            return jsonify({'message': 'If email exists, reset link has been sent'}), 200
        
        # Generate a 6-digit verification code rather than a long token
        # embedded in a clickable link. This is what actually verifies
        # the person resetting the password has access to this email
        # inbox - a link can silently break (wrong protocol/host, as it
        # did here with a hardcoded https:// link against a plain HTTP
        # dev server), get pre-fetched by email security scanners, or
        # get forwarded; a code the user has to manually type back in
        # doesn't have those problems and is a clearer "verification
        # step" against someone who only knows the account's email.
        code = ''.join(secrets.choice(string.digits) for _ in range(6))
        user.reset_token = code
        user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
        db.session.commit()

        # Still build a direct link as a convenience (no secret token in
        # it now, just the email, so it's safe to include) - and derive
        # the host from the actual incoming request instead of a
        # hardcoded value, so it keeps working wherever this is deployed.
        reset_link = f"{request.host_url.rstrip('/')}/reset-password?email={user.email}"

        if mail:
            try:
                print(f"PASSWORD RESET CODE for {user.email}: {code}")
                msg = Message(
                    'Password Reset Verification Code',
                    recipients=[user.email]
                )
                msg.body = f'''Your password reset verification code is: {code}

Enter this code on the password reset page to continue:
{reset_link}

This code will expire in 15 minutes.

If you did not request a password reset, please ignore this email and your password will remain unchanged.
'''
                mail.send(msg)
            except Exception as email_error:
                print(f"Email error: {email_error}")
        else:
            # No mail configured (e.g. local dev) - print the code so
            # the flow is still testable without a real inbox.
            print(f"PASSWORD RESET CODE for {user.email}: {code}")

        return jsonify({'message': 'If that email exists, a verification code has been sent.'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password after verifying the emailed code.

    Requires the code sent to the account's email, not just the email
    address - this is the verification step that stops someone who
    merely knows or guesses a user's email from resetting their
    password. They would also need access to that inbox to see the code.
    """
    try:
        data = request.json or {}

        if not all(k in data for k in ['email', 'code', 'new_password']):
            return jsonify({'error': 'Missing email, code, or new password'}), 400

        user = User.query.filter_by(email=data['email']).first()

        # Same error either way - whether the email doesn't exist or the
        # code is just wrong - so an attacker can't use this endpoint to
        # figure out which accounts exist.
        if not user or not user.reset_token or user.reset_token != data['code']:
            return jsonify({'error': 'Invalid verification code'}), 400

        if not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
            return jsonify({'error': 'Verification code has expired. Please request a new one.'}), 400

        new_password = data['new_password']
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400

        # Set new password
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        return jsonify({'message': 'Password reset successful'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/announcement', methods=['GET'])
@jwt_required()
def get_announcement():
    """Retrieve the current active system-wide announcement"""
    try:
        from models import SystemAnnouncement
        announcement = SystemAnnouncement.query.filter_by(active=True).order_by(SystemAnnouncement.created_at.desc()).first()
        if announcement:
            return jsonify({'ok': True, 'announcement': announcement.to_dict()}), 200
        return jsonify({'ok': True, 'announcement': None}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500