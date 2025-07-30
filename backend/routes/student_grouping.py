from flask import Blueprint, request, jsonify
import pickle
import numpy as np

bp = Blueprint('student_grouping', __name__)

model_path = 'ml-models/student_group_model.pkl'
scaler_path = 'ml-models/student_group_scaler.pkl'
cluster_idx_path = 'ml-models/student_group_cluster.pkl'

with open(model_path, 'rb') as f:
    model = pickle.load(f)

with open(scaler_path, 'rb') as f:
    scaler = pickle.load(f)

with open(cluster_idx_path, 'rb') as f:
    good_cluster_idx = pickle.load(f)

@bp.route('/predict', methods=['POST'])
def predict_group():
    data = request.json

    try:
        features = [
            data['quiz_score_avg'],
            data['assignment_completion_rate'],
            data['time_on_platform_hrs']
        ]
    except KeyError:
        return jsonify({'error': 'Missing one or more features'}), 400

    scaled = scaler.transform([features])
    cluster = model.predict(scaled)[0]

    group = 'Good Performer' if cluster == good_cluster_idx else 'Weak Performer'

    return jsonify({
        'cluster': int(cluster),
        'group': group
    })
