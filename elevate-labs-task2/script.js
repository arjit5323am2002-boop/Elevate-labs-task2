// Todo List Application with Advanced Features and Animations
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.isEditing = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    // Initialize DOM elements
    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearBtn = document.getElementById('clearCompleted');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.activeTasksEl = document.getElementById('activeTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
    }

    // Bind event listeners
    bindEvents() {
        // Add task events
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.currentTarget.dataset.filter);
            });
        });

        // Clear completed tasks
        this.clearBtn.addEventListener('click', () => this.clearCompleted());

        // Input animation events
        this.taskInput.addEventListener('focus', () => {
            this.taskInput.parentElement.style.transform = 'scale(1.02)';
        });

        this.taskInput.addEventListener('blur', () => {
            this.taskInput.parentElement.style.transform = 'scale(1)';
        });
    }

    // Generate unique ID for tasks
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Add new task
    addTask() {
        const text = this.taskInput.value.trim();
        
        if (!text) {
            this.showToast('Please enter a task!', 'error');
            this.taskInput.focus();
            return;
        }

        if (text.length > 100) {
            this.showToast('Task is too long! Maximum 100 characters.', 'error');
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.saveToStorage();
        this.render();
        this.updateStats();
        this.showToast('Task added successfully!', 'success');

        // Add button animation
        this.addBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.addBtn.style.transform = 'scale(1)';
        }, 150);
    }

    // Toggle task completion
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveToStorage();
            this.render();
            this.updateStats();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as active!';
            this.showToast(message, 'success');
        }
    }

    // Delete task with animation
    deleteTask(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        
        if (taskElement) {
            taskElement.classList.add('removing');
            
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.saveToStorage();
                this.render();
                this.updateStats();
                this.showToast('Task deleted!', 'success');
            }, 300);
        }
    }

    // Start editing task
    editTask(id) {
        if (this.isEditing) return;
        
        this.isEditing = id;
        const task = this.tasks.find(t => t.id === id);
        const taskElement = document.querySelector(`[data-id="${id}"] .task-text`);
        
        if (task && taskElement) {
            const originalText = task.text;
            taskElement.contentEditable = true;
            taskElement.classList.add('editing');
            taskElement.focus();
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(taskElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            const saveEdit = () => {
                const newText = taskElement.textContent.trim();
                
                if (!newText) {
                    taskElement.textContent = originalText;
                    this.showToast('Task cannot be empty!', 'error');
                } else if (newText.length > 100) {
                    taskElement.textContent = originalText;
                    this.showToast('Task is too long! Maximum 100 characters.', 'error');
                } else if (newText !== originalText) {
                    task.text = newText;
                    task.updatedAt = new Date().toISOString();
                    this.saveToStorage();
                    this.showToast('Task updated!', 'success');
                }
                
                taskElement.contentEditable = false;
                taskElement.classList.remove('editing');
                this.isEditing = null;
            };

            const cancelEdit = () => {
                taskElement.textContent = originalText;
                taskElement.contentEditable = false;
                taskElement.classList.remove('editing');
                this.isEditing = null;
            };

            taskElement.addEventListener('blur', saveEdit, { once: true });
            taskElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    taskElement.blur();
                }
            }, { once: true });
            
            taskElement.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                }
            }, { once: true });
        }
    }

    // Set current filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.render();
    }

    // Get filtered tasks
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }

    // Clear completed tasks
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showToast('No completed tasks to clear!', 'error');
            return;
        }

        // Add animation to completed tasks before removing
        const completedElements = document.querySelectorAll('.task-item.completed');
        completedElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('removing');
            }, index * 100);
        });

        setTimeout(() => {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveToStorage();
            this.render();
            this.updateStats();
            this.showToast(`${completedCount} completed task${completedCount > 1 ? 's' : ''} cleared!`, 'success');
        }, completedElements.length * 100 + 300);
    }

    // Create task element
    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskDiv.dataset.id = task.id;
        
        taskDiv.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="todoApp.toggleTask('${task.id}')">
                <i class="fas fa-check"></i>
            </div>
            <div class="task-text" onclick="todoApp.editTask('${task.id}')">${this.escapeHtml(task.text)}</div>
            <div class="task-actions">
                <button class="task-btn edit-btn" onclick="todoApp.editTask('${task.id}')" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" onclick="todoApp.deleteTask('${task.id}')" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return taskDiv;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render tasks
    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Clear current tasks
        this.tasksList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.emptyState.classList.add('show');
            this.tasksList.style.display = 'none';
        } else {
            this.emptyState.classList.remove('show');
            this.tasksList.style.display = 'flex';
            
            filteredTasks.forEach((task, index) => {
                const taskElement = this.createTaskElement(task);
                taskElement.style.animationDelay = `${index * 0.1}s`;
                this.tasksList.appendChild(taskElement);
            });
        }
        
        // Update clear button state
        const hasCompleted = this.tasks.some(t => t.completed);
        this.clearBtn.disabled = !hasCompleted;
    }

    // Update statistics
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        
        this.animateStatUpdate(this.totalTasksEl, total);
        this.animateStatUpdate(this.activeTasksEl, active);
        this.animateStatUpdate(this.completedTasksEl, completed);
    }

    // Animate stat number update
    animateStatUpdate(element, newValue) {
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue === newValue) return;
        
        element.style.transform = 'scale(1.2)';
        element.style.color = '#fff';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 150);
    }

    // Show toast notification
    showToast(message, type = 'success') {
        this.toastMessage.textContent = message;
        
        // Update toast style based on type
        if (type === 'error') {
            this.toast.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a6f)';
            this.toast.querySelector('i').className = 'fas fa-exclamation-circle';
        } else {
            this.toast.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            this.toast.querySelector('i').className = 'fas fa-check-circle';
        }
        
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    // Save to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            this.showToast('Failed to save tasks!', 'error');
        }
    }

    // Export tasks as JSON
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('Tasks exported successfully!', 'success');
    }

    // Import tasks from JSON
    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.saveToStorage();
                    this.render();
                    this.updateStats();
                    this.showToast(`${importedTasks.length} tasks imported!`, 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showToast('Failed to import tasks!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add task
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            todoApp.addTask();
        }
        
        // Escape to clear input
        if (e.key === 'Escape' && document.activeElement === todoApp.taskInput) {
            todoApp.taskInput.value = '';
            todoApp.taskInput.blur();
        }
    });
    
    // Add focus to input on load
    setTimeout(() => {
        todoApp.taskInput.focus();
    }, 500);
    
    // Service worker registration for future PWA features
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, but app still works
        });
    }
});

// Prevent form submission on enter
document.addEventListener('submit', (e) => {
    e.preventDefault();
});

// Add some fun Easter eggs
let clickCount = 0;
document.querySelector('.title').addEventListener('click', () => {
    clickCount++;
    if (clickCount === 5) {
        document.body.style.animation = 'backgroundShift 2s ease-in-out infinite alternate';
        setTimeout(() => {
            document.body.style.animation = 'backgroundShift 10s ease-in-out infinite alternate';
        }, 10000);
        clickCount = 0;
    }
});
