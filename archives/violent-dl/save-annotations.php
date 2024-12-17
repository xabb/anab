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

     // delete all free annotations
     if ( count($annotes) > 0 ){
        $dsql = "DELETE FROM annotation WHERE source='".$annotes[0]["source"]."' AND norder<4096";
        $delete = $link->query($dsql);
        // error_log('deleted free annotations for '.$annotes[0]["source"]);
     }

     foreach( $annotes as $note )
     {
           $isql = "INSERT INTO annotation ( norder, start, end, url, source, data, user, color, whispered ) VALUES ( ".$note["order"].",".$note["start"].",".$note["end"].",'".addslashes($note["url"])."','".addslashes($note["source"])."','".addslashes($note["data"])."','".addslashes($note["user"])."','".addslashes($note["color"])."', ".$note["whispered"]." )";
           $insert = $link->query($isql);
           if ( $insert !== true ) {
              error_log( "ERROR : ".__FILE__." : could not create annotation : ".$note["order"]." : ".mysqli_error($link) );
              header('HTTP/1.1 500 Error creating annotation');	  
              $link->query("UNLOCK TABLES `annotation`");
              mysqli_close($link);
              exit(-1);
           }
     }
  }

  header('HTTP/1.1 200 OK');	  
  $link->query("UNLOCK TABLES `annotations`");
  mysqli_close($link);
  exit(0);

?>
