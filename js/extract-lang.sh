#!/bin/bash

for l in `cat wlangs.js | grep -v let | grep -v '\[' | grep -v '\]' | cut -f2 -d\'`
do 
grep $l clangs.txt | awk '{print $2}'
done
