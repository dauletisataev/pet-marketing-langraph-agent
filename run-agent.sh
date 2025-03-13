#!/bin/bash

# Check if a date argument is provided
if [ $# -eq 0 ]; then
  echo "Using default date (2024-06-17)"
  npx ts-node src/index.ts
else
  # Validate the date format
  if [[ ! $1 =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "Error: Date format should be YYYY-MM-DD"
    exit 1
  fi
  
  echo "Running analysis for date: $1"
  npx ts-node src/index.ts --date="$1"
fi