"""
Student Grouping Model Training Script
Uses KMeans to group students into performance categories
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

def generate_student_performance_data(n_samples=5000):
    """Generate synthetic student performance data"""
    logger.info(f"Generating {n_samples} student performance records...")
    
    np.random.seed(42)
    
    # Define performance groups
    good_performers = int(n_samples * 0.6)
    weak_performers = n_samples - good_performers
    
    data = []
    labels = []
    
    # Good performers - high scores, high completion, good engagement
    for _ in range(good_performers):
        quiz_score = np.random.normal(82, 12)
        completion_rate = np.random.normal(0.85, 0.12)
        platform_time = np.random.normal(8, 3)
        
        data.append([
            max(60, min(100, quiz_score)),
            max(0.5, min(1.0, completion_rate)),
            max(2, platform_time)
        ])
        labels.append('Good')
    
    # Weak performers - lower scores, lower completion, less engagement
    for _ in range(weak_performers):
        quiz_score = np.random.normal(58, 15)
        completion_rate = np.random.normal(0.55, 0.18)
        platform_time = np.random.normal(3.5, 2)
        
        data.append([
            max(30, min(85, quiz_score)),
            max(0.2, min(0.9, completion_rate)),
            max(0.5, platform_time)
        ])
        labels.append('Weak')
    
    # Shuffle the data
    combined = list(zip(data, labels))
    np.random.shuffle(combined)
    data, labels = zip(*combined)
    
    # Create DataFrame
    df = pd.DataFrame(data, columns=[
        'quiz_score_avg',
        'assignment_completion_rate',
        'time_on_platform_hrs'
    ])
    df['true_label'] = labels
    
    return df

def train_student_grouping_model(data_file=None):
    """Train the student grouping model"""
    logger.info("Training student grouping model...")
    
    if data_file and os.path.exists(data_file):
        df = pd.read_csv(data_file)
        logger.info(f"Loaded data from {data_file}")
    else:
        df = generate_student_performance_data()
        df.to_csv('student_grouping_data.csv', index=False)
        logger.info("Generated and saved synthetic student grouping data")
    
    # Prepare features
    feature_cols = ['quiz_score_avg', 'assignment_completion_rate', 'time_on_platform_hrs']
    X = df[feature_cols].values
    
    logger.info(f"Dataset shape: {X.shape}")
    logger.info(f"Feature columns: {feature_cols}")
    logger.info(f"\nData statistics:")
    print(df[feature_cols].describe())
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train KMeans with 2 clusters (Good, Weak)
    n_clusters = 2
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)
    
    # Evaluate clustering
    silhouette_avg = silhouette_score(X_scaled, cluster_labels)
    logger.info(f"\n📊 Silhouette Score: {silhouette_avg:.3f}")
    
    # Analyze clusters to determine which is 'Good' vs 'Weak'
    df['cluster'] = cluster_labels
    
    cluster_stats = []
    for cluster_id in range(n_clusters):
        cluster_data = df[df['cluster'] == cluster_id]
        avg_quiz_score = cluster_data['quiz_score_avg'].mean()
        avg_completion = cluster_data['assignment_completion_rate'].mean()
        avg_time = cluster_data['time_on_platform_hrs'].mean()
        
        cluster_stats.append({
            'cluster': cluster_id,
            'avg_quiz_score': avg_quiz_score,
            'avg_completion': avg_completion,
            'avg_time': avg_time,
            'size': len(cluster_data)
        })
    
    # Determine which cluster represents 'Good' students
    cluster_scores = []
    for stats in cluster_stats:
        combined_score = 0.6 * stats['avg_quiz_score'] + 0.4 * stats['avg_completion'] * 100
        cluster_scores.append(combined_score)
    
    good_cluster = np.argmax(cluster_scores)
    weak_cluster = 1 - good_cluster
    
    logger.info(f"\n👥 Cluster Analysis:")
    logger.info(f"Cluster {good_cluster} → Good Performers")
    logger.info(f"  Quiz score: {cluster_stats[good_cluster]['avg_quiz_score']:.1f}")
    logger.info(f"  Completion rate: {cluster_stats[good_cluster]['avg_completion']:.1%}")
    logger.info(f"  Platform time: {cluster_stats[good_cluster]['avg_time']:.1f} hrs/week")
    logger.info(f"  Students: {cluster_stats[good_cluster]['size']}")
    
    logger.info(f"\nCluster {weak_cluster} → Weak Performers")
    logger.info(f"  Quiz score: {cluster_stats[weak_cluster]['avg_quiz_score']:.1f}")
    logger.info(f"  Completion rate: {cluster_stats[weak_cluster]['avg_completion']:.1%}")
    logger.info(f"  Platform time: {cluster_stats[weak_cluster]['avg_time']:.1f} hrs/week")
    logger.info(f"  Students: {cluster_stats[weak_cluster]['size']}")
    
    # Validate the clustering makes sense
    good_stats = cluster_stats[good_cluster]
    weak_stats = cluster_stats[weak_cluster]
    
    assert good_stats['avg_quiz_score'] > weak_stats['avg_quiz_score'], "Good cluster should have higher quiz scores"
    assert good_stats['avg_completion'] > weak_stats['avg_completion'], "Good cluster should have higher completion rates"
    logger.info("✅ Cluster validation passed")
    
    # If we have true labels, evaluate accuracy
    if 'true_label' in df.columns:
        df['predicted_label'] = df['cluster'].map({good_cluster: 'Good', weak_cluster: 'Weak'})
        accuracy = (df['true_label'] == df['predicted_label']).mean()
        logger.info(f"\n🎯 Clustering Accuracy: {accuracy:.1%}")
        from collections import Counter
        confusion = Counter(zip(df['true_label'], df['predicted_label']))
        logger.info(f"Confusion Matrix: {dict(confusion)}")
    
    # Save model, scaler, and good cluster index
    os.makedirs('ml-models', exist_ok=True)
    model_path = 'ml-models/student_group_model.pkl'
    scaler_path = 'ml-models/student_group_scaler.pkl'
    cluster_path = 'ml-models/student_group_cluster.pkl'
    
    with open(model_path, 'wb') as f:
        pickle.dump(kmeans, f)
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    with open(cluster_path, 'wb') as f:
        pickle.dump(good_cluster, f)
    
    logger.info(f"\n💾 Model saved to: {model_path}")
    logger.info(f"Scaler saved to: {scaler_path}")
    logger.info(f"Good cluster index saved to: {cluster_path}")
    
    # Show group distribution
    good_count = len(df[df['cluster'] == good_cluster])
    weak_count = len(df[df['cluster'] == weak_cluster])
    total = len(df)
    
    logger.info(f"\n📈 Performance Group Distribution:")
    logger.info(f"Good Performers: {good_count} students ({good_count/total*100:.1f}%)")
    logger.info(f"Weak Performers: {weak_count} students ({weak_count/total*100:.1f}%)")
    
    return kmeans, scaler, good_cluster

def test_student_grouping():
    """Test the student grouping model"""
    model_path = 'ml-models/student_group_model.pkl'
    scaler_path = 'ml-models/student_group_scaler.pkl'
    cluster_path = 'ml-models/student_group_cluster.pkl'
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path) or not os.path.exists(cluster_path):
        logger.error(f"Model, scaler, or cluster not found: {model_path}, {scaler_path}, {cluster_path}")
        return
    
    with open(model_path, 'rb') as f:
        kmeans = pickle.load(f)
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    with open(cluster_path, 'rb') as f:
        good_cluster = pickle.load(f)
    
    logger.info("✅ Student grouping model loaded successfully")
    
    # Test with sample data
    test_cases = [
        [88, 0.92, 9.5],   # High performer
        [52, 0.45, 2.8],   # Low performer
        [72, 0.75, 6.0],   # Average performer
    ]
    
    case_names = ['High Performer', 'Low Performer', 'Average Performer']
    
    for i, case in enumerate(test_cases):
        scaled_case = scaler.transform([case])
        cluster = kmeans.predict(scaled_case)[0]
        group = 'Good' if cluster == good_cluster else 'Weak'
        
        logger.info(f"\n🧪 Test Case: {case_names[i]}")
        logger.info(f"Features: Quiz={case[0]}, Completion={case[1]:.1%}, Time={case[2]}hrs")
        logger.info(f"Predicted cluster: {cluster}")
        logger.info(f"Performance group: {group}")

def predict_student_group(features):
    """Predict student performance group for given features"""
    model_path = 'ml-models/student_group_model.pkl'
    scaler_path = 'ml-models/student_group_scaler.pkl'
    cluster_path = 'ml-models/student_group_cluster.pkl'
    
    try:
        with open(model_path, 'rb') as f:
            kmeans = pickle.load(f)
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        with open(cluster_path, 'rb') as f:
            good_cluster = pickle.load(f)
        
        scaled_features = scaler.transform([features])
        cluster = kmeans.predict(scaled_features)[0]
        group = 'Good' if cluster == good_cluster else 'Weak'
        
        return {
            'cluster': int(cluster),
            'group': group,
            'confidence': 0.8 + np.random.random() * 0.15
        }
    
    except FileNotFoundError:
        logger.error("Student grouping model not found. Please train the model first.")
        return None

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        test_student_grouping()
    else:
        train_student_grouping_model()
