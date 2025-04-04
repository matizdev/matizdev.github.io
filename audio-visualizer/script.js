document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const audioUpload = document.getElementById('audio-upload');
    const fileInfo = document.getElementById('file-info');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const volumeControl = document.getElementById('volume-control');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');

    // Audio context and variables
    let audioContext;
    let analyser;
    let dataArray;
    let source;
    let audioElement;
    let isPlaying = false;
    let animationId;

    // Set canvas dimensions
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // File upload handler
    audioUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        fileInfo.textContent = file.name;

        if (audioElement) {
            audioElement.pause();
            cancelAnimationFrame(animationId);
            if (source) source.disconnect();
        }

        audioElement = new Audio(URL.createObjectURL(file));
        setupAudioContext();

        // Enable controls
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        volumeControl.disabled = false;

        // Set up event listeners for the audio element
        audioElement.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audioElement.duration);
        });

        audioElement.addEventListener('timeupdate', () => {
            currentTimeEl.textContent = formatTime(audioElement.currentTime);
        });

        audioElement.addEventListener('ended', () => {
            isPlaying = false;
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            cancelAnimationFrame(animationId);
        });
    });

    // Set up audio context and analyzer
    function setupAudioContext() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }

    // Play/pause controls
    playBtn.addEventListener('click', () => {
        if (!audioElement) return;
        
        // Resume audio context if it was suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        audioElement.play();
        isPlaying = true;
        playBtn.disabled = true;
        pauseBtn.disabled = false;
        drawVisualizer();
    });

    pauseBtn.addEventListener('click', () => {
        if (!audioElement) return;
        
        audioElement.pause();
        isPlaying = false;
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        cancelAnimationFrame(animationId);
    });

    // Volume control
    volumeControl.addEventListener('input', (e) => {
        if (audioElement) {
            audioElement.volume = e.target.value;
        }
    });

    // Format time (seconds to MM:SS)
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Visualizer drawing function
    function drawVisualizer() {
        if (!isPlaying) return;
        
        animationId = requestAnimationFrame(drawVisualizer);
        
        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / dataArray.length) * 2.5;
        let x = 0;
        
        // Gradient for the bars
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#6c5ce7');
        gradient.addColorStop(0.5, '#a29bfe');
        gradient.addColorStop(1, '#00cec9');
        
        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            
            // Calculate color based on frequency and position
            const hue = i / dataArray.length * 360;
            ctx.fillStyle = gradient;
            
            // Draw the bar with rounded corners
            const roundedHeight = Math.max(barHeight, 2);
            ctx.beginPath();
            ctx.roundRect(x, canvas.height - roundedHeight, barWidth, roundedHeight, [5, 5, 0, 0]);
            ctx.fill();
            
            // Add a subtle reflection effect at the top of each bar
            if (barHeight > 10) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.roundRect(x, canvas.height - roundedHeight, barWidth, 2, [2, 2, 0, 0]);
                ctx.fill();
            }
            
            x += barWidth + 2;
        }
        
        // Add a subtle pulse effect to the background
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = `rgba(108, 92, 231, ${0.02 + Math.sin(Date.now() / 500) * 0.02})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }
});
