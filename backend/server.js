import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import leaveBalanceRoutes from './routes/leaveBalanceRoutes.js';
import profileChangeRequestRoutes from './routes/profileChangeRequestRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import attendanceRegularizationRoutes from './routes/attendanceRegularizationRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { startAbsentCronJob } from './utils/markAbsentJob.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/leave-balance', leaveBalanceRoutes);
app.use('/api/profile-change-requests', profileChangeRequestRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/attendance-regularization', attendanceRegularizationRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'DMW CNC Solutions - Leave Management System API' });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  startAbsentCronJob();
});
