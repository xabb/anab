/**
 * Create a WaveSurfer instance.
 */
var wavesurfer;
var wavewidth=940;
var nbPeaks=32768;
var wzoom=10;
var wspeed=1.0;
var gotPeaks=false;
var languages = '--';
var language = '--';
var peaks;
var regions;
var evid;
var svid;
var wavey=-1;
var frozenl=false;
var maxFrozenl = 20;
var showFrozenl = 0;
var currentRegion;
var nbRegions=0;
var soundfile = 'https://stream.political-studies.net/~tgs1/audio/2021-03-04-zanaan-wanaan.mp3';

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

var decZoom = function() {
    if ( wzoom <= 1.0 )
       wzoom=Math.max(wzoom-0.2,0.1);
    else
       wzoom=Math.max(wzoom-1,1);
    console.log( "wzoom = " + wzoom );
    $('#zvalue').html(("x"+wzoom).substring(0,4));
    // evid = setTimeout( "decZoom();", 500 );
}

var incZoom = function() {
    if ( wzoom < 1 )
       wzoom=Math.min(wzoom+0.1,1.0);
    else
       wzoom=Math.min(wzoom+1,100);
    $('#zvalue').html(("x"+wzoom).substring(0,4));
    // evid = setTimeout( "incZoom();", 500 );
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

/**
 * Init & load.
 */
document.addEventListener('DOMContentLoaded', function() {

    $("#modal-waitl").modal("show");

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
          // alertAndScroll("getting title failed : " + JSON.stringify(data));
       }
    });

    progressColor = $("#progresscolor").html();
    waveColor = $("#wavecolor").html();
    mapProgressColor = $("#mapprogresscolor").html();
    mapWaveColor = $("#mapwavecolor").html();

    $(document).scroll(function() {
       if ( $(document).scrollTop() <= wavey ) 
          $("#waveform").css({top:''});
       else
          $("#waveform").css({top:$(document).scrollTop()-wavey});
    });

    console.log("loading peaks");
    var jqxhr = $.post( {
        responseType: 'json',
        url: 'peaks.json'
    }, function(data) {
        peaks = data;
        console.log( "got peaks : " + peaks.length );
        if ( peaks.length == 2*nbPeaks )
        {
           // Init wavesurfer
           wavesurfer = WaveSurfer.create({
              container: '#waveform',
              height: 100,
              pixelRatio: 1,
              scrollParent: true,
              normalize: true,
              minimap: true,
              barRadius: 0,
              forceDecode: false,
              fillParent: true,
              mediaControls: true,
              hideScrollbar: true,
              backend: 'MediaElement',
              minPxPerSec: 50,
              waveColor: waveColor,
              progressColor: progressColor,
              plugins: [
                 WaveSurfer.regions.create(),
                 WaveSurfer.markers.create(),
              ]
           });

           console.log( "loading with peaks : " + soundfile );
           wavesurfer.load(
              soundfile,
              data
           );
           gotPeaks=true;
        } else {
           // Init wavesurfer
           wavesurfer = WaveSurfer.create({
              container: '#waveform',
              height: 100,
              pixelRatio: 1,
              scrollParent: true,
              normalize: true,
              minimap: true,
              barRadius: 0,
              forceDecode: false,
              fillParent: true,
              mediaControls: true,
              hideScrollbar: true,
              backend: 'WebAudio',
              minPxPerSec: 50,
              waveColor: waveColor,
              progressColor: progressColor,
              plugins: [
                 WaveSurfer.regions.create(),
              ]
           });

           console.log( "loading : " + soundfile );
           wavesurfer.load(
              soundfile
           );
           gotPeaks=false;
        }

        /* Regions */
        wavesurfer.on('ready', function() {

            var wposition = getPosition( document.getElementById("waveform") );
            console.log("waveform is at : (" + wposition.x + "," + wposition.x + ")");
            wavey = wposition.y;
            // this function doesn't work
            wavey = 100;

            if ( !gotPeaks )
            {
               aPeaks = wavesurfer.backend.getPeaks(nbPeaks);
               console.log( "saving peaks : " + aPeaks.length );
               var jqxhr = $.post( {
                   url: 'save-peaks.php',
                   data: {
	               'json': JSON.stringify(aPeaks)
                   },
                   dataType: 'application/json'
               }, function() {
                   console.log( "saving peaks succeeded" );
                   location.reload();
               }).fail(function(error) {
                   if ( error.status === 200 ) {
                      console.log( "saving peaks success");
                      location.reload();
                   } else {
                      console.log( "saving peaks failed : status : " + error.status + " message : " + JSON.stringify(error));
                   }
               });

            } else {

               var jqxhr = $.post( {
                   responseType: 'json',
                   url: 'get-annotations-linear.php',
                   data: {
                      source: fullEncode(soundfile)
                   }
               }, function(data) {
   
                   var counter=4096;
                   if (data) console.log( "got linear annotations : " + data.length );
                   if ( data.length > 0 )
                      regions = data;
                   else
                      regions = extractRegions( peaks, wavesurfer.getDuration() );
   
                   $("#linear-notes").html('');
                   regions.forEach( function(region) {
                      if ( region.data != undefined && region.data != undefined ) {
                          var lines = region.data.split("\n");
                          lines.forEach( function(line, index) {
                             if ( line.length > 3 && line[2]==':' )
                             {
                                var lang = line.substring(0,2);
                                if ( strstr( languages, lang ) == 0 ) {
                                   languages += ","+lang;
                                } 
                             } 
                          });
                      }
                      counter++;
                      wregion = wavesurfer.regions.add({
                          start: region.start,
                          end: region.end,
                          resize: true,
                          drag: true,
                          data: {
                            note: ( region.data != undefined ) ? region.data : '',
                            user: user,
                            color: ucolor,
                            id: region.id,
                            norder: region.norder,
                            whispered : ( region.whispered != undefined ) ? region.whispered : 0 
                          }
                      });
                      nbRegions++;
                      if ( region.whispered != undefined && region.whispered == 1 ) {
                         console.log("show frozen");
                         $("#frozenl").css('display', 'block');
                      }
                      // console.log( wregion.id );
                      var blank = "<br/><br/><div class='linear-bar' id='bar-"+wregion.id+"'>";
                      $("#linear-notes").append(blank);
                      var range = "<p>"+(counter-4096)+" : "+toHHMMSS(region.start)+" - "+toHHMMSS(region.end)+" (" + Math.round(region.end-region.start) + " s) : </p>";
                      $("#bar-"+wregion.id).append(range);
                      var rbook = "<i class='fa fa-book fa-1x linear-book' title='Add to Book' id='b"+wregion.id+"' onclick='addToBook(\""+wregion.id+"\")'></i>";
                      $("#bar-"+wregion.id).append(rbook);
                      var rplay = "<i class='fa fa-play fa-1x linear-play' title='Play this Part' id='r"+wregion.id+"' onclick='playRegion(\""+wregion.id+"\",\"true\")'></i>";
                      $("#bar-"+wregion.id).append(rplay);
                      if ( whisper == 1 ) {
                         var rwhisper = "<img src='../../img/whisper-logo.png' title='Call Whisper AI' class='whisper-logo' id='w"+wregion.id+"' onclick='whisperStart(\""+wregion.id+"\")' />";
                         $("#bar-"+wregion.id).append(rwhisper);
                      }
                      var ncontent = "<textarea id='"+wregion.id+"' class='note-textarea'>"+wregion.data.note+"</textarea>";
                      $("#linear-notes").append(ncontent);
                      $("#"+wregion.id).on( 'change', function(evt) {
                           var id = $(this).attr('id');
                           let cregion = wavesurfer.regions.list[id];
                           cregion.data.note=evt.target.value;
                           drawAndSaveRegions();
                           cregion.setLoop(false);
                           deleteNote(cregion);
                           showNote(cregion);
                      });
                   });
                   drawRegions();
                   console.log( "we have : " + languages );
                   var header = "<center><div>Language</div></select>";
                   $("#subtitle-left").append(header);
                   var blank = "<br/>";
                   $("#subtitle-left").append(blank);
                   var select = "<center><select id='set-language' class='select-language'></select></center>";
                   $("#subtitle-left").append(select);
                   var options = languages.split(",");
                   options.forEach( function( option, index ) {
                       var option = "<option value='"+option+"'>"+option+"</option>";
                       $("#set-language").append(option);
                   });
                   $("#set-language").change(function() {
                       language = $("#set-language option:selected").val();
                       console.log("language set to : " + language );
                   });
   
                   $("#modal-waitl").modal("show");
                   // zoom is proportional to the number of minutes limited to 10
                   wzoom = Math.floor( wavesurfer.getDuration() / 60.0 )+1;
                   if ( wzoom > 10 ) wzoom = 10;
                   $('#zvalue').html(("x"+wzoom).substring(0,4));
                   setTimeout( "setZoom();", 5000 );
                   $('#svalue').html(("x"+wspeed).substring(0,4));
   
               }).fail(function(error) {
                   console.log( "couldn't load annotations : " + JSON.stringify(error) );
               });
            }
        
        }); // ready

        wavesurfer.on('region-click', regionClick);
        wavesurfer.on('region-dblclick', launchSplitAnnotation);
        wavesurfer.on('region-update-end', updateAnnotation);
        wavesurfer.on('region-in', showNote);
        wavesurfer.on('region-out', deleteNote);
        wavesurfer.on('region-updated', drawAndSaveRegions);
        wavesurfer.on('audioprocess', function() {
            $(".play-time").html( toHHMMSS(wavesurfer.getCurrentTime()) + " / " + toHHMMSS(wavesurfer.getDuration()) );
        });
    
        wavesurfer.on('pause', function() {
            $(".linear-play").removeClass('fa-pause');
            $(".linear-play").addClass('fa-play');
        });
    
        wavesurfer.on('play', function() {
         if ( currentRegion != null ) {
            let wregion = wavesurfer.regions.list[currentRegion];
            wregion.setLoop(false);
            $("#r"+currentRegion).removeClass("fa-pause");
            $("#r"+currentRegion).addClass("fa-play");
            $("#"+currentRegion).css("border-color","#000000");
            currentRegion = null;
         }
        });

        wavesurfer.responsive=true;

        selectAlll.onclick = function(e) {
          if ( (typeof wavesurfer == "undefined") || (wavesurfer.getDuration() <= 0) ) {
             alertify.alert("Wavesurfer is not initialized!<br/><br/>");
          }
          alertify.confirm( "Are you sure sure you want to select the whole document and loose all previous work?<br/><br/>"
          , function (e) {
             if (e) {
                 var jqxhr = $.post( {
                    url: '../../delete-all-linear.php',
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
                      wregion = wavesurfer.regions.add({
                           start: 0.0,
                           end: wavesurfer.getDuration(),
                           resize: true,
                           drag: true,
                           data: {
                              note: "",
                              user: user,
                              color: ucolor,
                              norder: 4096,
                              id: -1,
                              whispered : 0
                           }
                      });
                      drawAndSaveRegions();
                      updateTable();
                      wavesurfer.on('region-updated', drawAndSaveRegions);
                      wavesurfer.on('region-removed', drawAndSaveRegions);
                    } else {
                      console.log("deleting free annotaions failed : " + JSON.stringify(data));
                      alertAndScroll("deleting free annotaions failed : " + JSON.stringify(data));
                    }
                });
              } else {
                console.log("selecting all cancelled");;
              }
            });
        }

    }).fail(function(error) {
        console.log( "couldn't load peaks : " + JSON.stringify(error) );
    });

    $('#zminus').on('mousedown', function() {
       evid = setTimeout( "decZoom();", 100 );
    });

    $('#zminus').on('mouseup', function() {
       if ( typeof evid != "undefined" ) clearTimeout(evid);
       wavesurfer.zoom(wzoom);
    });

    $('#zminus').on('mouseout', function() {
       if ( typeof evid != "undefined" ) clearTimeout(evid);
       wavesurfer.zoom(wzoom);
    });

    $('#zplus').on('mousedown', function() {
       evid = setTimeout( "incZoom();", 100 );
    });

    $('#zplus').on('mouseup', function() {
       if ( typeof evid != "undefined" ) clearTimeout(evid);
       wavesurfer.zoom(wzoom);
    });

    $('#zplus').on('mouseup', function() {
       if ( typeof evid != "undefined" ) clearTimeout(evid);
       wavesurfer.zoom(wzoom);
    });
    
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

    $('#help').on('click', function() {
        $("#modal-help").modal("show");
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
        }).fail(function(error) {
           console.log( "getting audiobooks failed : " + JSON.stringify(error));
        });
    });

    let langselect = document.getElementById('AIlang');
    for (const lang of wlangs)  {
       langselect.options[langselect.options.length] = new Option(lang, lang);
    }

});

