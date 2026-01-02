// Navigation
function navigateTo(page) {
    window.location.href = `/${page}-page`;
}

function goBack() {
    window.location.href = '/';
}

// Set active nav link based on current page
function setActiveNavLink() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const page = link.getAttribute('data-page');
        if (path.includes(page)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    setupScrollNavHide();
});

// Hide/show navigation on scroll
function setupScrollNavHide() {
    const nav = document.querySelector('.top-nav');
    if (!nav) return;
    
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                
                // Hide when scrolling down, show when scrolling up
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling down
                    nav.classList.add('hidden-scroll');
                } else {
                    // Scrolling up
                    nav.classList.remove('hidden-scroll');
                }
                
                lastScrollY = currentScrollY;
                ticking = false;
            });
            
            ticking = true;
        }
    });
}

// Message display
function showMessage(message, type = 'success') {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${type} show`;
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 4000);
    }
}

// Button loading state
function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}
