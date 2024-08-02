const html = document.documentElement as HTMLHtmlElement;
const lightThemeBtn = document.querySelector(".set-light-theme-btn") as HTMLButtonElement;
const darkThemeBtn = document.querySelector(".set-dark-theme-btn") as HTMLButtonElement;
const addTodoForm = document.querySelector("form.add-todo") as HTMLFormElement;
const todoInput = document.querySelector(".todo-input") as HTMLInputElement;
const noTodosBlock = document.querySelector(".no-todos");
const noTodoDescText = document.querySelector(".no-todo-desc") as HTMLParagraphElement;
const todosList = document.querySelector(".todo-list") as HTMLUListElement;
const todosCountEl = document.querySelector(".todos-count") as HTMLSpanElement;
const clearCompletedTodosBtn = document.querySelector(".clear-todos-btn") as HTMLButtonElement;
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


// TYPES
type Todo = {
    id: string;
    text: string;
    isCompleted: boolean;
}
type ActiveTab = "all" | "active" | "completed";
type TodoIdsRecord = Record<string, boolean>;


// Global Variables
let allTodosArray: Todo[] = [];
let displayedTodosArray: Todo[] = [];
let todoIds: TodoIdsRecord = {};
let activeTab: ActiveTab = "all";
let currentScreenWidth = window.innerWidth;


// Handlers
function setTheme(theme: "light" | "dark") {
    localStorage.setItem("todo-theme", theme);

    if (theme === "light") {
        html.classList.remove("dark");
    } else {
        html.classList.add("dark");
    }
};

function handleTheme() {
    const storedTheme = localStorage.getItem("todo-theme");

    if (storedTheme === "light") {
        setTheme("light");
    } else if (storedTheme === "dark") {
        setTheme("dark");
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    }
};

function loadStoredTodos() {
    const storedTodos = localStorage.getItem("todos-list");
    const storedIds = localStorage.getItem("todo-ids");

    if (storedTodos && storedIds) {
        const parsedStr = JSON.parse(storedTodos) as unknown;
        const parsedIds = JSON.parse(storedIds) as unknown;

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
};

function submitTodoInput(e: SubmitEvent) {
    e.preventDefault();

    const input = todoInput.value.trim();

    // Sanitization (innerText of html elements usually escapes dangerous characters)
    const element = document.createElement('div');
    element.innerText = input;

    const sanitizedTodo = element.innerHTML;

    if (sanitizedTodo) {
        const newTodo: Todo = {
            id: createId(),
            text: sanitizedTodo,
            isCompleted: false
        };

        allTodosArray.unshift(newTodo);
        
        updateStorage();
        displayTabSpecificTodos();
    }

    addTodoForm.reset();
};

function handleCheckboxChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const todoId = target.dataset.id;
    const value = target.checked;

    allTodosArray.forEach(todo => {
        if (todo.id === todoId) {
            todo.isCompleted = value;
        }
    });

    updateStorage();
    displayTabSpecificTodos();
};

function deleteTodo(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    const todoId = target.dataset.id;

    if (todoId) {
        allTodosArray = allTodosArray.filter(todo => todo.id !== todoId);
        delete todoIds[todoId];
    
        updateStorage();
        displayTabSpecificTodos();
    }
};

function clearCompletedTodos() {
    allTodosArray = allTodosArray.filter(todo => {
        if (todo.isCompleted) {
            delete todoIds[todo.id];
        }

        return !todo.isCompleted;
    });

    updateStorage();
    displayTabSpecificTodos();
};

function handleWindowResize() {
    const screenWidth = window.innerWidth;
    currentScreenWidth = screenWidth;
    handleItemCount();
}


// Utilities

function isTodo(obj: unknown): obj is Todo {
    if (
        obj && typeof obj === "object"
        && "id" in obj && typeof (obj as any).id === "string"
        && "text" in obj && typeof (obj as any).text === "string"
        && "isCompleted" in obj && typeof (obj as any).isCompleted === "boolean"
    ) {
        const allowedKeys = ["id", "text", "isCompleted"];
        return Object.keys(obj).every(key => allowedKeys.includes(key));
    }
    return false;
}

function isValidIdRecord(obj: unknown): obj is TodoIdsRecord {
    if (obj && typeof obj === "object") {
        return Object.entries(obj).every(item => typeof item[0] === "string" && typeof item[1] === "boolean");
    }
    return false;
}

function displayTodos() {
    console.log({displayedTodosArray});
    const todoHTML = displayedTodosArray.reduce((acc, curr) => acc + createTodoDisplayFromTemplate(curr), "");

    todosList.innerHTML = todoHTML;
    handleItemCount();
};

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
};

function createTodoDisplayFromTemplate({id, text, isCompleted}: Todo) {
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
    while(todoIds[randomNum]) {
        randomNum = String(Math.random()).slice(-4);
    }

    // Set that id in the global id store as a property
    todoIds[randomNum] = true;

    return randomNum;
};

function handleItemCount() {
    const itemCount = displayedTodosArray.length;
    const LARGE_SCREEN_MIN_WIDTH = 768;

    todosCountEl.innerText = `${itemCount}`;

    if (itemCount > 0) {
        footerEl?.classList.remove("hidden");
        clearCompletedTodosBtn.classList.remove("hidden");
        noTodosBlock?.classList.add("hidden");
        todosBottom?.classList.remove("hidden");
    } else {
        footerEl?.classList.add("hidden");
        clearCompletedTodosBtn.classList.add("hidden");
        noTodosBlock?.classList.remove("hidden");

        if (currentScreenWidth < LARGE_SCREEN_MIN_WIDTH) {
            todosBottom?.classList.add("hidden");
        } else {
            todosBottom?.classList.remove("hidden");
        }

        if (activeTab === "completed") {
            noTodoDescText.classList.add("hidden");
        } else {
            noTodoDescText.classList.remove("hidden");
        }
    }
};

function changeTab(e: MouseEvent) {
    const target = e.target as HTMLButtonElement;
    const tab = target.dataset.tab;
    const tabBtns = document.querySelectorAll(".tab-btn")!;

    const newActiveTabBtns = document.querySelectorAll(`[data-tab=${tab}]`);

    tabBtns.forEach(btn => {
        btn.classList.remove("active");
    });
    newActiveTabBtns.forEach(btn => {
        btn.classList.add("active");
    });

    if (tab && ["all", "active", "completed"].includes(tab)) {
        activeTab = tab as ActiveTab;
    
        displayTabSpecificTodos();
    }
};

function updateStorage() {
    localStorage.setItem("todos-list", JSON.stringify(allTodosArray));
    localStorage.setItem("todo-ids", JSON.stringify(todoIds));
};