/**
 * Split annotations at the given dblclick position
 */
function setZoom() {
    console.log("set zoom");
    wavesurfer.zoom(wzoom);
    $("#modal-waitl").modal("hide");
}

/**
 * Split annotations at the given dblclick position
 */
function launchSplitAnnotation(region, e) {
    var clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY
    });
    document.querySelector('wave').dispatchEvent(clickEvent);
    e.stopPropagation();
    currentRegion = region.id;
    setTimeout( "splitAnnotation();", 200 );
}

/**
 * Split annotations at the given wavesurfer play time
 */
function splitAnnotation() {
    console.log( "split : split regions at : " + wavesurfer.getCurrentTime() );
    let counter = 0;
    Object.keys(wavesurfer.regions.list).map(function(id) {
            var lregion = wavesurfer.regions.list[id];
            counter++;
            console.log( ">" + lregion );
            if ( currentRegion == lregion.id ) {
                console.log( "split : inserting after annotation : " + counter + " (" + lregion.id + ")" );
                let startTime = wavesurfer.getCurrentTime();
                let endTime = wavesurfer.regions.list[id].end;
                wavesurfer.regions.list[id].end = wavesurfer.getCurrentTime();
                lregion.end = wavesurfer.getCurrentTime();
                let nregion = wavesurfer.regions.add({
                          start: startTime + 1.0, // plus one second
                          end: endTime,
                          resize: true,
                          drag: true,
                          data: {
                            note: ( lregion.data != undefined ) ? lregion.data.note : '',
                            user: user,
                            norder: nbRegions+4095+1,
                            color: ucolor,
                            whispered : ( lregion.data.whispered != undefined ) ? lregion.data.whispered : 0
                          }
                      });
                console.log("created linear region # : " + nbRegions+4096+1 );
                drawAndSaveRegions();
                nbRegions++;
            }
    });
    wavesurfer.drawer.fireEvent('redraw');
}

