/**
 * Task Management Component
 * Provides todo lists, assignments, and project tracking
 */

import { useState, useEffect } from 'react';
import { 
  createTask, 
  updateTask, 
  deleteTask, 
  getTasks,
  createProject,
  getProjects
} from '../../lib/task-management/service';

export default function TaskManager({ userId, groupId = null }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [filter, setFilter] = useState('all'); // all, pending, completed, overdue
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, groupId, selectedProject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        getTasks({ userId, groupId, projectId: selectedProject?.id }),
        getProjects({ userId, groupId })
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await createTask({
        ...newTask,
        userId,
        groupId,
        projectId: selectedProject?.id
      });
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
      await loadData();
    } catch (error) {
      alert('Failed to create task: ' + error.message);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await updateTask(task.id, {
        status: task.status === 'completed' ? 'pending' : 'completed',
        completedAt: task.status === 'completed' ? null : new Date()
      });
      await loadData();
    } catch (error) {
      alert('Failed to update task: ' + error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    
    try {
      await deleteTask(taskId);
      await loadData();
    } catch (error) {
      alert('Failed to delete task: ' + error.message);
    }
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending': return task.status === 'pending';
      case 'completed': return task.status === 'completed';
      case 'overdue': return task.status === 'pending' && task.dueDate && new Date(task.dueDate) < new Date();
      default: return true;
    }
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(t => t.status === 'pending' && t.dueDate && new Date(t.dueDate) < new Date()).length;
    
    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  return (
    <div className="task-manager">
      <div className="header">
        <h2>📋 Task Manager</h2>
        <div className="stats">
          <div className="stat">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat overdue">
            <span className="stat-number">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="project-selector">
          <select 
            value={selectedProject?.id || ''} 
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project || null);
            }}
          >
            <option value="">All Tasks</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filters">
          {['all', 'pending', 'completed', 'overdue'].map(filterOption => (
            <button 
              key={filterOption}
              className={filter === filterOption ? 'active' : ''}
              onClick={() => setFilter(filterOption)}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreateTask} className="new-task-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <select 
            value={newTask.priority}
            onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="form-row">
          <textarea
            placeholder="Description (optional)..."
            value={newTask.description}
            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            rows="2"
          />
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
          />
          <button type="submit">➕ Add Task</button>
        </div>
      </form>

      <div className="task-list">
        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found</p>
            <p>Create your first task above!</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className={`task-item ${task.status} ${task.priority}`}>
              <div className="task-main">
                <div className="task-checkbox">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => handleToggleTask(task)}
                  />
                </div>
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  {task.description && <div className="task-description">{task.description}</div>}
                  <div className="task-meta">
                    <span className={`priority ${task.priority}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {task.dueDate && (
                      <span className={`due-date ${new Date(task.dueDate) < new Date() ? 'overdue' : ''}`}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.completedAt && (
                      <span className="completed-at">
                        Completed: {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="task-actions">
                <button onClick={() => handleDeleteTask(task.id)} className="delete-btn">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .task-manager {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          text-align: center;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .stat.overdue {
          background: #fef2f2;
          color: #dc2626;
        }

        .stat-number {
          display: block;
          font-size: 20px;
          font-weight: bold;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .filters {
          display: flex;
          gap: 8px;
        }

        .filters button {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .filters button.active {
          background: #3b82f6;
          color: white;
        }

        .new-task-form {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .form-row input, .form-row textarea, .form-row select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          outline: none;
        }

        .form-row input[type="text"] {
          flex: 2;
        }

        .form-row textarea {
          flex: 2;
          resize: vertical;
        }

        .form-row button {
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
        }

        .task-list {
          space-y: 12px;
        }

        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
          transition: all 0.2s;
        }

        .task-item:hover {
          border-color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .task-item.completed {
          opacity: 0.6;
        }

        .task-item.high {
          border-left: 4px solid #f59e0b;
        }

        .task-item.urgent {
          border-left: 4px solid #ef4444;
        }

        .task-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .task-checkbox input {
          width: 18px;
          height: 18px;
          margin-top: 2px;
        }

        .task-content {
          flex: 1;
        }

        .task-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .task-item.completed .task-title {
          text-decoration: line-through;
        }

        .task-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .task-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
        }

        .priority {
          padding: 2px 6px;
          border-radius: 12px;
          font-weight: 600;
        }

        .priority.low { background: #d1fae5; color: #065f46; }
        .priority.medium { background: #dbeafe; color: #1e40af; }
        .priority.high { background: #fef3c7; color: #92400e; }
        .priority.urgent { background: #fee2e2; color: #b91c1c; }

        .due-date.overdue {
          color: #dc2626;
          font-weight: 600;
        }

        .completed-at {
          color: #059669;
        }

        .task-actions .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .task-actions .delete-btn:hover {
          background: #fef2f2;
        }

        .loading, .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .controls {
            flex-direction: column;
            align-items: flex-start;
          }

          .form-row {
            flex-direction: column;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}