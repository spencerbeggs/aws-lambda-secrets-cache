#!/bin/bash -e
git reset --soft d95658c0b3d912b71f9174818308e3ba42769562
git stash save "Adds gitflow action" || true
git checkout develop
git push origin -d -f release/2.0.0 || true
git branch -D release/2.0.0 || true
git checkout -b release/2.0.0
git stash pop stash@{0} || true
git add .
git commit -m "Adds gitflow action"
git push origin release/2.0.0