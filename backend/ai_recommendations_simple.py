import json
from datetime import datetime, timedelta

class SimpleAIRecommendationEngine:
    def __init__(self, database):
        self.db = database
        self.course_features = None
        
    def prepare_course_features(self, courses):
        """Prepare course features for AI analysis"""
        try:
            # Add default category if missing
            for course in courses:
                if 'category' not in course:
                    course['category'] = 'General'
                if 'level' not in course:
                    course['level'] = 'Beginner'
                if 'difficulty' not in course:
                    course['difficulty'] = 1
                    
            self.course_features = courses
            print(f"Prepared {len(courses)} courses for AI analysis")
            return True
        except Exception as e:
            print(f"Error preparing course features: {e}")
            return False
    
    def get_course_recommendations(self, student_id, student_data, enrolled_courses, completed_courses, limit=5):
        """Get AI-powered course recommendations for a student"""
        try:
            if not self.course_features:
                return []
            
            # Get student's learning profile
            learning_profile = self._analyze_learning_profile(student_id, enrolled_courses, completed_courses)
            
            # Calculate course scores based on multiple factors
            course_scores = []
            
            for course in self.course_features:
                # Convert tuples to lists if needed
                enrolled_ids = [c['id'] if isinstance(c, dict) else c[0] for c in enrolled_courses]
                completed_ids = [c['id'] if isinstance(c, dict) else c[0] for c in completed_courses]
                all_taken_ids = enrolled_ids + completed_ids
                
                if course['id'] in all_taken_ids:
                    continue  # Skip already taken courses
                
                score = self._calculate_course_score(course, learning_profile)
                course_scores.append({
                    'course': course,
                    'score': score,
                    'reasoning': self._generate_recommendation_reason(course, learning_profile)
                })
            
            # Sort by score and return top recommendations
            course_scores.sort(key=lambda x: x['score'], reverse=True)
            
            recommendations = course_scores[:limit]
            
            return recommendations
            
        except Exception as e:
            print(f"Error getting course recommendations: {e}")
            return []
    
    def _analyze_learning_profile(self, student_id, enrolled_courses, completed_courses):
        """Analyze student's learning patterns and preferences"""
        try:
            profile = {
                'preferred_level': 'Beginner',
                'preferred_categories': [],
                'learning_pace': 'normal',
                'strengths': [],
                'weaknesses': [],
                'completion_rate': 0,
                'avg_performance': 0
            }
            
            if completed_courses:
                # Analyze completed courses
                levels = []
                categories = []
                for c in completed_courses:
                    if isinstance(c, dict):
                        levels.append(c.get('level', 'Beginner'))
                        categories.append(c.get('category', ''))
                    else:
                        # Handle tuple format
                        levels.append('Beginner')  # Default level
                        categories.append('')  # Default category
                
                # Find preferred level
                level_counts = {}
                for level in levels:
                    level_counts[level] = level_counts.get(level, 0) + 1
                
                if level_counts:
                    profile['preferred_level'] = max(level_counts, key=level_counts.get)
                
                # Find preferred categories
                category_counts = {}
                for category in categories:
                    if category:
                        category_counts[category] = category_counts.get(category, 0) + 1
                
                if category_counts:
                    top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3]
                    profile['preferred_categories'] = [cat for cat, count in top_categories]
                else:
                    profile['preferred_categories'] = ['General']  # Default category
                
                # Calculate completion rate
                total_enrolled = len(enrolled_courses) + len(completed_courses)
                profile['completion_rate'] = len(completed_courses) / total_enrolled if total_enrolled > 0 else 0
            
            return profile
            
        except Exception as e:
            print(f"Error analyzing learning profile: {e}")
            return {'preferred_level': 'Beginner', 'preferred_categories': ['General'], 'learning_pace': 'normal'}
    
    def _calculate_course_score(self, course, learning_profile):
        """Calculate recommendation score for a course"""
        try:
            score = 0.0
            
            # Level preference (30% weight)
            level_score = 0
            if course.get('level') == learning_profile['preferred_level']:
                level_score = 1.0
            elif course.get('level') == 'Intermediate' and learning_profile['preferred_level'] == 'Beginner':
                level_score = 0.7
            elif course.get('level') == 'Advanced' and learning_profile['preferred_level'] in ['Beginner', 'Intermediate']:
                level_score = 0.3
            
            score += level_score * 0.3
            
            # Category preference (25% weight)
            category_score = 0
            if course.get('category') in learning_profile['preferred_categories']:
                category_score = 1.0
            elif learning_profile['preferred_categories']:
                category_score = 0.5
            else:
                category_score = 0.3  # Default score for new categories
            
            score += category_score * 0.25
            
            # Content similarity to completed courses (20% weight)
            # Simple text-based similarity
            similarity_score = 0.6  # Placeholder - would be enhanced with actual similarity calculations
            score += similarity_score * 0.2
            
            # Popularity and rating (15% weight)
            popularity_score = 0.7  # Placeholder - would be based on enrollment data
            score += popularity_score * 0.15
            
            # Difficulty progression (10% weight)
            progression_score = 0.8  # Placeholder - would be based on skill progression
            score += progression_score * 0.1
            
            return min(score, 1.0)  # Cap at 1.0
            
        except Exception as e:
            print(f"Error calculating course score: {e}")
            return 0.5
    
    def _generate_recommendation_reason(self, course, learning_profile):
        """Generate human-readable reason for recommendation"""
        try:
            reasons = []
            
            if course.get('level') == learning_profile['preferred_level']:
                reasons.append(f"Matches your preferred {course['level']} level")
            
            if course.get('category') in learning_profile['preferred_categories']:
                reasons.append(f"Similar to your favorite {course['category']} courses")
            
            if learning_profile['completion_rate'] > 0.7:
                reasons.append("Based on your excellent completion rate")
            
            if not reasons:
                reasons.append("New course that might interest you")
            
            return " and ".join(reasons)
            
        except Exception as e:
            print(f"Error generating recommendation reason: {e}")
            return "Recommended based on your learning profile"
    
    def get_learning_path(self, student_id, target_course_id, student_data, completed_courses):
        """Generate optimal learning path to a target course"""
        try:
            if not self.course_features:
                return []
            
            # Find target course
            target_course = None
            for course in self.course_features:
                if course['id'] == target_course_id:
                    target_course = course
                    break
            
            if not target_course:
                return []
            
            # Generate learning path based on prerequisites and difficulty
            path = []
            current_level = self._get_student_level(completed_courses)
            target_level = target_course.get('level', 'Beginner')
            
            # Add prerequisite courses
            if current_level == 'Beginner' and target_level in ['Intermediate', 'Advanced']:
                # Suggest intermediate courses first
                intermediate_courses = [c for c in self.course_features 
                                     if c.get('level') == 'Intermediate' 
                                     and c.get('category') == target_course.get('category')]
                
                if intermediate_courses:
                    path.extend(intermediate_courses[:2])
            
            # Add target course
            path.append(target_course)
            
            return path
            
        except Exception as e:
            print(f"Error generating learning path: {e}")
            return []
    
    def _get_student_level(self, completed_courses):
        """Determine student's current skill level"""
        try:
            if not completed_courses:
                return 'Beginner'
            
            levels = []
            for c in completed_courses:
                if isinstance(c, dict):
                    levels.append(c.get('level', 'Beginner'))
                else:
                    levels.append('Beginner')  # Default level
            
            if 'Advanced' in levels:
                return 'Advanced'
            elif 'Intermediate' in levels:
                return 'Intermediate'
            else:
                return 'Beginner'
                
        except Exception as e:
            print(f"Error getting student level: {e}")
            return 'Beginner'
    
    def get_course_insights(self, course_id):
        """Generate AI insights about a course"""
        try:
            course = None
            for c in self.course_features:
                if c['id'] == course_id:
                    course = c
                    break
            
            if not course:
                return {}
            
            insights = {
                'difficulty_analysis': f"This {course.get('level', 'Beginner')} level course is suitable for {self._get_difficulty_description(course.get('level', 'Beginner'))}",
                'estimated_completion_time': self._estimate_completion_time(course),
                'prerequisites': self._suggest_prerequisites(course),
                'career_relevance': f"Skills from this course are valuable for {course.get('category', 'general')} careers",
                'learning_tips': self._generate_learning_tips(course)
            }
            
            return insights
            
        except Exception as e:
            print(f"Error generating course insights: {e}")
            return {}
    
    def _get_difficulty_description(self, level):
        """Get human-readable difficulty description"""
        descriptions = {
            'Beginner': 'students new to the subject',
            'Intermediate': 'students with basic knowledge',
            'Advanced': 'experienced students looking to master the topic'
        }
        return descriptions.get(level, 'students')
    
    def _estimate_completion_time(self, course):
        """Estimate course completion time"""
        # This would be based on course content analysis
        base_time = 4  # weeks
        if course.get('level') == 'Advanced':
            base_time = 8
        elif course.get('level') == 'Intermediate':
            base_time = 6
        
        return f"{base_time} weeks (estimated)"
    
    def _suggest_prerequisites(self, course):
        """Suggest prerequisite knowledge"""
        if course.get('level') == 'Beginner':
            return "No prerequisites required"
        elif course.get('level') == 'Intermediate':
            return f"Basic knowledge of {course.get('category', 'the subject')} recommended"
        else:
            return f"Strong foundation in {course.get('category', 'the subject')} required"
    
    def _generate_learning_tips(self, course):
        """Generate personalized learning tips"""
        tips = [
            "Set aside dedicated study time each week",
            "Practice regularly to reinforce concepts",
            "Don't hesitate to ask questions when stuck"
        ]
        
        if course.get('level') == 'Advanced':
            tips.append("Consider forming study groups with peers")
        
        return tips

# Initialize the recommendation engine
recommendation_engine = SimpleAIRecommendationEngine(None)  # Will be set when database is available
