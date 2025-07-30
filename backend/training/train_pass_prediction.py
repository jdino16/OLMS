"""
Pass Prediction Model Training Script
Uses Logistic Regression to predict student pass/fail probability
"""
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
import pickle
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_synthetic_data(n_samples=10000):
    """Generate synthetic student performance data"""
    logger.info(f"Generating {n_samples} synthetic student records...")
    
    np.random.seed(42)
    
    # Generate features
    grades1 = np.random.randint(30, 100, n_samples)
    grades2 = np.random.randint(30, 100, n_samples)
    grades3 = np.random.randint(30, 100, n_samples)
    attendance = np.round(np.random.uniform(0.4, 1.0, n_samples), 2)
    study_hours = np.round(np.random.uniform(1, 12, n_samples), 1)
    
    # Create realistic pass/fail logic
    avg_grade = (grades1 + grades2 + grades3) / 3
    
    # Multiple factors determine pass/fail
    grade_factor = (avg_grade > 60).astype(float)
    attendance_factor = (attendance > 0.7).astype(float)
    study_factor = (study_hours > 3).astype(float)
    
    # Weighted combination with some randomness
    pass_probability = (0.5 * grade_factor + 0.3 * attendance_factor + 0.2 * study_factor)
    
    # Add some noise for realism
    noise = np.random.normal(0, 0.1, n_samples)
    pass_probability = np.clip(pass_probability + noise, 0, 1)
    
    # Convert to binary outcome
    passed = (pass_probability > 0.6).astype(int)
    
    # Create DataFrame
    df = pd.DataFrame({
        'grade1': grades1,
        'grade2': grades2,
        'grade3': grades3,
        'attendance_rate': attendance,
        'study_hours': study_hours,
        'passed': passed
    })
    
    return df

def train_pass_prediction_model(data_file=None):
    """Train the pass prediction model"""
    logger.info("Training pass prediction model...")
    
    if data_file and os.path.exists(data_file):
        df = pd.read_csv(data_file)
        logger.info(f"Loaded data from {data_file}")
    else:
        df = generate_synthetic_data()
        df.to_csv('student_performance_data.csv', index=False)
        logger.info("Generated and saved synthetic data")
    
    # Prepare features and target
    feature_columns = ['grade1', 'grade2', 'grade3', 'attendance_rate', 'study_hours']
    X = df[feature_columns]
    y = df['passed']
    
    logger.info(f"Dataset shape: {X.shape}")
    logger.info(f"Pass rate: {y.mean():.2%}")
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train model
    model = LogisticRegression(random_state=42, max_iter=1000)
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    
    logger.info(f"\n📊 Model Performance:")
    logger.info(f"Accuracy: {accuracy:.3f}")
    logger.info(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Fail', 'Pass']))
    
    logger.info(f"\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'coefficient': model.coef_[0],
        'abs_coefficient': np.abs(model.coef_[0])
    }).sort_values('abs_coefficient', ascending=False)
    
    logger.info(f"\n🎯 Feature Importance:")
    print(feature_importance)
    
    # Save model and scaler
    os.makedirs('ml-models', exist_ok=True)
    model_path = 'ml-models/pass_prediction_model.pkl'
    scaler_path = 'ml-models/pass_prediction_scaler.pkl'
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    
    logger.info(f"\n💾 Model saved to: {model_path}")
    logger.info(f"Scaler saved to: {scaler_path}")
    
    # Test predictions
    logger.info(f"\n🧪 Sample Predictions:")
    test_cases = [
        [85, 82, 88, 0.95, 8.5],  # High performer
        [45, 50, 55, 0.6, 2.0],   # At-risk student
        [70, 68, 72, 0.85, 5.0],  # Average student
    ]
    
    test_cases_df = pd.DataFrame(test_cases, columns=feature_columns)
    scaled_test_cases = scaler.transform(test_cases_df)
    
    for i, case in enumerate(scaled_test_cases):
        pred = model.predict([case])[0]
        prob = model.predict_proba([case])[0]
        logger.info(f"Case {i+1}: {test_cases[i]} → {'Pass' if pred else 'Fail'} (Prob: {prob[pred]:.3f})")
    
    return model, scaler

def load_and_test_model():
    """Load saved model and test it"""
    model_path = 'ml-models/pass_prediction_model.pkl'
    scaler_path = 'ml-models/pass_prediction_scaler.pkl'
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        logger.error(f"Model or scaler not found: {model_path}, {scaler_path}")
        return None
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    
    logger.info("✅ Model and scaler loaded successfully")
    
    # Test with sample data
    test_features = [75, 78, 82, 0.88, 6.5]
    test_features_df = pd.DataFrame([test_features], columns=['grade1', 'grade2', 'grade3', 'attendance_rate', 'study_hours'])
    scaled_features = scaler.transform(test_features_df)
    
    prediction = model.predict(scaled_features)[0]
    probability = model.predict_proba(scaled_features)[0]
    
    logger.info(f"Test prediction: {'Pass' if prediction else 'Fail'}")
    logger.info(f"Confidence: {probability[prediction]:.3f}")
    
    return model

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        load_and_test_model()
    else:
        train_pass_prediction_model()
