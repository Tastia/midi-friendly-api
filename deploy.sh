#!/bin/sh

git fetch --all
git pull
git checkout $RELEASE_VERSION
git pull
docker container prune -f
docker volume prune -f
sudo docker-compose up -d --build
sudo nginx -s reload