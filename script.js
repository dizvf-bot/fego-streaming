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
  let chatRate = 5;
  let viewerCount = 0;
  let totalCoins = 0;
  let isPoppedOut = false;
  let poppedOutWindow = null;
  let usedNames = new Set();
  let videoFrameCanvas = document.createElement('canvas');
  let videoFrameContext = videoFrameCanvas.getContext('2d');
  let lastAnalysisTime = 0;
  let analysisInterval = 15000; // Analyze every 15 seconds
  let videoAnalysisInterval;
  let isDarkMode = localStorage.getItem('darkMode') === 'true';
  let aiMessagesQueue = []; // Queue for AI-generated messages

  // Gemini API configuration - Using the correct format
  const GEMINI_API_KEY = 'AIzaSyDLmGMBnsLanDPKHqcDeWds4C88P4ri29o';
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  // Apply dark mode on load
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    updateThemeToggleIcon();
  }

  // Chat usernames
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

  // Generic chat templates (used when AI is not analyzing)
  const chatMessageTemplates = [
    "This is so interesting to watch!",
    "I've never seen anything like this before.",
    "Wow, look at that!",
    "This is great content!",
    "I'm learning so much from this stream.",
    "This is exactly what I was looking for!",
    "The quality of this stream is amazing!",
    "Does anyone else find this fascinating?",
    "I could watch this all day.",
    "This is incredibly well done.",
    "That part was really impressive.",
    "This is my first time watching your stream, and I'm impressed!",
    "I'm sharing this with my friends right now.",
    "I appreciate how thorough this is.",
    "This is much better than other streams I've watched.",
    "Your presentation style is engaging.",
    "I'm taking notes on everything you're showing.",
    "I never thought of it that way before.",
    "You make this look so easy!",
    "I'm definitely coming back for more streams.",
    "This content is so valuable.",
    "You've got a new follower today!",
    "The pace of this stream is perfect.",
    "This is exactly what I needed to see today.",
    "Your passion for this subject really shows.",
    "Looking forward to your next stream already!"
  ];

  const reactions = [
    "Did you see that? Amazing!",
    "Woah! That just happened!",
    "That's incredible!",
    "Look at that!",
    "That's actually genius!",
    "Mind. Blown.",
    "That's so creative!",
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
    "Could you explain that last part again?",
    "Are there any resources you recommend for learning more?",
    "How often do you stream?",
    "What's your favorite part about streaming?"
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

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeToggleIcon();
    
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
    
    viewCount.style.display = 'flex';
    streamIndicator.classList.add('hidden');
    
    startChat();
    startViewerCount();
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
        
        viewCount.style.display = 'none';
        streamIndicator.classList.remove('hidden');
        
        startChat();
        startViewerCount();
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
    
    viewCount.style.display = 'flex';
    streamIndicator.classList.add('hidden');
    
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
    
    viewCount.querySelector('span').textContent = '0 viewers';
    coinCount.querySelector('span').textContent = '0 BabaCoins';
    
    stopChat();
    stopViewerCount();
    
    if (videoAnalysisInterval) {
      clearInterval(videoAnalysisInterval);
      videoAnalysisInterval = null;
    }
  }

  function startChat() {
    stopChat();
    
    const intervalMs = (60 * 1000) / chatRate;
    
    chatInterval = setInterval(generateChatMessage, intervalMs);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => generateChatMessage(), i * 500);
    }

    totalCoins = 0;
    updateCoinCount();
  }

  function stopChat() {
    if (chatInterval) {
      clearInterval(chatInterval);
      chatInterval = null;
    }
    
    chatMessages.innerHTML = '';
    aiMessagesQueue = [];
  }

  function updateChatRate() {
    chatRate = parseInt(chatRateSlider.value);
    chatRateValue.textContent = chatRate;
    
    if (isPlaying) {
      startChat();
    }
  }

  function startViewerCount() {
    viewerCount = Math.floor(Math.random() * 50) + 10;
    updateViewerCount();
    
    viewerCountInterval = setInterval(() => {
      const change = Math.floor(Math.random() * 5) - 2;
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
    // Check if there are AI-generated messages in the queue
    if (aiMessagesQueue.length > 0) {
      const aiMessage = aiMessagesQueue.shift();
      sendChatMessage(aiMessage, 'ai');
      return;
    }

    // Otherwise generate regular chat message
    const rand = Math.random();
    let messageType, messageContent;
    
    if (rand < 0.10) {
      messageType = 'donation';
      const amount = Math.floor(Math.random() * 500) + 10;
      messageContent = `Thank you for the content! Keep it up!`;
      const donationAmount = amount;
      totalCoins += donationAmount;
      updateCoinCount();
    } else if (rand < 0.30) {
      messageType = 'question';
      messageContent = questions[Math.floor(Math.random() * questions.length)];
    } else if (rand < 0.50) {
      messageType = 'reaction';
      messageContent = reactions[Math.floor(Math.random() * reactions.length)];
    } else {
      messageType = 'regular';
      messageContent = chatMessageTemplates[Math.floor(Math.random() * chatMessageTemplates.length)];
    }
    
    sendChatMessage(messageContent, messageType);
  }

  function sendChatMessage(messageContent, messageType) {
    let username;
    do {
      username = chatUsernames[Math.floor(Math.random() * chatUsernames.length)];
    } while (usedNames.has(username) && usedNames.size < chatUsernames.length);
    usedNames.add(username);
    
    if (usedNames.size >= chatUsernames.length * 0.8) {
      usedNames.clear();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    
    const avatarEl = document.createElement('div');
    avatarEl.className = 'chat-avatar';
    const avatarSVG = generateAvatar(username);
    avatarEl.innerHTML = avatarSVG;
    
    const contentEl = document.createElement('div');
    contentEl.className = 'chat-content';
    
    const messageTextEl = document.createElement('div');
    const usernameEl = document.createElement('span');
    usernameEl.className = 'chat-username';
    usernameEl.textContent = username;
    
    messageTextEl.appendChild(usernameEl);
    messageTextEl.appendChild(document.createTextNode(': ' + messageContent));
    
    contentEl.appendChild(messageTextEl);
    
    if (messageType === 'donation') {
      const donationEl = document.createElement('div');
      donationEl.className = 'chat-donation';
      const amount = Math.floor(Math.random() * 500) + 10;
      donationEl.innerHTML = `
        <span class="donation-amount">${amount} BabaCoins</span> donated!
      `;
      contentEl.appendChild(donationEl);
    }
    
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);
    
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
    const hue = (username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360);
    const bgColor = `hsl(${hue}, 70%, 60%)`;
    const textColor = 'white';
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
      if (poppedOutWindow && !poppedOutWindow.closed) {
        poppedOutWindow.close();
      }
      
      mainChatContainer.classList.remove('hidden');
      popoutChatBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 3h6v6M14 10l7-7M10 21H3v-7M3 14l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      isPoppedOut = false;
    } else {
      poppedOutWindow = window.open('', 'FegoChat', 'width=350,height=600,resizable=yes');
      
      if (poppedOutWindow) {
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
        
        const poppedOutChatMessages = poppedOutWindow.document.getElementById('chat-messages');
        chatMessages.childNodes.forEach(node => {
          const clonedNode = node.cloneNode(true);
          poppedOutChatMessages.appendChild(clonedNode);
        });
        
        poppedOutWindow.document.getElementById('popin-chat-btn').addEventListener('click', function() {
          togglePopoutChat();
        });
        
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

  // ===== AI VIDEO ANALYSIS FUNCTIONS =====
  
  function setupVideoAnalysis() {
    videoPlayer.addEventListener('loadedmetadata', function() {
      videoFrameCanvas.width = videoPlayer.videoWidth;
      videoFrameCanvas.height = videoPlayer.videoHeight;
    });
    
    if (videoAnalysisInterval) {
      clearInterval(videoAnalysisInterval);
    }
    videoAnalysisInterval = setInterval(analyzeVideoFrame, analysisInterval);
    
    // Initial analysis after 2 seconds
    setTimeout(analyzeVideoFrame, 2000);
  }
  
  async function analyzeVideoFrame() {
    if (!isPlaying || videoPlayer.paused || videoPlayer.ended) return;
    
    const now = Date.now();
    if (now - lastAnalysisTime < 10000) return; // Minimum 10 seconds between analyses
    lastAnalysisTime = now;
    
    try {
      console.log('🎥 Capturing video frame for AI analysis...');
      
      // Draw current video frame to canvas
      videoFrameContext.drawImage(
        videoPlayer, 
        0, 0, 
        videoFrameCanvas.width, 
        videoFrameCanvas.height
      );
      
      // Convert to base64 JPEG
      const imageDataUrl = videoFrameCanvas.toDataURL('image/jpeg', 0.8);
      const base64Image = imageDataUrl.split(',')[1];
      
      console.log('📤 Sending to Gemini AI...');
      
      // Call Gemini API
      const messages = await callGeminiAPI(base64Image);
      
      if (messages && messages.length > 0) {
        console.log('✅ AI generated', messages.length, 'chat messages');
        // Add messages to queue
        aiMessagesQueue.push(...messages);
      }
    } catch (error) {
      console.error('❌ Error analyzing video frame:', error);
    }
  }
  
  async function callGeminiAPI(base64Image) {
    try {
      const requestBody = {
        contents: [{
          parts: [
            {
              text: `You are watching a live stream. Analyze this frame and generate 2-4 realistic chat messages that viewers might send. 

The messages should be:
- Natural and conversational (like real viewers commenting)
- Relevant to what you see in the image
- Varied (mix of reactions, questions, observations)
- Short and casual (1-2 sentences each)

Examples of good messages:
"Is that a new keyboard? Looks nice!"
"What software are you using for that?"
"The lighting in your setup is perfect!"
"I've been wanting to learn this, thanks for showing!"

Format your response as a JSON array of strings, like:
["message 1", "message 2", "message 3"]

Only return the JSON array, nothing else.`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 200
        }
      };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid API response format:', data);
        return null;
      }
      
      const textResponse = data.candidates[0].content.parts[0].text.trim();
      console.log('🤖 Gemini response:', textResponse);
      
      // Parse the JSON response
      try {
        // Remove markdown code blocks if present
        let jsonText = textResponse;
        if (jsonText.includes('```json')) {
          jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }
        
        const messages = JSON.parse(jsonText);
        
        if (Array.isArray(messages) && messages.length > 0) {
          return messages;
        } else {
          console.warn('AI response was not an array:', messages);
          return null;
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.log('Raw response:', textResponse);
        
        // Fallback: try to extract messages from text
        const lines = textResponse.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          return lines.slice(0, 4).map(line => line.replace(/^[-*"'\d.]\s*/, '').replace(/["']$/g, '').trim());
        }
        
        return null;
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return null;
    }
  }

  // Cleanup on window close
  window.addEventListener('beforeunload', function() {
    if (poppedOutWindow && !poppedOutWindow.closed) {
      poppedOutWindow.close();
    }
  });
});
