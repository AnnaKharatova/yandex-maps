
import { citiesArray } from './constants.js'

/* MAP */

const searchInput = document.getElementById('city-input');
const partnersFilterPopup = document.getElementById("popup-partners-filter");
const submitFilterButton = document.getElementById("filter-submit-button");
const partnersFilterButton = document.getElementById("partner-filter");
const toggleButton = document.getElementById('toggleButton')

function init() {
    const popupPartnersList = document.getElementById('popup-partners-list')

    let filteredStoreList = [];
    let filteredPartnersList = [];

    const map = new ymaps.Map('map', {
        center: [55.753962, 37.620393],
        zoom: 8,
        controls: ['smallMapDefaultSet', 'routeButtonControl']
    });

    map.controls.remove('trafficControl')
    map.controls.remove('typeSelector');
    map.controls.remove("taxi")

    const control = map.controls.get('routeButtonControl')

    control.routePanel.options.set({
        types: {
            auto: true,
            pedestrian: true,
        },
        fromEnabled: true,
        toEnabled: true,
    })

    fetch('http://158.160.154.213/api/partners/')
        .then(res => res.json())
        .then(resData => {

            const fetchedData = JSON.parse(JSON.stringify(resData))
            console.log(fetchedData)

            function findCity(city) {
                const array = filteredStoreList.length == 0 ? fetchedData : filteredStoreList
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
                        partnersListContainer.innerHTML = ''
                        const list = filteredByCities.reverse()
                        list.forEach(item => {
                            createPartnersList(item)
                        })

                        const p = document.querySelector('.filters-checked__city');
                        p.classList.add('popup-filter__label-span');
                        p.textContent = city
                    })
                });
            }
            filterCities()
            searchInput.addEventListener('input', filterCities);

            function addPlacemark(data) {
                const reversedStoreList = data.reverse()
                reversedStoreList.forEach(store => {
                    const placemark = new ymaps.Placemark([store.latitude, store.longitude], {
                        balloonContentHeader: store.name,
                        balloonContentBody:
                        `<p>Адрес: ${store.address}</p> 
                        <p>Тел:${store.phone}</p> 
                        <p>Ассортимент: ${store.parts_available.map(part => part.name).join(', ')}</p>
                        <p>Часы работы:</p>
                        <p>Будни: ${store.time_open_weekdays} - ${store.time_close_weekdays} </p>
                        <p>Суббота: ${store.time_open_saturday} - ${store.time_close_saturday} </p>
                        <p>Воскресенье: ${store.time_open_sunday} - ${store.time_close_sunday} </p>
                        <button class="route-button">Построить маршрут</button>`,
                        balloonContentFooter: `Наш сайт: <a href=${store.website}>${store.website}</a>`
                    }, {
                        iconLayout: 'default#image',
                        iconImageHref: 'https://cdn-icons-png.flaticon.com/512/3179/3179068.png',
                        iconImageSize: [25, 25],
                        iconImageOffset: [0, 0]
                    });

                    placemark.events.add('balloonopen', () => {
                        const button = document.querySelector('.route-button');
                        button.addEventListener('click', () => {
                            let location = ymaps.geolocation.get();
                            location.then(function (res) {
                                let locationText = res.geoObjects.get(0).properties.get('text');
                                control.routePanel.state.set({
                                    state: "expanded",
                                    from: locationText,
                                    to: `${store.latitude},${store.longitude}`,
                                });
                                const multiRoute = new ymaps.multiRouter.MultiRoute({
                                    referencePoints: [
                                        [locationText],
                                        [store.latitude, store.longitude]
                                    ],
                                    params: {
                                        routingMode: 'auto'
                                    }
                                });
                                map.geoObjects.add(multiRoute);
                            });
                        });
                    });

                    map.geoObjects.add(placemark);
                    createPartnersList(store)
                });
            }

            addPlacemark(fetchedData)

            function filterStoreList() {
                const selectedParts = Array.from(document.querySelectorAll('.popup-filter__engine-checkbox:checked')).map(checkbox => checkbox.value);
                filteredStoreList = fetchedData.filter(store => {
                    return selectedParts.some(selectedPart => {
                        return store.parts_available.some(part => part.name === selectedPart);
                    });
                });
            }
            function filterPartnersList() {
                const selectedPartners = Array.from(document.querySelectorAll('.popup-filter__partners-checkbox:checked')).map(checkbox => checkbox.value);
                const array = filteredStoreList.length == 0 ? fetchedData : filteredStoreList
                filteredPartnersList = array.filter(store => {
                    return store.tags.some(tag => selectedPartners.includes(tag.name));
                });
            }

            submitFilterButton.addEventListener("click", function (event) {
                event.preventDefault()
                const ul = document.querySelector('.filters-checked__partners');
                ul.innerHTML = "";
                const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                checkedCheckboxes.forEach(checkbox => {
                    const li = document.createElement('li');
                    li.classList.add('popup-filter__label-span');
                    li.textContent = checkbox.value
                    ul.appendChild(li)
                })
                filterPartnersList()
                filterStoreList()
                const list = filteredPartnersList.length == 0 ? filteredStoreList : filteredPartnersList
                const array = checkedCheckboxes.length == 0 ? fetchedData : list
                const openStores = getOpenStores(array);
                displayStores(openStores)
                createPartnersList(openStores) 
                partnersFilterPopup.style.display = "none";
            });

            function displayStores(array) {
                map.geoObjects.removeAll();
                partnersListContainer.innerHTML = '';
                addPlacemark(array)
            }
        })

        .catch(e => {
            console.error(e)
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

/* Фильтр */

partnersFilterButton.addEventListener("click", function () {
    partnersFilterPopup.style.display = "block";
});

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

/* часы работы(открыто ли сейчас) */

function getOpenStores(stores) {
    const currentDate = new Date();
    const currentDay = currentDate.getDay(); // 0 - воскресенье, 6 - суббота
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    if (toggleButton.checked) {
        return stores.filter(store => {

            let openTime, closeTime;

            if (currentDay === 0) { // Воскресенье
                openTime = store.time_open_sunday;
                closeTime = store.time_close_sunday;
            } else if (currentDay === 6) { // Суббота
                openTime = store.time_open_saturday;
                closeTime = store.time_close_saturday;
            } else { // Будние дни
                openTime = store.time_open_weekdays;
                closeTime = store.time_close_weekdays;
            }

            if (openTime) {
                const [openHour, openMinute] = openTime.split(':').map(Number);
                const [closeHour, closeMinute] = closeTime.split(':').map(Number);
                return (currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute))
                    && (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute));
            }
        });
    } else {
        return stores;
    }

}




