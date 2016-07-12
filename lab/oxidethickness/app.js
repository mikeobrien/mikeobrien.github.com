$(function() {

    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(load);

    function load() {

        var spectrum, filename;
        var chart = new google.visualization.LineChart(
            document.getElementById('reflectance'));

        var thicknessSlider = $('#thickness').slider()
            .on('change', render).data('slider');
        var offsetSlider = $('#offset').slider()
            .on('change', render).data('slider');
        var amplitudeSlider = $('#amplitude').slider()
            .on('change', render).data('slider');

        $(window).resize(render);

        var content = $('#content');

        var loadSpectrum = function(data, name) {
            if (data && _.isString(data)) {
                filename = name;
                spectrum = parseSpectrumData(data);
                render();
            }
        }

        content.on('paste', function(e) {
            e.preventDefault();
            var data = (e.originalEvent || e).clipboardData.getData('text/plain');
            loadSpectrum(data);
        });

         content.bind("cut",function(e) {
             e.preventDefault();
         });

        content.on("keypress", function(e) {
            e.preventDefault();
        });

        content.on('dragenter', function (e) 
        {
            e.stopPropagation();
            e.preventDefault();
            $(this).css('border', '2px dotted #0B85A1');
        });

        content.on('dragover', function (e) 
        {
            e.stopPropagation();
            e.preventDefault();
        });

        content.on('drop', function (e) 
        {
            $(this).css('border', 'none');
            e.preventDefault();

            var reader = new FileReader();
            var file = e.originalEvent.dataTransfer.files[0];
            reader.readAsText(e.originalEvent.dataTransfer.files[0], "UTF-8");
            reader.onload = function (evt) {
                loadSpectrum(evt.target.result, file.name);
            }
        });

        render();

        function render() {
            var thickness = thicknessSlider.getValue();
            var offset = offsetSlider.getValue();
            var amplitude = amplitudeSlider.getValue();
            $('#thicknessLabel').text((thickness).toLocaleString() + ' nm');

            var data = new google.visualization.DataTable();
            var data = google.visualization.arrayToDataTable(
                generateData(thickness, offset, amplitude, spectrum, filename));

            chart.draw(data, getChartOptions());
        }
    }
});

function getChartOptions() {
    return {
        curveType: 'function', 
        legend: { position: 'bottom' },
        width: String($(window).width() - 30), 
        height: String($(window).height() - 
            $('#reflectance').position().top - 20),
        chartArea: { 
            top: 30,
            left: 100,
            right: 10,
            bottom: 100,
            backgroundColor: {
                stroke: '#000',
                strokeWidth: 1
            }
        },
        hAxis: {
            title: 'Wavelength',
        },
        vAxis: {
            title: 'Reflectance',
            maxValue: 100,
            minValue: 0,
            viewWindowMode: 'maximized'
        }
    };
}

function generateData(thickness, offset, amplitude, spectrum, filename) {
    var headers = ['Wavelength', 'Model'];
    if (spectrum) headers.push(filename || 'Measured');
    return [headers].concat(sio2RefractiveIndices.map(function(x)
    { 
        var data = [x.w, calculateReflectance(x.w, 
            x.ir, thickness, offset, amplitude)];
        if (spectrum) data.push(_.has(spectrum, x.w) ? spectrum[x.w] : 0);
        return data; 
    }));
}

function parseSpectrumData(spectrumData) {
    return _.chain(spectrumData.split(/[(\r\n)\n\r]/))
         .filter(function(row) { return row.match(/^[\d\.\s,]+$/); })
         .map(function(row) { return row.split(/[\s,]/).filter(Boolean); })
         .filter(function(row) { return row && row.length >= 2; })
         .map(function(row) { return { w: Number(row[0]), ir: Number(row[1]) }; })
         .groupBy(function(row) { return Math.floor(row.w); })
         .toPairsIn()
         .map(function(row) { return [row[0], Math.max(Math.min(normalizePercentage(
            _.meanBy(row[1], function(x) { return x.ir ; })), 110), -10)]; })
         .fromPairs().value();
}

