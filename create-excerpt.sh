#!/bin/bash

#set -x 

if [ $# -ne 5 ]; then
   echo "ERR: Usage: $0 <start> <duration> <infile> <outfile> <note>"
   exit 1
fi

title=$5

filename=$(basename -- "$3")
extension="${filename##*.}"
echo "extension : $extension"

# generate the excerpt if it doesn't exist
# always regenerate as duration might have changed
# if [ ! -f $4 ]
# then
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

   /usr/bin/ffmpeg -i $tmpfile -f $extension -map_metadata -1 -metadata title="$title" -y -ss $1 -t $2 -vn $4
   if [ $? -ne 0 ]
   then
      /bin/rm $tmpfile
      echo "ERR: Could not create excerpt : $4"
      exit -1
   fi

   /bin/rm $tmpfile

# fi

echo "OK"
