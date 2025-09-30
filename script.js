document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const uploadBtn = document.getElementById('upload-btn');
  const streamBtn = document.getElementById('stream-btn');
  const stopBtn = document.getElementById('stop-btn');
  const videoPlayer = document.getElementById('video-player');
  const videoPlaceholder = document.getElementById('video-placeholder');
  const videoTitle = document.getElementById('video-title');
  const viewCount = document.getElementById('view-count');
  const coinCount = document.getElementById('coin-count');
  const streamIndicator = document.getElementById('stream-indicator');
  const uploadModal = document.getElementById('upload-modal');
  const closeModal = document.querySelector('.close');
  const uploadForm = document.getElementById('upload-form');
  const videoTitleInput = document.getElementById('video-title-input');
  const videoFileInput = document.getElementById('video-file');
  const hiddenFileInput = document.getElementById('hidden-file-input');
  const chatMessages = document.getElementById('chat-messages');
  const chatRateSlider = document.getElementById('chat-rate');
  const chatRateValue = document.getElementById('chat-rate-value');
  const popoutChatBtn = document.getElementById('popout-chat-btn');
  const mainChatContainer = document.getElementById('main-chat-container');
  const themeToggleBtn = document.getElementById('theme-toggle');

  // State
  let isStreaming = false;
  let isPlaying = false;
  let chatInterval;
  let chatRate = 5; // Default rate (messages per minute)
  let viewerCount = 0;
  let totalCoins = 0;
  let isPoppedOut = false;
  let poppedOutWindow = null;
  let usedNames = new Set(); // Keep track of used names
  let videoFrameCanvas = document.createElement('canvas');
  let videoFrameContext = videoFrameCanvas.getContext('2d');
  let lastAnalysisTime = 0;
  let analysisInterval = 10000; // Analyze video every 10 seconds
  let videoAnalysisInterval;
  let isDarkMode = localStorage.getItem('darkMode') === 'true';

  // Gemini API configuration
  const GEMINI_API_KEY = 'AIzaSyDzEOzLmoojB88PUwpXfGN4_IE1hFJqTDQ';
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  // Apply dark mode on load if it's saved in localStorage
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    updateThemeToggleIcon();
  }

  // Chat usernames and profile pictures
  const chatUsernames = [
    'GamerPro99', 'PixelWarrior', 'StreamQueen', 'NightOwlGaming', 'EpicViewerXX',
    'SilverArrow', 'CosmicGamer', 'MoonlightPlayer', 'SunriseStreamer', 'StardustViewer',
    'TechSavvy', 'GameMaster64', 'DigitalNomad', 'CyberNinja', 'ElectricDreamer',
    'PhoenixRising', 'OceanWave', 'MountainClimber', 'DesertWanderer', 'ForestExplorer',
    'CrystalCollector', 'EmberFlame', 'FrostBite', 'ThunderStrike', 'WindWhisperer',
    'EarthShaker', 'WaterBender', 'FireBreather', 'AirGlider', 'MetalForger',
    'CodeBreaker', 'PuzzleSolver', 'StrategyMaster', 'QuestSeeker', 'LoreKeeper',
    'MythHunter', 'LegendTeller', 'StoryWeaver', 'DreamCatcher', 'NightWatcher',
    'DawnBreaker', 'TwilightWalker', 'SunsetGazer', 'MoonlitSky', 'StarryNight'
  ];

  // Chat message templates
  const chatMessageTemplates = [
    "This is so interesting to watch!",
    "I've never seen anything like this before.",
    "Wow, look at that!",
    "What's that in the background?",
    "I wonder what will happen next?",
    "This is great content!",
    "I'm learning so much from this stream.",
    "This is exactly what I was looking for!",
    "The quality of this stream is amazing!",
    "Does anyone else find this fascinating?",
    "I could watch this all day.",
    "This is incredibly well done.",
    "I have a question about what you just showed!",
    "That part was really impressive.",
    "How did you learn to do that?",
    "This is my first time watching your stream, and I'm impressed!",
    "The way you explained that was really clear.",
    "I'm sharing this with my friends right now.",
    "I didn't expect to see that!",
    "Can you go into more detail about that last part?",
    "That's a really unique approach.",
    "I appreciate how thorough this is.",
    "This is much better than other streams I've watched.",
    "Your presentation style is engaging.",
    "I'm taking notes on everything you're showing.",
    "That's a clever solution to that problem.",
    "I never thought of it that way before.",
    "The visuals here are stunning!",
    "You make this look so easy!",
    "That's a helpful tip, thanks for sharing!",
    "I'm definitely coming back for more streams.",
    "This content is so valuable.",
    "You've got a new follower today!",
    "I've been waiting for someone to cover this topic.",
    "The pace of this stream is perfect.",
    "I like how you're explaining as you go.",
    "This is exactly what I needed to see today.",
    "Your passion for this subject really shows.",
    "I'm impressed by your knowledge on this.",
    "Looking forward to your next stream already!"
  ];

  const reactions = [
    "Did you see that? Amazing!",
    "Woah! That just happened!",
    "I'm seeing something right now!",
    "That's incredible technique!",
    "Look at those skills on display!",
    "That's one way to do it!",
    "Never would have thought of that approach!",
    "That's actually genius!",
    "I'm taking notes on that technique.",
    "Mind. Blown.",
    "That's so creative!",
    "That move was perfectly executed!",
    "I need to try that sometime.",
    "What a brilliant solution!",
    "I'm impressed by how smooth that was."
  ];

  const questions = [
    "How long have you been doing this?",
    "What made you start streaming?",
    "Do you have any tips for beginners?",
    "What equipment are you using?",
    "Where did you learn these techniques?",
    "Will you be covering more advanced topics in future streams?",
    "Have you tried the alternative approach?",
    "What's your opinion on the latest developments in this field?",
    "Could you explain that last part again?",
    "Are there any resources you recommend for learning more?",
    "How often do you stream?",
    "What's the biggest challenge you've faced with this?",
    "Do you collaborate with other streamers?",
    "What's your favorite part about streaming?",
    "How do you stay motivated to keep improving?"
  ];

  // Event listeners
  uploadBtn.addEventListener('click', openUploadModal);
  streamBtn.addEventListener('click', toggleStreaming);
  stopBtn.addEventListener('click', stopSession);
  closeModal.addEventListener('click', closeUploadModal);
  uploadForm.addEventListener('submit', handleVideoUpload);
  chatRateSlider.addEventListener('input', updateChatRate);
  popoutChatBtn.addEventListener('click', togglePopoutChat);
  themeToggleBtn.addEventListener('click', toggleDarkMode);

  // Add new functions for theme toggling
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeToggleIcon();
    
    // Update popped out window if it exists
    if (isPoppedOut && poppedOutWindow && !poppedOutWindow.closed) {
      if (isDarkMode) {
        poppedOutWindow.document.body.classList.add('dark-mode');
      } else {
        poppedOutWindow.document.body.classList.remove('dark-mode');
      }
    }
  }
  
  function updateThemeToggleIcon() {
    if (isDarkMode) {
      themeToggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
      themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
      themeToggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;
      themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
  }

  function openUploadModal() {
    uploadModal.style.display = 'block';
  }

  function closeUploadModal() {
    uploadModal.style.display = 'none';
  }

  function handleVideoUpload(e) {
    e.preventDefault();
    const title = videoTitleInput.value;
    const file = videoFileInput.files[0];
    
    if (file) {
      startVideo(file, title);
      closeUploadModal();
      videoTitleInput.value = '';
      videoFileInput.value = '';
    }
  }

  function startVideo(file, title) {
    const videoURL = URL.createObjectURL(file);
    videoPlayer.src = videoURL;
    videoPlayer.style.display = 'block';
    videoPlaceholder.style.display = 'none';
    
    videoTitle.textContent = title || 'Untitled Video';
    videoPlayer.play();
    
    isPlaying = true;
    isStreaming = false;
    stopBtn.disabled = false;
    stopBtn.textContent = 'Stop Session';
    streamBtn.textContent = 'Start Streaming';
    
    // Show view count, hide stream indicator
    viewCount.style.display = 'flex';
    streamIndicator.classList.add('hidden');
    
    // Start generating chat
    startChat();
    startViewerCount();
    
    // Set up video analysis
    setupVideoAnalysis();
  }

  function toggleStreaming() {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  }

  function startStreaming() {
    if (isPlaying) {
      stopSession();
    }
    
    // Request screen capture instead of camera access
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      .then(function(stream) {
        videoPlayer.srcObject = stream;
        videoPlayer.style.display = 'block';
        videoPlaceholder.style.display = 'none';
        
        videoTitle.textContent = 'Screen Sharing';
        videoPlayer.play();
        
        isPlaying = true;
        isStreaming = true;
        stopBtn.disabled = false;
        stopBtn.textContent = 'Stop Streaming';
        streamBtn.textContent = 'Stop Streaming';
        
        // Hide view count, show stream indicator
        viewCount.style.display = 'none';
        streamIndicator.classList.remove('hidden');
        
        // Start generating chat
        startChat();
        startViewerCount();
        
        // Set up video analysis
        setupVideoAnalysis();
      })
      .catch(function(err) {
        console.error('Error accessing screen:', err);
        alert('Could not access screen. Please check your permissions and try again.');
      });
  }

  function stopStreaming() {
    if (videoPlayer.srcObject) {
      const tracks = videoPlayer.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    videoPlayer.srcObject = null;
    videoPlayer.style.display = 'none';
    videoPlaceholder.style.display = 'flex';
    
    videoTitle.textContent = 'No video playing';
    
    isPlaying = false;
    isStreaming = false;
    stopBtn.disabled = true;
    streamBtn.textContent = 'Start Streaming';
    
    // Reset UI
    viewCount.style.display = 'flex';
    streamIndicator.classList.add('hidden');
    
    // Stop chat and viewer count
    stopChat();
    stopViewerCount();
  }

  function stopSession() {
    if (isStreaming) {
      stopStreaming();
      return;
    }
    
    videoPlayer.pause();
    videoPlayer.src = '';
    videoPlayer.style.display = 'none';
    videoPlaceholder.style.display = 'flex';
    
    videoTitle.textContent = 'No video playing';
    
    isPlaying = false;
    stopBtn.disabled = true;
    
    // Reset UI
    viewCount.querySelector('span').textContent = '0 viewers';
    coinCount.querySelector('span').textContent = '0 BabaCoins';
    
    // Stop chat and viewer count
    stopChat();
    stopViewerCount();
    
    // Stop video analysis
    if (videoAnalysisInterval) {
      clearInterval(videoAnalysisInterval);
      videoAnalysisInterval = null;
    }
  }

  function startChat() {
    stopChat(); // Clear any existing interval
    
    // Calculate interval based on chat rate (messages per minute)
    const intervalMs = (60 * 1000) / chatRate;
    
    chatInterval = setInterval(generateChatMessage, intervalMs);
    // Generate initial messages right away
    for (let i = 0; i < 3; i++) {
      setTimeout(() => generateChatMessage(), i * 500);
    }

    // Reset BabaCoins counter
    totalCoins = 0;
    updateCoinCount();
  }

  function stopChat() {
    if (chatInterval) {
      clearInterval(chatInterval);
      chatInterval = null;
    }
    
    // Clear chat messages
    chatMessages.innerHTML = '';
  }

  function updateChatRate() {
    chatRate = parseInt(chatRateSlider.value);
    chatRateValue.textContent = chatRate;
    
    if (isPlaying) {
      startChat(); // Restart chat with new rate
    }
  }

  function startViewerCount() {
    // Reset viewer count
    viewerCount = Math.floor(Math.random() * 50) + 10;
    updateViewerCount();
    
    // Simulate viewer count changes
    viewerCountInterval = setInterval(() => {
      const change = Math.floor(Math.random() * 5) - 2; // -2 to +2 viewers
      viewerCount = Math.max(1, viewerCount + change);
      updateViewerCount();
    }, 5000);
  }

  function stopViewerCount() {
    if (viewerCountInterval) {
      clearInterval(viewerCountInterval);
      viewerCountInterval = null;
    }
    
    viewerCount = 0;
    updateViewerCount();
  }

  function updateViewerCount() {
    viewCount.querySelector('span').textContent = `${viewerCount} viewers`;
  }

  function generateChatMessage() {
    // Determine message type with probabilities
    const rand = Math.random();
    let messageType, messageContent;
    
    if (rand < 0.10) { // 10% chance for donation
      messageType = 'donation';
      const amount = Math.floor(Math.random() * 500) + 10; // 10-500 BabaCoins
      messageContent = `Thank you for the content! Keep it up!`;
      const donationAmount = amount;
      totalCoins += donationAmount;
      updateCoinCount();
    } else if (rand < 0.30) { // 20% chance for question
      messageType = 'question';
      messageContent = questions[Math.floor(Math.random() * questions.length)];
    } else if (rand < 0.50) { // 20% chance for reaction
      messageType = 'reaction';
      messageContent = reactions[Math.floor(Math.random() * reactions.length)];
    } else { // 50% chance for regular message
      messageType = 'regular';
      messageContent = chatMessageTemplates[Math.floor(Math.random() * chatMessageTemplates.length)];
    }
    
    // Create a unique username
    let username;
    do {
      username = chatUsernames[Math.floor(Math.random() * chatUsernames.length)];
    } while (usedNames.has(username) && usedNames.size < chatUsernames.length);
    usedNames.add(username);
    
    // If all names have been used, reset the set
    if (usedNames.size >= chatUsernames.length * 0.8) {
      usedNames.clear();
    }
    
    // Create chat message element
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    
    // Create avatar
    const avatarEl = document.createElement('div');
    avatarEl.className = 'chat-avatar';
    
    // Generate a profile picture (SVG avatar)
    const avatarSVG = generateAvatar(username);
    avatarEl.innerHTML = avatarSVG;
    
    // Create message content
    const contentEl = document.createElement('div');
    contentEl.className = 'chat-content';
    
    // Create username and message
    const messageTextEl = document.createElement('div');
    const usernameEl = document.createElement('span');
    usernameEl.className = 'chat-username';
    usernameEl.textContent = username;
    
    messageTextEl.appendChild(usernameEl);
    messageTextEl.appendChild(document.createTextNode(': ' + messageContent));
    
    contentEl.appendChild(messageTextEl);
    
    // Add donation if applicable
    if (messageType === 'donation') {
      const donationEl = document.createElement('div');
      donationEl.className = 'chat-donation';
      donationEl.innerHTML = `
        <span class="donation-amount">${donationAmount} BabaCoins</span> donated!
      `;
      contentEl.appendChild(donationEl);
    }
    
    // Assemble message
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);
    
    // Add to chat in main window and popped out window if exists
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (isPoppedOut && poppedOutWindow && !poppedOutWindow.closed) {
      const poppedOutChatMessages = poppedOutWindow.document.getElementById('chat-messages');
      const clonedMessage = messageEl.cloneNode(true);
      poppedOutChatMessages.appendChild(clonedMessage);
      poppedOutChatMessages.scrollTop = poppedOutChatMessages.scrollHeight;
    }
  }

  function generateAvatar(username) {
    // Generate a unique color based on username
    const hue = (username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360);
    const bgColor = `hsl(${hue}, 70%, 60%)`;
    const textColor = 'white';
    
    // Get initials (up to 2 characters)
    const initials = username.substring(0, 2).toUpperCase();
    
    return `
      <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="15" fill="${bgColor}" />
        <text x="15" y="19" font-size="12" text-anchor="middle" fill="${textColor}">${initials}</text>
      </svg>
    `;
  }

  function togglePopoutChat() {
    if (isPoppedOut) {
      // Check if window still exists and isn't closed
      if (poppedOutWindow && !poppedOutWindow.closed) {
        poppedOutWindow.close();
      }
      
      // Return chat to main window
      mainChatContainer.classList.remove('hidden');
      popoutChatBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 3h6v6M14 10l7-7M10 21H3v-7M3 14l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      isPoppedOut = false;
    } else {
      // Create pop-out window
      poppedOutWindow = window.open('', 'FegoChat', 'width=350,height=600,resizable=yes');
      
      if (poppedOutWindow) {
        // Write content to the new window
        poppedOutWindow.document.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Fego Live Chat</title>
            <style>
              ${document.querySelector('style') ? document.querySelector('style').innerHTML : ''}
              body { margin: 0; padding: 0; background-color: var(--bg-color); }
              .chat-section { height: 100vh; border-radius: 0; }
              .chat-header { cursor: default; }
              #popout-chat-btn svg { transform: rotate(180deg); }
            </style>
          </head>
          <body${isDarkMode ? ' class="dark-mode"' : ''}>
            <div class="chat-section">
              <div class="chat-header">
                <h3>Live Chat (Popped Out)</h3>
                <button id="popin-chat-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3h6v6M14 10l7-7M10 21H3v-7M3 14l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="chat-messages" id="chat-messages"></div>
              <div class="chat-input">
                <input type="text" placeholder="Say something..." disabled>
                <button disabled>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </body>
          </html>
        `);
        
        // Copy existing chat messages to the popped-out window
        const poppedOutChatMessages = poppedOutWindow.document.getElementById('chat-messages');
        chatMessages.childNodes.forEach(node => {
          const clonedNode = node.cloneNode(true);
          poppedOutChatMessages.appendChild(clonedNode);
        });
        
        // Add event listener to the pop in button
        poppedOutWindow.document.getElementById('popin-chat-btn').addEventListener('click', function() {
          togglePopoutChat();
        });
        
        // Update when the popped out window is closed directly
        poppedOutWindow.addEventListener('beforeunload', function() {
          if (isPoppedOut) {
            mainChatContainer.classList.remove('hidden');
            popoutChatBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3h6v6M14 10l7-7M10 21H3v-7M3 14l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `;
            isPoppedOut = false;
          }
        });
        
        // Hide chat in main window
        mainChatContainer.classList.add('hidden');
        popoutChatBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 3h-6v6M10 14l-7-7M14 21h6v-6M14 10l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        isPoppedOut = true;
      } else {
        alert('Could not open pop-out chat. Please check your browser settings.');
      }
    }
  }

  function updateCoinCount() {
    coinCount.querySelector('span').textContent = `${totalCoins} BabaCoins`;
  }

  // Video analysis functions (updated to use Gemini API)
  function setupVideoAnalysis() {
    // Setup canvas dimensions once video metadata is loaded
    videoPlayer.addEventListener('loadedmetadata', function() {
      videoFrameCanvas.width = videoPlayer.videoWidth;
      videoFrameCanvas.height = videoPlayer.videoHeight;
    });
    
    // Start regular analysis
    if (videoAnalysisInterval) {
      clearInterval(videoAnalysisInterval);
    }
    videoAnalysisInterval = setInterval(analyzeVideoFrame, analysisInterval);
    
    // Do an initial analysis
    setTimeout(analyzeVideoFrame, 1000);
  }
  
  async function analyzeVideoFrame() {
    if (!isPlaying || videoPlayer.paused || videoPlayer.ended) return;
    
    const now = Date.now();
    if (now - lastAnalysisTime < 5000) return; // Prevent too frequent analysis
    lastAnalysisTime = now;
    
    try {
      // Draw current video frame to canvas
      videoFrameContext.drawImage(
        videoPlayer, 
        0, 0, 
        videoFrameCanvas.width, 
        videoFrameCanvas.height
      );
      
      // Convert canvas to data URL
      const imageDataUrl = videoFrameCanvas.toDataURL('image/jpeg', 0.7);
      
      // Send to Gemini AI for analysis
      const result = await analyzeImageWithGemini(imageDataUrl);
      
      // Generate chat messages based on AI analysis
      if (result) {
        generateAIResponseMessages(result);
      }
    } catch (error) {
      console.error('Error analyzing video frame:', error);
    }
  }
  
  // Response templates based on what the AI identifies
  const responseTemplates = {
    // Objects and items
    computer: ["Nice setup!", "That computer looks powerful!", "Sweet tech setup there!", "Love that setup!"],
    phone: ["Is that the new phone?", "Nice phone!", "That phone camera quality looks great!"],
    game: ["What game is that?", "This game looks fun!", "I love this game!", "Never played this one before!"],
    code: ["Nice code!", "That's some clean coding!", "Programming stream! Love it!", "What language is that?"],
    browser: ["Which browser do you prefer?", "Browser looks clean!", "Nice browser setup!"],
    music: ["Great music choice!", "This song is fire!", "Love this track!", "What's this song?"],
    
    // Actions
    typing: ["Fast typing!", "Those fingers are flying!", "Speed typing master!", "Impressive typing speed!"],
    clicking: ["Nice clicks!", "Smooth navigation!", "Quick with the mouse!", "Good mouse control!"],
    scrolling: ["Scrolling through like a pro!", "Fast scrolling!", "Smooth scrolling there!"],
    streaming: ["Stream quality is great!", "This stream is smooth!", "Great stream setup!", "Professional streaming!"],
    gaming: ["Nice gameplay!", "Good moves!", "That was smooth!", "Great gaming skills!"],
    coding: ["Clean code!", "Nice programming!", "That logic looks solid!", "Good coding style!"],
    
    // Screen/Interface elements
    screen: ["Screen looks crisp!", "Nice display quality!", "Clear screen!", "Good resolution!"],
    window: ["Clean window layout!", "Nice window management!", "Organized desktop!", "Tidy workspace!"],
    menu: ["Nice menu navigation!", "Smooth menu usage!", "Good interface!", "Clean UI!"],
    chat: ["Chat is active!", "Love the interaction!", "Great community!", "Active chat today!"],
    
    // Colors (simplified responses)
    blue: ["Love the blue theme!", "Blue looks clean!", "Nice blue colors!", "Blue is my favorite!"],
    red: ["That red pops!", "Red looks great!", "Nice red accent!", "Bold red choice!"],
    green: ["Green looks fresh!", "Love the green!", "Nice green theme!", "Green is calming!"],
    purple: ["Purple looks royal!", "Love that purple!", "Nice purple theme!", "Purple is cool!"],
    
    // Moods/Atmosphere
    professional: ["Very professional!", "Clean and professional!", "Business vibes!", "Professional setup!"],
    casual: ["Chill vibes!", "Relaxed atmosphere!", "Casual and cool!", "Nice and easy!"],
    technical: ["Tech vibes!", "Getting technical!", "Nerdy and I love it!", "Tech stuff is cool!"],
    creative: ["Creative energy!", "Artistic vibes!", "Love the creativity!", "So creative!"],
    
    // Fallback responses for unknown items
    default: [
      "Interesting!", "Cool stuff!", "Nice!", "That's neat!", "Looking good!",
      "I see that!", "Neat setup!", "Nice work!", "That's cool!", "Interesting choice!",
      "Good stuff!", "That looks good!", "Nice touch!", "Cool feature!", "That's handy!"
    ]
  };

  async function analyzeImageWithGemini(imageDataUrl) {
    try {
      // Convert data URL to base64 (remove data:image/jpeg;base64, prefix)
      const base64Image = imageDataUrl.split(',')[1];
      
      const requestBody = {
        contents: [{
          parts: [
            {
              text: `Look at this image and identify what you see. Respond with ONLY simple keywords separated by commas. 
              Focus on: main objects (computer, phone, game, code, browser, music), 
              actions (typing, clicking, scrolling, streaming, gaming, coding), 
              interface elements (screen, window, menu, chat),
              and dominant colors (blue, red, green, purple).
              
              Example response: computer, typing, blue, screen
              Keep it simple - just the main things you notice.`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }]
      };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text.trim();
      
      // Parse the simple keyword response
      const keywords = text.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      return { keywords };
    } catch (error) {
      console.error('Error in Gemini AI analysis:', error);
      return null;
    }
  }
  
  function generateAIResponseMessages(analysisResult) {
    if (!analysisResult || !analysisResult.keywords || analysisResult.keywords.length === 0) return;
    
    // Pick 1-3 random keywords from the analysis
    const selectedKeywords = [];
    const numKeywords = Math.min(analysisResult.keywords.length, Math.floor(Math.random() * 3) + 1);
    
    for (let i = 0; i < numKeywords; i++) {
      const availableKeywords = analysisResult.keywords.filter(k => !selectedKeywords.includes(k));
      if (availableKeywords.length === 0) break;
      
      const randomKeyword = availableKeywords[Math.floor(Math.random() * availableKeywords.length)];
      selectedKeywords.push(randomKeyword);
    }
    
    // Generate messages based on selected keywords
    const messages = [];
    
    selectedKeywords.forEach(keyword => {
      const templates = responseTemplates[keyword] || responseTemplates.default;
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      messages.push(randomTemplate);
    });
    
    // Send messages with staggered timing
    messages.forEach((message, index) => {
      setTimeout(() => {
        sendAnalysisMessage(message);
      }, index * 2000); // Stagger by 2 seconds
    });
  }
  
  function sendAnalysisMessage(messageContent) {
    // Create a unique username
    let username;
    do {
      username = chatUsernames[Math.floor(Math.random() * chatUsernames.length)];
    } while (usedNames.has(username) && usedNames.size < chatUsernames.length);
    usedNames.add(username);
    
    // If all names have been used, reset the set
    if (usedNames.size >= chatUsernames.length * 0.8) {
      usedNames.clear();
    }
    
    // Create chat message element
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    
    // Create avatar
    const avatarEl = document.createElement('div');
    avatarEl.className = 'chat-avatar';
    
    // Generate a profile picture (SVG avatar)
    const avatarSVG = generateAvatar(username);
    avatarEl.innerHTML = avatarSVG;
    
    // Create message content
    const contentEl = document.createElement('div');
    contentEl.className = 'chat-content';
    
    // Create username and message
    const messageTextEl = document.createElement('div');
    const usernameEl = document.createElement('span');
    usernameEl.className = 'chat-username';
    usernameEl.textContent = username;
    
    messageTextEl.appendChild(usernameEl);
    messageTextEl.appendChild(document.createTextNode(': ' + messageContent));
    
    contentEl.appendChild(messageTextEl);
    
    // Assemble message
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);
    
    // Add to chat in main window and popped out window if exists
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (isPoppedOut && poppedOutWindow && !poppedOutWindow.closed) {
      const poppedOutChatMessages = poppedOutWindow.document.getElementById('chat-messages');
      const clonedMessage = messageEl.cloneNode(true);
      poppedOutChatMessages.appendChild(clonedMessage);
      poppedOutChatMessages.scrollTop = poppedOutChatMessages.scrollHeight;
    }
  }

  // Window event to cleanup if the main window is closed
  window.addEventListener('beforeunload', function() {
    if (poppedOutWindow && !poppedOutWindow.closed) {
      poppedOutWindow.close();
    }
  });
});
