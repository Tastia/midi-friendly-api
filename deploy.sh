#!/bin/sh

docker container prune -f
docker volume prune -f
docker-compose down --rmi all
sudo docker-compose up -d --build
sudo nginx -s reload