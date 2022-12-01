#!/bin/sh

git fetch --all
git pull
git checkout $RELEASE_VERSION
git pull
sudo docker-compose up -d --build
sudo nginx -s reload