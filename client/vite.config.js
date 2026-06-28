import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file from the parent directory
  const env = loadEnv(mode, resolve(__dirname, '..'), '');
  const apiUrl = env.BACKEND_API_URL || 'http://127.0.0.1:5254';

  return {
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          signin: resolve(__dirname, 'signin.html'),
          signup: resolve(__dirname, 'signup.html'),
          courses: resolve(__dirname, 'courses.html'),
          courseDetail: resolve(__dirname, 'course-detail.html'),
          studentCart: resolve(__dirname, 'student/cart.html'),
          studentLearning: resolve(__dirname, 'student/my-learning.html'),
          studentProfile: resolve(__dirname, 'student/profile.html'),
          studentLessonPlayer: resolve(__dirname, 'student/lesson-player.html'),
          adminDashboard: resolve(__dirname, 'admin/dashboard.html'),
          adminCourses: resolve(__dirname, 'admin/courses.html'),
          adminLessons: resolve(__dirname, 'admin/lessons.html'),
          adminTeachers: resolve(__dirname, 'admin/teachers.html')
        }
      }
    }
  };
});
