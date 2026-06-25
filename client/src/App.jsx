import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import api from './api/client.js';

function LearnRedirect() {
  const { courseId } = useParams();
  return <Navigate to={`/student/learn/${courseId}`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Results from './pages/Results.jsx';
import About from './pages/About.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminCourses from './pages/admin/AdminCourses.jsx';
import AdminCourseForm from './pages/admin/AdminCourseForm.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminStudents from './pages/admin/AdminStudents.jsx';
import AdminGamification from './pages/admin/AdminGamification.jsx';
import AdminEnrollments from './pages/admin/AdminEnrollments.jsx';
import AdminContent from './pages/admin/AdminContent.jsx';
import AdminLiveClasses from './pages/admin/AdminLiveClasses.jsx';
import AdminCourseContent from './pages/admin/AdminCourseContent.jsx';
import AdminTests from './pages/admin/AdminTests.jsx';
import AdminTestForm from './pages/admin/AdminTestForm.jsx';
import AdminTestSeries from './pages/admin/AdminTestSeries.jsx';
import AdminTestSeriesForm from './pages/admin/AdminTestSeriesForm.jsx';
import AdminBankTransfers from './pages/admin/AdminBankTransfers.jsx';
import AdminPayments from './pages/admin/AdminPayments.jsx';
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import AdminSubscribers from './pages/admin/AdminSubscribers.jsx';
import AdminEbooks from './pages/admin/AdminEbooks.jsx';
import AdminDoubts from './pages/admin/AdminDoubts.jsx';
import AdminEnquiries from './pages/admin/AdminEnquiries.jsx';
import AdminFeed from './pages/admin/AdminFeed.jsx';
import AdminPushNotifications from './pages/admin/AdminPushNotifications.jsx';
import AdminPopups from './pages/admin/AdminPopups.jsx';
import AdminChat from './pages/admin/AdminChat.jsx';
import AdminRatings from './pages/admin/AdminRatings.jsx';
import AdminReportedQuestions from './pages/admin/AdminReportedQuestions.jsx';
import Contact from './pages/Contact.jsx';
import Feed from './pages/Feed.jsx';
import SupportChatWidget from './components/SupportChatWidget.jsx';
import TestPortal from './pages/TestPortal.jsx';
import TakeTest from './pages/TakeTest.jsx';
import Ebooks from './pages/Ebooks.jsx';
import AskDoubt from './pages/AskDoubt.jsx';
import TestResult from './pages/TestResult.jsx';
import TestSeriesDetail from './pages/TestSeriesDetail.jsx';
import LiveRoom from './pages/LiveRoom.jsx';
import LearnCourse from './pages/LearnCourse.jsx';
import Impersonate from './pages/Impersonate.jsx';
import TermsAndConditions from './pages/TermsAndConditions.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import StudentLayout from './components/StudentLayout.jsx';
import StudentCourses from './pages/student/StudentCourses.jsx';
import ToppersPass from './pages/student/ToppersPass.jsx';
import Boosters from './pages/student/Boosters.jsx';
import Streak from './pages/student/Streak.jsx';
import CoinsWallet from './pages/student/CoinsWallet.jsx';
import ReferAndEarn from './pages/student/ReferAndEarn.jsx';
import SavedQuestions from './pages/student/SavedQuestions.jsx';
import ReportedQuestions from './pages/student/ReportedQuestions.jsx';
import MyOrders from './pages/student/MyOrders.jsx';
import AdminStatsStreak from './pages/admin/AdminStatsStreak.jsx';
import AdminStatsWallet from './pages/admin/AdminStatsWallet.jsx';
import AdminStatsRefer from './pages/admin/AdminStatsRefer.jsx';
import StudentFeed from './pages/student/Feed.jsx';
import StudentContact from './pages/student/Contact.jsx';
import StudentPrivacyPolicy from './pages/student/PrivacyPolicy.jsx';
import AskPrepiify from './pages/student/AskPrepiify.jsx';
import SupportChat from './pages/student/SupportChat.jsx';
import StudentLiveClasses from './pages/student/LiveClasses.jsx';
import SyllabusTracker from './pages/student/SyllabusTracker.jsx';
import MyPlanner from './pages/student/MyPlanner.jsx';
import Mentorship from './pages/student/Mentorship.jsx';
import Downloads from './pages/student/Downloads.jsx';
import AdminSyllabusTracker from './pages/admin/AdminSyllabusTracker.jsx';
import AdminMentorship from './pages/admin/AdminMentorship.jsx';
import AdminSecurity from './pages/admin/AdminSecurity.jsx';


export default function App() {
  useEffect(() => {
    // Block context menu (right click)
    const blockContextMenu = (e) => e.preventDefault();

    // Track PWA installation
    const trackPwaInstall = () => {
      api.post('/admin/analytics/app-download').catch(() => {});
    };
    window.addEventListener('appinstalled', trackPwaInstall);

    // Block keyboard combinations (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S, Ctrl+P)
    const blockShortcuts = (e) => {
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
      }
    };

    // Print Screen / Copy protection
    const blockPrintScreen = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        toast.error('Screenshots are disabled for security reasons.');
      }
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('keyup', blockPrintScreen);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('keyup', blockPrintScreen);
      window.removeEventListener('appinstalled', trackPwaInstall);
    };
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <ScrollToTop />
      <Routes>
        {/* Admin routes use their own layout (no site navbar) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="courses/new" element={<AdminCourseForm />} />
          <Route path="courses/:id/edit" element={<AdminCourseForm />} />
          <Route path="courses/:id/content" element={<AdminCourseContent />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="gamification" element={<AdminGamification />} />
          <Route path="enrollments" element={<AdminEnrollments />} />
          <Route path="live-classes" element={<AdminLiveClasses />} />
          <Route path="tests" element={<AdminTests />} />
          <Route path="tests/new" element={<AdminTestForm />} />
          <Route path="tests/:id/edit" element={<AdminTestForm />} />
          <Route path="test-series" element={<AdminTestSeries />} />
          <Route path="test-series/new" element={<AdminTestSeriesForm />} />
          <Route path="test-series/:id/edit" element={<AdminTestSeriesForm />} />
          <Route path="content/:type" element={<AdminContent />} />
          <Route path="bank-transfers" element={<AdminBankTransfers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="ebooks" element={<AdminEbooks />} />
          <Route path="doubts" element={<AdminDoubts />} />
          <Route path="marketing/enquiries" element={<AdminEnquiries />} />
          <Route path="marketing/feed" element={<AdminFeed />} />
          <Route path="sales/push-notification" element={<AdminPushNotifications />} />
          <Route path="sales/popup" element={<AdminPopups />} />
          <Route path="support/chat" element={<AdminChat />} />
          <Route path="ratings" element={<AdminRatings />} />
          <Route path="reported-questions" element={<AdminReportedQuestions />} />
          <Route path="stats/streak" element={<AdminStatsStreak />} />
          <Route path="stats/wallet" element={<AdminStatsWallet />} />
          <Route path="stats/refer" element={<AdminStatsRefer />} />
          <Route path="syllabus-tracker" element={<AdminSyllabusTracker />} />
          <Route path="mentorship" element={<AdminMentorship />} />
          <Route path="security" element={<AdminSecurity />} />
        </Route>

        {/* Student layout routes (no global navbar/footer) */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ask-prepiify" element={<AskPrepiify />} />
          <Route path="toppers-pass" element={<ToppersPass />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="practice" element={<TestPortal />} />
          <Route path="library" element={<Ebooks />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="live-classes" element={<StudentLiveClasses />} />
          <Route path="boosters" element={<Boosters />} />
          <Route path="streak" element={<Streak />} />
          <Route path="wallet" element={<CoinsWallet />} />
          <Route path="refer" element={<ReferAndEarn />} />
          <Route path="profile" element={<Profile />} />
          <Route path="saved-questions" element={<SavedQuestions />} />
          <Route path="reported-questions" element={<ReportedQuestions />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="feed" element={<StudentFeed />} />
          <Route path="contact" element={<StudentContact />} />
          <Route path="privacy-policy" element={<StudentPrivacyPolicy />} />
          <Route path="doubts" element={<AskDoubt />} />
          <Route path="support" element={<SupportChat />} />
          <Route path="learn/:courseId" element={<LearnCourse />} />
          <Route path="syllabus-tracker" element={<SyllabusTracker />} />
          <Route path="planner" element={<MyPlanner />} />
          <Route path="mentorship" element={<Mentorship />} />
        </Route>

        {/* Live class room (no navbar/footer chrome) */}
        <Route path="/impersonate" element={<Impersonate />} />

        {/* Live class room (no navbar/footer chrome) */}
        <Route
          path="/live/:id"
          element={
            <ProtectedRoute>
              <LiveRoom />
            </ProtectedRoute>
          }
        />

        {/* Full-screen test pages (no navbar/footer, no sidebar) */}
        <Route path="/take-test/:testId" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
        <Route path="/test-result/:attemptId" element={<ProtectedRoute><TestResult /></ProtectedRoute>} />

        {/* Public / student routes with navbar + footer */}
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/:id" element={<CourseDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/tests" element={<TestPortal />} />
                  <Route path="/ebooks" element={<Ebooks />} />
                  <Route path="/ask-doubt" element={<ProtectedRoute><AskDoubt /></ProtectedRoute>} />
                  <Route path="/doubts" element={<ProtectedRoute><AskDoubt /></ProtectedRoute>} />
                  <Route path="/test-series/:id" element={<TestSeriesDetail />} />
                  <Route
                    path="/dashboard"
                    element={<Navigate to="/student/dashboard" replace />}
                  />
                  <Route
                    path="/profile"
                    element={<Navigate to="/student/profile" replace />}
                  />
                  <Route path="/learn/:courseId" element={<LearnRedirect />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <SupportChatWidget />
            </>
          }
        />
      </Routes>
    </div>
  );
}
