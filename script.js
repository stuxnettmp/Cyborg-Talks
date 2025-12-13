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
            playing: false,
            currentChannel: 'ANDROMEDA-GALAXY-01',
            callsign: 'CYBORG-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
            txCount: 0,
            rxCount: 0,
            volume: 0.8,
            mediaRecorder: null,
            audioChunks: [],
            activeAudios: [],
            client: null
        };
        let userInteracted = false;

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
            return value.trim();
        }

        function sanitizeChannel(value) {
            return value.trim();
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
        async function setFrequency() {
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

            await playTone(600, 80);
            setTimeout(async () => await playTone(900, 80), 100);
            setTimeout(async () => await playTone(1200, 120), 200);
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
        async function initAudio() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('AudioContext created, state:', audioContext.state);
            }
            if (audioContext.state === 'suspended' && userInteracted) {
                console.log('Attempting to resume AudioContext, current state:', audioContext.state);
                try {
                    await audioContext.resume();
                    console.log('AudioContext resumed successfully, new state:', audioContext.state);
                } catch (err) {
                    console.error('Failed to resume AudioContext:', err);
                }
            } else {
                console.log('AudioContext state:', audioContext.state, 'userInteracted:', userInteracted);
            }
        }

        async function playTone(frequency, duration, type = 'sine') {
            await initAudio();
            console.log('playTone called, audioContext state:', audioContext.state);
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;
            gainNode.gain.setValueAtTime(0.3 * state.volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        }

        async function playAlienSound(type) {
            if (!userInteracted) return;
            await initAudio();
            if (type === 'connect') {
                await playTone(400, 100);
                setTimeout(async () => await playTone(600, 100), 100);
                setTimeout(async () => await playTone(800, 150), 200);
            } else if (type === 'disconnect') {
                await playTone(800, 100);
                setTimeout(async () => await playTone(600, 100), 100);
                setTimeout(async () => await playTone(400, 150), 200);
            } else if (type === 'receive') {
                await playTone(1200, 50);
                setTimeout(async () => await playTone(1400, 50), 50);
            } else if (type === 'transmit') {
                await playTone(600, 80, 'square');
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
                        } else {
                            // Invalid audio data received
                        }
                    } else if (topic.endsWith('/presence') && data.callsign !== state.callsign) {
                        if (data.type === 'join') {
                            addMessage('SYSTEM', `${data.callsign} joined the channel`, 'system');
                        }
                    }
                } catch (e) {
                    // Message parse error
                }
            });
        }

        // Audio recording
        async function startRecording() {
            try {
                await initAudio();
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = audioContext.createMediaStreamSource(stream);
                recordingAnalyser = audioContext.createAnalyser();
                recordingAnalyser.fftSize = 256;
                source.connect(recordingAnalyser);
                state.mediaRecorder = new MediaRecorder(stream);
                state.audioChunks = [];

                state.mediaRecorder.ondataavailable = (event) => {
                    state.audioChunks.push(event.data);
                };

                state.mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
                    console.log('Audio blob size:', audioBlob.size);
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
                visualizer.classList.add('receiving');
            } catch (err) {
                // Error accessing microphone
                // Microphone access failed, resetting transmitting state
                state.transmitting = false;
                updateTransmitState(false);
                addMessage('ERROR', 'Microphone access denied', 'system');
            }
        }

        function stopRecording() {
            if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
                state.mediaRecorder.stop();
                state.transmitting = false;
                updateTransmitState(false);
                visualizer.classList.remove('receiving');
                if (recordingAnalyser) {
                    recordingAnalyser.disconnect();
                    recordingAnalyser = null;
                }
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
            if (!userInteracted) {
                return;
            }
            console.log('Attempting to play received audio, base64 length:', base64Audio.length);
            const audio = new Audio('data:audio/webm;base64,' + base64Audio);
            console.log('Audio src set, duration:', audio.duration, 'readyState:', audio.readyState);
            audio.volume = state.volume;
            audio.style.display = 'none';
            document.body.appendChild(audio);
            state.activeAudios.push(audio);
            audio.onended = () => {
                audio.remove();
                pttButton.classList.remove('receiving');
                visualizer.classList.remove('receiving');
                state.playing = false;
                transmissionStatus.innerHTML = '◇ AWAITING SIGNAL ◇';
                transmissionStatus.style.color = 'rgba(0, 255, 204, 0.4)';
                animateVisualizer(false);
                // Array.from(energyWaves).forEach(wave => wave.classList.remove('receiving'));
                state.activeAudios = state.activeAudios.filter(a => a !== audio);
            };
            audio.onerror = (e) => {
                audio.remove();
                state.activeAudios = state.activeAudios.filter(a => a !== audio);
            };
            pttButton.classList.add('receiving');
            visualizer.classList.add('receiving');
            state.playing = true;
            transmissionStatus.innerHTML = '◆ RECEIVING SIGNAL ◆';
            transmissionStatus.style.color = 'var(--alien-energy)';
            animateVisualizer(true, audio);
            // Array.from(energyWaves).forEach(wave => wave.classList.add('receiving'));
            audio.play().then(() => {
                console.log('Received audio playback started successfully');
            }).catch(e => {
                console.error('Received audio playback failed:', e);
                // Playback error
                // Audio play failed, cleaning up
                // Reset state if playback fails
                pttButton.classList.remove('receiving');
                visualizer.classList.remove('receiving');
                state.playing = false;
                transmissionStatus.innerHTML = '◇ AWAITING SIGNAL ◇';
                transmissionStatus.style.color = 'rgba(0, 255, 204, 0.4)';
                animateVisualizer(false);
                audio.remove();
                state.activeAudios = state.activeAudios.filter(a => a !== audio);
            });
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
        let analyser;
        let dataArray;
        let recordingAnalyser;
        function animateVisualizer(active, audioElement = null) {
            const bars = visualizer.querySelectorAll('.wave-bar');

            if (active && audioElement) {
                // Real-time visualization for receiving
                initAudio();
                const source = audioContext.createMediaElementSource(audioElement);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                source.connect(analyser);
                analyser.connect(audioContext.destination);

                const animate = () => {
                    if (!state.transmitting && !state.playing) {
                        bars.forEach(bar => bar.style.height = '8px');
                        return;
                    }
                    analyser.getByteFrequencyData(dataArray);
                    bars.forEach((bar, i) => {
                        const value = dataArray[i * 2] || 0;
                        const height = (value / 255) * 45 + 8;
                        bar.style.height = height + 'px';
                    });
                    animationFrame = requestAnimationFrame(animate);
                };
                animate();
            } else if (active && recordingAnalyser) {
                // Real-time visualization for recording
                analyser = recordingAnalyser;
                if (!dataArray) {
                    const bufferLength = analyser.frequencyBinCount;
                    dataArray = new Uint8Array(bufferLength);
                }

                const animate = () => {
                    if (!state.transmitting && !state.playing) {
                        bars.forEach(bar => bar.style.height = '8px');
                        return;
                    }
                    analyser.getByteFrequencyData(dataArray);
                    bars.forEach((bar, i) => {
                        const value = dataArray[i * 2] || 0;
                        const height = (value / 255) * 45 + 8;
                        bar.style.height = height + 'px';
                    });
                    animationFrame = requestAnimationFrame(animate);
                };
                animate();
            } else if (active) {
                // Random animation for transmitting
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
                if (analyser) {
                    analyser.disconnect();
                    analyser = null;
                }
                if (recordingAnalyser) {
                    recordingAnalyser.disconnect();
                    recordingAnalyser = null;
                }
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
                showNotification('COPY FAILED');
            }
        });

        // Initialize
        connectMQTT();

        document.addEventListener('click', () => {
            console.log('User clicked, setting userInteracted to true');
            userInteracted = true;
            if (audioContext && audioContext.state === 'suspended') {
                console.log('Resuming AudioContext on click');
                audioContext.resume().then(() => {
                    console.log('AudioContext resumed on click, state:', audioContext.state);
                }).catch(err => {
                    console.error('Failed to resume on click:', err);
                });
            }
        });

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