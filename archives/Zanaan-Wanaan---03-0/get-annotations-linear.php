<?php

include("../../config.php");

// define a JSON Object class
class jsonOBJ {
    private $_arr;
    private $_arrName;

    function __construct($arrName){
        $this->_arrName = $arrName;
        $this->_arr[$this->_arrName] = array();

    }

    function toArray(){return $this->_arr;}
    function toString(){
        $full_json = json_encode(array_values($this->_arr));
        $full_json = str_replace('[[','[',$full_json);
        $full_json = str_replace(']]',']',$full_json);
        return $full_json;
    }

    function push($newObjectElement){
        $this->_arr[$this->_arrName][] = $newObjectElement; // array[$key]=$val;
    }

    function add($key,$val){
        $this->_arr[$this->_arrName][] = array($key=>$val);
    }
}

  if ( empty($_POST['source']) )
  {
     header('HTTP/1.1 406 Source is Mandatory');
     exit(-1);
  }
  $source = $_POST['source'];

  // saving in the database also for setting bookmarks over the collection
  $link = mysqli_connect($config['dbhost'], $config['dbuser'], $config['dbpass'], $config['dbname']);
  if (!$link) {
     error_log( "Couldn't connect to the database : ".$config['dbname']);
     header('HTTP/1.1 500 Could not connect to the database');
     exit(-1);
  } else {
     $link->query("SET NAMES utf8");
     $link->query("LOCK TABLES `annotation`");
     $jsonArr = new jsonOBJ(""); // name of the json array

     $result = $link->query("SELECT * FROM annotation WHERE source='".addslashes($source)."' AND norder>=4096 ORDER BY start");
     $rows = mysqli_num_rows($result);
     if($rows > 0){
        while($rows > 0){
          $rd = mysqli_fetch_assoc($result);
          $jsonArr->push($rd);
          $rows--;
        }
        mysqli_free_result($result);
     }
     if ( !file_put_contents( "./annotations-linear.json", $jsonArr->toString() ) )
     {
        $error = error_get_last();
        header('HTTP/1.1 500 Could not store annotations : '.$error['message']);
        exit(-1);
     }
  }

  $link->query("UNLOCK TABLES `annotations`");
  mysqli_close($link);
  header('Location: ./annotations-linear.json');

?>
