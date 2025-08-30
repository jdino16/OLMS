import base64
import os
import requests
import google.genai as genai
import PyPDF2
import io
import json

class QuizGenerator:
    def __init__(self, api_key):
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash-lite"
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract text content from a PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return None
    
    def generate_quiz_from_text(self, text_content, lesson_name):
        """Generate quiz questions from text content using Gemini AI"""
        try:
            # Prepare the prompt for quiz generation
            prompt = f"""
            Generate a quiz based on the following lesson content from "{lesson_name}".
            
            Lesson Content:
            {text_content[:4000]}  # Limit content to avoid token limits
            
            Instructions:
            - Extract 20 multiple-choice questions (MCQs) only
            - Do not include True/False type questions
            - Each question must have exactly 4 answer choices (A, B, C, D)
            - Questions should test understanding of key concepts from the lesson
            - Make questions relevant and educational
            
            Return the response strictly in valid JSON format as an array of 20 objects with this structure:
            [
              {{
                "count": number (1 to 20),
                "question": "string",
                "options": {{
                  "A": "string",
                  "B": "string",
                  "C": "string",
                  "D": "string"
                }},
                "correct_answer": "A" | "B" | "C" | "D"
              }}
            ]
            
            Rules:
            - Only extract questions that have exactly 4 answer choices
            - Exclude all True/False questions
            - The "count" field must go from 1 to 20
            - The value of "correct_answer" must be only the option key ("A", "B", "C", or "D")
            - Do not include explanations, descriptions, or extra text outside of the JSON
            - Ensure the JSON is valid and properly formatted
            """
            
            # Generate content using Gemini AI
            response = self.client.models.generate_content(
                model=self.model,
                contents=[genai.types.Content(
                    role="user",
                    parts=[genai.types.Part.from_text(text=prompt)]
                )]
            )
            
            # Extract the generated text
            generated_text = response.text
            
            # Try to parse the JSON response
            try:
                # Find JSON content in the response
                start_idx = generated_text.find('[')
                end_idx = generated_text.rfind(']') + 1
                
                if start_idx != -1 and end_idx != -1:
                    json_content = generated_text[start_idx:end_idx]
                    quiz_data = json.loads(json_content)
                    
                    # Validate the quiz data
                    if isinstance(quiz_data, list) and len(quiz_data) > 0:
                        return quiz_data
                    else:
                        raise ValueError("Invalid quiz data structure")
                else:
                    raise ValueError("No JSON content found in response")
                    
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON response: {e}")
                print(f"Raw response: {generated_text}")
                return self._generate_fallback_quiz(lesson_name)
                
        except Exception as e:
            print(f"Error generating quiz with Gemini AI: {e}")
            return self._generate_fallback_quiz(lesson_name)
    
    def _generate_fallback_quiz(self, lesson_name):
        """Generate fallback quiz questions when AI generation fails"""
        fallback_questions = [
            {
                "count": 1,
                "question": f"What is the main topic of the lesson '{lesson_name}'?",
                "options": {
                    "A": "Programming concepts",
                    "B": "Design principles", 
                    "C": "Technical skills",
                    "D": "All of the above"
                },
                "correct_answer": "D"
            },
            {
                "count": 2,
                "question": "Which of the following is NOT a learning objective?",
                "options": {
                    "A": "Understanding core concepts",
                    "B": "Applying knowledge practically",
                    "C": "Memorizing all details",
                    "D": "Developing problem-solving skills"
                },
                "correct_answer": "C"
            },
            {
                "count": 3,
                "question": "What is the best approach to learning this material?",
                "options": {
                    "A": "Read once and move on",
                    "B": "Practice and review regularly",
                    "C": "Skip difficult sections",
                    "D": "Rely only on memorization"
                },
                "correct_answer": "B"
            },
            {
                "count": 4,
                "question": "How should you approach challenging concepts?",
                "options": {
                    "A": "Avoid them completely",
                    "B": "Break them down into smaller parts",
                    "C": "Skip to easier topics",
                    "D": "Memorize without understanding"
                },
                "correct_answer": "B"
            },
            {
                "count": 5,
                "question": "What is the purpose of this lesson?",
                "options": {
                    "A": "To test your knowledge",
                    "B": "To help you learn new skills",
                    "C": "To waste your time",
                    "D": "To confuse students"
                },
                "correct_answer": "B"
            },
            {
                "count": 6,
                "question": "What is the most effective study method?",
                "options": {
                    "A": "Cramming the night before",
                    "B": "Spaced repetition over time",
                    "C": "Reading without taking notes",
                    "D": "Avoiding practice exercises"
                },
                "correct_answer": "B"
            },
            {
                "count": 7,
                "question": "How can you best retain information?",
                "options": {
                    "A": "By memorizing word for word",
                    "B": "By understanding concepts and applying them",
                    "C": "By avoiding difficult topics",
                    "D": "By studying only once"
                },
                "correct_answer": "B"
            },
            {
                "count": 8,
                "question": "What is the role of practice in learning?",
                "options": {
                    "A": "It's unnecessary and wastes time",
                    "B": "It's essential for skill development",
                    "C": "It only helps with memorization",
                    "D": "It's only for advanced learners"
                },
                "correct_answer": "B"
            },
            {
                "count": 9,
                "question": "How should you handle mistakes while learning?",
                "options": {
                    "A": "Avoid them at all costs",
                    "B": "Learn from them and improve",
                    "C": "Ignore them completely",
                    "D": "Blame others for them"
                },
                "correct_answer": "B"
            },
            {
                "count": 10,
                "question": "What is the importance of understanding fundamentals?",
                "options": {
                    "A": "It's not important",
                    "B": "It provides a strong foundation for advanced topics",
                    "C": "It only helps with basic concepts",
                    "D": "It slows down learning"
                },
                "correct_answer": "B"
            },
            {
                "count": 11,
                "question": "How can you make learning more engaging?",
                "options": {
                    "A": "By avoiding all interactive elements",
                    "B": "By connecting concepts to real-world examples",
                    "C": "By studying in complete silence",
                    "D": "By avoiding questions and discussions"
                },
                "correct_answer": "B"
            },
            {
                "count": 12,
                "question": "What is the benefit of regular review?",
                "options": {
                    "A": "It wastes time",
                    "B": "It strengthens memory and understanding",
                    "C": "It only helps with memorization",
                    "D": "It's unnecessary for learning"
                },
                "correct_answer": "B"
            },
            {
                "count": 13,
                "question": "How should you approach new concepts?",
                "options": {
                    "A": "Avoid them completely",
                    "B": "Break them down and build understanding step by step",
                    "C": "Memorize without understanding",
                    "D": "Skip to advanced topics"
                },
                "correct_answer": "B"
            },
            {
                "count": 14,
                "question": "What is the value of asking questions?",
                "options": {
                    "A": "It shows weakness",
                    "B": "It deepens understanding and clarifies concepts",
                    "C": "It wastes time",
                    "D": "It's only for beginners"
                },
                "correct_answer": "B"
            },
            {
                "count": 15,
                "question": "How can you measure your learning progress?",
                "options": {
                    "A": "By avoiding all assessments",
                    "B": "By testing your knowledge and skills regularly",
                    "C": "By only reading materials",
                    "D": "By avoiding practice"
                },
                "correct_answer": "B"
            },
            {
                "count": 16,
                "question": "What is the importance of consistency in learning?",
                "options": {
                    "A": "It's not important",
                    "B": "It builds momentum and reinforces learning",
                    "C": "It only helps with memorization",
                    "D": "It's only for advanced learners"
                },
                "correct_answer": "B"
            },
            {
                "count": 17,
                "question": "How can you overcome learning obstacles?",
                "options": {
                    "A": "By giving up immediately",
                    "B": "By identifying the issue and finding solutions",
                    "C": "By avoiding difficult topics",
                    "D": "By blaming external factors"
                },
                "correct_answer": "B"
            },
            {
                "count": 18,
                "question": "What is the role of feedback in learning?",
                "options": {
                    "A": "It's not necessary",
                    "B": "It helps identify areas for improvement",
                    "C": "It only helps with basic concepts",
                    "D": "It's only for teachers"
                },
                "correct_answer": "B"
            },
            {
                "count": 19,
                "question": "How can you make learning more effective?",
                "options": {
                    "A": "By avoiding all study techniques",
                    "B": "By using proven learning strategies and methods",
                    "C": "By studying only when motivated",
                    "D": "By avoiding practice and review"
                },
                "correct_answer": "B"
            },
            {
                "count": 20,
                "question": "What is the ultimate goal of learning?",
                "options": {
                    "A": "To memorize facts",
                    "B": "To develop understanding and skills for real-world application",
                    "C": "To pass tests",
                    "D": "To avoid difficult topics"
                },
                "correct_answer": "B"
            }
        ]
        return fallback_questions
    
    def generate_quiz_from_pdf(self, pdf_path, lesson_name):
        """Main method to generate quiz from PDF file"""
        try:
            # Extract text from PDF
            text_content = self.extract_text_from_pdf(pdf_path)
            
            if text_content:
                # Generate quiz using AI
                quiz_questions = self.generate_quiz_from_text(text_content, lesson_name)
                return quiz_questions
            else:
                # Return fallback quiz if text extraction fails
                return self._generate_fallback_quiz(lesson_name)
                
        except Exception as e:
            print(f"Error in quiz generation process: {e}")
            return self._generate_fallback_quiz(lesson_name)

# Example usage
if __name__ == "__main__":
    # Set your Gemini API key
    api_key = "AIzaSyCWhMT1nVvlq_4K1ws2ACVdjfXGwD2eKB4"
    
    # Initialize quiz generator
    quiz_gen = QuizGenerator(api_key)
    
    # Example: Generate quiz from a PDF file
    # pdf_path = "path/to/your/lesson.pdf"
    # lesson_name = "HTML Basics"
    # quiz = quiz_gen.generate_quiz_from_pdf(pdf_path, lesson_name)
    # print(json.dumps(quiz, indent=2))
