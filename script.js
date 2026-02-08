// Studio Ghosh website

let projectsData = [];
let currentSort = 'id';
let sortAscending = true;
let filters = {
    program: null,
    location: null
};
let expandedProjectId = null;

async function loadProjects() {
    const response = await fetch('toc.json');
    const data = await response.json();
    projectsData = data.projects;

    // Load project details to get image lists
    for (const project of projectsData) {
        try {
            const res = await fetch(project.directory + 'project.json');
            const projectData = await res.json();
            const dressed = projectData.images?.final_dressed || [];
            const blank = projectData.images?.final_blank || [];
            project.images = [...dressed, ...blank];
        } catch (e) {
            project.images = [];
        }
    }

    setupSortHeaders();
    setupFilterHeaders();
    renderProjects();
}

function setupSortHeaders() {
    const sortableColumns = ['id', 'name', 'year', 'area'];
    const header = document.querySelector('.grid-header');
    const columns = ['id', 'name', 'year', 'program', 'area', 'location', ''];

    header.querySelectorAll(':scope > span').forEach((span, index) => {
        const column = columns[index];

        if (sortableColumns.includes(column)) {
            span.classList.add('sortable');
            span.dataset.sort = column;
            span.addEventListener('click', () => {
                if (currentSort === column) {
                    sortAscending = !sortAscending;
                } else {
                    currentSort = column;
                    sortAscending = true;
                }
                renderProjects();
                updateSortIndicators();
            });
        }
    });

    updateSortIndicators();
}

function setupFilterHeaders() {
    const filterableColumns = ['program', 'location'];
    const header = document.querySelector('.grid-header');
    const columns = ['id', 'name', 'year', 'program', 'area', 'location', ''];

    header.querySelectorAll(':scope > span').forEach((span, index) => {
        const column = columns[index];

        if (filterableColumns.includes(column)) {
            span.classList.add('filterable');
            span.dataset.filter = column;

            span.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown(span, column);
            });
        }
    });

    document.addEventListener('click', () => {
        closeAllDropdowns();
    });
}

function getUniqueValues(column) {
    const values = new Set();
    projectsData.forEach(project => {
        if (project[column]) {
            values.add(project[column]);
        }
    });
    return Array.from(values).sort();
}

function toggleDropdown(span, column) {
    const existingDropdown = span.querySelector('.filter-dropdown');

    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }

    closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.className = 'filter-dropdown';

    const values = getUniqueValues(column);
    values.forEach(value => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        if (filters[column] === value) option.classList.add('active');
        option.textContent = value;
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            filters[column] = value;
            renderProjects();
            updateFilterIndicators();
            closeAllDropdowns();
        });
        dropdown.appendChild(option);
    });

    span.appendChild(dropdown);
}

function closeAllDropdowns() {
    document.querySelectorAll('.filter-dropdown').forEach(d => d.remove());
}

function updateFilterIndicators() {
    const header = document.querySelector('.grid-header');
    header.querySelectorAll(':scope > span').forEach(span => {
        const column = span.dataset.filter;
        if (!column) return;

        const existingClear = span.querySelector('.filter-clear');
        if (existingClear) existingClear.remove();

        if (filters[column]) {
            const clearBtn = document.createElement('span');
            clearBtn.className = 'filter-clear';
            clearBtn.textContent = ' \u00d7';
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                filters[column] = null;
                renderProjects();
                updateFilterIndicators();
            });
            span.appendChild(clearBtn);
        }
    });
}

function updateSortIndicators() {
    const header = document.querySelector('.grid-header');
    header.querySelectorAll(':scope > span').forEach(span => {
        const existingArrow = span.querySelector('.sort-arrow');
        if (existingArrow) existingArrow.remove();

        if (span.dataset.sort === currentSort) {
            const arrow = document.createElement('span');
            arrow.className = 'sort-arrow';
            arrow.textContent = sortAscending ? ' \u2193' : ' \u2191';
            span.appendChild(arrow);
        }
    });
}

function getFilteredProjects() {
    return projectsData.filter(project => {
        if (filters.program && project.program !== filters.program) return false;
        if (filters.location && project.location !== filters.location) return false;
        return true;
    });
}

function getSortedProjects() {
    const filtered = getFilteredProjects();

    return filtered.sort((a, b) => {
        let aVal, bVal;

        if (currentSort === 'year' || currentSort === 'area') {
            aVal = currentSort === 'year' ? (a.year || 0) : (a.area_sqm || 0);
            bVal = currentSort === 'year' ? (b.year || 0) : (b.area_sqm || 0);
            return sortAscending ? aVal - bVal : bVal - aVal;
        } else {
            aVal = (a[currentSort] || '').toString().toLowerCase();
            bVal = (b[currentSort] || '').toString().toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortAscending ? cmp : -cmp;
        }
    });
}

function renderProjects() {
    const body = document.getElementById('project-body');
    body.innerHTML = '';

    const sortedProjects = getSortedProjects();

    sortedProjects.forEach(project => {
        const row = document.createElement('div');
        row.className = 'grid-row';
        row.dataset.projectId = project.id;

        let thumbsHtml = '';
        if (project.images && project.images.length > 0) {
            project.images.forEach(img => {
                thumbsHtml += `<img src="${project.directory}${img}" alt="${project.name}" class="row-thumb">`;
            });
        } else {
            thumbsHtml = `<img src="${project.directory}thumb.jpg" alt="${project.name}" class="row-thumb" onerror="this.style.display='none'">`;
        }

        row.innerHTML = `
            <span class="col-id">${project.id}</span>
            <span class="col-name">${project.name}</span>
            <span class="col-year">${project.year || ''}</span>
            <span class="col-program">${project.program || ''}</span>
            <span class="col-area">${project.area_sqm ? project.area_sqm + ' sqm' : ''}</span>
            <span class="col-location">${project.location || ''}</span>
            <span class="col-thumb">${thumbsHtml}</span>
        `;

        row.addEventListener('click', () => toggleProjectDetail(project, row));
        body.appendChild(row);

        // Re-expand if this was the expanded project
        if (expandedProjectId === project.id) {
            row.classList.add('expanded');
            insertDetailRow(project, row);
        }
    });
}

