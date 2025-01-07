#!/bin/bash

#set -x 

if [ $# -ne 1 ]; then
   echo "ERR: Usage: $0 <book>"
   exit 1
fi

book=$1

#remove old generated book
/bin/rm -rf "audiobooks/$book"

# generate an empty book from an audiobook template
# echo "creating book : $book" >2
mkdir "audiobooks/$book"
cp audiobooks/template/listen.php "audiobooks/$book"
chmod -R 777 "audiobooks/$book"
sed -i "s#__title__#$book#g" "audiobooks/$book/listen.php"

echo "OK"
