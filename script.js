import { citiesArray } from './constants.js'
import { storeList } from './constants.js'


let fetchedData

fetch('http://158.160.154.213/api/partners/')
    .then(res => res.json())
    .then(resData => {
        fetchedData = JSON.parse(JSON.stringify(resData))
        console.log(fetchedData)
    })
    .catch(e => {
        console.error(e)
    })

/* MAP */

const searchInput = document.getElementById('city-input');

function init() {
    const partnersListButton = document.getElementById('partners-list-button')
    const popupPartnersList = document.getElementById('popup-partners-list')
    const closeButtonPartnersList = document.getElementsByClassName("popup-filter__close-button")[3];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    navigator.geolocation.getCurrentPosition(function (position) {

        let filteredStoreList = [];

        const map = new ymaps.Map('map', {
            center: [position.coords.latitude, position.coords.longitude],
            zoom: 8,
            controls: ['smallMapDefaultSet', 'routeButtonControl']
        });

        map.controls.remove('trafficControl')
        map.controls.remove('typeSelector');
        map.controls.remove("taxi")

        const control = map.controls.get('routeButtonControl')
        control.routePanel.state.set({
            type: 'auto',
            fromEnabled: true,
            toEnabled: true,
        })
        control.routePanel.options.set({
            types: {
                auto: true,
                pedestrian: true,
            }
        })

        function findCity(city) {
            const array = filteredStoreList.length == 0 ? storeList : filteredStoreList
            return array.filter(item => {
                return item.address.toLowerCase().includes(city.toLowerCase());
            });
        }

        function getCenter(city) {
            ymaps.geocode(city)
                .then(function (result) {
                    const coords = result.geoObjects.get(0).geometry.getCoordinates();
                    map.setCenter(coords, 10);
                })
                .catch(function (error) {
                    console.log('Ошибка геокодирования:', error);
                });
        }

        function createPartnersList(item) {
            const li = document.createElement('li');
            li.classList.add('popup-filter__store')

            const div = document.createElement('div')
            div.classList.add('popup-filter__store-item')

            const title = document.createElement('h3')
            title.classList.add('popup-filter__store-info')
            title.textContent = item.name
            div.appendChild(title)

            const address = document.createElement('p')
            address.classList.add('popup-filter__store-info')
            address.textContent = item.address
            div.appendChild(address)

            const phone = document.createElement('p')
            phone.classList.add('popup-filter__store-info')
            phone.textContent = item.phone
            div.appendChild(phone)

            const website = document.createElement('p')
            website.classList.add('popup-filter__store-info')
            website.textContent = item.website
            div.appendChild(website)

            li.appendChild(div)

            const imgArrow = document.createElement('img')
            imgArrow.src = './images/icon-goto-arrow.svg'
            imgArrow.alt = 'go to icon'
            imgArrow.classList.add('popup-filter__store-icon')
            li.appendChild(imgArrow)

            partnersListContainer.appendChild(li);
            li.addEventListener('click', function () {
                popupPartnersList.style.display = "none";
                getCenter(item.address)
            })
        }

        function filterCities() {
            const searchText = searchInput.value.toLowerCase();
            const filteredCities = citiesArray.filter(city => city.toLowerCase().startsWith(searchText));
            citiesList.innerHTML = '';
            const cityArray = filteredCities ? filteredCities : citiesArray
            cityArray.forEach(city => {
                const li = document.createElement('li');
                li.textContent = city;
                li.classList.add('popup-filter__city')
                citiesList.appendChild(li);
                li.addEventListener('click', function () {
                    cityFilterPopup.style.display = "none";
                    searchInput.value = ''
                    filterCities()
                    getCenter(city)
                    const filteredByCities = findCity(city)
                    console.log(filteredByCities)
                    partnersListContainer.innerHTML = ''
                    const list = filteredByCities.reverse()
                    list.forEach(item => {
                        console.log(item)
                        createPartnersList(item)
                    })
                })
            });
        }
        filterCities()
        searchInput.addEventListener('input', filterCities);

        function addPlacemark(storeList) {
            const reversedStoreList = storeList.reverse()
            reversedStoreList.forEach(store => {
                const placemark = new ymaps.Placemark([store.latitude, store.longitude], {
                    balloonContentHeader: store.name,
                    balloonContentBody: `<p>Адрес: ${store.address}</p> <p>Тел:${store.phone}</p> <p>Ассортимент: ${store.parts_available.map(part => part.name).join(', ')}</p><button class="route-button">Построить маршрут</button>`,
                    balloonContentFooter: `Наш сайт: <a href=${store.website}>${store.website}</a>`
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: 'https://cdn-icons-png.flaticon.com/512/15219/15219090.png',
                    iconImageSize: [40, 40],
                    iconImageOffset: [0, 0]
                });

                placemark.events.add('balloonopen', () => {
                    const button = document.querySelector('.route-button');
                    button.addEventListener('click', () => {
                        storeLocation = store.address;

                        let location = ymaps.geolocation.get();
                        location.then(function (res) {
                            let locationText = res.geoObjects.get(0).properties.get('text');

                            control.routePanel.state.set({
                                from: locationText,
                                to: `${store.latitude},${store.longitude}`
                            });
                        });
                        console.log('click');
                    });
                });
                map.geoObjects.add(placemark);
                createPartnersList(store)

                partnersListButton.addEventListener("click", function () {
                    popupPartnersList.style.display = "block";
                });

                closeButtonPartnersList.addEventListener("click", function () {
                    popupPartnersList.style.display = "none";
                });
            });
        }

        addPlacemark(storeList)

        function filterStoreList() {
            const selectedParts = Array.from(document.querySelectorAll('.popup-filter__engine-checkbox:checked')).map(checkbox => checkbox.value);
            filteredStoreList = storeList.filter(store => {
                return selectedParts.some(selectedPart => {
                    return store.parts_available.some(part => part.name === selectedPart);
                });
            });
        }

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                filterStoreList()
                displayStores()
            });
        });

        function displayStores() {
            map.geoObjects.removeAll();
            partnersListContainer.innerHTML = '';
            const array = filteredStoreList.length == 0 ? storeList : filteredStoreList
            addPlacemark(array)
        }
    })
}
ymaps.ready(init);

