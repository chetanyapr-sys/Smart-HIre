from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Environment variables load karo
load_dotenv()

# Flask app banao
app = Flask(__name__)

# Production me sirf apne frontend ka origin allow karo, har jagah se nahi
# FRONTEND_URL me ek ya zyada URL ho sakte hain (comma se alag kiye hue)
# Trailing slash hata dete hain, warna CORS origin match nahi hota
raw_origins = os.getenv('FRONTEND_URL', 'http://localhost:3000')
allowed_origins = [o.strip().rstrip('/') for o in raw_origins.split(',') if o.strip()]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Routes import karo
from routes.auth import auth_bp
from routes.jobs import jobs_bp
from routes.resume import resume_bp

# Blueprints register karo
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(resume_bp, url_prefix='/api/resume')


@app.route('/api/health', methods=['GET'])
def health_check():
    # Deployment platform (Render/Railway) isse check karta hai ki service zinda hai
    return {'status': 'ok'}, 200


# Server chalao
if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_ENV') != 'production'
    port = int(os.getenv('PORT', 5000))
    app.run(debug=debug_mode, host='0.0.0.0', port=port)