echo "... Starting services ..."
echo "Starting API Worker..."
node dist/src/worker/worker &

echo "Starting API server..."
node dist/src/main
