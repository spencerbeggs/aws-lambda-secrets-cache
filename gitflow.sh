#!/bin/bash -e
git stash save "Adds gitflow action"
git reset --soft e889075ca2c02ec4a1bee375e2bf3ee59203b3cb
git stash pop stash@{0} || true
git stash save "Adds gitflow action"
git checkout develop
git push origin -d -f release/2.0.0 || true
git branch -D release/2.0.0
git checkout -b release/2.0.0
git stash pop stash@{0} || true
git reset --soft e889075ca2c02ec4a1bee375e2bf3ee59203b3cb
git add .
git commit -m "Adds gitflow action"
git push origin release/2.0.0