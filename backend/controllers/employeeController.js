import Employee from '../models/Employee.js';

// Get all employees (HR only)
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).select('-password');
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get single employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-password');
    
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Update employee (HR only)
export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (employee) {
      employee.name = req.body.name || employee.name;
      employee.department = req.body.department || employee.department;
      employee.designation = req.body.designation || employee.designation;
      employee.phoneNumber = req.body.phoneNumber || employee.phoneNumber;
      employee.isActive = req.body.isActive !== undefined ? req.body.isActive : employee.isActive;

      const updatedEmployee = await employee.save();

      res.json({
        _id: updatedEmployee._id,
        employeeId: updatedEmployee.employeeId,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        department: updatedEmployee.department,
        designation: updatedEmployee.designation,
        phoneNumber: updatedEmployee.phoneNumber,
        role: updatedEmployee.role,
        isActive: updatedEmployee.isActive,
      });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Delete employee (HR only)
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (employee) {
      await Employee.deleteOne({ _id: req.params.id });
      res.json({ message: 'Employee removed successfully' });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get employee statistics (HR only)
export const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ role: 'employee' });
    const activeEmployees = await Employee.countDocuments({ role: 'employee', isActive: true });
    const inactiveEmployees = await Employee.countDocuments({ role: 'employee', isActive: false });
    
    // Get department-wise count
    const departmentStats = await Employee.aggregate([
      { $match: { role: 'employee' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      departmentStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
