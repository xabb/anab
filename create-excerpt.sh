#!/bin/bash

#set -x 

if [ $# -ne 5 ]; then
   echo "ERR: Usage: $0 <start> <duration> <infile> <outfile> <book>"
   exit 1
fi

book=$5

# generate an empty book from an audiobook template
# echo "creating book : $book" >2
if [ ! -f "audiobooks/$book" ]
then
    mkdir "audiobooks/$book"
    cp audiobooks/template/listen.php "audiobooks/$book"
    chmod -R 777 "audiobooks/$book"
    sed -i "s#__title__#$book#g" "audiobooks/$book/listen.php"
fi

filename=$(basename -- "$3")
extension="${filename##*.}"
echo "extension : $extension"

# generate the excerpt if it doesn't exist
if [ ! -f $4 ]
then
   tmpfile=`tempfile`
   tmpfile=$tmpfile"."$extension
   #echo -n "Downloading to $tmpfile..." 1>&2
   wget -O $tmpfile --no-check-certificate "$3" 2>/dev/null
   if [ $? -ne 0 ]
   then
      /bin/rm $tmpfile
      #echo ''
      echo "ERR: Could not download file : $3"
      exit -1
   fi
   #echo "done." 1>&2

   cmd="/usr/bin/ffmpeg -f $extension -y -ss $1 -t $2 -i $tmpfile $4"
   echo $cmd 1>&2
   $cmd
   if [ $? -ne 0 ]
   then
      /bin/rm $tmpfile
      echo "ERR: Could not create excerpt : $4"
      exit -1
   fi

   /bin/rm $tmpfile

fi

echo "OK"
