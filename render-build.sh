#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Building Frontend..."
cd src/frontend
npm install
npm run build

echo "Installing Backend dependencies..."
cd ../backend
npm install
