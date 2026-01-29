import Employee from '../models/Employee.js';
import { generateToken } from '../utils/jwt.js';

// Register new employee
export const signup = async (req, res) => {
  try {
    const { employeeId, name, email, password, department, designation, phoneNumber, joiningDate } = req.body;

    const employeeExists = await Employee.findOne({ $or: [{ email }, { employeeId }] });

    if (employeeExists) {
      return res.status(400).json({ message: 'Employee already exists with this email or employee ID' });
    }

    const employee = await Employee.create({
      employeeId,
      name,
      email,
      password,
      department,
      designation,
      phoneNumber,
      joiningDate,
      role: 'employee',
    });

    if (employee) {
      res.status(201).json({
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        phoneNumber: employee.phoneNumber,
        role: employee.role,
        token: generateToken(employee._id, employee.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid employee data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Login employee/HR
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for predefined HR login
    if (email === process.env.HR_EMAIL && password === process.env.HR_PASSWORD) {
      let hrEmployee = await Employee.findOne({ email: process.env.HR_EMAIL }).select('+password');

      if (!hrEmployee) {
        hrEmployee = await Employee.create({
          employeeId: 'HR001',
          name: 'HR Manager',
          email: process.env.HR_EMAIL,
          password: process.env.HR_PASSWORD,
          department: 'Human Resources',
          designation: 'HR Manager',
          phoneNumber: '0000000000',
          joiningDate: new Date(),
          role: 'hr',
        });
      }

      return res.json({
        _id: hrEmployee._id,
        employeeId: hrEmployee.employeeId,
        name: hrEmployee.name,
        email: hrEmployee.email,
        department: hrEmployee.department,
        designation: hrEmployee.designation,
        phoneNumber: hrEmployee.phoneNumber,
        role: hrEmployee.role,
        token: generateToken(hrEmployee._id, hrEmployee.role),
      });
    }

    // Regular employee login
    const employee = await Employee.findOne({ email }).select('+password');

    if (employee && (await employee.matchPassword(password))) {
      res.json({
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        phoneNumber: employee.phoneNumber,
        role: employee.role,
        token: generateToken(employee._id, employee.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id);
    
    if (employee) {
      res.json({
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        phoneNumber: employee.phoneNumber,
        joiningDate: employee.joiningDate,
        role: employee.role,
      });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
