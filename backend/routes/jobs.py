from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import os
import datetime

jobs_bp = Blueprint('jobs', __name__)

# MongoDB connect karo
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['smarthire']
jobs_collection = db['jobs']
candidates_collection = db['candidates']

# Job create karo
@jobs_bp.route('/create', methods=['POST'])
def create_job():
    try:
        data = request.get_json()
        
        job = {
            'title': data.get('title'),
            'description': data.get('description'),
            'required_skills': data.get('required_skills', []),
            'experience': data.get('experience'),
            'created_at': datetime.datetime.utcnow()
        }
        
        result = jobs_collection.insert_one(job)
        
        return jsonify({
            'message': 'Job created successfully',
            'job_id': str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Saari jobs lo (With Candidate Count and AI Score)
@jobs_bp.route('/all', methods=['GET'])
def get_all_jobs():
    try:
        # 1. Sabse pehle saari jobs dhoondo
        all_jobs = list(jobs_collection.find())
        
        for job in all_jobs:
            job['_id'] = str(job['_id'])
            
            # 2. Resumes counting logic: 
            # Is Job ID ke liye kitne candidates database mein hain
            count = candidates_collection.count_documents({'job_id': job['_id']})
            job['candidates_count'] = count 
            
            # 3. Match Score logic:
            # AI score nikaalne ke liye saare candidates ka data lo
            job_candidates = list(candidates_collection.find({'job_id': job['_id']}))
            if job_candidates:
                # Agar score field hai toh uska average nikaalo, nahi toh 0
                total_score = sum(c.get('score', 0) for c in job_candidates)
                job['avg_score'] = round(total_score / len(job_candidates), 1)
            else:
                job['avg_score'] = 0

        return jsonify(all_jobs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Single job lo
@jobs_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    try:
        job = jobs_collection.find_one({'_id': ObjectId(job_id)})
        
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        job['_id'] = str(job['_id'])
        return jsonify(job), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Job delete karo
@jobs_bp.route('/delete/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    try:
        jobs_collection.delete_one({'_id': ObjectId(job_id)})
        # Jab job delete ho, toh uske candidates bhi delete hone chahiye (Optional but good)
        candidates_collection.delete_many({'job_id': job_id})
        return jsonify({'message': 'Job deleted successfully'}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Dashboard Stats Route (Ye add karein)
@jobs_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # 1. Total Jobs count karo
        total_jobs = jobs_collection.count_documents({})
        
        # 2. Total Resumes (Candidates) count karo
        total_resumes = candidates_collection.count_documents({})
        
        # 3. Ranked Resumes (Jinka score 0 se zyada hai)
        ranked_resumes = candidates_collection.count_documents({"score": {"$gt": 0}})
        
        return jsonify({
            "totalJobs": total_jobs,
            "totalResumes": total_resumes,
            "ranked": ranked_resumes
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500