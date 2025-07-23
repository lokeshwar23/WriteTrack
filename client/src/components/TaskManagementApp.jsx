import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, User, Flag, Filter, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { usersAPI } from '../services/api';

// Constants moved outside for TaskForm to access
const getStatuses = (stats) => [
  { id: 'all', title: 'All Tasks', color: 'bg-gray-500', count: stats.total || 0 },
  { id: 'pending', title: 'To Do', color: 'bg-blue-500', count: stats.pending || 0 },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-500', count: stats.inProgress || 0 },
  { id: 'completed', title: 'Completed', color: 'bg-green-500', count: stats.completed || 0 },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-red-500', count: stats.cancelled || 0 }
];

const priorities = [
  { value: 'all', label: 'All Priority', color: 'text-gray-600' },
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-red-600' }
];

// TaskForm component moved outside for export
const TaskForm = ({ task, onSave, onCancel, title, users = [] }) => {
  const [formData, setFormData] = useState(task || {
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    dueDate: '',
    status: 'pending',
    assignedTo: ''
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="text-xl font-bold mb-6">{title}</h2>
        
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Title*</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="form-input"
              placeholder="Enter task title"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-input form-textarea"
              rows="4"
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="form-input"
              >
                {priorities.filter(p => p.value !== 'all').map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="form-input"
              >
                {getStatuses({}).filter(s => s.id !== 'all').map(status => (
                  <option key={status.id} value={status.id}>
                    {status.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned User</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                className="form-input"
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="form-input"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onCancel}
            className="btn  margin2 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="btn margin2 btn-primary"
          >
            {task ? 'Update' : 'Add'} Task
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskManagementApp = () => {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activePriorityFilter, setActivePriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const { user, logout } = useAuth();

  const statuses = getStatuses(stats);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    dueDate: '',
    status: 'pending'
  });

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/tasks',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Ensure tasks is always an array
      let tasksArray = [];
      if (Array.isArray(response.data.tasks)) {
        tasksArray = response.data.tasks;
      } else if (Array.isArray(response.data)) {
        tasksArray = response.data;
      } else {
        tasksArray = [];
      }
      setTasks(tasksArray);
      console.log('Fetched tasks:', tasksArray);
      setError('');
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch task statistics
  const fetchStats = async () => {
    try {
      // Calculate stats from tasks array instead of API call
      const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    // Fetch users for assignment
    usersAPI.getUsers().then(res => setUsers(res.data.users || res.data)).catch(() => setUsers([]));
  }, []);

  // Check URL parameter to show add form
  useEffect(() => {
    const showForm = searchParams.get('showForm');
    if (showForm === 'add') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchStats();
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const addTask = async (formData) => {
    try {
      // Transform form data to match backend expectations
      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category || 'work',
        dueDate: formData.dueDate || null,
        status: formData.status || 'pending',
        assignedTo: formData.assignedTo ? [formData.assignedTo] : []
      };
      console.log('Adding task with data:', taskData);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/tasks',
        taskData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([...tasks, response.data.task]);
      setShowAddForm(false);
      fetchStats(); // Refresh stats
      setError('');
    } catch (error) {
      console.error('Error adding task:', error);
      if (error.response?.data?.errors) {
        setError(error.response.data.errors[0].msg);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to add task');
      }
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateTask = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${editingTask._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(task => 
        task._id === editingTask._id ? response.data.task : task
      ));
      setEditingTask(null);
      fetchStats(); // Refresh stats
      setError('');
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteTask = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/tasks/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.filter(task => task._id !== id));
      fetchStats(); // Refresh stats
      setError('');
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getPriorityColor = (priority) => {
    return priorities.find(p => p.value === priority)?.color || 'text-gray-600';
  };

  const getStatusColor = (status) => {
    return statuses.find(s => s.id === status)?.color || 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = activeStatusFilter === 'all' || task.status === activeStatusFilter;
    const priorityMatch = activePriorityFilter === 'all' || task.priority === activePriorityFilter;
    return statusMatch && priorityMatch;
  });

  const handleLogout = () => {
    logout();
  };

  const TaskCard = ({ task }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {statuses.find(s => s.id === task.status)?.title}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setEditingTask(task)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit Task"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => deleteTask(task._id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 text-lg mb-2">{task.title}</h3>
      
      {task.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{task.description}</p>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Flag size={16} className={`mr-2 ${getPriorityColor(task.priority)}`} />
            <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
              {priorities.find(p => p.value === task.priority)?.label} Priority
            </span>
          </div>
          {task.dueDate && (
            <div className="flex items-center text-gray-500">
              <Calendar size={16} className="mr-2" />
              <span className="text-sm">{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
        
        {task.assignedTo && task.assignedTo.length > 0 && (
          <div className="flex items-center text-gray-600">
            <span className="text-sm">Assigned to {task.assignedTo[0]?.name || 'User'}</span>
          </div>
        )}
        
        {task.category && (
          <div className="flex items-center text-gray-600">
            <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700">
              {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'dark-theme bg-black text-white' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-300">Hey, {user?.name}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center margin1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              Add Task
            </button>
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center margin1 px-4 py-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:text-gray-200 text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle dark mode"
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <button
              onClick={handleLogout}
              className="flex margin1 items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="mb-8">
          {/* Status Filter Buttons */}
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <Filter size={18} className="mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {statuses.map(status => (
                <button
                  key={status.id}
                  onClick={() => setActiveStatusFilter(status.id)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    activeStatusFilter === status.id
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${status.color} mr-2`}></div>
                  {status.title}
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {status.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter Buttons */}
          <div>
            <div className="flex items-center mb-3">
              <Flag size={18} className="mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter by Priority:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {priorities.map(priority => (
                <button
                  key={priority.value}
                  onClick={() => setActivePriorityFilter(priority.value)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    activePriorityFilter === priority.value
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Flag size={14} className={`mr-2 ${priority.color}`} />
                  {priority.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {priority.value === 'all' ? tasks.length : tasks.filter(t => t.priority === priority.value).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTasks.map(task => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or add a new task to get started.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              Add Your First Task
            </button>
          </div>
        )}

        {/* Add Task Form */}
        {showAddForm && (
          <TaskForm
            onSave={addTask}
            onCancel={() => setShowAddForm(false)}
            title="Add New Task"
            users={users}
          />
        )}

        {/* Edit Task Form */}
        {editingTask && (
          <TaskForm
            task={editingTask}
            onSave={updateTask}
            onCancel={() => setEditingTask(null)}
            title="Edit Task"
            users={users}
          />
        )}
      </div>
    </div>
  );
};

// ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong in Task Management</h2>
          <pre>{this.state.error?.message || String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap TaskManagementApp with ErrorBoundary for export
const TaskManagementAppWithBoundary = (props) => (
  <ErrorBoundary>
    <TaskManagementApp {...props} />
  </ErrorBoundary>
);

export default TaskManagementAppWithBoundary;
export  { TaskForm };