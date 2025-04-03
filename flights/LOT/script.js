// Mock flight data generator
function getMockFlights() {
    const airports = ['WAW', 'JFK', 'LHR', 'CDG', 'FRA', 'ORD'];
    const statuses = ['Landed', 'On Time', 'Delayed', 'Boarding', 'Departed'];
    const aircraft = ['Boeing 787-9', 'Boeing 737-800', 'Embraer 195'];
    
    return Array.from({ length: 10 }, () => ({
        flightNumber: `LO${Math.floor(Math.random() * 1000)}`,
        departure: airports[Math.floor(Math.random() * airports.length)],
        arrival: airports[Math.floor(Math.random() * airports.length)],
        scheduledTime: new Date(Date.now() + Math.random() * 86400000).toLocaleTimeString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        aircraft: aircraft[Math.floor(Math.random() * aircraft.length)]
    }));
}

// DOM Elements
const refreshButton = document.getElementById('refreshButton');
const flightsTableBody = document.getElementById('flightsTableBody');
const errorMessage = document.getElementById('errorMessage');

// Helper function to get status badge class
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'landed': return 'status-landed';
        case 'delayed': return 'status-delayed';
        case 'boarding': return 'status-boarding';
        case 'departed': return 'status-departed';
        default: return 'status-scheduled';
    }
}

// Update flights table
function updateFlightsTable(flights) {
    flightsTableBody.innerHTML = flights.map(flight => `
        <tr>
            <td>
                <div class="flight-number">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>
                    </svg>
                    ${flight.flightNumber}
                </div>
            </td>
            <td>
                <div class="route">
                    <span>${flight.departure}</span>
                    <span class="route-arrow">→</span>
                    <span>${flight.arrival}</span>
                </div>
            </td>
            <td>${flight.scheduledTime}</td>
            <td>${flight.aircraft}</td>
            <td>
                <span class="status-badge ${getStatusClass(flight.status)}">
                    ${flight.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// Fetch and update flights
async function fetchFlights() {
    refreshButton.classList.add('loading');
    errorMessage.style.display = 'none';

    try {
        // In a real application, this would be an API call
        const flights = getMockFlights();
        updateFlightsTable(flights);
    } catch (error) {
        errorMessage.style.display = 'block';
    } finally {
        refreshButton.classList.remove('loading');
    }
}

// Event listeners
refreshButton.addEventListener('click', fetchFlights);

// Initial load
fetchFlights();

// Auto-refresh every minute
setInterval(fetchFlights, 60000);
