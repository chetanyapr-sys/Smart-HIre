from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import os
import datetime
from utils.auth_middleware import token_required

jobs_bp = Blueprint('jobs', __name__)

# MongoDB connect karo
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['smarthire']
jobs_collection = db['jobs']
candidates_collection = db['candidates']
users_collection = db['users']


def get_team_id(user_id):
    """Current logged-in user ki team_id nikalo (helper function)."""
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    return user.get('team_id') if user else None


def team_job_filter(team_id):
    """
    Team-scoped jobs dhoondne ka query. Purani jobs (jinme team_id field
    hi nahi hai - is feature se pehle bani thi) sabko dikhengi (backward
    compatible), naya team_id wali jobs sirf apni team ko dikhengi.
    """
    return {'$or': [{'team_id': team_id}, {'team_id': {'$exists': False}}]}


# Job create karo
@jobs_bp.route('/create', methods=['POST'])
@token_required
def create_job(current_user_id):
    try:
        data = request.get_json()
        team_id = get_team_id(current_user_id)

        job = {
            'title': data.get('title'),
            'description': data.get('description'),
            'required_skills': data.get('required_skills', []),
            'experience': data.get('experience'),
            'team_id': team_id,
            'created_at': datetime.datetime.utcnow()
        }

        result = jobs_collection.insert_one(job)

        return jsonify({
            'message': 'Job created successfully',
            'job_id': str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Saari jobs lo (With Candidate Count and AI Score) - sirf apni team ki
@jobs_bp.route('/all', methods=['GET'])
@token_required
def get_all_jobs(current_user_id):
    try:
        team_id = get_team_id(current_user_id)
        all_jobs = list(jobs_collection.find(team_job_filter(team_id)))

        for job in all_jobs:
            job['_id'] = str(job['_id'])
            count = candidates_collection.count_documents({'job_id': job['_id']})
            job['candidates_count'] = count

            job_candidates = list(candidates_collection.find({'job_id': job['_id']}))
            if job_candidates:
                total_score = sum(c.get('score', 0) for c in job_candidates)
                job['avg_score'] = round(total_score / len(job_candidates), 1)
            else:
                job['avg_score'] = 0

        return jsonify(all_jobs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Public route: candidates bina login ke saari open jobs dekh sakein
# (Ye har team ki jobs public dikhata hai - candidate ke liye team ka concept
# relevant nahi hai, wo bas apply karna chahta hai)
@jobs_bp.route('/public', methods=['GET'])
def get_public_jobs():
    try:
        all_jobs = list(jobs_collection.find())
        public_jobs = [{
            '_id': str(job['_id']),
            'title': job.get('title'),
            'description': job.get('description'),
            'required_skills': job.get('required_skills', []),
            'experience': job.get('experience'),
            'created_at': job.get('created_at')
        } for job in all_jobs]
        return jsonify(public_jobs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Public route: candidate ek specific job ki detail dekhe (apply karne se pehle)
@jobs_bp.route('/public/<job_id>', methods=['GET'])
def get_public_job(job_id):
    try:
        job = jobs_collection.find_one({'_id': ObjectId(job_id)})
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        return jsonify({
            '_id': str(job['_id']),
            'title': job.get('title'),
            'description': job.get('description'),
            'required_skills': job.get('required_skills', []),
            'experience': job.get('experience'),
            'created_at': job.get('created_at')
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Single job lo - sirf apni team ki
@jobs_bp.route('/<job_id>', methods=['GET'])
@token_required
def get_job(current_user_id, job_id):
    try:
        job = jobs_collection.find_one({'_id': ObjectId(job_id)})

        if not job:
            return jsonify({'message': 'Job not found'}), 404

        team_id = get_team_id(current_user_id)
        # Agar job ki team_id set hai aur wo current user ki team se match
        # nahi karti, to access deny karo (purani jobs bina team_id ke
        # sabko dikhengi - backward compatible)
        if job.get('team_id') and job.get('team_id') != team_id:
            return jsonify({'message': 'Not authorized to view this job'}), 403

        job['_id'] = str(job['_id'])
        return jsonify(job), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Job delete karo - sirf apni team ki
@jobs_bp.route('/delete/<job_id>', methods=['DELETE'])
@token_required
def delete_job(current_user_id, job_id):
    try:
        job = jobs_collection.find_one({'_id': ObjectId(job_id)})
        if not job:
            return jsonify({'message': 'Job not found'}), 404

        team_id = get_team_id(current_user_id)
        if job.get('team_id') and job.get('team_id') != team_id:
            return jsonify({'message': 'Not authorized to delete this job'}), 403

        jobs_collection.delete_one({'_id': ObjectId(job_id)})
        candidates_collection.delete_many({'job_id': job_id})
        return jsonify({'message': 'Job deleted successfully'}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Dashboard Stats Route - sirf apni team ke data ka
@jobs_bp.route('/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user_id):
    try:
        team_id = get_team_id(current_user_id)
        team_jobs = list(jobs_collection.find(team_job_filter(team_id), {'_id': 1}))
        team_job_ids = [str(j['_id']) for j in team_jobs]

        total_jobs = len(team_job_ids)
        total_resumes = candidates_collection.count_documents({'job_id': {'$in': team_job_ids}})
        ranked_resumes = candidates_collection.count_documents({
            'job_id': {'$in': team_job_ids},
            'score': {'$gt': 0}
        })

        shortlisted = candidates_collection.count_documents({
            'job_id': {'$in': team_job_ids}, 'status': 'shortlisted'
        })
        rejected = candidates_collection.count_documents({
            'job_id': {'$in': team_job_ids}, 'status': 'rejected'
        })
        pending = total_resumes - shortlisted - rejected

        return jsonify({
            "totalJobs": total_jobs,
            "totalResumes": total_resumes,
            "ranked": ranked_resumes,
            "statusBreakdown": {
                "pending": pending,
                "shortlisted": shortlisted,
                "rejected": rejected
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500