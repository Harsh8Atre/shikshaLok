document.addEventListener('DOMContentLoaded', () => {
    // Helper function to toggle a popup by ID
    const togglePopup = (id) => {
        const popup = document.getElementById(id);
        if (popup) {
            popup.classList.toggle('hidden');
        } else {
            console.error(`Popup with ID '${id}' not found.`);
        }
    };

    // --- Login/Signup Pop-up Logic ---
    const toggleLoginPopup = () => togglePopup('login-popup');
    const toggleSignupPopup = () => togglePopup('signup-popup');

    const showSignupFromLogin = () => {
        toggleLoginPopup();
        toggleSignupPopup();
    };

    // Login Submission
    async function handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                alert('Login successful! Welcome ' + data.user.name);
                toggleLoginPopup();
                localStorage.setItem('token', data.tokens.access);

                // Conditional redirection based on role
                if (data.user.role === 'admin') {
                    window.location.href = '/admin/dashboard.html';
                } else if (data.user.role === 'faculty') {
                    window.location.href = '/faculty/dashboard.html';
                } else {
                    window.location.href = '/student/dashboard.html';
                }
            } else {
                alert(data.message || 'Login failed.');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Login failed. Please try again later.');
        }
    }

    // Signup Submission
    async function handleSignup(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {};
        formData.forEach((value, key) => (data[key] = value.trim()));

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (response.ok) {
                alert('Account created successfully! Please login now.');
                toggleSignupPopup();
                toggleLoginPopup();
            } else {
                alert(result.error || 'Signup failed.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Signup failed. Please try again later.');
        }
    }

    // Role Selector for Signup
    const roleButtons = document.querySelectorAll('#signup-role-selector .role-btn');
    roleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            roleButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            const selectedRole = button.getAttribute('data-role');
            const roleInput = document.querySelector('#signup-form input[name="role"]');
            if (roleInput) roleInput.value = selectedRole;
            document.querySelectorAll('.role-field').forEach((field) => {
                if (field.classList.contains(selectedRole)) {
                    field.style.display = '';
                    field.setAttribute('required', '');
                } else {
                    field.style.display = 'none';
                    field.removeAttribute('required');
                    field.value = '';
                }
            });
        });
    });

    // Initialize default role fields on page load
    const activeRoleBtn = document.querySelector('#signup-role-selector .role-btn.active');
    if (activeRoleBtn) activeRoleBtn.click();

    // Event Listeners
    const loginBtn = document.querySelector('.login');
    if (loginBtn) loginBtn.onclick = toggleLoginPopup;

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.onsubmit = handleLogin;

    const signupForm = document.getElementById('signup-form');
    if (signupForm) signupForm.onsubmit = handleSignup;

    const showSignupBtn = document.getElementById('showSignupBtn');
    if (showSignupBtn) showSignupBtn.onclick = showSignupFromLogin;

    window.toggleLoginPopup = toggleLoginPopup;
    window.toggleSignupPopup = toggleSignupPopup;
    window.showSignupFromLogin = showSignupFromLogin;
    window.showSignupRoleForm = () => roleButtons[0].click();

    // --- College Datalist Fetcher ---
    async function fetchColleges() {
        try {
            const response = await fetch('/api/colleges');
            if (!response.ok) {
                throw new Error('Failed to fetch colleges');
            }
            const colleges = await response.json();
            const datalist = document.getElementById('college-list');
            if (datalist) {
                datalist.innerHTML = '';
                colleges.forEach((college) => {
                    const option = document.createElement('option');
                    option.value = college.name;
                    datalist.appendChild(option);
                });
            }
        } catch (err) {
            console.error('Error fetching colleges:', err);
        }
    }
    fetchColleges(); // Initial call to populate datalist

    // --- Live Video and Chat Logic (assuming this script runs on the platform page) ---
    const liveVideo = document.getElementById('liveVideo');
    const goLiveBtn = document.getElementById('goLiveBtn');
    const closeLiveBtn = document.getElementById('closeLiveBtn');
    const liveVideoContainer = document.querySelector('.live-video');
    const professorName = document.querySelector('.live-video-text');
    const chatInput = document.querySelector('.chat-input-box input[type="text"]');
    const sendBtn = document.querySelector('.send-btn');
    const chatScroll = document.querySelector('.chat-scroll');

    let localStream = null;
    let peerConnection = null;
    const socket = io();
    let currentSessionId = 'your_current_session_id'; // This must be a dynamic variable from your server

    socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        socket.emit('join_session', currentSessionId, (response) => {
            if (response.success) {
                console.log('Joined session:', currentSessionId);
            } else {
                console.error('Failed to join session:', response.error);
                alert('Could not join the session.');
            }
        });
    });

    if (goLiveBtn) {
        goLiveBtn.onclick = async () => {
            try {
                const constraints = { video: true, audio: true };
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
                liveVideo.srcObject = localStream;
                liveVideoContainer.style.backgroundImage = 'none';
                professorName.style.display = 'none';
                goLiveBtn.style.display = 'none';
                closeLiveBtn.style.display = 'block';
                // You would implement WebRTC signaling here
            } catch (err) {
                console.error('Camera access error:', err);
                alert('Could not access camera: ' + err.message);
            }
        };
    }

    if (closeLiveBtn) {
        closeLiveBtn.onclick = () => {
            if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
                liveVideo.srcObject = null;
                localStream = null;
                closeLiveBtn.style.display = 'none';
                liveVideoContainer.style.backgroundImage = 'url(images/online-teacher.jpg)';
                professorName.style.display = 'inline';
                goLiveBtn.style.display = 'block'; // Changed to block to match original style
            }
        };
    }

    // --- Enhanced Chat Logic ---
    if (sendBtn) {
        sendBtn.onclick = () => {
            const message = chatInput.value;
            if (message.trim()) {
                socket.emit('send_message', { sessionId: currentSessionId, message }, (response) => {
                    if (response.success) {
                        displayMessage(response.chatMessage);
                        chatInput.value = '';
                    } else {
                        alert(response.error);
                    }
                });
            }
        };
    }

    socket.on('chat_message', (chatMessage) => {
        // Display incoming messages
        displayMessage(chatMessage);
    });

    function displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        const senderElement = document.createElement('div');
        senderElement.classList.add('chat-sender');
        senderElement.textContent = message.sender.name;
        // Dynamically add a class based on sender role for styling
        if (message.sender.role === 'faculty') {
            senderElement.classList.add('faculty');
        } else if (message.sender.role === 'student') {
            senderElement.classList.add('student');
        }

        const textElement = document.createElement('div');
        textElement.classList.add('chat-text');
        textElement.textContent = message.message;

        messageElement.appendChild(senderElement);
        messageElement.appendChild(textElement);
        chatScroll.appendChild(messageElement);
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }
});