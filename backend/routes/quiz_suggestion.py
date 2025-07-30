from flask import Blueprint, request, jsonify
import pickle
import numpy as np

bp = Blueprint('quiz_suggestion', __name__)

model_path = 'ml-models/quiz_suggestion_model.pkl'
scaler_path = 'ml-models/quiz_suggestion_scaler.pkl'
suggestions_path = 'ml-models/topic_suggestions.pkl'

with open(model_path, 'rb') as f:
    model = pickle.load(f)

with open(scaler_path, 'rb') as f:
    scaler = pickle.load(f)

with open(suggestions_path, 'rb') as f:
    topic_suggestions = pickle.load(f)

@bp.route('/suggest', methods=['POST'])
def suggest():
    data = request.json

    try:
        features = [
            data['algebra_basics'],
            data['geometry_intro'],
            data['calculus_101'],
            data['world_history_1'],
            data['kinematics_basics'],
            data['dynamics_intro'],
            data['programming_fundamentals'],
            data['data_structures_basics']
        ]
    except KeyError:
        return jsonify({'error': 'Missing one or more features'}), 400

    scaled = scaler.transform([features])
    cluster = model.predict(scaled)[0]
    suggestions = topic_suggestions.get(cluster, [])

    return jsonify({
        'cluster': int(cluster),
        'suggested_topics': suggestions
    })
