document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const apodContainer = document.getElementById('apod-container');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const datePicker = document.getElementById('date-picker');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const todayBtn = document.getElementById('today');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const saveBtn = document.getElementById('save-btn');
    const mediaContainer = document.getElementById('media-container');
    
    // NASA API key (consider using environment variables in production)
    const API_KEY = 'G0zUAvtX7R92zwID7Y67j0LNYNVsiQJSCUCjyyKo'; // Replace with your NASA API key
    const API_URL = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;
    
    // Current date and selected date
    let currentDate = new Date();
    let selectedDate = new Date();
    
    // Initialize the app
    init();
    
    function init() {
        // Set up date picker max to today
        const todayStr = formatDate(currentDate);
        datePicker.max = todayStr;
        datePicker.value = todayStr;
        
        // Load today's APOD
        fetchAPOD(todayStr);
        
        // Event listeners
        datePicker.addEventListener('change', handleDateChange);
        prevDayBtn.addEventListener('click', goToPreviousDay);
        nextDayBtn.addEventListener('click', goToNextDay);
        todayBtn.addEventListener('click', goToToday);
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        saveBtn.addEventListener('click', saveAPOD);
    }
    
    async function fetchAPOD(date) {
        showLoading();
        hideError();
        apodContainer.style.display = 'none';
        
        try {
            const response = await fetch(`${API_URL}&date=${date}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch APOD data');
            }
            
            const data = await response.json();
            
            // Check if the media is an image or video
            if (data.media_type === 'image') {
                displayImageAPOD(data);
            } else if (data.media_type === 'video') {
                displayVideoAPOD(data);
            } else {
                throw new Error('Unknown media type');
            }
            
            // Update UI with APOD data
            document.getElementById('apod-title').textContent = data.title;
            document.getElementById('apod-date').textContent = formatDisplayDate(date);
            document.getElementById('apod-explanation').textContent = data.explanation;
            
            hideLoading();
            apodContainer.style.display = 'block';
        } catch (error) {
            console.error('Error fetching APOD:', error);
            showError('Failed to load the Astronomy Picture of the Day. Please try again later.');
            hideLoading();
        }
    }
    
    function displayImageAPOD(data) {
        mediaContainer.innerHTML = `
            <img src="${data.url}" alt="${data.title}" id="apod-image">
            ${data.copyright ? `<p class="copyright">Copyright: ${data.copyright}</p>` : ''}
        `;
    }
    
    function displayVideoAPOD(data) {
        // Extract YouTube ID if it's a YouTube URL
        let videoUrl = data.url;
        if (data.url.includes('youtube.com') || data.url.includes('youtu.be')) {
            const videoId = data.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)[1];
            videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
        }
        
        mediaContainer.innerHTML = `
            <iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe>
            ${data.copyright ? `<p class="copyright">Copyright: ${data.copyright}</p>` : ''}
        `;
    }
    
    function handleDateChange() {
        selectedDate = new Date(datePicker.value);
        fetchAPOD(datePicker.value);
    }
    
    function goToPreviousDay() {
        selectedDate.setDate(selectedDate.getDate() - 1);
        updateDatePicker();
        fetchAPOD(formatDate(selectedDate));
    }
    
    function goToNextDay() {
        // Don't allow going beyond current date
        if (selectedDate >= currentDate) return;
        
        selectedDate.setDate(selectedDate.getDate() + 1);
        updateDatePicker();
        fetchAPOD(formatDate(selectedDate));
    }
    
    function goToToday() {
        selectedDate = new Date();
        updateDatePicker();
        fetchAPOD(formatDate(selectedDate));
    }
    
    function updateDatePicker() {
        datePicker.value = formatDate(selectedDate);
    }
    
    function toggleFullscreen() {
        const apodImage = document.getElementById('apod-image');
        if (!apodImage) return;
        
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'fullscreen';
        fullscreenDiv.innerHTML = `
            <button class="close-btn"><i class="fas fa-times"></i></button>
            <div class="media-container">
                <img src="${apodImage.src}" alt="${document.getElementById('apod-title').textContent}">
            </div>
            <h2>${document.getElementById('apod-title').textContent}</h2>
        `;
        
        document.body.appendChild(fullscreenDiv);
        
        const closeBtn = fullscreenDiv.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(fullscreenDiv);
        });
    }
    
    function saveAPOD() {
        const apodImage = document.getElementById('apod-image');
        if (!apodImage) {
            alert('Cannot save video content. This feature works only for images.');
            return;
        }
        
        const link = document.createElement('a');
        link.href = apodImage.src;
        link.download = `NASA-APOD-${datePicker.value}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function showLoading() {
        loadingElement.style.display = 'block';
    }
    
    function hideLoading() {
        loadingElement.style.display = 'none';
    }
    
    function showError(message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    function hideError() {
        errorElement.style.display = 'none';
    }
    
    // Helper functions
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    function formatDisplayDate(dateStr) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    }
});