/**
 * Update annotation after drag or resize
 */
function updateAnnotation(region, e) {
    e.stopPropagation();
    Object.keys(wavesurfer.regions.list).map(function(id) {
            var lregion = wavesurfer.regions.list[id];
            // console.log( region.id + "<>" + lregion.id );
            if ( region.id == lregion.id ) {
                console.log( "update : updating annotation : " + region.id );
                lregion.start = region.start;
                lregion.end = region.end;
                drawAndSaveRegions();
            }
    });
    updateTable();
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
           drawAndSaveRegions();

           console.log("Do delete annotation : " + 4096+counter);
           var jqxhr = $.post( {
             url: '../../delete-annotation.php',
             data: {
               order: 4096+counter,
               source: fullEncode(soundfile)
             },
             dataType: 'application/json'
           }, function() {
             console.log( "deleting annotation succeeded" );
           })
           .fail(function(error) {
             if ( error.status === 200 ) {
               console.log( "deleting annotation success");
             } else {
               console.log( "deleting annotation failed : " + JSON.stringify(error));
             }
           });
        }
    });
}

/**
 * Update times in the table of annotations
 * Recreate all the table from regions
 */
function updateTable() {
    $("#linear-notes").html("");
    let counter=4096;
    Object.keys(wavesurfer.regions.list).map(function(id) {
      var region = wavesurfer.regions.list[id];
      counter++;
      var blank = "<br/><br/><div class='linear-bar' id='bar-"+id+"'>";
      $("#linear-notes").append(blank);
      var range = "<p>"+(counter-4096)+" : "+toHHMMSS(region.start)+" - "+toHHMMSS(region.end)+" (" + Math.round(region.end-region.start) + " s) : </p>";
      $("#bar-"+id).append(range);
      if ( whisper == 1 ) {
        var rwhisper = "<img src='../../img/whisper-logo.png' title='Call Whisper AI' class='whisper-logo' id='w"+id+"' onclick='whisperStart(\""+id+"\")' />";
        $("#bar-"+id).append(rwhisper);
      }
      var rbook = "<i class='fa fa-book fa-1x linear-book' title='Add to Book' id='b"+id+"' onclick='addToBook(\""+id+"\")'></i>";
      $("#bar-"+id).append(rbook);
      var rplay = "<i class='fa fa-play fa-1x linear-play' title='Play this Part' id='r"+id+"' onclick='playRegion(\""+id+"\",\"true\")'></i>";
      $("#bar-"+id).append(rplay);
      var ncontent = "<textarea id='"+id+"' class='note-textarea'>"+region.data.note+"</textarea>";
      $("#linear-notes").append(ncontent);
      $("#"+id).on( 'change', function(evt) {
          var id = $(this).attr('id');
          cregion = wavesurfer.regions.list[id];
          cregion.data.note=evt.target.value;
          drawAndSaveRegions();
          cregion.setLoop(false);
          deleteNote(cregion);
          showNote(cregion);
      });
    });
}

