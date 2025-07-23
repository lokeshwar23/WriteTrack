const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'finance', 'education', 'shopping', 'other'],
    default: 'other'
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Subtask title cannot exceed 100 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reminders: [{
    time: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['email', 'push', 'sms'],
      default: 'email'
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'daily'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: {
      type: Date,
      default: null
    },
    nextDueDate: {
      type: Date,
      default: null
    }
  },
  timeTracking: {
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0
    },
    timeEntries: [{
      startTime: {
        type: Date,
        required: true
      },
      endTime: {
        type: Date,
        default: null
      },
      duration: {
        type: Number,
        default: 0
      },
      description: {
        type: String,
        trim: true,
        maxlength: [200, 'Time entry description cannot exceed 200 characters']
      }
    }]
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, category: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ 'recurring.nextDueDate': 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to update progress based on subtasks
taskSchema.pre('save', function(next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
    this.progress = Math.round((completedSubtasks / this.subtasks.length) * 100);
  }
  next();
});

// Method to add subtask
taskSchema.methods.addSubtask = function(title) {
  this.subtasks.push({ title });
  return this.save();
};

// Method to toggle subtask completion
taskSchema.methods.toggleSubtask = function(subtaskId) {
  const subtask = this.subtasks.id(subtaskId);
  if (subtask) {
    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;
    return this.save();
  }
  throw new Error('Subtask not found');
};

// Method to add comment
taskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content
  });
  return this.save();
};

// Method to add reminder
taskSchema.methods.addReminder = function(time, type = 'email') {
  this.reminders.push({
    time: new Date(time),
    type
  });
  return this.save();
};

// Method to start time tracking
taskSchema.methods.startTimeTracking = function(description = '') {
  this.timeTracking.timeEntries.push({
    startTime: new Date(),
    description
  });
  return this.save();
};

// Method to stop time tracking
taskSchema.methods.stopTimeTracking = function() {
  const currentEntry = this.timeTracking.timeEntries.find(entry => !entry.endTime);
  if (currentEntry) {
    currentEntry.endTime = new Date();
    currentEntry.duration = (currentEntry.endTime - currentEntry.startTime) / (1000 * 60 * 60); // hours
    this.timeTracking.actualHours += currentEntry.duration;
    return this.save();
  }
  throw new Error('No active time tracking session');
};

// Method to mark as completed
taskSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress = 100;
  
  // Mark all subtasks as completed
  this.subtasks.forEach(subtask => {
    if (!subtask.completed) {
      subtask.completed = true;
      subtask.completedAt = new Date();
    }
  });
  
  return this.save();
};

// Method to create recurring task
taskSchema.methods.createRecurringTask = function() {
  if (!this.recurring.enabled || !this.recurring.nextDueDate) {
    return null;
  }
  
  const newTask = new this.constructor({
    title: this.title,
    description: this.description,
    priority: this.priority,
    category: this.category,
    user: this.user,
    assignedTo: this.assignedTo,
    tags: this.tags,
    subtasks: this.subtasks.map(subtask => ({
      title: subtask.title,
      completed: false
    })),
    recurring: this.recurring,
    timeTracking: {
      estimatedHours: this.timeTracking.estimatedHours,
      actualHours: 0,
      timeEntries: []
    }
  });
  
  // Calculate next due date
  const nextDue = new Date(this.recurring.nextDueDate);
  switch (this.recurring.pattern) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + this.recurring.interval);
      break;
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + (7 * this.recurring.interval));
      break;
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + this.recurring.interval);
      break;
    case 'yearly':
      nextDue.setFullYear(nextDue.getFullYear() + this.recurring.interval);
      break;
  }
  
  newTask.dueDate = nextDue;
  newTask.recurring.nextDueDate = nextDue;
  
  return newTask.save();
};

// Static method to find overdue tasks
taskSchema.statics.findOverdueTasks = function(userId) {
  return this.find({
    user: userId,
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

// Static method to find tasks due today
taskSchema.statics.findTasksDueToday = function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  return this.find({
    user: userId,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

// Static method to find tasks by category
taskSchema.statics.findByCategory = function(userId, category) {
  return this.find({
    user: userId,
    category: category,
    archived: false
  });
};

// Static method to find tasks by priority
taskSchema.statics.findByPriority = function(userId, priority) {
  return this.find({
    user: userId,
    priority: priority,
    archived: false
  });
};

// Static method to search tasks
taskSchema.statics.searchTasks = function(userId, searchTerm) {
  return this.find({
    user: userId,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ],
    archived: false
  });
};

module.exports = mongoose.model('Task', taskSchema); 