from flask import Blueprint, request, jsonify
import pickle
import os
import numpy as np

bp = Blueprint('pass_prediction', __name__)

model_path = 'ml-models/pass_prediction_model.pkl'
scaler_path = 'ml-models/pass_prediction_scaler.pkl'

with open(model_path, 'rb') as f:
    model = pickle.load(f)

with open(scaler_path, 'rb') as f:
    scaler = pickle.load(f)

@bp.route('/predict', methods=['POST'])
def predict():
    data = request.json

    try:
        features = [
            data['grade1'],
            data['grade2'],
            data['grade3'],
            data['attendance_rate'],
            data['study_hours']
        ]
    except KeyError:
        return jsonify({'error': 'Missing one or more features'}), 400

    scaled = scaler.transform([features])
    pred = model.predict(scaled)[0]
    proba = model.predict_proba(scaled)[0][pred]

    return jsonify({
        'prediction': 'Pass' if pred == 1 else 'Fail',
        'confidence': round(proba, 3)
    })
