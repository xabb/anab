<?php
include("config.php");
include("functions.php");

session_start();

if ( isset( $_GET['search'] ) )
{
   $search = $_GET['search'];
}
else
{
   $search = "";
}

if ( isset( $_GET['start'] ) )
{
   $start = $_GET['start'];
}
else
{
   $start = 0;
}

if ( isset( $_GET['size'] ) )
{
   $size = $_GET['size'];
}
else
{
   $size = 20;
}

if (isset($_SESSION['schtroumpf']) && isset($_SESSION['papa']) )
{
   $resalluser = db_query( "SELECT _id FROM user WHERE LOWER(user) LIKE '%".addslashes($search)."%'" );
   $allcount = mysqli_num_rows( $resalluser );
   $nbpages = intval( $allcount / $size );
   if ( $nbpages*$size < $allcount )
   {
      $nbpages += 1;
   }

   $respageusers = db_query( "SELECT _id, user, nbt, tts, dark FROM user WHERE LOWER(user) LIKE '%".addslashes($search)."%' ORDER BY user LIMIT ".$size." OFFSET ".$start );
}
else
{
   header( "Location: index.php" );
}

?>

<html>
<head>
  <meta charset="UTF-8">
  <style type="text/css">
      .bluebutton { height: 30px; width : 200px; text-align: center;
                   line-height: 30px; vertical-align:middle; opacity : 1;
                   -moz-border-radius: 10px; border-radius: 10px; background : lightblue }
      .databutton { height: 30px; width : 400px; text-align: center;
                   line-height: 30px; vertical-align:middle; opacity : 1;
                   -moz-border-radius: 10px; border-radius: 10px; background : lightgrey }
      .stable { -moz-border-radius: 10px; border-radius: 10px; background : lightgrey }
      .pages { float: left; margin-left: 10%; width: 80%; overflow-wrap: break-word; }
      .search { float: left; margin-left: 20%;}
      .add { float: right; margin-right: 10%; width: 10%; }
      .license { float: left; margin-left: 10%;}
  </style>

  <link href="css/bootstrap.min.css" rel="stylesheet">
  <link href="css/app.css" rel="stylesheet">
  <link href="css/alertify.core.css" rel="stylesheet">
  <link href="css/alertify.default.css" rel="stylesheet">
  <link href="css/all.css" rel="stylesheet">
  <link rel="stylesheet" href="css/font-awesome.min.css" />


  <script src="js/jquery.min.js"></script>
  <script src="js/alertify.min.js"></script>
  <script src="js/sort-table.min.js"></script>

  <script type="text/javascript">

    function toggleDark(id) {
       $.post( "toggle-dark.php", { _id: id }, function(data) {
        if ( data == "OK" )
        {
           document.location = "manage-users.php?start=<?php echo $start; ?>&size=<?php echo $size; ?>&search=<?php echo $search; ?>";
        }
        else
        {
          alertify.alert(data);
        }
       })
       .fail(function() {
          alertify.alert("Toggle AI error");
       });
    }

   function deleteUser(id) {
      alertify.confirm( "Are you sure that you want to delete this user?",
        function (e) {
           if (e) 
           {
              $.post( "delete-user.php", { _id: id }, function(data) {
                if ( data == "OK" )
                {
                  alertify.alert( "The user has been deleted.",
                    function () {
                      document.location = "manage-users.php?start=<?php echo $start; ?>&size=<?php echo $size; ?>&search=<?php echo $search; ?>";
                    }
                  );
                }
                else
                {
                  alertify.alert( data.replace("ERR: ","") );
                }
              })
              .fail(function() {
                 alertify.alert("Couldn't delete user");
              });
           }
        });
     }

  </script>

</head>

<body background="img/background.png">
<a href="./index.php"><i class="fa fa-home fa-2x" aria-hidden="true" style="color: #999; float:left; margin-left:20px; margin-top:28px;" ></i></a>

<center><table width=90%>
<tr>
<td align=center>
<h1><?php echo $config['project-name']; ?></h1>
</td>
</tr>
</table></center>

<center>
<h1>A.N.a.B. Users</h1>
<h3>Count : <?php echo $allcount; ?></h3>
</center>

<?php
print "<form id='search-form' method='get' enctype='multipart/form-data'>";
print "<div class='search'>";
print "Search : ";
print "<input type='text' id='search' name='search' value='".$search."' />";
print "</div>";
print "</form>";
?>
<br/>
<br/>
<center><table width=80% border=0px></table></center>

<div class="pages">
<?php
$page=0;
print "Pages : ";
while ( $page < $nbpages )
{
   print "<a href='manage-users.php?start=".($page*$size)."&search=".$search."&status=".$status."' >".($page+1)."</a>&nbsp;";
   if ( $page%30 == 29 )
   {
      // print "<br/>";
   }
   $page++;
}
?>
</div>
<div>&nbsp;</div>

<center><table class="js-sort-table" width=80% border=2px>

<?php

$count = $start+1;
print "<th align=left>User</th><th align=left>Nb Whispers</th><th align=left>API time</th><th>Use AI</th><th align=center>Delete</th>";
while ( $rowuser = mysqli_fetch_row( $respageusers) )
{
   print "<tr><td align=left>".$rowuser[1]."</td>";
   print "<td align=left>".$rowuser[2]."</td>";
   print "<td align=left>".$rowuser[3]."</td>";
   if ( $rowuser[4] == 0 )
   {
      print "<td align=center><img src='img/ban.png' onclick='javascript:toggleDark(\"".$rowuser[0]."\")' width=20px height=20px /></td>";
   }
   else
   {
      print "<td align=center><img src='img/unban.png' onclick='javascript:toggleDark(\"".$rowuser[0]."\")' width=20px height=20px /></td>";
   }
   print "<td align=center><a href='javascript:deleteUser(".$rowuser[0].");'><img src='img/delete.png' width=20px height=20px /></a></td>";
   print "</tr>";
   $count++;
}

?>

</table></center>

<script type="text/javascript">
$(document).ready( function(){
});
</script>

</body>
</html>
