/**
 * Create a WaveSurfer instance.
 */
var wavesurfer;
var wzoom;
var wspeed=1.0;
var evid;
var svid;
var currentRegion = null;
var bRegionId=-1;
var nbRegions=0;
var frozen=false;
var maxFrozen = 200;
var showFrozen = 0;
var soundfile = '__file_url__';

var strstr = function (haystack, needle) {
  if (needle.length === 0) return 0;
  if (needle === haystack) return 0;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (needle === haystack.substring(i, i + needle.length)) {
      return i;
    }
  }
  return 0;
};

var alertAndScroll = function(message){
    parent.window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
    alertify.alert(message+"<br/><br/>");
};

var fullEncode = function(w)
{
 var map=
 {
          '&': '%26',
          '<': '%3c',
          '>': '%3e',
          '"': '%22',
          "'": '%27'
 };

 var encodedW = encodeURI(w);
 return encodedW.replace(/[&<>"']/g, function(m) { return map[m];});
}

var toHHMMSS = function(duration)
{  
   // console.log(duration);
   var hours = Math.floor(duration/3600);
   duration = duration-hours*3600;
   var mins = Math.floor(duration/60);
   duration = duration-mins*60;
   var secs = Math.floor(duration);
   duration = duration-secs;
   var millis = Math.floor(duration*100);
   return ("0"+hours).slice(-2)+":"+("0"+mins).slice(-2)+":"+("0"+secs).slice(-2)+"."+("0"+millis).slice(-2);
}

var getPosition = function(e)
{
   var x = 0;
   var y = 0;
   var es = e.style;
   var el = e;
   if (el.getBoundingClientRect) { // IE
      var box = el.getBoundingClientRect();
      x = box.left + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft) - 2;
      y = box.top + Math.max(document.documentElement.scrollTop, document.body.scrollTop) - 2;
   } else {
      x = el.offsetLeft;
      y = el.offsetTop;
      el = el.offsetParent;
      if (e != el) {
         while (el) {
           x += el.offsetLeft;
           y += el.offsetTop;
           el = el.offsetParent;
         }
      }
      el = e.parentNode;
      while (el && el.tagName.toUpperCase() != 'BODY' && el.tagName.toUpperCase() != 'HTML')
      {
         if (el.style.display != 'inline') {
            x -= el.scrollLeft;
            y -= el.scrollTop;
         }
         el = el.parentNode;
      }
    }
    return {x:x, y:y};
}

var decSpeed = function() {
    wspeed=Math.max(wspeed-0.1,0.1);
    $('#svalue').html(("x"+wspeed).substring(0,4));
    // svid = setTimeout( "decSpeed();", 500 );
}

var incSpeed = function() {
    wspeed=Math.min(wspeed+0.1,5.0);
    $('#svalue').html(("x"+wspeed).substring(0,4));
    // svid = setTimeout( "incSpeed();", 500 );
}

var moveSpeech = function() {
    var curx, curxx;
    // trick to get cursor position
    $("wave").each(function(i) {
       if (i===1 ) curx = $(this).width();
    });
    if ( curx > $("#waveform").width()/2 ) curx = $("#waveform").width()/2;
    $(".speech").css('margin-left', (curx-40)+'px' );
    $(".play-time").html( toHHMMSS(wavesurfer.getCurrentTime()) + " / " + toHHMMSS(wavesurfer.getDuration()) );
}

var addToBook = function(regid) {
    bRegionId = regid;
    $("#modal-book").modal("show");
    $("#spinner-book").css("display", "none");
}

var whisperStart = function(regid) {
    $("#modal-edit").off("hidden.bs.modal");
    $("#modal-edit").modal("hide");
    if ( regid != '' ) {
       currentRegion = regid;
    }
    parent.window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
    $("#modal-whisper").modal("show");
    $("#spinner-whisper").css("display", "none");
    $("#help-whisper").css("display", "block");
}


/**
 * Init & load.
 */
document.addEventListener('DOMContentLoaded', function() {

    $("#modal-wait").modal("show");
    $('#spinner-global').css('display','block');

    var jqxhr = $.post( {
       url: '../../get-title.php',
       data: {
          url: encodeURIComponent(soundfile),
       },
       dataType: "text/html" 
    }).fail(function(data) {
       if ( data.status === 200 ) {
         $("#title").html(data.responseText);
       } else {
          console.log("getting title failed : " + JSON.stringify(data));
          // alertAndScroll("getting biography failed : " + JSON.stringify(data));
       }
    });

    progressColor = $("#progresscolor").html();
    waveColor = $("#wavecolor").html();
    mapProgressColor = $("#mapprogresscolor").html();
    mapWaveColor = $("#mapwavecolor").html();
    // Init wavesurfer
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        height: 200,
        pixelRatio: 1,
        scrollParent: true,
        normalize: true,
        minimap: true,
        mediaControls: true,
        fillParent: true,
        hideScrollbar: true,
        barRadius: 0,
        forceDecode: false,
        waveColor: waveColor,
        progressColor: progressColor,
        backend: 'MediaElement',
        plugins: [
            WaveSurfer.regions.create(),
            WaveSurfer.markers.create(),
            WaveSurfer.minimap.create({
                 container: '#wave-minimap',
                 height: 50,
                 showRegions: true,
                 showOverview: true,
                 waveColor: mapWaveColor,
                 progressColor: mapProgressColor,
                 cursorColor: '#000000' // black
            }),
            WaveSurfer.timeline.create({
                container: '#wave-timeline'
            })
        ]
    });

    wavesurfer.util
        .fetchFile({
            responseType: 'json',
            url: 'peaks.json'
        })
        .on('success', function(data) {
            wavesurfer.load(
                soundfile,
                data
            );
        });

    /* Regions */
    wavesurfer.on('ready', function() {

        wavesurfer.enableDragSelection({
            color: randomColor(0.1)
        });

        loadRegions();
        drawRegions();
        // zoom is the number of minutes limited to 10
        wzoom = Math.floor( wavesurfer.getDuration() / 60.0 )+1;
        if ( wzoom > 10 ) wzoom = 10;
        $('#zlabel').html("Zoom : " + Number(wzoom));
        $('#zoomZoom').value = Number(wzoom);
        wavesurfer.zoom(wzoom);
        $('#svalue').html(("x"+wspeed).substring(0,4));
	if ( sstart !== null )
        {
           if ( ( wavesurfer.getDuration() > 0 ) && ( sstart >= 0 ) && ( sstart <= wavesurfer.getDuration() ) )
           {
	       wavesurfer.seekTo( sstart/wavesurfer.getDuration() );
           }
        }
        moveSpeech();
        $("#modal-wait").modal("hide");
        $('#spinner-global').css('display','none');
    });

    wavesurfer.on('region-click', regionClick);
    wavesurfer.on('region-dblclick', editAnnotation);
    wavesurfer.on('region-updated', drawAndSaveRegions);
    wavesurfer.on('region-removed', drawAndSaveRegions);
    wavesurfer.on('region-in', showNote);
    wavesurfer.on('region-out', deleteNote);
    wavesurfer.on('region-play', function(region) {
        // console.log( 'got region play : ' + region.id );
        // do nothing, the loop option on region is enough
        // region.on('out', function() {
        //     console.log( 'restart playing');
        //     wavesurfer.play(region.start);
        // });
    });

    wavesurfer.on('audioprocess', function() {
        moveSpeech();
    });

    wavesurfer.on('play', function() {
        $("#fplay").removeClass('fa-play');
        $("#fplay").addClass('fa-pause');
        $("#fplay").attr('data-action','pause');
        // if ( currentRegion != null ) {
        //    $("#r"+currentRegion).removeClass("fa-play");
        //    $("#r"+currentRegion).addClass("fa-pause");
        // }
    });

    wavesurfer.on('pause', function() {
        $("#fplay").removeClass('fa-pause');
        $("#fplay").addClass('fa-play');
        $("#fplay").attr('data-action','play');
        if ( currentRegion != null ) {
           $("#r"+currentRegion).removeClass("fa-pause");
           $("#r"+currentRegion).addClass("fa-play");
           $("#"+currentRegion).css("border-color","#000000");
        }
    });

    wavesurfer.responsive=true;

    $('#sminus').on('mousedown', function() {
       evid = setTimeout( "decSpeed();", 100 );
    });

    $('#sminus').on('mouseup', function() {
       if ( typeof svid != "undefined" ) clearTimeout(svid);
       wavesurfer.setPlaybackRate(wspeed);
    });

    $('#sminus').on('mouseout', function() {
       if ( typeof svid != "undefined" ) clearTimeout(svid);
       wavesurfer.setPlaybackRate(wspeed);
    });

    $('#splus').on('mousedown', function() {
       evid = setTimeout( "incSpeed();", 100 );
    });

    $('#splus').on('mouseup', function() {
       if ( typeof svid != "undefined" ) clearTimeout(svid);
       wavesurfer.setPlaybackRate(wspeed);
    });

    $('#splus').on('mouseout', function() {
       if ( typeof svid != "undefined" ) clearTimeout(svid);
       wavesurfer.setPlaybackRate(wspeed);
    });

    $('#sfull').on('click', function() {
       var ih = document.querySelector('#isubtitle').innerHTML;
       document.querySelector('#content-fs').innerHTML = ih;
       $("#modal-sfull").modal("show");
    });

    $('#help').on('click', function() {
        $("#modal-help").modal("show");
    });

    $("#modal-book").on("hidden.bs.modal", function() {
        console.log( "modal book hide" );
        // stop playing in a loop
        if ( currentRegion != null ) {
           let mregion = wavesurfer.regions.list[currentRegion];
           console.log( "hide books : stopping loop");
           mregion.setLoop(false);
           mregion.un("out");
           currentRegion = null;
        }
    });

    $("#modal-book").on("shown.bs.modal", function() {
        var jqxhr = $.post( {
           url: '../../get-audiobooks.php',
        }, function(data) {
           console.log( "got audiobooks : " + JSON.stringify(data));
           var books = JSON.parse(data);
           $('#oldbook option').each(function() {
              $(this).remove();
           });
           $('#oldbook').append($('<option>', {
              value: 'none',
              text: 'none'
           }));
           $('#oldbook').val('none').trigger('chosen:updated'); //refreshes the drop down list
           $.each(books, function (id, book) {
              $('#oldbook').append($('<option>', {
                 value: decodeURI(book),
                 text: decodeURI(book)
              }));
           });
        })
        .fail(function(error) {
           console.log( "getting audiobooks failed : " + JSON.stringify(error));
        });
    });

    resetAll.onclick = function(e) {
      if ( (typeof wavesurfer == "undefined") || (wavesurfer.getDuration() <= 0) ) {
         alertify.alert("Wavesurfer is not initialized!<br/><br/>");
      }
      if ( frozen ) {
         if ( showFrozen <= maxFrozen ) {
            alertAndScroll("Document is frozen until AI job completes, so your changes will not be saved\n until the automatic transcription completes!");
            showFrozen++;
         }
         return;
      }
      alertify.confirm( "Are you sure sure you want to reset the whole document and loose all previous work?<br/><br/>"      
      , function (e) {
         if (e) {
             var jqxhr = $.post( {
                url: '../../delete-all-free.php',
                data: {
                   source: fullEncode(soundfile),
                },
                dataType: "text/html" 
             }).fail(function(data) {
                if ( data.status === 200 ) {
                  console.log("cleared on server");
                  wavesurfer.un('region-updated');
                  wavesurfer.un('region-removed');
                  wavesurfer.clearRegions();
                  drawAndSaveRegions();
                  wavesurfer.on('region-updated', drawAndSaveRegions);
                  wavesurfer.on('region-removed', drawAndSaveRegions);
                } else {
                  console.log("deleting free annotaions failed : " + JSON.stringify(data));
                  alertAndScroll("deleting free annotaions failed : " + JSON.stringify(data));
                }
            });
          } else {
            console.log("resetting all cancelled");;
          }
        });
    }

    selectAll.onclick = function(e) {
      if ( (typeof wavesurfer == "undefined") || (wavesurfer.getDuration() <= 0) ) {
         alertify.alert("Wavesurfer is not initialized!<br/><br/>");
      }
      if ( frozen ) {
         if ( showFrozen <= maxFrozen ) {
            alertAndScroll("Document is frozen until AI job completes, so your changes will not be saved\n until the automatic transcription completes!");
            showFrozen++;
         }
         return;
      }
      let wregion = wavesurfer.regions.add({
          start: 0.0,
          end: wavesurfer.getDuration(),
          resize: true,
          drag: true,
          data: {
             note: "",
             user: user,
             color: ucolor,
             norder: nbRegions+1,
             id: -1,
             whispered : 0
          }
      });
      drawAndSaveRegions();
    }

    zoomZoom.oninput = function(e) {
       wavesurfer.responsive=false;
       console.log("setting zoom : " + Number(this.value) );
       wavesurfer.zoom(Number(this.value));
       $("#zlabel").html("Zoom : " + Number(this.value) );
       wavesurfer.responsive=true;
    }

    callAI.onsubmit = function(e) {
        var model = $('#AImodel').find(":selected").val();
        var language = $('#AIlang').find(":selected").val();
        var counter = 0;
        var order = -1;
        e.preventDefault();
        if ( language == "None" ) {
           alertify.alert("Please, choose a language!<br/><br/>");
           return;
        }
	if ( currentRegion == null ) {
           alertAndScroll( "Don't know what you are talking about ( unknown note )" );
           return -1;
        }
        Object.keys(wavesurfer.regions.list).map(function(id) {
           ++counter;
           if ( id === currentRegion ) { 
              order=counter;
           }
        });
        drawRegions();
        saveRegions();
        console.log("whisper request on : " + soundfile + " : " + order);
        $('#help-whisper').css('display','none');
        $('#spinner-whisper').css('display','block');
        var jqxhr = $.post( {
           url: '../../submit-whisper.php',
           data: {
             model: fullEncode(model),
             lang: fullEncode(language),
             source: fullEncode(soundfile),
             order: order,
             user: user,
             color: ucolor,
             linear: false
           },
           dataType: 'application/json'
        })
        .fail(function(error) {
           $('#spinner-whisper').css('display','none');
           $('#help-whisper').css('display','block');
           $("#modal-whisper").modal("hide");
           if ( error.status == 200 ) {
              alertAndScroll( "Calling whisper succeeded : Now the document is frozen until the job complete, so go play your favorite game and come back later !");
              $("#frozen").css("display","block");
              wavesurfer.regions.list[currentRegion].data.whispered = 1;
              frozen=true;
              console.log( "Whisper job created successfully : frozen ! " + frozen );
           } else {
              alertAndScroll( "Calling whisper failed : " + error.statusText );
              wavesurfer.regions.list[currentRegion].data.whispered = 0;
              frozen=false;
              console.log( "Calling whisper failed : " + JSON.stringify(error) + " frozen ! " + frozen);
           }
        });
    }

    addbook.onsubmit = function(e) {
        var regionId = bRegionId;
        var order = -1;
        var counter = 0;
        e.preventDefault();
        Object.keys(wavesurfer.regions.list).map(function(id) {
           ++counter;
           if ( regionId === id ) order=counter;
        });
        var oldbook = $('#oldbook').val();
        var newbook = $('#newbook').val();
        if ( newbook === '' && oldbook === 'none' )
        {
           alertAndScroll( "Please, choose an existing book or create a new one!" );
           return;
        }
        $('#spinner-book').css('display','block');
        var jqxhr = $.post( {
           url: '../../add-to-book.php',
           data: {
             oldbook: fullEncode(oldbook),
             newbook: fullEncode(newbook),
             order: order,
             user: user,
             source: fullEncode(soundfile),
           },
           dataType: 'application/json'
        }, function() {
           console.log( "add to book succeeded" );
           $('#spinner-book').css('display','none');
           $("#modal-book").modal("hide");
        })
        .always(function(error) {
           $('#spinner-book').css('display','none');
           $("#modal-book").modal("hide");
           if ( error.status == 200 ) {
              console.log( "add to book success");
           } else {
              console.log( "adding to book failed : " + JSON.stringify(error));
              alertAndScroll( "Adding to book failed : " + error.statusText );
           }
        });
    };

    $('#audiobook').on('click', function() {
       var form = document.forms.edit;
       bRegionId = form.dataset.region;
       // console.log( "audio book click : pause" );
       // wavesurfer.pause();
       $("#modal-edit").off("hidden.bs.modal");
       $("#modal-edit").modal("hide");
       $("#modal-book").modal("show");
       $("#spinner-book").css("display", "none");
    });

    $('#help').on('click', function() {
        $("#modal-help").modal("show");
    });

    // $('#subtitle').css('display','block');

    $('#note').trumbowyg({
        // btns: [['strong', 'em',], ['insertImage']],
        // autogrow: true
    })
    .on('tbwchange', function(e){
        //  save as soon as you type? not recommended
        // let wregion = wavesurfer.regions.list[currentRegion];
        // var newnote = $('#note').trumbowyg('html');
        // newnote = newnote.replaceAll("<p", "<div" );
        // newnote = newnote.replaceAll("</p>", "</div>" );
        // wregion.update({
        //     start: wregion.start,
        //     end: wregion.end,
        //     data: {
        //         note: newnote,
        //         user: user,
        //         color: ucolor
        //     }
        // });
        // drawAndSaveRegions();
    });

    let langselect = document.getElementById('AIlang');
    for (const lang of wlangs)  {
       langselect.options[langselect.options.length] = new Option(lang, lang);
    }
    // $('.lds-spinner').css('display','none');
});

