<?php

include("../../config.php");

  if ( empty($_POST['json']) )
  {
     header('HTTP/1.1 406 Data is Mandatory');	  
     exit(-1);
  }
  $annotations = $_POST['json'];
  // if ( !file_put_contents( "./annotations.json", $annotations ) )
  // {
  //    $error = error_get_last();
  //    header('HTTP/1.1 500 Could not store annotations : '.$error['message']);	  
  //    exit(-1);
  // }

  // saving in the database 
  $link = mysqli_connect($config['dbhost'], $config['dbuser'], $config['dbpass'], $config['dbname']);
  if (!$link) {
     error_log( "Couldn't connect to the database : ".$config['dbname']);
     header('HTTP/1.1 500 Could not connect to the database');
     exit(-1);
  } else {
     $link->query("SET NAMES utf8");
     $link->query("LOCK TABLES `annotation`");
     $annotes = json_decode( $annotations, true );
     // error_log( __FILE__." got : ".count($annotes)." notes" );

     foreach( $annotes as $note )
     {
        $ssql = "SELECT id FROM annotation WHERE source='".addslashes($note["source"])."' AND norder=".$note["norder"];
        error_log($ssql);
        $ressel = $link->query($ssql);
        if ( mysqli_num_rows($ressel) == 0 )
        {
           $isql = "INSERT INTO annotation ( norder, start, end, url, source, data, user, color, whispered ) VALUES ( ".$note["order"].",".$note["start"].",".$note["end"].",'".addslashes($note["url"])."','".addslashes($note["source"])."','".addslashes($note["data"])."','".addslashes($note["user"])."','".addslashes($note["color"])."', ".$note["whispered"]." )";
           // error_log($isql);
           $resins = $link->query($isql);
           if ( $resins !== true ) {
              error_log( "ERROR : ".__FILE__." : could not create annotation : ".$note["order"]." : ".mysqli_error($link) );
              header('HTTP/1.1 500 Error creating annotation');	  
              $link->query("UNLOCK TABLES `annotation`");
              mysqli_close($link);
              exit(-1);
           }
         } else {
           $rowsel = mysqli_fetch_row($ressel);
           $usql = "UPDATE annotation SET norder=".$note["order"].", start=".$note["start"].", end=".$note["end"].", url='".addslashes($note["url"])."', source='".addslashes($note["source"])."', data='".addslashes($note["data"])."', user='".addslashes($note["user"])."', color='".addslashes($note["color"])."', whispered=".$note["whispered"]."  WHERE id=".$rowsel[0];
           // error_log($usql);
           $resupd = $link->query($usql);
           if ( $resupd !== true ) {
              error_log( "ERROR : ".__FILE__." : could not update annotation : ".$note["id"]." : ".mysqli_error($link) );
              header('HTTP/1.1 500 Error updating annotation');	  
              $link->query("UNLOCK TABLES `annotation`");
              mysqli_close($link);
              exit(-1);
           }
         }
     }
  }

  header('HTTP/1.1 200 OK');	  
  $link->query("UNLOCK TABLES `annotations`");
  mysqli_close($link);
  exit(0);

?>
