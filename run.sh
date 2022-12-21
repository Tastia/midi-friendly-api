echo "... Starting services ..."

echo "Startin redis server..."
redis-server --appendonly yes &

echo "Starting API Worker..."
node dist/src/worker/worker &

echo "Starting API server..."
node dist/src/main
