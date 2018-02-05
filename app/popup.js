$(function() {

    // set version
    var manifest = chrome.runtime.getManifest();
    $('.version').html('BluEYE ' + manifest.version);

    // set locales
    $('#filtre').html(browser.i18n.getMessage('BluEYEFiltre'));
    $('#type').html(browser.i18n.getMessage('BluEYEType'));
    $('#frequence').html(browser.i18n.getMessage('BluEYEFrequence'));
    $('#intensite').html(browser.i18n.getMessage('BluEYEIntensite'));
    $('#blueye-type option[value="grayscale"]').html(browser.i18n.getMessage('BluEYENoirEtBlanc'));
    $('#blueye-frequency option[value="night"]').html(browser.i18n.getMessage('BluEYEUniquementLaNuit'));
    $('#blueye-frequency option[value="always"]').html(browser.i18n.getMessage('BluEYEPermanent'));

    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    var lat = 0;
    var long = 0;

    function success(pos) {

        // update form
        let getEnabled = browser.storage.local.get('enabled');
        getEnabled.then(function(item) {
            if (item.enabled == true) {
                $('#blueye-enabled').prop('checked', item.enabled);
                $('#enabled-value').html('actif');
            } else {
                $('#blueye-enabled').prop('checked', false);
                $('#enabled-value').html('inactif');
            }
        });

        let getType = browser.storage.local.get('type');
        getType.then(function(item) {
            if (item.type != undefined) {
                $('#blueye-type').val(item.type);
                if ((item.type == 'grayscale') || (item.type == 'sepia')) {
                    $('.filtre-intensity').css('visibility', 'visible');
                } else {
                    $('.filtre-intensity').css('visibility', 'hidden');
                }
            } else {
                $('#blueye-type').val($("#blueye-type option:first").val());
            }
        });

        let getfrequency = browser.storage.local.get('frequency');
        getfrequency.then(function(item) {
            if (item.frequency != undefined) {
                $('#blueye-frequency').val(item.frequency);
            } else {
                $('#blueye-frequency').val($("#blueye-frequency option:first").val());
            }
        });

        let getintensity = browser.storage.local.get('intensity');
        getintensity.then(function(item) {
            if (item.intensity != undefined) {
                $('#blueye-intensity').val(item.intensity);
                $('#intensity-value').html(item.intensity);
            } else {
                $('#blueye-intensity').val(0);
                $('#intensity-value').html(0);
            }
        });

        // get coords / position
        var crd = pos.coords;
        lat = crd.latitude;
        browser.storage.local.set({ 'lat': lat });
        long = crd.longitude;
        browser.storage.local.set({ 'long': long });

        // get times
        var times = SunCalc.getTimes(new Date(), lat, long);
        var sunrise = moment(times.sunrise).format('HH');
        var sunset = moment(times.sunset).format('HH');
        var now = moment().format('HH');
        var last = '23';
        var first =  '00';
        var fract = 0;

        // pendule
        function update() {
            $('#datetime').html(moment().format('HH:mm:ss'));
        }
        setInterval(update, 1000);

        // day
        if ((sunrise < now) && (now < sunset)) {
            // add icon
            $('#start').html(moment(times.sunrise).format('HH:mm')).after(' <i class="wi wi-sunrise"></i>');
            $('#finish').html(moment(times.sunset).format('HH:mm')).before('<i class="wi wi-sunset"></i> ');
            // position the sun
            $('body').removeClass('night').addClass('day');
            $('.sun').css('right', '178px').show();
            $('.moon').css('left', '178px').hide();
            fract = Math.round((12 / (sunset - sunrise)) * (now - sunrise));
        // night
        } else {
            // add icon
            $('#start').html(moment(times.sunset).format('HH:mm')).after(' <i class="wi wi-sunset"></i>');;
            $('#finish').html(moment(times.sunrise).format('HH:mm')).before('<i class="wi wi-sunrise"></i> ');
            // position the moon
            $('body').removeClass('day').addClass('night');
            $('.moon').css('right', '178px').show();
            $('.sun').css('left', '178px').hide();
            if ((now <= last) && (now > sunset)) {
                fract = Math.round((12 / ((last - sunset) + parseInt(sunrise))) * (parseInt(now - sunset) + 1));
            } else {
                fract = Math.round((12 / ((last - sunset) + parseInt(sunrise))) * ((last - sunset) + parseInt(now)));
                if (parseInt(now) == '0') {
                    fract = fract + 1;
                }
            }
        }

        // animation => de 0° à 180°, exemple 15° = 1 heure
        var cssAnimation = document.createElement('style');
        cssAnimation.type = 'text/css';
        var rules = document.createTextNode('@-webkit-keyframes spin-right {' +
        '   100% {' +
        '            transform: rotate(' + parseInt(fract * 15) + 'deg);' +
        '   }' +
        '}');
        cssAnimation.appendChild(rules);
        document.getElementsByTagName('head')[0].appendChild(cssAnimation);

         // duration => 0 à 6 par step de 0.5, exemple 0.5s = 1 heure
        var duration = '' + parseFloat(fract * 0.5) + 's';
        $('.wheel').css('animationDuration', duration);

        // get city name
        let getAddress = browser.storage.local.get('address');
        getAddress.then(function(item) {
            if (item.address != undefined) {
                $('#location').html(item.address);
            } else {
                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+long+'&sensor=true',
                    //url: 'http://nominatim.openstreetmap.org/reverse?format=json&lat='+lat+'&lon='+long+'&zoom=18&addressdetails=1',
                    //data: {},
                    success: function(data) {
                        console.log(data);
                        // var city = data.address.village;
                        // if (city == undefined) {
                        //     city = data.address.town;
                        // }
                        // if (city == undefined) {
                        //     city = data.address.city;
                        // }
                        // $('#location').html(city + ' (' + data.address.country + ')');
                        var address = data.results[1].formatted_address;
                        browser.storage.local.set({ 'address': address });
                        $('#location').html(address);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log(jqXHR, textStatus, errorThrown);
                    }
                });
            }
            $('.infos-loader').hide();
            $('.infos').removeClass('full-center').addClass('style-data');
            $('.infos-data').show();
        });
    };

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    };

    // launch app after get coords
    navigator.geolocation.getCurrentPosition(success, error, options);

    // events
    $('#blueye-enabled').change(function() {
        if($(this).is(':checked')) {
            $('#enabled-value').html('actif');
            browser.storage.local.set({ 'enabled': true });
            browser.storage.local.set({ 'type': $('#blueye-type').val() });
            browser.storage.local.set({ 'frequency': $('#blueye-frequency').val() });
            browser.storage.local.set({ 'intensity': $('#blueye-intensity').val() });
            browser.tabs.reload();
        } else {
            $('#enabled-value').html('inactif');
            browser.storage.local.set({ 'enabled': false });
            browser.tabs.reload();
        }
    });

    $('#blueye-type').on('change', function() {
        if (($(this).val() == 'grayscale') || ($(this).val() == 'sepia') || ($(this).val() == 'nvg')) {
            $('.filtre-intensity').css('visibility', 'visible');
        } else {
            $('.filtre-intensity').css('visibility', 'hidden');
        }
        browser.storage.local.set({ 'type': $(this).val() });
        browser.tabs.reload();
    });

    $('#blueye-frequency').on('change', function() {
        browser.storage.local.set({ 'frequency': $(this).val() });
        browser.tabs.reload();
    });

    $('#blueye-intensity').on('change', function() {
        $('#intensity-value').html($(this).val());
        browser.storage.local.set({ 'intensity': $(this).val() });
        browser.tabs.reload();
    });

});