/**
 * Draw markers, table of notes and navigation and store in local storage
 */
function drawRegions() {

    // redraw and save to the server
    var counter=0;
    var navigation="<center><b>Navigate</b></center><br/><br/>";
    $("#linear-notes").html('');
    // redraw markers
    wavesurfer.clearMarkers();
    localStorage.regions = JSON.stringify(
        Object.keys(wavesurfer.regions.list).map(function(id) {
            var wregion = wavesurfer.regions.list[id];
            var burl = document.location.href;
            if ( burl.indexOf('?') >= 0 )
            {
               burl = burl.substr( 0, burl.indexOf('?') );
            } 
            counter++;
            // console.log(wregion.data.note);
            var leyenda = "...";
            if ( typeof wregion.data.note != "undefined" )
               leyenda = wregion.data.note.replaceAll("<div>","").replaceAll("</div>","").substring(0,20)+"...";
            navigation+="<a href='javascript: playAt("+wregion.start+")'>"+counter+" - "+leyenda+"<br/></a>";
            var blank = "<br/><br/><div class='linear-bar' id='bar-"+wregion.id+"'>";
            $("#linear-notes").append(blank);
            var range = "<p>"+counter+" : "+toHHMMSS(wregion.start)+" - "+toHHMMSS(wregion.end)+" (" + Math.round(wregion.end-wregion.start) + " s) : </p>";
            $("#bar-"+wregion.id).append(range);
            var rplay = "<i class='fa fa-play fa-1x linear-play' title='Play this Part' id='r"+wregion.id+"' onclick='playRegion(\""+wregion.id+"\", \"true\")'></i>";
            $("#bar-"+wregion.id).append(rplay);
            var rbook = "<i class='fa fa-book fa-1x linear-book' title='Add to Book' id='b"+wregion.id+"' onclick='addToBook(\""+wregion.id+"\")'></i>";
            $("#bar-"+wregion.id).append(rbook);
            // console.log("whisper : "+whisper);
            if ( whisper == 1 ) {
               var rwhisper = "<img src='../../img/whisper-logo.png' title='Call Whisper AI' class='whisper-logo' id='w"+wregion.id+"' onclick='whisperStart(\""+wregion.id+"\")' />";
               $("#bar-"+wregion.id).append(rwhisper);
            }
            var wnote = '';
            if ( wregion.data != undefined && wregion.data.note != undefined ) {
               wnote = wregion.data.note.replaceAll("<div>","").replaceAll("</div>","");
            }
            var ncontent = "<textarea id='"+wregion.id+"' class='note-textarea'>"+wnote+"</textarea>";
            $("#linear-notes").append(ncontent);
            $("#"+wregion.id).on( 'change', function(evt) {
                var id = $(this).attr('id');
                wavesurfer.regions.list[id].data.note=evt.target.value;
                drawAndSaveRegions();
            });
            wavesurfer.addMarker({
               time : wregion.start,
               label : counter,
               color : "#0000ff",
               position : "bottom"
            });
            wavesurfer.addMarker({
               time : wregion.end,
               label : "",
               color : "#00ff00",
               position : "bottom"
            });
            wavesurfer.addMarker({
               time : wregion.end,
               label : counter,
               color : "#ff0000",
               position : "top"
            });
            wavesurfer.on("marker-click", deleteAnnotation);
            let whispered=0;
            if ( typeof wregion.data.whispered != "undefined" )
                whispered = wregion.data.whispered;
            return {
                order: counter,
                start: wregion.start,
                end: wregion.end,
                baseurl: fullEncode(burl),
                source: fullEncode(soundfile),
                title: fullEncode(document.querySelector('#title').innerHTML.toString().substr(8)),
                url: fullEncode(burl+'?start='+wregion.start),
                data: ( typeof wregion.data.note != "undefined" )?wregion.data.note : "",
                color: ( typeof wregion.data.color != "undefined" )?wregion.data.color : "",
                id: ( typeof wregion.data.id != "undefined" )?wregion.data.id : "-1",
                user: user,
                whispered: whispered
            };
        })
    );
    $("#notes").html(navigation);
    console.log( "drawn " + counter + " regions");
}


