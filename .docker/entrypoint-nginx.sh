#!/bin/bash

vars=$(compgen -A variable)
subst=$(printf '${%s} ' $vars)
envsubst '${NGINX_SERVER_NAME} ${NEST_HOST} ${NEST_PORT} ${NGINX_MAX_BODY}' < /etc/nginx/conf.d/vhost.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'