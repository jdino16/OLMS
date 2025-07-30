from flask import Blueprint, request, jsonify
import pickle
import numpy as np

bp = Blueprint('learning_speed', __name__)

model_path = 'ml-models/speed_cluster_model.pkl'
scaler_path = 'ml-models/speed_cluster_scaler.pkl'
speed_map_path = 'ml-models/speed_cluster_map.pkl'

with open(model_path, 'rb') as f:
    model = pickle.load(f)

with open(scaler_path, 'rb') as f:
    scaler = pickle.load(f)

with open(speed_map_path, 'rb') as f:
    speed_map = pickle.load(f)

@bp.route('/predict', methods=['POST'])
def predict_speed():
    data = request.json

    try:
        features = [
            data['avg_time_to_complete_quiz_mins'],
            data['avg_time_to_submit_assignment_days'],
            data['session_duration_avg_mins'],
            data['activities_per_hour']
        ]
    except KeyError:
        return jsonify({'error': 'Missing one or more features'}), 400

    scaled = scaler.transform([features])
    cluster = model.predict(scaled)[0]
    label = speed_map.get(cluster, 'Unknown')

    return jsonify({
        'cluster': int(cluster),
        'speed_label': label
    })