/**
 * Called every time a region is modified
 */
function drawAndSaveRegions() {
    drawRegions();
    saveRegions();
}

/**
 * Save annotations to the server and redraw everything
 */
function saveRegions() {

    if ( strstr(localStorage.regions.replaceAll('\"',''), 'whispered:1') ) {
       if ( showFrozen <= maxFrozen  ) {
          alertAndScroll("Document is frozen until AI job completes, so your changes will not be saved\n until the automatic transcription completes!");
          showFrozen++;
       }
       frozen=true;
       console.log( "save regions : frozen : " + frozen );
       return;
    } else {
       frozen=false;
       console.log( "save regions : frozen : " + frozen );
    }

    anotes = JSON.parse(localStorage.regions);
    console.log( "saving : " + anotes.length + " annotations to the server" );
    // a little bit simplified
    var jqxhr = $.post( {
      url: 'save-annotations.php',
      data: {
	'json': JSON.stringify(anotes.sort(sorta))
      },
      dataType: 'application/json'
    }, function() {
       // reload regions from the server with ids
       loadRegions();
       drawRegions();
       // console.log( "Saving annotations succeeded" );
    })
    .fail(function(error) {
       if ( error.status == 200 ) {
          // console.log( "saving annotations success");
       } else {
          console.log( "Saving annotations failed : status : " + error.status + " message : " + JSON.stringify(error));
          alertAndScroll(  "Saving annotations failed : status : " + error.status + " message : " + JSON.stringify(error) );
       }
    });
}

