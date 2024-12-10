#!/bin/bash

rm wlangs.txt
rm sclangs.txt

for l in `cat wlangs.js | grep -v let | grep -v '\[' | grep -v '\]' | cut -f2 -d\"`
do 
scode=`grep $l clangs.txt | awk '{print $2}'`
if [ "X$scode" != "X" ]
then
   echo $l >> wlangs.txt
   echo $scode >> sclangs.txt
else
   echo "$l not found!!"
fi
done
