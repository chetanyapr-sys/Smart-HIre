from flask import Blueprint, request, jsonify, Response
from pymongo import MongoClient
from bson import ObjectId
import os
import datetime
import PyPDF2
import io
import csv
import base64
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import spacy
from utils.auth_middleware import token_required

resume_bp = Blueprint('resume', __name__)

# Models load karo
nlp = spacy.load('en_core_web_sm')
model = SentenceTransformer('all-MiniLM-L6-v2')

# MongoDB connect karo
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['smarthire']
candidates_collection = db['candidates']
jobs = db['jobs']
users_collection = db['users']

# Email match case-insensitive karne ke liye (Pankaj@Gmail.com == pankaj@gmail.com)
EMAIL_COLLATION = {'locale': 'en', 'strength': 2}


# ---------------------------------------------------------------
# Team access helpers (jobs.py ke same rule par chalte hain)
# ---------------------------------------------------------------

def get_team_id(user_id):
    """Current logged-in user ki team_id nikalo."""
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    return user.get('team_id') if user else None


def get_authorized_job(job_id, team_id):
    """
    Job tabhi return hoti hai jab wo user ki team ki ho.
    Purani jobs (bina team_id) sabko dikhti hain (backward compatible),
    bilkul jobs.py ki tarah. Galat ID, missing job ya dusri team ki job
    ho to None milta hai.
    """
    try:
        job = jobs.find_one({'_id': ObjectId(job_id)})
    except Exception:
        return None
    if not job:
        return None
    if job.get('team_id') and job.get('team_id') != team_id:
        return None
    return job


def get_authorized_candidate(candidate_id, team_id, include_file=False):
    """
    Candidate tabhi return hota hai jab uski job user ki team ki ho.
    include_file=True sirf PDF endpoint ke liye (bhaari base64 field).
    """
    try:
        projection = None if include_file else {'resume_file': 0}
        candidate = candidates_collection.find_one(
            {'_id': ObjectId(candidate_id)}, projection
        )
    except Exception:
        return None
    if not candidate:
        return None
    if not get_authorized_job(candidate.get('job_id'), team_id):
        return None
    return candidate


# ---------------------------------------------------------------
# AI helpers
# ---------------------------------------------------------------

# PDF se text nikalo (ab bytes leta hai, file object nahi - kyunki
# original PDF bytes ko hum alag se resume preview ke liye bhi store karte hain)
def extract_text_from_pdf(file_bytes):
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

# Skills extract karo
def extract_skills(text):
    doc = nlp(text.lower())
    skills_list = [
        'python', 'java', 'javascript', 'react', 'node.js', 'flask',
        'django', 'mongodb', 'mysql', 'postgresql', 'docker', 'aws',
        'machine learning', 'deep learning', 'nlp', 'sql', 'typescript',
        'next.js', 'tailwind', 'git', 'github', 'rest api', 'html', 'css'
    ]
    found_skills = []
    for skill in skills_list:
        if skill in text.lower():
            found_skills.append(skill)
    return found_skills

# Resume score karo
def score_resume(resume_text, job_description):
    resume_embedding = model.encode([resume_text])
    job_embedding = model.encode([job_description])
    similarity = cosine_similarity(resume_embedding, job_embedding)[0][0]
    return round(float(similarity) * 100, 2)


# ---------------------------------------------------------------
# Routes
# ---------------------------------------------------------------

# Resume upload karo (recruiter, bulk, login zaroori)
@resume_bp.route('/upload/<job_id>', methods=['POST'])
@token_required
def upload_resume(current_user_id, job_id):
    if 'resumes' not in request.files:
        return jsonify({'message': 'No files uploaded'}), 400

    team_id = get_team_id(current_user_id)
    job = get_authorized_job(job_id, team_id)

    if not job:
        return jsonify({'message': 'Job not found'}), 404

    files = request.files.getlist('resumes')
    job_description = job['description'] + ' ' + ' '.join(job['required_skills'])

    results = []

    for file in files:
        file_bytes = file.read()
        text = extract_text_from_pdf(file_bytes)
        skills = extract_skills(text)
        score = score_resume(text, job_description)

        resume_data = {
            'job_id': job_id,
            'filename': file.filename,
            'text': text,
            'skills': skills,
            'score': score,
            'status': 'pending',
            'source': 'recruiter_upload',
            # Original PDF ko base64 me store kar rahe hain taaki recruiter
            # baad me asli PDF preview kar sake (sirf extracted text nahi)
            'resume_file': base64.b64encode(file_bytes).decode('utf-8'),
            'uploaded_at': datetime.datetime.utcnow()
        }

        candidates_collection.insert_one(resume_data)

        results.append({
            'filename': file.filename,
            'skills': skills,
            'score': score
        })

    results.sort(key=lambda x: x['score'], reverse=True)

    return jsonify({
        'message': 'Resumes analyzed successfully',
        'results': results
    }), 200


