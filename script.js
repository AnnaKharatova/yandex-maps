

function init() {
    let map = new ymaps.Map('map', {
        center: [56.123721541750434, 47.27058358126759],
        zoom: 5
    })

    //метки раставляются по координатам. Сюда можно поставить переменные, которые будет приходить с сервера
    
    let placemark1 = new ymaps.Placemark([56.123721541750434, 47.27058358126759], {}, {
        iconLayout: 'default#image',
        iconImageHref: 'https://cdn-icons-png.flaticon.com/512/15219/15219090.png',
        iconImageSize: [20, 20],
        iconImageOffset: [0, 0]

    })

    let placemark2 = new ymaps.Placemark([52.00071257206138, 47.81666699999998], {}, {
        iconLayout: 'default#image',
        iconImageHref: 'https://cdn-icons-png.flaticon.com/512/15219/15219090.png',
        iconImageSize: [20, 20],
        iconImageOffset: [0, 0]

    })

    let placemark3 = new ymaps.Placemark([51.70342707229106, 36.1699735], {}, {
        iconLayout: 'default#image',
        iconImageHref: 'https://cdn-icons-png.flaticon.com/512/15219/15219090.png',
        iconImageSize: [20, 20],
        iconImageOffset: [0, 0]

    })

    map.geoObjects.add(placemark1)
    map.geoObjects.add(placemark2)
    map.geoObjects.add(placemark3)

}


ymaps.ready(init);