function normalizePercentage(percentage) {
    return percentage < 1 ? percentage * 100 : percentage;
}

function calculateReflectance(wavelength, 
    indexOfRefraction, thickness, offset, amplitude) {
    return offset + amplitude * Math.cos(4 * Math.PI * 
        indexOfRefraction * thickness / wavelength);
}

var sio2RefractiveIndices = [{w:345,ir:1.4778},{w:350,ir:1.4769},{w:355,ir:1.4761},{w:360,ir:1.4753},
    {w:365,ir:1.4745},{w:370,ir:1.4738},{w:375,ir:1.4731},{w:380,ir:1.4725},{w:385,ir:1.4719},
    {w:390,ir:1.4713},{w:395,ir:1.4707},{w:400,ir:1.4701},{w:405,ir:1.4696},{w:410,ir:1.4691},
    {w:415,ir:1.4686},{w:420,ir:1.4681},{w:425,ir:1.4676},{w:430,ir:1.4672},{w:435,ir:1.4668},
    {w:440,ir:1.4663},{w:445,ir:1.466},{w:450,ir:1.4656},{w:455,ir:1.4652},{w:460,ir:1.4648},
    {w:465,ir:1.4645},{w:470,ir:1.4641},{w:475,ir:1.4638},{w:480,ir:1.4635},{w:485,ir:1.4632},
    {w:490,ir:1.4629},{w:495,ir:1.4626},{w:500,ir:1.4623},{w:505,ir:1.4621},{w:510,ir:1.4618},
    {w:515,ir:1.4615},{w:520,ir:1.4613},{w:525,ir:1.461},{w:530,ir:1.4608},{w:535,ir:1.4606},
    {w:540,ir:1.4603},{w:545,ir:1.4601},{w:550,ir:1.4599},{w:555,ir:1.4597},{w:560,ir:1.4595},
    {w:565,ir:1.4593},{w:570,ir:1.4591},{w:575,ir:1.4589},{w:580,ir:1.4587},{w:585,ir:1.4586},
    {w:590,ir:1.4584},{w:595,ir:1.4582},{w:600,ir:1.458},{w:605,ir:1.4579},{w:610,ir:1.4577},
    {w:615,ir:1.4576},{w:620,ir:1.4574},{w:625,ir:1.4572},{w:630,ir:1.4571},{w:635,ir:1.457},
    {w:640,ir:1.4568},{w:645,ir:1.4567},{w:650,ir:1.4565},{w:655,ir:1.4564},{w:660,ir:1.4563},
    {w:665,ir:1.4561},{w:670,ir:1.456},{w:675,ir:1.4559},{w:680,ir:1.4558},{w:685,ir:1.4556},
    {w:690,ir:1.4555},{w:695,ir:1.4554},{w:700,ir:1.4553},{w:710,ir:1.4551},{w:720,ir:1.4549},
    {w:730,ir:1.4546},{w:740,ir:1.4544},{w:750,ir:1.4542},{w:760,ir:1.454},{w:770,ir:1.4539},
    {w:780,ir:1.4537},{w:790,ir:1.4535},{w:800,ir:1.4533},{w:810,ir:1.4531},{w:820,ir:1.453},
    {w:830,ir:1.4528},{w:840,ir:1.4527},{w:850,ir:1.4525},{w:860,ir:1.4523},{w:870,ir:1.4522},
    {w:880,ir:1.452},{w:890,ir:1.4519},{w:900,ir:1.4518},{w:910,ir:1.4516},{w:920,ir:1.4515},
    {w:930,ir:1.4513},{w:940,ir:1.4512},{w:950,ir:1.4511},{w:960,ir:1.4509},{w:970,ir:1.4508},
    {w:980,ir:1.4507},{w:990,ir:1.4505},{w:1000,ir:1.4504},{w:1010,ir:1.4503},{w:1020,ir:1.4502}];