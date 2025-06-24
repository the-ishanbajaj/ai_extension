// AI Study Assistant - Content Script
console.log('🤖 AI Study Assistant loaded on YouTube!');

// Global variables
let chatWidget = null;
let isWidgetVisible = false;
let currentVideoData = {};

// Initialize when page loads
function initializeExtension() {
    console.log('Initializing AI Study Assistant...');
    
    // Check if we're on a YouTube video page
    if (window.location.href.includes('youtube.com/watch')) {
        setTimeout(() => {
            createChatWidget();
            extractVideoData();
            
            // Notify popup that extension is ready
            notifyPopupStatus('active', 'Extension loaded successfully');
        }, 2000); // Wait for YouTube to load
    }
}

// Create the floating chat widget
function createChatWidget() {
    if (chatWidget) return; // Don't create multiple widgets
    
    // Create main widget container
    chatWidget = document.createElement('div');
    chatWidget.id = 'ai-study-assistant-widget';
    chatWidget.innerHTML = `
        <div class="widget-header">
            <div class="widget-title">
                <span class="widget-icon">🤖</span>
                <span>AI Study Assistant</span>
            </div>
            <div class="widget-controls">
                <button class="minimize-btn" id="minimizeWidget">−</button>
                <button class="close-btn" id="closeWidget">×</button>
            </div>
        </div>
        <div class="widget-content">
            <div class="video-info">
                <div class="video-title" id="widgetVideoTitle">Loading video info...</div>
                <div class="video-status" id="widgetVideoStatus">Ready to answer your questions!</div>
            </div>
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages">
                    <div class="welcome-message">
                        <div class="message ai-message">
                            <div class="message-content">
                                👋 Hi! I'm your AI study assistant. I can help you understand this video better. Ask me anything!
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <input type="text" 
                           id="chatInput" 
                           placeholder="Ask me anything about this video..." 
                           disabled>
                    <button id="sendButton" disabled>
                        <span class="send-icon">→</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add widget to page (initially hidden)
    chatWidget.style.display = 'none';
    document.body.appendChild(chatWidget);
    
    // Add event listeners
    setupEventListeners();
    
    console.log('✅ Chat widget created successfully!');
}

// Extract video information
function extractVideoData() {
    try {
        // Get video title
        const titleElement = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer');
        const title = titleElement ? titleElement.textContent.trim() : 'Unknown Video';
        
        // Get video URL
        const videoUrl = window.location.href;
        
        // Get video ID
        const videoId = new URLSearchParams(window.location.search).get('v');
        
        // Get channel name
        const channelElement = document.querySelector('#text.style-scope.ytd-video-owner-renderer a');
        const channel = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';
        
        // Store video data
        currentVideoData = {
            title,
            videoUrl,
            videoId,
            channel,
            timestamp: Date.now()
        };
        
        // Update widget with video info
        updateWidgetVideoInfo();
        
        // Enable chat input
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        
        if (chatInput && sendButton) {
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.placeholder = `Ask me about "${title.substring(0, 30)}..."`;
        }
        
        // Notify popup with video data
        notifyPopupVideoData(currentVideoData);
        
        console.log('✅ Video data extracted:', currentVideoData);
        
    } catch (error) {
        console.error('❌ Error extracting video data:', error);
        notifyPopupStatus('error', 'Failed to extract video data');
    }
}

// Update widget with current video info
function updateWidgetVideoInfo() {
    const titleElement = document.getElementById('widgetVideoTitle');
    const statusElement = document.getElementById('widgetVideoStatus');
    
    if (titleElement && currentVideoData.title) {
        titleElement.textContent = currentVideoData.title.length > 50 
            ? currentVideoData.title.substring(0, 50) + '...'
            : currentVideoData.title;
    }
    
    if (statusElement) {
        statusElement.textContent = `Ready to answer questions about this video!`;
    }
}

// Setup event listeners for widget interactions
function setupEventListeners() {
    // Close widget
    const closeBtn = document.getElementById('closeWidget');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            chatWidget.style.display = 'none';
            isWidgetVisible = false;
            notifyPopupWidgetState(false);
        });
    }
    
    // Minimize widget
    const minimizeBtn = document.getElementById('minimizeWidget');
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', toggleMinimize);
    }
    
    // Chat input handling
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage();
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', handleUserMessage);
    }
}

// Handle user messages
function handleUserMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Show "AI is thinking" message
    addMessageToChat('🤔 Thinking about your question...', 'ai', true);
    
    // Process message (for now, just echo back)
    setTimeout(() => {
        removeThinkingMessage();
        const response = generateMockResponse(message);
        addMessageToChat(response, 'ai');
    }, 2000);
}

// Add message to chat
function addMessageToChat(message, sender, isThinking = false) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message ${isThinking ? 'thinking' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${message}
        </div>
        <div class="message-time">
            ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove thinking message
function removeThinkingMessage() {
    const thinkingMessage = document.querySelector('.message.thinking');
    if (thinkingMessage) {
        thinkingMessage.remove();
    }
}

// Generate mock AI response (temporary)
function generateMockResponse(userMessage) {
    const responses = [
        `Great question! Based on the video "${currentVideoData.title}", here's what I understand: ${userMessage.toLowerCase()} is an important concept that relates to the main topic being discussed.`,
        `I can see you're asking about "${userMessage}". From what I've gathered from this video, this is a key point that the instructor covers around the middle section.`,
        `Interesting question about "${userMessage}"! This video by ${currentVideoData.channel} provides some good insights on this topic. Let me break it down for you...`,
        `That's a thoughtful question! The video explains this concept well. From my analysis of the content, here's what you should know about "${userMessage}"...`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Toggle minimize state
function toggleMinimize() {
    const content = document.querySelector('.widget-content');
    const minimizeBtn = document.getElementById('minimizeWidget');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        minimizeBtn.textContent = '−';
        chatWidget.style.height = 'auto';
    } else {
        content.style.display = 'none';
        minimizeBtn.textContent = '□';
        chatWidget.style.height = '50px';
    }
}

