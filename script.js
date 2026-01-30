// Page navigation system for Studio Ghosh website
// Pages ordered: TOC(0) -> Splash(1) -> Info(2) -> Gallery(3) -> Image(4)
// We see two adjacent pages at a time (viewPosition shows which pair)

// Site content
let toc = {};
let projects = {};

// State
let viewPosition = 0;  // 0=TOC+Splash, 1=Splash+Info, 2=Info+Gallery, 3=Gallery+Image
let currentProject = null;
let previewProject = null;  // Project being hovered in TOC
let selectedImage = null;
let allImages = [];  // Flat list of all images in current project
let currentImageIndex = 0;  // Index in allImages
let isAnimating = false;
const ANIMATION_DURATION = 600;
const defaultSplashPath = './img/splash.jpg';

// ============ Content Loading ============

async function loadContent() {
    try {
        const tocResponse = await fetch('./content/toc.json');
        toc = await tocResponse.json();

        for (const projectEntry of toc.projects) {
            const projectResponse = await fetch(`${projectEntry.directory}project.json`);
            const projectData = await projectResponse.json();
            projectData.basePath = projectEntry.directory;
            projectData.id = projectEntry.id;
            projects[projectEntry.id] = projectData;
        }

        initializeSite();
    } catch (error) {
        console.error('Failed to load content:', error);
    }
}

// ============ Panel Generators ============

function generateTOC() {
    let listHTML = '<ul class="toc-list">';
    toc.projects.forEach((project) => {
        listHTML += `
            <li class="toc-item">
                <a href="#" class="toc-link" data-project-id="${project.id}">
                    <span class="toc-id">${project.id}</span>
                    <span class="toc-name">${project.name}</span>
                </a>
            </li>
        `;
    });
    listHTML += '</ul>';
    return `<nav id="toc">${listHTML}</nav>`;
}

function generateSplash(splashPath) {
    return `
        <div class="splash-preview">
            <img src="${splashPath}" alt="Project preview">
        </div>
    `;
}

function generateInfo(project) {
    let creditsList = '';
    if (project.credits && typeof project.credits === 'object') {
        creditsList = Object.entries(project.credits)
            .filter(([key, value]) => value)
            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
            .join('');
    }

    return `
        <div class="project-info">
            <h2>${project.title}</h2>
            ${project.program ? `<p><strong>Program:</strong> ${project.program}</p>` : ''}
            ${project.address ? `<p><strong>Address:</strong> ${project.address}</p>` : ''}
            ${project.area ? `<p><strong>Area:</strong> ${project.area}</p>` : ''}
            ${project.year ? `<p><strong>Year:</strong> ${project.year}</p>` : ''}
            ${project.description ? `<p>${project.description}</p>` : ''}
            ${creditsList ? `<div class="credits">${creditsList}</div>` : ''}
        </div>
    `;
}

function generateGallery(project) {
    if (!project.images || typeof project.images !== 'object') {
        return '<div class="project-gallery"><p>No images available</p></div>';
    }

    let categoriesHTML = '';
    for (const [category, images] of Object.entries(project.images)) {
        if (!Array.isArray(images) || images.length === 0) continue;

        const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        let thumbnailsHTML = '';
        images.forEach((imagePath, index) => {
            const fullPath = project.basePath + imagePath.replace('./', '');
            thumbnailsHTML += `
                <div class="gallery-thumbnail" data-category="${category}" data-index="${index}" data-path="${fullPath}">
                    <img src="${fullPath}" alt="${categoryName} ${index + 1}">
                </div>
            `;
        });

        categoriesHTML += `
            <div class="gallery-category">
                <h3>${categoryName}</h3>
                <div class="gallery-grid">
                    ${thumbnailsHTML}
                </div>
            </div>
        `;
    }

    return `<div class="project-gallery">${categoriesHTML}</div>`;
}

function generateImage(imagePath, category, index) {
    return `
        <div class="project-image-view" data-category="${category}" data-index="${index}">
            <img src="${imagePath}" alt="Project image">
        </div>
    `;
}

