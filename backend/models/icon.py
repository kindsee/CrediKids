from . import db

class Icon(db.Model):
    """25 iconos disponibles para códigos de acceso"""
    __tablename__ = 'icons'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon_path = db.Column(db.String(200), nullable=False)  # URL o emoji
    display_order = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'icon_path': self.icon_path,
            'display_order': self.display_order
        }