# Public route: candidate khud apna resume submit kare (bina login)
@resume_bp.route('/apply/<job_id>', methods=['POST'])
def apply_to_job(job_id):
    if 'resume' not in request.files:
        return jsonify({'message': 'Resume file is required'}), 400

    applicant_name = request.form.get('name', '').strip()
    # Email hamesha lowercase me store karo, taaki duplicate/status check me
    # case ki wajah se mismatch na ho
    applicant_email = request.form.get('email', '').strip().lower()

    if not applicant_name or not applicant_email:
        return jsonify({'message': 'Name and email are required'}), 400

    try:
        job = jobs.find_one({'_id': ObjectId(job_id)})
    except Exception:
        job = None
    if not job:
        return jsonify({'message': 'Job not found'}), 404

    # Duplicate check: same email pehle se is job ke liye apply kar chuka hai kya
    # (collation se purane mixed-case emails bhi match ho jaate hain)
    existing = candidates_collection.find_one(
        {'job_id': job_id, 'email': applicant_email},
        collation=EMAIL_COLLATION
    )
    if existing:
        return jsonify({'message': 'You have already applied to this job with this email.'}), 409

    file = request.files['resume']
    file_bytes = file.read()
    text = extract_text_from_pdf(file_bytes)
    skills = extract_skills(text)
    job_description = job['description'] + ' ' + ' '.join(job['required_skills'])
    score = score_resume(text, job_description)

    candidate_data = {
        'job_id': job_id,
        'filename': file.filename,
        'text': text,
        'skills': skills,
        'score': score,
        'name': applicant_name,
        'email': applicant_email,
        'status': 'pending',
        'source': 'public_application',
        'resume_file': base64.b64encode(file_bytes).decode('utf-8'),
        'uploaded_at': datetime.datetime.utcnow()
    }

    result = candidates_collection.insert_one(candidate_data)

    return jsonify({
        'message': 'Application submitted successfully',
        'candidate_id': str(result.inserted_id),
        'score': score
    }), 201

# Results dekho (sirf apni team ki job ke)
@resume_bp.route('/results/<job_id>', methods=['GET'])
@token_required
def get_results(current_user_id, job_id):
    team_id = get_team_id(current_user_id)
    if not get_authorized_job(job_id, team_id):
        return jsonify({'message': 'Job not found'}), 404

    all_resumes = list(candidates_collection.find(
        {'job_id': job_id},
        {'resume_file': 0}  # bhaari base64 field list view me nahi bhejni
    ))

    for resume in all_resumes:
        resume['_id'] = str(resume['_id'])
        resume.setdefault('status', 'pending')

    all_resumes.sort(key=lambda x: x['score'], reverse=True)

    return jsonify(all_resumes), 200