// ============ Slide Animations ============

function slideLeft(newHTML, callback) {
    if (isAnimating) return;
    isAnimating = true;

    const container = document.querySelector('.container');
    const pages = container.querySelectorAll('.page');
    const leftPage = pages[0];
    const rightPage = pages[1];

    const newPage = document.createElement('div');
    newPage.className = 'page';
    newPage.innerHTML = newHTML;

    leftPage.style.cssText = 'position: absolute; left: 0; width: 50%;';
    rightPage.style.cssText = 'position: absolute; left: 50%; width: 50%;';
    newPage.style.cssText = 'position: absolute; left: 100%; width: 50%;';
    container.appendChild(newPage);

    newPage.offsetHeight; // Force reflow

    const transition = `left ${ANIMATION_DURATION}ms ease-in-out`;
    leftPage.style.transition = transition;
    rightPage.style.transition = transition;
    newPage.style.transition = transition;

    leftPage.style.left = '-50%';
    rightPage.style.left = '0';
    newPage.style.left = '50%';

    setTimeout(() => {
        leftPage.remove();
        rightPage.style.cssText = '';
        rightPage.className = 'page left-half';
        newPage.style.cssText = '';
        newPage.className = 'page right-half';
        viewPosition++;
        isAnimating = false;
        if (callback) callback();
    }, ANIMATION_DURATION);
}

function slideRight(newHTML, callback) {
    if (isAnimating) return;
    isAnimating = true;

    const container = document.querySelector('.container');
    const pages = container.querySelectorAll('.page');
    const leftPage = pages[0];
    const rightPage = pages[1];

    const newPage = document.createElement('div');
    newPage.className = 'page';
    newPage.innerHTML = newHTML;

    newPage.style.cssText = 'position: absolute; left: -50%; width: 50%;';
    leftPage.style.cssText = 'position: absolute; left: 0; width: 50%;';
    rightPage.style.cssText = 'position: absolute; left: 50%; width: 50%;';
    container.insertBefore(newPage, leftPage);

    newPage.offsetHeight; // Force reflow

    const transition = `left ${ANIMATION_DURATION}ms ease-in-out`;
    newPage.style.transition = transition;
    leftPage.style.transition = transition;
    rightPage.style.transition = transition;

    newPage.style.left = '0';
    leftPage.style.left = '50%';
    rightPage.style.left = '100%';

    setTimeout(() => {
        rightPage.remove();
        newPage.style.cssText = '';
        newPage.className = 'page left-half';
        leftPage.style.cssText = '';
        leftPage.className = 'page right-half';
        viewPosition--;
        isAnimating = false;
        if (callback) callback();
    }, ANIMATION_DURATION);
}

// ============ Navigation ============

function goForward() {
    if (isAnimating || viewPosition >= 3) return;

    let newContent;
    let callback = setupClickHandlers;

    switch (viewPosition) {
        case 0: // TOC+Splash -> Splash+Info
            newContent = generateInfo(currentProject);
            previewProject = null; // Clear so it doesn't interfere at position 1
            break;
        case 1: // Splash+Info -> Info+Gallery
            newContent = generateGallery(currentProject);
            buildImageList(); // Build flat image list for cycling
            break;
        case 2: // Info+Gallery -> Gallery+Image
            newContent = generateImage(selectedImage.path, selectedImage.category, selectedImage.index);
            // After sliding, update active thumbnail
            callback = () => {
                setupClickHandlers();
                updateActiveThumbnail();
            };
            break;
    }

    slideLeft(newContent, callback);
}

function goBack() {
    if (isAnimating || viewPosition <= 0) return;

    let newContent;
    switch (viewPosition) {
        case 1: // Splash+Info -> TOC+Splash
            newContent = generateTOC();
            currentProject = null;
            break;
        case 2: // Info+Gallery -> Splash+Info
            newContent = generateSplash(currentProject.basePath + 'img/splash.jpg');
            break;
        case 3: // Gallery+Image -> Info+Gallery
            newContent = generateInfo(currentProject);
            selectedImage = null;
            break;
    }

    slideRight(newContent, setupClickHandlers);
}