/**
 * Load regions from ajax request.
 */
function loadRegions() {
 
    wavesurfer.un('region-updated');
    wavesurfer.un('region-removed');
    wavesurfer.clearRegions();
    nbRegions=0;
    $.post({
        responseType: 'json',
        url: 'get-annotations.php',
        data: {
            source: fullEncode(soundfile)
        }
    }, function(regions) {
      regions.forEach(function(region) {
        if ( region.whispered != undefined && region.whispered == 1 ) {
           $("#frozen").css("display", "block");
           frozen=true;
           console.log("show free frozen : " + frozen);
        }
        nbRegions++;
        wregion = wavesurfer.regions.add({
             start: region.start,
             end: region.end,
             resize: true,
             drag: true,
             data: {
                note: ( region.data != undefined ) ? region.data : '',
                user: user,
                color: randomColor(0.1),
                norder: region.norder,
                id: region.id,
                whispered : ( region.whispered != undefined ) ? region.whispered : 0
             }
        });
      });
      drawRegions();
      creationPending=false;
      console.log("creationPending = false");
    }).fail(function(error) {
       console.log( "couldn't load annotations : " + JSON.stringify(error) );
       $("#modal-wait").modal("hide");
       $('#spinner-global').css('display','none');
    });
    wavesurfer.on('region-updated', drawAndSaveRegions);
    wavesurfer.on('region-removed', drawAndSaveRegions);
}

