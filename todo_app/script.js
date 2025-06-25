document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');

    // Load todos from local storage
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };

    const renderTodos = () => {
        todoList.innerHTML = '';
        todos.forEach((todo, index) => {
            const listItem = document.createElement('li');
            listItem.className = todo.completed ? 'completed' : '';
            listItem.innerHTML = `
                <span class="todo-text">${todo.text}</span>
                <button class="delete-button" data-index="${index}">Delete</button>
            `;

            const todoTextSpan = listItem.querySelector('.todo-text');
            todoTextSpan.addEventListener('click', () => {
                todos[index].completed = !todos[index].completed;
                saveTodos();
                renderTodos();
            });

            const deleteButton = listItem.querySelector('.delete-button');
            deleteButton.addEventListener('click', (e) => {
                const itemIndex = parseInt(e.target.dataset.index);
                todos.splice(itemIndex, 1);
                saveTodos();
                renderTodos();
            });

            todoList.appendChild(listItem);
        });
    };

    addButton.addEventListener('click', () => {
        const todoText = todoInput.value.trim();
        if (todoText !== '') {
            todos.push({ text: todoText, completed: false });
            saveTodos();
            todoInput.value = '';
            renderTodos();
        }
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addButton.click();
        }
    });

    renderTodos(); // Initial render
});