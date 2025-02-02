#!/bin/bash

#set -x

strstr() {
  [ "${1#*$2*}" = "$1" ] && echo "0"
  echo "1"
}

if [ $# -ne 1 ]; then
   echo "ERR: Usage: $0 <file_url>"
   exit 1
fi

extension="${1##*.}"
echo "extension : $extension"

tmpfile=`tempfile`.$extension
echo -n "Downloading to $tmpfile ..." 1>&2
wget -O $tmpfile --no-check-certificate "$1" 2>/dev/null
if [ $? -ne 0 ]
then
   /bin/rm $tmpfile
   echo '' 1>&2
   echo "ERR: Could not download file : $1"
   exit -1
fi
echo "done." 1>&2

mimetype=`/usr/bin/mimetype --output-format %m $tmpfile`
echo $mimetype 1>&2
echo  ${mimetype#*audio*} 1>&2
if [ ${mimetype#*audio*} = $mimetype ] && [ ${mimetype#*video*} = $mimetype ]
then
  /bin/rm $tmpfile
  echo "ERR: This url is not an media archive, please !!!"
  exit -1
fi

#hour=`/usr/bin/ffprobe $tmpfile 2>&1 | grep -iw -m1 duration | cut -f2 -d':'`
#echo "hour :"$hour 1>&2
#min=`/usr/bin/ffprobe $tmpfile 2>&1 | grep -iw -m1 duration | cut -f3 -d':'`
#echo "min : "$min 1>&2
tsec=`/usr/bin/ffprobe $tmpfile -show_format 2>&1 | sed -n 's/duration=//p' | cut -f1 -d'.'`
echo "tsec : "$tsec 1>&2
#less than 30 seconds cannot be analyzed
if [ $tsec -lt 30 ]
then
  /bin/rm $tmpfile
  echo "ERR: This file is too short to be analyzed !!!"
  exit -1
fi

artist=`/usr/bin/ffprobe $tmpfile 2>&1 | grep -iw -m1 artist | cut -f2 -d':' | xargs`
fartist=`/usr/bin/ffprobe $tmpfile 2>&1 | grep -iw -m1 artist | cut -f2 -d':'`
echo "artist : $artist" 1>&2
date=`/usr/bin/ffprobe $tmpfile 2>&1 | grep -iw -m1 date | cut -f2 -d':' | xargs | sed 's/ //g' - | sed 's/\//-/g' -`
echo "date : $date" 1>&2
title=`/usr/bin/ffprobe $tmpfile 2>&1 | grep -iw -m1 title | cut -f2 -d':' | awk '{print $1 " " $2 " " $3 " " $4 " " $5 " " $6 " " $7}'`
ftitle=`/usr/bin/ffprobe $tmpfile 2>&1 | grep -iw -m1 title | cut -f2-3 -d':'`
echo "title : $title" 1>&2
collection=`/usr/bin/ffprobe $tmpfile 2>&1 | grep -iw -m1 album | grep -v replaygain | cut -f2 -d':' | awk '{print $1 " " $2 " " $3 " " $4 " " $5}'`
echo "collection : $collection" 1>&2

if [ -z "$ftitle" ]
then
   title='Unknown'
   ftitle='Unknown'
fi

if [ -z "$date" ]
then
   date='xx-xx-xx'
   fdate='Unknown'
else
   fdate=$date
fi

if [ -n "$artist" ]
then
   dirname=`echo $artist"-"$title | xargs`
else
   dirname=`echo $1 | rev | cut -d'/' -f 1 | rev | sed 's/.mp3//g' - | sed 's/.ogg//g' - | sed 's/.wav//g' - | sed 's/.webm//g' - | sed 's/.aiff//g' - | sed 's/.mp4//g' - | xargs`
fi

echo "New directory : $dirname"
if [ -d "archives/$dirname" ]
then
   echo "Directory exists!! : $dirname : redirecting..." 1>&2
   echo "archives/$dirname/index.php√$fartist√$title√$collection√$sdate"
   exit 0
   #notok=1
   #num=0
   #while [ $notok -eq 1 ]
   #do
   #  num=$((num+1))
   #  if [ -d $dirname-$num ]
   #  then
   #    notok=1
   #  else
   #    notok=0
   #    dirname=$dirname-$num
   #  fi
   #done
fi

cp -rf archives/template "archives/$dirname"
sed -i "s#__file_url__#$1#g" "archives/$dirname/app.js"
sed -i "s#__file_url__#$1#g" "archives/$dirname/appl.js"
sed -i "s#__file_url__#$1#g" "archives/$dirname/index.php"
chmod -R 777 "archives/$dirname"

echo "archives/$dirname/index.php√$fartist√$ftitle√$collection√$fdate"

/bin/rm $tmpfile
