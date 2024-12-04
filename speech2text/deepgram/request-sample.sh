#!/bin/bash

curl -X POST \
  -H "Authorization: Token 4c7f290a92304a0cec59f2a4666806d0d13bf9bd" \
  -H 'content-type: application/json' \
  -d '{"url": "https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav"}' \
  "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"
