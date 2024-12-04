#!/bin/bash

curl -X POST "https://api.rev.ai/speechtotext/v1/jobs" \
     -H "Authorization: Bearer 02Z_sS0HYXBCf2fe4JEphM4CnM5jp22drCZEb5rt4BV9IzTx-390XUu_b9sBEO2s0UPdnedJcQsgW4diqQ1RSDI-byFWc" \
     -H "Content-Type: application/json" \
     -d "{\"source_config\": {\"url\": \"$1\"},\"metadata\":\"This is a test\"}"
