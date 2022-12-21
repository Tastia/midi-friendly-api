#!/bin/sh
sudo docker-compose down
sudo docker images -f dangling=true
sudo docker system prune -f
sudo docker container prune -f
sudo docker image prune -a
sudo docker image prune -f
sudo docker builder prune -f
sudo docker system prune -f
sudo docker-compose up -d --build
sudo nginx -s reload