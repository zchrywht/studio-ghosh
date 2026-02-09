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
    const response = await fetch('../toc.json');
    const data = await response.json();
    projectsData = data.projects.map(p => ({ ...p, directory: '../' + p.directory }));

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
    const columns = ['id', '', 'name', 'year', 'program', 'location', 'area'];

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
    const columns = ['id', '', 'name', 'year', 'program', 'location', 'area'];

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
            if (span.dataset.sort === 'year' || span.dataset.sort === 'area') {
                arrow.textContent = sortAscending ? '\u2193 ' : '\u2191 ';
                span.prepend(arrow);
            } else {
                arrow.textContent = sortAscending ? ' \u2193' : ' \u2191';
                span.appendChild(arrow);
            }
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

        row.innerHTML = `
            <span class="col-id">${project.id}</span>
            <span class="col-thumb"><img src="${project.directory}thumb.jpg" alt="${project.name}" class="row-thumb" onerror="this.style.display='none'"></span>
            <span class="col-name">${project.name}</span>
            <span class="col-year">${project.year || ''}</span>
            <span class="col-program">${project.program || ''}</span>
            <span class="col-location">${project.location || ''}</span>
            <span class="col-area">${project.area_sqm ? project.area_sqm + ' sqm' : ''}</span>
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
    document.documentElement.classList.remove('inverted');

    detailRows.forEach(d => {
        d.style.height = '0';
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

        // Image grid under thumb/name/year columns
        const folders = {};
        const folderNames = [];
        if (projectData.images) {
            for (const [key, files] of Object.entries(projectData.images)) {
                if (key === 'in_process' || key === 'drawings') continue;
                if (Array.isArray(files) && files.length > 0) {
                    folders[key] = files;
                    folderNames.push(key);
                }
            }
        }

        const pageSize = 9;
        let currentPage = 0;
        let activeFolder = folderNames[0] || null;

        let imagesHtml = '<div class="detail-images-container">';
        imagesHtml += '<div class="detail-images"></div>';
        imagesHtml += '<div class="image-nav">';
        imagesHtml += '<span class="image-arrow image-prev">&larr;</span>';
        folderNames.forEach(name => {
            imagesHtml += `<span class="folder-link" data-folder="${name}">${name}</span>`;
        });
        imagesHtml += '<span class="image-arrow image-next">&rarr;</span>';
        imagesHtml += '</div>';
        imagesHtml += '</div>';

        // Combined info section: team credits then description
        let infoHtml = '<div class="detail-info">';
        if (projectData.credits) {
            infoHtml += '<div class="detail-credits">';
            for (const [role, name] of Object.entries(projectData.credits)) {
                const names = name.split(',').map(n => n.trim()).join('<br>');
                infoHtml += `<p><span class="credit-role">${role}:</span><br>${names}</p>`;
            }
            infoHtml += '</div>';
        }
        if (projectData.description) {
            infoHtml += `<p class="detail-description">${projectData.description.replace(/\n/g, '<br><br>')}</p>`;
        }
        infoHtml += '<span class="wip-link">WIP</span>';
        infoHtml += '</div>';

        detailRow.innerHTML = imagesHtml + infoHtml;

        const grid = detailRow.querySelector('.detail-images');

        function updateFolderLinks() {
            detailRow.querySelectorAll('.folder-link').forEach(link => {
                link.classList.toggle('active', link.dataset.folder === activeFolder);
            });
        }

        function getActiveImages() {
            return activeFolder ? (folders[activeFolder] || []) : [];
        }

        function getTotalPages() {
            return Math.max(1, Math.ceil(getActiveImages().length / pageSize));
        }

        function renderImages() {
            const images = getActiveImages();
            const start = currentPage * pageSize;
            const pageImages = images.slice(start, start + pageSize);
            let html = pageImages.map(img =>
                `<img src="${project.directory}${img}" alt="${project.name}">`
            ).join('');
            for (let i = pageImages.length; i < pageSize; i++) {
                html += '<span class="image-placeholder"></span>';
            }
            grid.innerHTML = html;
            grid.querySelectorAll('img').forEach((imgEl, i) => {
                imgEl.style.cursor = 'pointer';
                imgEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openImageOverlay(project.directory, images, start + i);
                });
            });
            updateFolderLinks();
            // Re-measure height after images change
            requestAnimationFrame(() => {
                detailRow.style.height = detailRow.scrollHeight + 'px';
            });
        }

        renderImages();

        detailRow.querySelector('.image-prev').addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentPage > 0) {
                currentPage--;
            } else {
                const folderIndex = folderNames.indexOf(activeFolder);
                if (folderIndex > 0) {
                    activeFolder = folderNames[folderIndex - 1];
                    currentPage = getTotalPages() - 1;
                }
            }
            renderImages();
        });
        detailRow.querySelector('.image-next').addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentPage < getTotalPages() - 1) {
                currentPage++;
            } else {
                const folderIndex = folderNames.indexOf(activeFolder);
                if (folderIndex < folderNames.length - 1) {
                    activeFolder = folderNames[folderIndex + 1];
                } else {
                    activeFolder = folderNames[0];
                }
                currentPage = 0;
            }
            renderImages();
        });

        detailRow.querySelectorAll('.folder-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                activeFolder = link.dataset.folder;
                currentPage = 0;
                renderImages();
            });
        });

        detailRow.querySelector('.wip-link').addEventListener('click', (e) => {
            e.stopPropagation();
            document.documentElement.classList.toggle('inverted');
        });

    } catch (error) {
        detailRow.innerHTML = '<div class="detail-info"><p>Could not load project details.</p></div>';
    }

    afterRow.insertAdjacentElement('afterend', detailRow);

    // Measure content height and animate
    requestAnimationFrame(() => {
        detailRow.style.height = detailRow.scrollHeight + 'px';
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
