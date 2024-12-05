<?php
include("config.php");
include("functions.php");

session_start();

if ( !isset($_POST['user']) || $_POST['user'] == "" )
{   
    echo "The user must be set.";
    exit();
}
else
{
    $user=$_POST['user'];
}
if ( !isset($_POST['password']) || $_POST['password'] == "" )
{
    echo "The password must be set.";
    exit();
}
else
{
    $password=$_POST['password'];
}

$result=db_query( "SELECT user, password, color, dark FROM user" );
while ($row = mysqli_fetch_row($result))
{
  if ( $user == $row[0] &&
       $password == $row[1] )
  {
     $_SESSION['schtroumpf']=$user;
     $_SESSION['papa']=$password;
     $_SESSION['color']=$row[2];
     $_SESSION['whisper']=$row[3];
     print "OK";
     exit;
  }
}

print "ERR: Wrong username or password.";

?>
