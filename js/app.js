const demo = document.getElementById("demo");
const form = document.querySelector('.form-dist');
let map = null;
form.addEventListener('submit', function(event) {
    event.preventDefault();
    getCoords();
});
async function success(pos) {
    if (map) map.remove();
    map = L.map('map').setView([pos.coords.latitude, pos.coords.longitude], 13);
    console.log(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const marker = L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map);
    const apiKey = process.API_KEY;
    const distance = document.getElementById('distance-input').value;
    console.log(pos.coords.latitude, pos.coords.longitude, distance)

    const url = `https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&radius=${distance * 1000}&sort_by=distance&limit=30`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            "x-requested-with": "xmlhttprequest", //TODO: check if useful or not ?
            "Access-Control-Allow-Origin":"*",
            Authorization: `Bearer ${apiKey}`
        }
    };

    await fetch(url, options)
        .then(response => response.json())
        .then(data => {
            const businesses = data.businesses;
            let circle = L.circle([pos.coords.latitude, pos.coords.longitude], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
                radius: distance * 1000
            }).addTo(map);

            for (let i = 0; i < businesses.length; i++) {
                const business = businesses[i];
                console.log(business)
                const marker = L.marker([business.coordinates.latitude, business.coordinates.longitude]).addTo(map);
                marker.bindPopup(business.name).openPopup();
            }

            localStorage.setItem('lastSearchResults', JSON.stringify(businesses));
        })
        .catch(error => {
            console.error('Erreur lors de la recherche de restaurants :', error);
        });
}

const lastSearchResults = JSON.parse(localStorage.getItem('lastSearchResults'));
if (lastSearchResults) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';

    for (let i = 0; i < lastSearchResults.length; i++) {
        const business = lastSearchResults[i];

        const card = document.createElement('div');
        card.classList.add('restaurant-card');

        const name = document.createElement('h2');
        name.textContent = business.name;
        card.appendChild(name);

        const address = document.createElement('p');
        address.textContent = `${business.location.address1}, ${business.location.city}, ${business.location.state} ${business.location.zip_code}`;
        card.appendChild(address);

        resultsContainer.appendChild(card);
    }
}

function error(err){
    demo.innerHTML = `Failed to locate. Error: ${err.message}`
}
function getCoords(){
    if(navigator.geolocation){
        const dist = document.getElementById('distance-input').value;
        navigator.geolocation.getCurrentPosition(success,error);
    }else{
        demo.innerHTML = "Geolocation is not supported by this browser";
    }
}