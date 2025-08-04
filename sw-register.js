if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification(newWorker);
                        }
                    });
                });
            })
            .catch(function(error) {
            });
        
        navigator.serviceWorker.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'SW_UPDATED') {
                showUpdateNotification();
            }
        });
    });
}

function showUpdateNotification(newWorker) {
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 text-center z-[9999] shadow-lg';
    banner.innerHTML = `
        <div class="flex items-center justify-center gap-3">
            <span class="text-sm font-medium">🚀 Nova versão disponível!</span>
            <button id="update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50">
                Atualizar
            </button>
            <button id="dismiss-btn" class="text-blue-200 hover:text-white ml-2">
                ✕
            </button>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    document.getElementById('update-btn').addEventListener('click', function() {
        if (newWorker) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    });
    
    document.getElementById('dismiss-btn').addEventListener('click', function() {
        banner.remove();
    });
    
    setTimeout(() => {
        if (document.getElementById('update-banner')) {
            banner.remove();
        }
    }, 10000);
}
