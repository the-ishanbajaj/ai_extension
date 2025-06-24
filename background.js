// Background service worker
console.log('AI Study Assistant background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Study Assistant installed');
});