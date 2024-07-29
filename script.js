import { citiesArray } from './constants.js'

const BASE_URL = `https://yurasstroy.ddns.net/api`

const searchInput = document.getElementById('city-input');
const partnersFilterPopup = document.getElementById("popup-partners-filter");
const submitFilterButton = document.getElementById("filter-submit-button");
const partnersFilterButton = document.getElementById("partner-filter");
const toggleButton = document.getElementById('toggleButton')
const bigFilterCityPopup = document.getElementById('city-filter-big')
let selectedCity = sessionStorage.getItem('selectedCity')
const cityFilterPopup = document.getElementById("popup-city-filter");

sessionStorage.clear()

/* MAP */

function init() {
    const popupPartnersList = document.getElementById('popup-partners-list');

    let filteredStoreList = [];
    let filteredPartnersList = [];

    const map = new ymaps.Map('map', {
        center: [55.753962, 37.620393],
        zoom: 8,
        controls: ['smallMapDefaultSet', 'routeButtonControl']
    });

    map.controls.remove('trafficControl');
    map.controls.remove('typeSelector');
    map.controls.remove("taxi");

    const control = map.controls.get('routeButtonControl');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = [position.coords.latitude, position.coords.longitude];
                map.setCenter(userLocation);
                map.setZoom(8);
                /* здесь город сразу распознается при загрузки, есть сложности в реализации фильтрации списка партнеров
                 ymaps.geocode(userLocation).then(res => {
                    const firstGeoObject = res.geoObjects.get(0);
                    const address = firstGeoObject.getAddressLine();
                    const city = address.split(",")[0].trim();
                    bigFilterCityPopup.textContent = city
                    sessionStorage.setItem('selectedCity', city);
                }); */
            },
            (error) => {
                console.error("Ошибка получения местоположения:", error);
            }
        );
    } else {
        console.warn("Геолокация не доступна");
    }

    control.routePanel.options.set({
        types: {
            auto: true,
            pedestrian: true,
        },
        fromEnabled: true,
        toEnabled: true,
    })

    if (selectedCity) {
        bigFilterCityPopup.textContent = selectedCity
    }

    fetch(`${BASE_URL}/partners/`)
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
                if (window.innerWidth >= 750) {
                    let html = ""
                    item.forEach(partner => {
                        html += `
                        <li class='partner'>
                           <p class='partner__engines'>${partner.parts_available.map(part => part.name).join(`<span class='partner__engines-dot'></span>`)}</p>
                           <h2 class='partner__name'>${partner.name}</h2>
                           <p class='partner__address'>${partner.address}</p>
                           <div class='partner__contacts'>
                             <a href=${partner.phone} class="partner__phone">${partner.phone}</a>
                             <a href=${partner.website} class="partner__website target="_blank"">${partner.website}</a>
                           </div>
                           <div class='partner__block'>
                           ${partner.time_open_weekdays || partner.time_open_saturday || partner.time_open_sunday ?
                                `<div class='partner__open'>
                                    ${partner.time_open_weekdays ? `<p class='partner__open-time'>c ${partner.time_open_weekdays} до ${partner.time_close_weekdays}</p>` : '<p></p>'}
                                    ${partner.time_open_saturday ? `<p class='partner__open-time'>cб: ${partner.time_open_saturday} - ${partner.time_close_saturday}</p>` : '<p></p>'}
                                    ${partner.time_open_sunday ? `<p class='partner__open-time'>воскр: ${partner.time_open_sunday} - ${partner.time_close_sunday}</p>` : '<p></p>'}
                                </div>` : '<p></p>'
                            }
                                <button class="route-button">Маршрут</button>
                           </div>
                        </li> `;
                        const routeButtons = document.querySelectorAll('.route-button');
                        routeButtons.forEach(button => {
                            button.addEventListener('click', (event) => {
                                const item = event.currentTarget;
                                console.log(item)
                            });
                        });
                    })
                    document.getElementById('partners-list-big').innerHTML = html;

                }
                else {
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
                    li.addEventListener('click', function () {
                        popupPartnersList.style.display = "none";
                        getCenter(item.address)
                    })
                    const partnersListContainerSmall = document.getElementById('partners-list-small')
                    partnersListContainerSmall.appendChild(li);
                }
            }

            function getRoute(store) {
                // Код для получения маршрута с использованием координат партнера
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
            }
            function filterCities() {
                const searchText = searchInput.value.toLowerCase();
                fetch(`${BASE_URL}/cities`)
                    .then(response => response.json())
                    .then(data => {
                        const fetchedCities = JSON.parse(JSON.stringify(data))
                        const citiesFetchedArray = fetchedCities.map(city => city.name);
                        const filteredCities = citiesFetchedArray.filter(city => city.toLowerCase().startsWith(searchText));
                        citiesList.innerHTML = '';
                        const cityArray = searchText ? filteredCities : citiesArray
                        if (cityArray.length == 0 && searchText) {

                            const container = document.createElement('div');
                            container.classList.add('popup-filter__no-city')

                            const sadFace = document.createElement('img')
                            sadFace.classList.add('popup-filter__no-city-img')
                            sadFace.src = './images/Icon-sadFace.svg'
                            sadFace.alt = 'грустный смайлик'
                            container.appendChild(sadFace)

                            const title = document.createElement('h3')
                            title.classList.add('popup-filter__no-city-message')
                            title.textContent = 'Ничего не нашлось'
                            container.appendChild(title)

                            const text = document.createElement('p')
                            text.classList.add('popup-filter__no-city-text')
                            text.textContent = 'В этом городе нет наших официальных представителей'
                            container.appendChild(text)

                            const citesList = document.getElementById('cities-list')
                            citesList.appendChild(container)

                        }
                        cityArray.forEach(city => {
                            const li = document.createElement('li');
                            li.textContent = city;
                            li.classList.add('popup-filter__city')
                            citiesList.appendChild(li);
                            li.addEventListener('click', function () {
                                sessionStorage.setItem('selectedCity', city);
                                bigFilterCityPopup.textContent = city
                                cityFilterPopup.style.display = "none";
                                searchInput.value = ''
                                filterCities()
                                getCenter(city)
                                const filteredByCities = findCity(city)
                                partnersListContainer.forEach(item => {
                                    item.innerHTML = ''
                                })
                                const list = filteredByCities.reverse()
                                createPartnersList(list)


                                const p = document.querySelector('.filters-checked__city');
                                p.classList.add('popup-filter__label-span');
                                p.textContent = city
                                p.style.display = "block";

                                const del = document.createElement('button')
                                del.classList.add('popup-filter__del-button')
                                del.textContent = `x`
                                p.appendChild(del)

                                del.addEventListener('click',
                                    function () {
                                        filterCities()
                                        p.style.display = "none";
                                        partnersListContainer.forEach(item => {
                                            item.innerHTML = ''
                                        })
                                        sessionStorage.clear()
                                        bigFilterCityPopup.textContent = 'Город'
                                        getQuery()
                                    }
                                )

                                const clearCityFilter = document.querySelector('.filter-buttons__delete-city')
                                clearCityFilter.addEventListener('click',
                                    function () {
                                        filterCities()
                                        p.style.display = "none";
                                        partnersListContainer.forEach(item => {
                                            item.innerHTML = ''
                                        })
                                        sessionStorage.clear()
                                        bigFilterCityPopup.textContent = 'Город'
                                        getQuery()
                                    }
                                )
                            })
                        })
                    }).catch(error => {
                        console.error("Ошибка при получении данных:", error);
                    });
            }

            filterCities()
            searchInput.addEventListener('input', filterCities);
            let openStores

            function getQuery() {
                const selectedParts = Array.from(document.querySelectorAll('.popup-filter__engine-checkbox:checked')).map(checkbox => checkbox.value);
                const selectedPartners = Array.from(document.querySelectorAll('.popup-filter__partners-checkbox:checked')).map(checkbox => checkbox.value);
                if (selectedParts || selectedPartners) {
                    const queryParams = selectedPartners.map(tag => `tags=${tag}`).join('&') + `&` + selectedParts.map(id => `parts_available=${id}`).join('&')
                    const url = `${BASE_URL}/partners/?${queryParams}`
                    console.log(url)
                    fetch(url)
                        .then(response => response.json())
                        .then(data => {
                            filteredPartnersList = data;
                            console.log(filteredPartnersList)
                            const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked')
                            const array = !checkedCheckboxes ? fetchedData : filteredPartnersList
                            openStores = getOpenStores(array);
                            if (selectedCity) {
                                const filteredCities = openStores.filter(item => {
                                    return item.address.toLowerCase().includes(selectedCity.toLowerCase());
                                });
                                displayStores(filteredCities)
                                createPartnersList(filteredCities)
                            } else {
                                displayStores(openStores)
                                createPartnersList(openStores)
                            }

                        }).catch(error => {
                            console.error("Ошибка при получении данных:", error);
                        });
                } else {
                    const array = checkedCheckboxes.length == 0 ? fetchedData : filteredPartnersList
                    const openStores = getOpenStores(array);
                    displayStores(openStores)
                    createPartnersList(openStores)
                }
            }

            function addPlacemark(data) {
                const reversedStoreList = data.reverse()
                reversedStoreList.forEach(store => {
                    const placemark = new ymaps.Placemark([store.latitude, store.longitude], {
                        balloonContentBody:
                            `<div class='ballon'>
                                <p class='ballon__header'>${store.name}</p>
                                <p class='balloon__text'>${store.tags.map(tag => tag.name)}</p>
                                <p class='balloon__text'>${store.address}</p> 
                                <div class='ballon__status'>
                                    <div class='baloon__status-dot'></div>
                                    <p class='balloon__text'>Открыто</p>
                                </div>
                            </div>`
                    }, {
                        iconLayout: 'default#image',
                        iconImageHref: './images/Map_hover.svg',
                        iconImageSize: [25, 25],
                        iconImageOffset: [0, 0]
                    });

                    placemark.events.add('balloonopen', () => {
                        getStoreInfo(store)                        
                        const button = document.querySelector('.route-button');
                        button.addEventListener('click', () => {
                            let location = ymaps.geolocation.get();
                            console
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

                    function getStoreInfo(store){
                        let html = ""
                            html += `
                            <div class='partner'>
                                <button class='partner__backToList' onClick=${createPartnersList(openStores)}>Все партнеры</button>
                               <p class='partner__engines'>${store.parts_available.map(part => part.name).join(`<span class='partner__engines-dot'></span>`)}</p>
                               <h2 class='partner__name'>${store.name}</h2>
                               <p class='partner__address'>${store.address}</p>
                               <div class='partner__contacts'>
                                 <a href=${store.phone} class="partner__phone">${store.phone}</a>
                                 <a href=${store.website} class="partner__website target="_blank"">${store.website}</a>
                               </div>
                               <div class='partner__block'>
                               ${store.time_open_weekdays || store.time_open_saturday || store.time_open_sunday ?
                                    `<div class='partner__open'>
                                        ${store.time_open_weekdays ? `<p class='partner__open-time'>c ${store.time_open_weekdays} до ${store.time_close_weekdays}</p>` : '<p></p>'}
                                        ${store.time_open_saturday ? `<p class='partner__open-time'>cб: ${store.time_open_saturday} - ${store.time_close_saturday}</p>` : '<p></p>'}
                                        ${store.time_open_sunday ? `<p class='partner__open-time'>воскр: ${store.time_open_sunday} - ${store.time_close_sunday}</p>` : '<p></p>'}
                                    </div>` : '<p></p>'
                                }
                                    <button class="route-button">Маршрут</button>
                               </div>
                            </div> `;
                            document.querySelector('.partners__container').innerHTML = html;

                    }

                    map.geoObjects.add(placemark);
                    
                });
            }

            addPlacemark(fetchedData)

            submitFilterButton.addEventListener("click", function (event) {
                event.preventDefault()
                const ul = document.querySelector('.filters-checked__partners');
                ul.innerHTML = "";
                const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                checkedCheckboxes.forEach(checkbox => {
                    const li = document.createElement('li');
                    const del = document.createElement('button')
                    li.classList.add('popup-filter__label-span');
                    del.classList.add('popup-filter__del-button')
                    del.textContent = `x`
                    li.textContent = checkbox.name
                    li.appendChild(del)
                    ul.appendChild(li)
                    del.addEventListener('click',
                        function () {
                            checkbox.checked = false
                            getQuery()
                            li.style.display = "none";
                        }
                    )
                })
                getQuery()
                const array = checkedCheckboxes.length == 0 ? fetchedData : filteredPartnersList
                const openStores = getOpenStores(array);
                displayStores(openStores)
                createPartnersList(openStores)
                filterCities()
                partnersFilterPopup.style.display = "none";
                const filtersLenght = checkedCheckboxes.length
                const filterButtonSpan = document.querySelector('.filter-buttons__button-item')
                filterButtonSpan.textContent = filtersLenght
            });

            function displayStores(array) {
                map.geoObjects.removeAll();
                partnersListContainer.forEach(item => {
                    item.innerHTML = ''
                })
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

fetch(`${BASE_URL}/tags/`)
    .then(response => response.json())
    .then(data => {
        let html = ""
        data.forEach(tag => {
            html += `
    <label class="popup-filter__label" for="partner-${tag.id.toString().toLowerCase()}">
      <input class="popup-filter__partners-checkbox" type="checkbox" id="partner-${tag.id.toString().toLowerCase()}" name="${tag.name}" value="${tag.id}" />
      <span class="popup-filter__label-span">${tag.name}</span>
    </label>
  `;
        });
        document.getElementById('partners-section').innerHTML = html;
    }).catch(error => {
        console.error("Ошибка при получении данных:", error);
    });

partnersFilterButton.addEventListener("click", function () {
    partnersFilterPopup.style.display = "block";
});

fetch(`${BASE_URL}/engines/`)
    .then(response => response.json())
    .then(data => {
        let html = ""
        data.forEach(item => {
            html += `

    <label class="popup-filter__label" for="engine-${item.id.toString().toLowerCase()}">
      <input class="popup-filter__engine-checkbox" type="checkbox" id="engine-${item.id.toString().toLowerCase()}" name="${item.name}" value="${item.id}" />
      <span class="popup-filter__label-span">${item.name}</span>
    </label>
  `;
        });
        document.getElementById('engines-section').innerHTML = html;
    }).catch(error => {
        console.error("Ошибка при получении данных:", error);
    });

partnersFilterButton.addEventListener("click", function () {
    partnersFilterPopup.style.display = "block";
});

const bigFilterPopup = document.getElementById('partner-filter-big')

bigFilterPopup.addEventListener("click", function () {
    partnersFilterPopup.style.display = "block";
});

/* Фильтр по городам */

const cityFilterButton = document.getElementById("city-filter");
const closeButtonCity = document.querySelector(".popup-filter__back-button");
const citiesList = document.getElementById('cities-list')

cityFilterButton.addEventListener("click", function () {
    cityFilterPopup.style.display = "block";
});

closeButtonCity.addEventListener("click", function () {
    cityFilterPopup.style.display = "none";
    searchInput.value = ''
});


bigFilterCityPopup.addEventListener("click", function () {
    cityFilterPopup.style.display = "block";
});


/* Список партнеров */

const partnersListButton = document.getElementById('partners-list-button')
const popupPartnersList = document.getElementById('popup-partners-list')
const partnersListContainer = document.querySelectorAll('.popup-filter__partners-list')

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

/*  Фильтрация массива на фронте
           
           function filterStoreList() {
               const selectedParts = Array.from(document.querySelectorAll('.popup-filter__engine-checkbox:checked')).map(checkbox => checkbox.value);
               filteredStoreList = fetchedData.filter(store => {
                   return selectedParts.some(selectedPart => {
                       return store.parts_available.some(part => part.id === selectedPart);
                   });
               });
           }

           function filterPartnersList() {
               const selectedPartners = Array.from(document.querySelectorAll('.popup-filter__partners-checkbox:checked')).map(checkbox => checkbox.value);
               const array = filteredStoreList.length == 0 ? fetchedData : filteredStoreList
               filteredPartnersList = array.filter(store => {
                   return store.tags.some(tag => selectedPartners.includes(tag.name));
               });
           } */



