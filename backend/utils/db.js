// In-memory database for development (ignoring MongoDB)
const users = new Map();
const feedbacks = new Map();
let userIdCounter = 1;
let feedbackIdCounter = 1;

class InMemoryDB {
  // User operations
  static createUser(userData) {
    const id = userIdCounter++;
    const user = {
      _id: id,
      id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.set(id, user);
    return user;
  }

  static findUserByEmail(email) {
    for (let user of users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  static findUserById(id) {
    return users.get(parseInt(id));
  }

  static getAllUsers() {
    return Array.from(users.values());
  }

  // Feedback operations
  static createFeedback(feedbackData) {
    const id = feedbackIdCounter++;
    const feedback = {
      _id: id,
      id,
      ...feedbackData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    feedbacks.set(id, feedback);
    return feedback;
  }

  static getFeedbackById(id) {
    return feedbacks.get(parseInt(id));
  }

  static getAllFeedback() {
    return Array.from(feedbacks.values());
  }

  static getFeedbackByUserId(userId) {
    return Array.from(feedbacks.values()).filter(f => f.employeeId === parseInt(userId));
  }

  static updateFeedback(id, updates) {
    const feedback = feedbacks.get(parseInt(id));
    if (feedback) {
      const updated = { ...feedback, ...updates, updatedAt: new Date() };
      feedbacks.set(parseInt(id), updated);
      return updated;
    }
    return null;
  }

  static deleteFeedback(id) {
    return feedbacks.delete(parseInt(id));
  }

  static initialize() {
    const admin = this.createUser({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'hashedpassword123',
      role: 'admin',
      department: 'Management'
    });

    const employee = this.createUser({
      name: 'John Doe',
      email: 'john@test.com',
      password: 'hashedpassword123',
      role: 'employee',
      department: 'Engineering'
    });

    this.createFeedback({
      employeeId: employee.id,
      title: 'Great Team Support',
      description: 'The team has been very supportive and collaborative.',
      category: 'Management',
      status: 'pending',
      replies: []
    });
  }
}

InMemoryDB.initialize();

module.exports = InMemoryDB;
