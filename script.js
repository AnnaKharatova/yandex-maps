
const storeList = [
    {
        "id": 1,
        "parts_available": [
            {
                "name": "YAMZ"
            },
            {
                "name": "KAMAZ_R6"
            },
            {
                "name": "Cummins_6.7"
            }
        ],
        "name": "РТИ",
        "image": null,
        "address": "Чебоксары, улица Цивильская, дом 13",
        "latitude": "56.124145",
        "longitude": "47.271371",
        "phone": "4545454",
        "website": "",
        "tags": []
    },
    {
        "id": 2,
        "parts_available": [
            {
                "name": "Cummins_6.7"
            }
        ],
        "name": "КАМРТИ",
        "image": null,
        "address": "Транспортная ул., 1, Балаково, Саратовская обл., 413859",
        "latitude": "52.000700",
        "longitude": "47.816700",
        "phone": "+7 (927) 220-47-06",
        "website": "https://www.kamrti.ru",
        "tags": []
    },
    {
        "id": 3,
        "parts_available": [
            {
                "name": "Mersedes_457_LA"
            }
        ],
        "name": "Автосодействие",
        "image": null,
        "address": "г. Курск, ул. Литовская д.12а",
        "latitude": "51.704700",
        "longitude": "36.171300",
        "phone": "+7 (4712) 74‒06‒03",
        "website": "https://автосодействие.рф",
        "tags": []
    },
    {
        "id": 4,
        "parts_available": [
            {
                "name": "KAMAZ_740"
            }
        ],
        "name": "Авто-альянс",
        "image": null,
        "address": "г. Люберцы, ул. Мира, д. 8-Б\"",
        "latitude": "55.669300",
        "longitude": "37.902600",
        "phone": "7 (495) 109-14-79",
        "website": "https://www.autoopt.ru/",
        "tags": []
    },
    {
        "id": 5,
        "parts_available": [
            {
                "name": "YAMZ"
            }
        ],
        "name": "Автоторгцентр",
        "image": null,
        "address": "пр. Машиностроителей, 1Ч, Чебоксары",
        "latitude": "56.125100",
        "longitude": "47.308000",
        "phone": "7 (905) 029-74-44",
        "website": "",
        "tags": []
    },
    {
        "id": 6,
        "parts_available": [
            {
                "name": "KAMAZ_740"
            },
            {
                "name": "YAMZ"
            },
            {
                "name": "KAMAZ_R6"
            },
            {
                "name": "Cummins_6.7"
            }
        ],
        "name": "Авторемкомплект",
        "image": null,
        "address": "г. Ярославль, ул. проспект Октября 89, литер3, помещение 2.",
        "latitude": "57.657800",
        "longitude": "39.842900",
        "phone": "+7 (920) 102-90-57\"",
        "website": "https://tpkark.ru/",
        "tags": []
    }
]

const citiesArray = ["Москва", "Санкт-Петербург", "Ярославль", "Чебоксары", "Люберцы", "Курск", "Балаково"]

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

function init() {
    navigator.geolocation.getCurrentPosition(function (position) {
        const map = new ymaps.Map('map', {
            center: [position.coords.latitude, position.coords.longitude],
            zoom: 8,
            controls: ['smallMapDefaultSet', 'routeButtonControl']
        });

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

        /* citiesArray.map(city => {
            const cityName = document.createElement('li');
            cityName.textContent = city;
            citiesList.appendChild(cityName);
            cityName.addEventListener('click', function () {
                cityFilterPopup.style.display = "none";
                getCenter(city)
            })
        }) */

        const searchInput = document.getElementById('city-input');
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
                })
            });
        }
        filterCities() 
        searchInput.addEventListener('input', filterCities);

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

        function addPlacemark(storeList) {
            storeList.forEach(store => {
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
            });
        }

        addPlacemark(storeList)

        let filteredStoreList;

        const checkboxes = document.querySelectorAll('input[type="checkbox"]');

        function filterStoreList() {
            const selectedParts = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
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
            const array = filteredStoreList.length == 0 ? storeList : filteredStoreList
            addPlacemark(array)
        }
    })
}

ymaps.ready(init);

/* Бургер Меню */

const popupMenu = document.querySelector(".popup-menu")

const burgerButton = document.getElementById('header-nav-burger');
burgerButton.addEventListener('click', () => {
    popupMenu.classList.remove("display-none")
});

const popupCloseButton = document.getElementById('popup-menu-close');
popupCloseButton.addEventListener('click', () => {
    popupMenu.classList.add("display-none")
});

/* Фильтр по типу двигателя */

const filterPopup = document.getElementById("popup-engine-filter");
const closeButtonEngine = document.getElementsByClassName("popup-filter__close-button")[0];
const engineFilterButton = document.getElementById("engine-filter");
const submitEngineFilterButton = document.getElementById("engine-filter-submit-button");

engineFilterButton.addEventListener("click", function () {
    filterPopup.style.display = "block";
});

closeButtonEngine.addEventListener("click", function () {
    filterPopup.style.display = "none";
});

window.addEventListener("touchstart", function (event) {
    if (event.touches.clientY < 50) {
        event.preventDefault()
        filterPopup.style.display = "none";
    }
});

submitEngineFilterButton.addEventListener("click", function (event) {
    event.preventDefault()
    filterPopup.style.display = "none";
});

/* Фильтр по партнерам */


const partnersFilterPopup = document.getElementById("popup-partners-filter");
const partnersFilterButton = document.getElementById("partner-filter");
const closeButtonPartners = document.getElementsByClassName("popup-filter__close-button")[1];


partnersFilterButton.addEventListener("click", function () {
    partnersFilterPopup.style.display = "block";
});

closeButtonPartners.addEventListener("click", function () {
    partnersFilterPopup.style.display = "none";
});

/* Фильтр по городам */

const cityFilterPopup = document.getElementById("popup-city-filter");
const cityFilterButton = document.getElementById("city-filter");
const closeButtonCity = document.getElementsByClassName("popup-filter__close-button")[2];
const citiesList = document.getElementById('cities-list')


const searchInput = document.getElementById('city-input');

cityFilterButton.addEventListener("click", function () {
    cityFilterPopup.style.display = "block";
});

closeButtonCity.addEventListener("click", function () {
    cityFilterPopup.style.display = "none";
    searchInput.value = ''
});








/*  map.controls.remove('geolocationControl'); // удаляем геолокацию
  map.controls.remove('searchControl'); // удаляем поиск
  map.controls.remove('trafficControl'); // удаляем контроль трафика
  map.controls.remove('typeSelector'); // удаляем тип
  map.controls.remove('fullscreenControl'); // удаляем кнопку перехода в полноэкранный режим
  map.controls.remove('zoomControl'); // удаляем контрол зуммирования
  map.controls.remove('rulerControl'); // удаляем контрол правил
  map.behaviors.disable(['scrollZoom']); // отключаем скролл карты (опционально)
 */