/**
 * Update table with only one note for immediate edit
 */
function updateTableOne(currentId) {
    $("#linear-notes").html("");
    let counter=4096;
    Object.keys(wavesurfer.regions.list).map(function(id) {
      var region = wavesurfer.regions.list[id];
      counter++;
      if ( id == currentId ) {
        var blank = "<br/><br/><div class='linear-bar' id='bar-"+id+"'>";
        $("#linear-notes").append(blank);
        var range = "<p>"+(counter-4096)+" : "+toHHMMSS(region.start)+" - "+toHHMMSS(region.end)+" (" + Math.round(region.end-region.start) + " s) : </p>";
        $("#bar-"+id).append(range);
        if ( whisper == 1 ) {
           var rwhisper = "<img src='../../img/whisper-logo.png' title='Call Whisper AI' class='whisper-logo' id='w"+id+"' onclick='whisperStart(\""+id+"\")' />";
           $("#bar-"+id).append(rwhisper);
        }
        var rbook = "<i class='fa fa-book fa-1x linear-book' title='Add to Book' id='b"+id+"' onclick='addToBook(\""+id+"\")'></i>";
        $("#bar-"+id).append(rbook);
        var rplay = "<i class='fa fa-play fa-1x linear-play' title='Play this Part' id='r"+id+"' onclick='playRegion(\""+id+"\",\"true\")'></i>";
        $("#bar-"+id).append(rplay);
        var ncontent = "<textarea id='"+id+"' class='note-textarea'>"+region.data.note+"</textarea>";
        $("#linear-notes").append(ncontent);
        $("#"+id).on( 'change', function(evt) {
            var id = $(this).attr('id');
            cregion = wavesurfer.regions.list[id];
            cregion.data.note=evt.target.value;
            drawAndSaveRegions();
            cregion.setLoop(false);
            deleteNote(cregion);
            showNote(cregion);
        });
      }
    });
}

