@echo off
echo Installing dependencies for Quiz Generator...
echo.

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing required packages...
pip install google-genai==0.3.2
pip install PyPDF2==3.0.1
pip install requests==2.31.0

echo.
echo Dependencies installed successfully!
echo You can now run the backend with: python app.py
pause
