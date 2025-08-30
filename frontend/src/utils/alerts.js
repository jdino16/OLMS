// Alert utility for showing localhost alerts
export const showAlert = {
  // Success alert
  success: (message, duration = 3000) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'localhost-alert success';
    alertDiv.innerHTML = `
      <div class="alert-content">
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after duration
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, duration);
  },

  // Error alert
  error: (message, duration = 5000) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'localhost-alert error';
    alertDiv.innerHTML = `
      <div class="alert-content">
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after duration
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, duration);
  },

  // Warning alert
  warning: (message, duration = 4000) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'localhost-alert warning';
    alertDiv.innerHTML = `
      <div class="alert-content">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after duration
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, duration);
  },

  // Info alert
  info: (message, duration = 4000) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'localhost-alert info';
    alertDiv.innerHTML = `
      <div class="alert-content">
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after duration
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, duration);
  }
};

// Global function for onclick handlers
window.showAlert = showAlert;