function goHome() {
    if (isAnimating || viewPosition === 0) return;

    isAnimating = true;

    const container = document.querySelector('.container');
    const pages = container.querySelectorAll('.page');
    const leftPage = pages[0];
    const rightPage = pages[1];

    // Create new TOC and Splash pages
    const tocPage = document.createElement('div');
    tocPage.className = 'page';
    tocPage.innerHTML = generateTOC();

    const splashPage = document.createElement('div');
    splashPage.className = 'page';
    splashPage.innerHTML = generateSplash(defaultSplashPath);

    // Position for animation - new pages start to the left
    tocPage.style.cssText = 'position: absolute; left: -100%; width: 50%;';
    splashPage.style.cssText = 'position: absolute; left: -50%; width: 50%;';
    leftPage.style.cssText = 'position: absolute; left: 0; width: 50%;';
    rightPage.style.cssText = 'position: absolute; left: 50%; width: 50%;';

    container.insertBefore(splashPage, leftPage);
    container.insertBefore(tocPage, splashPage);

    tocPage.offsetHeight; // Force reflow

    const transition = `left ${ANIMATION_DURATION}ms ease-in-out`;
    tocPage.style.transition = transition;
    splashPage.style.transition = transition;
    leftPage.style.transition = transition;
    rightPage.style.transition = transition;

    // Slide everything right
    tocPage.style.left = '0';
    splashPage.style.left = '50%';
    leftPage.style.left = '100%';
    rightPage.style.left = '150%';

    setTimeout(() => {
        leftPage.remove();
        rightPage.remove();
        tocPage.style.cssText = '';
        tocPage.className = 'page left-half';
        splashPage.style.cssText = '';
        splashPage.className = 'page right-half';

        // Reset state
        viewPosition = 0;
        currentProject = null;
        selectedImage = null;
        previewProject = null;
        allImages = [];
        currentImageIndex = 0;
        isAnimating = false;

        setupClickHandlers();
    }, ANIMATION_DURATION);
}

// ============ Click Handlers ============

// Use event delegation - one handler that checks position and what was clicked
function setupClickHandlers() {
    const container = document.querySelector('.container');

    // Remove old handler if exists
    if (container._clickHandler) {
        container.removeEventListener('click', container._clickHandler);
    }

    // Create new handler
    container._clickHandler = handleContainerClick;
    container.addEventListener('click', container._clickHandler);

    // Set up TOC hover handlers (only at position 0)
    if (viewPosition === 0) {
        setupTOCHoverHandlers();
    }

    // Set cursors
    updateCursors();
}

function handleContainerClick(e) {
    if (isAnimating) return;

    // Determine which panel was clicked
    const clickedPanel = e.target.closest('.page');
    if (!clickedPanel) return;

    const clickedLeft = clickedPanel.classList.contains('left-half');
    const clickedRight = clickedPanel.classList.contains('right-half');

    // Special case: TOC link at position 0
    const tocLink = e.target.closest('.toc-link');
    if (tocLink && viewPosition === 0) {
        e.preventDefault();
        currentProject = projects[tocLink.dataset.projectId];
        goForward();
        return;
    }

    // Special case: Splash on right at position 0 needs to set currentProject
    if (clickedRight && viewPosition === 0 && previewProject) {
        currentProject = projects[previewProject.id];
        goForward();
        return;
    }

    // Special case: Thumbnail selects an image
    const thumbnail = e.target.closest('.gallery-thumbnail');
    if (thumbnail) {
        const category = thumbnail.dataset.category;
        const index = parseInt(thumbnail.dataset.index);

        selectedImage = {
            path: thumbnail.dataset.path,
            category: category,
            index: index
        };
        currentImageIndex = findImageIndex(category, index);

        if (clickedRight && viewPosition === 2) {
            // Gallery on right: advance to image view
            goForward();
        } else if (clickedLeft && viewPosition === 3) {
            // Gallery on left: update displayed image and active thumbnail
            const img = document.querySelector('.project-image-view img');
            if (img) img.src = thumbnail.dataset.path;
            updateActiveThumbnail();
        }
        return;
    }

    // Special case: Image view at position 3 cycles through images
    if (e.target.closest('.project-image-view') && viewPosition === 3) {
        advanceImage();
        return;
    }

    // General rule: left = reverse, right = advance
    if (clickedLeft && viewPosition > 0) {
        goBack();
    } else if (clickedRight && viewPosition < 3) {
        goForward();
    }
}