/**
 * Save to the server and draw notes
 * Called after every modification
 */
function drawAndSaveRegions() {
    drawRegions();
    saveRegions();
}

/**
 * Draw markers
 */
function drawRegions() {
    var counter=4095;
    // redraw rons and markers
    wavesurfer.clearMarkers();
    wavesurfer.on("marker-click", deleteAnnotation );
    console.log( "draw and store regions" );
    localStorage.regionsl = JSON.stringify(
        Object.keys(wavesurfer.regions.list).map(function(id) {
            var region = wavesurfer.regions.list[id];
            var burl = document.location.href;
            if ( burl.indexOf('?') >= 0 )
            {
               burl = burl.substr( 0, burl.indexOf('?') );
            } 
            counter++;
            wavesurfer.addMarker({
               time : region.start,
               label : region.data.norder-4095,
               color : "#0000ff",
               position : "bottom"
            });
            wavesurfer.addMarker({
               time : region.end,
               label : "",
               color : "#00ff00",
               position : "bottom"
            });
            if ((region.data.norder-4096)>=0)
               wavesurfer.addMarker({
                  time : region.end,
                  label : region.data.norder-4095,
                  color : "#ff0000",
                  position : "top"
               });
            // console.log(region.data.note);
            var leyenda = "";
            if ( typeof region.data.note != "undefined" )
               leyenda = region.data.note.replaceAll("<div>","").replaceAll("</div>","").substring(0,20)+"...";
            return {
                order: counter,
                start: region.start,
                end: region.end,
                baseurl: fullEncode(burl),
                source: fullEncode(soundfile),
                title: fullEncode(document.querySelector('#title').innerHTML.toString().substr(8)),
                url: fullEncode(burl+'?start='+region.start),
                attributes: region.attributes,
                data: region.data.note,
                user: user,
                color: ucolor,
                whispered: ( typeof region.data.whispered != "undefined" ) ? region.data.whispered:0
            };
        })
    );
}

