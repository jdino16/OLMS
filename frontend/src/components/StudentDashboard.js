import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatbotButton from './ChatbotButton';
import Messages from './Messages';
import AIRecommendations from './AIRecommendations';
import CourseProgress from './CourseProgress';
import FeedbackDashboard from './FeedbackDashboard';
import StudentCertificates from './StudentCertificates';
import './StudentDashboard.css';

const StudentDashboard = ({ student, onLogout }) => {
  const [currentPage, setCurrentPage] = useState('overview');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(1);
  const [profileData, setProfileData] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCourseViewer, setShowCourseViewer] = useState(false);
  const [editProfileData, setEditProfileData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [studyTimer, setStudyTimer] = useState(null);
  const [currentStudyTime, setCurrentStudyTime] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizHistory, setQuizHistory] = useState([]);
  const [quizStats, setQuizStats] = useState(null);
  const [quizHistoryLoading, setQuizHistoryLoading] = useState(false);
  const [quizHistoryError, setQuizHistoryError] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizTimeTaken, setQuizTimeTaken] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    fetchStudentData();
    fetchQuizHistory();
    fetchUnreadMessageCount();
  }, [])

  // Refresh quiz history when navigating to quiz history page
  useEffect(() => {
    if (currentPage === 'quiz-history') {
      console.log('Navigated to quiz history page, refreshing data...');
      fetchQuizHistory();
    }
  }, [currentPage]);

  // Update available courses when enrolled courses change
  useEffect(() => {
    if (enrolledCourses.length > 0) {
      fetchAvailableCourses();
    }
  }, [enrolledCourses]);

  // Cleanup study timer when component unmounts or course changes
  useEffect(() => {
    return () => {
      if (studyTimer) {
        clearInterval(studyTimer);
        stopStudyTimer();
      }
    };
  }, [studyTimer, selectedCourse]);

  const fetchStudentData = async () => {
    try {
      await Promise.all([
        fetchAvailableCourses(),
        fetchEnrolledCourses(),
        fetchProfileData()
      ]);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadMessageCount = async () => {
    try {
      const response = await axios.get('/api/messages/unread-count');
      if (response.data.success) {
        setUnreadMessageCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await axios.get('/api/courses/public');
      if (response.data.success) {
        // Filter out courses that the student is already enrolled in
        const availableCourses = response.data.courses.filter(course => 
          !enrolledCourses.some(enrolled => enrolled.id === course.id)
        );
        setAvailableCourses(availableCourses);
      }
    } catch (error) {
      console.error('Error fetching available courses:', error);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get('/api/student/enrolled-courses');
      if (response.data.success) {
        console.log('Raw enrolled courses data:', response.data.courses);
        
        // Transform the enrollment data to match the expected format
        const transformedCourses = response.data.courses.map(enrollment => ({
          id: enrollment.course_id,
          course_name: enrollment.course_name,
          description: enrollment.description,
          duration: enrollment.duration,
          level: enrollment.level,
          status: enrollment.status,
          completed_modules: enrollment.completed_modules,
          enrolled_at: enrollment.enrollment_date,
          progress_percentage: enrollment.progress_percentage,
          total_study_time: enrollment.total_study_time,
          module_count: enrollment.module_count,
          lesson_count: enrollment.lesson_count,
          modules: enrollment.modules || []
        }));
        
        console.log('Transformed enrolled courses:', transformedCourses);
        setEnrolledCourses(transformedCourses);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      // Start with empty enrolled courses if there's an error
      setEnrolledCourses([]);
    }
  };

  const handleEnrollCourse = async (course) => {
    try {
      // Enroll in the course via API
      const enrollResponse = await axios.post('/api/student/enroll-course', {
        course_id: course.id
      });
      
      if (enrollResponse.data.success) {
      // Fetch course details including modules and lessons
      const response = await axios.get(`/api/courses/${course.id}/modules`);
      if (response.data.success) {
        console.log('Course modules fetched:', response.data.modules);
        
        const enrolledCourse = {
          ...course,
          status: 'Active',
          completed_modules: 0,
          enrolled_at: new Date().toISOString(),
          modules: response.data.modules
        };
        
        console.log('Enrolled course object:', enrolledCourse);
        setEnrolledCourses(prev => [...prev, enrolledCourse]);
        
          // Refresh available courses to remove the enrolled course
          fetchAvailableCourses();
        
        alert(`Successfully enrolled in ${course.course_name}!`);
      } else {
        alert('Failed to fetch course details. Please try again.');
        }
      } else {
        alert(enrollResponse.data.error || 'Failed to enroll in course. Please try again.');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      } else {
      alert('Failed to enroll in course. Please try again.');
      }
    }
  };

  const fetchProfileData = async () => {
    try {
      const response = await axios.get('/api/student/profile');
      if (response.data.success) {
        setProfileData(response.data.student);
      } else {
        // For demo purposes, use student data
        setProfileData(student);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // For demo purposes, use student data
      setProfileData(student);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      setQuizHistoryLoading(true);
      setQuizHistoryError(null);
      console.log('Fetching quiz history...');
      const response = await axios.get('/api/student/quiz-history');
      console.log('Quiz history response:', response.data);
      
      if (response.data.success) {
        setQuizHistory(response.data.quiz_history || []);
        setQuizStats(response.data.quiz_stats || {});
        console.log('Quiz history set:', response.data.quiz_history);
        console.log('Quiz stats set:', response.data.quiz_stats);
      } else {
        console.error('Failed to fetch quiz history:', response.data.error);
        setQuizHistory([]);
        setQuizStats({});
        setQuizHistoryError(response.data.error || 'Failed to fetch quiz history');
      }
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      setQuizHistory([]);
      setQuizStats({});
      setQuizHistoryError('Network error. Please check your connection and try again.');
    } finally {
      setQuizHistoryLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setShowCourseViewer(false);
    setSelectedCourse(null);
    setSelectedModule(null);
    setSelectedLesson(null);
  };

  const handleCourseSelect = (course) => {
    console.log('Course selected:', course);
    console.log('Course modules:', course.modules);
    console.log('Course progress data:', {
      completed_modules: course.completed_modules,
      module_count: course.module_count,
      progress_percentage: course.progress_percentage
    });
    
    setSelectedCourse(course);
    setShowCourseViewer(true);
    setCurrentPage('course-viewer');
  };

  const handleModuleSelect = (module) => {
    console.log('Module selected:', module);
    setSelectedModule(module);
    if (module.lessons && module.lessons.length > 0) {
      console.log('Setting first lesson:', module.lessons[0]);
      setSelectedLesson(module.lessons[0]);
      setCurrentPdfPage(1);
    } else {
      console.log('No lessons available for this module');
      setSelectedLesson(null);
      setCurrentPdfPage(1);
    }
  };

  const handleLessonSelect = async (lesson) => {
    console.log('Selecting lesson:', lesson);
    
    // Stop previous study timer if any
    if (studyTimer) {
      clearInterval(studyTimer);
      stopStudyTimer();
    }
    
    setSelectedLesson(lesson);
    setCurrentPdfPage(1);
    setTotalPdfPages(1);
    setPdfLoading(true);
    
    try {
      // Get lesson progress from backend
      const response = await axios.get(`/api/student/lesson-progress/${lesson.id}`);
      if (response.data.success) {
        const progress = response.data.progress;
        if (progress) {
          setCurrentPdfPage(progress.current_page || 1);
          setTotalPdfPages(progress.total_pages || 1);
          console.log('Loaded lesson progress:', progress);
        }
      }
    } catch (error) {
      console.error('Error loading lesson progress:', error);
      // Set default values if no progress found
      setCurrentPdfPage(1);
      setTotalPdfPages(1);
    }
    
    // Start study timer for this lesson
    startStudyTimer();
    
    // Update selected module if different
    if (selectedModule?.id !== lesson.module_id) {
      const module = selectedCourse.modules?.find(m => m.id === lesson.module_id);
      if (module) {
        setSelectedModule(module);
      }
    }
  };

  // Function to detect PDF pages when iframe loads
  const detectPdfPages = (iframe) => {
    try {
      // Method 1: Try to access PDF.js viewer to get page count
      const pdfViewer = iframe.contentWindow.PDFViewerApplication;
      if (pdfViewer && pdfViewer.pagesCount) {
        const totalPages = pdfViewer.pagesCount;
        console.log('Detected PDF pages from PDF.js:', totalPages);
        setTotalPdfPages(totalPages);
        
        // Update lesson progress with correct total pages
        if (selectedLesson) {
          updateLessonProgress(selectedLesson.id, currentPdfPage, totalPages);
        }
        return totalPages;
      }
    } catch (e) {
      console.log('Could not detect PDF pages from PDF.js:', e);
    }
    
    // Method 2: Try to detect from iframe content DOM
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const pageElements = iframeDoc.querySelectorAll('.page');
      if (pageElements.length > 0) {
        const totalPages = pageElements.length;
        console.log('Detected PDF pages from DOM:', totalPages);
        setTotalPdfPages(totalPages);
        return totalPages;
      }
    } catch (e) {
      console.log('Could not detect PDF pages from DOM:', e);
    }
    
    // Method 3: Try to detect from PDF viewer controls (like "1 / 50")
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Look for page indicators in the PDF viewer
      const pageIndicators = iframeDoc.querySelectorAll('*');
      for (let element of pageIndicators) {
        const text = element.textContent || element.innerText;
        if (text && text.includes('/')) {
          const match = text.match(/(\d+)\s*\/\s*(\d+)/);
          if (match && match[2]) {
            const totalPages = parseInt(match[2]);
            if (totalPages > 1) {
              console.log('Detected PDF pages from viewer controls:', totalPages);
              setTotalPdfPages(totalPages);
              return totalPages;
            }
          }
        }
      }
    } catch (e) {
      console.log('Could not detect from viewer controls:', e);
    }
    
    // Method 4: Try to detect from URL or iframe attributes
    try {
      const iframeSrc = iframe.src;
      if (iframeSrc.includes('localhost:5000')) {
        // For our local PDF server, try to get page count from metadata
        console.log('Using fallback page detection for local PDF server');
        return null; // Will use default pages
      }
    } catch (e) {
      console.log('Could not detect from URL:', e);
    }
    
    return null;
  };

  // Enhanced PDF iframe onLoad handler
  const handlePdfLoad = (iframe) => {
    console.log('PDF loaded successfully');
    setPdfLoading(false);
    
    // Try to detect total pages immediately
    let totalPages = detectPdfPages(iframe);
    
    // If immediate detection fails, try again after a short delay
    if (!totalPages) {
      console.log('Starting aggressive page detection...');
      aggressivePageDetection(iframe);
    }
    
    if (totalPages && totalPages > 1) {
      console.log('Setting total pages to:', totalPages);
      setTotalPdfPages(totalPages);
      
      // Update lesson progress with correct total pages
      if (selectedLesson) {
        updateLessonProgress(selectedLesson.id, currentPdfPage, totalPages);
      }
    } else {
      console.log('Could not detect total pages, using default');
      // If we can't detect, try to get from lesson data or use a reasonable default
      const defaultPages = selectedLesson?.total_pages || selectedLesson?.total_slides || 20;
      setTotalPdfPages(defaultPages);
      console.log('Using default pages:', defaultPages);
    }
    
    console.log('Current page:', currentPdfPage, 'Total pages:', totalPdfPages);
  };

  const startStudyTimer = () => {
    if (studyTimer) clearInterval(studyTimer);
    setCurrentStudyTime(0);
    const timer = setInterval(() => {
      setCurrentStudyTime(prev => prev + 1);
    }, 60000); // Update every minute
    setStudyTimer(timer);
  };

  const stopStudyTimer = () => {
    if (studyTimer) {
      clearInterval(studyTimer);
      setStudyTimer(null);
      
      // Update the course progress with the accumulated study time
      if (selectedCourse && currentStudyTime > 0) {
        const totalStudyTime = (selectedCourse.total_study_time || 0) + currentStudyTime;
        updateCourseProgress(selectedCourse.id, selectedCourse.completed_modules || 0, totalStudyTime);
        setCurrentStudyTime(0);
      }
    }
  };

  const updateCourseProgress = async (courseId, completedModules, studyTime) => {
    try {
      console.log('Updating course progress:', { courseId, completedModules, studyTime });
      
      // Update progress in the backend
      await axios.put('/api/student/update-progress', {
        course_id: courseId,
        completed_modules: completedModules,
        study_time: studyTime
      });
      
      // Update local state
      setEnrolledCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, completed_modules: completedModules, total_study_time: studyTime }
          : course
      ));
      
      // Check if course is completed
      const course = enrolledCourses.find(c => c.id === courseId);
      if (course && completedModules >= (course.modules?.length || 0)) {
        // Mark course as completed
        await axios.put('/api/student/complete-course', {
          course_id: courseId
        });
        
        // Update local state to mark course as completed
        setEnrolledCourses(prev => prev.map(c => 
          c.id === courseId 
            ? { ...c, status: 'Completed' }
            : c
        ));
      }
      
      console.log('Course progress updated successfully');
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  const nextPage = () => {
    if (selectedLesson && currentPdfPage < totalPdfPages) {
      const newPage = currentPdfPage + 1;
      console.log('Moving to next page:', newPage);
      setCurrentPdfPage(newPage);
      updateLessonProgress(selectedLesson.id, newPage, totalPdfPages);
    }
  };

  const prevPage = () => {
    if (currentPdfPage > 1) {
      const newPage = currentPdfPage - 1;
      console.log('Moving to previous page:', newPage);
      setCurrentPdfPage(newPage);
      updateLessonProgress(selectedLesson.id, newPage, totalPdfPages);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPdfPages) {
      console.log('Going to page:', pageNumber);
      setCurrentPdfPage(pageNumber);
      updateLessonProgress(selectedLesson.id, pageNumber, totalPdfPages);
    }
  };

  // Function to manually set total pages if detection fails
  const setTotalPages = (pages) => {
    if (pages > 0) {
      console.log('Manually setting total pages to:', pages);
      setTotalPdfPages(pages);
      if (selectedLesson) {
        updateLessonProgress(selectedLesson.id, currentPdfPage, pages);
      }
    }
  };

  // Function to refresh page detection
  const refreshPageDetection = () => {
    const iframe = document.querySelector('.pdf-container iframe');
    if (iframe) {
      console.log('Refreshing page detection...');
      handlePdfLoad(iframe);
    }
  };

  const updateLessonProgress = async (lessonId, currentPage, totalPages) => {
    try {
      console.log('Updating lesson progress:', { lessonId, currentPage, totalPages });
      
      await axios.put('/api/student/lesson-progress', {
        lesson_id: lessonId,
        current_page: currentPage,
        total_pages: totalPages
      });
      
      console.log('Lesson progress updated successfully');
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const handleZoom = (type) => {
    const iframe = document.querySelector('.pdf-container iframe');
    if (!iframe) return;
    
    const currentScale = iframe.style.transform ? parseFloat(iframe.style.transform.replace('scale(', '').replace(')', '')) : 1;
    
    switch (type) {
      case 'in':
        iframe.style.transform = `scale(${Math.min(currentScale * 1.2, 3)})`;
        break;
      case 'out':
        iframe.style.transform = `scale(${Math.max(currentScale / 1.2, 0.5)})`;
        break;
      case 'fit':
        iframe.style.transform = 'scale(1)';
        break;
      default:
        break;
    }
  };

  const handleFullscreen = () => {
    const iframe = document.querySelector('.pdf-container iframe');
    if (!iframe) return;
    
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen();
    }
  };

  const startQuiz = async () => {
    if (!selectedLesson) {
      alert('Please select a lesson first');
      return;
    }

    console.log('Starting quiz generation for lesson:', selectedLesson);
    console.log('Selected lesson data:', selectedLesson);

    try {
      setQuizLoading(true);
      setShowQuiz(true); // Show the modal immediately
      
      const response = await axios.post('/api/student/generate-quiz', {
        lesson_id: selectedLesson.id
      });

      console.log('Quiz generation response:', response.data);

      if (response.data.success) {
        console.log('Quiz generated successfully:', response.data.questions);
        setQuizQuestions(response.data.questions);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setQuizCompleted(false);
        setQuizScore(0);
        // Start quiz timer
        setQuizStartTime(Date.now());
        setQuizTimeTaken(0);
      } else {
        console.error('Quiz generation failed:', response.data.error);
        alert('Failed to generate quiz: ' + response.data.error);
        setShowQuiz(false); // Hide modal on failure
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Error generating quiz. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setShowQuiz(false); // Hide modal on error
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    // Calculate quiz time taken from when questions were generated
    const timeTakenSeconds = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
    setQuizTimeTaken(timeTakenSeconds);

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = quizQuestions.length;
    
    quizQuestions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      if (userAnswer === question.correct_answer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    setQuizScore(score);
    setQuizCompleted(true);
    
    // Submit quiz results to backend
    if (selectedLesson && selectedModule && selectedCourse) {
      try {
        const answers = quizQuestions.map((question, index) => ({
          answer: userAnswers[index] || '',
          correct_answer: question.correct_answer,
          is_correct: userAnswers[index] === question.correct_answer
        }));
        
        const response = await axios.post('/api/student/submit-quiz', {
          lesson_id: selectedLesson.id,
          module_id: selectedModule.id,
          course_id: selectedCourse.id,
          answers: answers,
          time_taken_seconds: timeTakenSeconds
        });
        
        if (response.data.success) {
          console.log('Quiz results submitted successfully:', response.data);
          // Refresh quiz history
          fetchQuizHistory();
        } else {
          console.error('Failed to submit quiz results:', response.data.error);
        }
      } catch (error) {
        console.error('Error submitting quiz results:', error);
      }
    }
  };

  const handleQuizAnswer = (answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed, calculate score
      const score = quizQuestions.reduce((total, question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.correct_answer;
        return userAnswer === correctAnswer ? total + 1 : total;
      }, 0);
      
      setQuizScore(score);
      // Capture elapsed time precisely at finish
      const elapsedSeconds = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
      setQuizTimeTaken(elapsedSeconds);
      setQuizCompleted(true);
      
      // Submit quiz results to backend (use accurate quiz timer)
      if (selectedLesson && selectedModule && selectedCourse) {
        try {
          const answers = quizQuestions.map((question, index) => ({
            answer: userAnswers[index] || '',
            correct_answer: question.correct_answer,
            is_correct: userAnswers[index] === question.correct_answer
          }));
          
          const response = await axios.post('/api/student/submit-quiz', {
            lesson_id: selectedLesson.id,
            module_id: selectedModule.id,
            course_id: selectedCourse.id,
            answers: answers,
            time_taken_seconds: elapsedSeconds
          });
          
          if (response.data.success) {
            console.log('Quiz results submitted successfully:', response.data);
            // Refresh quiz history
            fetchQuizHistory();
          } else {
            console.error('Failed to submit quiz results:', response.data.error);
          }
        } catch (error) {
          console.error('Error submitting quiz results:', error);
        }
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
  };

  const handleEditProfile = () => {
    setEditProfileData({
      student_name: profileData?.student_name || '',
      email: profileData?.email || '',
      phone_number: profileData?.phone_number || '',
      address: profileData?.address || ''
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const response = await axios.put('/api/student/profile', editProfileData);
      if (response.data.success) {
        setProfileData({ ...profileData, ...editProfileData });
        setShowEditProfile(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    console.log('Password change function called with data:', passwordData);
    
    // Validate password fields
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      console.log('Validation failed: missing fields');
      alert('All password fields are required!');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      console.log('Validation failed: passwords do not match');
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      console.log('Validation failed: password too short');
      alert('New password must be at least 6 characters long!');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      console.log('Validation failed: same password');
      alert('New password must be different from current password!');
      return;
    }

    try {
      console.log('Attempting to change password...');
      const response = await axios.put('/api/student/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      console.log('Password change response:', response.data);
      
      if (response.data.success) {
        setShowChangePassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Password changed successfully!');
      } else {
        alert('Failed to change password: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    console.log('Logout initiated...');
    
    // Use the parent component's logout handler
    if (onLogout) {
      onLogout();
    } else {
      // Fallback logout if no parent handler
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      localStorage.removeItem('token');
      localStorage.removeItem('student');
      sessionStorage.clear();
      
      // Clear any axios default headers
      delete axios.defaults.headers.common['Authorization'];
      
      console.log('All data cleared, redirecting...');
      
      // Redirect to login
      window.location.href = '/';
    }
  };

  const handleViewCourseDetails = (course) => {
    console.log('Opening course details for:', course);
    setSelectedCourseForDetails(course);
    setShowCourseDetails(true);
  };

  const handleCloseCourseDetails = () => {
    setShowCourseDetails(false);
    setSelectedCourseForDetails(null);
  };

  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseCourseDetails();
    }
  };

  const renderHeader = () => {
    console.log('Rendering header, profileData:', profileData);
    return (
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h1 className="logo-text">LMS</h1>
          </div>
          
          <nav className="header-nav">
            <button 
              className={`header-nav-btn ${currentPage === 'overview' ? 'active' : ''}`}
              onClick={() => handlePageChange('overview')}
            >
              <i className="fas fa-home"></i>
              <span>Overview</span>
            </button>
            
            <button 
              className={`header-nav-btn ${currentPage === 'courses' ? 'active' : ''}`}
              onClick={() => handlePageChange('courses')}
            >
              <i className="fas fa-book"></i>
              <span>Courses</span>
            </button>
            
            <button 
              className={`header-nav-btn ${currentPage === 'enrolled' ? 'active' : ''}`}
              onClick={() => handlePageChange('enrolled')}
            >
              <i className="fas fa-graduation-cap"></i>
              <span>My Courses</span>
            </button>
            
            <button 
              className={`header-nav-btn ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => handlePageChange('profile')}
            >
              <i className="fas fa-user"></i>
              <span>Profile</span>
            </button>
            
            <button 
              className={`header-nav-btn ${currentPage === 'quiz-history' ? 'active' : ''}`}
              onClick={() => handlePageChange('quiz-history')}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>Quiz History</span>
            </button>
            
            <button 
              className={`header-nav-btn ${currentPage === 'ai-recommendations' ? 'active' : ''}`}
              onClick={() => handlePageChange('ai-recommendations')}
            >
              <i className="fas fa-robot"></i>
              <span>AI Assistant</span>
            </button>
            
                     <button
           className={`header-nav-btn ${currentPage === 'progress' ? 'active' : ''}`}
           onClick={() => handlePageChange('progress')}
         >
           <i className="fas fa-chart-line"></i>
           <span>Progress</span>
         </button>
         
         <button
           className={`header-nav-btn ${currentPage === 'feedback' ? 'active' : ''}`}
           onClick={() => handlePageChange('feedback')}
         >
           <i className="fas fa-comments"></i>
           <span>Feedback</span>
         </button>
         
         <button 
           className={`header-nav-btn ${currentPage === 'certificates' ? 'active' : ''}`}
           onClick={() => handlePageChange('certificates')}
         >
           <i className="fas fa-certificate"></i>
           <span>Certificates</span>
         </button>
            
            <button 
              className="header-nav-btn messages-btn"
              onClick={() => setShowMessages(true)}
            >
              <i className="fas fa-envelope"></i>
              <span>Messages</span>
              {unreadMessageCount > 0 && (
                <span className="unread-badge">{unreadMessageCount}</span>
              )}
            </button>
          </nav>
          
          <div className="user-section">
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{profileData?.student_name || 'Student'}</span>
              </div>
              <button 
                className="logout-btn" 
                onClick={handleLogout}
                title="Click to logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="welcome-section">
        <h2>Welcome back, {student?.student_name}!</h2>
        <p>Discover new courses and continue your learning journey</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-content">
            <h3>{enrolledCourses.length}</h3>
            <p>Enrolled Courses</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-layer-group"></i>
          </div>
          <div className="stat-content">
            <h3>{enrolledCourses.reduce((total, course) => total + (course.module_count || 0), 0)}</h3>
            <p>Total Modules</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{enrolledCourses.reduce((total, course) => total + (course.completed_modules || 0), 0)}</h3>
            <p>Completed Modules</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{Math.round(enrolledCourses.reduce((total, course) => total + (course.total_study_time || 0), 0) / 60)}h</h3>
            <p>Study Time</p>
          </div>
        </div>
      </div>

      <div className="courses-section">
        <h3>Available Courses</h3>
        <p>Browse and enroll in courses to start learning</p>
        <div className="courses-preview">
          {availableCourses.slice(0, 3).map((course) => (
            <div key={course.id} className="course-preview-card">
              <div className="course-preview-header">
                <div className="course-icon">
                  <i className="fas fa-book"></i>
                </div>
                <div className="course-info">
                  <h4>{course.course_name}</h4>
                  <p>{course.description}</p>
                </div>
              </div>
              <div className="course-meta">
                <span><i className="fas fa-layer-group"></i> {course.module_count || 0} Modules</span>
                <span><i className="fas fa-clock"></i> {course.duration || 'Self-paced'}</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => handleEnrollCourse(course)}
              >
                <i className="fas fa-graduation-cap"></i>
                Enroll Now
              </button>
            </div>
          ))}
        </div>
        
        {availableCourses.length > 3 && (
          <div className="view-all-courses">
            <button 
              className="btn btn-outline"
              onClick={() => handlePageChange('courses')}
            >
              View All Available Courses
            </button>
          </div>
        )}
        
        {availableCourses.length === 0 && (
          <div className="no-courses">
            <i className="fas fa-book-open"></i>
            <h3>No courses available</h3>
            <p>All courses are currently enrolled or no courses exist.</p>
          </div>
        )}
        

      </div>

      {enrolledCourses.length > 0 && (
        <div className="recent-courses">
          <h3>Continue Learning</h3>
          <div className="courses-preview">
            {enrolledCourses.slice(0, 3).map((course) => (
              <div key={course.id} className="course-preview-card enrolled">
                <div className="course-preview-header">
                  <div className="course-icon">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <div className="course-info">
                    <h4>{course.course_name}</h4>
                    <p>{course.description}</p>
                  </div>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${((course.completed_modules || 0) / (course.module_count || 1)) * 100}%`}}
                    ></div>
                  </div>
                  <span>{course.completed_modules || 0}/{course.module_count || 0} modules</span>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleCourseSelect(course)}
                >
                  Continue Learning
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAvailableCourses = () => (
    <div className="available-courses-section">
      <h2>Available Courses</h2>
      <p>Browse through our course catalog and enroll in courses that interest you</p>
      
      {availableCourses.length === 0 ? (
        <div className="no-courses">
          <i className="fas fa-book-open"></i>
          <h3>No courses available</h3>
          <p>All courses are currently enrolled or no courses exist.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {availableCourses.map((course) => (
            <div key={course.id} className="course-card available">
              <div className="course-header">
                <div className="course-image">
                  <i className="fas fa-book"></i>
                </div>
                <div className="course-level">
                  <span className={`level-badge ${course.level?.toLowerCase() || 'beginner'}`}>
                    {course.level || 'Beginner'}
                  </span>
                </div>
              </div>
              
              <div className="course-content">
                <h4>{course.course_name}</h4>
                <p>{course.description || 'No description available'}</p>
                
                <div className="course-meta">
                  <div className="meta-item">
                    <i className="fas fa-layer-group"></i>
                    <span>{course.module_count || 0} Modules</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-clock"></i>
                    <span>{course.duration || 'Self-paced'}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-signal"></i>
                    <span>{course.level || 'Beginner'}</span>
                  </div>
                </div>
                
                <div className="course-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleEnrollCourse(course)}
                  >
                    <i className="fas fa-graduation-cap"></i>
                    Enroll Now
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handleViewCourseDetails(course)}
                  >
                    <i className="fas fa-eye"></i>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEnrolledCourses = () => (
    <div className="enrolled-courses-section">
      <h2>My Enrolled Courses</h2>
      
      {enrolledCourses.length === 0 ? (
        <div className="no-courses">
          <i className="fas fa-graduation-cap"></i>
          <h3>No courses enrolled yet</h3>
          <p>Browse our course catalog and enroll in courses to get started</p>
          <button 
            className="btn btn-primary"
            onClick={() => handlePageChange('courses')}
          >
            <i className="fas fa-book"></i>
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {enrolledCourses.map((course) => (
            <div key={course.id} className="course-card enrolled">
              <div className="course-header">
                <div className="course-image">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="course-status">
                  <span className={`status-badge ${course.status?.toLowerCase() || 'active'}`}>
                    {course.status || 'Active'}
                  </span>
                </div>
              </div>
              
              <div className="course-content">
                <h4>{course.course_name}</h4>
                <p>{course.description || 'No description available'}</p>
                
                <div className="course-progress">
                  <div className="progress-info">
                    <span>Progress: {course.completed_modules || 0}/{course.module_count || 0} modules</span>
                    <span>{Math.round(((course.completed_modules || 0) / (course.module_count || 1)) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${((course.completed_modules || 0) / (course.module_count || 1)) * 100}%`}}
                    ></div>
                  </div>
                </div>
                
                <div className="course-actions">
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => handleCourseSelect(course)}
                  >
                    <i className="fas fa-play"></i>
                    Continue Learning
                  </button>
                  <button 
                    className="btn btn-outline btn-small"
                    onClick={() => handleViewCourseDetails(course)}
                  >
                    <i className="fas fa-eye"></i>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="profile-section">
      <div className="profile-header">
        <h3>My Profile</h3>
        <p>Manage your personal information and account settings</p>
      </div>
      
      <div className="profile-content">
        <div className="profile-avatar">
          <i className="fas fa-user"></i>
        </div>
        
        <div className="profile-info">
          <div className="profile-details">
            <div className="profile-detail">
              <i className="fas fa-user"></i>
              <div className="profile-detail-content">
                <div className="profile-detail-label">Full Name</div>
                <div className="profile-detail-value">{profileData.student_name || 'Not set'}</div>
              </div>
            </div>
            
            <div className="profile-detail">
              <i className="fas fa-envelope"></i>
              <div className="profile-detail-content">
                <div className="profile-detail-label">Email Address</div>
                <div className="profile-detail-value">{profileData.email || 'Not set'}</div>
              </div>
            </div>
            
            <div className="profile-detail">
              <i className="fas fa-phone"></i>
              <div className="profile-detail-content">
                <div className="profile-detail-label">Phone Number</div>
                <div className="profile-detail-value">{profileData.phone_number || 'Not set'}</div>
              </div>
            </div>
            
            <div className="profile-detail">
              <i className="fas fa-map-marker-alt"></i>
              <div className="profile-detail-content">
                <div className="profile-detail-label">Address</div>
                <div className="profile-detail-value">{profileData.address || 'Not set'}</div>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            <button className="btn btn-primary" onClick={handleEditProfile}>
              <i className="fas fa-edit"></i>
              Edit Profile
            </button>
            <button className="btn btn-outline" onClick={handleOpenChangePassword}>
              <i className="fas fa-key"></i>
              Change Password
            </button>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="edit-profile-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close" onClick={() => setShowEditProfile(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editProfileData.student_name || ''}
                  onChange={(e) => setEditProfileData({...editProfileData, student_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editProfileData.email || ''}
                  onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editProfileData.phone_number || ''}
                  onChange={(e) => setEditProfileData({...editProfileData, phone_number: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={editProfileData.address || ''}
                  onChange={(e) => setEditProfileData({...editProfileData, address: e.target.value})}
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditProfile(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="change-password-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="modal-close" onClick={() => setShowChangePassword(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword();
            }}>
              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <i className={`fas fa-${showCurrentPassword ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <i className={`fas fa-${showNewPassword ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`fas fa-${showConfirmPassword ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowChangePassword(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuizHistory = () => {
    console.log('Rendering Quiz History Component');
    console.log('Quiz Stats:', quizStats);
    console.log('Quiz History:', quizHistory);
    console.log('Quiz History Loading:', quizHistoryLoading);
    
    // Debug: Log individual attempt data
    if (quizHistory && quizHistory.length > 0) {
      console.log(`Found ${quizHistory.length} quiz attempts`);
      quizHistory.forEach((attempt, index) => {
        console.log(`Attempt ${index + 1}:`, {
          id: attempt.id,
          score_percentage: attempt.score_percentage,
          score_percentage_type: typeof attempt.score_percentage,
          correct_answers: attempt.correct_answers,
          total_questions: attempt.total_questions,
          time_taken_seconds: attempt.time_taken_seconds,
          completed_at: attempt.completed_at
        });
      });
    } else {
      console.log('No quiz history data available');
    }
    
    return (
      <div className="quiz-history-section">
        <div className="section-header">
          <h3>Quiz History</h3>
          <button className="btn btn-outline" onClick={fetchQuizHistory}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
        
        {quizHistoryLoading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            Loading quiz history...
          </div>
        ) : quizHistoryError ? (
          <div className="quiz-history-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{quizHistoryError}</p>
            <button className="btn btn-outline" onClick={fetchQuizHistory}>
              <i className="fas fa-sync-alt"></i>
              Try Again
            </button>
          </div>
        ) : quizHistory && quizHistory.length > 0 ? (
          <div className="quiz-history-content">
            {/* Quiz Statistics */}
            {(() => {
              // Calculate stats from quiz history if backend stats are not available
              let displayStats = quizStats;
              if (!quizStats || Object.keys(quizStats).length === 0) {
                if (quizHistory && quizHistory.length > 0) {
                  displayStats = {
                    total_quizzes: quizHistory.length,
                    average_score: quizHistory.reduce((sum, attempt) => {
                      const score = parseFloat(attempt.score_percentage || 0);
                      return sum + (isNaN(score) ? 0 : score);
                    }, 0) / quizHistory.length,
                    best_score: Math.max(...quizHistory.map(attempt => 
                      parseFloat(attempt.score_percentage || 0)
                    ).filter(score => !isNaN(score)))
                  };
                  console.log('Calculated stats from quiz history:', displayStats);
                }
              }
              
              return (
                <div className="quiz-stats">
                  <div className="stat-card">
                    <div className="stat-number">
                      {(() => {
                        try {
                          console.log('Quiz stats for total:', displayStats);
                          const total = parseInt(displayStats?.total_quizzes || 0);
                          console.log('Parsed total:', total);
                          return isNaN(total) ? '0' : total.toString();
                        } catch (e) {
                          console.error('Error parsing total quizzes:', e);
                          return '0';
                        }
                      })()}
                    </div>
                    <div className="stat-label">Total Quizzes</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">
                      {(() => {
                        try {
                          console.log('Quiz stats for average:', displayStats);
                          const score = parseFloat(displayStats?.average_score || 0);
                          console.log('Parsed average score:', score);
                          return isNaN(score) ? '0.0' : score.toFixed(1);
                        } catch (e) {
                          console.error('Error parsing average score:', e);
                          return '0.0';
                        }
                      })()}%
                    </div>
                    <div className="stat-label">Average Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">
                      {(() => {
                        try {
                          console.log('Quiz stats for best score:', displayStats);
                          const score = parseFloat(displayStats?.best_score || 0);
                          console.log('Parsed best score:', score);
                          return isNaN(score) ? '0.0' : score.toFixed(1);
                        } catch (e) {
                          console.error('Error parsing best score:', e);
                          return '0.0';
                        }
                      })()}%
                    </div>
                    <div className="stat-label">Best Score</div>
                  </div>
                </div>
              );
            })()}
            
            {/* Quiz History List */}
            <div className="quiz-history-list">
              {quizHistory && quizHistory.length > 0 ? quizHistory.map((attempt, index) => {
                // Validate attempt data before rendering
                if (!attempt || typeof attempt !== 'object') {
                  console.warn('Invalid attempt data:', attempt);
                  return null;
                }
                
                return (
                  <div key={attempt.id || index} className="quiz-attempt-card">
                  <div className="quiz-attempt-header">
                    <div className="quiz-attempt-title">
                      <h4>Quiz #{index + 1}</h4>
                      <span className="quiz-date">
                        {(() => {
                          try {
                            if (attempt.completed_at) {
                              return new Date(attempt.completed_at).toLocaleDateString();
                            }
                            return 'Unknown Date';
                          } catch (e) {
                            return 'Invalid Date';
                          }
                        })()}
                      </span>
                    </div>
                    <div className="quiz-score">
                      <span className="score-number">
                        {(() => {
                          try {
                            const score = parseFloat(attempt.score_percentage || 0);
                            return isNaN(score) ? '0.0' : score.toFixed(1);
                          } catch (e) {
                            return '0.0';
                          }
                        })()}%
                      </span>
                      <span className="score-label">
                        {attempt.correct_answers}/{attempt.total_questions}
                      </span>
                    </div>
                  </div>
                  
                  <div className="quiz-attempt-details">
                    <div className="detail-item">
                      <i className="fas fa-book"></i>
                      <span><strong>Lesson:</strong> {attempt.lesson_name || 'Unknown Lesson'}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-layer-group"></i>
                      <span><strong>Module:</strong> {attempt.module_name || 'Unknown Module'}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-graduation-cap"></i>
                      <span><strong>Course:</strong> {attempt.course_name || 'Unknown Course'}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-clock"></i>
                      <span><strong>Time:</strong> {(() => {
                        try {
                          const timeSeconds = parseInt(attempt.time_taken_seconds || 0);
                          if (isNaN(timeSeconds) || timeSeconds === 0) {
                            return '0 minutes';
                          }
                          const minutes = Math.floor(timeSeconds / 60);
                          const seconds = timeSeconds % 60;
                          if (minutes > 0) {
                            return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} minutes`;
                          } else {
                            return `${seconds} seconds`;
                          }
                        } catch (e) {
                          return '0 minutes';
                        }
                      })()}</span>
                    </div>
                  </div>
                </div>
                );
              }) : (
                <div className="no-quiz-history">
                  <i className="fas fa-clipboard-list"></i>
                  <p>No quiz attempts found in the data.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-quiz-history">
            <i className="fas fa-clipboard-list"></i>
            <p>No quiz attempts yet. Take your first quiz to see your history here!</p>
            <button className="btn btn-outline" onClick={fetchQuizHistory} style={{marginTop: '16px'}}>
              <i className="fas fa-sync-alt"></i>
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderQuiz = () => {
    if (quizLoading) {
      return (
        <div className="quiz-modal">
          <div className="quiz-content">
            <div className="quiz-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <h3>Generating Quiz...</h3>
              <p>Please wait while we analyze the lesson content and create questions for you.</p>
            </div>
          </div>
        </div>
      );
    }

    if (quizCompleted) {
      const minutes = Math.floor(quizTimeTaken / 60);
      const seconds = quizTimeTaken % 60;
      const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      
      return (
        <div className="quiz-modal">
          <div className="quiz-content">
            <div className="quiz-results">
              <h3>Quiz Completed!</h3>
              <div className="quiz-score">
                <span className="score-number">{Math.round((quizScore / 100) * quizQuestions.length)}</span>
                <span className="score-label">out of {quizQuestions.length}</span>
              </div>
              <div className="score-percentage">
                {quizScore}%
              </div>
              <div className="quiz-time">
                <i className="fas fa-clock"></i>
                Time taken: {timeDisplay}
              </div>
              <div className="quiz-actions">
                <button className="btn btn-outline" onClick={handleRetakeQuiz}>
                  <i className="fas fa-redo"></i>
                  Retake Quiz
                </button>
                <button className="btn btn-primary" onClick={handleCloseQuiz}>
                  <i className="fas fa-check"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (quizQuestions.length === 0) {
      return (
        <div className="quiz-modal">
          <div className="quiz-content">
            <div className="quiz-error">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>No Quiz Available</h3>
              <p>Unable to generate quiz questions for this lesson.</p>
              <button className="btn btn-primary" onClick={handleCloseQuiz}>
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];

    return (
      <div className="quiz-modal">
        <div className="quiz-content">
          <div className="quiz-header">
            <h3>Lesson Quiz</h3>
            <button className="quiz-close" onClick={handleCloseQuiz}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="quiz-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
              ></div>
            </div>
            <span className="progress-text">
              Question {currentQuestionIndex + 1} of {quizQuestions.length}
            </span>
          </div>

          <div className="quiz-question">
            <h4>{currentQuestion.question}</h4>
            
            <div className="quiz-options">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  className={`quiz-option ${userAnswer === key ? 'selected' : ''}`}
                  onClick={() => handleQuizAnswer(key)}
                >
                  <span className="option-key">{key}</span>
                  <span className="option-text">{value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button 
              className="btn btn-outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <i className="fas fa-chevron-left"></i>
              Previous
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={handleNextQuestion}
              disabled={!userAnswer}
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCourseDetails = () => {
    console.log('Rendering course details modal for:', selectedCourseForDetails);
    if (!selectedCourseForDetails) return null;

    return (
      <div className="course-details-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Course Details</h3>
            <button className="modal-close" onClick={handleCloseCourseDetails}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="modal-body">
            <div className="course-details-header">
              <div className="course-icon-large">
                <i className="fas fa-book"></i>
              </div>
              <div className="course-info-main">
                <h2>{selectedCourseForDetails.course_name}</h2>
                <p className="course-description">{selectedCourseForDetails.description || 'No description available'}</p>
                <div className="course-meta-main">
                  <span className="meta-badge">
                    <i className="fas fa-layer-group"></i>
                    {selectedCourseForDetails.module_count || 0} Modules
                  </span>
                  <span className="meta-badge">
                    <i className="fas fa-clock"></i>
                    {selectedCourseForDetails.duration || 'Self-paced'}
                  </span>
                  <span className="meta-badge">
                    <i className="fas fa-signal"></i>
                    {selectedCourseForDetails.level || 'Beginner'}
                  </span>
                </div>
              </div>
            </div>

            <div className="course-details-content">
              <div className="course-section">
                <h4>Course Overview</h4>
                <p>{selectedCourseForDetails.description || 'This course provides comprehensive learning materials and practical exercises to help you master the subject.'}</p>
              </div>

              {selectedCourseForDetails.modules && selectedCourseForDetails.modules.length > 0 && (
                <div className="course-section">
                  <h4>Course Modules</h4>
                  <div className="modules-preview">
                    {selectedCourseForDetails.modules.slice(0, 3).map((module, index) => (
                      <div key={module.id || index} className="module-preview-item">
                        <div className="module-icon">
                          <i className="fas fa-layer-group"></i>
                        </div>
                        <div className="module-info">
                          <h5>{module.module_name}</h5>
                          <p>{module.description || 'Module description'}</p>
                          <span className="lesson-count">
                            {module.lessons ? module.lessons.length : 0} lessons
                          </span>
                        </div>
                      </div>
                    ))}
                    {selectedCourseForDetails.modules.length > 3 && (
                      <div className="more-modules">
                        <span>+{selectedCourseForDetails.modules.length - 3} more modules</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="course-section">
                <h4>What You'll Learn</h4>
                <ul className="learning-objectives">
                  <li>Comprehensive understanding of the subject matter</li>
                  <li>Practical skills through hands-on exercises</li>
                  <li>Real-world applications and examples</li>
                  <li>Assessment through quizzes and assignments</li>
                </ul>
              </div>

              <div className="course-section">
                <h4>Prerequisites</h4>
                <p>No prior experience required. This course is designed for beginners and will guide you through all the necessary concepts step by step.</p>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            {enrolledCourses.some(c => c.id === selectedCourseForDetails.id) ? (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleCloseCourseDetails();
                  handleCourseSelect(selectedCourseForDetails);
                }}
              >
                <i className="fas fa-play"></i>
                Continue Learning
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleCloseCourseDetails();
                  handleEnrollCourse(selectedCourseForDetails);
                }}
              >
                <i className="fas fa-graduation-cap"></i>
                Enroll Now
              </button>
            )}
            <button className="btn btn-outline" onClick={handleCloseCourseDetails}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCourseViewer = () => {
    if (!selectedCourse) return null;

    // Calculate overall course progress
    const totalModules = selectedCourse.modules?.length || 0;
    const completedModules = selectedCourse.modules?.filter(module => 
      module.lessons?.every(lesson => 
        lesson.progress_percentage >= 100 || lesson.current_page >= lesson.total_pages
      )
    ).length || 0;
    const courseProgressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Calculate total study time for this course
    const totalCourseStudyTime = selectedCourse.total_study_time || 0;
    const currentSessionTime = currentStudyTime || 0;
    const totalStudyTimeMinutes = Math.round((totalCourseStudyTime + currentSessionTime) / 60);

    // Debug logging for course data
    console.log('Selected course data:', selectedCourse);
    console.log('Progress calculation:', {
      completed_modules: completedModules,
      total_modules: totalModules,
      calculated_percentage: courseProgressPercentage,
      total_study_time: totalCourseStudyTime,
      current_session_time: currentSessionTime
    });

    return (
      <div className="course-viewer">
        <div className="course-viewer-header">
          <button className="back-btn" onClick={() => setShowCourseViewer(false)}>
            <i className="fas fa-arrow-left"></i>
            Back to Courses
          </button>
          <div className="course-info">
            <h2>{selectedCourse.course_name}</h2>
            <div className="course-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${courseProgressPercentage}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {courseProgressPercentage}% Complete
              </span>
            </div>
            <div className="course-stats">
              <div className="stat-item">
                <i className="fas fa-layer-group"></i>
                <span>{completedModules}/{totalModules} Modules Completed</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-clock"></i>
                <span>{totalStudyTimeMinutes} minutes total study time</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-play"></i>
                <span>{currentSessionTime > 0 ? `${Math.round(currentSessionTime / 60)} minutes this session` : 'Session not started'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="course-viewer-content">
          <div className="modules-sidebar">
            <h3>Modules</h3>
            <div className="modules-list">
              {selectedCourse.modules?.map((module) => {
                // Calculate module progress
                const moduleLessons = module.lessons || [];
                const completedLessons = moduleLessons.filter(lesson => 
                  lesson.progress_percentage >= 100 || lesson.current_page >= lesson.total_pages
                ).length;
                const moduleProgressPercentage = moduleLessons.length > 0 ? 
                  Math.round((completedLessons / moduleLessons.length) * 100) : 0;

                return (
                  <div 
                    key={module.id} 
                    className={`module-item ${selectedModule?.id === module.id ? 'active' : ''}`}
                    onClick={() => handleModuleSelect(module)}
                  >
                    <div className="module-header">
                      <div className="module-info">
                        <i className="fas fa-layer-group"></i>
                        <div className="module-details">
                          <span className="module-title">{module.module_name}</span>
                          <span className="module-lesson-count">
                            {moduleLessons.length} lessons
                          </span>
                        </div>
                      </div>
                      <div className="module-progress">
                        <div className="module-progress-bar">
                          <div 
                            className="module-progress-fill" 
                            style={{ width: `${moduleProgressPercentage}%` }}
                          ></div>
                        </div>
                        <span className="module-progress-text">
                          {moduleProgressPercentage}%
                        </span>
                      </div>
                    </div>
                    {moduleLessons.length > 0 && (
                      <div className="lessons-list">
                        {moduleLessons.map((lesson) => {
                          // Calculate lesson progress
                          const lessonProgress = lesson.progress_percentage || 
                            (lesson.current_page && lesson.total_pages ? 
                              Math.round((lesson.current_page / lesson.total_pages) * 100) : 0);
                          const isCompleted = lessonProgress >= 100 || 
                            (lesson.current_page && lesson.total_pages && lesson.current_page >= lesson.total_pages);

                          return (
                            <div 
                              key={lesson.id}
                              className={`lesson-item ${selectedLesson?.id === lesson.id ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLessonSelect(lesson);
                              }}
                            >
                              <div className="lesson-info">
                                <i className={`fas ${isCompleted ? 'fa-check-circle' : 'fa-file-pdf'}`}></i>
                                <div className="lesson-details">
                                  <span className="lesson-title">{lesson.lesson_name}</span>
                                  <span className="lesson-description">
                                    {lesson.description || 'PDF Lesson'}
                                  </span>
                                  {lesson.current_page && lesson.total_pages && (
                                    <span className="lesson-pages">
                                      Page {lesson.current_page} of {lesson.total_pages}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="lesson-progress-indicator">
                                <div 
                                  className={`progress-circle ${isCompleted ? 'completed' : ''}`}
                                  data-progress={lessonProgress}
                                  style={{ '--data-progress': lessonProgress }}
                                >
                                  <span className="progress-text">
                                    {lessonProgress}%
                                  </span>
                                </div>
                                {isCompleted && (
                                  <div className="completion-badge">
                                    <i className="fas fa-check"></i>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {moduleLessons.length === 0 && (
                      <div className="no-lessons">
                        <span>No lessons available</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lesson-viewer">
            {selectedLesson ? (
              <div className="lesson-content">
                <div className="lesson-header">
                  <h3>{selectedLesson.lesson_name}</h3>
                  <div className="lesson-progress-info">
                    <div className="progress-summary">
                      <span className="progress-label">Progress:</span>
                      <span className="progress-value">
                        {(() => {
                          const progress = selectedLesson.progress_percentage || 
                            (selectedLesson.current_page && selectedLesson.total_pages ? 
                              Math.round((selectedLesson.current_page / selectedLesson.total_pages) * 100) : 0);
                          return `${progress}%`;
                        })()}
                      </span>
                    </div>
                    <div className="page-summary">
                      <span className="page-label">Pages:</span>
                      <span className="page-value">
                        {currentPdfPage} of {totalPdfPages}
                      </span>
                      {totalPdfPages === 1 && (
                        <button 
                          className="btn btn-outline btn-small"
                          onClick={refreshPageDetection}
                          title="Refresh page detection"
                          style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          <i className="fas fa-sync-alt"></i>
                        </button>
                      )}
                    </div>
                    <div className="manual-page-input">
                      <span className="page-label">Set Total Pages:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="20"
                        className="page-count-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setTotalPages(parseInt(e.target.value) || 1);
                          }
                        }}
                        onBlur={(e) => {
                          setTotalPages(parseInt(e.target.value) || 1);
                        }}
                      />
                    </div>
                  </div>
                  <div className="lesson-navigation">
                    <button 
                      className="nav-btn"
                      onClick={prevPage}
                      disabled={currentPdfPage === 1}
                    >
                      <i className="fas fa-chevron-left"></i>
                      Previous
                    </button>
                    <div className="page-navigation">
                      <span className="page-counter">
                        Page {currentPdfPage} of {totalPdfPages}
                      </span>
                      <div className="page-input">
                        <input
                          type="number"
                          min="1"
                          max={totalPdfPages}
                          value={currentPdfPage}
                          onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                          className="page-number-input"
                        />
                        <span>/ {totalPdfPages}</span>
                      </div>
                    </div>
                    <button 
                      className="nav-btn"
                      onClick={nextPage}
                      disabled={currentPdfPage >= totalPdfPages}
                    >
                      Next
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>

                <div className="pdf-viewer">
                  {pdfLoading && (
                    <div className="pdf-loading">
                      <div className="pdf-loading-content">
                        <div className="pdf-loading-spinner">
                          <i className="fas fa-file-pdf"></i>
                        </div>
                        <h3>Loading PDF Document</h3>
                        <p>Please wait while we prepare your document...</p>
                        <div className="pdf-loading-progress">
                          <div className="pdf-loading-bar"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="pdf-container">
                    <div className="pdf-toolbar">
                      <div className="pdf-toolbar-left">
                        <span className="pdf-title">
                          <i className="fas fa-file-pdf"></i>
                          {selectedLesson.lesson_name}
                        </span>
                        <span className="pdf-progress">
                          {currentPdfPage} of {totalPdfPages} pages
                        </span>
                      </div>
                      <div className="pdf-toolbar-right">
                        <button className="toolbar-btn" onClick={() => handleZoom('fit')} title="Fit to Page">
                          <i className="fas fa-expand-arrows-alt"></i>
                        </button>
                        <button className="toolbar-btn" onClick={() => handleZoom('in')} title="Zoom In">
                          <i className="fas fa-search-plus"></i>
                        </button>
                        <button className="toolbar-btn" onClick={() => handleZoom('out')} title="Zoom Out">
                          <i className="fas fa-search-minus"></i>
                        </button>
                        <button className="toolbar-btn" onClick={() => handleFullscreen()} title="Fullscreen">
                          <i className="fas fa-expand"></i>
                        </button>
                      </div>
                    </div>
                    <iframe
                      src={`http://localhost:5000/uploads/${selectedLesson.file_path}#page=${currentPdfPage}`}
                      title={selectedLesson.lesson_name}
                      width="100%"
                      height="100%"
                      style={{ 
                        border: 'none', 
                        display: pdfLoading ? 'none' : 'block',
                        minHeight: '800px',
                        height: '100%',
                        borderRadius: '0 0 20px 20px',
                        flex: '1'
                      }}
                      onLoad={(e) => {
                        const iframe = e.target;
                        handlePdfLoad(iframe);
                      }}
                      onError={() => {
                        console.error('Error loading PDF');
                        setPdfLoading(false);
                      }}
                    />
                    {!pdfLoading && (
                      <div className="pdf-controls">
                        <div className="page-info">
                          <i className="fas fa-file-pdf"></i>
                          <span>Page {currentPdfPage} of {totalPdfPages}</span>
                        </div>
                        <div className="progress-indicator">
                          <div className="progress-bar-mini">
                            <div 
                              className="progress-fill-mini" 
                              style={{ width: `${Math.round((currentPdfPage / totalPdfPages) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="progress-text-mini">
                            {Math.round((currentPdfPage / totalPdfPages) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lesson-actions">
                  <button className="btn btn-outline" onClick={() => window.open(`http://localhost:5000/uploads/${selectedLesson.file_path}`, '_blank')}>
                    <i className="fas fa-external-link-alt"></i>
                    Open Full PDF
                  </button>
                  <button className="btn btn-outline" onClick={() => window.open(`http://localhost:5000/uploads/${selectedLesson.file_path}?download=true`, '_blank')}>
                    <i className="fas fa-download"></i>
                    Download PDF
                  </button>
                  <button className="btn btn-outline" onClick={() => startQuiz()}>
                    <i className="fas fa-question-circle"></i>
                    Take Quiz
                  </button>
                  <button className="btn btn-primary" onClick={() => handleFullscreen()}>
                    <i className="fas fa-expand"></i>
                    Fullscreen View
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-lesson-selected">
                <i className="fas fa-file-pdf"></i>
                <h3>Select a Lesson</h3>
                <p>Choose a lesson from the sidebar to start learning</p>
                <div className="lesson-selection-tips">
                  <div className="tip-item">
                    <i className="fas fa-info-circle"></i>
                    <span>Lessons show your current progress and completion status</span>
                  </div>
                  <div className="tip-item">
                    <i className="fas fa-clock"></i>
                    <span>Study time is automatically tracked while viewing lessons</span>
                  </div>
                  <div className="tip-item">
                    <i className="fas fa-chart-line"></i>
                    <span>Progress is calculated based on pages viewed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced page detection that specifically looks for "1 / 50" patterns
  const enhancedPageDetection = (iframe) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Get all text content from the iframe
      const allText = iframeDoc.body ? iframeDoc.body.textContent : '';
      console.log('All text content from PDF viewer:', allText);
      
      // Look for patterns like "1 / 50", "Page 1 of 50", etc.
      const patterns = [
        /(\d+)\s*\/\s*(\d+)/g,           // "1 / 50"
        /Page\s+(\d+)\s+of\s+(\d+)/gi,   // "Page 1 of 50"
        /(\d+)\s+of\s+(\d+)/gi,          // "1 of 50"
        /(\d+)\s*-\s*(\d+)/g,            // "1 - 50"
      ];
      
      for (let pattern of patterns) {
        let match;
        while ((match = pattern.exec(allText)) !== null) {
          const totalPages = parseInt(match[2]);
          if (totalPages > 1 && totalPages < 1000) { // Reasonable page count
            console.log('Enhanced detection found pages:', totalPages, 'from pattern:', match[0]);
            setTotalPdfPages(totalPages);
            if (selectedLesson) {
              updateLessonProgress(selectedLesson.id, currentPdfPage, totalPages);
            }
            return totalPages;
          }
        }
      }
      
      return null;
    } catch (e) {
      console.log('Enhanced page detection failed:', e);
      return null;
    }
  };

  // More aggressive page detection that runs periodically
  const aggressivePageDetection = (iframe) => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const attemptDetection = () => {
      attempts++;
      console.log(`Aggressive page detection attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Try enhanced detection first (more reliable)
        let totalPages = enhancedPageDetection(iframe);
        
        if (totalPages && totalPages > 1) {
          console.log('Enhanced detection successful:', totalPages);
          setTotalPdfPages(totalPages);
          if (selectedLesson) {
            updateLessonProgress(selectedLesson.id, currentPdfPage, totalPages);
          }
          return;
        }
        
        // Fallback to regular detection
        totalPages = detectPdfPages(iframe);
        
        if (totalPages && totalPages > 1) {
          console.log('Regular detection successful:', totalPages);
          setTotalPdfPages(totalPages);
          if (selectedLesson) {
            updateLessonProgress(selectedLesson.id, currentPdfPage, totalPages);
          }
          return;
        }
        
        // If still not detected and we haven't reached max attempts
        if (attempts < maxAttempts) {
          setTimeout(attemptDetection, 1000); // Try again in 1 second
        } else {
          console.log('Aggressive detection failed after all attempts');
        }
      } catch (e) {
        console.log('Error in aggressive detection:', e);
        if (attempts < maxAttempts) {
          setTimeout(attemptDetection, 1000);
        }
      }
    };
    
    // Start the aggressive detection
    attemptDetection();
  };

  const renderQuizCompletion = () => {
    const minutes = Math.floor(quizTimeTaken / 60);
    const seconds = quizTimeTaken % 60;
    const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    return (
      <div className="quiz-completion">
        <h3>Quiz Completed!</h3>
        <div className="score-display">
          <span className="score">{quizScore}%</span>
          <p>Score: {Math.round((quizScore / 100) * quizQuestions.length)} out of {quizQuestions.length}</p>
          <p>Time taken: {timeDisplay}</p>
        </div>
        <div className="quiz-actions">
          <button className="btn btn-outline" onClick={handleRetakeQuiz}>
            <i className="fas fa-redo"></i>
            Retake Quiz
          </button>
          <button className="btn btn-primary" onClick={handleCloseQuiz}>
            <i className="fas fa-check"></i>
            Close
          </button>
        </div>
      </div>
    );
  };

  const handleOpenChangePassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowChangePassword(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {renderHeader()}
      
      <main className="dashboard-main">
        {currentPage === 'overview' && renderOverview()}
        {currentPage === 'courses' && renderAvailableCourses()}
        {currentPage === 'enrolled' && renderEnrolledCourses()}
        {currentPage === 'profile' && renderProfile()}
        {currentPage === 'quiz-history' && (
          <div key="quiz-history-page" className="quiz-history-page">
            {renderQuizHistory()}
          </div>
        )}
        {currentPage === 'ai-recommendations' && (
          <AIRecommendations student={student} />
        )}
        {currentPage === 'progress' && (
          <CourseProgress student={student} />
        )}
        {currentPage === 'feedback' && (
          <FeedbackDashboard student={student} />
        )}
        {currentPage === 'certificates' && (
          <StudentCertificates student={student} />
        )}
        {showCourseViewer && renderCourseViewer()}
        {showQuiz && renderQuiz()}
        {showCourseDetails && renderCourseDetails()}
      </main>
      
      {/* Messages Component */}
      {showMessages && (
        <Messages 
          student={student} 
          onBack={() => {
            setShowMessages(false);
            fetchUnreadMessageCount();
          }} 
        />
      )}
      
      {/* AI Learning Assistant Chatbot */}
      <ChatbotButton student={student} />
    </div>
  );
};

export default StudentDashboard;
