if [ ! -d dist/emails ]; then
  mkdir -p dist/emails/
fi

cp -r emails/* dist/emails/
cd dist/emails/

# IF NODE_MODULES EXIST, DELETE IT
if [ -d node_modules ]; then
  rm -rf node_modules
fi

npm install
cd ../..
