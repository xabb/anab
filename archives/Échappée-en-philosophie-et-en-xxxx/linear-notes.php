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
        <link rel="stylesheet" href="../../css/app.css" />
        <link rel="stylesheet" href="../../css/alertify.core.css" />
        <link rel="stylesheet" href="../../css/alertify.default.css" />
        <link rel="stylesheet" href="../../css/speech.css" />
        <link rel="stylesheet" href="../../css/spinner.css" />
        <link rel="stylesheet" href="../../css/font-awesome.min.css" />

        <script type="text/javascript" src="../../js/jquery.min.js"></script>
        <script type="text/javascript" src="../../js/bootstrap.min.js"></script> 
        <script type="text/javascript" src="../../js/wavesurfer.min.js"></script>
        <script type="text/javascript" src="../../js/wavesurfer.regions.min.js"></script>
        <script type="text/javascript" src="../../js/wavesurfer.markers.min.js"></script>

        <script type="text/javascript" src="../../js/trivia.js"></script>
        <script type="text/javascript" src="../../js/alertify.min.js"></script>
        <script type="text/javascript" src="../../js/circular-json.js"></script>

        <!-- App -->
        <script type="text/javascript" src="appl.js"></script>
    </head>

    <body>

       <div class="modal fade" id="modal-waitl">
           <div class="modal-bdialog modal-dialog">
             <center><strong><h4><br/><br/>Loading waveform...</h4></strong></center><br/>
               <div class="lds-spinner" id="spinner-global"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
           </div>
        </div>

        <div class="modal fade" id="modal-help" role="dialog">
            <div class="modal-dialog modal-dialog">
                <center><h3>Mini help</h3></center>
                <div class="modal-content modal-content">
                    <p>
                     In this mode, the archive is automatically divided in sections delimited by silence as it is thought to produce transcriptions or translations that you can download with the "Export" button at the bottom of the page.<br /><br />
                     but, these sections, who can seem to be aleatory can still be modified : <br />
                     Kein Pank Auf Der Titanik, you can still :<br /><br />
                     <ul>
                     <li>Create a new caesura by double-clicking on any point, <br />this will break the current section in two parts.<br />
                     <li>Resize a section by dragging one of its border.<br />
                     <li>Move a section with click-and-drag.<br />
                     <li>Remove a section by clicking on the upper-right red marker.
                     </ul><br />
                     When you select a section, a red bordered box appear at the bottom of the screen where you can enter your transcription or translation : <br />
                     If you want to enter a translation, you have to start your line with the abbreviation of the language. For example : "es: Esta conferencia trata de explicar ..." would be considered as Spanish, if nothing is specified, it is considered as a transcription.<br /><br />
                     You can enter multiple translations this way and the user can choose his language using the right side "Language" drop-down menu.<br /><br /> 
                     You can also export the translations to a specific language as a subtitles file (SRT) using the "Export" button at the bottom of the page, after having selected your language before.<br /><br /> 
                     As in notes mode, you can add a region to an audiobook using the book icon next to its box in the list of transcriptions/translations.<br /><br /> 
                     Enjoy and shout "F*** Elon Musk" each time you save your work !!<br /><br /> 
                 </p>
                 </div>
             </div>
        </div>

        <div class="container">
            <div class="header">
                <h3 itemprop="title" id="title"></h3>
                <i id="help" class="fa fa-question-circle fa-2x" aria-hidden="true" ></i>
            </div>

            <div id="demo" class="outer-wave-full">
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
                <div id="subtitle" class="linear-subtitle"></div>
                <div id="subtitle-left" class="linear-subtitle-left"></div>
                <div id="linear-notes" class="linear-outer-notes"></div>
                <div class="export-notes" id="export-subtitles" onclick="exportSRT()">
                  <button class="btn btn-info btn-block btn-export" data-action="export" title="Export annotations to JSON">
                   <i class="glyphicon glyphicon-file"></i>
                   Export
                  </button>
                </div>
                <br/><br/>

                <div class="modal fade" id="modal-book" role="dialog">
                  <div class="modal-dialog modal-bdialog">
                    <center><b>Add to audiobook</b></center><br/>
                    <div class="modal-content modal-bcontent">
                      <center>
                         <div class="lds-spinner" id="spinner-modal"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
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
