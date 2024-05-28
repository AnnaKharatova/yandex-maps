
const storeList = [
    {
        "id": 1,
        "tags": [],
        "name": "ПТИ",
        "address": "Чебоксары, улица Цивильская, дом 13, корпус 1",
        "latitude": "56.124145",
        "longitude": "47.271371",
        "phone": "4545454",
        "website": ""
    },

    {
        "id": 2,
        "tags": [],
        "name": "КАМРТИ",
        "address": "Транспортная улица, 1, Балаково, Саратовкая обл., 413859",
        "latitude": "52.000700",
        "longitude": "47.819700",
        "phone": "+7(927) 220-47-06",
        "website": "https://www.kamrti.ru"
    },

    {
        "id": 3,
        "tags": [],
        "name": "Автосодействие",
        "address": "г.Курск, Литовская д.12а",
        "latitude": "51.704700",
        "longitude": "36.171300",
        "phone": "4545454",
        "website": "https://www.yandex.ru"
    },
]


function init() {

    navigator.geolocation.getCurrentPosition(function (position) {
        let map = new ymaps.Map('map', {
            center: [position.coords.latitude, position.coords.longitude],
            zoom: 10
        });

        storeList.forEach(store => {
            let placemark = new ymaps.Placemark([store.latitude, store.longitude], {
                balloonContentHeader: store.name,
                balloonContentBody: `<p>Адрес: ${store.address}</p> <p>Тел:${store.phone}</p> <p>Ассортимент: ${store.tags}</p>`,
                balloonContentFooter: `Наш сайт: <a href=${store.website}>${store.website}</a>`
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'https://cdn-icons-png.flaticon.com/512/15219/15219090.png',
                iconImageSize: [40, 40],
                iconImageOffset: [0, 0]
            });

            map.geoObjects.add(placemark);
        });
        map.controls.remove('searchControl')
        map.controls.remove('trafficControl')
    }
    )
}

ymaps.ready(init);
