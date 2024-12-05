<?php
include("config.php");
include("functions.php");

session_start();

if ( !isset($_SESSION['schtroumpf']) || !isset($_SESSION['papa']) || ($_SESSION['schtroumpf'] != $config['owner']) )
{
    echo "ERR: Unauthorized access.";
    exit();
}


if ( !isset( $_POST['_id'] ) || $_POST['_id'] == "" )
{
   echo "ERR: The id of the user is unknown.";
   exit();
} else {
   $id=$_POST['_id'];
}

$query = "DELETE FROM user WHERE _id=".$id.";";
$delres=db_query($query);
if ( $delres > 0 )
{
   echo "OK";
}
else
{
   echo "ERR: Database Error";
}
?>
