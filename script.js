// Studio Ghosh website

let projectsData = [];
let currentSort = 'year';

async function loadProjects() {
    const response = await fetch('toc.json');
    const data = await response.json();
    projectsData = data.projects;

    renderProjects();
    setupSortOptions();
}

function renderProjects() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '';

    let sortedProjects;

    if (currentSort === 'year') {
        sortedProjects = [...projectsData].sort((a, b) => {
            if (a.year === 'unknown') return 1;
            if (b.year === 'unknown') return -1;
            return b.year - a.year;
        });
    } else {
        sortedProjects = [...projectsData].sort((a, b) => {
            const aVal = a[currentSort] || 'unknown';
            const bVal = b[currentSort] || 'unknown';
            if (aVal === 'unknown') return 1;
            if (bVal === 'unknown') return -1;
            return aVal.localeCompare(bVal);
        });
    }

    // Group projects by category (preserve sort order)
    const groupOrder = [];
    const groups = {};
    sortedProjects.forEach(project => {
        const groupValue = project[currentSort] || 'unknown';
        if (!groups[groupValue]) {
            groups[groupValue] = [];
            groupOrder.push(groupValue);
        }
        groups[groupValue].push(project);
    });

    // Render each group
    groupOrder.forEach((groupValue, index) => {
        // Add separator between groups
        if (index > 0) {
            const separator = document.createElement('div');
            separator.className = 'category-separator';
            grid.appendChild(separator);
        }

        const categoryRow = document.createElement('div');
        categoryRow.className = 'category-row';

        // Category label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'category-label';

        const labelText = document.createElement('div');
        labelText.className = 'cell-label';
        labelText.textContent = groupValue;
        labelDiv.appendChild(labelText);

        categoryRow.appendChild(labelDiv);

        // Thumbnails container
        const thumbsContainer = document.createElement('div');
        thumbsContainer.className = 'category-thumbs';

        groups[groupValue].forEach(project => {
            const thumbPath = project.directory + 'thumb.jpg';

            const link = document.createElement('a');
            link.className = 'project-cell';
            link.href = '';

            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'project-thumb';

            const img = document.createElement('img');
            img.src = thumbPath;
            img.alt = project.name;
            img.onerror = function() {
                this.style.display = 'none';
                thumbDiv.classList.add('placeholder');
            };

            thumbDiv.appendChild(img);
            link.appendChild(thumbDiv);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'cell-label';
            nameDiv.textContent = project.name;
            link.appendChild(nameDiv);

            thumbsContainer.appendChild(link);
        });

        categoryRow.appendChild(thumbsContainer);
        grid.appendChild(categoryRow);
    });

    // Add final separator at the bottom
    const finalSeparator = document.createElement('div');
    finalSeparator.className = 'category-separator';
    grid.appendChild(finalSeparator);
}

function setupSortOptions() {
    const options = document.querySelectorAll('.sort-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            currentSort = option.dataset.sort;
            renderProjects();
        });
    });
}

document.addEventListener('DOMContentLoaded', loadProjects);
