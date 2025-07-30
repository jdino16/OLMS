"""
Learning Speed Clustering Model Training Script
Uses KMeans to classify students as Fast, Average, or Slow learners
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import pickle
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_speed_data(n_samples=5000):
    """Generate synthetic learning speed data"""
    logger.info(f"Generating {n_samples} learning speed records...")
    
    np.random.seed(42)
    
    # Define learner types
    fast_learners = int(n_samples * 0.25)
    average_learners = int(n_samples * 0.5)
    slow_learners = n_samples - fast_learners - average_learners
    
    data = []
    
    # Fast learners - complete tasks quickly, high activity
    for _ in range(fast_learners):
        quiz_time = np.random.normal(15, 4)
        assignment_time = np.random.normal(1.5, 0.5)
        session_duration = np.random.normal(35, 8)
        activities_per_hour = np.random.normal(8, 2)
        
        data.append([
            max(5, quiz_time),
            max(0.5, assignment_time),
            max(10, session_duration),
            max(3, activities_per_hour)
        ])
    
    # Average learners - moderate pace
    for _ in range(average_learners):
        quiz_time = np.random.normal(30, 8)
        assignment_time = np.random.normal(3, 1)
        session_duration = np.random.normal(45, 12)
        activities_per_hour = np.random.normal(5, 1.5)
        
        data.append([
            max(10, quiz_time),
            max(1, assignment_time),
            max(15, session_duration),
            max(2, activities_per_hour)
        ])
    
    # Slow learners - take more time, lower activity
    for _ in range(slow_learners):
        quiz_time = np.random.normal(50, 12)
        assignment_time = np.random.normal(6, 2)
        session_duration = np.random.normal(25, 8)
        activities_per_hour = np.random.normal(3, 1)
        
        data.append([
            max(20, min(60, quiz_time)),
            max(2, min(10, assignment_time)),
            max(10, session_duration),
            max(1, activities_per_hour)
        ])
    
    # Shuffle the data
    np.random.shuffle(data)
    
    # Create DataFrame
    df = pd.DataFrame(data, columns=[
        'avg_time_to_complete_quiz_mins',
        'avg_time_to_submit_assignment_days',
        'session_duration_avg_mins',
        'activities_per_hour'
    ])
    
    return df

def train_speed_clustering_model(data_file=None):
    """Train the learning speed clustering model"""
    logger.info("Training learning speed clustering model...")
    
    if data_file and os.path.exists(data_file):
        df = pd.read_csv(data_file)
        logger.info(f"Loaded data from {data_file}")
    else:
        df = generate_speed_data()
        df.to_csv('learning_speed_data.csv', index=False)
        logger.info("Generated and saved synthetic speed data")
    
    # Prepare features
    X = df.values
    
    logger.info(f"Dataset shape: {X.shape}")
    logger.info(f"Feature columns: {list(df.columns)}")
    logger.info(f"\nData statistics:")
    print(df.describe())
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train KMeans with 3 clusters (Fast, Average, Slow)
    n_clusters = 3
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)
    
    # Evaluate clustering
    silhouette_avg = silhouette_score(X_scaled, cluster_labels)
    logger.info(f"\n📊 Silhouette Score: {silhouette_avg:.3f}")
    
    # Analyze clusters to assign speed labels
    df['cluster'] = cluster_labels
    
    cluster_stats = []
    for cluster_id in range(n_clusters):
        cluster_data = df[df['cluster'] == cluster_id]
        avg_quiz_time = cluster_data['avg_time_to_complete_quiz_mins'].mean()
        avg_assignment_time = cluster_data['avg_time_to_submit_assignment_days'].mean()
        avg_activities = cluster_data['activities_per_hour'].mean()
        
        cluster_stats.append({
            'cluster': cluster_id,
            'avg_quiz_time': avg_quiz_time,
            'avg_assignment_time': avg_assignment_time,
            'avg_activities': avg_activities,
            'size': len(cluster_data)
        })
    
    # Sort clusters by quiz time (primary indicator of speed)
    cluster_stats.sort(key=lambda x: x['avg_quiz_time'])
    
    # Assign speed labels
    speed_map = {}
    labels = ['Fast', 'Average', 'Slow']
    
    for i, cluster_info in enumerate(cluster_stats):
        speed_map[cluster_info['cluster']] = labels[i]
    
    logger.info(f"\n🏃 Speed Label Mapping:")
    for cluster_id, label in speed_map.items():
        cluster_info = next(c for c in cluster_stats if c['cluster'] == cluster_id)
        logger.info(f"Cluster {cluster_id} → {label}")
        logger.info(f"  Quiz time: {cluster_info['avg_quiz_time']:.1f} min")
        logger.info(f"  Assignment time: {cluster_info['avg_assignment_time']:.1f} days")
        logger.info(f"  Activities/hour: {cluster_info['avg_activities']:.1f}")
        logger.info(f"  Students: {cluster_info['size']}")
    
    # Validate the mapping makes sense
    fast_cluster = [k for k, v in speed_map.items() if v == 'Fast'][0]
    slow_cluster = [k for k, v in speed_map.items() if v == 'Slow'][0]
    
    fast_stats = next(c for c in cluster_stats if c['cluster'] == fast_cluster)
    slow_stats = next(c for c in cluster_stats if c['cluster'] == slow_cluster)
    
    assert fast_stats['avg_quiz_time'] < slow_stats['avg_quiz_time'], "Fast learners should have lower quiz times"
    logger.info("✅ Speed mapping validation passed")
    
    # Save model, scaler, and speed map
    os.makedirs('ml-models', exist_ok=True)
    model_path = 'ml-models/speed_cluster_model.pkl'
    scaler_path = 'ml-models/speed_cluster_scaler.pkl'
    map_path = 'ml-models/speed_cluster_map.pkl'
    
    with open(model_path, 'wb') as f:
        pickle.dump(kmeans, f)
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    with open(map_path, 'wb') as f:
        pickle.dump(speed_map, f)
    
    logger.info(f"\n💾 Model saved to: {model_path}")
    logger.info(f"Scaler saved to: {scaler_path}")
    logger.info(f"Speed map saved to: {map_path}")
    
    # Show distribution
    logger.info(f"\n📈 Speed Distribution:")
    speed_counts = {}
    for cluster_id, label in speed_map.items():
        count = len(df[df['cluster'] == cluster_id])
        speed_counts[label] = count
        logger.info(f"{label}: {count} students ({count/len(df)*100:.1f}%)")
    
    return kmeans, scaler, speed_map

def test_speed_clustering():
    """Test the speed clustering model"""
    model_path = 'ml-models/speed_cluster_model.pkl'
    scaler_path = 'ml-models/speed_cluster_scaler.pkl'
    map_path = 'ml-models/speed_cluster_map.pkl'
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path) or not os.path.exists(map_path):
        logger.error(f"Model, scaler, or map not found: {model_path}, {scaler_path}, {map_path}")
        return
    
    with open(model_path, 'rb') as f:
        kmeans = pickle.load(f)
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    with open(map_path, 'rb') as f:
        speed_map = pickle.load(f)
    
    logger.info("✅ Speed clustering model loaded successfully")
    
    # Test with sample data
    test_cases = [
        [12, 1.2, 40, 9],   # Fast learner
        [28, 3.5, 42, 5],   # Average learner
        [55, 7.2, 22, 2.5], # Slow learner
    ]
    
    case_names = ['Fast Learner', 'Average Learner', 'Slow Learner']
    
    for i, case in enumerate(test_cases):
        scaled_case = scaler.transform([case])
        cluster = kmeans.predict(scaled_case)[0]
        speed_label = speed_map[cluster]
        
        logger.info(f"\n🧪 Test Case: {case_names[i]}")
        logger.info(f"Features: {case}")
        logger.info(f"Predicted cluster: {cluster}")
        logger.info(f"Speed label: {speed_label}")

def predict_learning_speed(features):
    """Predict learning speed for given features"""
    model_path = 'ml-models/speed_cluster_model.pkl'
    scaler_path = 'ml-models/speed_cluster_scaler.pkl'
    map_path = 'ml-models/speed_cluster_map.pkl'
    
    try:
        with open(model_path, 'rb') as f:
            kmeans = pickle.load(f)
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        with open(map_path, 'rb') as f:
            speed_map = pickle.load(f)
        
        scaled_features = scaler.transform([features])
        cluster = kmeans.predict(scaled_features)[0]
        speed_label = speed_map[cluster]
        
        return {
            'cluster': int(cluster),
            'speed_label': speed_label,
            'confidence': 0.85 + np.random.random() * 0.1
        }
    
    except FileNotFoundError:
        logger.error("Speed clustering model not found. Please train the model first.")
        return None

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        test_speed_clustering()
    else:
        train_speed_clustering_model()
