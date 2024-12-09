<?php

include("../../config.php");
include("../../functions.php");

session_start();

if ( !isset($_SESSION['schtroumpf']) || !isset($_SESSION['papa']) )
{
    header( "Location: ../../index.php" );
    exit();
}

header('Content-Security-Policy: frame-ancestors '.$_SERVER['HTTP_HOST']);

// reading user's colors
$waveColor="#000000";
$progressColor="#000000";
$mapWaveColor="#000000";
$mapProgressColor="#000000";

$ressettings = db_query( "SELECT name, value FROM settings" );

while ( $rowsetting = mysqli_fetch_array( $ressettings) )
{
   if ( $rowsetting['name'] == "waveColor" )
      $waveColor = $rowsetting['value'];
   if ( $rowsetting['name'] == "progressColor" )
      $progressColor = $rowsetting['value'];
   if ( $rowsetting['name'] == "mapWaveColor" )
      $mapWaveColor = $rowsetting['value'];
   if ( $rowsetting['name'] == "mapProgressColor" )
      $mapProgressColor = $rowsetting['value'];
}

?>

<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title></title>

        <!-- Bootstrap -->
        <link rel="stylesheet" href="../../css/bootstrap.min.css">
        <link rel="stylesheet" href="../../css/style.css" />
        <link rel="stylesheet" href="../../css/alertify.core.css" />
        <link rel="stylesheet" href="../../css/alertify.default.css" />
        <link rel="stylesheet" href="../../css/app.css" />
        <link rel="stylesheet" href="../../css/speech.css" />
        <link rel="stylesheet" href="../../css/spinner.css" />
        <link rel="stylesheet" href="../../css/font-awesome.min.css" />
        <link rel="stylesheet" href="../../js/trumbowyg/dist/ui/trumbowyg.css">

        <script type="text/javascript" src="../../js/jquery.min.js"></script>
        <script type="text/javascript" src="../../js/bootstrap.min.js"></script> 
        <script type="text/javascript" src="../../js/wavesurfer.min.js"></script>
        <!-- plugins -->
        <script type="text/javascript" src="../../js/wavesurfer.timeline.min.js"></script>
        <script type="text/javascript" src="../../js/wavesurfer.regions.min.js"></script>
        <script type="text/javascript" src="../../js/wavesurfer.minimap.min.js"></script>
        <script type="text/javascript" src="../../js/wavesurfer.markers.min.js"></script>

        <script type="text/javascript" src="../../js/trivia.js"></script>
        <script type="text/javascript" src="../../js/alertify.min.js"></script>
        <script type="text/javascript" src="../../js/circular-json.js"></script>
        <script type="text/javascript" src="../../js/trumbowyg/dist/trumbowyg.min.js"></script>

        <!-- App -->
        <script type="text/javascript" src="../../js/wlangs.js"></script>
        <script type="text/javascript" src="app.js"></script>
    </head>

    <body>

        <div class="modal fade" id="modal-wait">
           <div class="modal-bdialog modal-dialog">
             <center><strong><h4><br/><br/>Loading waveform...</h4></strong></center><br/>
               <div class="lds-spinner" id="spinner-global"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
           </div>
        </div>

        <div class="modal fade" id="modal-whisper">
           <div class="modal-bdialog modal-dialog">
            <br/><center><strong><h4>Calling OpenAI whisper</h4></strong></center>
            <div class="modal-content modal-bcontent">
             <div class='whisper-help'>
             You will call OpenAI whisper for an automatic transcription...<br/>
             Your job will be queued and you can come back a few minutes later<br/> 
             to check the result by reloading this page.<br/>
             </div>
             <form role="form" id="callAI" name="callAI" style="transition: opacity 300ms linear; margin: 10px 0;">
             <center>
             <strong>Language</strong>
             <select id='wlang'>
                <option val='guess'>Guess</option>
             </select>
             <strong>Model</strong>
             <select id='wmodel'>
                <option val='turbo'>Turbo (default)</option>
                <option val='small'>Small</option>
                <option val='large'>Large</option>
             </select><br/><br/>
             <button type="submit" class="btn btn-success btn-block btn-whisper">Call and Pray</button>
             </center>
             </form>
            </div>
           </div>
        </div>

        <div class="modal fade" id="modal-help" role="dialog">
            <div class="modal-dialog modal-hdialog">
                <center><h3>Mini help</h3></center>
                <div class="modal-content modal-hcontent">
                    <p>
                     Select a part of the file to create a region.<br /><br />
                     You can then resize it by moving its border, move it with click-and-drag or removing it by clicking on the upper-right red marker.<br /><br />
                     To create a note, double-click on a region and a pop-up will appear where you can enter a note in rich text format, save it before closing the pop-up.<br /><br />
                     In edition mode, the region will play in a loop, to resume playing the file normally, close the edition pop-up.<br /><br />
                     In edition mode, you can also add the region to an audio book by clicking on the audiobook icon.<br /><br />
                     Enjoy and shout "F*** Elon Musk" each time you save your work !!<br />
                  </p>                              
                 </div>
             </div>
        </div>

        <div class="container">
            <div class="header">
                <h3 itemprop="title" id="title"></h3>
                <i id="help" class="fa fa-question-circle fa-2x" aria-hidden="true" ></i>
            </div>

            <div id="demo" class="outer-wave">
		<div id="subtitle" class="speech">
		    <div id="isubtitle" class="ispeech"></div>
                    <div id="speaker" class="speaker">
                    <div id="ispeaker" class="ispeaker"></div>
                    <i id="sfull" class="fa fa-expand sfull" aria-hidden="true" data-action="pause"></i>
                    </div>
                </div>
		<div class="upper-toolbar">
                    <div id="zlabel" class="zoom-label">Px/s</div>
                    <div id="slabel" class="speed-label">Speed</div>
                </div>
		<div class="lower-toolbar">
		    <div id="ptime" class="play-time"></div>
                    <div id="zvalue" class="zoom-value"></div>
                    <i id="zplus" class="fa fa-plus-square-o fa-2x" width=20px height=20px ></i>  
                    <i id="zminus" class="fa fa-minus-square-o fa-2x" width=20px height=20px ></i>  
                    <div id="svalue" class="speed-value"></div>
                    <i id="splus" class="fa fa-plus-square-o fa-2x" width=20px height=20px ></i>  
                    <i id="sminus" class="fa fa-minus-square-o fa-2x" width=20px height=20px ></i>  
                </div>
                <div id="waveform"></div>
                <div id="wave-timeline"></div>
                <div id="wave-minimap"></div>
                <div class="modal fade" id="modal-form" role="dialog">
                  <div class="modal-dialog">
                    <center><h3>Edit Note</h3>
                    <div id="audiobook-div"><i id="audiobook" class="fa fa-book fa-2x" width="30px" height="30px" /></i></div>
                    <div class="modal-content">
                      <center>
                        <i id="fplay" class="fa fa-play fa-2x" data-action="play-region"></i>  
                      </center>
                      <form role="form" id="edit" name="edit" style="transition: opacity 300ms linear; margin: 30px 0;">
                         <div class="form-group">
                             <label for="note">Note</label>
                             <textarea id="note" class="form-control" name="note"></textarea>
                         </div>
                         <button type="submit" class="btn btn-success btn-block">Save</button>
                         <!--
                         <center><i>or</i></center>
                         <button type="button" class="btn btn-danger btn-block" data-action="delete-region">Delete</button>
                         -->
                      </form>
                    </div>
                  </div>
                </div>

                <div class="modal fade" id="modal-book" role="dialog">
                  <div class="modal-dialog modal-bdialog">
                    <center><h3>Add to audiobook</h3></center><br/>
                    <div class="modal-content modal-bcontent">
                      <center>
                         <div class="lds-spinner" id="spinner-modal" ><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                      </center>
                      <form role="form" id="addbook" name="addbook" style="transition: opacity 300ms linear; margin: 30px 0;">
                         <div class="form-group">
                             <label for="oldbook">Add To Existing Book</label>
                             <select id="oldbook" name="oldbook">
                                <option value="none">None</option>
                             </select>
                         </div>
                         <div class="form-group">
                             <label for="newbook">Create New Book</label>
                             <input class="form-control" id="newbook" name="newbook" />
                         </div>
                         <button type="submit" class="btn btn-success btn-block">Add</button>
                      </form>
                    </div>
                  </div>
                </div>

                <div class="modal fade" id="modal-sfull" role="dialog">
                  <div class="modal-dialog modal-fdialog">
                    <div id="content-fs" class="modal-content modal-fcontent">
                    </div>
                  </div>
                </div>

                <br/><br/>
                <!-- 
                <div class="row" style="width:100%">
                    <center>
                        <i id="backward" class="media-button fa fa-backward fa-2x" data-action="back"></i>
                        <i id="play" class="media-button fa fa-play fa-2x" data-action="play"></i>  
                        <i id="forward" class="media-button fa fa-forward fa-2x" data-action="forth"></i>  
                    </center>
                </div>
                -->
            </div>
            <div id="notes" class="outer-notes">
            </div>
            <div id="linear-notes" class="linear-outer-notes"></div>
            <div class="export-notes">
               <button class="btn btn-info btn-block btn-export" data-action="export" title="Export annotations to SRT">
                   <i class="glyphicon glyphicon-file"></i>
                   Export
                </button>
             </div>
        </div>
        <div id="wavecolor" style="display:none;"><?php echo $waveColor; ?></div>
        <div id="progresscolor" style="display:none;"><?php echo $progressColor; ?></div>
        <div id="mapwavecolor" style="display:none;"><?php echo $mapWaveColor; ?></div>
        <div id="mapprogresscolor" style="display:none;"><?php echo $mapProgressColor; ?></div>
    </body>

<script type="text/javascript" >

let whisper = <?php echo $_SESSION['whisper']; ?>;

function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return 0;
    if (!results[2]) return 0;
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

var sstart = getParameterByName( "start" );
var user = '<?php echo $_SESSION['schtroumpf']; ?>';
var ucolor = '<?php echo $_SESSION['color']; ?>';

</script>

</html>
