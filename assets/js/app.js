"use strict";
const html = document.documentElement;
const lightThemeBtn = document.querySelector(".set-light-theme-btn");
const darkThemeBtn = document.querySelector(".set-dark-theme-btn");
const addTodoForm = document.querySelector("form.add-todo");
const todoInput = document.querySelector(".todo-input");
const noTodosBlock = document.querySelector(".no-todos");
const noTodoDescText = document.querySelector(".no-todo-desc");
const todosList = document.querySelector(".todo-list");
const todosCountEl = document.querySelector(".todos-count");
const clearCompletedTodosBtn = document.querySelector(".clear-todos-btn");
const todosBottom = document.querySelector(".todos-bottom");
const footerEl = document.querySelector("footer");
document.addEventListener("DOMContentLoaded", () => {
    handleTheme();
});
window.onload = () => {
    loadStoredTodos();
    addTodoForm.addEventListener("submit", submitTodoInput);
    window.addEventListener("resize", handleWindowResize);
};
// Global Variables
let allTodosArray = [];
let displayedTodosArray = [];
let todoIds = {};
let activeTab = "all";
let currentScreenWidth = window.innerWidth;
// Handlers
function setTheme(theme) {
    localStorage.setItem("todo-theme", theme);
    if (theme === "light") {
        html.classList.remove("dark");
    }
    else {
        html.classList.add("dark");
    }
}
;
function handleTheme() {
    const storedTheme = localStorage.getItem("todo-theme");
    if (storedTheme === "light") {
        setTheme("light");
    }
    else if (storedTheme === "dark") {
        setTheme("dark");
    }
    else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme("dark");
        }
        else {
            setTheme("light");
        }
    }
}
;
function loadStoredTodos() {
    const storedTodos = localStorage.getItem("todos-list");
    const storedIds = localStorage.getItem("todo-ids");
    if (storedTodos && storedIds) {
        const parsedStr = JSON.parse(storedTodos);
        const parsedIds = JSON.parse(storedIds);
        const parsedStrIsTodoArray = Array.isArray(parsedStr) && parsedStr.every(item => isTodo(item));
        const parsedIdsIsValidRecord = isValidIdRecord(parsedIds);
        if (parsedStrIsTodoArray && parsedIdsIsValidRecord) {
            allTodosArray = parsedStr;
            displayedTodosArray = parsedStr;
            todoIds = parsedIds;
            displayTodos();
        }
    }
    handleItemCount();
}
;
function submitTodoInput(e) {
    e.preventDefault();
    const input = todoInput.value.trim();
    // Sanitization (innerText of html elements usually escapes dangerous characters)
    const element = document.createElement('div');
    element.innerText = input;
    const sanitizedTodo = element.innerHTML;
    if (sanitizedTodo) {
        const newTodo = {
            id: createId(),
            text: sanitizedTodo,
            isCompleted: false
        };
        allTodosArray.unshift(newTodo);
        updateStorage();
        displayTabSpecificTodos();
    }
    addTodoForm.reset();
}
;
function handleCheckboxChange(e) {
    const target = e.target;
    const todoId = target.dataset.id;
    const value = target.checked;
    allTodosArray.forEach(todo => {
        if (todo.id === todoId) {
            todo.isCompleted = value;
        }
    });
    updateStorage();
    displayTabSpecificTodos();
}
;
function deleteTodo(e) {
    const target = e.currentTarget;
    const todoId = target.dataset.id;
    if (todoId) {
        allTodosArray = allTodosArray.filter(todo => todo.id !== todoId);
        delete todoIds[todoId];
        updateStorage();
        displayTabSpecificTodos();
    }
}
;
function clearCompletedTodos() {
    allTodosArray = allTodosArray.filter(todo => {
        if (todo.isCompleted) {
            delete todoIds[todo.id];
        }
        return !todo.isCompleted;
    });
    updateStorage();
    displayTabSpecificTodos();
}
;
function handleWindowResize() {
    const screenWidth = window.innerWidth;
    currentScreenWidth = screenWidth;
    handleItemCount();
}
// Utilities
function isTodo(obj) {
    if (obj && typeof obj === "object"
        && "id" in obj && typeof obj.id === "string"
        && "text" in obj && typeof obj.text === "string"
        && "isCompleted" in obj && typeof obj.isCompleted === "boolean") {
        const allowedKeys = ["id", "text", "isCompleted"];
        return Object.keys(obj).every(key => allowedKeys.includes(key));
    }
    return false;
}
function isValidIdRecord(obj) {
    if (obj && typeof obj === "object") {
        return Object.entries(obj).every(item => typeof item[0] === "string" && typeof item[1] === "boolean");
    }
    return false;
}
function displayTodos() {
    console.log({ displayedTodosArray });
    const todoHTML = displayedTodosArray.reduce((acc, curr) => acc + createTodoDisplayFromTemplate(curr), "");
    todosList.innerHTML = todoHTML;
    handleItemCount();
}
;
function displayTabSpecificTodos() {
    switch (activeTab) {
        case "all":
            displayedTodosArray = allTodosArray;
            break;
        case "active":
            displayedTodosArray = allTodosArray.filter(item => !item.isCompleted);
            break;
        case "completed":
            displayedTodosArray = allTodosArray.filter(item => item.isCompleted);
            break;
        default:
            break;
    }
    displayTodos();
}
;
function createTodoDisplayFromTemplate({ id, text, isCompleted }) {
    return `
        <li id="${id}" class="todo-list-item" role="listitem">
            <input type="checkbox" data-id="${id}" name="" class="radio-circle checkbox focus-visible" onchange="handleCheckboxChange(event)" ${isCompleted ? "checked" : ""} />
            <p class="todo-text">${text}</p>
            <div class="cancel-btn-wrap">
                <button data-id="${id}" class="cancel-todo-btn clear-btn focus-visible" onclick="deleteTodo(event)">
                    <svg viewBox="0 0 18 18" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.6777 0.707107L16.9706 0L8.83883 8.13173L0.707107 0L0 0.707107L8.13173 8.83883L0 16.9706L0.707106 17.6777L8.83883 9.54594L16.9706 17.6777L17.6777 16.9706L9.54594 8.83883L17.6777 0.707107Z" fill="currentColor"/>
                        </g>
                    </svg>
                </button>
            </div>
        </li>
    `;
}
function createId() {
    // Create a string of 6 random numbers;
    let randomNum = String(Math.random()).slice(-4);
    // If that string exists in the global id store, create another... 
    // ...until you get one that is unique in the store
    while (todoIds[randomNum]) {
        randomNum = String(Math.random()).slice(-4);
    }
    // Set that id in the global id store as a property
    todoIds[randomNum] = true;
    return randomNum;
}
;
function handleItemCount() {
    const itemCount = displayedTodosArray.length;
    const LARGE_SCREEN_MIN_WIDTH = 768;
    todosCountEl.innerText = `${itemCount}`;
    if (itemCount > 0) {
        footerEl?.classList.remove("hidden");
        clearCompletedTodosBtn.classList.remove("hidden");
        noTodosBlock?.classList.add("hidden");
        todosBottom?.classList.remove("hidden");
    }
    else {
        footerEl?.classList.add("hidden");
        clearCompletedTodosBtn.classList.add("hidden");
        noTodosBlock?.classList.remove("hidden");
        if (currentScreenWidth < LARGE_SCREEN_MIN_WIDTH) {
            todosBottom?.classList.add("hidden");
        }
        else {
            todosBottom?.classList.remove("hidden");
        }
        if (activeTab === "completed") {
            noTodoDescText.classList.add("hidden");
        }
        else {
            noTodoDescText.classList.remove("hidden");
        }
    }
}
;
function changeTab(e) {
    const target = e.target;
    const tab = target.dataset.tab;
    const tabBtns = document.querySelectorAll(".tab-btn");
    const newActiveTabBtns = document.querySelectorAll(`[data-tab=${tab}]`);
    tabBtns.forEach(btn => {
        btn.classList.remove("active");
    });
    newActiveTabBtns.forEach(btn => {
        btn.classList.add("active");
    });
    if (tab && ["all", "active", "completed"].includes(tab)) {
        activeTab = tab;
        displayTabSpecificTodos();
    }
}
;
function updateStorage() {
    localStorage.setItem("todos-list", JSON.stringify(allTodosArray));
    localStorage.setItem("todo-ids", JSON.stringify(todoIds));
}
;
