# Cyborg-Talk

Hey folks! This is Cyborg-Talk, a fun little web app I whipped up for real-time voice chatting with a sci-fi flair. Think of it as your own alien neural link for talking to friends over the net.

## What's This All About?

I built this to experiment with MQTT and Web Audio API, creating a push-to-talk voice comms system that feels like you're operating some advanced cyborg tech. No fancy servers – just connects to a public MQTT broker and lets you chat in channels. It's all browser-based, so no installs needed.

## Key Features

- **Push-to-Talk (PTT)**: Hold the transmit button or hit spacebar to record and send your voice. Release to transmit.
- **Channel Switching**: Tune into different "frequency channels" like ANDROMEDA-GALAXY-01 to chat in groups.
- **Real-Time Voice**: Low-latency audio playback from others on the same channel.
- **Immersive UI**: Holographic device look with animated backgrounds, waveforms, and space themes.
- **Stats Tracking**: Keeps count of messages sent and received.
- **Audio Controls**: Adjust volume, get feedback tones for actions.
- **Presence Notifications**: See when people join or leave the channel.
- **Mobile Friendly**: Works on phones too, though best on desktop for full experience.

## How to Get Started

1. Just open `index.html` in your web browser (Chrome or Firefox recommended for audio stuff).
2. Punch in a callsign (your handle) and pick a channel.
3. Hit "Establish Neural Link" to connect via MQTT.
4. Allow mic access when prompted.
5. Start chatting! Hold to talk, release to send.

That's it. If the connection drops, it'll try to reconnect automatically.

## Tech Under the Hood

- **Frontend**: HTML, CSS with Tailwind, and vanilla JavaScript.
- **Messaging**: MQTT over WebSockets to HiveMQ's public broker.
- **Audio**: Web Audio API for recording, playback, and sound effects.
- **Styling**: Custom CSS for the sci-fi aesthetic, responsive design.

I kept it simple – no frameworks beyond what's needed, all in one page.

## Why I Made This

Just for fun and to learn. It's cool to see how MQTT can handle real-time stuff, and the UI was a blast to design. If you're into sci-fi or just want a quirky way to voice chat, give it a shot.

## Donate or Support

If you dig it and want to buy me a coffee, here's my UPI ID: nishant.9514-3@waaxis (copy it from the app too).

## Find Me Online

- [Facebook](https://www.facebook.com/stuxnet)
- [Instagram](https://www.instagram.com/stuxnet)
- [Twitter](https://twitter.com/stuxnet)
- [GitHub](https://github.com/stuxnet)

Feel free to fork, tweak, or just say hi!

Version: CYBORG_TECH NEURAL SYSTEMS v9.7.3