function toggleProjectDetail(project, row) {
    // If clicking the same project, collapse it
    if (expandedProjectId === project.id) {
        collapseDetail();
        return;
    }

    // Collapse any existing expanded project, then expand new one
    const hadExpanded = document.querySelectorAll('.detail-row').length > 0;

    if (hadExpanded) {
        collapseDetail(() => {
            expandedProjectId = project.id;
            row.classList.add('expanded');
            insertDetailRow(project, row);
        });
    } else {
        expandedProjectId = project.id;
        row.classList.add('expanded');
        insertDetailRow(project, row);
    }
}

function collapseDetail(callback) {
    const detailRows = document.querySelectorAll('.detail-row');
    if (detailRows.length === 0) {
        expandedProjectId = null;
        if (callback) callback();
        return;
    }

    document.querySelectorAll('.grid-row.expanded').forEach(r => r.classList.remove('expanded'));

    detailRows.forEach(d => {
        d.classList.remove('open');
        d.addEventListener('transitionend', () => {
            d.remove();
            if (callback) callback();
        }, { once: true });
    });

    expandedProjectId = null;
}

async function insertDetailRow(project, afterRow) {
    const detailRow = document.createElement('div');
    detailRow.className = 'detail-row';

    // Load project data
    try {
        const response = await fetch(project.directory + 'project.json');
        const projectData = await response.json();

        const dressed = projectData.images?.final_dressed || [];
        const blank = projectData.images?.final_blank || [];
        const images = [...dressed, ...blank];

        // Team section (credits) under ID/name/year
        let teamHtml = '<div class="detail-team">';
        if (projectData.credits) {
            teamHtml += '<div class="detail-credits">';
            for (const [role, name] of Object.entries(projectData.credits)) {
                const names = name.split(',').map(n => n.trim()).join('<br>');
                teamHtml += `<p><span class="credit-role">${role}:</span><br>${names}</p>`;
            }
            teamHtml += '</div>';
        }
        teamHtml += '</div>';

        // Info section (description) under program/area/location
        let infoHtml = '<div class="detail-info">';
        if (projectData.description) {
            infoHtml += `<p class="detail-description">${projectData.description.replace(/\n/g, '<br><br>')}</p>`;
        }
        infoHtml += '</div>';

        // Images under thumbnail column
        let imageHtml = '<div class="detail-image">';
        if (images.length > 0) {
            if (images.length > 1) {
                imageHtml += `<span class="image-arrow image-prev">&larr;</span>`;
            }
            imageHtml += `<img src="${project.directory}${images[0]}" alt="${projectData.title}">`;
            if (images.length > 1) {
                imageHtml += `<span class="image-arrow image-next">&rarr;</span>`;
            }
        }
        imageHtml += '</div>';

        detailRow.innerHTML = teamHtml + infoHtml + imageHtml;

        // Set up image navigation and overlay
        const imgEl = detailRow.querySelector('.detail-image img');
        let currentIndex = 0;

        if (images.length > 1) {
            const prevBtn = detailRow.querySelector('.image-prev');
            const nextBtn = detailRow.querySelector('.image-next');

            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                imgEl.src = project.directory + images[currentIndex];
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex + 1) % images.length;
                imgEl.src = project.directory + images[currentIndex];
            });
        }

        // Click on image to open overlay
        if (images.length > 0) {
            imgEl.addEventListener('click', (e) => {
                e.stopPropagation();
                openImageOverlay(project.directory, images, currentIndex);
            });
        }

    } catch (error) {
        detailRow.innerHTML = '<div class="detail-team"></div><div class="detail-info"><p>Could not load project details.</p></div><div class="detail-image"></div>';
    }

    afterRow.insertAdjacentElement('afterend', detailRow);

    // Trigger animation after element is in DOM
    requestAnimationFrame(() => {
        detailRow.classList.add('open');
    });
}

function getShortFilename(path) {
    const parts = path.split('/');
    if (parts.length >= 2) {
        return parts.slice(-2).join('/');
    }
    return parts[parts.length - 1];
}

function openImageOverlay(directory, images, startIndex) {
    let currentIndex = startIndex;

    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';

    let navHtml = '';
    if (images.length > 1) {
        navHtml = `
            <div class="image-overlay-nav">
                <span class="overlay-arrow overlay-prev">&larr;</span>
                <span class="overlay-filename">${getShortFilename(images[currentIndex])}</span>
                <span class="overlay-arrow overlay-next">&rarr;</span>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="image-overlay-box">
            <img src="${directory}${images[currentIndex]}" alt="">
            ${navHtml}
        </div>
    `;

    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector('img');

    // Close on clicking outside the box
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    // Navigation
    if (images.length > 1) {
        const prevBtn = overlay.querySelector('.overlay-prev');
        const nextBtn = overlay.querySelector('.overlay-next');
        const filenameEl = overlay.querySelector('.overlay-filename');

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            overlayImg.src = directory + images[currentIndex];
            filenameEl.textContent = getShortFilename(images[currentIndex]);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % images.length;
            overlayImg.src = directory + images[currentIndex];
            filenameEl.textContent = getShortFilename(images[currentIndex]);
        });
    }
}

document.addEventListener('DOMContentLoaded', loadProjects);
