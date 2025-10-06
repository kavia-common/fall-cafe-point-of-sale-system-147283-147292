#!/bin/bash
cd /home/kavia/workspace/code-generation/fall-cafe-point-of-sale-system-147283-147292/pos_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

