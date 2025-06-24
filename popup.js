// AI Study Assistant - Popup Script
console.log('🚀 AI Study Assistant popup loaded');

// DOM elements
let statusText, videoInfo, openChatBtn;
let isExtensionActive = false;
let currentTab = null;

// Initialize popup when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 Initializing popup interface...');
    
    // Get DOM elements
    statusText = document.getElementById('status-text');
    videoInfo = document.getElementById('video-info');
    openChatBtn = document.getElementById('openChat');
    
    // Setup event listeners
    setupEventListeners();
    
    // Check current tab and extension status
    await checkExtensionStatus();
    
    console.log('✅ Popup initialization complete');
});

// Setup all event listeners
function setupEventListeners() {
    // Start Learning Session button
    if (openChatBtn) {
        openChatBtn.addEventListener('click', handleStartLearningSession);
    }
    
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            checkExtensionStatus();
        }
    });
    
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleContentScriptMessage(message, sender, sendResponse);
    });
}

// Check if extension is active on current tab
async function checkExtensionStatus() {
    try {
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tab;
        
        if (!tab) {
            updateStatus('error', 'Unable to detect current tab');
            return;
        }
        
        // Check if we're on YouTube
        if (tab.url && tab.url.includes('youtube.com/watch')) {
            // Try to communicate with content script
            chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
                if (chrome.runtime.lastError) {
                    updateStatus('inactive', 'Extension not loaded on this page');
                    updateVideoInfo('Refresh the page to activate extension');
                } else if (response && response.status === 'active') {
                    updateStatus('active', 'Ready to help!');
                    updateVideoInfo(response.videoData || 'Video detected - ready to chat!');
                    isExtensionActive = true;
                } else {
                    updateStatus('loading', 'Loading extension...');
                    updateVideoInfo('Preparing AI assistant...');
                }
            });
        } else if (tab.url && tab.url.includes('youtube.com')) {
            updateStatus('standby', 'Open a video to start');
            updateVideoInfo('Navigate to a YouTube video to begin learning');
        } else {
            updateStatus('inactive', 'Not on YouTube');
            updateVideoInfo('Visit YouTube to use AI Study Assistant');
        }
        
    } catch (error) {
        console.error('❌ Error checking extension status:', error);
        updateStatus('error', 'Status check failed');
    }
}

// Update status display
function updateStatus(status, message) {
    if (!statusText) return;
    
    statusText.textContent = message;
    
    // Update status dot color based on status
    const statusDot = document.querySelector('.status-dot');
    if (statusDot) {
        statusDot.className = 'status-dot'; // Reset classes
        
        switch (status) {
            case 'active':
                statusDot.style.background = '#4ade80'; // Green
                statusDot.style.animation = 'pulse 2s infinite';
                break;
            case 'loading':
                statusDot.style.background = '#fbbf24'; // Yellow
                statusDot.style.animation = 'pulse 1s infinite';
                break;
            case 'standby':
                statusDot.style.background = '#60a5fa'; // Blue
                statusDot.style.animation = 'pulse 3s infinite';
                break;
            case 'inactive':
                statusDot.style.background = '#9ca3af'; // Gray
                statusDot.style.animation = 'none';
                break;
            case 'error':
                statusDot.style.background = '#ef4444'; // Red
                statusDot.style.animation = 'pulse 0.5s infinite';
                break;
        }
    }
}

// Update video information display
function updateVideoInfo(info) {
    if (!videoInfo) return;
    
    if (typeof info === 'string') {
        videoInfo.innerHTML = `<small>${info}</small>`;
    } else if (info && typeof info === 'object' && info.title) {
        videoInfo.innerHTML = `
            <small><strong>Video:</strong> ${info.title.substring(0, 40)}...</small><br>
            <small><strong>Channel:</strong> ${info.channel || 'Unknown'}</small>
        `;
    }
}

// Handle Start Learning Session button click
async function handleStartLearningSession() {
    console.log('🎓 Starting learning session...');
    
    if (!currentTab) {
        alert('Unable to detect current tab. Please try again.');
        return;
    }
    
    // Check if we're on a YouTube video
    if (!currentTab.url || !currentTab.url.includes('youtube.com/watch')) {
        alert('Please navigate to a YouTube video first!');
        return;
    }
    
    try {
        // Update button state
        openChatBtn.disabled = true;
        openChatBtn.textContent = '🔄 Connecting...';
        
        // Send message to content script to show/activate widget
        chrome.tabs.sendMessage(currentTab.id, { 
            action: 'activateWidget',
            source: 'popup'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Failed to connect to content script:', chrome.runtime.lastError);
                alert('Extension not loaded. Please refresh the YouTube page and try again.');
            } else if (response && response.success) {
                console.log('✅ Widget activated successfully');
                updateStatus('active', 'Chat widget activated!');
                
                // Close popup after successful activation
                setTimeout(() => {
                    window.close();
                }, 1000);
            } else {
                console.error('Widget activation failed:', response);
                alert('Failed to activate chat widget. Please refresh the page and try again.');
            }
            
            // Reset button
            openChatBtn.disabled = false;
            openChatBtn.textContent = '💬 Start Learning Session';
        });
        
    } catch (error) {
        console.error('❌ Error starting learning session:', error);
        alert('An error occurred. Please refresh the page and try again.');
        
        // Reset button
        openChatBtn.disabled = false;
        openChatBtn.textContent = '💬 Start Learning Session';
    }
}

// Handle messages from content script
function handleContentScriptMessage(message, sender, sendResponse) {
    console.log('📨 Received message from content script:', message);
    
    switch (message.action) {
        case 'statusUpdate':
            updateStatus(message.status, message.message);
            if (message.videoData) {
                updateVideoInfo(message.videoData);
            }
            sendResponse({ received: true });
            break;
            
        case 'videoDataUpdate':
            updateVideoInfo(message.videoData);
            updateStatus('active', 'Ready to help!');
            sendResponse({ received: true });
            break;
            
        case 'widgetStateUpdate':
            if (message.visible) {
                updateStatus('active', 'Chat widget is active');
            } else {
                updateStatus('standby', 'Chat widget minimized');
            }
            sendResponse({ received: true });
            break;
            
        default:
            console.log('Unknown message action:', message.action);
            sendResponse({ received: false, error: 'Unknown action' });
    }
}

// Utility function to refresh extension status
function refreshStatus() {
    console.log('🔄 Refreshing extension status...');
    checkExtensionStatus();
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to start learning session
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleStartLearningSession();
    }
    
    // R key to refresh status
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        refreshStatus();
    }
});

// Auto-refresh status every 5 seconds when popup is open
setInterval(() => {
    if (document.visibilityState === 'visible') {
        checkExtensionStatus();
    }
}, 5000);

console.log('🎯 Popup script fully loaded and ready!');