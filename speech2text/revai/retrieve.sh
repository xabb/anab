#!/bin/bash

curl -X GET https://api.rev.ai/speechtotext/v1/jobs/$1/transcript \
     -H "Authorization: Bearer 02Z_sS0HYXBCf2fe4JEphM4CnM5jp22drCZEb5rt4BV9IzTx-390XUu_b9sBEO2s0UPdnedJcQsgW4diqQ1RSDI-byFWc" \
     -H "Accept: text/plain"
