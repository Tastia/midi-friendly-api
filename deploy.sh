#!/bin/sh

sudo docker ps -q
sudo docker builder prune -f
sudo docker container prune -f
sudo docker image prune -f
sudo docker system prune -f
sudo docker-compose up -d --build
sudo nginx -s reload