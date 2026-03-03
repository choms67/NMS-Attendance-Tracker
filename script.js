let students = [];

document.addEventListener("DOMContentLoaded", () => {
    showDate();
});

function showDate() {
    const today = new Date();
    document.getElementById("currentDate").innerText =
        today.toLocaleDateString();
}

function goHome() {
    window.location.href = "/";
}

function openTab(tabName) {
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById(tabName).classList.add("active");

    event.target.classList.add("active");

    if (tabName === "dashboard") {
        updateDashboard();
    }
}

function addStudent() {
    const nameInput = document.getElementById("studentName");
    const section = document.getElementById("sectionSelect").value;
    const name = nameInput.value.trim();

    if (!name || !section) {
        alert("Please enter student name and select section.");
        return;
    }

    students.push({
        name: name,
        section: section,
        status: "Not Marked"
    });

    nameInput.value = "";
    displayStudents();
}

function displayStudents() {
    const table = document.getElementById("studentTable");
    table.innerHTML = "";

    students.forEach((student, index) => {
        const row = `
            <tr>
                <td>${student.name}</td>
                <td>${student.status}</td>
                <td>
                    <button class="present-btn" onclick="markAttendance(${index}, 'Present')">Present</button>
                    <button class="absent-btn" onclick="markAttendance(${index}, 'Absent')">Absent</button>
                    <button class="excuse-btn" onclick="markAttendance(${index}, 'Excused')">Excuse</button>
                    <button onclick="deleteStudent(${index})">Delete</button>
                </td>
            </tr>
        `;
        table.innerHTML += row;
    });
}
function markAttendance(index, status) {
    students[index].status = status;
    displayStudents();
}

function deleteStudent(index) {
    students.splice(index, 1);
    displayStudents();
}

function updateDashboard() {
    const dashboard = document.getElementById("dashboardGrid");

    let present = students.filter(s => s.status === "Present").length;
    let absent = students.filter(s => s.status === "Absent").length;
    let total = students.length;

    dashboard.innerHTML = `
        <div class="card">
            <h3>Total Students</h3>
            <p>${total}</p>
        </div>
        <div class="card">
            <h3>Present</h3>
            <p>${present}</p>
        </div>
        <div class="card">
            <h3>Absent</h3>
            <p>${absent}</p>
        </div>
    `;
}