/**
 * Random RGBA color.
 */
function randomColor(alpha) {
    return (
        'rgba(' +
        [
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            alpha || 1
        ] +
        ')'
    );
}

/**
 * When a region is clicked, pass the click to the waveform.
 */
function regionClick(region, e) {
    if ( currentRegion != null && region.id != currentRegion )
       deleteNote(region);
    showNote(region);
    playRegion(region.id, true );

    // propagate click to the waveform
    var clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY
    });
    document.querySelector('wave').dispatchEvent(clickEvent);
}

/**
 * Edit annotation for a region.
 */
function editAnnotation(region, e) {
    e.stopPropagation();
    console.log( "edit : play region" );
    if ( frozen ) {
       if ( showFrozen <= maxFrozen ) {
          alertAndScroll("Document is frozen until AI job completes, so your changes will not be saved\n until the automatic transcription completes!");
          showFrozen++;
       }
       return;
    }
    currentRegion=region.id;
    playRegion(currentRegion, true);
    var form = document.forms.edit;
    form.dataset.region = region.id;
    $('#note').trumbowyg('html', region.data.note || '');
    form.onsubmit = function(e) {
        e.preventDefault();
        // console.log( 'saving : ' + form.elements.note.value);
        var newnote = form.elements.note.value;
        newnote = newnote.replaceAll("<p", "<div" );
        newnote = newnote.replaceAll("</p>", "</div>" );
        region.update({
            start: region.start,
            end: region.end,
            data: {
                note: newnote,
                user: user, 
                color: ucolor
            }
        });
        $("#modal-edit").modal("hide");
    };
    form.onreset = function() {
        $("#modal-edit").modal("hide");
    };
    $("#modal-edit").modal("show");
    $("#modal-edit").on("hidden.bs.modal", function() {
        if ( currentRegion ) {
           let mregion = wavesurfer.regions.list[currentRegion];
           console.log( "hide annotation : stopping loop");
           mregion.setLoop(false);
           mregion.un("out");
        }
    });
}

