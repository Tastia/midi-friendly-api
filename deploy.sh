#!/bin/sh

docker container prune -f
docker volume prune -f
sudo docker-compose up -d --build
sudo nginx -s reload