/**
 * Save regions to the server
 */
function saveRegions() {

    anotes = JSON.parse(localStorage.regionsl);
    console.log( "save : " + anotes.length + " linear regions to the server" );
    // console.log( "storage : " +  localStorage.regionsl);

    // don't really know when there are quotes
    if ( strstr(localStorage.regionsl.replaceAll('\"',''), 'whispered:1') ) {
       if ( showFrozenl <= maxFrozenl  ) {
          alertAndScroll("Document is frozen until AI job completes, so your changes will not be saved\n until the automatic transcription completes!");
          showFrozenl++;
       }
       frozenl=true;
       return;
    } else {
       frozenl=false;
    }

    var jqxhr = $.post( {
      url: 'save-annotations.php',
      data: {
	'json': JSON.stringify(anotes.sort(sorta))
      },
      dataType: 'application/json'
    }, function() {
       // console.log( "Saving annotations succeeded" );
    })
    .fail(function(error) {
       if ( error.status === 200 ) {
          // console.log( "saving annotations success");
       } else {
          console.log( "Saving annotations failed : status : " + error.status + " message : " + JSON.stringify(error));
          alertAndScroll(  "Saving annotations failed : status : " + error.status + " message : " + JSON.stringify(error) );
       }
    });
}

/**
 * Extract regions separated by silence.
 */
