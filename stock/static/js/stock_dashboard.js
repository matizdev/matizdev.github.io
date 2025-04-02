document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const stockSearchForm = document.getElementById('stock-search-form');
    const stockSymbolInput = document.getElementById('stock-symbol');
    const timePeriodSelect = document.getElementById('time-period');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorAlert = document.getElementById('error-alert');
    const errorMessage = document.getElementById('error-message');
    const stockDataContainer = document.getElementById('stock-data-container');
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    
    // Chart instances
    let priceChart = null;
    let volumeChart = null;
    
    // Current stock symbol and time period
    let currentSymbol = 'AAPL'; // Default stock
    let currentPeriod = '1mo'; // Default period
    
    // Auto-refresh interval
    let refreshInterval = null;
    const REFRESH_INTERVAL_SECONDS = 60;
    
    // Format numbers
    function formatNumber(num) {
        return num ? num.toLocaleString() : '0';
    }
    
    // Format currency
    function formatCurrency(num, currency = 'USD') {
        if (!num) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(num);
    }
    
    // Format market cap
    function formatMarketCap(marketCap) {
        if (!marketCap) return '$0';
        
        if (marketCap >= 1e12) {
            return '$' + (marketCap / 1e12).toFixed(2) + 'T';
        } else if (marketCap >= 1e9) {
            return '$' + (marketCap / 1e9).toFixed(2) + 'B';
        } else if (marketCap >= 1e6) {
            return '$' + (marketCap / 1e6).toFixed(2) + 'M';
        } else {
            return '$' + formatNumber(marketCap);
        }
    }
    
    // Create or update the price chart
    function createPriceChart(dates, prices) {
        const ctx = document.getElementById('price-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (priceChart) {
            priceChart.destroy();
        }
        
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Price',
                    data: prices,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            borderDash: [2, 2]
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
    
    // Create or update the volume chart
    function createVolumeChart(dates, volumes) {
        const ctx = document.getElementById('volume-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (volumeChart) {
            volumeChart.destroy();
        }
        
        volumeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Volume',
                    data: volumes,
                    backgroundColor: 'rgba(52, 152, 219, 0.5)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return 'Volume: ' + formatNumber(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            borderDash: [2, 2]
                        },
                        ticks: {
                            callback: function(value) {
                                if (value >= 1e9) {
                                    return (value / 1e9).toFixed(1) + 'B';
                                } else if (value >= 1e6) {
                                    return (value / 1e6).toFixed(1) + 'M';
                                } else if (value >= 1e3) {
                                    return (value / 1e3).toFixed(1) + 'K';
                                }
                                return value;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
    
    // Update the UI with stock data
    function updateStockData(data) {
        // Update the stock header
        document.getElementById('stock-name').textContent = `${data.summary.name} (${data.summary.symbol})`;
        document.getElementById('stock-price').textContent = formatCurrency(data.summary.price, data.summary.currency);
        document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
        
        // Update the stock change
        const changeEl = document.getElementById('stock-change');
        const change = data.summary.change;
        const changePercent = data.summary.change_percent;
        
        let changeText = `${change >= 0 ? '+' : ''}${formatCurrency(change, data.summary.currency)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
        let badgeClass = change >= 0 ? 'bg-success' : 'bg-danger';
        
        changeEl.innerHTML = `<span class="badge ${badgeClass}">${changeText}</span>`;
        
        // Update key metrics
        document.getElementById('previous-close').textContent = formatCurrency(data.summary.previous_close, data.summary.currency);
        document.getElementById('open-price').textContent = formatCurrency(data.summary.open, data.summary.currency);
        document.getElementById('day-range').textContent = `${formatCurrency(data.summary.day_low, data.summary.currency)} - ${formatCurrency(data.summary.day_high, data.summary.currency)}`;
        document.getElementById('52-week-range').textContent = `${formatCurrency(data.summary.fifty_two_week_low, data.summary.currency)} - ${formatCurrency(data.summary.fifty_two_week_high, data.summary.currency)}`;
        document.getElementById('volume').textContent = formatNumber(data.summary.volume);
        document.getElementById('avg-volume').textContent = formatNumber(data.summary.avg_volume);
        document.getElementById('market-cap').textContent = formatMarketCap(data.summary.market_cap);
        document.getElementById('pe-ratio').textContent = data.summary.pe_ratio ? data.summary.pe_ratio.toFixed(2) : 'N/A';
        document.getElementById('eps').textContent = formatCurrency(data.summary.eps, data.summary.currency);
        document.getElementById('dividend-yield').textContent = data.summary.dividend_yield ? (data.summary.dividend_yield * 100).toFixed(2) + '%' : 'N/A';
        
        // Create or update charts
        createPriceChart(data.chart.dates, data.chart.prices);
        createVolumeChart(data.chart.dates, data.chart.volumes);
        
        // Show the stock data container
        stockDataContainer.classList.remove('d-none');
    }
    
    // Fetch stock data from the API
    function fetchStockData(symbol, period) {
        // Show loading spinner, hide error and data container
        loadingSpinner.classList.remove('d-none');
        errorAlert.classList.add('d-none');
        stockDataContainer.classList.add('d-none');
        
        // Fetch the data from the API
        fetch(`/api/stock_data?symbol=${symbol}&period=${period}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'An error occurred while fetching stock data');
                    });
                }
                return response.json();
            })
            .then(data => {
                // Update the current symbol and period
                currentSymbol = symbol;
                currentPeriod = period;
                
                // Update the UI with the stock data
                updateStockData(data);
            })
            .catch(error => {
                // Show error message
                errorMessage.textContent = error.message;
                errorAlert.classList.remove('d-none');
                stockDataContainer.classList.add('d-none');
                console.error('Error:', error);
            })
            .finally(() => {
                // Hide loading spinner
                loadingSpinner.classList.add('d-none');
            });
    }
    
    // Handle form submission
    stockSearchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const symbol = stockSymbolInput.value.trim().toUpperCase();
        const period = timePeriodSelect.value;
        
        if (symbol) {
            fetchStockData(symbol, period);
        }
    });
    
    // Handle auto-refresh toggle
    autoRefreshToggle.addEventListener('change', function() {
        if (this.checked) {
            // Start auto-refresh
            refreshInterval = setInterval(() => {
                if (currentSymbol) {
                    fetchStockData(currentSymbol, currentPeriod);
                }
            }, REFRESH_INTERVAL_SECONDS * 1000);
        } else {
            // Stop auto-refresh
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    });
    
    // Handle time period change
    timePeriodSelect.addEventListener('change', function() {
        if (currentSymbol) {
            fetchStockData(currentSymbol, this.value);
        }
    });
    
    // Load default stock data on page load
    fetchStockData(currentSymbol, currentPeriod);
});
