from flask import Flask
from routes import pass_prediction, quiz_suggestion, learning_speed, student_grouping

app = Flask(__name__)

app.register_blueprint(pass_prediction.bp, url_prefix='/api/pass_prediction')
app.register_blueprint(quiz_suggestion.bp, url_prefix='/api/quiz_suggestion')
app.register_blueprint(learning_speed.bp, url_prefix='/api/learning_speed')
app.register_blueprint(student_grouping.bp, url_prefix='/api/student_grouping')

if __name__ == '__main__':
    app.run(debug=True)