function extractRegions(peaks, duration) {
    // Silence params
    var minValue = 0.05;
    var minSeconds = 1.00;

    var length = peaks.length;
    var coef = duration / length;
    var minLen = minSeconds / coef;

    console.log( "slice : " + coef );
    console.log( "min length : " + minLen );

    // Gather silence indexes
    var silences = [];
    Array.prototype.forEach.call(peaks, function(val, index) {
        if (Math.abs(val) <= minValue) {
            silences.push(index);
        }
    });

    // Cluster silence values
    var clusters = [];
    silences.forEach(function(val, index) {
        if (clusters.length && val == silences[index - 1] + 1) {
            clusters[clusters.length - 1].push(val);
        } else {
            clusters.push([val]);
        }
    });

    // Filter silence clusters by minimum length
    var fClusters = clusters.filter(function(cluster) {
        return cluster.length >= minLen;
    });

    // Create regions on the edges of silences
    var regions = fClusters.map(function(cluster, index) {
        var next = fClusters[index + 1];
        return {
            start: cluster[cluster.length - 1],
            end: next ? next[0] : length - 1
        };
    });

    // Add an initial region if the audio doesn't start with silence
    var firstCluster = fClusters[0];
    if (firstCluster && firstCluster[0] != 0) {
        regions.unshift({
            start: 0,
            end: firstCluster[firstCluster.length - 1]
        });
    }

    // Filter regions by minimum length
    var fRegions = regions.filter(function(reg) {
        return reg.end - reg.start >= minLen;
    });

    // Return time-based regions
    cRegions =  fRegions.map(function(reg) {
        return {
            start: Math.round(reg.start * coef * 10) / 10,
            end: Math.round(reg.end * coef * 10) / 10
        };
    });

    // regions must be continuous
    rcounter=0;
    maxLen=0;
    maxWhen=0;
    cRegions.forEach(function(creg) {
       if ( rcounter == 0 ) creg.start = 0.0;
       if ( rcounter >= 1 ) {
          cRegions[rcounter-1].end = creg.start-0.1;
          rlen = cRegions[rcounter-1].end - cRegions[rcounter-1].start;
          if ( rlen > maxLen ) { maxLen = rlen; maxWhen = cRegions[rcounter-1].start; }
       }
       rcounter++;
    });

    console.log("region max length : " + maxLen + " at : " + toHHMMSS(maxWhen) );

    return cRegions;
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
 * When a region is cliked, show the note and pass the click to the waveform.
 */
function regionClick(region, e) {
    // play region in a loop, exit the loop when edition is done
    // propagate the click to the sound wave to set play time
    if ( currentRegion != null && region.id != currentRegion )
       deleteNote(region);
    showNote(region);
    playRegion(region.id, true );

    var clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY
    });
    document.querySelector('wave').dispatchEvent(clickEvent);
    currentRegion = region.id;
    setTimeout( "showCurrentNote();", 500 );
}

var sorta = function( notea, noteb ) {
    if ( notea["start"] < noteb["start"] ) {
      return -1;
    } else if ( notea["start"] > noteb["start"] ) {
      return 1;
    } else {
      return 0;
    }
}

var addToBook = function(regid) {
    $("#spinner-modal").css("display", "none");
    $("#modal-book").modal("show");
    addbook.onsubmit = function(e) {
       var regionId = regid;
       var order = -1;
       var counter = 0;
       e.preventDefault();
       Object.keys(wavesurfer.regions.list).map(function(id) {
          ++counter;
          if ( regionId === id ) order=counter+4096;
       });
       console.log( "adding note #" + order );
       var oldbook = $('#oldbook').val();
       var newbook = $('#newbook').val();
       if ( newbook === '' && oldbook === 'none' )
       {
          alertAndScroll( "Please, choose an existing book or create a new one!" );
          return;
       }
       $('#spinner-modal').css('display','block');
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
          $('#spinner-modal').css('display','none');
          $("#modal-book").modal("hide");
       }).fail(function(error) {
          $('#spinner-modal').css('display','none');
          $("#modal-book").modal("hide");
          if ( error.status === 200 ) {
             console.log( "add to book success");
          } else {
             console.log( "adding to book failed : " + JSON.stringify(error));
             alertAndScroll( "Adding to book failed : " + error.statusText );
          }
        });
    };
}