# Candidate ka status (shortlisted/rejected) DB me save karo
@resume_bp.route('/status/<candidate_id>', methods=['PATCH'])
@token_required
def update_status(current_user_id, candidate_id):
    try:
        data = request.get_json()
        status = data.get('status')

        if status not in ['pending', 'shortlisted', 'rejected']:
            return jsonify({'message': 'Invalid status value'}), 400

        team_id = get_team_id(current_user_id)
        candidate = get_authorized_candidate(candidate_id, team_id)
        if not candidate:
            return jsonify({'message': 'Candidate not found'}), 404

        candidates_collection.update_one(
            {'_id': candidate['_id']},
            {'$set': {'status': status}}
        )

        return jsonify({'message': 'Status updated', 'status': status}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Ek candidate ki poori detail dekho (resume text, saari skills, contact info)
@resume_bp.route('/candidate/<candidate_id>', methods=['GET'])
@token_required
def get_candidate(current_user_id, candidate_id):
    try:
        team_id = get_team_id(current_user_id)
        candidate = get_authorized_candidate(candidate_id, team_id)

        if not candidate:
            return jsonify({'message': 'Candidate not found'}), 404

        candidate['_id'] = str(candidate['_id'])
        candidate.setdefault('status', 'pending')
        candidate.setdefault('name', None)
        candidate.setdefault('email', None)
        candidate.setdefault('source', 'recruiter_upload')

        # Notes me datetime hota hai, JSON ke liye string me badlo
        for note in candidate.get('notes', []):
            if isinstance(note.get('created_at'), datetime.datetime):
                note['created_at'] = note['created_at'].isoformat()

        return jsonify(candidate), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Candidate ka asli PDF dekho (naye tab me khulega)
@resume_bp.route('/pdf/<candidate_id>', methods=['GET'])
@token_required
def get_resume_pdf(current_user_id, candidate_id):
    try:
        team_id = get_team_id(current_user_id)
        candidate = get_authorized_candidate(candidate_id, team_id, include_file=True)

        if not candidate or not candidate.get('resume_file'):
            return jsonify({'message': 'Resume PDF not found'}), 404

        pdf_bytes = base64.b64decode(candidate['resume_file'])
        filename = candidate.get('filename', 'resume.pdf')

        return Response(
            pdf_bytes,
            mimetype='application/pdf',
            headers={'Content-Disposition': f'inline; filename="{filename}"'}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Saare candidates ek job ke CSV file me export karo
@resume_bp.route('/export/<job_id>', methods=['GET'])
@token_required
def export_candidates(current_user_id, job_id):
    try:
        team_id = get_team_id(current_user_id)
        if not get_authorized_job(job_id, team_id):
            return jsonify({'message': 'Job not found'}), 404

        all_resumes = list(candidates_collection.find({'job_id': job_id}, {'resume_file': 0}))
        all_resumes.sort(key=lambda x: x.get('score', 0), reverse=True)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Name', 'Email', 'Filename', 'Score (%)', 'Skills', 'Status', 'Uploaded At'])

        for c in all_resumes:
            writer.writerow([
                c.get('name', ''),
                c.get('email', ''),
                c.get('filename', ''),
                c.get('score', 0),
                ', '.join(c.get('skills', [])),
                c.get('status', 'pending'),
                c.get('uploaded_at', '')
            ])

        csv_data = output.getvalue()

        return Response(
            csv_data,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=candidates_{job_id}.csv'}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Candidate pe naya internal note add karo (sirf team ke recruiters dekh sakte hain)
@resume_bp.route('/notes/<candidate_id>', methods=['POST'])
@token_required
def add_note(current_user_id, candidate_id):
    try:
        data = request.get_json()
        text = data.get('text', '').strip()

        if not text:
            return jsonify({'message': 'Note text is required'}), 400

        team_id = get_team_id(current_user_id)
        candidate = get_authorized_candidate(candidate_id, team_id)
        if not candidate:
            return jsonify({'message': 'Candidate not found'}), 404

        author = users_collection.find_one({'_id': ObjectId(current_user_id)})
        author_name = author.get('name', 'Unknown') if author else 'Unknown'

        note = {
            'text': text,
            'author_id': current_user_id,
            'author_name': author_name,
            'created_at': datetime.datetime.utcnow()
        }

        candidates_collection.update_one(
            {'_id': candidate['_id']},
            {'$push': {'notes': note}}
        )

        # created_at ko string me convert karo taaki JSON me bhej sakein
        note['created_at'] = note['created_at'].isoformat()

        return jsonify({'message': 'Note added', 'note': note}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Candidate ke saare notes list karo
@resume_bp.route('/notes/<candidate_id>', methods=['GET'])
@token_required
def get_notes(current_user_id, candidate_id):
    try:
        team_id = get_team_id(current_user_id)
        candidate = get_authorized_candidate(candidate_id, team_id)

        if not candidate:
            return jsonify({'message': 'Candidate not found'}), 404

        notes = candidate.get('notes', [])

        # datetime objects ko string me convert karo JSON response ke liye
        for note in notes:
            if isinstance(note.get('created_at'), datetime.datetime):
                note['created_at'] = note['created_at'].isoformat()

        # naye se purane order me bhejo
        notes.sort(key=lambda n: n.get('created_at', ''), reverse=True)

        return jsonify(notes), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Public route: candidate apna status check kare (bina login), email verify karke
@resume_bp.route('/check-status/<job_id>', methods=['POST'])
def check_application_status(job_id):
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({'message': 'Email is required'}), 400

        candidate = candidates_collection.find_one(
            {'job_id': job_id, 'email': email},
            collation=EMAIL_COLLATION
        )

        if not candidate:
            return jsonify({'message': 'No application found with this email for this job.'}), 404

        return jsonify({
            'status': candidate.get('status', 'pending'),
            'applied_at': candidate.get('uploaded_at').isoformat() if candidate.get('uploaded_at') else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500