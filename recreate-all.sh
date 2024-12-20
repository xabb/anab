#!/bin/bash

ls -1d archives/* > ardir.txt

while read d
do 
  echo "At first: $d"
  sf=`grep 'var soundfile' "$d/index.php" | cut -f2 -d"'" | grep -v __`
  if [ "X$sf" != "X" ]
  then
    echo ./recreate-archive.sh "$sf"
    ./recreate-archive.sh "$sf"
  fi
done < ardir.txt
