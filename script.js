document.addEventListener('DOMContentLoaded', () => {
  const welcome = document.getElementById('welcome');
  const time = document.getElementById('time');
  const temperature = document.getElementById('temperature');
  const linksList = document.getElementById('links-list');
  const newLinkInput = document.getElementById('new-link');
  const addLinkButton = document.getElementById('add-link');
  const kanbanColumns = document.querySelectorAll('.kanban-column');

  const quickLinkData = {
    "Google": "https://www.google.com",
    "Facebook": "https://www.facebook.com",
    "Twitter": "https://www.twitter.com",
    "LinkedIn": "https://www.linkedin.com",
    "GitHub": "https://www.github.com",
    "Reddit": "https://www.reddit.com",
    "YouTube": "https://www.youtube.com"
  };
  
  // Function to load links from localStorage
  const loadLinks = () => {
      const links = JSON.parse(localStorage.getItem('links')) || [];
      links.forEach(link => addLinkToDOM(link.url, link.icon));
  };

  // Function to add a link to the DOM
  const addLinkToDOM = (url, icon) => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = icon;
      img.alt = 'Link Icon';
      li.appendChild(img);
      li.addEventListener('click', () => {
          window.open(url, '_blank');
      });
      linksList.appendChild(li);
  };

  // Load links when the page loads
  loadLinks();

  addLinkButton.addEventListener('click', () => {
      const url = prompt('Enter the URL of the new link:');
      if (url) {
          const icon = `https://www.google.com/s2/favicons?domain=${url}`;
          addLinkToDOM(url, icon);
          const links = JSON.parse(localStorage.getItem('links')) || [];
          links.push({ url, icon });
          localStorage.setItem('links', JSON.stringify(links));
      }
  });

  // Set welcome message
  welcome.textContent = 'Welcome, MOHAMMAD ABDUL QUADEER';

  // Update time
  function updateTime() {
    const now = new Date();
    time.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }
  setInterval(updateTime, 1000);
  updateTime();

  // Fetch and display temperature (dummy data for now)
  temperature.textContent = 'Temperature: 25°C';

  // Load quick links from storage
  chrome.storage.sync.get(['quickLinks'], (result) => {
    const links = result.quickLinks || [];
    links.forEach(link => addLinkToList(link));
  });

  // Add new link
  addLinkButton.addEventListener('click', () => {
    const linkName = newLinkInput.value;
    const linkUrl = quickLinkData[linkName] || linkName;
    if (linkUrl) {
      addLinkToList(linkUrl, linkName);
      saveLink(linkUrl);
      newLinkInput.value = '';
    }
  });

  function addLinkToList(linkUrl, linkName) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = linkUrl;
    a.textContent = linkName || linkUrl;
    a.target = '_blank'; // Open link in new tab

    const icon = document.createElement('img');
    icon.src = `https://www.google.com/s2/favicons?domain=${linkUrl}`;
    icon.alt = `${linkName || linkUrl} icon`;
    icon.style.marginRight = '8px';

    li.appendChild(icon);
    li.appendChild(a);
    linksList.appendChild(li);
  }

  function saveLink(linkUrl) {
    chrome.storage.sync.get(['quickLinks'], (result) => {
      const links = result.quickLinks || [];
      links.push(linkUrl);
      chrome.storage.sync.set({ quickLinks: links });
    });
  }

  // Kanban board functionality
  kanbanColumns.forEach(column => {
    const addTaskButton = column.querySelector('.add-task');
    const newTaskInput = column.querySelector('.new-task');
    const itemsContainer = column.querySelector('.kanban-items');
    const columnId = column.id;

    // Load tasks from storage
    loadTasks(columnId, itemsContainer);

    addTaskButton.addEventListener('click', () => {
      const task = newTaskInput.value;
      if (task) {
        addTaskToColumn(task, itemsContainer, columnId);
        saveTask(task, columnId);
        newTaskInput.value = '';
      }
    });
  });

  function loadTasks(columnId, container) {
    chrome.storage.sync.get([columnId], (result) => {
      const tasks = result[columnId] || [];
      tasks.forEach(task => addTaskToColumn(task, container, columnId));
    });
  }

  function addTaskToColumn(task, container, columnId) {
    const div = document.createElement('div');
    div.classList.add('kanban-item');

    const taskText = document.createElement('span');
    taskText.textContent = task;

    const optionsButton = document.createElement('button');
    optionsButton.textContent = '⋮';
    optionsButton.classList.add('options-button');

    const optionsMenu = createOptionsMenu(task, columnId, container, div);

    optionsButton.addEventListener('click', () => {
      optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
    });

    div.appendChild(taskText);
    div.appendChild(optionsButton);
    div.appendChild(optionsMenu);
    container.appendChild(div);
  }

  function createOptionsMenu(task, columnId, container, taskElement) {
    const optionsMenu = document.createElement('div');
    optionsMenu.classList.add('options-menu');
    optionsMenu.style.display = 'none';

    if (columnId !== 'done') {
      if (columnId !== 'in-progress') {
        const moveToInProgressButton = document.createElement('button');
        moveToInProgressButton.textContent = 'Move to In Progress';
        moveToInProgressButton.addEventListener('click', () => moveTask(task, columnId, 'in-progress'));
        optionsMenu.appendChild(moveToInProgressButton);
      }

      const moveToDoneButton = document.createElement('button');
      moveToDoneButton.textContent = 'Move to Done';
      moveToDoneButton.addEventListener('click', () => moveTask(task, columnId, 'done'));
      optionsMenu.appendChild(moveToDoneButton);
    }

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      removeTask(task, columnId);
      container.removeChild(taskElement);
    });
    optionsMenu.appendChild(deleteButton);

    return optionsMenu;
  }

  function saveTask(task, columnId) {
    chrome.storage.sync.get([columnId], (result) => {
      const tasks = result[columnId] || [];
      tasks.push(task);
      chrome.storage.sync.set({ [columnId]: tasks });
    });
  }

  function moveTask(task, sourceColumnId, targetColumnId) {
    removeTask(task, sourceColumnId);
    saveTask(task, targetColumnId);

    const sourceContainer = document.querySelector(`#${sourceColumnId} .kanban-items`);
    const targetContainer = document.querySelector(`#${targetColumnId} .kanban-items`);

    const taskElement = Array.from(sourceContainer.children).find(child => child.querySelector('span').textContent === task);
    if (taskElement) {
      sourceContainer.removeChild(taskElement);
      addTaskToColumn(task, targetContainer, targetColumnId);
    }
  }

  function removeTask(task, columnId) {
    chrome.storage.sync.get([columnId], (result) => {
      let tasks = result[columnId] || [];
      tasks = tasks.filter(t => t !== task);
      chrome.storage.sync.set({ [columnId]: tasks });
    });
  }

  // Initialize Tui Calendar
  const calendarEl = document.getElementById('tui-calendar');
  if (calendarEl) {
      const calendar = new tui.Calendar(calendarEl, {
          defaultView: 'month',
          taskView: true,
          scheduleView: true,
          useCreationPopup: true,
          useDetailPopup: true,
          calendars: [
              {
                  id: '1',
                  name: 'My Calendar',
                  color: '#ffffff',
                  bgColor: '#9e5fff',
                  dragBgColor: '#9e5fff',
                  borderColor: '#9e5fff'
              }
          ]
      });

      calendar.createSchedules([
          {
              id: '1',
              calendarId: '1',
              title: 'Event 1',
              category: 'time',
              dueDateClass: '',
              start: '2023-10-01T10:00:00',
              end: '2023-10-01T12:00:00'
          },
          {
              id: '2',
              calendarId: '1',
              title: 'Event 2',
              category: 'time',
              dueDateClass: '',
              start: '2023-10-05T14:00:00',
              end: '2023-10-05T16:00:00'
          }
      ]);
  } else {
      console.error('Calendar element not found');
  }
});