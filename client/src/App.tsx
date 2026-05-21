import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ExamView from './pages/ExamView';
import TeacherDashboard from './pages/TeacherDashboard';
import MarkingView from './pages/MarkingView';
import TeacherLogin from './pages/TeacherLogin';
import CreateExam from './pages/CreateExam';
import ResultsView from './pages/ResultsView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Student Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/exam/:examId/:submissionId" element={<ExamView />} />
          <Route path="/results/:submissionId" element={<ResultsView />} />
          
          {/* Teacher Routes */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/create" element={<CreateExam />} />
          <Route path="/teacher/edit/:id" element={<CreateExam />} />
          <Route path="/teacher/mark/:submissionId" element={<MarkingView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
