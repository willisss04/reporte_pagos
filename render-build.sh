#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Building Frontend..."
cd src/frontend
npm install
npm run build

echo "Installing Backend dependencies..."
cd ../backend
rm -f package-lock.json
npm install
npm rebuild sqlite3 --build-from-source
