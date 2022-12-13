#!/bin/sh

sudo docker image prune -f
sudo docker system prune -f
sudo docker-compose up -d --build
sudo nginx -s reload