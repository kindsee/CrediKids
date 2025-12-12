def register_blueprints(app):
    """Register all blueprints"""
    from .auth import auth_bp
    from .users import users_bp
    from .tasks import tasks_bp
    from .rewards import rewards_bp
    from .calendar import calendar_bp
    from .icons import icons_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(rewards_bp, url_prefix='/api/rewards')
    app.register_blueprint(calendar_bp, url_prefix='/api/calendar')
    app.register_blueprint(icons_bp, url_prefix='/api/icons')
