let gettingItem = browser.storage.local.get(['enabled', 'type', 'frequency', 'intensity', 'lat', 'long']);
gettingItem.then(function(item) {
    // BluEYE enabled
    if (item.enabled == true) {
        // BluEYE Frequency
        var times = SunCalc.getTimes(new Date(), item.lat, item.long);
        var sunrise = moment(times.sunrise).format('HH');
        var sunset = moment(times.sunset).format('HH');
        var now = moment().format('HH');

        var isDay = false;
        if ((sunrise < now) && (now < sunset)) {
            isDay = true;
        }

        if (((isDay == true) && (item.frequency == 'always')) || (isDay == false)) {
            // BluEYE type
            if (item.type == 'grayscale') {
                document.body.style.filter = 'grayscale(' + item.intensity + '%)';
            } else if (item.type == 'sepia') {
                document.body.style.filter = 'sepia(' + item.intensity + '%)';
            } else if (item.type == 'nvg') {
                document.body.style.filter = 'sepia(100%) invert(0%) hue-rotate(60deg)';
            }
        }
    }
});
