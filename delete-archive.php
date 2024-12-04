<?php
include("config.php");
include("functions.php");

session_start();

if ( !isset($_SESSION['schtroumpf']) || !isset($_SESSION['papa']) )
{
    print( "ERR: You are not logged in." );
    exit();
}

if ( !isset( $_POST['_id'] ) || $_POST['_id'] == "" )
{
    print "ERR: The id of archive is unknown.";
    exit();
} else {
    $id=$_POST['_id'];
}

$query = "DELETE FROM archive WHERE id=".$id." AND ( creator='".$_SESSION['schtroumpf']."' OR '".$_SESSION['schtroumpf']."'='admin');";
$delres=db_query($query);
if ( $delres > 0 )
{
   // print "OK";
}
else
{
   print "ERR: You are not allowed to delete that archive!";
   exit();
}

$query = "DELETE FROM upload WHERE aid=".$id.";";
$delres=db_query($query);
# either there is or not, result is considered OK
print "OK";

?>
