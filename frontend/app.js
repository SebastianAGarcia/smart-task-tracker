
const API_URL = "http://18.224.116.226:5000/api/tasks";

let tasks = [];

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
    loadTasks();

    const saveTaskButton = document.getElementById("saveTaskBtn");
    saveTaskButton.addEventListener("click", addTask);
});


// RENDER TASKS

function renderTasks() {
    const taskTableBody = document.getElementById("taskTableBody");
    taskTableBody.innerHTML = "";

    // EMPTY STATE

    if (tasks.length === 0) {
        taskTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">✓</div>
                        <h4>No Tasks Yet</h4>
                        <p class="text-muted">Create your first task to get started.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }


    // CREATE TASK ROWS
    tasks.forEach(function (task) {
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
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task._id}')">Delete</button>
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


// ADD TASK
async function addTask() {

    // Get form values
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const priority = document.getElementById("taskPriority").value;
    const status = document.getElementById("taskStatus").value;
    const dueDate = document.getElementById("taskDueDate").value;

    // Validate task title
    if (title === "") {
        alert("Please enter a task title.");
        return;
    }

    // Create new task
    const newTask = {
        title: title,
        description: description,
        priority: priority,
        status: status,
        dueDate: dueDate
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask)
        });

        if (!response.ok) {
            throw new Error("Request failed with status " + response.status);
        }
    } catch (error) {
        console.error("Failed to create task:", error);
        alert("Could not save the task. Please try again.");
        return;
    }

    // Refresh from the backend and update statistics
    await loadTasks();

    // Reset form
    document.getElementById("addTaskForm").reset();

    // Close modal
    const modalElement = document.getElementById("addTaskModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.hide();
}

// DELETE TASK
async function deleteTask(id) {
    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(API_URL + "/" + id, { method: "DELETE" });

        if (!response.ok) {
            throw new Error("Request failed with status " + response.status);
        }
    } catch (error) {
        console.error("Failed to delete task:", error);
        alert("Could not delete the task. Please try again.");
        return;
    }

    await loadTasks();
}

// EDIT TASK
function editTask(id) {
    const task = tasks.find(function (task) {
        return task._id === id;
    });

    if (!task) {
        return;
    }

    alert("Edit functionality will be added next.");
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