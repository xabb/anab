#!/bin/bash

for d in `ls -1d archives/*`
do 
  sf=`grep 'var soundfile' $d/index.php | cut -f2 -d"'" | grep -v __`
  if [ "X"$sf != "X" ]
  then
    echo $sf
    ./recreate-archive.sh "$sf"
  fi
done