// Show/activate the widget
function showWidget() {
    if (chatWidget) {
        chatWidget.style.display = 'block';
        isWidgetVisible = true;
        notifyPopupWidgetState(true);
        console.log('✅ Widget activated from popup');
    }
}

// Communication functions with popup
function notifyPopupStatus(status, message) {
    try {
        chrome.runtime.sendMessage({
            action: 'statusUpdate',
            status: status,
            message: message,
            videoData: currentVideoData
        });
    } catch (error) {
        console.log('Could not notify popup:', error);
    }
}

function notifyPopupVideoData(videoData) {
    try {
        chrome.runtime.sendMessage({
            action: 'videoDataUpdate',
            videoData: videoData
        });
    } catch (error) {
        console.log('Could not send video data to popup:', error);
    }
}

function notifyPopupWidgetState(visible) {
    try {
        chrome.runtime.sendMessage({
            action: 'widgetStateUpdate',
            visible: visible
        });
    } catch (error) {
        console.log('Could not send widget state to popup:', error);
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Received message from popup:', message);
    
    switch (message.action) {
        case 'ping':
            // Popup is checking if content script is active
            sendResponse({
                status: 'active',
                videoData: currentVideoData,
                widgetVisible: isWidgetVisible
            });
            break;
            
        case 'activateWidget':
            // Popup wants to show/activate the widget
            showWidget();
            sendResponse({ success: true, message: 'Widget activated' });
            break;
            
        case 'getVideoData':
            // Popup requesting current video data
            sendResponse({
                success: true,
                videoData: currentVideoData
            });
            break;
            
        case 'getWidgetStatus':
            // Popup requesting widget status
            sendResponse({
                success: true,
                visible: isWidgetVisible,
                hasWidget: !!chatWidget
            });
            break;
            
        default:
            console.log('Unknown message action:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
});

// Listen for YouTube navigation changes
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        if (url.includes('youtube.com/watch')) {
            console.log('🔄 YouTube navigation detected, reinitializing...');
            setTimeout(() => {
                extractVideoData();
                notifyPopupStatus('active', 'Video changed - ready to help!');
            }, 1000);
        } else {
            // Hide widget if not on video page
            if (chatWidget) {
                chatWidget.style.display = 'none';
                isWidgetVisible = false;
            }
            notifyPopupStatus('standby', 'Navigate to a video to start');
        }
    }
}).observe(document, {subtree: true, childList: true});

// Initialize extension when content script loads
initializeExtension();

console.log('🎯 Content script fully loaded and ready!');