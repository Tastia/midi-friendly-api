if [ -f .env ]; then
    rm .env
fi

DATABASE_URL=$1
GOOGLE_MAPS_API_KEY=$2
REDIS_HOST=$3
REDIS_PORT=$4
AWS_ACCESS_KEY=$5
AWS_KEY_SECRET=$6

# ECHO ALL ENV VARS ON CONSOLE
echo "DATABASE_URL=$DATABASE_URL"
echo "GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY"
echo "REDIS_HOST=$REDIS_HOST"
echo "REDIS_PORT=$REDIS_PORT"
echo "AWS_ACCESS_KEY=$AWS_ACCESS_KEY"
echo "AWS_KEY_SECRET=$AWS_KEY_SECRET"



touch .env && echo "
DATABASE_URL=$DATABASE_URL

GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY

API_PORT=3333
API_URL=http://localhost

REDIS_PORT=$REDIS_PORT
REDIS_HOST=$REDIS_HOST

JWT_SECRET=1839DJJQZSZ091203
JWT_REFRESH_SECRET=94012DJQKZDQ20123
JWT_TOKEN_EXPIRATION=6h
JWT_REFRESH_TOKEN_EXPIRATION=1d
JWT_INVITATION_EXPIRATION=30d
 
NGINX_SERVER_NAME = api.midifriendly.com
NEST_HOST=localhost
NEST_PORT=3000
NGINX_MAX_BODY=100M

AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_KEY_SECRET

AWS_CLOUDWATCH_API_GROUP_NAME=midi-friendly-api
AWS_CLOUDWATCH_WORKER_GROUP_NAME=midi-friendly-worker
AWS_CLOUDWATCH_REGION=eu-central-1
" >> .env