<?php

include("config.php");
include("functions.php");

if ( count($argv) != 7 ) {
   error_log("wrong number of arguments to launch whisper : ".count($argv) );
   error_log("usage : whisper.php <annid> <source> <user> <color> <language> <model>");
   exit(-1);
}

?>
