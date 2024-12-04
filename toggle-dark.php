<?php
include("config.php");
include("functions.php");

if ( !isset( $_POST['_id'] ) || $_POST['_id'] == "" )
{
    echo "The id of the user is unknown.";
    exit();
}

$query = "UPDATE user set dark = IF(dark = 0, 1, 0) WHERE _id=".$_POST['_id'].";";
$updres=db_query($query);
if ( $updres == '1')
{
   echo "OK";
}
else
{
   echo "Database Error";
}

?>