function setupTOCHoverHandlers() {
    const links = document.querySelectorAll('.toc-link');
    links.forEach((link, index) => {
        const project = toc.projects[index];

        link.addEventListener('mouseenter', () => {
            previewProject = project;
            updateSplashPreview(project.directory);
            setActiveLink(link);
        });
    });
}

function updateCursors() {
    // Set pointer cursor on clickable panels
    const leftPanel = document.querySelector('.left-half');
    const rightPanel = document.querySelector('.right-half');

    if (leftPanel) {
        leftPanel.style.cursor = viewPosition > 0 ? 'pointer' : 'default';
    }
    if (rightPanel) {
        rightPanel.style.cursor = 'pointer';
    }
}

// ============ Helpers ============

function updateSplashPreview(projectDirectory) {
    const rightPage = document.querySelector('.right-half');
    if (!rightPage || viewPosition !== 0) return;

    const splashPath = `${projectDirectory}img/splash.jpg`;
    rightPage.innerHTML = generateSplash(splashPath);
}

function setActiveLink(activeLink) {
    const allLinks = document.querySelectorAll('.toc-link');
    allLinks.forEach(link => {
        link.classList.toggle('dimmed', link !== activeLink);
    });
}

// Build flat list of all images from current project
function buildImageList() {
    allImages = [];
    if (!currentProject || !currentProject.images) return;

    for (const [category, images] of Object.entries(currentProject.images)) {
        if (!Array.isArray(images)) continue;
        images.forEach((imagePath, index) => {
            const fullPath = currentProject.basePath + imagePath.replace('./', '');
            allImages.push({
                path: fullPath,
                category: category,
                index: index
            });
        });
    }
}

// Find index in allImages for a given category and index
function findImageIndex(category, index) {
    return allImages.findIndex(img => img.category === category && img.index === index);
}

function advanceImage() {
    if (!currentProject || allImages.length === 0) return;

    // Move to next image in the full gallery
    currentImageIndex = (currentImageIndex + 1) % allImages.length;
    const nextImage = allImages[currentImageIndex];

    selectedImage = {
        path: nextImage.path,
        category: nextImage.category,
        index: nextImage.index
    };

    // Update the displayed image
    const imageView = document.querySelector('.project-image-view');
    if (imageView) {
        imageView.dataset.category = nextImage.category;
        imageView.dataset.index = nextImage.index;
        const img = imageView.querySelector('img');
        if (img) img.src = nextImage.path;
    }

    // Update active thumbnail and scroll into view
    updateActiveThumbnail();
}

function updateActiveThumbnail() {
    // Remove active class from all thumbnails
    document.querySelectorAll('.gallery-thumbnail.active').forEach(t => {
        t.classList.remove('active');
    });

    // Find and activate the current thumbnail
    const thumbnail = document.querySelector(
        `.gallery-thumbnail[data-category="${selectedImage.category}"][data-index="${selectedImage.index}"]`
    );

    if (thumbnail) {
        thumbnail.classList.add('active');
        // Scroll thumbnail into view
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ============ Initialize ============

function initializeSite() {
    const leftPage = document.querySelector('.left-half');
    const rightPage = document.querySelector('.right-half');

    leftPage.innerHTML = generateTOC();
    rightPage.innerHTML = generateSplash(defaultSplashPath);

    // Logo click returns to home
    const logo = document.querySelector('#logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', goHome);
    }

    setupClickHandlers();
}

loadContent();
