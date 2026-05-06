/**
 * Client-side SPA Router (hash-based)
 */
const routes = {};
let currentPage = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigateTo(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return window.location.hash.slice(1) || '/';
}

export function initRouter() {
  async function handleRoute() {
    const path = getCurrentRoute();
    const container = document.getElementById('page-container');
    const handler = routes[path] || routes['/'];

    if (handler) {
      container.style.opacity = '0';
      container.style.transform = 'translateY(8px)';

      await new Promise(r => setTimeout(r, 150));

      if (currentPage && currentPage.destroy) {
        currentPage.destroy();
      }

      currentPage = await handler(container);

      requestAnimationFrame(() => {
        container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      });

      // Update sidebar active state
      document.querySelectorAll('.nav-item').forEach(item => {
        const itemPath = item.dataset.path;
        item.classList.toggle('active', itemPath === path);
      });
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
