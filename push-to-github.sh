#!/bin/bash

# Instructions for pushing to GitHub
# Replace YOUR_USERNAME with your actual GitHub username

echo "=== GitHub Repository Setup ==="
echo ""
echo "1. Go to: https://github.com/new"
echo "2. Create a new repository named: rightmove-scraper"
echo "3. Do NOT initialize with README, .gitignore, or license"
echo "4. After creating, run these commands:"
echo ""
echo "git remote add origin https://github.com/YOUR_USERNAME/rightmove-scraper.git"
echo "git push -u origin main"
echo ""
echo "=== Current Git Status ==="
git status
echo ""
echo "=== Recent Commits ==="
git log --oneline -5
