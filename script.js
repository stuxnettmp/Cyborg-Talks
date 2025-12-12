        // Generate stars
        const starsContainer = document.getElementById('stars');
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.animationDuration = (2 + Math.random() * 3) + 's';
            starsContainer.appendChild(star);
        }

        // Generate floating particles
        const particlesContainer = document.getElementById('particles');
        const particleCount = window.innerWidth < 640 ? 15 : 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.opacity = Math.random() * 0.5 + 0.2;
            
            const duration = 10 + Math.random() * 20;
            const delay = Math.random() * 10;
            particle.style.animation = `floatParticle ${duration}s ${delay}s ease-in-out infinite`;
            
            particlesContainer.appendChild(particle);
        }

        // Add particle animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatParticle {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                25% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.5); opacity: 0.6; }
                50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1); opacity: 0.4; }
                75% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.2); opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);

        // Generate DNA strands
        function createDNA(container) {
            for (let i = 0; i < 15; i++) {
                const node = document.createElement('div');
                node.className = 'dna-node';
                node.style.top = (i * 7) + '%';
                node.style.animationDelay = (i * 0.2) + 's';
                node.style.left = container.classList.contains('right') ? 'auto' : '0';
                container.appendChild(node);
            }
        }
        createDNA(document.getElementById('dnaLeft'));
        createDNA(document.getElementById('dnaRight'));

        // Generate waveform bars
        const visualizer = document.getElementById('visualizer');
        const barCount = window.innerWidth < 640 ? 20 : 25;
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'wave-bar';
            bar.style.height = '8px';
            visualizer.appendChild(bar);
        }

        // App State
        const state = {
            connected: false,
            transmitting: false,
            currentChannel: 'ANDROMEDA-GALAXY-01',
            callsign: 'CYBORG-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
            txCount: 0,
            rxCount: 0,
            volume: 0.8,
            mediaRecorder: null,
            audioChunks: [],
            client: null
        };

        // DOM Elements
        const statusOrb = document.getElementById('statusOrb');
        const statusText = document.getElementById('statusText');
        const pttButton = document.getElementById('pttButton');
        const messageLog = document.getElementById('messageLog');
        const transmissionStatus = document.getElementById('transmissionStatus');
        const callsignInput = document.getElementById('callsign');
        const volumeSlider = document.getElementById('volume');
        const volumeValue = document.getElementById('volumeValue');
        const frequencyInput = document.getElementById('frequencyInput');
        const setFrequencyBtn = document.getElementById('setFrequencyBtn');
        const currentFreqDisplay = document.getElementById('currentFreqDisplay');
        const energyWaves = document.getElementById('energyWaves').children;
        const coffeeBtn = document.getElementById('coffeeBtn');
        const notification = document.getElementById('notification');

        // Input validation functions
        function sanitizeCallsign(value) {
            return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').substring(0, 10);
        }

        function sanitizeChannel(value) {
            return value.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '').substring(0, 20);
        }

        // Initialize callsign
        callsignInput.value = state.callsign;
        callsignInput.addEventListener('change', (e) => {
            const validated = sanitizeCallsign(e.target.value);
            if (validated) {
                state.callsign = validated;
                e.target.value = state.callsign;
            } else {
                e.target.value = state.callsign;
            }
        });

        // Volume control
        volumeSlider.addEventListener('input', (e) => {
            state.volume = e.target.value / 100;
            volumeValue.textContent = e.target.value + '%';
        });

        // Frequency selection
        function setFrequency() {
            const newFrequency = sanitizeChannel(frequencyInput.value) || 'ANDROMEDA-GALAXY-01';
            frequencyInput.value = newFrequency;
            
            if (newFrequency === state.currentChannel) return;
            
            const oldChannel = state.currentChannel;
            state.currentChannel = newFrequency;
            currentFreqDisplay.textContent = `TUNED: ${newFrequency}`;
            
            if (state.client && state.connected) {
                state.client.unsubscribe(`cyborg/${oldChannel}/audio`);
                state.client.unsubscribe(`cyborg/${oldChannel}/presence`);
                state.client.subscribe(`cyborg/${state.currentChannel}/audio`);
                state.client.subscribe(`cyborg/${state.currentChannel}/presence`);
                
                state.client.publish(`cyborg/${state.currentChannel}/presence`, JSON.stringify({
                    type: 'join',
                    callsign: state.callsign,
                    timestamp: Date.now()
                }));
                
                addMessage('SYSTEM', `Frequency synced to ${state.currentChannel}`, 'system');
            }
            
            playTone(600, 80);
            setTimeout(() => playTone(900, 80), 100);
            setTimeout(() => playTone(1200, 120), 200);
        }
        
        setFrequencyBtn.addEventListener('click', setFrequency);
        frequencyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                setFrequency();
                frequencyInput.blur();
            }
        });

        // Update timestamp
        setInterval(() => {
            document.getElementById('timestamp').textContent = new Date().toTimeString().split(' ')[0];
        }, 1000);

        // Audio context
        let audioContext;
        function initAudio() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        function playTone(frequency, duration, type = 'sine') {
            initAudio();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            gainNode.gain.setValueAtTime(0.1 * state.volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        }

        function playAlienSound(type) {
            initAudio();
            if (type === 'connect') {
                playTone(400, 100);
                setTimeout(() => playTone(600, 100), 100);
                setTimeout(() => playTone(800, 150), 200);
            } else if (type === 'disconnect') {
                playTone(800, 100);
                setTimeout(() => playTone(600, 100), 100);
                setTimeout(() => playTone(400, 150), 200);
            } else if (type === 'receive') {
                playTone(1200, 50);
                setTimeout(() => playTone(1400, 50), 50);
            } else if (type === 'transmit') {
                playTone(600, 80, 'square');
            }
        }

        // Connect to HiveMQ
        function connectMQTT() {
            const clientId = 'cyborg_' + Math.random().toString(16).substr(2, 8);
            
            state.client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
                clientId: clientId,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
            });

            state.client.on('connect', () => {
                state.connected = true;
                statusOrb.className = 'neural-orb connected';
                statusText.textContent = 'NEURAL LINK ACTIVE';
                
                state.client.subscribe(`cyborg/${state.currentChannel}/audio`);
                state.client.subscribe(`cyborg/${state.currentChannel}/presence`);
                
                state.client.publish(`cyborg/${state.currentChannel}/presence`, JSON.stringify({
                    type: 'join',
                    callsign: state.callsign,
                    timestamp: Date.now()
                }));
                
                addMessage('SYSTEM', 'Connected to CYBORG network', 'system');
                playAlienSound('connect');
            });

            state.client.on('error', (err) => {
                console.error('MQTT Error:', err);
                statusText.textContent = 'NEURAL LINK ERROR';
            });

            state.client.on('close', () => {
                state.connected = false;
                statusOrb.className = 'neural-orb disconnected';
                statusText.textContent = 'NEURAL LINK SEVERED';
                playAlienSound('disconnect');
            });

            state.client.on('message', (topic, message) => {
                try {
                    const data = JSON.parse(message.toString());

                    if (topic.endsWith('/audio') && data.callsign !== state.callsign) {
                        // Validate audio data
                        if (typeof data.audio === 'string' && data.audio.length > 0 && data.audio.length < 2000000 && /^[A-Za-z0-9+/]*={0,2}$/.test(data.audio)) {
                            state.rxCount++;
                            document.getElementById('rxCount').textContent = state.rxCount;
                            playReceivedAudio(data.audio);
                            addMessage(data.callsign, 'Voice transmission received', 'incoming');
                            playAlienSound('receive');
                            animateVisualizer(true);
                            setTimeout(() => animateVisualizer(false), 2000);
                        } else {
                            console.error('Invalid audio data received');
                        }
                    } else if (topic.endsWith('/presence') && data.callsign !== state.callsign) {
                        if (data.type === 'join') {
                            addMessage('SYSTEM', `${data.callsign} joined the channel`, 'system');
                        }
                    }
                } catch (e) {
                    console.error('Message parse error:', e);
                }
            });
        }

        // Audio recording
        async function startRecording() {
            try {
                initAudio();
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                state.mediaRecorder = new MediaRecorder(stream);
                state.audioChunks = [];

                state.mediaRecorder.ondataavailable = (event) => {
                    state.audioChunks.push(event.data);
                };

                state.mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Audio = reader.result.split(',')[1];
                        sendAudio(base64Audio);
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };

                state.mediaRecorder.start();
                state.transmitting = true;
                updateTransmitState(true);
            } catch (err) {
                console.error('Error accessing microphone:', err);
                addMessage('ERROR', 'Microphone access denied', 'system');
            }
        }

        function stopRecording() {
            if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
                state.mediaRecorder.stop();
                state.transmitting = false;
                updateTransmitState(false);
            }
        }

        function sendAudio(base64Audio) {
            if (state.connected && state.client) {
                const payload = {
                    callsign: state.callsign,
                    audio: base64Audio,
                    timestamp: Date.now()
                };
                
                state.client.publish(`cyborg/${state.currentChannel}/audio`, JSON.stringify(payload));
                state.txCount++;
                document.getElementById('txCount').textContent = state.txCount;
                addMessage(state.callsign, 'Transmission sent', 'outgoing');
            }
        }

        function playReceivedAudio(base64Audio) {
            const audio = new Audio('data:audio/webm;base64,' + base64Audio);
            audio.volume = state.volume;
            audio.onended = () => {
                pttButton.classList.remove('receiving');
                Array.from(energyWaves).forEach(wave => wave.classList.remove('receiving'));
            };
            pttButton.classList.add('receiving');
            Array.from(energyWaves).forEach(wave => wave.classList.add('receiving'));
            audio.play().catch(e => console.error('Playback error:', e));
        }

        function updateTransmitState(isTransmitting) {
            if (isTransmitting) {
                pttButton.classList.add('active');
                statusOrb.className = 'neural-orb transmitting';
                transmissionStatus.innerHTML = '◆ TRANSMITTING ◆';
                transmissionStatus.style.color = 'var(--alien-warning)';
                playAlienSound('transmit');
                animateVisualizer(true);
                
                Array.from(energyWaves).forEach(wave => wave.classList.add('active'));
            } else {
                pttButton.classList.remove('active');
                statusOrb.className = 'neural-orb connected';
                transmissionStatus.innerHTML = '◇ AWAITING SIGNAL ◇';
                transmissionStatus.style.color = 'rgba(0, 255, 204, 0.4)';
                animateVisualizer(false);
                
                Array.from(energyWaves).forEach(wave => wave.classList.remove('active'));
            }
        }

        let animationFrame;
        function animateVisualizer(active) {
            const bars = visualizer.querySelectorAll('.wave-bar');
            
            if (active) {
                const animate = () => {
                    if (!state.transmitting && !state.playing) {
                        bars.forEach(bar => bar.style.height = '8px');
                        return;
                    }
                    bars.forEach((bar, i) => {
                        const height = Math.random() * 45 + 8;
                        bar.style.height = height + 'px';
                    });
                    animationFrame = requestAnimationFrame(animate);
                };
                animate();
            } else {
                cancelAnimationFrame(animationFrame);
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function addMessage(sender, text, type) {
            const log = document.getElementById('messageLog');
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;

            const time = new Date().toLocaleTimeString();
            const escapedSender = escapeHtml(sender);
            const escapedText = escapeHtml(text);
            entry.innerHTML = `<span style="color: rgba(255,255,255,0.3)">[${time}]</span> <strong>${escapedSender}:</strong> ${escapedText}`;

            const placeholder = log.querySelector('.placeholder-text');
            if (placeholder) placeholder.remove();

            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        // PTT Button events
        pttButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (state.connected) startRecording();
        });

        pttButton.addEventListener('mouseup', () => {
            if (state.transmitting) stopRecording();
        });

        pttButton.addEventListener('mouseleave', () => {
            if (state.transmitting) stopRecording();
        });

        pttButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (state.connected) startRecording();
        });

        pttButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (state.transmitting) stopRecording();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                if (state.connected && !state.transmitting) startRecording();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (state.transmitting) stopRecording();
            }
        });

        // Notification
        function showNotification(message) {
            notification.textContent = message;
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 2000);
        }

        // Coffee Button
        coffeeBtn.addEventListener('click', async () => {
            const upiId = 'nishant.9514-3@waaxis';
            try {
                await navigator.clipboard.writeText(upiId);
                showNotification('UPI COPIED');
                playAlienSound('receive');
            } catch (err) {
                console.error('Failed to copy: ', err);
                showNotification('COPY FAILED');
            }
        });

        // Initialize
        connectMQTT();

        // Simulate active users
        setInterval(() => {
            document.getElementById('activeUsers').textContent = Math.floor(Math.random() * 5) + 1;
        }, 10000);

        // Ambient visualizer animation
        setInterval(() => {
            if (!state.transmitting) {
                const bars = visualizer.querySelectorAll('.wave-bar');
                bars.forEach((bar, i) => {
                    const base = 8;
                    const variation = Math.sin(Date.now() / 300 + i * 0.3) * 6 + 6;
                    bar.style.height = (base + variation) + 'px';
                });
            }
        }, 50);