#!/bin/sh
sudo docker-compose down
sudo docker system prune -a
sudo docker-compose up -d --build
sudo nginx -s reload