/* Бургер Меню */

const popupMenu = document.querySelector(".popup-menu")
const burgerButton = document.getElementById('header-nav-burger');
const popupCloseButton = document.getElementById('popup-menu-close');

burgerButton.addEventListener('click', () => {
    popupMenu.style.display = "block";
});

popupCloseButton.addEventListener('click', () => {
    popupMenu.style.display = "none";
});

/* Фильтр по типу двигателя */

const filterPopup = document.getElementById("popup-engine-filter");
const engineFilterButton = document.getElementById("engine-filter");
const submitEngineFilterButton = document.getElementById("engine-filter-submit-button");

engineFilterButton.addEventListener("click", function () {
    filterPopup.style.display = "block";
});

submitEngineFilterButton.addEventListener("click", function (event) {
    event.preventDefault()
    filterPopup.style.display = "none";
});

/* Фильтр по партнерам */

const partnersFilterPopup = document.getElementById("popup-partners-filter");
const partnersFilterButton = document.getElementById("partner-filter");
const toggleButton = document.getElementById('toggleButton')
const partnersSubmitButton = document.getElementById('partners-filter-submit-button')

partnersFilterButton.addEventListener("click", function () {
    partnersFilterPopup.style.display = "block";
});

toggleButton.addEventListener('change', function () {
    if (this.checked) {
        console.log('Бегунок активен');
    } else {
        console.log('Бегунок не активен');
    }
});

partnersSubmitButton.addEventListener('click', function (e) {
    e.preventDefault()
    partnersFilterPopup.style.display = "none";
    console.log('Здесь еще что-то будет')
})

/* Фильтр по городам */

const cityFilterPopup = document.getElementById("popup-city-filter");
const cityFilterButton = document.getElementById("city-filter");
const closeButtonCity = document.getElementsByClassName("popup-filter__close-button")[2];
const citiesList = document.getElementById('cities-list')

cityFilterButton.addEventListener("click", function () {
    cityFilterPopup.style.display = "block";
});

closeButtonCity.addEventListener("click", function () {
    cityFilterPopup.style.display = "none";
    searchInput.value = ''
});

/* Список партнеров */

const partnersListButton = document.getElementById('partners-list-button')
const popupPartnersList = document.getElementById('popup-partners-list')
const partnersListContainer = document.getElementById('partners-list')

partnersListButton.addEventListener("click", function () {
    popupPartnersList.style.display = "block";
});


/* Закрытие попапов */

const popup = document.querySelectorAll('.popup-filter__content');
const overlay = document.querySelectorAll('.popup-filter');
const closeButtons = document.querySelectorAll('.popup-filter__close-button');

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const overlay = button.closest('.popup-filter');
        overlay.style.display = "none";;
    });
});

overlay.forEach(item => {
    item.addEventListener('click', function () {
        item.style.display = 'none';
    });
})

popup.forEach(item => {
    item.addEventListener('click', function (event) {
        event.stopPropagation();
    });
})




/* citiesArray.map(city => {
    const cityName = document.createElement('li');
    cityName.textContent = city;
    citiesList.appendChild(cityName);
    cityName.addEventListener('click', function () {
        cityFilterPopup.style.display = "none";
        getCenter(city)
    })
}) */