var whisperStart = function(regid) {
    currentRegion = regid;
    parent.window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
    $("#modal-whisper").modal("show");
    $("#spinner-whisper").css("display", "none");
    $("#help-whisper").css("display", "block");

    callAI.onsubmit = function(e) {
        var model = $('#AImodel').find(":selected").val();
        var wlang = $('#AIlang').find(":selected").val();
        var counter = 4095;
        var order = -1;
        e.preventDefault();
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
        console.log("whisper request on : " + soundfile + " : " + order);
        $("#help-whisper").css("display", "none");
        $('#spinner-whisper').css('display','block');
        var jqxhr = $.post( {
           url: '../../submit-whisper.php',
           data: {
             model: fullEncode(model),
             lang: fullEncode(wlang),
             source: fullEncode(soundfile),
             order: order,
             user: user,
             color: ucolor,
             linear: true
           },
           dataType: 'application/json'
        })
        .fail(function(error) {
           $('#spinner-whisper').css('display','none');
           $("#help-whisper").css("display", "block");
           $("#modal-whisper").modal("hide");
           if ( error.status == 200 ) {
              alertAndScroll( "Calling whisper succeeded : Now the document is frozen until the job complete, so go play your favorite game and come back later !");
              $("#frozenl").css("display","block");
              wavesurfer.regions.list[currentRegion].data.whispered = 1;
              frozenl=true;
              console.log( "Whisper job created suuccessfully : frozen : " + frozenl);
           } else {
              alertAndScroll( "Calling whisper failed : " + error.statusText );
              wavesurfer.regions.list[currentRegion].data.whispered = 0;
              frozenl=false;
              console.log( "Calling whisper failed : " + JSON.stringify(error) + " frozen : " + frozenl);
           }
        });
    }
}

var playRegion = function(regid, changeState) {

    var wregion = wavesurfer.regions.list[regid];
    console.log( "play region : " + regid + " current :  " + currentRegion);
    if ( regid == currentRegion && !changeState ) {
       return;
    }

    // desactivate all playing regions
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
       wavesurfer.pause();
       wregion.setLoop(true);
       wregion.playLoop();
       $("#r"+regid).removeClass("fa-play");
       $("#r"+regid).addClass("fa-pause");
       $("#"+regid).css("border-color","#ff0000");
       currentRegion = regid;
    }

}

/**
 * Display annotation of current region
 */
function showCurrentNote() {
   let cregion = wavesurfer.regions.list[currentRegion];
   showNote(cregion);
}

/**
 * Display annotation.
 */
function showNote(region) {
    console.log( "showNote : " + region.id );
    currentRegion = region.id;
    // hide all notes, except this one
    if (!showNote.el) {
        showNote.el = document.querySelector('#subtitle');
    }
    var snote = '';
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
    showNote.el.innerHTML = snote;
}

/**
 * Delete annotation.
 */
function deleteNote(region) {
    // console.log( "delete note");
    // we're out of the region, so playing button must be turned off
    // useless, we will redraw all
    // if ( currentRegion != null ) {
    //   $("#r"+currentRegion).removeClass("fa-pause");
    //   $("#r"+currentRegion).addClass("fa-play");
    //   $("#"+currentRegion).css("border-color","#000000");
    //   currentRegion = null;
    // }
    // show all notes
    console.log( "deleteNote : " + region.id );
    updateTable();
    if (!deleteNote.el) {
       deleteNote.el = document.querySelector('#subtitle');
    }
    deleteNote.el.innerHTML = '';
}


var playAt = function(position) {
    wavesurfer.seekTo( position/wavesurfer.getDuration() );
    wavesurfer.play();
}

var exportSRT = function() {
    anotes = JSON.parse(localStorage.regionsl);
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
       lines.forEach( function( line, index ) {
          if ( strstr( line, ":" ) > 0 ) {
             if ( language === '--' || language === line.substring(0,2) ) {
                subtitles += line.substring(3)+"\n";
             } 
          } else {
             subtitles += line+'\n';
          }
       });
       subtitles += '\n';
    });

    // force subtitles download
    var element = document.createElement('a');
    var rlanguage = language;
    if ( language == '--' ) rlanguage='all';
    var filename = $("#title").html().toString().split('(')[0]+"-"+rlanguage+'.srt';
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(subtitles));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