/**
 * Display annotation.
 */
function showNote(region) {
    currentRegion = region.id;
    // console.log( "show note");
    if (!showNote.el || !showNote.uel) {
        showNote.uel = document.querySelector('#subtitle');
        showNote.el = document.querySelector('#isubtitle');
        showNote.speaker = document.querySelector('#ispeaker');
        showNote.sfull = document.querySelector('#sfull');
    }
    var snote = '';
    if ( region.data && region.data.note ) {
       var lines = region.data.note.split("\n");
       lines.forEach( function( line, index ) {
          // console.log(line.substring(2,3) + " " + line);
          if ( line.substring(2,3) ==  ":" ) {
             if ( language === '--' || language === line.substring(0,2) ) {
                snote += line.substring(3);
             }
          } else {
             snote += line;
          }
          // check if it's html or normal text
          if ( !strstr( line, "<" ) && !strstr( line, ">" ) ) {
             snote += "<br/>";
          }
       });
    }
    showNote.el.innerHTML = snote;
    showNote.speaker.innerHTML = region.data.user || '';
    // showNote.speaker.style.background = region.data.color || '';
    // showNote.sfull.style.background = region.data.color || '';
    // showNote.el.innerHTML = showNote.el.innerHTML.replace(/\n/g,'<br>');
    console.log( "show note : " + showNote.el.textContent || showNote.el.innerText );
    if ( showNote.el.innerHTML != '' ) {
       showNote.el.style.display = 'block';
       showNote.uel.style.display = 'block';
       showNote.speaker.style.display = 'block';
    } else {
       showNote.el.style.display = 'none';
       showNote.uel.style.display = 'none';
       showNote.speaker.style.display = 'none';
    }
}

