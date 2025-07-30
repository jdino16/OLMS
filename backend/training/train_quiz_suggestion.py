"""
Quiz Suggestion Model Training Script
Uses KMeans clustering to suggest personalized quiz topics
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

def generate_quiz_performance_data(n_samples=5000):
    """Generate synthetic quiz performance data across different topics"""
    logger.info(f"Generating {n_samples} quiz performance records...")
    
    np.random.seed(42)
    
    # Define topic areas
    topics = [
        'algebra_basics',
        'geometry_intro', 
        'calculus_101',
        'world_history_1',
        'kinematics_basics',
        'dynamics_intro',
        'programming_fundamentals',
        'data_structures_basics'
    ]
    
    # Generate correlated performance data
    data = {}
    
    # Create student archetypes
    math_strong = int(n_samples * 0.3)
    science_strong = int(n_samples * 0.25)
    cs_strong = int(n_samples * 0.25)
    balanced = n_samples - math_strong - science_strong - cs_strong
    
    student_types = []
    
    # Math-strong students
    for i in range(math_strong):
        student_types.append('math_strong')
    
    # Science-strong students
    for i in range(science_strong):
        student_types.append('science_strong')
    
    # CS-strong students
    for i in range(cs_strong):
        student_types.append('cs_strong')
    
    # Balanced students
    for i in range(balanced):
        student_types.append('balanced')
    
    np.random.shuffle(student_types)
    
    # Generate scores based on student type
    for i, topic in enumerate(topics):
        scores = []
        
        for student_type in student_types:
            if student_type == 'math_strong' and topic in ['algebra_basics', 'geometry_intro', 'calculus_101']:
                score = np.random.normal(85, 10)
            elif student_type == 'science_strong' and topic in ['kinematics_basics', 'dynamics_intro']:
                score = np.random.normal(85, 10)
            elif student_type == 'cs_strong' and topic in ['programming_fundamentals', 'data_structures_basics']:
                score = np.random.normal(85, 10)
            elif student_type == 'balanced':
                score = np.random.normal(75, 12)
            else:
                score = np.random.normal(65, 15)
            
            # Ensure score is in valid range
            score = np.clip(score, 30, 100)
            scores.append(score)
        
        data[topic] = scores
    
    df = pd.DataFrame(data)
    return df

def train_quiz_suggestion_model(data_file=None):
    """Train the quiz suggestion clustering model"""
    logger.info("Training quiz suggestion model...")
    
    if data_file and os.path.exists(data_file):
        df = pd.read_csv(data_file)
        logger.info(f"Loaded data from {data_file}")
    else:
        df = generate_quiz_performance_data()
        df.to_csv('quiz_performance_data.csv', index=False)
        logger.info("Generated and saved synthetic quiz data")
    
    # Prepare features
    X = df.values
    
    logger.info(f"Dataset shape: {X.shape}")
    logger.info(f"Feature columns: {list(df.columns)}")
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Determine optimal number of clusters
    silhouette_scores = []
    K_range = range(2, 8)
    
    for k in K_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(X_scaled)
        silhouette_avg = silhouette_score(X_scaled, cluster_labels)
        silhouette_scores.append(silhouette_avg)
        logger.info(f"k={k}, Silhouette Score: {silhouette_avg:.3f}")
    
    # Choose optimal k
    optimal_k = K_range[np.argmax(silhouette_scores)]
    logger.info(f"\n🎯 Optimal number of clusters: {optimal_k}")
    
    # Train final model with optimal k
    kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)
    
    # Evaluate final model
    final_silhouette = silhouette_score(X_scaled, cluster_labels)
    logger.info(f"Final model silhouette score: {final_silhouette:.3f}")
    
    # Analyze clusters
    df['cluster'] = cluster_labels
    
    logger.info("\n📊 Cluster Analysis:")
    for cluster_id in range(optimal_k):
        cluster_data = df[df['cluster'] == cluster_id]
        logger.info(f"\nCluster {cluster_id} (n={len(cluster_data)}):")
        avg_scores = cluster_data[df.columns[:-1]].mean()
        strongest_topics = avg_scores.nlargest(3)
        weakest_topics = avg_scores.nsmallest(3)
        logger.info(f"  Strongest topics: {strongest_topics.to_dict()}")
        logger.info(f"  Weakest topics: {weakest_topics.to_dict()}")
    
    # Save model and scaler
    os.makedirs('ml-models', exist_ok=True)
    model_path = 'ml-models/quiz_suggestion_model.pkl'
    scaler_path = 'ml-models/quiz_suggestion_scaler.pkl'
    
    with open(model_path, 'wb') as f:
        pickle.dump(kmeans, f)
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    
    logger.info(f"\n💾 Model saved to: {model_path}")
    logger.info(f"Scaler saved to: {scaler_path}")
    
    # Generate topic suggestions for each cluster
    topic_suggestions = {}
    topic_names = [
        'Database Design', 'SQL Queries', 'Normalization',
        'Web Development', 'Data Structures', 'Algorithms',
        'Machine Learning', 'Statistics', 'Computer Networks',
        'Operating Systems', 'Software Engineering', 'Cybersecurity'
    ]
    
    for cluster_id in range(optimal_k):
        cluster_mask = cluster_labels == cluster_id
        cluster_center = kmeans.cluster_centers_[cluster_id]
        weak_indices = np.where(cluster_center < np.mean(cluster_center))[0]
        suggestions = []
        for idx in weak_indices[:3]:
            if idx < len(topic_names):
                confidence = 90 - (cluster_center[idx] - np.min(cluster_center)) * 20
                suggestions.append({
                    'topic': topic_names[idx],
                    'confidence': max(75, min(95, int(confidence)))
                })
        topic_suggestions[cluster_id] = suggestions
    
    # Save topic suggestions
    suggestions_path = 'ml-models/topic_suggestions.pkl'
    with open(suggestions_path, 'wb') as f:
        pickle.dump(topic_suggestions, f)
    
    logger.info(f"📋 Topic suggestions saved to: {suggestions_path}")
    
    return kmeans, scaler

def test_quiz_suggestions():
    """Test the quiz suggestion model"""
    model_path = 'ml-models/quiz_suggestion_model.pkl'
    scaler_path = 'ml-models/quiz_suggestion_scaler.pkl'
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        logger.error(f"Model or scaler not found: {model_path}, {scaler_path}")
        return
    
    with open(model_path, 'rb') as f:
        kmeans = pickle.load(f)
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    
    logger.info("✅ Quiz suggestion model loaded successfully")
    
    # Test with sample performance data
    test_performances = [
        [85, 80, 88, 65, 70, 68, 45, 50],  # Math-strong student
        [60, 65, 62, 85, 88, 90, 70, 75],  # Science-strong student
        [55, 58, 60, 70, 72, 75, 85, 88],  # CS-strong student
    ]
    
    for i, performance in enumerate(test_performances):
        scaled_performance = scaler.transform([performance])
        cluster = kmeans.predict(scaled_performance)[0]
        
        logger.info(f"\nTest Case {i+1}:")
        logger.info(f"Performance: {performance}")
        logger.info(f"Assigned to cluster: {cluster}")
        
        # Load and display suggestions
        try:
            with open('ml-models/topic_suggestions.pkl', 'rb') as f:
                suggestions = pickle.load(f)
            
            if cluster in suggestions:
                logger.info(f"Suggested topics: {suggestions[cluster]}")
        except FileNotFoundError:
            logger.info("Topic suggestions not available")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        test_quiz_suggestions()
    else:
        train_quiz_suggestion_model()