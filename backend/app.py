from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
from routes.issue import issue_bp
from routes.verify import verify_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)  # allow the React frontend (different port) to call this API
    db.init_app(app)

    app.register_blueprint(issue_bp)
    app.register_blueprint(verify_bp)

    with app.app_context():
        db.create_all()

    @app.route("/")
    def health():
        return {"status": "Certificate Verification API is running"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