/**
 * Delete annotation.
 */
function deleteNote(region) {
    // we're out of the region, so playing button must be turned off
    // if ( currentRegion != null ) {
    //   $("#r"+currentRegion).removeClass("fa-pause");
    //   $("#r"+currentRegion).addClass("fa-play");
    //   $("#"+currentRegion).css("border-color","#000000");
    //   currentRegion = null;
    // }
    if (!deleteNote.el || !deleteNote.uel) {
       deleteNote.el = document.querySelector('#isubtitle');
       deleteNote.uel = document.querySelector('#subtitle');
       deleteNote.speaker = document.querySelector('#ispeaker');
    }
    deleteNote.uel.style.display = 'none';
    if ( !region.data.note ) return;
    var textl =  $('#isubtitle').text();
    var div = document.createElement("div");
    div.innerHTML = region.data.note;
    var textr = div.textContent || div.innerText || "";
    textr = textr.replaceAll("\n","");
    console.log( "delete note : " + textr );
    console.log( "delete note : " + textl );
    if ( (textr === textl) || (textr=="") || (textl=="") ) {
       deleteNote.el.innerHTML = '';
       deleteNote.el.style.display = 'none';
       deleteNote.uel.style.display = 'none';
       deleteNote.speaker.style.display = 'none';
    } else
       deleteNote.uel.style.display = 'block';
}

/**
 * Delete annotation after click on the red marker
 * Strangely, this event is received for each annotation although you only click on only one at a time
 */
let showConfirm = false;
function deleteAnnotation(marker, e) {
    e.stopPropagation();
    if ( marker.color == "#ff0000" && !showConfirm) {
       showConfirm = true;
       if ( currentRegion != null )
          deleteNote(wavesurfer.regions.list[currentRegion]);
       console.log( "Deleting annotation : " + marker.label + " " + marker.time + " wavesurfer time : " + wavesurfer.getCurrentTime() );
       alertify.confirm( "Are you sure sure you want to delete annotation : " + marker.label + " ?<br/>", function (e) {
         if (e) {
           //after clicking OK
           doDeleteAnnotation(marker.label);
           showConfirm = false;
         } else {
           //after clicking Cancel
           console.log("deletion cancelled");
           showConfirm = false;
         }
       });
    }
    return true;
}

function doDeleteAnnotation(index) {
    var counter = 0;
    Object.keys(wavesurfer.regions.list).map(function(id) {
        ++counter;
        if ( counter == index ) {
           console.log("Deleting region : " + id);
           var region = wavesurfer.regions.list[id];
           deleteNote(wavesurfer.regions.list[id]);
           wavesurfer.regions.list[id].remove();

           console.log("Do delete annotation : " + counter);
           var jqxhr = $.post( {
             url: '../../delete-annotation.php',
             data: {
               order: counter,
               source: fullEncode(soundfile)
             },
             dataType: 'application/json'
           }, function() {
             console.log( "deleting annotation succeeded" );
           })
           .fail(function(error) {
             if ( error.status == 200 ) {
               drawAndSaveRegions();
               console.log( "deleting annotation success");
             } else {
               console.log( "deleting annotation failed : " + JSON.stringify(error));
             }
           });
        }
    });
}


