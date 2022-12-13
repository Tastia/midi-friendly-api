if [ ! -d dist/emails ]; then
  mkdir -p dist/emails/
fi

if [ ! -d emails/node_modules ]; then
  cd emails
  npm install
  cd ..
fi

cp -r emails/* dist/emails/
