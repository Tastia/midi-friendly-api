#!/bin/sh

sudo docker ps -q
sudo docker stop $(docker ps -q)
sudo docker rm $(docker ps -a -q)
sudo docker images --filter dangling=true -q
sudo docker rmi $(docker images --filter dangling=true -q)
sudo docker images -a -q
sudo docker rmi $(docker images -a -q)
sudo docker container prune -f
sudo docker image prune -f
sudo docker system prune -f
sudo docker-compose up -d --build
sudo nginx -s reload