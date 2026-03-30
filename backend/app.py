from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Environment variables load karo
load_dotenv()

# Flask app banao
app = Flask(__name__)
CORS(app)

# Routes import karo
from routes.auth import auth_bp
from routes.jobs import jobs_bp
from routes.resume import resume_bp

# Blueprints register karo
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(resume_bp, url_prefix='/api/resume')

# Server chalao
if __name__ == '__main__':
    app.run(debug=True, port=5000)