<?php

include("config.php");

if ( empty($_POST['url']) )
{
   header('HTTP/1.1 406 Url is Mandatory');	  
   exit(-1);
}
$url = $_POST['url'];

if ( !isset($_POST['description']) )
{
   header('HTTP/1.1 406 Description is Mandatory');	  
   exit(-1);
}
$description = $_POST['description'];

$link = mysqli_connect($config['dbhost'], $config['dbuser'], $config['dbpass'], $config['dbname']);
if (!$link) {
   error_log( "Couldn't connect to the database : ".$config['dbname']);
   header('HTTP/1.1 500 Could not connect to the database');
   exit(-1);
} else {
   $link->query('SET NAMES utf8');
   // error_log( 'Updating description : '.$url );
   $sqlu = "UPDATE archive SET description='".addslashes($description)."' WHERE url LIKE '%".addslashes($url)."';";
   error_log($sqlu);
   $resultu = $link->query($sqlu);
   if ( $resultu != 1 ) {
      header('HTTP/1.1 500 Error updating description : '.$resultu);	  
      mysqli_close($link);
      exit(-1);
   } else {
      header('HTTP/1.1 200 OK');	  
      mysqli_close($link);
   }
}
exit(0);

?>