/**
 * Bind controls.
 */
window.GLOBAL_ACTIONS['delete-region'] = function() {
    var form = document.forms.edit;
    var regionId = form.dataset.region;
    var order = -1;
    var counter = 0;

    Object.keys(wavesurfer.regions.list).map(function(id) {
        ++counter;
        if ( regionId === id ) order=counter;
    });

    console.log( 'deleting region : ' + counter );

    if (regionId) {
        deleteNote(wavesurfer.regions.list[regionId]);
        wavesurfer.regions.list[regionId].remove();
        drawAndSaveRegions();
        form.reset();

        var jqxhr = $.post( {
          url: '../../delete-annotation.php',
          data: {
            order: order ,
            source: fullEncode(soundfile)
          },
          dataType: 'application/json'
        }, function() {
          console.log( "deleting annotation succeeded" );
        })
        .fail(function(error) {
          if ( error.status == 200 ) {
             console.log( "deleting annotation success");
          } else {
             console.log( "deleting annotation failed : " + JSON.stringify(error));
          }
        });
    }
};

var sorta = function( notea, noteb ) {
    if ( notea["start"] < noteb["start"] ) {
      return -1;
    } else if ( notea["start"] > noteb["start"] ) {
      return 1;
    } else {
      return 0;
    }
}

var playAt = function(position) {
    if ( currentRegion != null ) {
      $("#r"+currentRegion).removeClass("fa-pause");
      $("#r"+currentRegion).addClass("fa-play");
      $("#"+currentRegion).css("border-color","#000000");
    }
    console.log("play at : " + position/wavesurfer.getDuration() );
    wavesurfer.seekTo( position/wavesurfer.getDuration() );
    wavesurfer.play();
    Object.keys(wavesurfer.regions.list).map(function(id) {
       let wregion=wavesurfer.regions.list[id];
       if ( wregion.start <= position && position <= wregion.end ) {
          $("#r"+id).removeClass("fa-play");
          $("#r"+id).addClass("fa-pause");
          $("#"+id).css("border-color","#ff0000");
          currentRegion=id;
       }
    });
}

window.GLOBAL_ACTIONS['export'] = function() {

    anotes = JSON.parse(localStorage.regions);
    anotes = anotes.sort(sorta);
    if ( anotes.length === 0 )
    {
       alertAndScroll( "There is nothing to export!" );
       return;
    }
    var subtitles = '';
    var counter = 1;
    anotes.forEach( function(note, index) {
       subtitles += counter+'\n';
       counter++;
       subtitles += toHHMMSS(note.start)+' --> '+toHHMMSS(note.end)+'\n';
       var lines = note.data.split("\n");
       if ( typeof lines != "undefined" ) { 
          lines.forEach( function( line, index ) {
             subtitles += $('<div>').html(line).text()+'\n';
          });
          subtitles += '\n';
       }
    });

    // force subtitles download
    var element = document.createElement('a');
    var filename = $("#title").html().toString().split('(')[0]+'-free.srt';
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(subtitles));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

var playRegion = function(regid, changeState) {
    var wregion = wavesurfer.regions.list[regid];
    console.log( "play region : " + regid + " current :  " + currentRegion);
    if ( regid == currentRegion && !changeState ) {
       return;
    }

    Object.keys(wavesurfer.regions.list).map(function(id) {
       $("#r"+id).removeClass("fa-pause");
       $("#r"+id).addClass("fa-play");
       $("#"+id).css("border-color","#000000");
    });

    // really stop
    if ( regid == currentRegion ) {
       if ( !wavesurfer.isPlaying() ) {
          wregion.setLoop(true);
          wregion.playLoop();
          $("#r"+regid).removeClass("fa-play");
          $("#r"+regid).addClass("fa-pause");
          $("#"+regid).css("border-color","#ff0000");
          return;
       } else {
          wavesurfer.pause();
          return;
        }
    }

    if ( !wavesurfer.isPlaying() )
    {
       wregion.setLoop(true);
       wregion.playLoop();
       $("#r"+regid).removeClass("fa-play");
       $("#r"+regid).addClass("fa-pause");
       $("#"+regid).css("border-color","#ff0000");
       currentRegion = regid;
    } else {
       console.log("play region over other : " + regid );
       $("#r"+regid).removeClass("fa-play");
       $("#r"+regid).addClass("fa-pause");
       $("#"+regid).css("border-color","#ff0000");
       currentRegion = regid;
       wregion.setLoop(true);
       wregion.playLoop();
    }
}
