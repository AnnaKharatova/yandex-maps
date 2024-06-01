
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

let fetchedData

fetch('http://158.160.154.213/api/stores/')
    .then(res => res.json())
    .then(resData => {
        fetchedData = JSON.parse(JSON.stringify(resData))


        function init() {
            navigator.geolocation.getCurrentPosition(function (position) {
                const map = new ymaps.Map('map', {
                    center: [position.coords.latitude, position.coords.longitude],
                    zoom: 8,
                });

                map.controls.remove('trafficControl')
                map.controls.remove('typeSelector');
                map.controls.add('routePanelControl', {
                    float: 'right'
                });
                const control = map.controls.get('routePanelControl')
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

                const dataList = fetchedData ? fetchedData : storeList

                console.log(dataList)


                dataList.forEach(store => {
                    let placemark = new ymaps.Placemark([store.latitude, store.longitude], {
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

                let filteredStoreList;

                const checkboxes = document.querySelectorAll('input[type="checkbox"]');

                function filterStoreList() {
                    const selectedParts = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
                    filteredStoreList = dataList.filter(store => {
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
                    const array = filteredStoreList.length == 0 ? dataList : filteredStoreList
                    array.forEach(store => {
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

                        map.geoObjects.add(placemark);
                    });
                }

            })

        }
        ymaps.ready(init);
    }).catch(e => {
        console.error(e)
    })





/*  map.controls.remove('geolocationControl'); // удаляем геолокацию
  map.controls.remove('searchControl'); // удаляем поиск
  map.controls.remove('trafficControl'); // удаляем контроль трафика
  map.controls.remove('typeSelector'); // удаляем тип
  map.controls.remove('fullscreenControl'); // удаляем кнопку перехода в полноэкранный режим
  map.controls.remove('zoomControl'); // удаляем контрол зуммирования
  map.controls.remove('rulerControl'); // удаляем контрол правил
  map.behaviors.disable(['scrollZoom']); // отключаем скролл карты (опционально)
  
  CSS: [class*="copyrights-pane"] {
  display: none !important;
}
 */