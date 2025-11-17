import React, { useState } from 'react';
import { Task } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
}

const TaskItem: React.FC<{ task: Task; onToggle: () => void; onDelete: () => void }> = ({ task, onToggle, onDelete }) => (
  <li className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={onToggle}
        className="h-5 w-5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 cursor-pointer"
        aria-labelledby={`task-label-${task.id}`}
      />
      <span
        id={`task-label-${task.id}`}
        className={`ml-3 text-gray-700 ${task.completed ? 'line-through text-gray-400' : ''}`}
      >
        {task.text}
      </span>
    </div>
    <button
      onClick={onDelete}
      className="text-gray-400 hover:text-red-500 transition-colors"
      aria-label={`Delete task: ${task.text}`}
    >
      <span className="material-icons">delete_outline</span>
    </button>
  </li>
);

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, tasks, onAddTask, onToggleTask, onDeleteTask }) => {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask.trim());
      setNewTask('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close task modal">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-white bg-fuchsia-600 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-400 transition-colors"
            disabled={!newTask.trim()}
          >
            Add
          </button>
        </form>

        <div className="max-h-96 overflow-y-auto pr-2">
          {tasks.length > 0 ? (
            <ul>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => onToggleTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="material-icons text-5xl mb-2">task_alt</span>
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
