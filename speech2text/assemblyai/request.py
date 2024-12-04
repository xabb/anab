# `pip3 install assemblyai` (macOS)
# `pip install assemblyai` (Windows)

import assemblyai as aai
import sys

aai.settings.api_key = "afa37f6d4ede46bcbe27926c1d1b7c51"
transcriber = aai.Transcriber()

transcript = transcriber.transcribe(sys.argv[1])

print(transcript.text)
