#!/bin/bash

#set -x
echo $1

strstr() {
  [ "${1#*$2*}" = "$1" ] && echo "0"
  echo "1"
}

if [ $# -ne 1 ]; then
   echo "ERR: Usage: $0 <file_url>"
   exit 1
fi

tmpfile=`tempfile`
#echo -n "Downloading to $tmpfile ..." 1>&2
wget -O $tmpfile --no-check-certificate "$1" 2>/dev/null
if [ $? -ne 0 ]
then
   /bin/rm $tmpfile
   echo '' 1>&2
   echo "ERR: Could not download file : $1"
   exit -1
fi
#echo "done." 1>&2

dirname=`grep -rl "$1" archives/*/index.php | cut -f2 -d'/'`
dirname=`echo $dirname | cut -f1 -d' '`

echo "Directory : $dirname"
#if [ -d "archives/$dirname" ]
if false
then
   echo "Directory exists!! : $dirname : redirecting..." 1>&2
   echo "archives/$dirname/index.php√$sartist√$title√$collection√$sdate"
   exit 0
   notok=1
   num=0
   while [ $notok -eq 1 ]
   do
     num=$((num+1))
     if [ -d $dirname-$num ]
     then
       notok=1
     else
       notok=0
       dirname=$dirname-$num
     fi
   done
fi

cp -f archives/template/*.js "archives/$dirname"
cp -f archives/template/*.php "archives/$dirname"
sed -i "s#__file_url__#$1#g" "archives/$dirname/app.js"
sed -i "s#__file_url__#$1#g" "archives/$dirname/appl.js"
sed -i "s#__file_url__#$1#g" "archives/$dirname/index.php"
chmod -R 777 "archives/$dirname"

/bin/rm $tmpfile
