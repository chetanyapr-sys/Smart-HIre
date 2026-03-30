from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import os
import datetime
import PyPDF2
import io
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import spacy

resume_bp = Blueprint('resume', __name__)

# Models load karo
nlp = spacy.load('en_core_web_sm')
model = SentenceTransformer('all-MiniLM-L6-v2')

# MongoDB connect karo
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['smarthire']
# Yahan humne candidates_collection define kiya hai
candidates_collection = db['candidates']
jobs = db['jobs']

# PDF se text nikalo
def extract_text_from_pdf(file):
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
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

# Resume upload karo
@resume_bp.route('/upload/<job_id>', methods=['POST'])
def upload_resume(job_id):
    if 'resumes' not in request.files:
        return jsonify({'message': 'No files uploaded'}), 400

    files = request.files.getlist('resumes')
    job = jobs.find_one({'_id': ObjectId(job_id)})

    if not job:
        return jsonify({'message': 'Job not found'}), 404

    job_description = job['description'] + ' ' + ' '.join(job['required_skills'])

    results = []

    for file in files:
        text = extract_text_from_pdf(file)
        skills = extract_skills(text)
        score = score_resume(text, job_description)

        # Database mein save karo
        resume_data = {
            'job_id': job_id,
            'filename': file.filename,
            'text': text,
            'skills': skills,
            'score': score,
            'uploaded_at': datetime.datetime.utcnow()
        }

        # Sahi variable use ho raha hai: candidates_collection
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

# Results dekho (FIXED THIS PART)
@resume_bp.route('/results/<job_id>', methods=['GET'])
def get_results(job_id):
    # 'resumes.find' ko 'candidates_collection.find' se badal diya
    all_resumes = list(candidates_collection.find({'job_id': job_id}))

    for resume in all_resumes:
        resume['_id'] = str(resume['_id'])

    all_resumes.sort(key=lambda x: x['score'], reverse=True)

    return jsonify(all_resumes), 200