import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';

dotenv.config();

const checkDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected Successfully');
    console.log('Database:', mongoose.connection.name);
    console.log('\n--- Checking Collections ---');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check employees collection
    console.log('\n--- Employees Collection ---');
    const employeeCount = await Employee.countDocuments();
    console.log(`Total employees: ${employeeCount}`);
    
    if (employeeCount > 0) {
      console.log('\nEmployee records:');
      const employees = await Employee.find({}).select('-password');
      employees.forEach((emp, index) => {
        console.log(`\n${index + 1}. ${emp.name}`);
        console.log(`   Employee ID: ${emp.employeeId}`);
        console.log(`   Email: ${emp.email}`);
        console.log(`   Role: ${emp.role}`);
        console.log(`   Department: ${emp.department}`);
        console.log(`   Created: ${emp.createdAt}`);
      });
    } else {
      console.log('No employee records found in the database.');
    }
    
    mongoose.connection.close();
    console.log('\n✓ Database check completed');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

checkDatabase();
