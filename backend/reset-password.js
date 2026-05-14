const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const resetPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://sammeetm:zuCkeV7dCPFb7xTp@cluster0.nzhlggd.mongodb.net/employee-feedback?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);

    console.log('Connected to MongoDB');

    // Ask for user email
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter the email of the user whose password you want to reset: ', async (email) => {
      const user = await User.findOne({ email });

      if (!user) {
        console.log('User not found with email:', email);
        rl.close();
        mongoose.connection.close();
        return;
      }

      rl.question('Enter new password: ', async (newPassword) => {
        user.password = newPassword; // Will be hashed by pre-save hook
        await user.save();

        console.log(`Password reset successfully for user: ${user.name} (${user.email})`);
        console.log('New password:', newPassword);

        rl.close();
        mongoose.connection.close();
      });
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
};

resetPassword();