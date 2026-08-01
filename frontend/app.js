
const API_URL = "http://18.224.116.226:5000/api/tasks";

let tasks = [];
let searchTerm = "";
let statusFilterValue = "All";
let taskToDeleteId = null;
let taskToEditId = null;

// LOAD TASKS FROM THE BACKEND

async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        tasks = await response.json();
    } catch (error) {
        console.error("Failed to load tasks:", error);
        tasks = [];
    }

    renderTasks();
    updateStatistics();
}

// INITIALIZE APPLICATION

document.addEventListener("DOMContentLoaded", function () {
    bindEvents();
    loadTasks();

    const modalElement = document.getElementById("addTaskModal");
    modalElement?.addEventListener("hidden.bs.modal", resetTaskModal);
});

function bindEvents() {
    const saveTaskButton = document.getElementById("saveTaskBtn");
    saveTaskButton?.addEventListener("click", saveTask);

    const searchInput = document.getElementById("taskSearchInput");
    searchInput?.addEventListener("input", function (event) {
        searchTerm = event.target.value.trim().toLowerCase();
        renderTasks();
    });

    const statusFilter = document.getElementById("taskStatusFilter");
    statusFilter?.addEventListener("change", function (event) {
        statusFilterValue = event.target.value;
        renderTasks();
    });

    const confirmDeleteButton = document.getElementById("confirmDeleteBtn");
    confirmDeleteButton?.addEventListener("click", confirmDeleteTask);
}

function getFilteredTasks() {
    return tasks.filter(function (task) {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilterValue === "All" || task.status === statusFilterValue;
        return matchesSearch && matchesStatus;
    });
}

// RENDER TASKS

function renderTasks() {
    const taskTableBody = document.getElementById("taskTableBody");
    taskTableBody.innerHTML = "";

    const filteredTasks = getFilteredTasks();

    // EMPTY STATE

    if (filteredTasks.length === 0) {
        taskTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">✓</div>
                        <h4>No matching tasks</h4>
                        <p class="text-muted">Try a different title or status filter.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }


    // CREATE TASK ROWS
    filteredTasks.forEach(function (task) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-description text-muted">${escapeHtml(task.description || "No description")}</div>
            </td>
            <td>${getPriorityBadge(task.priority)}</td>
            <td>${getStatusBadge(task.status)}</td>
            <td>${formatDate(task.dueDate)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="editTask('${task._id}')">Edit</button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${task._id}')">Delete</button>
            </td>
        `;

        taskTableBody.appendChild(row);
    });
}


// PRIORITY BADGE
function getPriorityBadge(priority) {
    let badgeClass = "bg-secondary-subtle text-secondary-emphasis";

    if (priority === "High") {
        badgeClass = "bg-danger-subtle text-danger-emphasis";
    } else if (priority === "Medium") {
        badgeClass = "bg-warning-subtle text-warning-emphasis";
    } else if (priority === "Low") {
        badgeClass = "bg-success-subtle text-success-emphasis";
    }

    return `<span class="badge ${badgeClass}">${escapeHtml(priority)}</span>`;
}


// STATUS BADGE
function getStatusBadge(status) {
    let badgeClass = "bg-secondary-subtle text-secondary-emphasis";

    if (status === "Pending") {
        badgeClass = "bg-warning-subtle text-warning-emphasis";
    } else if (status === "In Progress") {
        badgeClass = "bg-info-subtle text-info-emphasis";
    } else if (status === "Completed") {
        badgeClass = "bg-success-subtle text-success-emphasis";
    }

    return `<span class="badge ${badgeClass}">${escapeHtml(status)}</span>`;
}


// SAVE TASK (CREATE OR UPDATE)
async function saveTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const priority = document.getElementById("taskPriority").value;
    const status = document.getElementById("taskStatus").value;
    const dueDate = document.getElementById("taskDueDate").value;

    if (title === "") {
        showToast("Please enter a task title.", "danger");
        return;
    }

    const taskData = {
        title: title,
        description: description,
        priority: priority,
        status: status,
        dueDate: dueDate
    };

    const isEditing = Boolean(taskToEditId);

    try {
        const url = isEditing ? API_URL + "/" + taskToEditId : API_URL;
        const method = isEditing ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            throw new Error("Request failed with status " + response.status);
        }
    } catch (error) {
        console.error("Failed to save task:", error);
        showToast("Could not save the task. Please try again.", "danger");
        return;
    }

    await loadTasks();

    document.getElementById("addTaskForm").reset();
    taskToEditId = null;

    const modalElement = document.getElementById("addTaskModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.hide();

    showToast(isEditing ? "Task updated successfully." : "Task created successfully.", "success");
}

function openDeleteModal(id) {
    taskToDeleteId = id;
    const modalElement = document.getElementById("deleteConfirmModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

async function confirmDeleteTask() {
    if (!taskToDeleteId) {
        return;
    }

    try {
        const response = await fetch(API_URL + "/" + taskToDeleteId, { method: "DELETE" });

        if (!response.ok) {
            throw new Error("Request failed with status " + response.status);
        }
    } catch (error) {
        console.error("Failed to delete task:", error);
        showToast("Could not delete the task. Please try again.", "danger");
        return;
    }

    taskToDeleteId = null;
    await loadTasks();

    const modalElement = document.getElementById("deleteConfirmModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.hide();

    showToast("Task deleted successfully.", "success");
}

// EDIT TASK
function editTask(id) {
    const task = tasks.find(function (task) {
        return task._id === id;
    });

    if (!task) {
        return;
    }

    taskToEditId = id;

    document.getElementById("taskTitle").value = task.title || "";
    document.getElementById("taskDescription").value = task.description || "";
    document.getElementById("taskPriority").value = task.priority || "Medium";
    document.getElementById("taskStatus").value = task.status || "Pending";
    document.getElementById("taskDueDate").value = task.dueDate || "";

    const modalTitle = document.querySelector("#addTaskModal .modal-title");
    if (modalTitle) {
        modalTitle.textContent = "Edit Task";
    }

    const saveButton = document.getElementById("saveTaskBtn");
    if (saveButton) {
        saveButton.textContent = "Save Changes";
    }

    const modalElement = document.getElementById("addTaskModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

// UPDATE DASHBOARD STATISTICS
function updateStatistics() {
    const total = tasks.length;

    const pending = tasks.filter(function (task) {
        return task.status === "Pending";
    }).length;

    const inProgress = tasks.filter(function (task) {
        return task.status === "In Progress";
    }).length;

    const completed = tasks.filter(function (task) {
        return task.status === "Completed";
    }).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("inProgressTasks").textContent = inProgress;
    document.getElementById("completedTasks").textContent = completed;
}


// FORMAT DATE
function formatDate(dateString) {
    if (!dateString) {
        return "No deadline";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

function showToast(message, type = "success") {
    const toastElement = document.getElementById("appToast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toastElement || !toastMessage) {
        return;
    }

    toastMessage.textContent = message;
    toastElement.className = `toast align-items-center text-bg-${type === "danger" ? "danger" : "success"} border-0`;

    const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
    toast.show();
}

function resetTaskModal() {
    document.getElementById("addTaskForm").reset();
    taskToEditId = null;

    const modalTitle = document.querySelector("#addTaskModal .modal-title");
    if (modalTitle) {
        modalTitle.textContent = "Add New Task";
    }

    const saveButton = document.getElementById("saveTaskBtn");
    if (saveButton) {
        saveButton.textContent = "Add Task";
    }
}
